import axios from 'axios';

const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

const instance = axios.create({
  baseURL: `${backendUrl}/api`,
});

export const setAxiosAuth = (keycloak) => {
  instance.interceptors.request.use(
    async (config) => {
      if (keycloak?.token) {
        config.headers.Authorization = `Bearer ${keycloak.token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  instance.defaults.headers.common['Authorization'] = `Bearer ${keycloak.token}`;
};

export default instance;