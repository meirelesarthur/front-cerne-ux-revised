// src/pages/BaseRegistrations/DocumentTypes/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da listagem em árvore de Tipo Documento (mirror exato de
// AccountingGroupers/HeaderTable.tsx).
//
// SÓ os botões de ação (adicionar / abrir filtro) — as colunas/linhas vivem
// em index.tsx + DocumentTypeTreeRow.tsx. Sem `useEffect` de "navega ao
// selecionar linha": a árvore não usa TableProvider/useTable (linhas são
// Chakra Table.Row diretas).
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
      {can('document-types_create') && (
        <ButtonAdd
          onClick={() => navigate('/administrativo/tipos-documento/novo')}
          languageGB={languageGB}
        />
      )}
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
    </>
  );
}
