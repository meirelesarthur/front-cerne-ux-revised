// src/pages/Operacional/Reproducao/Acasalamento/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Acasalamento — mirror `Weaning/HeaderTable.tsx`.
//
//   - "Novo Acasalamento" (gate `breeding-matings_create`) — navega para
//     `/operacional/acasalamento/novo`.
//   - `ButtonFilter` (badge de contagem do filtro do drawer).
// -----------------------------------------------------------------------------

import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonFilter } from '@/components/ButtonFilter';

import { usePermissions } from '@/hooks/usePermissions';

import type { LanguageDate } from '@/@types/language';

interface HeaderTableProps {
  onOpenFilter: () => void;
  filtersApplied: number;
  languageGB: LanguageDate;
}

export function HeaderTable({ onOpenFilter, filtersApplied, languageGB }: HeaderTableProps) {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.breedingMatings.breedingMating;

  const canCreate = can('breeding-matings_create');

  return (
    <>
      {canCreate && (
        <Button
          title={text.list.newButton}
          size="sm"
          onClick={() => navigate('/operacional/acasalamento/novo')}
        />
      )}
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
    </>
  );
}

export default HeaderTable;
