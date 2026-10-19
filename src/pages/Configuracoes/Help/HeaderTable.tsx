// src/pages/Configuracoes/Help/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Tutoriais (Help, TASK-HP-06) — mesmo padrão de
// CentroCusto/HeaderTable.tsx (SÓ os botões de ação; as colunas vivem em
// index.tsx). O botão "Novo" respeita `helpers_create` (checado no
// componente-pai e repassado via `canCreate` — mesma decisão de não
// re-consultar `usePermissions` duas vezes na mesma árvore de render).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { useNavigate } from 'react-router-dom';

import { ButtonAdd } from '@/components/ButtonAdd';
import { ButtonFilter } from '@/components/ButtonFilter';

import { useTable } from '@/hooks/useTable';

import { LanguageDate } from '@/@types/language';

interface HeaderTableProps {
  onOpenFilter: () => void;
  filtersApplied: number;
  languageGB: LanguageDate;
  canCreate: boolean;
}

export function HeaderTable({
  onOpenFilter,
  filtersApplied,
  languageGB,
  canCreate,
}: HeaderTableProps) {
  const navigate = useNavigate();
  const { table } = useTable();

  // Ao selecionar uma linha da grid, navega para a edição (padrão do projeto).
  useEffect(() => {
    const selected = table?.getSelectedRowModel()?.rows[0]?.original as any;
    if (selected?.uuid) {
      navigate(`/configuracoes/helps/${selected.uuid}`);
    }
  }, [table?.getSelectedRowModel()?.rows[0]?.original]);

  return (
    <>
      {canCreate && (
        <ButtonAdd
          onClick={() => navigate('/configuracoes/helps/create')}
          languageGB={languageGB}
        />
      )}
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
    </>
  );
}
