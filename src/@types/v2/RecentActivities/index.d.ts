// src/@types/v2/RecentActivities/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo ATIVIDADES RECENTES (UT-000690 / F-349 — Administrativo).
// Fonte: ARQ-API-UT690 v1.1 §4.1 (`GET /recent-activities`) e §4.2
// (`GET /recent-activities/types`). Tela SOMENTE LEITURA.
//
// `RecentActivityType` mora em `@/constants/RecentActivities/recent-activity-type`
// (união dos 19 tipos ativos, derivada do `as const`).
// -----------------------------------------------------------------------------

import type { RecentActivityType } from '@/constants/RecentActivities/recent-activity-type';

export type { RecentActivityType };

export interface RecentActivityFarmRef {
  uuid: string;
  name: string;
}

/** Origem do status do item (ARQ-API-UT690 v1.2 §4.1 / D-092-13). */
export type RecentActivityStatusSource = 'domain' | 'audit';

export interface RecentActivityStatus {
  source: RecentActivityStatusSource;
  /** domain: valor cru do enum ("1", "O"...); audit: 'created' | 'updated'. */
  code: string;
  /** pt-BR resolvido pela API — fallback do label i18n. */
  label: string;
  /** domain: hex ("#038F59"), nome de cor ("blue") ou null (neutro). */
  color: string | null;
  /** ISO 8601 (UTC) — preenchido só em `audit`. */
  at: string | null;
}

export interface RecentActivityListItem {
  type: RecentActivityType;
  /** Rótulo resolvido pela API — usado só como fallback do label i18n. */
  type_label: string;
  uuid: string;
  /** ISO 8601 (UTC). */
  created_at: string;
  /** Fazenda DONA do registro (pode diferir da fazenda ativa). */
  farm: RecentActivityFarmRef;
  /** Relativo; só para consumo da API (App mobile). A SPA não usa. */
  api_path: string;
  /** Relativo e já resolvido pela API; `null` quando não há tela de visualização. */
  spa_path: string | null;
  /** Sempre presente no item; `null` → a tela mostra "—". */
  status: RecentActivityStatus | null;
}

/** Item de `/recent-activities/types` — `value` pode ser um tipo futuro. */
export interface RecentActivityTypeOption {
  value: RecentActivityType | (string & Record<never, never>);
  label: string;
}

/** Shape EXTERNO do filtro (persistido no `userPaginatedQuery`). */
export interface RecentActivityFilterForm {
  types?: string[];
  /** 'yyyy-MM-dd'. */
  start_date?: string;
  /** 'yyyy-MM-dd'. */
  end_date?: string;
}

export interface RecentActivitiesApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface RecentActivitiesListEnvelope {
  success: boolean;
  message: string;
  data: RecentActivityListItem[];
  errors: Record<string, string[]> | null;
  meta: RecentActivitiesApiPaginationMeta | null;
}

export interface RecentActivityTypesEnvelope {
  success: boolean;
  message: string;
  data: RecentActivityTypeOption[];
  errors: Record<string, string[]> | null;
  meta: null;
}
