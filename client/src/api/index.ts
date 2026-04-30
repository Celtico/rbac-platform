import axios from "axios";

const api = axios.create({
  baseURL: "/api",
});

// Afegeix el proxy per a /api si es vol utilitzar en lloc de baseURL hardcoded
// Per ara ho deixem així ja que el backend corre al 3000 i el frontend al 5173
// però les imatges ja usen el proxy configurat a vite.config.ts

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn(
        "401 Unauthorized detected. Clearing token and redirecting..."
      );
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Emitir un evento para que AuthContext se entere
      window.dispatchEvent(new Event("auth-error"));

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Odoo AI Assistant
export const odooChat = (question: string, include_raw_data = false) =>
  api.post<{
    answer: string;
    intent: string;
    confidence: number;
    raw_data?: unknown;
  }>("/odoo/chat", { question, include_raw_data });

export const odooHealth = () =>
  api.get<{ status: string; odoo_connected: boolean; odoo_url: string }>(
    "/odoo/health"
  );

export const odooRawData = (domain: string, limit = 10) =>
  api.get<{ domain: string; data: unknown }>(`/odoo/data/${domain}`, {
    params: { limit },
  });
