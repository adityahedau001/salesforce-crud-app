const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  if (res.status === 204) return null;

  const contentType = res.headers.get("content-type") || "";
  const body = contentType.includes("application/json") ? await res.json() : await res.text();

  if (!res.ok) {
    const message = (body && body.error) || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return body;
}

export const api = {
  authStatus: () => request("/auth/status"),
  logout: () => request("/auth/logout", { method: "POST" }),
  loginUrl: () => `${BASE}/auth/login`,

  getFields: (object) => request(`/api/fields/${object}`),
  getRecords: (object, { limit = 20, offset = 0 } = {}) =>
    request(`/api/records/${object}?limit=${limit}&offset=${offset}`),
  createRecord: (object, data) =>
    request(`/api/records/${object}`, { method: "POST", body: JSON.stringify(data) }),
  updateRecord: (object, id, data) =>
    request(`/api/records/${object}/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteRecord: (object, id) => request(`/api/records/${object}/${id}`, { method: "DELETE" }),
};
