import axios from 'axios';
import { API_BASE_URL } from './config';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  response => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.warn("🔄 Token wygasł, próba odnowienia...");

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("Brak refreshToken");

        const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });

        const newToken = refreshResponse.data.token;
        localStorage.setItem("token", newToken);
        error.config.headers.Authorization = `Bearer ${newToken}`;

        return apiClient(error.config);
      } catch (refreshError) {
        console.error("❌ Nie udało się odnowić tokena:", refreshError);
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export const fetchProjects = async () => {
  try {
    const response = await apiClient.get("/projects");
    return response.data;
  } catch (error) {
    console.error("Błąd przy pobieraniu projektów:", error);
    throw error;
  }
};

export const addProject = async (project) => {
  try {
    const response = await apiClient.post("/projects", project);
    return response.data;
  } catch (error) {
    console.error("Błąd przy dodawaniu projektu:", error);
    throw error;
  }
};

export const registerUser = async (userData) => {
  try {
    const response = await apiClient.post("/auth/register", userData, {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error("Błąd przy rejestracji:", error);
    throw error;
  }
};