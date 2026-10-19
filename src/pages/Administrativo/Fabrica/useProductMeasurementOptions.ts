// src/pages/Administrativo/Fabrica/useProductMeasurementOptions.ts
// -----------------------------------------------------------------------------
// Hook de cascata Produto→Unidade de Medida do módulo "Formulação" (Food —
// Fábrica/Ração, TASK-FOOD-FE-04). Usado tanto pela linha de composição
// (`FoodFeedstocksEditor.tsx`, este arquivo) quanto pelo cabeçalho do
// formulário completo ("Produto"/"Unidade de Medida", `TASK-FOOD-FE-06`).
//
// `ProductOptionItem` (lookup enxuto de `GET /products/options`) NÃO expõe
// `measurement`/`measurement_second` (só `uuid`/`code`/`description`/
// `requires_coffee_fields`) — a cascata de unidade de medida (Doc Bruta Food
// regra 12: até 2 unidades por produto, `measurement_id`/`second_measurement_id`)
// não pode vir do lookup enxuto. Mesma solução já usada por
// `useSelectedProductDetails` (`EstoqueInicial/useOpeningBalanceForm.tsx`,
// TASK-FE-1043): buscar o detalhe completo (`GET /products/{uuid}`, já expõe
// `measurement`/`measurement_second`) quando o produto é selecionado, e
// montar as até-2 opções do Select de unidade a partir daí. NÃO é mock — é
// reuso de endpoint real já confirmado em produção.
//
// Chave própria `['food-product-measurement-options', productUuid]` — NÃO
// reaproveita `queryKey.products.product` (mesmo racional de
// `useSelectedProductDetails`: evita colidir invalidação entre o cache do
// CRUD de Produto e este enriquecimento pontual do módulo Food).
// -----------------------------------------------------------------------------

import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';

import { getProduct } from '@/services/v2/Products/product-service';

import type { Option } from '@/@types/option';
import type { ProductData, ProductMeasurementRef } from '@/@types/v2/Products';

export function useProductMeasurementOptions(productUuid: string | null | undefined) {
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

  // Até 2 opções (`measurement`/`measurement_second`), filtrando `null` —
  // Doc Bruta Food regra 12. Nunca mais que 2 (contrato do Product).
  const options: Option<string>[] = useMemo(() => {
    const product = query.data;
    if (!product) return [];

    return [product.measurement, product.measurement_second]
      .filter((measurement): measurement is ProductMeasurementRef => !!measurement)
      .map((measurement) => ({ label: measurement.description, value: measurement.uuid }));
  }, [query.data]);

  return {
    options,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
  };
}
