// src/pages/Operacional/Perdas/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Perdas (LossAnimal) — mirror
// `Operacional/Weaning/HeaderTable.tsx` (sem o botão de Relatório, ausente do
// escopo desta feature). `canCreate` já resolvido pelo `index.tsx` (evita
// segunda leitura de `usePermissions` para o mesmo gate).
//
//   - "Nova Perda" (`ButtonAdd`, gate `loss_animals_create`) — navega para
//     `/operacional/perdas/nova`.
//   - `ButtonFilter` (badge de contagem do drawer `FilterSideLossAnimal`).
// -----------------------------------------------------------------------------

import { useNavigate } from 'react-router-dom';

import { ButtonAdd } from '@/components/ButtonAdd';
import { ButtonFilter } from '@/components/ButtonFilter';

import { LanguageDate } from '@/@types/language';

interface HeaderTableProps {
  canCreate: boolean;
  onOpenFilter: () => void;
  filtersApplied: number;
  languageGB: LanguageDate;
}

export function HeaderTable({
  canCreate,
  onOpenFilter,
  filtersApplied,
  languageGB,
}: HeaderTableProps) {
  const navigate = useNavigate();

  return (
    <>
      {canCreate && (
        <ButtonAdd onClick={() => navigate('/operacional/perdas/nova')} languageGB={languageGB} />
      )}
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
    </>
  );
}
