import axios from '../axiosConfig';

const API_URL = '/login'; // Note: '/api' is already in the baseURL in axiosConfig

const login = async (username, password) => {
  try {
    const response = await axios.post(API_URL, { username, password });
    if (response.data.access_token) {
      const userData = {
        username: response.data.username,
        access_token: response.data.access_token
      };
      localStorage.setItem('user', JSON.stringify(userData));
      return userData;
    }
    throw new Error('Login failed: No access token received');
  } catch (error) {
    console.error('Login error:', error.response ? error.response.data : error.message);
    throw error;
  }
};

const logout = () => {
  localStorage.removeItem('user');
};

const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (e) {
      console.error('Error parsing user data:', e);
      return null;
    }
  }
  return null;
};

const authService = {
  login,
  logout,
  getCurrentUser,
};

export default authService;