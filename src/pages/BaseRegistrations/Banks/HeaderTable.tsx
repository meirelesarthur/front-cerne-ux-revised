// src/pages/BaseRegistrations/Banks/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Bancos (mesmo padrão de
// GruposProduto/HeaderTable.tsx e Especies/HeaderTable.tsx), com uma
// diferença: SEM `ButtonFilter`/drawer lateral — `Bank` não tem nenhum campo
// filtrável por enum/booleano (só `code`/`name`, texto livre), então em vez
// do drawer entra um `Input` de busca local que alimenta o filtro
// client-side aplicado em Bancos/index.tsx (ver Achado #1 da ficha
// TASK-BANK-FE-01 — `GET /banks` não aceita `search` no servidor).
//
// O botão "Novo Banco" respeita `banks_create` (UX; o enforcement real é o
// 403 do backend). Ao selecionar uma linha, navega para a edição.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { ButtonAdd } from '@/components/ButtonAdd';
import { Input } from '@/components/Form/Input';
import { GridSettingsFloatingPanel } from '@/components/GridSettings/GridSettingsFloatingPanel';
import type { GridSettingsFloatingPanelProps } from '@/components/GridSettings/GridSettingsFloatingPanel';

import { usePermissions } from '@/hooks/usePermissions';
import { useTable } from '@/hooks/useTable';

import { LanguageDate } from '@/@types/language';

interface HeaderTableProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  languageGB: LanguageDate;
  gridSettings: GridSettingsFloatingPanelProps['gridSettings'];
}

export function HeaderTable({
  searchValue,
  onSearchChange,
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
      navigate(`/cadastros-base/bancos/${selected.uuid}`);
    }
  }, [table?.getSelectedRowModel()?.rows[0]?.original]);

  const text = languageGB.baseRegistrations.bank;

  return (
    <>
      <Input
        placeholder={text.list.search.placeholder}
        value={searchValue}
        onChange={(event) => onSearchChange(event.target.value)}
        startElement={Search}
        width={{ base: 'full', md: '280px' }}
      />
      <GridSettingsFloatingPanel
        gridSettings={gridSettings}
        triggerLabel={languageGB.defaltStrings.gridSettings.trigger}
      />
      {can('banks_create') && (
        <ButtonAdd
          onClick={() => navigate(`/cadastros-base/bancos/novo`)}
          languageGB={languageGB}
        />
      )}
    </>
  );
}
