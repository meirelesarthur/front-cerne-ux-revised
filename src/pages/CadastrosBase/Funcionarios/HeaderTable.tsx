// src/pages/CadastrosBase/Funcionarios/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Funcionários — mirror direto de
// `Fornecedores/HeaderTable.tsx` (mesmo padrão de Emissores/Perfil).
//
// SÓ os botões de ação (adicionar / abrir filtro). O botão "Novo Funcionário"
// respeita `employees_create`. Navega para `/cadastros-base/funcionarios/novo`
// — a rota já está registrada (TASK-EMP-FE-02, `router/index.tsx`), guardada
// por `employees_create`, renderizando `<RoutePlaceholder />` até o
// formulário real chegar em `TASK-EMP-FE-03`.
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
      {can('employees_create') && (
        <ButtonAdd
          onClick={() => navigate('/cadastros-base/funcionarios/novo')}
          languageGB={languageGB}
        />
      )}
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
    </>
  );
}
