import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  theme: "light" | "dark" | "system";
  aiChatOpen: boolean;
  activeSessionId: string | null;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
  setAiChatOpen: (open: boolean) => void;
  toggleAiChat: () => void;
  setActiveSessionId: (id: string | null) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      sidebarCollapsed: false,
      theme: "system",
      aiChatOpen: false,
      activeSessionId: null,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setTheme: (theme) => set({ theme }),
      setAiChatOpen: (open) => set({ aiChatOpen: open }),
      toggleAiChat: () =>
        set((state) => ({ aiChatOpen: !state.aiChatOpen })),
      setActiveSessionId: (id) => set({ activeSessionId: id }),
    }),
    {
      name: "campusone-ui",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
      }),
    }
  )
);