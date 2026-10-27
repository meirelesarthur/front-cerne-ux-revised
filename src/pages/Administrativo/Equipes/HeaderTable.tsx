// src/pages/Administrativo/Equipes/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Equipes (mesmo padrão de
// Funcoes/HeaderTable.tsx + FuncionarioXEventos/HeaderTable.tsx para o botão
// de relatório):
//   - "Adicionar" (`ButtonAdd`, gate `teams_create`) — navega para
//     `/administrativo/equipes/novo` (TASK-EQ-FE-02).
//   - "Relatório PDF" (`Button` direto, ícone `FiDownload`, gate `teams_view`
//     — GAP-EQ-FE-07, divergência consciente do gate `teams_create` do
//     legado) — download síncrono via blob, `isExportingReport` é 1 dos
//     poucos casos aceitáveis de estado local de loading (mirror
//     `isExportingReport` de FuncionarioXEventos/HeaderTable.tsx). Nunca
//     `window.open` (armadilha #5 da Tarefa — perderia o header `X-Farm-Id`).
//   - `ButtonFilter` (badge de contagem).
// -----------------------------------------------------------------------------

import { ElementType, useState } from 'react';

import { FiDownload } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonAdd } from '@/components/ButtonAdd';
import { toaster } from '@/components/ui/toaster';

import { usePermissions } from '@/hooks/usePermissions';

import { downloadBlob } from '@/utils/downloadBlob';

import { exportTeamsReport } from '@/services/v2/Teams/team-service';

import { LanguageDate } from '@/@types/language';

interface HeaderTableProps {
  onOpenFilter: () => void;
  filtersApplied: number;
  languageGB: LanguageDate;
}

export function HeaderTable({ onOpenFilter, filtersApplied, languageGB }: HeaderTableProps) {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.workTeams.workTeam;

  const [isExportingReport, setIsExportingReport] = useState(false);

  async function handleExportReport() {
    setIsExportingReport(true);
    try {
      const blob = await exportTeamsReport();
      downloadBlob(blob, 'relatorio-equipes.pdf');
      toaster.success({
        title: text.reportButton.label,
        description: text.reportButton.successToast,
      });
    } catch {
      toaster.error({
        title: text.reportButton.exportError.title,
        description: text.reportButton.exportError.description,
      });
    } finally {
      setIsExportingReport(false);
    }
  }

  return (
    <>
      {can('teams_create') && (
        <ButtonAdd
          onClick={() => navigate('/administrativo/equipes/novo')}
          languageGB={languageGB}
        />
      )}
      {can('teams_view') && (
        <Button
          title={text.reportButton.label}
          variant="outline"
          icon={FiDownload as ElementType}
          onClick={handleExportReport}
          loading={isExportingReport}
          disabled={isExportingReport}
        />
      )}
    </>
  );
}
