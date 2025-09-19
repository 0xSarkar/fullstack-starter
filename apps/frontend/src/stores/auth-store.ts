import { create } from 'zustand';
import { loginApi, meApi, signupApi, googleLoginApi, logoutApi } from '@fullstack-starter/shared-api';
import { useNotesStore } from '@/stores/notes-store';
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
  signup: (email: string, password: string) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
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
    bootstrapPromise = meApi()
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
    const resp = await loginApi({ email, password });
    set({ user: resp.user, status: 'authenticated', lastChecked: Date.now() });
  },

  signup: async (email, password) => {
    const resp = await signupApi({ email, password });
    set({ user: resp.user, status: 'authenticated', lastChecked: Date.now() });
  },

  googleLogin: async (credential: string) => {
    const resp = await googleLoginApi({ credential });
    set({ user: resp.user, status: 'authenticated', lastChecked: Date.now() });
  },

  logout: async () => {
    try { await logoutApi(); } catch { /* ignore */ }
    set({ user: null, status: 'unauthenticated', lastChecked: Date.now() });
    // Clear other sensitive client state
    useNotesStore.getState().reset();
  },

  setFrom401: () => {
    // Only transition if currently authenticated
    if (get().status === 'authenticated') {
      set({ user: null, status: 'unauthenticated', lastChecked: Date.now() });
      useNotesStore.getState().reset();
    }
  },

}));

export function getAuthSnapshot() {
  return useAuthStore.getState();
}
