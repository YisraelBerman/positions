import axios from 'axios';

const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

const instance = axios.create({
  baseURL: `${backendUrl}/api`,
});

export const setAxiosAuth = (keycloak) => {
  instance.interceptors.request.use(
    async (config) => {
      if (keycloak && keycloak.token) {
        try {
          // Always try to refresh the token before making a request
          await keycloak.updateToken(30);
          config.headers.Authorization = `Bearer ${keycloak.token}`;
        } catch (error) {
          console.error('Error refreshing token:', error);
          keycloak.login();
        }
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response && error.response.status === 401) {
        console.warn('Unauthorized request. Refreshing token...');
        try {
          await keycloak.updateToken(30);
          error.config.headers.Authorization = `Bearer ${keycloak.token}`;
          return axios(error.config);
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