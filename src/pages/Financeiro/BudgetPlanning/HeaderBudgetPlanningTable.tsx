// src/pages/Financeiro/BudgetPlanning/HeaderBudgetPlanningTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Prev. Orçamentária (BudgetPlanning — F-106,
// esteira 97-Esteiras/067, TASK-PO-FE-06/FE-09) — mirror
// `Financeiro/Congelamentos/HeaderTable.tsx`. Botão "Novo" (gated
// `budget-plannings_create`) + botão "Importar" (gated `budget-plannings_create`,
// mirror `Financeiro/ImportacaoMovBancarios/HeaderTable.tsx` — 1 ação de
// escrita a mais não justifica um menu `Actions` dedicado) +
// `GridSettingsFloatingPanel` + `ButtonFilter`.
//
// Navega para `/financeiro/previsao/create` (rota REAL, `CreateOrUpdate
// BudgetPlanning`, TASK-PO-FE-07 — GAP-PO-08 resolvido, `src/router/
// index.tsx`). "Importar" abre o `ImportBudgetPlanningModal` DEDICADO
// (TASK-PO-FE-09) — NÃO reaproveita `ImportExportActions` (contrato de
// resposta diverge, ver cabeçalho do modal).
//
// Botão "Relatório Previsto×Realizado" (TASK-PO-FE-10, contrato de tela §9)
// — decisão do dev sugerida na própria Tarefa (contrato de tela §9 deixa o
// local de menu em aberto): entrada no Header da listagem, navegando para
// `/financeiro/previsao/relatorio-previsto-realizado` (rota REAL,
// `BudgetPlanningPredictedReport`, TASK-PO-FE-11). Gateado por
// `budget-plannings_view` (mesma permissão exigida pelo backend,
// `BudgetPlanningPredictedReportRequest::authorize()` — NÃO
// `budget-plannings_create`, o relatório é leitura).
// -----------------------------------------------------------------------------

import { ElementType } from 'react';

import { useDisclosure } from '@chakra-ui/react';
import { FiFileText, FiUpload } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonAdd } from '@/components/ButtonAdd';
import { ButtonFilter } from '@/components/ButtonFilter';
import { GridSettingsFloatingPanel } from '@/components/GridSettings/GridSettingsFloatingPanel';
import type { GridSettingsFloatingPanelProps } from '@/components/GridSettings/GridSettingsFloatingPanel';

import { usePermissions } from '@/hooks/usePermissions';

import { LanguageDate } from '@/@types/language';

import { ImportBudgetPlanningModal } from './ImportBudgetPlanningModal';

interface HeaderBudgetPlanningTableProps {
  onOpenFilter: () => void;
  filtersApplied: number;
  languageGB: LanguageDate;
  gridSettings: GridSettingsFloatingPanelProps['gridSettings'];
}

export function HeaderBudgetPlanningTable({
  onOpenFilter,
  filtersApplied,
  languageGB,
  gridSettings,
}: HeaderBudgetPlanningTableProps) {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.financial.budgetPlanning;

  const {
    open: isImportModalOpen,
    onOpen: onOpenImportModal,
    onClose: onCloseImportModal,
  } = useDisclosure();

  const canCreate = can('budget-plannings_create');
  const canViewReport = can('budget-plannings_view');

  return (
    <>
      {canCreate && (
        <ButtonAdd
          onClick={() => navigate('/financeiro/previsao/create')}
          languageGB={languageGB}
        />
      )}
      {canCreate && (
        <Button
          title={text.import.menuLabel}
          variant="outline"
          icon={FiUpload as ElementType}
          onClick={onOpenImportModal}
        />
      )}
      {canViewReport && (
        <Button
          title={text.predictedReport.menuLabel}
          variant="outline"
          icon={FiFileText as ElementType}
          onClick={() => navigate('/financeiro/previsao/relatorio-previsto-realizado')}
        />
      )}
      <GridSettingsFloatingPanel
        gridSettings={gridSettings}
        triggerLabel={languageGB.defaltStrings.gridSettings.trigger}
      />
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />

      <ImportBudgetPlanningModal isOpen={isImportModalOpen} onClose={onCloseImportModal} />
    </>
  );
}
