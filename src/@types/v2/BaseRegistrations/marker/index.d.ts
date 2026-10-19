// src/@types/v2/BaseRegistrations/marker/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de MARCADORES (Marker) — API v1 do backend Laravel
// GB.Cerne. Fonte batida linha a linha contra `api_root` nesta execução
// (TASK-MK-FE-01):
//   - app/Http/Resources/V1/MarkerResource.php (shape de saída)
//   - app/Http/Requests/Api/V1/MarkerRequest.php (regras de entrada)
//   - app/Http/Controllers/Api/V1/MarkerController.php (ApiResponse::paginated
//     no index(), mesmo padrão de FamilyEquipment/Contador)
//   - app/Actions/Marker/DeleteMarkerAction.php +
//     MarkerRepository::dependencyUsageCounts() — shape REAL de
//     `errors.in_use` confirmado por leitura direta + 16 asserts de
//     `tests/Feature/Api/V1/MarkerTest.php` (GAP-MK-FE-01, [AVALIADO])
//
// Contratos (envelope ApiResponse { success, message, data, errors, meta }):
//   GET    /markers          → data: MarkerListItem[] + meta paginado real (15/página)
//   GET    /markers/{uuid}   → data: MarkerDetail (TASK-MK-FE-02)
//   POST   /markers          → multipart (TASK-MK-FE-02)
//   PUT    /markers/{uuid}   → multipart, method-spoofing _method=PUT (TASK-MK-FE-02)
//   DELETE /markers/{uuid}   → 204; 422 `errors.in_use` (mapa `{tabela: count}`,
//                               até 10 chaves possíveis, múltiplas simultâneas
//                               confirmadas em teste real)
//
// `type` é o enum backed INT (1=Atividade/2=Infraestrutura,
// app/Enums/MarkerTypeEnum.php) — sempre o INTEIRO, nunca o nome do case,
// tanto na leitura quanto na escrita/filtro (armadilha #2 do task-packet).
// -----------------------------------------------------------------------------

// ============================================
// MARKER (resposta da API)
// ============================================

export interface MarkerListItem {
  uuid: string;
  description: string;
  type: 1 | 2;
  type_label: string;
  is_enabled: boolean;
  icon_url: string | null;
}

// `MarkerResource` devolve o mesmo shape em `show`/`store`/`update` que em
// `index` (sem campos adicionais exclusivos de detalhe, diferente de
// FamilyEquipment) — `MarkerDetail` é um alias estrutural de `MarkerListItem`,
// mantido como tipo próprio por clareza semântica no formulário (TASK-MK-FE-02).
export type MarkerDetail = MarkerListItem;

// ============================================
// REQUEST TYPES (TASK-MK-FE-02 — formulário create/edit)
// ============================================

// Payload de escrita (store/update) — sempre montado como FormData
// (multipart), full-resource (checklist item — nunca um delta de
// dirtyFields). `type` é o INTEIRO do enum (1/2), nunca o nome do case.
export interface MarkerPayload {
  description: string;
  is_enabled: boolean;
  type: 1 | 2;
  /** Arquivo novo selecionado nesta sessão — obrigatório no create (DA-MK-17), opcional no update. */
  icon: File | null;
  /** Flag local — vira `remove_icon=1` no FormData quando o usuário clica "Remover ícone" (só no update). */
  removeIcon: boolean;
}

// ============================================
// REACT HOOK FORM (TASK-MK-FE-02)
// ============================================

export interface MarkerFormType {
  description: string;
  is_enabled: boolean;
  type: 1 | 2;
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated) — idêntico ao shape de
// FamilyEquipment/Contador
// ============================================

export interface MarkersApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
  links: {
    first: string | null;
    prev: string | null;
    next: string | null;
    last: string | null;
  };
}

export interface MarkersListEnvelope {
  success: boolean;
  message: string;
  data: MarkerListItem[];
  errors: Record<string, string[]> | null;
  meta: MarkersApiPaginationMeta | null;
}

// ============================================
// FILTRO (drawer da listagem)
// ============================================

export interface MarkerFilterForm {
  /** Busca por descrição (param `search` do backend). */
  search?: string;
  type?: '' | '1' | '2';
  is_enabled?: '' | 'true' | 'false';
}

// ============================================
// EXCLUSÃO BLOQUEADA (422 `errors.in_use`)
// ============================================

// Shape REAL confirmado por leitura direta de `DeleteMarkerAction.php` +
// `MarkerRepository::dependencyUsageCounts()` (`array_filter($counts)`) + 16
// asserts de `MarkerTest.php` (`assertJsonPath('errors.in_use.<tabela>', N)`)
// — mapa `{tabela: count}`, NÃO `Array<{resource, table, count}>` (GAP-MK-FE-01,
// [AVALIADO]). Chaves possíveis: `areas`/`sectors`/`places`/`sub_places`/
// `area_infrastructure`/`sector_infrastructure`/`place_infrastructure`/
// `sub_place_infrastructure`/`activity_cost_centers`/`apportionment_items`
// (até 10, múltiplas simultâneas comprovadas em teste real).
export interface MarkerInUseError {
  errors: { in_use: Record<string, number> };
}
