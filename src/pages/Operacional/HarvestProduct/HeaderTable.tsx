// src/pages/Operacional/HarvestProduct/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Colheita de Frutas — mirror
// `ProtocoloEstacao/HeaderTable.tsx` (`Button` + `ButtonFilter`), gated por
// `harvest-products_create`.
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

const HARVEST_PRODUCT_LIST_ROUTE = '/operacional/colheita-frutas';

export function HeaderTable({ onOpenFilter, filtersApplied, languageGB }: HeaderTableProps) {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.harvestProduct.list;

  return (
    <>
      {can('harvest-products_create') && (
        <Button
          title={text.newButton}
          size="sm"
          onClick={() => navigate(`${HARVEST_PRODUCT_LIST_ROUTE}/nova`)}
        />
      )}
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
    </>
  );
}

export default HeaderTable;
