// src/pages/CadastrosBase/CausaMortePerda/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Causa Morte/Perda — mirror
// TiposIdentificacao/HeaderTable.tsx (SÓ `ButtonAdd` — decisão de fidelidade
// ao legado, não-negociável: esta tela NÃO tem filtro de busca, portanto SEM
// `ButtonFilter`).
//
// SÓ o botão de adicionar — as colunas vivem no index.tsx. O botão "Nova
// Causa de Morte/Perda" respeita `death_loss_create` (UX; o enforcement
// real é o 403 do backend). Ao selecionar uma linha, navega para a edição.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { useNavigate } from 'react-router-dom';

import { ButtonAdd } from '@/components/ButtonAdd';

import { usePermissions } from '@/hooks/usePermissions';
import { useTable } from '@/hooks/useTable';

import { LanguageDate } from '@/@types/language';

interface HeaderTableProps {
  languageGB: LanguageDate;
}

export function HeaderTable({ languageGB }: HeaderTableProps) {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const { table } = useTable();

  // Ao selecionar uma linha da grid, navega para a edição (padrão do projeto).
  useEffect(() => {
    const selected = table?.getSelectedRowModel()?.rows[0]?.original as any;
    if (selected?.uuid) {
      navigate(`/cadastros-base/causa-morte-perda/${selected.uuid}`);
    }
  }, [table?.getSelectedRowModel()?.rows[0]?.original]);

  return (
    <>
      {can('death_loss_create') && (
        <ButtonAdd
          onClick={() => navigate(`/cadastros-base/causa-morte-perda/novo`)}
          languageGB={languageGB}
        />
      )}
    </>
  );
}
