import { apiClient } from './client';
import { cartToken } from '../stores/cart-store';
import { sessionStore, type SessionUser } from '../stores/session-store';
import { setAuthTokenCookie, clearAuthTokenCookie } from '../lib/auth-cookie';

export interface SessionResponse {
  authenticated: boolean;
  user: SessionUser | null;
  email_verified: boolean;
}

export interface LoginResponse {
  authenticated: boolean;
  token?: string;
  user: SessionUser;
}

export interface MagicLinkVerifyResponse {
  token: string;
  user: SessionUser;
  email_verified: boolean;
  redirect_to: string;
  was_created: boolean;
}

export const authApi = {
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

  verifyMagicLink(token: string): Promise<MagicLinkVerifyResponse> {
    return apiClient.get<MagicLinkVerifyResponse>(`/auth/magic-link/verify?token=${token}`);
  },

  async loginWithPassword(email: string, password: string): Promise<LoginResponse> {
    const data = await apiClient.post<LoginResponse>('/auth/password/login', {
      email,
      password,
      cart_token: cartToken.get() || undefined,
    });
    if (data.token) {
      setAuthTokenCookie(data.token);
    }
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
    clearAuthTokenCookie();
    sessionStore.set({ authenticated: false, user: null, email_verified: false, loading: false });
  },
};
