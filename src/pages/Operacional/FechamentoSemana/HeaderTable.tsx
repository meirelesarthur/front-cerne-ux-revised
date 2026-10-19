// src/pages/Operacional/FechamentoSemana/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Fechamento Semana — mirror
// `Administrativo/RegistroEventos/HeaderTable.tsx` (versão SEM filtro — o
// contrato de tela §3 é explícito: esta listagem não tem `FilterSide`/
// `ButtonFilter`, fidelidade ao legado CL-006).
//
//   - "Adicionar" (`ButtonAdd`, gate `closing_weeks_create`) — navega para
//     `/operacional/fechamento-semana/novo` (rota nasce em `TASK-FE-FS-04`).
// -----------------------------------------------------------------------------

import { useNavigate } from 'react-router-dom';

import { ButtonAdd } from '@/components/ButtonAdd';

import { usePermissions } from '@/hooks/usePermissions';

import type { LanguageDate } from '@/@types/language';

interface HeaderTableProps {
  languageGB: LanguageDate;
}

export function HeaderTable({ languageGB }: HeaderTableProps) {
  const navigate = useNavigate();
  const { can } = usePermissions();

  return (
    <>
      {can('closing_weeks_create') && (
        <ButtonAdd
          onClick={() => navigate('/operacional/fechamento-semana/novo')}
          languageGB={languageGB}
        />
      )}
    </>
  );
}
