import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      clearAuth: () => set({ token: null, user: null }),
    }),
    {
      name: 'saas-auth',
    }
  )
);

interface BuilderState {
  selectedBlockId: string | null;
  isDragging: boolean;
  previewMode: boolean;
  sidebarOpen: boolean;
  setSelectedBlock: (id: string | null) => void;
  setDragging: (v: boolean) => void;
  togglePreview: () => void;
  toggleSidebar: () => void;
}

export const useBuilderStore = create<BuilderState>((set) => ({
  selectedBlockId: null,
  isDragging: false,
  previewMode: false,
  sidebarOpen: true,
  setSelectedBlock: (id) => set({ selectedBlockId: id }),
  setDragging: (v) => set({ isDragging: v }),
  togglePreview: () => set((s) => ({ previewMode: !s.previewMode })),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}));
