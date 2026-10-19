// src/@types/v2/Ncms/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do catálogo de NCM (`Ncm` — legado, `app/Ncm.php`). Consumido como
// lookup de apoio pelo campo `ncm_uuid` do formulário de Produto
// (`TASK-FE-503`/`TASK-FE-762`), via o endpoint `GET /ncms/options`.
//
// ⚠️ ACHADO/DECISÃO (não é mock): a tabela `ncms` tem 10.678 linhas — o
// contrato exige busca OBRIGATÓRIA (`min:3`) e paginação (ver nota de
// `listNcmOptions` no service). Shape CONFIRMADO (não é mais presunção) por
// leitura direta de `NcmOptionResource.php` REAL (`api_root`) — devolve
// `{uuid, code, description}`, SEM `id` numérico (Lei 10, `Ncm` já migrado
// com `uuid` NOT NULL UNIQUE, `GAP-BE-235`). Também CONFIRMADO o shape do
// bloco aninhado devolvido por `GET /products/{product}` — `TASK-BE-610`
// (✅ CONCLUÍDO, commit `e5ed99bdd`) fez o `ProductResource` expor
// `ncm: {uuid, code, description} | null`, consumido por `ProductData.ncm`
// (`@types/v2/Products/index.d.ts`) e hidratado em `fillForm`
// (`CreateOrUpdateProduto.tsx`, `TASK-FE-990`).
//
// `GAP-BE-660` (execução 034/035, ✅ CONCLUÍDO): `ncm_id` DEIXOU de ser
// exceção a "FK sempre por uuid" — o endpoint de Produto passou a aceitar
// `ncm_uuid` na ENTRADA (resolvido para o id interno pelo backend,
// `resolveGlobalUuid`) e `ProductResource` não expõe mais `ncm_id` cru na
// SAÍDA (Lei 10). O `uuid` abaixo é o MESMO valor guardado/enviado pelo
// Select de NCM do formulário de Produto (`TASK-FE-762`).
// -----------------------------------------------------------------------------

export interface NcmOption {
  uuid: string;
  /** Código NCM (ex.: "0201.10.00") — usado para compor o `label` junto da
   *  descrição, mesma convenção de `CostCenter`/`Grouper`
   *  (`${code} — ${description}`). */
  code?: string;
  description: string;
}

export interface NcmOptionsApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface NcmOptionsEnvelope {
  success: boolean;
  message: string;
  data: NcmOption[];
  errors: Record<string, string[]> | null;
  meta: NcmOptionsApiPaginationMeta | null;
}
