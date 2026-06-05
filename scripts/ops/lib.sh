#!/usr/bin/env bash

set -euo pipefail

OPS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$OPS_DIR/../.." && pwd)"
CONFIG_FILE="${OPS_CONFIG:-$OPS_DIR/config.sh}"

if [ ! -f "$CONFIG_FILE" ]; then
  echo "Config not found: $CONFIG_FILE"
  echo "Create it with:"
  echo "  cp scripts/ops/config.example.sh scripts/ops/config.sh"
  echo "Then edit the VPS paths and Mongo credentials."
  exit 1
fi

# shellcheck source=/dev/null
source "$CONFIG_FILE"

MONGO_AUTH_DATABASE="${MONGO_AUTH_DATABASE:-admin}"
MONGO_ROOT_ROLES="${MONGO_ROOT_ROLES:-[ { role: \"root\", db: \"admin\" } ]}"

timestamp() {
  date +"%Y%m%d-%H%M%S"
}

env_upper() {
  printf "%s" "$1" | tr '[:lower:]' '[:upper:]'
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1"
    exit 1
  fi
}

require_base_commands() {
  require_command ssh
  require_command scp
  require_command rsync
}

require_env_name() {
  case "$1" in
    live|sustenido) ;;
    *)
      echo "Invalid environment '$1'. Use live or sustenido."
      exit 1
      ;;
  esac
}

config_value() {
  local env="$1"
  local suffix="$2"
  local key
  key="$(env_upper "$env")_$suffix"
  printf "%s" "${!key:-}"
}

remote_app_dir() {
  config_value "$1" "REMOTE_APP_DIR"
}

front_site_dir() {
  config_value "$1" "FRONT_SITE_DIR"
}

front_backup_dir() {
  config_value "$1" "FRONT_BACKUP_DIR"
}

expected_api_base() {
  config_value "$1" "EXPECTED_API_BASE"
}

forbidden_api_base() {
  local value
  value="$(config_value "$1" "FORBIDDEN_API_BASE")"

  if [ -n "$value" ]; then
    printf "%s" "$value"
    return
  fi

  case "$1" in
    live) expected_api_base sustenido ;;
    sustenido) expected_api_base live ;;
    *) printf "" ;;
  esac
}

front_build_script() {
  local value
  value="$(config_value "$1" "FRONT_BUILD_SCRIPT")"

  if [ -n "$value" ]; then
    printf "%s" "$value"
    return
  fi

  case "$1" in
    live) printf "build:live" ;;
    sustenido) printf "build:sustenido" ;;
    *) printf "" ;;
  esac
}

healthcheck_url() {
  config_value "$1" "HEALTHCHECK_URL"
}

ensure_remote_app_dir() {
  local env="$1"
  local dir
  dir="$(remote_app_dir "$env")"

  if [ -z "$dir" ] || [[ "$dir" == *"/liveNloud" && "$dir" == "/home/"* ]]; then
    echo "Check $(env_upper "$env")_REMOTE_APP_DIR in $CONFIG_FILE: $dir"
  fi

  ssh "$REMOTE_SERVER" "test -f '$dir/$COMPOSE_FILE'"
}

confirm_phrase() {
  local expected="$1"
  local prompt="$2"
  local answer

  echo "$prompt"
  echo "Type exactly: $expected"
  read -r answer

  if [ "$answer" != "$expected" ]; then
    echo "Cancelled."
    exit 0
  fi
}

remote_compose() {
  local env="$1"
  shift

  local dir
  dir="$(remote_app_dir "$env")"

  ssh "$REMOTE_SERVER" "cd '$dir' && docker compose -f '$COMPOSE_FILE' $*"
}

remote_git_pull() {
  local env="$1"
  local dir
  dir="$(remote_app_dir "$env")"

  ssh "$REMOTE_SERVER" "cd '$dir' && git pull --ff-only"
}

start_mongo_service() {
  local env="$1"
  local app_dir
  app_dir="$(remote_app_dir "$env")"

  ssh "$REMOTE_SERVER" "cd '$app_dir' && docker compose -f '$COMPOSE_FILE' up -d '$MONGO_SERVICE'"
}

wait_for_mongo_service() {
  local env="$1"
  local app_dir
  app_dir="$(remote_app_dir "$env")"

  ssh "$REMOTE_SERVER" "
    set -e
    cd '$app_dir'
    for i in \$(seq 1 30); do
      if docker compose -f '$COMPOSE_FILE' exec -T '$MONGO_SERVICE' \
        mongosh --quiet --eval 'db.adminCommand({ ping: 1 }).ok' >/dev/null 2>&1; then
        exit 0
      fi
      sleep 2
    done
    echo 'Mongo service did not become reachable in time.'
    exit 1
  "
}

bootstrap_mongo_admin_user() {
  local env="$1"
  local app_dir
  app_dir="$(remote_app_dir "$env")"

  require_env_name "$env"

  echo "Starting Mongo service for $env..."
  start_mongo_service "$env"
  wait_for_mongo_service "$env"

  echo "Checking Mongo admin auth for $env..."
  if ssh "$REMOTE_SERVER" "
    cd '$app_dir' &&
    docker compose -f '$COMPOSE_FILE' exec -T '$MONGO_SERVICE' \
      mongosh --quiet \
        --username '$MONGO_USER' \
        --password '$MONGO_PASS' \
        --authenticationDatabase '$MONGO_AUTH_DATABASE' \
        --eval 'db.adminCommand({ ping: 1 }).ok' >/dev/null
  "; then
    echo "Mongo admin user already works for $env."
    return 0
  fi

  echo "Admin auth failed. Trying to create Mongo admin user for $env..."
  ssh "$REMOTE_SERVER" "
    set -e
    cd '$app_dir'
    docker compose -f '$COMPOSE_FILE' exec -T '$MONGO_SERVICE' \
      mongosh --quiet --eval '
        const admin = db.getSiblingDB(\"$MONGO_AUTH_DATABASE\");
        const user = \"$MONGO_USER\";
        const existing = admin.getUser(user);
        if (existing) {
          print(\"Mongo user already exists but authentication failed. Check MONGO_PASS.\");
          quit(2);
        }
        admin.createUser({
          user,
          pwd: \"$MONGO_PASS\",
          roles: $MONGO_ROOT_ROLES
        });
        print(\"Mongo admin user created.\");
      '
  "

  echo "Rechecking Mongo admin auth for $env..."
  ssh "$REMOTE_SERVER" "
    cd '$app_dir' &&
    docker compose -f '$COMPOSE_FILE' exec -T '$MONGO_SERVICE' \
      mongosh --quiet \
        --username '$MONGO_USER' \
        --password '$MONGO_PASS' \
        --authenticationDatabase '$MONGO_AUTH_DATABASE' \
        --eval 'db.adminCommand({ ping: 1 }).ok' >/dev/null
  "
}

backup_databases() {
  local env="$1"
  local label="$2"
  local stamp="$3"
  local remote_dir
  local local_dir
  local app_dir

  require_env_name "$env"
  app_dir="$(remote_app_dir "$env")"
  remote_dir="$app_dir/backups/mongo/$stamp-$label"
  local_dir="$LOCAL_BACKUP_DIR/$env/$stamp-$label"

  mkdir -p "$local_dir"
  ssh "$REMOTE_SERVER" "mkdir -p '$remote_dir'"

  for db in "${MONGO_DATABASES[@]}"; do
    local archive
    archive="$db.archive.gz"

    echo "Backing up $env database '$db'..."
    ssh "$REMOTE_SERVER" "
      set -e
      cd '$app_dir'
      docker compose -f '$COMPOSE_FILE' exec -T '$MONGO_SERVICE' \
        mongodump \
          --username '$MONGO_USER' \
          --password '$MONGO_PASS' \
          --authenticationDatabase '$MONGO_AUTH_DATABASE' \
          --db '$db' \
          --gzip \
          --archive='/tmp/$archive'
      docker compose -f '$COMPOSE_FILE' cp '$MONGO_SERVICE:/tmp/$archive' '$remote_dir/$archive'
      docker compose -f '$COMPOSE_FILE' exec -T '$MONGO_SERVICE' rm -f '/tmp/$archive'
    "

    scp "$REMOTE_SERVER:$remote_dir/$archive" "$local_dir/$archive"
  done

  echo "Remote backup: $REMOTE_SERVER:$remote_dir"
  echo "Local backup:  $local_dir"
  BACKUP_LOCAL_DIR="$local_dir"
}

restore_databases_from_local_dir() {
  local env="$1"
  local local_dir="$2"
  local stamp="$3"
  local app_dir
  local remote_dir

  require_env_name "$env"
  app_dir="$(remote_app_dir "$env")"
  remote_dir="$app_dir/backups/incoming-restore/$stamp"

  ssh "$REMOTE_SERVER" "mkdir -p '$remote_dir'"

  for db in "${MONGO_DATABASES[@]}"; do
    local archive
    archive="$db.archive.gz"

    if [ ! -f "$local_dir/$archive" ]; then
      echo "Missing local archive: $local_dir/$archive"
      exit 1
    fi

    echo "Restoring $env database '$db'..."
    scp "$local_dir/$archive" "$REMOTE_SERVER:$remote_dir/$archive"
    ssh "$REMOTE_SERVER" "
      set -e
      cd '$app_dir'
      docker compose -f '$COMPOSE_FILE' cp '$remote_dir/$archive' '$MONGO_SERVICE:/tmp/$archive'
      docker compose -f '$COMPOSE_FILE' exec -T '$MONGO_SERVICE' \
        mongorestore \
          --username '$MONGO_USER' \
          --password '$MONGO_PASS' \
          --authenticationDatabase '$MONGO_AUTH_DATABASE' \
          --drop \
          --db '$db' \
          --gzip \
          --archive='/tmp/$archive'
      docker compose -f '$COMPOSE_FILE' exec -T '$MONGO_SERVICE' rm -f '/tmp/$archive'
    "
  done
}

deploy_front_dist() {
  local env="$1"
  local site_dir
  local backup_dir
  local api_base
  local dist_dir

  require_env_name "$env"
  site_dir="$(front_site_dir "$env")"
  backup_dir="$(front_backup_dir "$env")"
  api_base="$(expected_api_base "$env")"
  dist_dir="$REPO_DIR/Front/dist"

  if [ ! -d "$dist_dir" ]; then
    echo "Missing Front/dist. Run the correct npm build first."
    exit 1
  fi

  if ! grep -R "$api_base" "$dist_dir" >/dev/null; then
    echo "Front/dist does not contain expected API base: $api_base"
    echo "Run the correct build before deploying."
    exit 1
  fi

  ssh "$REMOTE_SERVER" "
    set -e
    rm -rf '$backup_dir'/*
    mkdir -p '$backup_dir'
    mkdir -p '$site_dir'
    cp -r '$site_dir'/.' '$backup_dir'/ 2>/dev/null || true
  "

  rsync -avz --delete "$dist_dir/" "$REMOTE_SERVER:$site_dir/"
}

current_git_branch() {
  local branch
  branch="${GIT_BRANCH:-}"

  if [ -z "$branch" ]; then
    branch="$(git -C "$REPO_DIR" branch --show-current)"
  fi

  printf "%s" "$branch"
}

next_front_version_from_remote() {
  local remote="${GIT_REMOTE:-origin}"
  local branch
  local current_version

  branch="$(current_git_branch)"

  echo "Fetching latest version from $remote/$branch..."
  git -C "$REPO_DIR" fetch "$remote" "$branch"

  current_version="$(
    git -C "$REPO_DIR" show "FETCH_HEAD:Front/${SOFT_VERSION_FILE:-src/Pages/Dashboard/SoftVersion.jsx}" \
      | grep -Eo '[0-9]+(\.[0-9]+)+' \
      | head -n 1
  )"

  if [ -z "$current_version" ]; then
    echo "Could not find current version in Front/${SOFT_VERSION_FILE:-src/Pages/Dashboard/SoftVersion.jsx} from FETCH_HEAD."
    exit 1
  fi

  awk -F. '{
    $NF = $NF + 1
    version = $1
    for (i = 2; i <= NF; i++) version = version "." $i
    print version
  }' <<< "$current_version"
}

update_front_version() {
  local next_version="$1"
  local version_file="${SOFT_VERSION_FILE:-src/Pages/Dashboard/SoftVersion.jsx}"
  local version_test_file="${SOFT_VERSION_TEST_FILE:-src/Pages/Dashboard/SoftVersion.test.jsx}"
  local front_dir="$REPO_DIR/Front"

  perl -0pi -e "s/[0-9]+(?:\.[0-9]+)+/$next_version/g" \
    "$front_dir/$version_file" \
    "$front_dir/$version_test_file"
}

validate_front_dist_for_env() {
  local env="$1"
  local dist_dir="$REPO_DIR/Front/dist"
  local expected
  local forbidden

  expected="$(expected_api_base "$env")"
  forbidden="$(forbidden_api_base "$env")"

  if ! grep -R "$expected" "$dist_dir" >/dev/null; then
    echo "Invalid build: expected API base not found in Front/dist: $expected"
    exit 1
  fi

  if [ -n "$forbidden" ] && grep -R "$forbidden" "$dist_dir" >/dev/null; then
    echo "Invalid build: forbidden API base found in Front/dist: $forbidden"
    exit 1
  fi
}

build_and_deploy_front() {
  local env="$1"
  local build_script
  local next_version
  local front_dir="$REPO_DIR/Front"

  require_env_name "$env"
  build_script="$(front_build_script "$env")"

  if [ -z "$build_script" ]; then
    echo "Missing $(env_upper "$env")_FRONT_BUILD_SCRIPT in $CONFIG_FILE"
    exit 1
  fi

  next_version="$(next_front_version_from_remote)"

  echo "Next front version: $next_version"
  echo "Build script:       $build_script"
  echo "Expected API:       $(expected_api_base "$env")"

  update_front_version "$next_version"

  echo "Running front tests..."
  (cd "$front_dir" && npm test)

  echo "Building front..."
  (cd "$front_dir" && npm run "$build_script")

  echo "Validating build..."
  validate_front_dist_for_env "$env"

  deploy_front_dist "$env"
}

run_healthcheck() {
  local env="$1"
  local url
  url="$(healthcheck_url "$env")"

  if [ -z "$url" ]; then
    return 0
  fi

  echo "Healthcheck: $url"
  curl -I "$url" || true
}
