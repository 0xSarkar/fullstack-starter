import { create } from 'zustand';
import type { SubscriptionData } from '@fullstack-starter/shared-schemas';

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
  setUser: (user: AuthUser) => void;
  clearUser: () => void;
  setLoading: () => void;
  setFrom401: () => void; // triggered by http 401 interceptor
}

export const useAuthStore = create<AuthStoreState>((set, get) => ({
  status: 'idle',
  user: null,
  lastChecked: null,

  setUser: (user: AuthUser) => {
    set({ user, status: 'authenticated', lastChecked: Date.now() });
  },

  clearUser: () => {
    set({ user: null, status: 'unauthenticated', lastChecked: Date.now() });
  },

  setLoading: () => {
    set({ status: 'loading' });
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
