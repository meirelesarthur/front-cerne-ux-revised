// src/pages/Financeiro/MovCaixaBancario/obligation-draft.ts
// -----------------------------------------------------------------------------
// UT-000796 r2 (F-113 Mov. Caixa/Bancário) — "Gera Obrigação": rascunho do
// título (Conta a Pagar/Receber) que o servidor devolve em
// `data.generated_obligation_draft` quando Tp. Categoria = F e type in [E,S].
//
// Módulo PURO (sem React, sem UI, sem i18n). O acesso a `sessionStorage` fica
// isolado em funções com try/catch (janela privada/bloqueado → no-op; o
// rascunho então viaja só pelo `state` de rota).
//
// Nomenclatura invertida do legado: Entrada (E) gera Conta a PAGAR
// (fornecedor); Saída (S) gera Conta a RECEBER (cliente). O front NÃO decide
// isso: segue `draft.type` devolvido pela API.
//
// Fontes do rascunho na tela de destino:
//   1. `location.state.movementObligationDraft` — atalho do 1º paint;
//   2. sessionStorage `gb:movement-obligation-draft:<movement_uuid>` — fonte
//      da verdade no refresh (escopo por aba, TTL 2 h);
//   3. `?fromMovement=<uuid>` — ponteiro que permanece na URL.
// O servidor revalida tudo no POST (tenant, tipo, regras R1-R4): o front
// nunca confia no ponteiro.
// -----------------------------------------------------------------------------

import { isValidGuid } from '@/utils/guid';

import type { MovementGeneratedObligationDraft } from '@/@types/v2/Movements';

export type ObligationKind = 'expense' | 'income';

export interface ObligationDraftNavigationState {
  movementObligationDraft?: MovementGeneratedObligationDraft;
}

export const OBLIGATION_DRAFT_QUERY_PARAM = 'fromMovement';
export const OBLIGATION_DRAFT_TTL_MS = 2 * 60 * 60 * 1000;
const STORAGE_PREFIX = 'gb:movement-obligation-draft:';

export interface ObligationDestination {
  path: string;
  /** Permissão exigida para abrir a tela de destino. */
  permission: string;
}

// Destino conforme `draft.type` (NUNCA pelo tipo do movimento).
export function resolveObligationDestination(
  draft: Pick<MovementGeneratedObligationDraft, 'type'>
): ObligationDestination {
  return draft.type === 'income'
    ? { path: '/financeiro/receber/novo', permission: 'incomes_create' }
    : { path: '/financeiro/pagar/novo', permission: 'expenses_create' };
}

// URL + state para `navigate()`.
export function buildObligationNavigation(draft: MovementGeneratedObligationDraft): {
  to: { pathname: string; search: string };
  state: ObligationDraftNavigationState;
} {
  return {
    to: {
      pathname: resolveObligationDestination(draft).path,
      search: `?${OBLIGATION_DRAFT_QUERY_PARAM}=${draft.movement_uuid}`,
    },
    state: { movementObligationDraft: draft },
  };
}

interface StoredDraft {
  savedAt: number;
  draft: MovementGeneratedObligationDraft;
}

function getStorage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.sessionStorage : null;
  } catch {
    return null;
  }
}

export function persistObligationDraft(
  draft: MovementGeneratedObligationDraft,
  now: number = Date.now()
): void {
  if (!isValidGuid(draft?.movement_uuid)) return;
  try {
    const stored: StoredDraft = { savedAt: now, draft };
    getStorage()?.setItem(`${STORAGE_PREFIX}${draft.movement_uuid}`, JSON.stringify(stored));
  } catch {
    // storage indisponível/cheio: o rascunho viaja só pelo `state` de rota.
  }
}

export function clearObligationDraft(movementUuid: string | null | undefined): void {
  if (!movementUuid) return;
  try {
    getStorage()?.removeItem(`${STORAGE_PREFIX}${movementUuid}`);
  } catch {
    // no-op
  }
}

// Valida shape + uuid + coerência draft.type × kind da tela. Qualquer falha →
// false. `expectedUuid` (ponteiro da URL), quando informado, deve bater com o
// `movement_uuid` do rascunho.
export function isUsableObligationDraft(
  value: unknown,
  kind: ObligationKind,
  expectedUuid?: string | null
): value is MovementGeneratedObligationDraft {
  if (!value || typeof value !== 'object') return false;
  const draft = value as Partial<MovementGeneratedObligationDraft>;
  if (draft.type !== kind) return false;
  if (!isValidGuid(draft.movement_uuid)) return false;
  if (expectedUuid != null && draft.movement_uuid !== expectedUuid) return false;
  if (draft.amount === undefined || draft.amount === null || draft.amount === '') return false;
  if (typeof draft.dt_emission !== 'string' || draft.dt_emission.length < 10) return false;
  return true;
}

// Lê o rascunho do storage pelo ponteiro da URL. TTL vencido → apaga e
// devolve null; JSON corrompido/uuid inválido/type incompatível → null.
export function readObligationDraft(
  movementUuid: string | null | undefined,
  kind: ObligationKind,
  now: number = Date.now()
): MovementGeneratedObligationDraft | null {
  if (!isValidGuid(movementUuid)) return null;
  try {
    const raw = getStorage()?.getItem(`${STORAGE_PREFIX}${movementUuid}`);
    if (!raw) return null;
    const stored = JSON.parse(raw) as Partial<StoredDraft>;
    if (typeof stored.savedAt !== 'number' || now - stored.savedAt > OBLIGATION_DRAFT_TTL_MS) {
      clearObligationDraft(movementUuid);
      return null;
    }
    return isUsableObligationDraft(stored.draft, kind, movementUuid) ? stored.draft : null;
  } catch {
    return null;
  }
}

// ---- Mapeamento rascunho → campos do form (puro, sem fetch) -----------------
// Os rótulos dos selects (fornecedor/cliente/proprietário) são resolvidos pelo
// chamador; aqui só uuids e valores crus.

export interface ExpenseObligationPrefill {
  note: string;
  amount: number;
  interest: number;
  dt_emission: string;
  provider_uuid: string | null;
  proprietary_uuid: string | null;
  /** 2 = Indireta (legado L6); editável no form do título. */
  appropriation: number;
  movement_uuid: string;
}

export interface IncomeObligationPrefill {
  note: string;
  amount: number;
  interest: number;
  dt_emission: string;
  client_uuid: string | null;
  proprietary_uuid: string | null;
  movement_uuid: string;
}

const DEFAULT_APPROPRIATION_INDIRECT = 2;

function baseFields(draft: MovementGeneratedObligationDraft) {
  return {
    note: draft.note ?? '',
    amount: Number(draft.amount),
    interest: Number(draft.interest ?? 0),
    dt_emission: String(draft.dt_emission).slice(0, 10),
    proprietary_uuid: draft.proprietary_uuid ?? null,
    movement_uuid: draft.movement_uuid,
  };
}

export function mapObligationDraftToExpenseFields(
  draft: MovementGeneratedObligationDraft
): ExpenseObligationPrefill {
  return {
    ...baseFields(draft),
    provider_uuid: draft.provider_uuid ?? null,
    appropriation: draft.appropriation ?? DEFAULT_APPROPRIATION_INDIRECT,
  };
}

export function mapObligationDraftToIncomeFields(
  draft: MovementGeneratedObligationDraft
): IncomeObligationPrefill {
  return {
    ...baseFields(draft),
    client_uuid: draft.client_uuid ?? null,
  };
}
