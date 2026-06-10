/**
 * HalShield — Auth service.
 * Manages authentication state, token storage, and auth flows.
 */
import { login as loginApi, register as registerApi } from './api';

const TOKEN_KEY = 'halshield_token';
const USER_KEY = 'halshield_user';

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const getUser = () => {
  try {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

export const isAuthenticated = () => !!getToken();

export const saveAuth = (data) => {
  localStorage.setItem(TOKEN_KEY, data.access_token);
  localStorage.setItem(USER_KEY, JSON.stringify({
    id: data.user_id,
    email: data.email,
    name: data.name,
  }));
};

export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const loginUser = async (email, password) => {
  const res = await loginApi({ email, password });
  saveAuth(res.data);
  return res.data;
};

export const registerUser = async (email, password, name) => {
  const res = await registerApi({ email, password, name });
  saveAuth(res.data);
  return res.data;
};

export const logoutUser = () => {
  clearAuth();
  window.location.href = '/login';
};
