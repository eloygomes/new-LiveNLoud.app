import { apiRequest } from "./client.js";

function withQuery(path, params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, value);
  });
  const suffix = query.toString();
  return suffix ? `${path}?${suffix}` : path;
}

export const getSummary = () => apiRequest("/summary");
export const listUsers = (params = {}) => apiRequest(withQuery("/users", params));
export const listPendingUsers = () => apiRequest("/users/pending");
export const getUserDetails = (userId) => apiRequest(`/users/${userId}`);
export const updateApproval = (userId, payload) =>
  apiRequest(`/users/${userId}/approval`, { method: "PATCH", body: JSON.stringify(payload) });
export const updateUserStatus = (userId, payload) =>
  apiRequest(`/users/${userId}/status`, { method: "PATCH", body: JSON.stringify(payload) });
export const deleteUser = (userId, payload) =>
  apiRequest(`/users/${userId}`, { method: "DELETE", body: JSON.stringify(payload) });
export const listUserSongs = (userId) => apiRequest(`/users/${userId}/songs`);
export const deleteSong = (userId, songKey, payload) =>
  apiRequest(`/users/${userId}/songs/${encodeURIComponent(songKey)}`, { method: "DELETE", body: JSON.stringify(payload) });
export const deleteAllSongs = (userId, payload) =>
  apiRequest(`/users/${userId}/songs`, { method: "DELETE", body: JSON.stringify(payload) });
export const listFriendships = () => apiRequest("/friendships");
export const getUserFriendships = (userId) => apiRequest(`/users/${userId}/friendships`);
export const removeFriendship = (userId, counterpartEmail, payload) =>
  apiRequest(`/users/${userId}/friendships/${encodeURIComponent(counterpartEmail)}`, { method: "DELETE", body: JSON.stringify(payload) });
export const listAdminLogs = () => apiRequest("/logs");
export const listUserLogs = (userId) => apiRequest(`/users/${userId}/logs`);
export const getAnalyticsSummary = (params = {}) => apiRequest(withQuery("/analytics/summary", params));
export const getAnalyticsActivationFunnel = (params = {}) => apiRequest(withQuery("/analytics/activation-funnel", params));
export const getAnalyticsTopSongs = (params = {}) => apiRequest(withQuery("/analytics/top-songs", params));
export const getAnalyticsErrors = (params = {}) => apiRequest(withQuery("/analytics/errors", params));
