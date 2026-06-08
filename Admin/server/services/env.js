export function getAccessSecret() {
  return process.env.ACCESS_SECRET || process.env.ADMIN_ACCESS_SECRET;
}

export function getRefreshSecret() {
  return process.env.REFRESH_SECRET || process.env.ADMIN_REFRESH_SECRET;
}

export function requireJwtSecrets() {
  if (!getAccessSecret()) {
    throw new Error("ACCESS_SECRET or ADMIN_ACCESS_SECRET is required");
  }
  if (!getRefreshSecret()) {
    throw new Error("REFRESH_SECRET or ADMIN_REFRESH_SECRET is required");
  }
}
