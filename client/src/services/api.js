import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("tg_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally — redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("tg_token");
      localStorage.removeItem("tg_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data)  => api.post("/auth/register", data),
  login:    (data)  => api.post("/auth/login",    data),
  me:       ()      => api.get("/auth/me"),
};

// ── Predict ───────────────────────────────────────────────────────────────────
export const predictAPI = {
  analyze:    (text) => api.post("/predict", { text }),
  modelInfo:  ()     => api.get("/predict/model-info"),
  mlHealth:   ()     => api.get("/predict/health"),
};

// ── History ───────────────────────────────────────────────────────────────────
export const historyAPI = {
  getAll:  (params) => api.get("/history",        { params }),
  getOne:  (id)     => api.get(`/history/${id}`),
  delete:  (id)     => api.delete(`/history/${id}`),
  clear:   ()       => api.delete("/history"),
  stats:   ()       => api.get("/history/stats"),
};

export default api;
