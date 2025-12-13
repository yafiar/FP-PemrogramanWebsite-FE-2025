import axios, { type AxiosInstance } from "axios";
import { useAuthStore } from "@/store/useAuthStore";

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    const url = config.url || "";
    const isPublicRequest = [
      "/api/game", // list games (public, optional auth)
      "/api/game/template", // templates are public
      "/play/public", // public play endpoints
      "/leaderboard",
      "/check",
    ].some((p) => url.includes(p));

    if (!isPublicRequest && token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (err) => Promise.reject(err),
);

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // Don't redirect to login for public endpoints
      const publicEndpoints = [
        "/check",
        "/play/public",
        "/leaderboard",
        "/api/game", // game list and user games use optional auth
        "/template", // game templates are public
      ];
      const isPublicEndpoint = publicEndpoints.some((endpoint) =>
        err.config?.url?.includes(endpoint),
      );

      if (!isPublicEndpoint) {
        const { logout } = useAuthStore.getState();
        logout();
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  },
);

export default api;
