/**
 * Authentication utility functions.
 * Manages JWT token storage, decoding, and user session state.
 */

const TOKEN_KEY = 'smartsolar_token';
const USER_KEY = 'smartsolar_user';

/**
 * Store authentication data after login.
 */
export const setAuth = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

/**
 * Get the stored JWT token.
 */
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Get the stored user info.
 */
export const getUser = () => {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
};

/**
 * Get the user's role.
 */
export const getRole = () => {
  const user = getUser();
  return user?.role || '';
};

/**
 * Check if the user is authenticated.
 */
export const isAuthenticated = () => {
  const token = getToken();
  if (!token) return false;

  try {
    // Decode JWT payload to check expiry
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiry = payload.exp * 1000; // Convert to milliseconds
    return Date.now() < expiry;
  } catch {
    return false;
  }
};

/**
 * Clear authentication data (logout).
 */
export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

/**
 * Decode the JWT token payload.
 */
export const decodeToken = () => {
  const token = getToken();
  if (!token) return null;

  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
};
