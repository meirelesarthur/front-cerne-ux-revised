// src/pages/BaseRegistrations/BatchAreas/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Lote/Área (BatchArea) — irmã estrutural de
// `BatchGrazings/HeaderTable.tsx`, trocando Módulo por Área. SEM navegação
// por seleção de linha (a listagem já expõe a ação "Visualizar" explícita na
// coluna de ações — não existe "Editar" para onde a linha selecionada
// pudesse navegar, D1 do contrato de API).
//
// `ButtonFilter` RESTAURADO (TASK-FRONT-1, esteira 063-est03-9-reprovacoes,
// roteiro `lote-area-f143-roteiro.md §2`) — a feature TEM os 2 filtros do
// legado (Lote/Área) de volta; `BatchGrazings` (módulo irmão) permanece SEM
// filtro, decisão não propagada para lá.
//
// Botão de adicionar + painel de personalização de colunas + filtro — as
// colunas vivem no `index.tsx`.
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

  // UX (esconder o botão) — a autorização real é o 403 do backend em
  // `POST /batch-areas` (`batch_area_create`).
  return (
    <>
      {can('batch_area_create') && (
        <ButtonAdd
          onClick={() => navigate('/cadastros-base/lote-area/novo')}
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
