// src/contexts/LeftSidebarContext.tsx
// Contexto do toggle da barra lateral ESQUERDA (sidebar secundária dos módulos /
// sidebar de conversas do Aleex Assistant). Permite que o Header global exiba o
// botão de abrir/fechar a sidebar (fiel ao protótipo aleex-melhorias, print 13-18-49),
// enquanto o estado real de colapso permanece na própria página/módulo.
//
// A página "registra" seu handler de toggle via registerSidebarToggle(fn) ao montar
// e registerSidebarToggle(null) ao desmontar. Só então o Header mostra o botão.
// Diferente do RightPanelContext (que hospeda o estado open/close), aqui guardamos
// apenas o callback — assim a lógica de colapso (auto-collapse, larguras) continua
// na página, sem migração de estado.

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface LeftSidebarContextValue {
  /** Há uma sidebar com toggle registrado na rota atual (controla a exibição do botão no Header) */
  hasSidebar: boolean;
  /** Alterna a sidebar — delega ao handler registrado pela página */
  toggleSidebar: () => void;
  /** Registra/desregistra o handler de toggle da página (null ao desmontar) */
  registerSidebarToggle: (toggle: (() => void) | null) => void;
}

const LeftSidebarContext = createContext<LeftSidebarContextValue | null>(null);

interface LeftSidebarProviderProps {
  children: ReactNode;
}

export function LeftSidebarProvider({ children }: LeftSidebarProviderProps) {
  const [toggleFn, setToggleFn] = useState<(() => void) | null>(null);

  const registerSidebarToggle = useCallback((toggle: (() => void) | null) => {
    // Atualização funcional para armazenar a própria função (não invocá-la)
    setToggleFn(() => toggle);
  }, []);

  const toggleSidebar = useCallback(() => {
    setToggleFn((current) => {
      current?.();
      return current;
    });
  }, []);

  const value = useMemo(
    () => ({
      hasSidebar: !!toggleFn,
      toggleSidebar,
      registerSidebarToggle,
    }),
    [toggleFn, toggleSidebar, registerSidebarToggle]
  );

  return (
    <LeftSidebarContext.Provider value={value}>
      {children}
    </LeftSidebarContext.Provider>
  );
}

export function useLeftSidebar(): LeftSidebarContextValue {
  const ctx = useContext(LeftSidebarContext);
  if (!ctx) {
    throw new Error(
      "useLeftSidebar deve ser usado dentro de LeftSidebarProvider"
    );
  }
  return ctx;
}

export default LeftSidebarContext;
