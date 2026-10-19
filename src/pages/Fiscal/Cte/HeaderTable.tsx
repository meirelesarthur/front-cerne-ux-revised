// src/pages/Fiscal/Cte/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de CT-e (TASK-CTE-FE-02). Botões: "Novo CT-e"
// (`cte_create`), "Filtrar", "Ajuda" (AC03 — link externo, `VITE_CTE_HELP_URL`
// via env, nunca hardcode).
// -----------------------------------------------------------------------------

import type { ElementType } from 'react';

import { FiHelpCircle, FiPlus } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonFilter } from '@/components/ButtonFilter';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

const CTE_HELP_URL = import.meta.env.VITE_CTE_HELP_URL || 'https://ajuda.gbcerne.com.br/cte';

interface HeaderTableProps {
  onOpenFilter: () => void;
  filtersApplied: number;
}

export function HeaderTable({ onOpenFilter, filtersApplied }: HeaderTableProps) {
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const navigate = useNavigate();
  const text = languageGB.ctes.cte.list;

  return (
    <>
      <Button
        variant="ghost"
        title={text.helpLink}
        icon={FiHelpCircle as ElementType}
        onClick={() => window.open(CTE_HELP_URL, '_blank', 'noopener,noreferrer')}
      />
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
      {can('cte_create') && (
        <Button
          title={text.newButton}
          icon={FiPlus as ElementType}
          onClick={() => navigate('/fiscal/ctes/create')}
        />
      )}
    </>
  );
}

export default HeaderTable;
