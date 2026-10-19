// Base URL comes from the build-time env var. Empty string = same origin.
const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
const TOKEN_KEY = "token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Cannot reach the server. Check your connection or try again later.", 0);
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    // response had no JSON body
  }

  if (!response.ok) {
    throw new ApiError(data?.error || `Request failed (HTTP ${response.status}).`, response.status);
  }
  return data;
}

export const register = (email, password) =>
  request("/api/auth/register", { method: "POST", body: { email, password } });
export const login = (email, password) =>
  request("/api/auth/login", { method: "POST", body: { email, password } });

export const fetchTasks = () => request("/api/tasks");
export const createTask = (title) => request("/api/tasks", { method: "POST", body: { title } });
export const completeTask = (id) =>
  request(`/api/tasks/${id}`, { method: "PATCH", body: { completed: true } });
