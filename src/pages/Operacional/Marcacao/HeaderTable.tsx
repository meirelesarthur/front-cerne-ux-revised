// src/pages/Operacional/Marcacao/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Marcação — mirror `Operacional/Weaning/
// HeaderTable.tsx` + botões de ação em lote de `Operacional/VendaAnimais/
// HeaderTable.tsx` (`batchFinish` → aqui `batchForecast`/`batchDone`).
//
//   - "Adicionar" (`ButtonAdd`, gate `markings_create`) — navega para
//     `/operacional/marcacao/create`.
//   - `ButtonFilter` (badge de contagem dos 9 filtros do drawer).
//   - "Prever em lote"/"Realizar em lote" (TASK-MC-FE-03, alimenta
//     TASK-MC-FE-07) — presentes só quando a listagem expõe seleção
//     múltipla compatível (gate calculado em `index.tsx`, mirror
//     `CLM-BULK-CHECKBOX-GATE`).
//   - Menu `Actions` de arquivo (TASK-MC-FE-08) — "Baixar modelo"/
//     "Exportar"/"Importar", mirror `CadastrosBase/PlanAccount/
//     HeaderTable.tsx` (itens de menu em vez do dropdown Bootstrap do
//     legado, `SCR-BTN-08/09`). Download-template/export sob
//     `markings_view` (a rota já exige essa permissão, mas cada AÇÃO
//     confere `can()` de novo, convenção do projeto); import sob
//     `markings_create` (mesma permissão do endpoint real,
//     `MarkingController::middleware()`).
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Icon } from '@chakra-ui/react';
import { FiDownload, FiFileText, FiUpload } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { Button } from '@/components/Button';
import { ButtonAdd } from '@/components/ButtonAdd';
import { ButtonFilter } from '@/components/ButtonFilter';
import { toaster } from '@/components/ui/toaster';

import { usePermissions } from '@/hooks/usePermissions';

import { downloadBlob } from '@/utils/downloadBlob';

import {
  downloadMarkingsExport,
  downloadMarkingTemplate,
} from '@/services/v2/Marcacao/marking-service';

import type { LanguageDate } from '@/@types/language';
import type { MarkingFilterRequest } from '@/@types/v2/Marcacao/marking';

import { ImportMarkingsModal } from './ImportMarkingsModal';

interface HeaderTableProps {
  onOpenFilter: () => void;
  filtersApplied: number;
  languageGB: LanguageDate;
  /** Filtro atual da grid — encaminhado ao `GET /markings/export`
   *  (`downloadMarkingsExport`, TASK-MC-FE-08). */
  filter?: MarkingFilterRequest;
  /** TASK-MC-FE-03 (fundação da seleção múltipla) — presente só quando a
   *  listagem expõe seleção múltipla (`markings_forecast`). */
  batchForecast?: {
    selectedCount: number;
    onClick: () => void;
  };
  /** Idem, sob `markings_done`. */
  batchDone?: {
    selectedCount: number;
    onClick: () => void;
  };
}

export function HeaderTable({
  onOpenFilter,
  filtersApplied,
  languageGB,
  filter,
  batchForecast,
  batchDone,
}: HeaderTableProps) {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.marcacao.marking;
  const listText = text.list;

  const canViewFile = can('markings_view');
  const canImport = can('markings_create');

  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  async function handleDownloadTemplate() {
    setIsDownloadingTemplate(true);
    try {
      const blob = await downloadMarkingTemplate();
      downloadBlob(blob, 'modelo-marcacoes.xlsx');
    } catch {
      toaster.error({ title: text.singularLabel, description: text.excel.downloadTemplateError });
    } finally {
      setIsDownloadingTemplate(false);
    }
  }

  async function handleExport() {
    setIsExporting(true);
    try {
      const blob = await downloadMarkingsExport(filter);
      downloadBlob(blob, 'marcacoes.xlsx');
    } catch {
      toaster.error({ title: text.singularLabel, description: text.excel.exportError });
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <>
      {batchForecast && (
        <Button
          title={`${listText.actions.forecast}${
            batchForecast.selectedCount > 0 ? ` (${batchForecast.selectedCount})` : ''
          }`}
          variant="outline"
          onClick={batchForecast.onClick}
          disabled={batchForecast.selectedCount === 0}
        />
      )}
      {batchDone && (
        <Button
          title={`${listText.actions.done}${
            batchDone.selectedCount > 0 ? ` (${batchDone.selectedCount})` : ''
          }`}
          variant="outline"
          onClick={batchDone.onClick}
          disabled={batchDone.selectedCount === 0}
        />
      )}
      {canViewFile && (
        <Actions tooltipLabel={languageGB.defaltStrings?.actions}>
          <Actions.Item
            icon={<Icon as={FiDownload} />}
            onClick={handleDownloadTemplate}
            disabled={isDownloadingTemplate}
          >
            {text.excel.downloadTemplate}
          </Actions.Item>
          <Actions.Item
            icon={<Icon as={FiFileText} />}
            onClick={handleExport}
            disabled={isExporting}
          >
            {text.excel.export}
          </Actions.Item>
          {canImport && (
            <Actions.Item icon={<Icon as={FiUpload} />} onClick={() => setIsImportModalOpen(true)}>
              {text.excel.import.menuLabel}
            </Actions.Item>
          )}
        </Actions>
      )}
      {can('markings_create') && (
        <ButtonAdd
          onClick={() => navigate('/operacional/marcacao/create')}
          languageGB={languageGB}
        />
      )}
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />

      <ImportMarkingsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        canDownload={canViewFile}
        canImport={canImport}
      />
    </>
  );
}
