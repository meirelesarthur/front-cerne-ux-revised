// src/pages/Integracoes/Compartilhamento/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Compartilhamento (`TASK-CP-FE-01`). SÓ o botão
// "Novo Compartilhamento" (condicionado a `sharings_create`) — SEM
// `ButtonFilter` (o legado não tem painel de filtro nesta feature, `FM-01
// NONE_OBSERVED`, mirror `HeaderTable.tsx` de `TypeTitles`/`MotivosBaixa`,
// exceto pela ausência deliberada do filtro).
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
      {can('sharings_create') && (
        <ButtonAdd
          onClick={() => navigate('/integracoes/compartilhamento/novo')}
          languageGB={languageGB}
        />
      )}
    </>
  );
}
