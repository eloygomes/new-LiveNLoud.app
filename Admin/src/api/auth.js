import { apiRequest, setTokens } from "./client.js";

export async function login(email, password) {
  const data = await apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setTokens(data);
  return data;
}

export function getMe() {
  return apiRequest("/me");
}
