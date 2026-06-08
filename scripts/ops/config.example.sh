#!/usr/bin/env bash

# Copy this file to scripts/ops/config.sh and edit the values for your VPS.
# config.sh is ignored by Git because it may contain secrets.

REMOTE_SERVER="eloy@147.93.70.30"

# Local folder where database backups downloaded from the VPS are kept.
LOCAL_BACKUP_DIR="$HOME/LiveNLoud-db-backups"

# Frontend static site directories on the VPS.
LIVE_FRONT_SITE_DIR="/home/03/site2"
LIVE_FRONT_BACKUP_DIR="/home/03/site2bkp"
LIVE_EXPECTED_API_BASE="https://api.live.eloygomes.com"
LIVE_FORBIDDEN_API_BASE="https://api.sustenido.eloygomes.com"
LIVE_HEALTHCHECK_URL="https://api.live.eloygomes.com"
LIVE_FRONT_BUILD_SCRIPT="build:live"

SUSTENIDO_FRONT_SITE_DIR="/home/sustenido/site"
SUSTENIDO_FRONT_BACKUP_DIR="/home/sustenido/site_bkp"
SUSTENIDO_EXPECTED_API_BASE="https://api.sustenido.eloygomes.com"
SUSTENIDO_FORBIDDEN_API_BASE="https://api.live.eloygomes.com"
SUSTENIDO_HEALTHCHECK_URL="https://api.sustenido.eloygomes.com"
SUSTENIDO_FRONT_BUILD_SCRIPT="build:sustenido"

GIT_REMOTE="origin"
GIT_BRANCH=""
SOFT_VERSION_FILE="src/Pages/Dashboard/SoftVersion.jsx"
SOFT_VERSION_TEST_FILE="src/Pages/Dashboard/SoftVersion.test.jsx"

# Backend project directories on the VPS. These must contain docker-compose.yml.
# Fill these with the real paths used by your live and sustenido deployments.
LIVE_REMOTE_APP_DIR="/home/03/liveNloud"
SUSTENIDO_REMOTE_APP_DIR="/home/sustenido/liveNloud"
ADMIN_REMOTE_DIR="/home/Admin"

COMPOSE_FILE="docker-compose.yml"
MONGO_SERVICE="db"
MONGO_USER="root"
MONGO_PASS="example"
MONGO_AUTH_DATABASE="admin"
MONGO_ROOT_ROLES='[ { role: "root", db: "admin" } ]'

# Databases copied between environments. Keep this aligned with the backend.
MONGO_DATABASES=("liveNloud_" "generalCifras")

# Backend services to recreate during backend deploys.
BACKEND_SERVICES=("node" "python_scraper")
