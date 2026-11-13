// Import axios, the library used to send HTTP requests to the back-end
import axios from 'axios';

/**
 * Pre-configured axios instance for the Page & Frame API.
 * All requests start with baseURL, so api.post('/auth/login') calls .../api/auth/login.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api', //  Already been configured with the back-end’s address
});

// Before each request: add the token if the user is logged in
api.interceptors.request.use((config) => {
  // Read the token saved at login
  const token = localStorage.getItem('token'); // The `token` constant reads the token stored in the browser’s localStorage at the time of login
  if (token) {
    // Adds the token to the request headers, so requireAuth can check it on the server
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Let the request continue
  return config;
});

// Export the instance so every page uses the same configuration
export default api;