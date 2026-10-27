// src/pages/BaseRegistrations/DiagnosisPregnancy/HeaderTable.tsx
// Header de ações (adicionar / abrir filtro) da grid de Diagnóstico de Gestação.

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

  // Ao selecionar uma linha da grid, navega para a edição (padrão do projeto).
  useEffect(() => {
    const selected = table?.getSelectedRowModel()?.rows[0]?.original as any;
    if (selected?.uuid) {
      navigate(`/cadastros-base/diagnostico-gestacao/${selected.uuid}`);
    }
  }, [table?.getSelectedRowModel()?.rows[0]?.original]);

  return (
    <>
      {can('diagnosis_pregnancies_create') && (
        <ButtonAdd
          onClick={() => navigate(`/cadastros-base/diagnostico-gestacao/novo`)}
          languageGB={languageGB}
        />
      )}
    </>
  );
}
