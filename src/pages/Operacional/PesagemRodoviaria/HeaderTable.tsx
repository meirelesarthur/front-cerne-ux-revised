// src/pages/Operacional/PesagemRodoviaria/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Pesagem Rodoviária (ModuleWeighing, FE-SCR-01,
// TASK-MWG-FE-02) — mirror `Operacional/Pesagem/HeaderTable.tsx` (feature
// irmã ANIMAL), sem os botões de importação (fora de escopo desta feature).
//
//   - "Nova Pesagem" (`ButtonAdd`, gate `module-weighing_create`, `AC-001`).
//   - "Relatório" (gate `module-weighings_report`) — navega para
//     `/operacional/pesagem-rodoviaria/relatorio` (`TASK-MWG-FE-09`).
//   - `ButtonFilter` (badge de contagem do filtro do drawer).
// -----------------------------------------------------------------------------

import { ElementType } from 'react';

import { FiFileText } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
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
  const text = languageGB.moduleWeighing.moduleWeighing.list;

  const canCreate = can('module-weighing_create');
  const canReport = can('module-weighings_report');

  return (
    <>
      {canReport && (
        <Button
          title={text.reportButton}
          variant="outline"
          icon={FiFileText as ElementType}
          onClick={() => navigate('/operacional/pesagem-rodoviaria/relatorio')}
        />
      )}
      {canCreate && (
        <ButtonAdd
          onClick={() => navigate('/operacional/pesagem-rodoviaria/novo')}
          languageGB={languageGB}
        />
      )}
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
    </>
  );
}

export default HeaderTable;
