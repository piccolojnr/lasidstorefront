import { apiClient } from './client';
import { cartToken } from '../stores/cart-store';
import { sessionStore, type SessionUser } from '../stores/session-store';
import { setCsrfNames, setCsrfToken } from '../lib/csrf';

export interface SessionResponse {
  authenticated: boolean;
  user: SessionUser | null;
  email_verified: boolean;
}

export interface LoginResponse {
  authenticated: boolean;
  user: SessionUser;
}

export interface CsrfResponse {
  csrf_token: string;
  csrf_cookie: string;
  csrf_header: string;
}

export const authApi = {
  async bootstrapCsrf(): Promise<void> {
    const data = await apiClient.get<CsrfResponse>('/auth/csrf-cookie');
    setCsrfNames(data.csrf_cookie, data.csrf_header);
    setCsrfToken(data.csrf_token);
  },

  async getSession(): Promise<SessionResponse> {
    const data = await apiClient.get<SessionResponse>('/auth/session');
    sessionStore.set({ ...data, loading: false });
    return data;
  },

  requestMagicLink(email: string, redirectTo?: string): Promise<null> {
    return apiClient.post<null>('/auth/magic-link/request', {
      email,
      cart_token: cartToken.get() || undefined,
      redirect_to: redirectTo,
    });
  },

  async loginWithPassword(email: string, password: string): Promise<LoginResponse> {
    const data = await apiClient.post<LoginResponse>('/auth/password/login', {
      email,
      password,
      cart_token: cartToken.get() || undefined,
    });
    sessionStore.set({ authenticated: true, user: data.user, email_verified: true, loading: false });
    return data;
  },

  forgotPassword(email: string): Promise<null> {
    return apiClient.post<null>('/auth/password/forgot', { email });
  },

  resetPassword(payload: {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
  }): Promise<null> {
    return apiClient.post<null>('/auth/password/reset', payload);
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
    sessionStore.set({ authenticated: false, user: null, email_verified: false, loading: false });
  },
};
