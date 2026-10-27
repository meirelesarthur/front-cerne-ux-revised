// src/pages/CadastrosBase/Fornecedores/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Fornecedores — mesmo padrão de
// Emissores/HeaderTable.tsx / Perfil/HeaderTable.tsx.
//
// SÓ os botões de ação (adicionar / abrir filtro). O botão "Novo Fornecedor"
// respeita `providers_create`. Navega para `/cadastros-base/fornecedores/novo`
// — a ROTA do formulário chega em TASK-PR-FE-03 (hoje cai no catch-all
// `/cadastros-base/*`/`RoutePlaceholder`, mesmo padrão incremental já usado
// por outros módulos deste projeto quando listagem e formulário são
// fatiados em Tarefas separadas).
// -----------------------------------------------------------------------------

import { useNavigate } from 'react-router-dom';

import { ButtonAdd } from '@/components/ButtonAdd';

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
      {can('providers_create') && (
        <ButtonAdd
          onClick={() => navigate('/cadastros-base/fornecedores/novo')}
          languageGB={languageGB}
        />
      )}
    </>
  );
}
