// src/pages/Operacional/Weaning/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Desmama — mirror
// `Operacional/Nascimentos/HeaderTable.tsx`.
//
//   - "Adicionar" (`ButtonAdd`, gate `weaning_create`) — navega para
//     `/operacional/desmame/novo`.
//   - `ButtonFilter` (badge de contagem do filtro do drawer).
//   - Botão de Relatório (TASK-WN-FE-05) — abre `WeaningReportModal`,
//     gate `weaning-report_view` (`WeaningController::middleware()` real).
// -----------------------------------------------------------------------------

import { ElementType, useState } from 'react';

import { FiFileText } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonAdd } from '@/components/ButtonAdd';
import { ButtonFilter } from '@/components/ButtonFilter';

import { usePermissions } from '@/hooks/usePermissions';

import { LanguageDate } from '@/@types/language';

import { WeaningReportModal } from './WeaningReportModal';

interface HeaderTableProps {
  onOpenFilter: () => void;
  filtersApplied: number;
  languageGB: LanguageDate;
}

export function HeaderTable({ onOpenFilter, filtersApplied, languageGB }: HeaderTableProps) {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.weaning.weaning;

  const canCreate = can('weaning_create');
  const canViewReport = can('weaning-report_view');

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  return (
    <>
      {canViewReport && (
        <Button
          title={text.report.headerButtonLabel}
          variant="outline"
          icon={FiFileText as ElementType}
          onClick={() => setIsReportModalOpen(true)}
        />
      )}
      {canCreate && (
        <ButtonAdd onClick={() => navigate('/operacional/desmame/novo')} languageGB={languageGB} />
      )}
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />

      <WeaningReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        languageGB={languageGB}
      />
    </>
  );
}
