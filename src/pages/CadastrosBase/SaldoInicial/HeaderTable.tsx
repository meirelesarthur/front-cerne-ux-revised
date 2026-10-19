// src/pages/CadastrosBase/SaldoInicial/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Saldo Inicial (mesmo padrão de
// `CentroCusto/HeaderTable.tsx`) — botão "Novo" (gated `open-movements_create`,
// navega para `/cadastros-base/saldo-inicial/novo`) + `GridSettingsFloatingPanel`
// (mirror regra 8 do protocolo — toda grid nova usa) + `ButtonFilter`.
//
// SEM navegação por seleção de linha (não há tela de Edição, contrato §2 —
// "Visualizar" já cobre a ação de linha, ver `index.tsx`).
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
      {can('open-movements_create') && (
        <ButtonAdd
          onClick={() => navigate('/cadastros-base/saldo-inicial/novo')}
          languageGB={languageGB}
        />
      )}
      <GridSettingsFloatingPanel
        gridSettings={gridSettings}
        triggerLabel={languageGB.defaltStrings.gridSettings.trigger}
      />
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
    </>
  );
}
