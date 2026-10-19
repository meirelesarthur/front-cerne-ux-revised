// src/pages/CadastrosBase/Clientes/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Clientes — mesmo padrão de
// Proprietarios/HeaderTable.tsx / Fornecedores/HeaderTable.tsx.
//
// SÓ os botões de ação (adicionar / abrir filtro). O botão "Novo Cliente"
// respeita `clients_create`. Navega para `/cadastros-base/clientes/novo`.
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
      {can('clients_create') && (
        <ButtonAdd
          onClick={() => navigate('/cadastros-base/clientes/novo')}
          languageGB={languageGB}
        />
      )}
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
    </>
  );
}
