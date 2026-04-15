import { apiClient } from './client';
import { sessionStore, type SessionUser } from '../stores/session-store';

export interface ProfileUpdatePayload {
  name?: string | null;
  phone?: string;
  email?: string;
  password?: string;
  password_confirmation?: string;
}

export const profileApi = {
  get(): Promise<SessionUser> {
    return apiClient.get<SessionUser>('/profile');
  },

  async update(payload: ProfileUpdatePayload): Promise<SessionUser> {
    const user = await apiClient.patch<SessionUser>('/profile', payload);
    const current = sessionStore.get();
    sessionStore.set({ ...current, user });
    return user;
  },
};
