// src/constants/CategoryProducts/category-product-type.ts
// -----------------------------------------------------------------------------
// Enum de tipo de Categoria de Produto (`category_type` do endpoint
// `GET /products/options`). Mirror EXATO de `App\Enums\CategoryProductType`
// (backend, `int`-backed: INPUT=1/EQUIPMENT=2/PRODUCTION=3) — mesmo valor já
// tipado como `CategoryProductTypeCode` em
// `@/@types/v2/CategoryProducts/category-product.d.ts` (ver nota
// TASK-CP-FE-FIX-02 lá: a API exige o CÓDIGO inteiro, nunca o nome, em
// payloads/filtros de escrita).
//
// Consumido por `ContractItemRow.tsx` (Financeiro/Contrato) para restringir
// o Select de Produto do CONTRATO só a Insumos (`category_type=INPUT`) na
// busca de `listProductOptions`. Constante nomeada — não hardcodear `1` solto
// no componente. `RequestItemRow.tsx` (Administrativo/Solicitação)
// NÃO consome esta constante — mantém paridade legado, todas as categorias.
// -----------------------------------------------------------------------------

import type { CategoryProductTypeCode } from '@/@types/v2/CategoryProducts/category-product';

export const categoryProductType = {
  input: 1,
  equipment: 2,
  production: 3,
} as const satisfies Record<string, CategoryProductTypeCode>;
