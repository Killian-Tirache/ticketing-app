import axios from "axios";

const VITE_API_URL = import.meta.env.VITE_API_URL;

if (!VITE_API_URL) {
  throw new Error("VITE_API_URL is not defined in the environment variables.");
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  },
);

export default api;
