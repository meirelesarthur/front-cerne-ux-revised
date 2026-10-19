// src/pages/CadastrosBase/Usuarios/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Usuários — TASK-FE-806, mirror MECÂNICO de
// `Administrativo/Funcoes/HeaderTable.tsx` (molde primário indicado pelo dev,
// PR #103/Vladimir).
//
// SÓ os botões de ação (adicionar / abrir filtro) — as colunas vivem no
// index.tsx. O botão "Novo Usuário" respeita `users_create`.
// -----------------------------------------------------------------------------

import { useNavigate } from 'react-router-dom';

import { ButtonAdd } from '@/components/ButtonAdd';
import { ButtonFilter } from '@/components/ButtonFilter';

import { usePermissions } from '@/hooks/usePermissions';

import { LanguageDate } from '@/@types/language';

interface HeaderTableProps {
  onOpenFilter: () => void;
  filtersApplied: number;
  languageGB: LanguageDate;
}

export function HeaderTable({ onOpenFilter, filtersApplied, languageGB }: HeaderTableProps) {
  const navigate = useNavigate();
  const { can } = usePermissions();

  return (
    <>
      {can('users_create') && (
        <ButtonAdd
          onClick={() => navigate('/cadastros-base/usuarios/novo')}
          languageGB={languageGB}
        />
      )}
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
    </>
  );
}
