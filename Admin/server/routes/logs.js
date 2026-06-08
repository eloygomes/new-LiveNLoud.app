export function registerLogRoutes(app, { authenticateJWT, requireAdmin, proxyAdminDataApi }) {
  app.get("/api/logs", authenticateJWT, requireAdmin, proxyAdminDataApi);

  app.get("/api/users/:userId/logs", authenticateJWT, requireAdmin, proxyAdminDataApi);
}
