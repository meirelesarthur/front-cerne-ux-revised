// src/pages/Administrativo/Adiantamento/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Adiantamento Salarial — mirror de
// `CicloProducao/HeaderTable.tsx`. `ButtonAdd` aponta para `/novo`, gated por
// `advances_create`.
// -----------------------------------------------------------------------------

import { useNavigate } from 'react-router-dom';

import { ButtonAdd } from '@/components/ButtonAdd';

import { usePermissions } from '@/hooks/usePermissions';

import { LanguageDate } from '@/@types/language';

interface HeaderTableProps {
  languageGB: LanguageDate;
}

export function HeaderTable({ languageGB }: HeaderTableProps) {
  const navigate = useNavigate();
  const { can } = usePermissions();

  return (
    <>
      {can('advances_create') && (
        <ButtonAdd
          onClick={() => navigate('/administrativo/adiantamento/novo')}
          languageGB={languageGB}
        />
      )}
    </>
  );
}
