// src/@types/v2/BaseRegistrations/issueDfeSyncTimes/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de SINCRONIZAÇÃO DFE (IssueDfeSyncTime — Cadastros Base,
// domínio Fiscal). Contrato investigado em
// `01-Arquitetura_e_Contratos/IssueDfeSyncTime-contrato.md` (ciclo 3,
// APROVADO 2026-07-28, v1.2) — TASK-DFE-FE-01 (listagem/exclusão) +
// TASK-DFE-FE-02 (formulário).
//
//   GET    /api/v1/issue-dfe-sync-times                    → data:
//     IssueDfeSyncTimeListItem[] + meta REAL de paginação
//     (ApiResponse::paginated, sem filtro — `## 3` do contrato não documenta
//     nenhum parâmetro de busca em `index()`).
//   GET    /api/v1/issue-dfe-sync-times/eligible-issuers    → data:
//     IssueDfeSyncTimeIssuerRef[], SEM paginação (DA-DFE-06 —
//     `ListEligibleIssuersForSyncAction` devolve a Collection inteira).
//   GET    /api/v1/issue-dfe-sync-times/{uuid}              → data:
//     IssueDfeSyncTimeDetail (mesmo shape flat do ListItem).
//   POST   /api/v1/issue-dfe-sync-times                     → payload
//     IssueDfeSyncTimePayload (create).
//   PUT    /api/v1/issue-dfe-sync-times/{uuid}               → payload
//     IssueDfeSyncTimePayload — SEMPRE completo (`IssueDfeSyncTimeRequest`
//     unificado, `issue_uuid`/`sync_hour` `required` nos dois verbos,
//     DA-DFE-10), nunca delta de `dirtyFields`.
//   DELETE /api/v1/issue-dfe-sync-times/{uuid}               → 204; SEM
//     guarda de dependência (DA-DFE-08 — nenhuma tabela filha real).
//
// `issue_uuid` (payload de escrita) — NUNCA `issue_id` cru (DA-DFE-11,
// addendum pós-execução do contrato de API, Lei de Ferro do fork). Na
// LEITURA, o Resource devolve o objeto `issuer` aninhado ({uuid,
// razao_social}), não um id/uuid solto.
//
// `IssueDfeSyncTime` é recurso TENANT-SCOPED (`IssueDfeSyncTimeTenantScope`,
// DA-DFE-05) — exige header `X-Farm-Id`, já propagado automaticamente pelo
// interceptor axios global (`src/services/api.ts`).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// ISSUE DFE SYNC TIME (resposta da API)
// ============================================

export interface IssueDfeSyncTimeIssuerRef {
  uuid: string;
  razao_social: string;
}

export interface IssueDfeSyncTimeListItem {
  uuid: string;
  issuer: IssueDfeSyncTimeIssuerRef;
  /** Valor cru do Enum (19-23, 0-7) — usado para reconstruir a Option no form de edição. */
  sync_hour: number;
  /** Rótulo PRONTO do Resource ("19:00"/"07:00"...) — usar direto na coluna da grid. */
  sync_hour_label: string;
  created_at: string;
  updated_at: string;
}

// Mesmo shape flat do ListItem — Resource não adiciona campos extras
// só-de-detalhe (mesmo racional de `LowReasonData = LowReasonListItem`).
export type IssueDfeSyncTimeDetail = IssueDfeSyncTimeListItem;

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated — REAL)
// ============================================

export interface IssueDfeSyncTimesApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface IssueDfeSyncTimesListEnvelope {
  success: boolean;
  message: string;
  data: IssueDfeSyncTimeListItem[];
  errors: Record<string, string[]> | null;
  meta: IssueDfeSyncTimesApiPaginationMeta | null;
}

// ============================================
// REQUEST TYPES (TASK-DFE-FE-02)
// ============================================

// Payload de escrita — `issue_uuid` (NUNCA `issue_id` cru, DA-DFE-11).
export interface IssueDfeSyncTimePayload {
  issue_uuid: string;
  sync_hour: number; // 19-23 ou 0-7 — ver SYNC_HOUR_OPTIONS em CreateOrUpdateIssueDfeSyncTimes.tsx
}

// ============================================
// REACT HOOK FORM (TASK-DFE-FE-02)
// ============================================

export interface IssueDfeSyncTimeForm {
  /** SelectCombobox (busca client-side, endpoint não-paginado — achado #1/#2 da Tarefa). */
  issue_uuid: Option<string> | null;
  /** Select ESTÁTICO (Chakra) — 13 valores hardcoded, não vem de API. */
  sync_hour: Option<number> | null;
}
