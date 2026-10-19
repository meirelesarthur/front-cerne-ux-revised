// src/pages/Administrativo/RegistroEventos/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Registro de Eventos — mirror de
// `Adiantamento/HeaderTable.tsx`. `ButtonAdd` aponta para `/novo`, gated por
// `bonuses_create`.
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
      {can('bonuses_create') && (
        <ButtonAdd
          onClick={() => navigate('/administrativo/registro-eventos/novo')}
          languageGB={languageGB}
        />
      )}
    </>
  );
}
