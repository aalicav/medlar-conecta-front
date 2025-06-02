import { create } from 'zustand';

interface User {
  id: number;
  name: string;
  email: string;
  permissions?: string[];
}

interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
}

export const useAuth = create<AuthState>()((set) => ({
  user: null,
  setUser: (user: User | null) => set(() => ({ user })),
})); 