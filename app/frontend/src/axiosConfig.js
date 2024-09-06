// axiosConfig.js or similar setup file
import axios from 'axios';

const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'; // Default to localhost if not set
const instance = axios.create({
  baseURL: `${backendUrl}/api`, // Use the environment variable
});

export default instance;
