// src/pages/Administrativo/SaldoEstoque/useConsolidateStocks.ts
// -----------------------------------------------------------------------------
// Hook de mutação de CONSOLIDAÇÃO / "Agrupar" de Saldo de Estoque
// (TASK-STK-FE-04) — `POST /api/v1/stock-consolidations` (domínio
// StockConsolidation, permissão `groupproducts_create`). Hook de módulo,
// colocado na PASTA da feature (não em `src/hooks/` genérico) — mirror
// `CadastrosBase/Depreciacao/useDepreciacao.tsx::useGenerateDepreciation`.
//
// Via `useRequest({ typesRequest: 'apply' })` — o `onSuccess` do `useRequest`
// invalida `queryKey.stocks.stocks` (a MESMA chave da Listagem,
// `SaldoEstoque/index.tsx`), então a grid recarrega sozinha após o agrupamento
// (cumpre o "recarrega a listagem" do legado SEM `refetch()` manual). O toast
// de sucesso usa `personalizedMessage` derivado da tradução, nunca literal.
// -----------------------------------------------------------------------------

import { useLanguage } from '@/hooks/useLanguage';
import { useRequest } from '@/hooks/useRequest';

import { queryKey } from '@/constants/query-key';

import { consolidateStocks } from '@/services/v2/Stocks/stock-service';
import type { ConsolidateStocksPayload } from '@/services/v2/Stocks/stock-service';

import type { StockConsolidationResult } from '@/@types/v2/Stocks';

interface UseConsolidateStocksProps {
  onSuccess: () => void;
}

export function useConsolidateStocks({ onSuccess }: UseConsolidateStocksProps) {
  const { languageGB } = useLanguage();

  return useRequest<StockConsolidationResult>({
    asyncFunction: (payload: ConsolidateStocksPayload) => consolidateStocks(payload),
    typesRequest: 'apply',
    entityName: languageGB.stocks.stock.singularLabel,
    personalizedMessage: languageGB.stocks.stock.consolidation.successToast,
    queryKey: queryKey.stocks.stocks,
    actionSuccess: onSuccess,
  });
}
