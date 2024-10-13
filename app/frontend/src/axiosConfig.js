import axios from 'axios';

const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

const instance = axios.create({
  baseURL: `${backendUrl}/api`,
});

export const setAxiosAuth = (keycloak) => {
  instance.interceptors.request.use(
    async (config) => {
      if (keycloak && keycloak.token) {
        console.log('Setting Authorization header');
        config.headers.Authorization = `Bearer ${keycloak.token}`;
        console.log('Authorization header set:', config.headers.Authorization);
      } else {
        console.warn('No token available');
      }
      return config;
    },
    (error) => {
      console.error('Error in request interceptor:', error);
      return Promise.reject(error);
    }
  );

  // Ensure the token is set for every request, even if the interceptor fails
  instance.defaults.headers.common['Authorization'] = `Bearer ${keycloak.token}`;
};

export default instance;