// src/pages/BaseRegistrations/Grazings/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Pastejo (Grazing) — mirror de
// `Fodders/HeaderTable.tsx` — SEM `ButtonFilter` (o legado não tem busca,
// `Grazing-Doc-Bruta.md §7` item 1).
//
// SÓ o botão de adicionar + o painel de personalização de colunas — as
// colunas vivem no `index.tsx`. O botão "Novo Pastejo" respeita
// `grazing_create` (UX; o enforcement real é o 403 do backend). Ao
// selecionar uma linha, navega para a edição — mesma convenção de
// `Fodders/HeaderTable.tsx` (a rota `/:grazingId` em si é registrada pela
// Tarefa irmã `TASK-GZ-FE-02`, junto com o componente de formulário).
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

  // Ao selecionar uma linha da grid, navega para a edição (padrão do
  // projeto) — rota registrada pela Tarefa irmã TASK-GZ-FE-02.
  useEffect(() => {
    const selected = table?.getSelectedRowModel()?.rows[0]?.original as any;
    if (selected?.uuid) {
      navigate(`/cadastros-base/modulo-pastejo/${selected.uuid}`);
    }
  }, [table?.getSelectedRowModel()?.rows[0]?.original]);

  return (
    <>
      {can('grazing_create') && (
        <ButtonAdd
          onClick={() => navigate(`/cadastros-base/modulo-pastejo/novo`)}
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
