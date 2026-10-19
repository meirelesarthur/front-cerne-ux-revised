// src/pages/CadastrosBase/Contador/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Contador — só os botões (adicionar/filtro), as
// colunas vivem no `index.tsx`. `ContadorResource` não expõe flags de
// autorização por item — a permissão genérica `ctdr_create` basta, sem
// exceção de papel (mesmo racional de PlanAccount/HeaderTable.tsx).
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
      {can('ctdr_create') && (
        <ButtonAdd
          onClick={() => navigate('/cadastros-base/contador/novo')}
          languageGB={languageGB}
        />
      )}
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
    </>
  );
}
