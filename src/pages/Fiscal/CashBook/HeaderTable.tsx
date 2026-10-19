// src/pages/Fiscal/CashBook/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de CashBook (LCDPR, execução 045, TASK-LCDPR-FE-02)
// — só os botões (adicionar/filtro), as colunas vivem no `index.tsx`. Mirror
// `Contador/HeaderTable.tsx`.
//
// `SF-003` (link de ajuda externa opcional do legado) — `GAP-LCDPR-FE-03`
// decidiu (Opção A, default) OMITIR: sem link de ajuda nesta listagem.
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
      {can('cash-book_create') && (
        <ButtonAdd onClick={() => navigate('/fiscal/livro-caixa/create')} languageGB={languageGB} />
      )}
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
    </>
  );
}
