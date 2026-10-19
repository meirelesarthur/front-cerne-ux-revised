// src/pages/Operacional/Vendas/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Vendas COMERCIAL (Sale — Operacional / Vendas,
// venda de PRODUTOS, 97-Esteiras/043, SALE-FE-COM-02) — mirror EXATO de
// `Operacional/Pedidos/HeaderTable.tsx`: `ButtonAdd` (gate `sales_create`) +
// `ButtonFilter` (badge de contagem do Contrato B).
// -----------------------------------------------------------------------------

import { useNavigate } from 'react-router-dom';

import { ButtonAdd } from '@/components/ButtonAdd';
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

  return (
    <>
      {can('sales_create') && (
        <ButtonAdd onClick={() => navigate('/operacional/vendas/novo')} languageGB={languageGB} />
      )}
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
    </>
  );
}

export default HeaderTable;
