// src/@types/v2/Absences/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de REGISTRO DE FALTAS (Absence — Administrativo / Gestão
// Pessoal). CRUD completo (Tarefas 12/13, 97-Esteiras/003). Fonte:
// `frontend-contract-registro-faltas.md` §4 (shape exato de `AbsenceResource`/
// `AbsenceData`), mirror estrutural de `@/@types/v2/Advances` (mesmo par de
// relações employee/event, mesmo envelope paginado real).
//
// `AbsenceDetail` é alias estrutural de `AbsenceListItem` — o backend devolve
// o MESMO shape em `index`/`show`/`store`/`update` (sem eager-load condicional,
// contrato de API §7).
//
// Payload de escrita (`AbsenceData`): `employee_uuid`, `event_uuid`, `date`,
// `amount`, `period` (opcional) — NUNCA `farm_id` (server-derived, R4).
// -----------------------------------------------------------------------------

// ============================================
// RELAÇÕES (whenLoaded — sempre {uuid,name})
// ============================================

export interface AbsenceEmployeeRef {
  uuid: string;
  name: string;
}

export interface AbsenceEventRef {
  uuid: string;
  name: string;
}

// ============================================
// ABSENCE (resposta da API)
// ============================================

export interface AbsenceListItem {
  uuid: string;
  /** 'YYYY-MM-DD'. */
  date: string;
  /** Cast `decimal:2` no Model, exposto como string pelo Resource — sempre
   *  `Number(...)` antes de formatar/editar (mesma armadilha de
   *  `Adiantamento`/`Contrato`). */
  amount: string;
  /** Enum `AbsencePeriod` (1=Matutino, 2=Vespertino, 3=Integral) ou `null`. */
  period: number | null;
  /** Rótulo humano já resolvido pelo backend, ou `null` — NUNCA array
   *  (fecha `GAP-RF-02` por construção). */
  period_label: string | null;
  employee: AbsenceEmployeeRef;
  event: AbsenceEventRef;
  created_at: string;
  updated_at: string;
}

// `AbsenceResource` devolve o mesmo shape em `show`/`store`/`update` que em
// `index` — alias estrutural, mantido como tipo próprio por clareza semântica
// no formulário (mirror `AdvanceDetail`).
export type AbsenceDetail = AbsenceListItem;

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated)
// ============================================

export interface AbsencesApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface AbsencesListEnvelope {
  success: boolean;
  message: string;
  data: AbsenceListItem[];
  errors: Record<string, string[]> | null;
  meta: AbsencesApiPaginationMeta | null;
}

// ============================================
// REQUEST TYPES (payload wire-level — AbsenceData/AbsenceRequest)
// ============================================

// Payload real enviado à API — FULL-RESOURCE-REPLACE (`AbsenceRequest` exige
// os campos `required` em ambos os verbos, contrato de tela §6 — sem
// `sometimes`, nunca um delta de `dirtyFields`, mirror `CreateEventRequest`).
export interface AbsencePayload {
  employee_uuid: string;
  event_uuid: string;
  /** 'YYYY-MM-DD'. */
  date: string;
  amount: number;
  period: number | null;
  // NUNCA no payload: farm_id (server-derived, R4), criador.
}

// ============================================
// REACT HOOK FORM (create/edit)
// ============================================

// Forma INTERNA do form — `period` trafega como STRING (formato do `Select`,
// mirror `EventForm.type`), convertido para `number|null` só no payload
// (`tryPersistAbsence`, checklist item 3 da Tarefa 13).
export interface AbsenceForm {
  date: string;
  employee_uuid: string;
  event_uuid: string;
  /** STRING ('', '1', '2', '3') — '' = "Selecione" (nullable, sem `required`). */
  period: string;
  amount: number | null;
}

// ============================================
// FILTRO (drawer da listagem)
// ============================================

export interface AbsenceFilterForm {
  employee_uuid?: string;
  event_uuid?: string;
  /** Intervalo sobre `date` (data da própria Falta, não `created_at`). */
  start_date?: string;
  end_date?: string;
}
