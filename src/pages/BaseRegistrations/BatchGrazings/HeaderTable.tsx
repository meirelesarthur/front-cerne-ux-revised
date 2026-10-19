// src/pages/BaseRegistrations/BatchGrazings/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Lote/Módulo (BatchGrazing) — mirror
// `Grazings/HeaderTable.tsx` SEM `ButtonFilter` (a feature não tem busca,
// `contrato-fe-lote-modulo.md §2`) e SEM navegação por seleção de linha (a
// listagem já expõe a ação "Visualizar" explícita na coluna de ações,
// diferente de Grazing/Fodder — aqui não existe "Editar" para onde a linha
// selecionada pudesse navegar, D1 do contrato de API).
//
// SÓ o botão de adicionar + o painel de personalização de colunas — as
// colunas vivem no `index.tsx`.
// -----------------------------------------------------------------------------

import { useNavigate } from 'react-router-dom';

import { ButtonAdd } from '@/components/ButtonAdd';
import { GridSettingsFloatingPanel } from '@/components/GridSettings/GridSettingsFloatingPanel';
import type { GridSettingsFloatingPanelProps } from '@/components/GridSettings/GridSettingsFloatingPanel';

import { usePermissions } from '@/hooks/usePermissions';

import { LanguageDate } from '@/@types/language';

interface HeaderTableProps {
  languageGB: LanguageDate;
  gridSettings: GridSettingsFloatingPanelProps['gridSettings'];
}

export function HeaderTable({ languageGB, gridSettings }: HeaderTableProps) {
  const navigate = useNavigate();
  const { can } = usePermissions();

  // UX (esconder o botão) — a autorização real é o 403 do backend em
  // `POST /batch-grazings` (`batch_grazing_create`).
  return (
    <>
      {can('batch_grazing_create') && (
        <ButtonAdd
          onClick={() => navigate('/cadastros-base/lote-modulo/novo')}
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
