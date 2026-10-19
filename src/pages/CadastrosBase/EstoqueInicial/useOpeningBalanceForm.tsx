// src/pages/CadastrosBase/EstoqueInicial/useOpeningBalanceForm.tsx
// -----------------------------------------------------------------------------
// Hooks de query do FORMULÁRIO de ESTOQUE INICIAL (OpeningBalance) — TASK-FE-1043
// (execução 026). Arquivo distinto de `useOpeningBalances.tsx` (listagem,
// TASK-FE-1042, rodando em paralelo nesta mesma pasta — sem colisão de
// arquivo, mirror `Produtos/Catalogo/useProducts.tsx` que também separa
// `useProductsList`/`useProductForm` mas aqui em 2 arquivos por já existir
// um `useOpeningBalances.tsx` da Tarefa irmã):
//   - useOpeningBalanceForm      → useCustomFormQueryByGuid (detalhe por UUID)
//   - useSelectedProductDetails  → enriquecimento do Produto selecionado
//
// `useSelectedProductDetails` — GAP backend `products/options` (contrato de
// tela §7.2/§10) ainda não expõe `has_lot`/`measurement` no lookup enxuto
// (`OpeningBalanceProductRef` = `{uuid, code, description}` apenas). Em vez
// de mockar esses 2 campos, usa o endpoint de DETALHE que JÁ EXISTE (`GET
// /products/{uuid}`, confirmado no contrato de API §10 — `ProductController`
// já implementado, só falta a rota `/options`) como fonte real. Dispara
// sempre que `product_uuid` tem valor (criação E edição) — fonte única de
// verdade para `has_lot` (gate da Zona 3) e `measurement.description`
// (campo readonly da Zona 1), em vez de inferir de sinais indiretos.
// -----------------------------------------------------------------------------

import { useQuery } from '@tanstack/react-query';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';

import { queryKey } from '@/constants/query-key';

import { getOpeningBalance } from '@/services/v2/OpeningBalances/opening-balance-service';
import { getProduct } from '@/services/v2/Products/product-service';

import type { OpeningBalanceDetail } from '@/@types/v2/OpeningBalances';
import type { ProductData } from '@/@types/v2/Products';

interface UseOpeningBalanceFormProps {
  registrationId?: string;
  fillForm: (data: OpeningBalanceDetail, resetForce?: boolean) => void;
}

// Query de detalhe para preencher o formulário de edição (match por GUID) —
// mirror `useWarehouseForm`/`useProductForm`.
export function useOpeningBalanceForm({ registrationId, fillForm }: UseOpeningBalanceFormProps) {
  return useCustomFormQueryByGuid<OpeningBalanceDetail>({
    registrationId,
    queryKey: queryKey.openingBalances.openingBalance,
    asyncFunction: getOpeningBalance,
    fillForm,
  });
}

// Enriquecimento do Produto selecionado — chave própria (não reaproveita
// `queryKey.products.product`, que é a chave usada pelo CRUD de Produto, para
// não colidir invalidação entre os 2 módulos por engano).
export function useSelectedProductDetails(productUuid: string | undefined | null) {
  return useQuery<ProductData>({
    queryKey: ['opening-balance-selected-product-detail', productUuid],
    queryFn: async () => {
      const response = await getProduct(productUuid as string);
      return response.data;
    },
    enabled: !!productUuid,
    staleTime: 60 * 1000,
    retry: false,
  });
}
