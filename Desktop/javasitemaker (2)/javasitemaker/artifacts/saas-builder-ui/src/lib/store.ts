import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  userId: string; email: string; firstName: string; lastName: string;
  token: string; plan: string; role?: string; avatarUrl?: string | null;
}

interface AuthStore {
  user: User | null;
  theme: "dark" | "light";
  setUser: (user: User | null) => void;
  updateUser: (patch: Partial<User>) => void;
  setTheme: (theme: "dark" | "light") => void;
  logout: () => void;
}

function applyTheme(theme: "dark" | "light") {
  document.documentElement.classList.toggle("light-mode", theme === "light");
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      theme: "dark",
      setUser: (user) => {
        if (user) localStorage.setItem("sb_token", user.token);
        else localStorage.removeItem("sb_token");
        set({ user });
      },
      updateUser: (patch) => {
        const cur = get().user;
        if (cur) set({ user: { ...cur, ...patch } });
      },
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
      logout: () => {
        localStorage.removeItem("sb_token");
        set({ user: null });
      },
    }),
    {
      name: "sb-auth",
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme);
      },
    }
  )
);

interface BuilderStore {
  selectedBlockId: string | null;
  previewMode: boolean;
  sidebarOpen: boolean;
  setSelectedBlock: (id: string | null) => void;
  togglePreview: () => void;
  toggleSidebar: () => void;
}

export const useBuilderStore = create<BuilderStore>((set) => ({
  selectedBlockId: null,
  previewMode: false,
  sidebarOpen: true,
  setSelectedBlock: (id) => set({ selectedBlockId: id }),
  togglePreview: () => set((s) => ({ previewMode: !s.previewMode, selectedBlockId: null })),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}));
