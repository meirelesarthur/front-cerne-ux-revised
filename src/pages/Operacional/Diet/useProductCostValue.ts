// src/pages/Operacional/Diet/useProductCostValue.ts
// -----------------------------------------------------------------------------
// Hook de autofill do `cost_value` de uma linha de ingrediente (Diet —
// Operacional/Pecuária, TASK-FE-DIET-03, CV-05:
// `arquitetura-frontend-dieta.md §4.3`): `cost_value = las_price` ajustado
// pelo `factor`/`factor_type` do produto conforme a UNIDADE escolhida na
// linha — `M` (Multiplica) ⇒ `las_price / factor`; `D` (Divide) ⇒
// `las_price * factor`; unidade PRIMÁRIA (`product.measurement`) ⇒ sem
// ajuste (`las_price` cru).
//
// PREVIEW de UX (AD-06) — o valor autofilled é só um PONTO DE PARTIDA
// editável pelo usuário; o servidor NUNCA recebe/recalcula `cost_value` a
// partir daqui (o campo vai no payload como o usuário o deixar).
//
// Reuso de dados, SEM duplicar busca de rede: usa a MESMA `queryKey`
// (`['food-product-measurement-options', productUuid]`) de
// `useProductMeasurementOptions` (`@/pages/Administrativo/Fabrica/
// useProductMeasurementOptions.ts`, reuso explícito instruído pelo
// contrato) — o TanStack Query deduplica automaticamente as 2 chamadas
// (mesma chave, mesmo `queryFn`), então nenhuma requisição extra é feita
// por esta linha só para obter `las_price`/`factor`.
// -----------------------------------------------------------------------------

import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';

import { getProduct } from '@/services/v2/Products/product-service';

import type { ProductData } from '@/@types/v2/Products';

/**
 * Calcula `cost_value` a partir de `las_price`/`factor`/`factor_type` do
 * produto e da unidade escolhida na linha (CV-05).
 * @param {ProductData | undefined} product - Detalhe do produto (`getProduct`).
 * @param {string | null | undefined} measurementUuid - `uuid` da unidade escolhida na linha.
 * @return {number} `cost_value` sugerido (preview, editável pelo usuário).
 */
function calculateCostValue(
  product: ProductData | undefined,
  measurementUuid: string | null | undefined
): number {
  if (!product) return 0;

  const lasPrice = Number(product.las_price) || 0;
  const isSecondaryMeasurement =
    !!measurementUuid &&
    !!product.measurement_second &&
    measurementUuid === product.measurement_second.uuid;

  if (!isSecondaryMeasurement || !product.factor || !product.factor_type) {
    return lasPrice;
  }

  const factor = Number(product.factor) || 1;
  return product.factor_type.value === 'M' ? lasPrice / factor : lasPrice * factor;
}

export function useProductCostValue(
  productUuid: string | null | undefined,
  measurementUuid: string | null | undefined
) {
  const query = useQuery<ProductData>({
    queryKey: ['food-product-measurement-options', productUuid],
    queryFn: async () => {
      const response = await getProduct(productUuid as string);
      return response.data;
    },
    enabled: !!productUuid,
    staleTime: 60 * 1000,
    retry: false,
  });

  const suggestedCostValue = useMemo(
    () => calculateCostValue(query.data, measurementUuid),
    [query.data, measurementUuid]
  );

  return {
    suggestedCostValue,
    isLoading: query.isLoading,
  };
}
