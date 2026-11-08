// =============================================================
//  stores/ui.store.ts — Estado de la interfaz (menú lateral en pantallas chicas)
// =============================================================

import { create } from 'zustand'

type UIState = {
  menuAbierto: boolean
  abrirMenu: (abierto: boolean) => void
}

export const useUIStore = create<UIState>()((set) => ({
  menuAbierto: false,
  abrirMenu: (menuAbierto) => set({ menuAbierto }),
}))
