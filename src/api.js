const defaultApi = "https://zanexyuu-railway.up.railway.app";

export const API_BASE = String(import.meta.env.VITE_API_BASE_URL || defaultApi).replace(/\/$/, "");
export const apiUrl = path => `${API_BASE}${path}`;

export async function api(path, options = {}) {
  const response = await fetch(apiUrl(path), { credentials: "include", ...options });
  let data = null;
  try { data = await response.json(); } catch { /* binary responses are handled by callers */ }
  if (!response.ok) throw new Error(data?.error || `Request failed (HTTP ${response.status}).`);
  return data;
}

export function authLink(provider) { return apiUrl(`/auth/${provider}`); }
