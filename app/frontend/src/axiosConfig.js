import axios from 'axios';

const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
const instance = axios.create({
  baseURL: `${backendUrl}/api`,
});

export default instance;