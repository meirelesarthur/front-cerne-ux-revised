// src/components/EmbeddedList.tsx
// Contexto "lista embutida": uma tela de LISTAGEM renderizada DENTRO de outra
// (ex.: as visões da tela única de Ordens de compra). Fonte única (Lei 2): quem
// lê o contexto é a casca (`ContainerGrid`, que deixa de desenhar o card), o
// título (`PageHeader`, que some, porque a tela hospedeira já tem o seu), a
// barra de busca (`ListToolbar`) e o cabeçalho de ações (`HeaderGrid`). Fora do
// provider o valor é `null`, então nenhuma outra tela é afetada.
//
// 25/11 — tudo numa linha só, a da busca:
//   [toolbarStart (ex.: seletor de visão)] [busca] ... [Filtros] [botões da
//   lista, por portal no `actionsTarget`] [toolbarEnd (ex.: Novo, fixo)]
// Lista sem `ListToolbar`: o `HeaderGrid` desenha essa mesma linha sem a busca.
// `fixedFilter`: filtro que a visão impõe à lista (ex.: situação), somado ao
// filtro da pessoa; a lista que o aceita lê com `useEmbeddedList()`.

import { createContext, type ReactNode, useContext, useMemo, useState } from 'react';

interface EmbeddedListValue {
  toolbarStart?: ReactNode;
  toolbarEnd?: ReactNode;
  fixedFilter?: Record<string, unknown>;
  /** Clique na linha da tabela (fora das colunas de ação) abre o registro. */
  onRowOpen?: (row: { uuid?: string }) => void;
  actionsTarget: HTMLElement | null;
  setActionsTarget: (element: HTMLElement | null) => void;
}

const EmbeddedListContext = createContext<EmbeddedListValue | null>(null);

export function EmbeddedListProvider({
  children,
  toolbarStart,
  toolbarEnd,
  fixedFilter,
  onRowOpen,
}: {
  children: ReactNode;
  toolbarStart?: ReactNode;
  toolbarEnd?: ReactNode;
  fixedFilter?: Record<string, unknown>;
  onRowOpen?: (row: { uuid?: string }) => void;
}) {
  const [actionsTarget, setActionsTarget] = useState<HTMLElement | null>(null);
  const value = useMemo(
    () => ({ toolbarStart, toolbarEnd, fixedFilter, onRowOpen, actionsTarget, setActionsTarget }),
    [toolbarStart, toolbarEnd, fixedFilter, onRowOpen, actionsTarget]
  );
  return <EmbeddedListContext.Provider value={value}>{children}</EmbeddedListContext.Provider>;
}

export function useIsEmbeddedList(): boolean {
  return useContext(EmbeddedListContext) !== null;
}

/** Dados da lista embutida; `null` fora da tela hospedeira. */
export function useEmbeddedList(): EmbeddedListValue | null {
  return useContext(EmbeddedListContext);
}
