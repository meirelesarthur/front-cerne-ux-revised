// src/pages/Operacional/Reproducao/Acasalamento/DiagnosticoGestacao/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Diagnóstico de Gestação — mirror
// `Acasalamento/HeaderTable.tsx` (TASK-BM-FE-03).
//
//   - "Novo" (`pd-action-create`, gate `pregnancy-diagnosis_create`) — SÓ O
//     BOTÃO nesta Tarefa (contrato de tela §6.6/superfícies cobertas); navega
//     para a rota aninhada `.../diagnostico-gestacao/novo` (tela real é a
//     Tarefa 08).
//   - `ButtonFilter` (badge de contagem do filtro do drawer).
//
// `breedingMatingUuid` chega por PROP (regra 4 da Tarefa) — resolvido uma
// única vez em `index.tsx` via `useParams`; este componente NUNCA busca o pai
// sozinho.
// -----------------------------------------------------------------------------

import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonFilter } from '@/components/ButtonFilter';

import { usePermissions } from '@/hooks/usePermissions';

import type { LanguageDate } from '@/@types/language';

interface HeaderTableProps {
  breedingMatingUuid: string;
  onOpenFilter: () => void;
  filtersApplied: number;
  languageGB: LanguageDate;
}

export function HeaderTable({
  breedingMatingUuid,
  onOpenFilter,
  filtersApplied,
  languageGB,
}: HeaderTableProps) {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.breedingMatings.pregnancyDiagnosis;

  const canCreate = can('pregnancy-diagnosis_create');

  return (
    <>
      {canCreate && (
        <Button
          title={text.list.newButton}
          size="sm"
          onClick={() =>
            navigate(`/operacional/acasalamento/${breedingMatingUuid}/diagnostico-gestacao/novo`)
          }
        />
      )}
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
    </>
  );
}

export default HeaderTable;
