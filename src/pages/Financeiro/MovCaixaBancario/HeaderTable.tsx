// src/pages/Financeiro/MovCaixaBancario/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Movimento Caixa/Bancário (Movement,
// TASK-MV-FE-04) — mirror `CadastrosBase/SaldoInicial/HeaderTable.tsx`.
// Botão "Novo Movimento" (gated `movements_create`, navega para
// `/financeiro/caixa/novo` — rota real fica para TASK-MV-FE-05, não criada
// aqui) + `GridSettingsFloatingPanel` (regra 8 do protocolo — toda grid nova
// usa) + `ButtonFilter`.
// -----------------------------------------------------------------------------

import { useNavigate } from 'react-router-dom';

import { ButtonAdd } from '@/components/ButtonAdd';
import { ButtonFilter } from '@/components/ButtonFilter';
import { GridSettingsFloatingPanel } from '@/components/GridSettings/GridSettingsFloatingPanel';
import type { GridSettingsFloatingPanelProps } from '@/components/GridSettings/GridSettingsFloatingPanel';

import { usePermissions } from '@/hooks/usePermissions';

import { LanguageDate } from '@/@types/language';

interface HeaderTableProps {
  onOpenFilter: () => void;
  filtersApplied: number;
  languageGB: LanguageDate;
  gridSettings: GridSettingsFloatingPanelProps['gridSettings'];
}

export function HeaderTable({
  onOpenFilter,
  filtersApplied,
  languageGB,
  gridSettings,
}: HeaderTableProps) {
  const navigate = useNavigate();
  const { can } = usePermissions();

  return (
    <>
      {can('movements_create') && (
        <ButtonAdd onClick={() => navigate('/financeiro/caixa/novo')} languageGB={languageGB} />
      )}
      <GridSettingsFloatingPanel
        gridSettings={gridSettings}
        triggerLabel={languageGB.defaltStrings.gridSettings.trigger}
      />
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
    </>
  );
}
