// src/pages/BaseRegistrations/AccountingGroupers/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da listagem em árvore de Agrupadores Contábeis (mesmo
// padrão de Agrupadores/HeaderTable.tsx, estoque).
//
// SÓ os botões de ação (adicionar / abrir filtro) — as colunas/linhas vivem
// em index.tsx + AccountingGrouperTreeRow.tsx. Sem `useEffect` de "navega ao
// selecionar linha": a árvore não usa TableProvider/useTable (linhas são
// Chakra Table.Row diretas), então não há `table.getSelectedRowModel()` para
// observar aqui.
// -----------------------------------------------------------------------------

import { useNavigate } from 'react-router-dom';

import { ButtonAdd } from '@/components/ButtonAdd';
import { ButtonFilter } from '@/components/ButtonFilter';

import { usePermissions } from '@/hooks/usePermissions';

import { LanguageDate } from '@/@types/language';

interface HeaderTableProps {
  onOpenFilter: () => void;
  filtersApplied: number;
  languageGB: LanguageDate;
}

export function HeaderTable({ onOpenFilter, filtersApplied, languageGB }: HeaderTableProps) {
  const navigate = useNavigate();
  const { can } = usePermissions();

  return (
    <>
      {can('accounting_groupers_create') && (
        <ButtonAdd
          onClick={() => navigate('/cadastros-base/agrupadores-contabeis/novo')}
          languageGB={languageGB}
        />
      )}
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
    </>
  );
}
