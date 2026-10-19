// src/@types/v2/BaseRegistrations/grazings/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo Pastejo (Grazing) — API v1 do backend Laravel GB.Cerne.
// TASK-GZ-FE-01 (fundação de dados + listagem + exclusão bloqueada).
//
// Contrato (envelope ApiResponse { success, message, data, errors, meta }):
//   GET    /grazings           → data: GrazingListItem[], meta REAL
//                                 (`ApiResponse::paginated`, 10/página default,
//                                 ordenado por `code desc`).
//   GET    /grazings/{uuid}    → data: GrazingData (inclui `areas[]`).
//   POST   /grazings           → payload GrazingPayload (create) — consumido
//                                 só por TASK-GZ-FE-02/03.
//   PUT    /grazings/{uuid}    → payload GrazingPayload (update) — idem.
//   DELETE /grazings/{uuid}    → 204; 422 estruturado (`errors.in_use.{tabela}`,
//                                 até 13 chaves possíveis) — Grazing-contrato.md
//                                 `## 1` DA-GZ-10.
//
// Campos que a API NÃO retorna nesta rodada — NUNCA declarar aqui:
// `animal_load_ua_hec` (G8 ABERTO, decisão do dono pendente), `period_id`,
// `coordinates`, `batches.animals`. `uuid` sempre; `id` sequencial nunca.
//
// `employee` SAIU do módulo (TASK-PES-PAS-FE, decisão do dono 2026-10-08):
// `GrazingResource` devolve `user {uuid, name}` (quem cadastrou, readonly no
// formulário) e `GrazingRequest` ignora `employee_uuid`. `user` pode vir
// `null` (linhas sem `user_id`) — consumidores usam `?.`.
//
// Fonte: `Grazing-contrato.md` (API, v1.3 APROVADO) + `Grazing-FrontEnd-contrato.md`
// (tela, APROVADO 2026-08-04), `TASK-GZ-FE-01`.
// -----------------------------------------------------------------------------

// ============================================
// GRAZING (resposta da API)
// ============================================

export interface GrazingListItem {
  uuid: string;
  code: string;
  description: string;
  fodder: { uuid: string; description: string } | null;
  date: string;
  color: string;
  control_productivity: boolean;
  areas_count: number;
  areas_sum_total_area: number;
  user: { uuid: string; name: string | null } | null;
}

// Shape do detalhe (`GET /grazings/{uuid}`) — mesmos campos do índice mais os
// `areas[]` referenciados (consumido de fato só pelo formulário/mapa,
// TASK-GZ-FE-02/03; fundação compartilhada criada aqui).
export type GrazingData = GrazingListItem & {
  areas: Array<{ uuid: string; description: string }>;
};

// ============================================
// REQUEST TYPES (consumidos só por TASK-GZ-FE-02/03)
// ============================================

export interface GrazingPayload {
  description: string;
  fodder_uuid: string;
  date: string;
  color: string;
  control_productivity: boolean;
  areas: string[];
}

// ============================================
// REACT HOOK FORM (consumido pela Tarefa irmã TASK-GZ-FE-02) — aditivo,
// FE-01 não criou este tipo apesar de listado em
// `Grazing-FrontEnd-contrato.md ## 3`; adicionado aqui (mesmo arquivo,
// sem tocar nos tipos acima) por ser a fundação de dados natural do form.
// ============================================

export interface GrazingForm {
  uuid?: string;
  description: string;
  fodder_uuid: string;
  date: string;
  color: string;
  control_productivity: boolean;
  areas: string[];
}

// ============================================
// ENVELOPE (ApiResponse::paginated — paginação REAL, 10/página default,
// ordenado por `code desc`)
// ============================================

export interface GrazingsListEnvelope {
  success: boolean;
  message: string;
  data: GrazingListItem[];
  errors: Record<string, string[]> | null;
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
  };
}

// Sem filtro (legado não tem busca, `Grazing-Doc-Bruta.md §7` item 1) — NÃO
// declarar `search`/etc. aqui. Params da listagem são só `page`/`per_page`
// (`PaginationQueryParams`, `@/@types/pagination`).

/** `GET /grazings/options` (UT-000795) — `GrazingOptionResource {uuid, description}`.
 *  FLAT, sem paginação. */
export interface GrazingOption {
  uuid: string;
  description: string;
}

export interface GrazingOptionsListEnvelope {
  success: boolean;
  message: string;
  data: GrazingOption[];
  errors: Record<string, string[]> | null;
  meta: null;
}
