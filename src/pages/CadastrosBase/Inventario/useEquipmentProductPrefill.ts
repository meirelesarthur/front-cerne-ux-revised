// src/pages/CadastrosBase/Inventario/useEquipmentProductPrefill.ts
// -----------------------------------------------------------------------------
// UT-000781 — pré-seleção do Produto no cadastro de Inventário novo.
//
// O pós-salvar do Produto (equipamento = Sim) navega para
// `/cadastros-base/inventario/novo?product_uuid=<uuid>`. Este hook lê o
// parâmetro (SÓ em criação e SÓ com GUID válido), busca o produto por
// TanStack Query (`getProduct`) e devolve a opção `{ label, value }` no mesmo
// formato do `mapOptions` do select de Produto do Inventário.
//
// Falhas (404/403, produto que não é equipamento, GUID inválido) NÃO geram
// erro de tela: o hook devolve `null` e o campo segue vazio. Não faz `reset`
// (Lei 2): quem consome aplica um único `setValue`.
// -----------------------------------------------------------------------------

import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';

import { usePermissions } from '@/hooks/usePermissions';

import { isValidGuid } from '@/utils/guid';

import { queryKey } from '@/constants/query-key';

import { getProduct } from '@/services/v2/Products/product-service';

import type { Option } from '@/@types/option';

export function useEquipmentProductPrefill(isEditing: boolean): Option | null {
  const [searchParams] = useSearchParams();
  const { hasFarm } = usePermissions();

  const rawUuid = searchParams.get('product_uuid');
  const productUuid = !isEditing && isValidGuid(rawUuid) ? (rawUuid as string) : '';

  const query = useQuery({
    queryKey: [queryKey.products.product, 'equipment-prefill', productUuid],
    enabled: !!productUuid && hasFarm,
    retry: false,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const response = await getProduct(productUuid);
      return response.data;
    },
  });

  const product = query.data;
  if (!product || !product.is_equipment) return null;

  return {
    label: `${product.code} — ${product.description}`,
    value: product.uuid,
  };
}
