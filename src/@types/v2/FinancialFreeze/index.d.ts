// src/@types/v2/FinancialFreeze/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do bounded context "Congelamentos Financeiros" (FinancialFreeze —
// F-110, esteira 97-Esteiras/008, Tarefa 31/32). Mirror estrutural de
// `@/@types/v2/OfxImport` (mesmo formato de cabeçalho/organização) — CRUD já
// migrado e aprovado pelo Tester na camada `api` (mirror da instrução
// explícita do contrato de tela §4).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /financial-freezes            → data: FinancialFreezeListItem[],
//                                           meta paginação REAL.
//   GET    /financial-freezes/{uuid}      → data: FinancialFreezeDetail
//                                           (ÚNICO verbo que traz `movements`
//                                           junto com o `PUT`).
//   POST   /financial-freezes             → 201, data: FinancialFreezeListItem
//                                           (SEM `movements`).
//   PUT    /financial-freezes/{uuid}      → 200, data: FinancialFreezeDetail
//                                           (COM `movements` atualizados).
//   DELETE /financial-freezes/{uuid}      → 204, hard delete.
//
// `month_label` do servidor é PT-BR fixo (Enum PHP) — armadilha de i18n
// confirmada no FID-G3F §1/§5. NÃO consumir: o rótulo de `month` é derivado
// no front via `financialFreezeMonthOptions.getLabel(month, languageGB)`
// (`@/constants/Financial/FinancialFreeze/options/financial-freeze-month-options`).
//
// `year` é `string` de 4 dígitos (coluna `varchar(4)`, AD-08) — NUNCA
// convertida para `number` no front (round-trip trivial, sem
// `transformStringToNumber`).
//
// `created_at`/`updated_at` chegam em ISO UTC (`toISOString()`) — formatar SEMPRE
// via `@/utils/formatDate` (date-fns `parseISO` interno), nunca
// `new Date(...).toLocaleDateString` manual.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

/** Linha da grid — espelha `FinancialFreezeResource` SEM `movements` (o
 *  `index()` não carrega a relação). */
export interface FinancialFreezeListItem {
  uuid: string;
  /** 1..12. */
  month: number;
  /** PT-BR fixo do Enum PHP — NÃO consumir (armadilha de i18n, ver cabeçalho). */
  month_label: string | null;
  /** 4 dígitos, string (`varchar(4)`) — nunca converter para number. */
  year: string;
  is_frozen: boolean;
  /** `user.people?.name` — pode vir `null`. */
  responsible_name: string | null;
  /** ISO UTC. */
  created_at: string;
  /** ISO UTC. */
  updated_at: string;
}

/** Detalhe (`GET /{uuid}` e resposta do `PUT`) — mesmo shape + subcadastro
 *  read-only. NUNCA presente na resposta do `POST`. */
export interface FinancialFreezeDetail extends FinancialFreezeListItem {
  movements: FinancialFreezeMovementRow[];
}

/** Trilha de auditoria (`FinancialFreezeMovementResource`) — read-only, sem
 *  identificador (AD-05). Ordem como vem do servidor (cronológica
 *  ascendente — o Repository não impõe `orderBy`). */
export interface FinancialFreezeMovementRow {
  is_frozen: boolean;
  responsible_name: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// REACT HOOK FORM (shape RHF do form create/edit/visualizar, Tarefa 32)
// ============================================

/** Estado do react-hook-form. Selects SEMPRE `Option<T>` (Lei 1). */
export interface FinancialFreezeForm {
  month: Option<number> | null;
  /** String de 4 dígitos — NÃO converter para number (AD-08). */
  year: string;
  is_frozen: Option<boolean> | null;
}

// ============================================
// PAYLOAD DE ESCRITA (POST/PUT) — primitivos, `.value` já extraído.
// ============================================

export interface FinancialFreezePayload {
  month: number;
  year: string;
  is_frozen: boolean;
}

// ============================================
// FILTRO (Tarefa 31) — já em primitivos (o drawer converte Option<T> no onSubmit).
// ============================================

export interface FinancialFreezeFilterRequest {
  month?: number;
  year?: string;
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated — GET /financial-freezes)
// ============================================

export interface FinancialFreezesListEnvelope {
  success: boolean;
  message?: string;
  data: FinancialFreezeListItem[];
  errors: Record<string, string[]> | null;
  meta?: {
    current_page: number;
    /** `last_page`, NÃO `total_pages` — mapear no adaptador do service. */
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
  };
}
