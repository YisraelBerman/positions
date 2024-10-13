import axios from 'axios';
import Keycloak from 'keycloak-js';

const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

const instance = axios.create({
  baseURL: `${backendUrl}/api`,
});

export const setAxiosAuth = (keycloak) => {
  instance.interceptors.request.use(
    async (config) => {
      if (keycloak && keycloak.token) {
        try {
          const isTokenValid = await keycloak.updateToken(30);
          if (isTokenValid) {
            config.headers.Authorization = `Bearer ${keycloak.token}`;
          } else {
            console.warn('Token refresh failed. Redirecting to login.');
            keycloak.login();
          }
        } catch (error) {
          console.error('Error refreshing token:', error);
          keycloak.login();
        }
      } else {
        console.warn('No token available. Redirecting to login.');
        keycloak.login();
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Add a response interceptor
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response && error.response.status === 401) {
        console.warn('Unauthorized request. Refreshing token...');
        try {
          await keycloak.updateToken(30);
          // Retry the original request with the new token
          const originalRequest = error.config;
          originalRequest.headers.Authorization = `Bearer ${keycloak.token}`;
          return axios(originalRequest);
        } catch (refreshError) {
          console.error('Error refreshing token:', refreshError);
          keycloak.login();
        }
      }
      return Promise.reject(error);
    }
  );
};

export default instance;