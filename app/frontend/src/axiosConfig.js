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
        console.log("Axios using updated token:", keycloak.token);
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
};


export default instance;