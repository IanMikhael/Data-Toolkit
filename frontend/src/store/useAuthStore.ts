import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  login: (username: string, pass: string) => boolean;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false, // Default false agar user tertahan di halaman login
  login: (username, pass) => {
    if (username === 'admin' && pass === 'Masbang14!') {
      set({ isAuthenticated: true });
      return true;
    }
    return false;
  },
  logout: () => set({ isAuthenticated: false }),
}));
