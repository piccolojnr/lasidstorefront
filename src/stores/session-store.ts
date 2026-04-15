import { atom } from 'nanostores';

export interface SessionUser {
  id: number;
  name: string | null;
  email: string;
  phone: string | null;
  status: string;
  email_verified_at: string | null;
  profile_completion_required: boolean;
}

export interface SessionState {
  authenticated: boolean;
  user: SessionUser | null;
  email_verified: boolean;
  /** true while the session check is in-flight */
  loading: boolean;
}

export const sessionStore = atom<SessionState>({
  authenticated: false,
  user: null,
  email_verified: false,
  loading: true,
});
