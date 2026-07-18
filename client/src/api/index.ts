import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  // Send the HttpOnly auth cookie alongside requests (dual-mode with the
  // Authorization header).
  withCredentials: true,
});

// Afegeix el proxy per a /api si es vol utilitzar en lloc de baseURL hardcoded
// Per ara ho deixem així ja que el backend corre al 3000 i el frontend al 5173
// però les imatges ja usen el proxy configurat a vite.config.ts

// The JWT travels in the HttpOnly cookie (sent via `withCredentials`), never
// from JS — so there's no Authorization header to inject here anymore.

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn(
        "401 Unauthorized detected. Clearing session and redirecting..."
      );
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

// Auth
export const exchangeOAuthCode = (code: string) =>
  api.post<{ access_token: string; user: unknown }>("/auth/exchange", { code });

export const logout = () => api.post<{ success: boolean }>("/auth/logout");

// Chat Global
export const getChatConversations = () =>
  api.get<ChatConversation[]>("/chat/conversations");

export const createChatConversation = () =>
  api.post<ChatConversation>("/chat/conversations");

export const getChatConversation = (id: number) =>
  api.get<ChatConversation>(`/chat/conversations/${id}`);

export const deleteChatConversation = (id: number) =>
  api.delete<{ success: boolean }>(`/chat/conversations/${id}`);

// Sessions / Dispositius
export const getSessions = () => api.get<UserSessionDTO[]>("/sessions");
export const revokeSession = (id: string) =>
  api.delete<{ success: boolean }>(`/sessions/${id}`);
export const revokeAllOtherSessions = () =>
  api.delete<{ success: boolean }>("/sessions");

// Logs
export const getLogs = (params?: {
  level?: string;
  context?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) =>
  api.get<{ entries: LogEntryDTO[]; total: number; limit: number; offset: number }>(
    "/logs",
    { params }
  );

// Short-lived single-use ticket for the SSE log stream (avoids putting the JWT
// in the EventSource URL).
export const getLogStreamTicket = () =>
  api.get<{ ticket: string; expiresInMs: number }>("/logs/stream-ticket");

// Types
export interface ChatConversation {
  id: number;
  userId: number;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages?: ChatMessage[];
}

export interface ChatMessage {
  id: number;
  conversationId: number;
  role: "user" | "assistant";
  content: string;
  intent?: string;
  confidence?: number;
  createdAt: string;
}

export interface UserSessionDTO {
  id: string;
  userId: number;
  browser: string;
  os: string;
  ipAddress: string;
  isRevoked: boolean;
  isNewDevice: boolean;
  firstSeen: string;
  lastSeen: string;
  isCurrent: boolean;
}

export interface LogEntryDTO {
  id: number;
  level: "log" | "error" | "warn" | "debug" | "verbose";
  message: string;
  context: string | null;
  timestamp: string;
  metadata: Record<string, unknown> | null;
}

// Odoo data (used by Dashboard KPI sections)
export const odooHealth = () =>
  api.get<{ status: string; odoo_connected: boolean; odoo_url: string }>(
    "/odoo/health"
  );

export const odooRawData = (domain: string, limit = 10) =>
  api.get<{ domain: string; data: unknown }>(`/odoo/data/${domain}`, {
    params: { limit },
  });

// Deploy
export const deployHistory = () =>
  api.get<{
    history: {
      id: string;
      timestamp: string;
      commit: string;
      version: string;
      deployedBy: string;
      status: "success" | "pending" | "rollback";
    }[];
  }>("/deploy/history");

export const deployRollback = (commitHash: string) =>
  api.post<{ message: string }>(`/deploy/rollback/${commitHash}`);

export const systemStats = () =>
  api.get<{
    timestamp: number;
    cpu_pct: number;
    memory_used_pct: number;
    memory_used_mb: number;
    memory_total_mb: number;
    disk_used_gb: number;
    disk_total_gb: number;
    disk_used_pct: number;
    uptime_s: number;
    process_memory_mb: number;
    load_avg_1m: number;
    load_avg_5m: number;
    load_avg_15m: number;
    cpu_count: number;
  }>("/system/stats");

export const odooKpis = () =>
  api.get<{
    sales: number | null;
    customers: number | null;
    products: number | null;
    open_opportunities: number | null;
    unpaid_invoices: number | null;
    employees: number | null;
  }>("/odoo/data/kpis");
