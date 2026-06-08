const DEFAULT_DATA_API_URL = "http://admin-api:5185";

export async function proxyAdminDataApi(req, res) {
  const baseUrl = process.env.ADMIN_DATA_API_URL || DEFAULT_DATA_API_URL;
  const path = req.originalUrl.replace(/^\/api/, "") || "/";
  const url = new URL(path, baseUrl);

  try {
    const response = await fetch(url);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return res.status(response.status).json({
        message: data.detail || data.message || "Admin data API request failed.",
        detail: data.detail || data.message || "",
      });
    }

    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(502).json({
      message: "Admin data API indisponivel.",
      detail: error.message,
    });
  }
}
