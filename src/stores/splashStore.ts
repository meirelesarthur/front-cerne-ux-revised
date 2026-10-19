// Store global (Zustand) da splash screen oficial pós-login.
//
// Por que fora do Login/AuthContext: o AuthContext tem `if (loading) return
// <Loading/>` — um early-return que substitui a ÁRVORE INTEIRA (inclusive o
// Login) enquanto `signIn()` está em voo. Se a splash morasse dentro do Login,
// ela seria desmontada junto (revelando o formulário de login por baixo) assim
// que a rota trocasse ou o AuthContext entrasse em `loading`. Vivendo aqui,
// renderizada como IRMà do `AuthProvider` em `App.tsx`, a splash cobre a tela
// (position:fixed, z-index 9999) pelo seu tempo fixo (~4.8s) independente do
// que estiver acontecendo por baixo (login desmontando, home montando,
// AuthContext trocando pra `<Loading/>`) — sem brecha de "pisca a tela antiga".
import { create } from "zustand";

interface SplashState {
  visible: boolean;
  show: () => void;
  hide: () => void;
}

export const useSplashStore = create<SplashState>((set) => ({
  visible: false,
  show: () => set({ visible: true }),
  hide: () => set({ visible: false }),
}));
