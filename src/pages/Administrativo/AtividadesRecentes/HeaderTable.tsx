// src/pages/Administrativo/AtividadesRecentes/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Atividades Recentes (UT-000690 / F-349). Tela
// somente leitura: só o botão de filtro (com contador), sem "Adicionar".
// -----------------------------------------------------------------------------

import { ButtonFilter } from '@/components/ButtonFilter';

interface HeaderTableProps {
  onOpenFilter: () => void;
  filtersApplied: number;
}

export function HeaderTable({ onOpenFilter, filtersApplied }: HeaderTableProps) {
  return <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />;
}
