import { create } from 'zustand';
import { authApi } from '@/api/auth-api';
import type { SubscriptionData } from '@fullstack-starter/api-schema';

export interface AuthUser {
  id: string;
  email: string;
  display_name?: string;
  subscription?: SubscriptionData;
}

type Status = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthStoreState {
  status: Status;
  user: AuthUser | null;
  lastChecked: number | null;
  bootstrap: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setFrom401: () => void; // triggered by http 401 interceptor
}

let bootstrapPromise: Promise<void> | null = null;

export const useAuthStore = create<AuthStoreState>((set, get) => ({
  status: 'idle',
  user: null,
  lastChecked: null,


  bootstrap: async () => {
    if (get().status !== 'idle' && get().status !== 'loading') return;
    if (bootstrapPromise) return bootstrapPromise;
    set({ status: 'loading' });
    bootstrapPromise = authApi.me()
      .then((me) => {
        if (me.user) {
          set({ user: me.user, status: 'authenticated', lastChecked: Date.now() });
        } else {
          set({ user: null, status: 'unauthenticated', lastChecked: Date.now() });
        }
      })
      .catch(() => {
        set({ user: null, status: 'unauthenticated', lastChecked: Date.now() });
      })
      .finally(() => {
        bootstrapPromise = null;
      });
    return bootstrapPromise;
  },

  login: async (email, password) => {
    const resp = await authApi.login({ email, password });
    set({ user: resp.user, status: 'authenticated', lastChecked: Date.now() });
  },

  logout: async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    set({ user: null, status: 'unauthenticated', lastChecked: Date.now() });
  },

  setFrom401: () => {
    // Only transition if currently authenticated
    if (get().status === 'authenticated') {
      set({ user: null, status: 'unauthenticated', lastChecked: Date.now() });
    }
  },

}));

export function getAuthSnapshot() {
  return useAuthStore.getState();
}
