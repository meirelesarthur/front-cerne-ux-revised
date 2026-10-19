// src/pages/Administrativo/Fabrica/useFoodForm.ts
// -----------------------------------------------------------------------------
// Hook de query do FORMULÁRIO completo de Formulação (Food — Fábrica/Ração,
// TASK-FOOD-FE-06). Arquivo distinto de `index.tsx` (listagem, TASK-FOOD-FE-05)
// — mirror `EstoqueInicial/useOpeningBalanceForm.tsx`
// (useOpeningBalanceForm/useSelectedProductDetails também separado de
// `useOpeningBalances.tsx`, a listagem irmã).
//
// A cascata Produto→Unidade de Medida do CABEÇALHO reusa
// `useProductMeasurementOptions` (`TASK-FOOD-FE-04`, já em arquivo próprio,
// consumido também por `FoodFeedstocksEditor.tsx`) — não duplicada aqui.
// -----------------------------------------------------------------------------

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';

import { queryKey } from '@/constants/query-key';

import { getFood } from '@/services/v2/Foods/food-service';

import type { FoodDetail } from '@/@types/v2/Foods';

interface UseFoodFormProps {
  registrationId?: string;
  fillForm: (data: FoodDetail, resetForce?: boolean) => void;
}

// Query de detalhe para preencher o formulário de edição (match por GUID) —
// mirror `useOpeningBalanceForm`/`useWarehouseForm`.
export function useFoodForm({ registrationId, fillForm }: UseFoodFormProps) {
  return useCustomFormQueryByGuid<FoodDetail>({
    registrationId,
    queryKey: queryKey.foods.food,
    asyncFunction: getFood,
    fillForm,
  });
}
