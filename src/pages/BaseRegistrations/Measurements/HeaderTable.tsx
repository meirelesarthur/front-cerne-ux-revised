// src/pages/BaseRegistrations/Measurements/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Un. de Medida — mirror de
// Vacinas/HeaderTable.tsx: botão de adicionar + `ButtonFilter` (busca).
//
// Acréscimo pós-migração (decisão explícita do dev no E2E) — o legado NÃO
// tinha filtro/busca (Doc Bruta §4/§13); esta tela ganhou um drawer de busca
// enxuto (ver FilterSideMeasurements.tsx), mesma casca de Vacinas/Racas.
//
// As colunas vivem no index.tsx. O botão "Nova Un. de Medida" respeita
// `measurements_create` (UX; o enforcement real é o 403 do backend). Un. de
// Medida não tem hierarquia — catálogo flat. Ao selecionar uma linha, navega
// para a edição.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { useNavigate } from 'react-router-dom';

import { ButtonAdd } from '@/components/ButtonAdd';
import { GridSettingsFloatingPanel } from '@/components/GridSettings/GridSettingsFloatingPanel';
import type { GridSettingsFloatingPanelProps } from '@/components/GridSettings/GridSettingsFloatingPanel';

import { usePermissions } from '@/hooks/usePermissions';
import { useTable } from '@/hooks/useTable';

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
  const { table } = useTable();

  // Ao selecionar uma linha da grid, navega para a edição (padrão do projeto).
  useEffect(() => {
    const selected = table?.getSelectedRowModel()?.rows[0]?.original as any;
    if (selected?.uuid) {
      navigate(`/cadastros-base/unidade-medida/${selected.uuid}`);
    }
  }, [table?.getSelectedRowModel()?.rows[0]?.original]);

  return (
    <>
      {can('measurements_create') && (
        <ButtonAdd
          onClick={() => navigate(`/cadastros-base/unidade-medida/novo`)}
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
