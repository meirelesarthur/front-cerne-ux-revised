// src/contexts/RightPanelContext.tsx
// Contexto do painel lateral direito (dock "Assistente Aleex" nos módulos comuns
// e terminal no Aleex Assistant). Permite que o Header global exiba um botão de
// abrir/fechar (fiel ao "Painel de contexto" do protótipo) e que o painel colapse
// completamente (largura 0) quando fechado — sem deixar faixa fantasma.
//
// Um painel se "registra" via registerPanel(true) ao montar e registerPanel(false)
// ao desmontar; só então o Header mostra o toggle. O estado isOpen é compartilhado.

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface RightPanelContextValue {
  /** Há um painel direito disponível na rota atual (controla a exibição do toggle no Header) */
  hasPanel: boolean;
  /** Painel aberto/visível */
  isOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
  /** Registra/desregistra a existência de um painel na rota atual */
  registerPanel: (exists: boolean) => void;
}

const RightPanelContext = createContext<RightPanelContextValue | null>(null);

interface RightPanelProviderProps {
  children: ReactNode;
}

export function RightPanelProvider({ children }: RightPanelProviderProps) {
  const [hasPanel, setHasPanel] = useState(false);
  // Fechado por padrão. Cada consumidor define seu default no mount:
  //  - Aleex Assistant (terminal): permanece fechado, abre só ao selecionar pentest.
  //  - Dock readonly (módulos comuns): chama openPanel() no mount (aberto por padrão).
  const [isOpen, setIsOpen] = useState(false);

  const openPanel = useCallback(() => setIsOpen(true), []);
  const closePanel = useCallback(() => setIsOpen(false), []);
  const togglePanel = useCallback(() => setIsOpen((v) => !v), []);
  const registerPanel = useCallback((exists: boolean) => setHasPanel(exists), []);

  const value = useMemo(
    () => ({
      hasPanel,
      isOpen,
      openPanel,
      closePanel,
      togglePanel,
      registerPanel,
    }),
    [hasPanel, isOpen, openPanel, closePanel, togglePanel, registerPanel]
  );

  return (
    <RightPanelContext.Provider value={value}>
      {children}
    </RightPanelContext.Provider>
  );
}

export function useRightPanel(): RightPanelContextValue {
  const ctx = useContext(RightPanelContext);
  if (!ctx) {
    throw new Error("useRightPanel deve ser usado dentro de RightPanelProvider");
  }
  return ctx;
}

export default RightPanelContext;
