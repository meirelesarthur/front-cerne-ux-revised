// src/pages/Fiscal/Dfe/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de DFe Recebidas (Dfe — domínio Fiscal, execução
// 044, TASK-DFE-FE-05). Mirror `NfseRecebidas/HeaderTable.tsx`: só os botões
// de ação — as colunas vivem no `index.tsx`. Botão "Buscar DFe" (navega para
// `/fiscal/dfes/buscar`, TASK-DFE-FE-07) + `ButtonFilter` +
// `GridSettingsFloatingPanel`.
//
// Gate `dfe_create|dfe_fiscal_create` no botão "Buscar DFe" (par de
// permissões espelhado, `CONTRATO-API-DFE.md §6` — `canAny`, mirror do
// padrão `dfe_*|dfe_fiscal_*` usado em toda a feature).
// -----------------------------------------------------------------------------

import type { ElementType } from 'react';

import { FiSearch } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { GridSettingsFloatingPanel } from '@/components/GridSettings/GridSettingsFloatingPanel';
import type { GridSettingsFloatingPanelProps } from '@/components/GridSettings/GridSettingsFloatingPanel';

import { usePermissions } from '@/hooks/usePermissions';

import type { LanguageDate } from '@/@types/language';

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
  const { canAny } = usePermissions();

  return (
    <>
      {canAny(['dfe_create', 'dfe_fiscal_create']) && (
        <Button
          title={languageGB.dfes.dfe.syncScreen.submitButton}
          icon={FiSearch as ElementType}
          onClick={() => navigate('/fiscal/dfes/buscar')}
        />
      )}
      <GridSettingsFloatingPanel
        gridSettings={gridSettings}
        triggerLabel={languageGB.defaltStrings.gridSettings.trigger}
      />
    </>
  );
}
