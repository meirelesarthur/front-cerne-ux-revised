// src/pages/BaseRegistrations/IdentificationTypes/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Tipos de Identificação — mirror de
// TecnicasDiagnostico/HeaderTable.tsx MENOS o `ButtonFilter` (decisão de
// fidelidade ao legado, não-negociável: esta tela NÃO tem filtro de busca).
//
// SÓ o botão de adicionar — as colunas vivem no index.tsx. O botão "Novo Tipo
// de Identificação" respeita `idanimal_create` (UX; o enforcement real é o
// 403 do backend). Tipo de Identificação não tem hierarquia — catálogo flat.
// Ao selecionar uma linha, navega para a edição.
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
  languageGB: LanguageDate;
  gridSettings: GridSettingsFloatingPanelProps['gridSettings'];
}

export function HeaderTable({ languageGB, gridSettings }: HeaderTableProps) {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const { table } = useTable();

  // Ao selecionar uma linha da grid, navega para a edição (padrão do projeto).
  useEffect(() => {
    const selected = table?.getSelectedRowModel()?.rows[0]?.original as any;
    if (selected?.uuid) {
      navigate(`/cadastros-base/tipos-identificacao/${selected.uuid}`);
    }
  }, [table?.getSelectedRowModel()?.rows[0]?.original]);

  return (
    <>
      {can('idanimal_create') && (
        <ButtonAdd
          onClick={() => navigate(`/cadastros-base/tipos-identificacao/novo`)}
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
