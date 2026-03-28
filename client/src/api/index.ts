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

export default api;
