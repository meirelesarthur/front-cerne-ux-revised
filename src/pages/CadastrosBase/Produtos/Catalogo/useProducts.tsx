// src/pages/CadastrosBase/Produtos/Catalogo/useProducts.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo de PRODUTOS (Catálogo) — mesmo padrão de
// Embalagens/usePackages.tsx (CRUD-por-GUID + guard de fazenda ativa):
//   - useProductsList → useCustomGridQuery (listagem, SEM ID de contexto)
//   - useProductForm  → useCustomFormQueryByGuid (detalhe por UUID)
//
// `enabled` é o guard de farm ativa (`usePermissions().hasFarm`, mesmo
// padrão de `usePackagesList`/`TenantParameters`) — Product está dentro do
// bloco `farm.context` ESTRITO (Product-contrato.md §8, "X-Farm-Id
// obrigatório em todas as rotas de Product"), mesmo a visibilidade sendo
// tenant-wide (não farm-scoped) — o header ainda é exigido pelo middleware
// de rota. Evita disparar o GET sem fazenda ativa selecionada (403).
//
// Cascata Grupo→Categoria→Classe do FILTRO (drawer) é responsabilidade de
// `TASK-FE-502` (achatamento de `ProductFilterForm` → `ProductFilterRequest`
// fica na própria tela, mesmo padrão de `useProviderList`/`ProviderFilterForm`
// — este hook só repassa o filtro já achatado ao `useCustomGridQuery`).
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useMutation, useQuery } from '@tanstack/react-query';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import { listPackageOptions } from '@/services/v2/Packages/package-service';
import { getProduct, listProducts } from '@/services/v2/Products/product-service';
import type { ListProductsParams } from '@/services/v2/Products/product-service';
import { getTaxRuleFiscalDefaults } from '@/services/v2/TaxRules/tax-rule-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type { PackageOption } from '@/@types/v2/Packages';
import type { ProductData, ProductListItem } from '@/@types/v2/Products';

interface UseProductsListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: ListProductsParams;
  /** Guard de fazenda ativa (`farm.context` estrito, ver cabeçalho do arquivo). */
  enabled: boolean;
}

// Query de listagem paginada de Produtos (`GET /products`, filtros
// `search`/`group_uuid`/`category_uuid`/`kind_uuid`/`has_lot`/`is_equipment`
// já achatados pela tela — `TASK-FE-502`).
export function useProductsList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
  enabled,
}: UseProductsListProps) {
  return useCustomGridQuery<ProductListItem, ListProductsParams>({
    asyncFunction: listProducts,
    queryKey: queryKey.products.productsList,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as ListProductsParams),
    enabled,
  });
}

interface UseProductFormProps {
  registrationId?: string;
  fillForm: (data: ProductData, resetForce?: boolean) => void;
  /** Guard de fazenda ativa — ver cabeçalho do arquivo. */
  enabled: boolean;
}

// Query de detalhe (formulário de edição/tela de detalhe) — mesmo guard de
// fazenda ativa da listagem. Mesmo truque de `usePackageForm`:
// `useCustomFormQueryByGuid` não aceita um `enabled` externo — quando
// `enabled` é `false`, `registrationId` vira `undefined` antes do hook
// compartilhado (`isValidGuid` falha, a query nem dispara).
export function useProductForm({ registrationId, fillForm, enabled }: UseProductFormProps) {
  return useCustomFormQueryByGuid<ProductData>({
    registrationId: enabled ? registrationId : undefined,
    queryKey: queryKey.products.product,
    asyncFunction: getProduct,
    fillForm,
  });
}

// Fonte do `CheckboxListField` de `product_package_uuids` (Aba 2, TASK-FE-504
// — `ProdutoEstoqueFinanceiroTab.tsx`) — mirror EXATO de
// `ContasBancarias/useAccounts.tsx::useFarmsList` (`useQuery` sobre um
// service que devolve o array PRONTO, sem paginação real, busca CLIENT-SIDE
// no próprio componente). Guard de fazenda ativa é responsabilidade do
// CHAMADOR (`enabled`) — `product-packages/options` está dentro do bloco
// `farm.context` ESTRITO (Product-contrato.md §17.2/PackageOptionsRequest).
//
// CORREÇÃO (ERRO-FE-018): a chave era literal `['products', 'package-options']`,
// nunca invalidada por nenhuma mutation de Embalagem — Embalagem recém-criada
// só aparecia aqui depois do `staleTime` de 5min expirar (ou F5). Agora usa
// `queryKey.packages.options` ('packages-options'), a MESMA chave que as 3
// mutations de Package (criar/editar/excluir, `CreateOrUpdateEmbalagem.tsx` +
// `Embalagens/index.tsx`) passam como `queryKey3` ao `useRequest` — que invalida
// via `client.invalidateQueries({ queryKey: [queryKey3] })`, ou seja
// `['packages-options']`, IDÊNTICO ao array de 1 elemento usado abaixo.
export function usePackageOptionsList(enabled: boolean) {
  return useQuery<PackageOption[]>({
    queryKey: [queryKey.packages.options],
    queryFn: listPackageOptions,
    staleTime: 5 * 60 * 1000,
    retry: false,
    enabled,
  });
}

// Autofill fiscal (TASK-FE-950, `change` do Select `tax_rule_uuid`) — mutation
// bespoke, não `useRequest` (mensagens fixas de sucesso do enum `typesRequest`
// não nomeiam bem "35 campos preenchidos automaticamente") nem `useQuery`
// (fetch IMPERATIVO disparado por um evento discreto — seleção no Select —,
// não uma leitura declarativa derivada de estado renderizado; sem chave de
// cache que faça sentido reusar entre seleções, ver justificativa completa em
// `TASK-FE-950`). `onSuccess`/`onError`/toast ficam no CALL SITE
// (`ProdutoEstoqueFinanceiroTab.tsx`), para reaproveitar `languageGB`/
// `toaster` já importados lá — este hook fica fino, só a chamada HTTP.
export function useTaxRuleFiscalDefaultsAutofill() {
  return useMutation({
    mutationFn: (taxRuleUuid: string) => getTaxRuleFiscalDefaults(taxRuleUuid),
  });
}
