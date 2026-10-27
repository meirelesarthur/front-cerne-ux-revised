// src/pages/CadastrosBase/ParameterAnimals/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Parâmetros Animais (mesmo padrão de
// Atividades/HeaderTable.tsx/Funcoes/HeaderTable.tsx — TASK-FE-1078,
// regeneração).
//
// SÓ os botões de ação (adicionar / abrir filtro) — as colunas vivem no
// index.tsx. O botão "Novo Parâmetro Animal" respeita `parameter-animals_create`.
// Ao selecionar uma linha da grid (single-select, `enableMultiRowSelection`
// false no TableProvider), navega para a edição — mesmo padrão de
// Atividades (módulo-mãe citado na Tarefa como referência alternativa).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { useNavigate } from 'react-router-dom';

import { ButtonAdd } from '@/components/ButtonAdd';

import { usePermissions } from '@/hooks/usePermissions';
import { useTable } from '@/hooks/useTable';

import { LanguageDate } from '@/@types/language';

interface HeaderTableProps {
  onOpenFilter: () => void;
  filtersApplied: number;
  languageGB: LanguageDate;
}

export function HeaderTable({ onOpenFilter, filtersApplied, languageGB }: HeaderTableProps) {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const { table } = useTable();

  useEffect(() => {
    const selected = table?.getSelectedRowModel()?.rows[0]?.original as any;
    if (selected?.uuid) {
      navigate(`/parameter-animals/${selected.uuid}`);
    }
  }, [table?.getSelectedRowModel()?.rows[0]?.original]);

  return (
    <>
      {can('parameter-animals_create') && (
        <ButtonAdd onClick={() => navigate('/parameter-animals/novo')} languageGB={languageGB} />
      )}
    </>
  );
}
