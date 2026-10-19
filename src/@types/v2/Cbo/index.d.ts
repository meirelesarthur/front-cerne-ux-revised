// src/@types/v2/Cbo/index.d.ts
// -----------------------------------------------------------------------------
// Tipos MÍNIMOS do catálogo de Cbo (código de ocupação, escopo mínimo de
// lookup — DA-FN-05, `Funcoes-contrato.md`) — usado só para popular o
// `SelectAsyncPaginate` de `cbo_uuid` no filtro/formulário de Função
// (TASK-FN-FE-01/02). NÃO é o CRUD administrativo completo de CBO (módulo
// futuro, fora de escopo).
//
// Fonte: `app/Http/Controllers/Api/V1/CboController.php` +
// `app/Http/Resources/V1/CboOptionResource.php` (api_root, DA-FN-05).
//   GET /api/v1/cbos/options → data: CboOption[], meta REAL
//     (ApiResponse::paginated). Sem `permission:` própria — mirror exato de
//     `functions/options` (auth:sanctum, sem farm.context). `search`/
//     `per_page` aceitos.
// -----------------------------------------------------------------------------

export interface CboOption {
  uuid: string;
  code: string;
  description: string;
}

export interface CboOptionsApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface CboOptionsListEnvelope {
  success: boolean;
  message: string;
  data: CboOption[];
  errors: Record<string, string[]> | null;
  meta: CboOptionsApiPaginationMeta | null;
}
