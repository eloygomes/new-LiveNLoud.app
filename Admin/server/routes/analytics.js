export function registerAnalyticsRoutes(app, { authenticateJWT, requireAdmin, proxyAdminDataApi }) {
  app.get("/api/analytics/summary", authenticateJWT, requireAdmin, proxyAdminDataApi);
  app.get("/api/analytics/activation-funnel", authenticateJWT, requireAdmin, proxyAdminDataApi);
  app.get("/api/analytics/top-songs", authenticateJWT, requireAdmin, proxyAdminDataApi);
  app.get("/api/analytics/errors", authenticateJWT, requireAdmin, proxyAdminDataApi);
}
