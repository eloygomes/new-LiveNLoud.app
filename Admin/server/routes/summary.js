export function registerSummaryRoutes(app, { authenticateJWT, requireAdmin, proxyAdminDataApi }) {
  app.get("/api/summary", authenticateJWT, requireAdmin, proxyAdminDataApi);
}
