// src/pages/Operacional/CompraAnimais/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Compra de Animais — mirror
// `Operacional/VendaAnimais/HeaderTable.tsx`, simplificado: sem finalização
// em lote (Compras não tem claim equivalente no legado, roteiro TASK-CP-05
// §Dependências — feature exclusiva de Vendas).
//
//   - "Adicionar" (`ButtonAdd`, gate `mov_purchase_create`) — navega para
//     `/operacional/compra-animais/novo` (rota criada por `TASK-CP-06`; até
//     lá cai no catch-all `/operacional/*`).
//   - `ButtonFilter` (badge de contagem dos 4 filtros do drawer).
// -----------------------------------------------------------------------------

import { useNavigate } from 'react-router-dom';

import { ButtonAdd } from '@/components/ButtonAdd';

import { usePermissions } from '@/hooks/usePermissions';

import { LanguageDate } from '@/@types/language';

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
      {can('mov_purchase_create') && (
        <ButtonAdd
          onClick={() => navigate('/operacional/compra-animais/novo')}
          languageGB={languageGB}
        />
      )}
    </>
  );
}
