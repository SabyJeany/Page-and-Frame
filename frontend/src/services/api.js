// Import axios, the library used to send HTTP requests to the back-end
import axios from 'axios';

/**
 * Pre-configured axios instance for the Page & Frame API.
 * All requests start with baseURL, so api.post('/auth/login') calls .../api/auth/login.
 */
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Before each request: add the token if the user is logged in
api.interceptors.request.use((config) => {
  // Read the token saved at login
  const token = localStorage.getItem('token');
  if (token) {
    // Add it to the headers, in the format expected by requireAuth
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Let the request continue
  return config;
});

// Export the instance so every page uses the same configuration
export default api;