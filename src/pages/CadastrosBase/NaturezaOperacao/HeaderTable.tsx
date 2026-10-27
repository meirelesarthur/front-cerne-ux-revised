// src/pages/CadastrosBase/NaturezaOperacao/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Natureza de Operação (mesmo padrão de
// InfoComplementares/HeaderTable.tsx e RegrasFiscais/HeaderTable.tsx).
//
// SÓ os botões de ação (adicionar / abrir filtro) — as colunas vivem no
// index.tsx. O botão "Nova Natureza de Operação" respeita `natop_create`. Ao
// selecionar uma linha, navega para a edição (rota real criada pela Tarefa
// irmã TASK-NO-FE-02 — aqui só o `navigate`, sem registrar a rota).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonAdd } from '@/components/ButtonAdd';

import { usePermissions } from '@/hooks/usePermissions';
import { useTable } from '@/hooks/useTable';

import { LanguageDate } from '@/@types/language';

interface HeaderTableProps {
  onOpenFilter: () => void;
  filtersApplied: number;
  languageGB: LanguageDate;
  // UT-000779 — abre a confirmação de "Usar modelos" (naturezas padrão do sistema).
  onImportDefaults: () => void;
  isImportingDefaults?: boolean;
}

export function HeaderTable({
  onOpenFilter,
  filtersApplied,
  languageGB,
  onImportDefaults,
  isImportingDefaults = false,
}: HeaderTableProps) {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const { table } = useTable();

  // Ao selecionar uma linha da grid, navega para a edição (padrão do projeto).
  useEffect(() => {
    const selected = table?.getSelectedRowModel()?.rows[0]?.original as any;
    if (selected?.uuid) {
      navigate(`/cadastros-base/natureza-operacao/${selected.uuid}`);
    }
  }, [table?.getSelectedRowModel()?.rows[0]?.original]);

  return (
    <>
      {can('natop_create') && (
        <Button
          title={languageGB.natureOperations.natureOperation.list.importDefaults.button}
          variant="outline"
          borderRadius="8px"
          onClick={onImportDefaults}
          disabled={isImportingDefaults}
        />
      )}
      {can('natop_create') && (
        <ButtonAdd
          onClick={() => navigate(`/cadastros-base/natureza-operacao/novo`)}
          languageGB={languageGB}
        />
      )}
    </>
  );
}
