// src/components/EmbeddedList.tsx
// Contexto "lista embutida": uma tela de LISTAGEM renderizada DENTRO de outra
// (ex.: as visões da tela única de Ordens de compra). Fonte única (Lei 2): quem
// lê o contexto é a casca (`ContainerGrid`, que deixa de desenhar o card) e o
// título (`PageHeader`, que some, porque a tela hospedeira já tem o seu). As
// telas embutidas não mudam uma linha. Fora do provider o valor é `false`, então
// nenhuma outra tela é afetada.

import { createContext, type ReactNode, useContext } from 'react';

const EmbeddedListContext = createContext(false);

export function EmbeddedListProvider({ children }: { children: ReactNode }) {
  return <EmbeddedListContext.Provider value>{children}</EmbeddedListContext.Provider>;
}

export function useIsEmbeddedList(): boolean {
  return useContext(EmbeddedListContext);
}
