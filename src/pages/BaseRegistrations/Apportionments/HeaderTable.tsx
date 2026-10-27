// src/pages/BaseRegistrations/Apportionments/HeaderTable.tsx
// Header de ações (adicionar / personalizar grid / abrir filtro) da grid de
// Rateio - Categoria Financeira (Apportionment, TASK-AP-FE-07). Mirror
// `Financeiro/MovCaixaBancario/HeaderTable.tsx` (regra 8 do protocolo v2 —
// toda grid nova usa `GridSettingsFloatingPanel`).

import { useNavigate } from 'react-router-dom';

import { ButtonAdd } from '@/components/ButtonAdd';
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
      {can('apportionments_create') && (
        <ButtonAdd
          onClick={() => navigate('/cadastros-base/rateios-categorias/novo')}
          languageGB={languageGB}
        />
      )}
      <GridSettingsFloatingPanel
        gridSettings={gridSettings}
        triggerLabel={languageGB.defaltStrings.gridSettings.trigger}
      />
    </>
  );
}
