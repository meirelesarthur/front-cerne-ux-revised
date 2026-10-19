// src/pages/Fiscal/AccountingEntry/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Partida Dobrada (AccountingEntry — domínio
// Fiscal, F-128, esteira 97-Esteiras/068, TASK-PD-FE-06). Mirror
// `CadastrosBase/PlanAccount/HeaderTable.tsx`/`Fiscal/Dfe/HeaderTable.tsx`: só
// os botões de ação — as colunas vivem no `index.tsx`. Botão "Novo" (rota
// `/fiscal/partida-dobrada/novo`, wirada em TASK-PD-FE-07) + `ButtonFilter`.
// -----------------------------------------------------------------------------

import { useNavigate } from 'react-router-dom';

import { ButtonAdd } from '@/components/ButtonAdd';
import { ButtonFilter } from '@/components/ButtonFilter';

import { usePermissions } from '@/hooks/usePermissions';

import type { LanguageDate } from '@/@types/language';

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
      {can('double-entry-accountings_create') && (
        <ButtonAdd
          onClick={() => navigate('/fiscal/partida-dobrada/novo')}
          languageGB={languageGB}
        />
      )}
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
    </>
  );
}
