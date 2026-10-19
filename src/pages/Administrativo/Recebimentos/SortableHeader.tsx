// src/pages/Administrativo/Recebimentos/SortableHeader.tsx
// -----------------------------------------------------------------------------
// Cabeçalho clicável de coluna ordenável da lista de Recebimentos (execução 081,
// T-081-FE-10; legado LM-02/04/07/11: código, Dt. Pedido, Duração e Dt.
// Atualização). A ordenação é do SERVIDOR (`sort` + `direction`); o componente só
// mostra a seta da coluna ativa e alterna asc/desc. Acessível por teclado
// (botão) e com `aria-sort` descrito no rótulo.
// -----------------------------------------------------------------------------

import { Button, Icon } from '@chakra-ui/react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';

import { nextOrderBy } from './sortOrder';

export interface SortableHeaderProps {
  label: string;
  sortKey: string;
  orderBy?: { name: string; ascOrDesc: string };
  onSort: (next: { name: string; ascOrDesc: string }) => void;
}

export function SortableHeader({ label, sortKey, orderBy, onSort }: SortableHeaderProps) {
  const active = orderBy?.name === sortKey;
  const direction = active ? orderBy?.ascOrDesc : undefined;

  return (
    <Button
      variant="plain"
      size="sm"
      height="auto"
      padding="0"
      fontWeight="inherit"
      color="inherit"
      aria-label={
        active ? `${label} (${direction === 'asc' ? 'ascendente' : 'descendente'})` : label
      }
      onClick={() => onSort(nextOrderBy(orderBy, sortKey))}
      data-testid={`receipts-sort-${sortKey}`}
    >
      {label}
      {active && <Icon as={direction === 'asc' ? FiChevronUp : FiChevronDown} aria-hidden />}
    </Button>
  );
}
