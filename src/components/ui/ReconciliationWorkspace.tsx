// src/components/ui/ReconciliationWorkspace.tsx
// Casca mestre–detalhe da conciliação (evolução do `ReconciliationWorkspace` do DS, que
// era 2 colunas fixas): resumo no topo; à esquerda abas + barra de ferramentas + lista
// rolável; à direita o painel de detalhe. Em telas estreitas empilha (lista, depois detalhe).
// Teclado: J/K navegam, "/" foca a busca — o workspace não conhece a regra de negócio,
// só avisa (`onNavigate`) e quem usa decide a seleção.

import { useEffect, useRef, type ReactNode } from 'react';

import { Box, Flex } from '@chakra-ui/react';

export interface ReconciliationWorkspaceProps {
  /** Faixa de resumo (`ReconciliationSummary`). */
  summary?: ReactNode;
  /** Abas (`QueueTabs`). */
  tabs: ReactNode;
  /** Barra de ferramentas (busca, seleção…). */
  toolbar?: ReactNode;
  /** Lista de linhas (`ReconciliationRow`) ou estado vazio. */
  list: ReactNode;
  /** Painel de detalhe (`ReconciliationDetailPanel`) ou estado vazio. */
  detail: ReactNode;
  /** J/K → -1/+1. */
  onNavigate?: (delta: -1 | 1) => void;
  /** Ref do campo de busca para o atalho "/". */
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
}

export function ReconciliationWorkspace({
  summary,
  tabs,
  toolbar,
  list,
  detail,
  onNavigate,
  searchInputRef,
}: ReconciliationWorkspaceProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = document.activeElement;
      const typing = el && /INPUT|SELECT|TEXTAREA/.test(el.tagName);
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'j') onNavigate?.(1);
      else if (e.key === 'k') onNavigate?.(-1);
      else if (e.key === '/' && searchInputRef?.current) {
        e.preventDefault();
        searchInputRef.current.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onNavigate, searchInputRef]);

  return (
    <Flex ref={rootRef} direction="column" height="100%" minH={0}>
      {summary}
      <Flex flex="1" minH={0} borderTopWidth="1px" borderColor="border.muted" direction={{ base: 'column', lg: 'row' }}>
        <Flex
          direction="column"
          flex={{ base: 'none', lg: '0 0 44%' }}
          minW={{ lg: '440px' }}
          borderRightWidth={{ base: 0, lg: '1px' }}
          borderColor="border.muted"
          minH={{ base: '320px', lg: 0 }}
        >
          {tabs}
          {toolbar}
          <Box role="listbox" aria-label="Transações" flex="1" minH={0} overflowY="auto" px={2} pb={2}>
            {list}
          </Box>
        </Flex>
        <Box flex={{ base: 'none', lg: '1' }} minW={{ lg: '400px' }} minH={0} overflowY="auto">
          {detail}
        </Box>
      </Flex>
    </Flex>
  );
}

export default ReconciliationWorkspace;
