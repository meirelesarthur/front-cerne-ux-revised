// src/pages/Operacional/Pedidos/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Pedidos (Order — Operacional / Vendas, F-051,
// 97-Esteiras/043, PED-FE-02) — mirror `Romaneios/HeaderTable.tsx`
// (extraído do próprio header inline de `Operacional/Budget/index.tsx`).
//
// Sem busca própria no header — "Nº" (FLT-001) mora DENTRO do drawer de
// filtro (Contrato B), não como campo separado no toolbar (diferente de
// Romaneios, que tem GAP-TRF-FE-06 dedicado); mirror exato do header de
// Budget: `ButtonAdd` (gate `orders_create`) + `ButtonFilter` (badge de
// contagem dos 6 filtros do drawer).
// -----------------------------------------------------------------------------

import { useNavigate } from 'react-router-dom';

import { ButtonAdd } from '@/components/ButtonAdd';

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
      {can('orders_create') && (
        <ButtonAdd onClick={() => navigate('/operacional/pedidos/novo')} languageGB={languageGB} />
      )}
    </>
  );
}

export default HeaderTable;
