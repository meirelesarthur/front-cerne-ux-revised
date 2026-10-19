// src/@types/v2/Functions/index.d.ts
// -----------------------------------------------------------------------------
// Tipos MÍNIMOS do catálogo de Função/CBO (Functions) — usado só para popular
// o `SelectAsyncPaginate` do campo `employee.function_uuid` no wizard de
// Pessoas (TASK-FE-300/303). NÃO é o CRUD completo de Função/CBO (módulo
// futuro, fora de escopo — GAP-BE-040 Opção B).
//
// Fonte: `app/Http/Controllers/Api/V1/FunctionController.php` +
// `app/Http/Resources/V1/FunctionOptionResource.php` (api_root, TASK-BE-332).
//   GET /api/v1/functions/options → data: FunctionOption[], meta REAL
//     (ApiResponse::paginated). Sem `permission:` própria — qualquer usuário
//     autenticado (auth:sanctum) consome. `search`/`per_page` aceitos.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

export interface FunctionOption {
  uuid: string;
  name: string;
}

export interface FunctionOptionsApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface FunctionOptionsListEnvelope {
  success: boolean;
  message: string;
  data: FunctionOption[];
  errors: Record<string, string[]> | null;
  meta: FunctionOptionsApiPaginationMeta | null;
}

// -----------------------------------------------------------------------------
// CRUD completo (TASK-FN-FE-01/02) — ADICIONADO, `FunctionOption`/
// `FunctionOptionsApiPaginationMeta`/`FunctionOptionsListEnvelope` acima
// continuam INTOCADOS (exclusivos do wizard de Pessoas, TASK-FE-300/303).
//
// Fonte: `Funcoes-contrato.md` (v1.1, APROVADO) §4 (Endpoints), §5.7
// (Resource), §7 (Matriz de Erros).
// -----------------------------------------------------------------------------

export interface FunctionListItem {
  uuid: string;
  name: string;
  description: string;
  cbo: { uuid: string; code: string; description: string };
  base_salary: string; // decimal:2 do backend, string numérica
  monthly_hours: number;
  vl_time_productive: string; // calculado no servidor
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// `FunctionResource` devolve o mesmo shape em `show`/`store`/`update` que em
// `index` (Seção 5.7 do contrato de API) — `FunctionDetail` é um alias
// estrutural de `FunctionListItem`, mantido como tipo próprio por clareza
// semântica no formulário (Tarefa irmã TASK-FN-FE-02).
export type FunctionDetail = FunctionListItem;

// ============================================
// FILTRO (drawer da listagem)
// ============================================

export interface FunctionFilterForm {
  /** Busca por `name` (DA-FN-15 — rótulo pode dizer "Buscar", filtro real é sobre `name`). */
  search?: string;
  is_enabled?: 'true' | 'false';
  cbo_uuid?: string;
  /** Display-only (checklist item 13) — companheiro do `SelectAsyncPaginate` de `cbo_uuid`, NUNCA vai ao payload. */
  cbo_uuid_label?: string;
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated)
// ============================================

export interface FunctionsApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface FunctionsListEnvelope {
  success: boolean;
  message: string;
  data: FunctionListItem[];
  errors: Record<string, string[]> | null;
  meta: FunctionsApiPaginationMeta | null;
}

// ============================================
// FORMULÁRIO create/edit (TASK-FN-FE-02)
// ============================================

// Forma INTERNA do form RHF — `cbo_uuid` guarda o `Option{label,value}`
// inteiro (a extração do `.value` para o payload acontece só na tela,
// `tryPersistFunction`). `vl_time_productive` NUNCA entra aqui — não é campo
// RHF (calculado no servidor, DA-FN-08, só exibido via `InputReadOnly`).
export interface FunctionForm {
  name: string;
  // Nullable — `SelectAsyncPaginate` controlado por RHF precisa de `null`
  // explícito (checklist item 3, `value={field.value ?? null}`, NUNCA
  // `?? undefined`) antes da primeira seleção/no `defaultValues`.
  cbo_uuid: Option<string> | null;
  base_salary: number;
  /** NumberInput controlado — number | null enquanto vazio (mirror `PackageForm.size`). */
  monthly_hours: number | null;
  is_enabled: boolean;
  description: string;
}

// Payload real enviado à API — `cbo_uuid` já extraído para string (uuid),
// full-resource-replace (checklist item 3 — `FunctionRequest` exige todos os
// campos `required` em ambos `store`/`update`, nunca um PATCH parcial via
// `dirtyFields`).
export interface CreateFunctionRequest {
  name: string;
  cbo_uuid: string;
  base_salary: number;
  monthly_hours: number;
  is_enabled: boolean;
  description: string;
}

// Mesmo shape do create — full-resource-replace (`FunctionRequest` unificado
// store+update, `Funcoes-contrato.md` §5.2).
export type UpdateFunctionRequest = CreateFunctionRequest;
