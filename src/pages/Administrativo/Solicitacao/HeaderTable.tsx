// src/pages/Administrativo/Solicitacao/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Solicitação de Compras (TASK-RP-FE-08) — mirror
// de `CadastrosBase/CentroCusto/HeaderTable.tsx`/`BaseRegistrations/Headbands/
// HeaderTable.tsx` (canário `GridSettings`, mandato do protocolo de padrão
// v2 — toda grid nova liga `useGridSettings`/`GridSettingsFloatingPanel`).
//
// SÓ os botões de ação (adicionar / grid settings / abrir filtro) — as
// colunas vivem no `index.tsx`. Ao selecionar uma linha da grid, navega para
// a edição (padrão do projeto).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { useNavigate } from 'react-router-dom';

import { ButtonAdd } from '@/components/ButtonAdd';
import { useIsEmbeddedList } from '@/components/EmbeddedList';
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

  // Ao selecionar uma linha da grid, abre a VISUALIZAÇÃO da ordem (decisão do
  // dono, 25/11); editar fica na ação "Editar" da linha.
  useEffect(() => {
    const selected = table?.getSelectedRowModel()?.rows[0]?.original as any;
    if (selected?.uuid) {
      navigate(`/administrativo/solicitacao/${selected.uuid}/visualizar`);
    }
  }, [table?.getSelectedRowModel()?.rows[0]?.original]);

  // Na tela única de Ordens de compra o "Novo" é da tela (fixo em toda visão).
  const isEmbedded = useIsEmbeddedList();

  return (
    <>
      {!isEmbedded && can('request-purchases_create') && (
        <ButtonAdd
          onClick={() => navigate(`/administrativo/solicitacao/novo`)}
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
