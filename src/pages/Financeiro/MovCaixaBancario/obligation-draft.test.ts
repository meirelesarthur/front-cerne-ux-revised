// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { MovementGeneratedObligationDraft } from '@/@types/v2/Movements';

import {
  OBLIGATION_DRAFT_TTL_MS,
  buildObligationNavigation,
  clearObligationDraft,
  isUsableObligationDraft,
  mapObligationDraftToExpenseFields,
  mapObligationDraftToIncomeFields,
  persistObligationDraft,
  readObligationDraft,
  resolveObligationDestination,
} from './obligation-draft';

const MOVEMENT_UUID = '019f62a6-1111-7023-8abc-0123456789ab';

function buildDraft(over: Partial<MovementGeneratedObligationDraft> = {}) {
  return {
    type: 'expense',
    note: 'Financiamento trator',
    amount: '1500.50',
    provider_uuid: '019f62a6-2222-7023-8abc-0123456789ab',
    client_uuid: null,
    proprietary_uuid: '019f62a6-3333-7023-8abc-0123456789ab',
    interest: '10.00',
    dt_emission: '2026-10-15',
    movement_uuid: MOVEMENT_UUID,
    appropriation: 2,
    ...over,
  } as MovementGeneratedObligationDraft;
}

beforeEach(() => window.sessionStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe('resolveObligationDestination', () => {
  it('expense -> Nova Conta a Pagar; income -> Nova Conta a Receber (segue draft.type)', () => {
    expect(resolveObligationDestination({ type: 'expense' })).toEqual({
      path: '/financeiro/pagar/novo',
      permission: 'expenses_create',
    });
    expect(resolveObligationDestination({ type: 'income' })).toEqual({
      path: '/financeiro/receber/novo',
      permission: 'incomes_create',
    });
  });
});

describe('buildObligationNavigation', () => {
  it('monta pathname + ?fromMovement=<uuid> e state com o rascunho', () => {
    const draft = buildDraft();
    const { to, state } = buildObligationNavigation(draft);
    expect(to).toEqual({
      pathname: '/financeiro/pagar/novo',
      search: `?fromMovement=${MOVEMENT_UUID}`,
    });
    expect(state.movementObligationDraft).toBe(draft);
  });
});

describe('persist/read/clear + TTL', () => {
  it('round-trip pelo sessionStorage real', () => {
    const draft = buildDraft();
    persistObligationDraft(draft);
    expect(readObligationDraft(MOVEMENT_UUID, 'expense')).toEqual(draft);
    clearObligationDraft(MOVEMENT_UUID);
    expect(readObligationDraft(MOVEMENT_UUID, 'expense')).toBeNull();
  });

  it('TTL expirado devolve null e apaga a entrada', () => {
    persistObligationDraft(buildDraft(), 1_000);
    const key = `gb:movement-obligation-draft:${MOVEMENT_UUID}`;
    expect(window.sessionStorage.getItem(key)).not.toBeNull();
    expect(
      readObligationDraft(MOVEMENT_UUID, 'expense', 1_000 + OBLIGATION_DRAFT_TTL_MS + 1)
    ).toBeNull();
    expect(window.sessionStorage.getItem(key)).toBeNull();
  });

  it('dentro do TTL ainda lê', () => {
    persistObligationDraft(buildDraft(), 1_000);
    expect(
      readObligationDraft(MOVEMENT_UUID, 'expense', 1_000 + OBLIGATION_DRAFT_TTL_MS)
    ).not.toBeNull();
  });

  it('storage que lança exceção não quebra (persist, read e clear)', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => persistObligationDraft(buildDraft())).not.toThrow();
    expect(readObligationDraft(MOVEMENT_UUID, 'expense')).toBeNull();
    expect(() => clearObligationDraft(MOVEMENT_UUID)).not.toThrow();
  });

  it('JSON corrompido ou uuid de ponteiro malformado devolve null', () => {
    window.sessionStorage.setItem(`gb:movement-obligation-draft:${MOVEMENT_UUID}`, '{nao-json');
    expect(readObligationDraft(MOVEMENT_UUID, 'expense')).toBeNull();
    expect(readObligationDraft('nao-e-uuid', 'expense')).toBeNull();
    expect(readObligationDraft(null, 'expense')).toBeNull();
  });

  it('não persiste rascunho com movement_uuid inválido', () => {
    persistObligationDraft(buildDraft({ movement_uuid: 'xxx' }));
    expect(window.sessionStorage.length).toBe(0);
  });

  it('rascunho do outro tipo (income lido numa tela de Pagar) é ignorado', () => {
    persistObligationDraft(buildDraft({ type: 'income' }));
    expect(readObligationDraft(MOVEMENT_UUID, 'expense')).toBeNull();
    expect(readObligationDraft(MOVEMENT_UUID, 'income')).not.toBeNull();
  });
});

describe('isUsableObligationDraft', () => {
  it('aceita rascunho coerente', () => {
    expect(isUsableObligationDraft(buildDraft(), 'expense')).toBe(true);
    expect(isUsableObligationDraft(buildDraft(), 'expense', MOVEMENT_UUID)).toBe(true);
  });

  it('rejeita uuid malformado, type incompatível, uuid de ponteiro diferente e campos ausentes', () => {
    expect(isUsableObligationDraft(buildDraft({ movement_uuid: 'abc' }), 'expense')).toBe(false);
    expect(isUsableObligationDraft(buildDraft({ type: 'income' }), 'expense')).toBe(false);
    expect(
      isUsableObligationDraft(buildDraft(), 'expense', '019f62a6-9999-7023-8abc-0123456789ab')
    ).toBe(false);
    expect(isUsableObligationDraft(buildDraft({ amount: '' }), 'expense')).toBe(false);
    expect(isUsableObligationDraft(buildDraft({ dt_emission: '' }), 'expense')).toBe(false);
    expect(isUsableObligationDraft(null, 'expense')).toBe(false);
    expect(isUsableObligationDraft('x', 'expense')).toBe(false);
  });
});

describe('mapeadores', () => {
  it('Expense: nota, Number(amount), interest, dt_emission Y-m-d, fornecedor e Indireta', () => {
    const f = mapObligationDraftToExpenseFields(
      buildDraft({ dt_emission: '2026-10-15T00:00:00.000000Z', note: null })
    );
    expect(f).toMatchObject({
      note: '',
      amount: 1500.5,
      interest: 10,
      dt_emission: '2026-10-15',
      provider_uuid: '019f62a6-2222-7023-8abc-0123456789ab',
      appropriation: 2,
      movement_uuid: MOVEMENT_UUID,
    });
  });

  it('Expense sem appropriation no rascunho cai em Indireta (2)', () => {
    expect(
      mapObligationDraftToExpenseFields(buildDraft({ appropriation: undefined })).appropriation
    ).toBe(2);
  });

  it('Income: cliente, sem appropriation, interest nulo vira 0', () => {
    const f = mapObligationDraftToIncomeFields(
      buildDraft({
        type: 'income',
        client_uuid: '019f62a6-4444-7023-8abc-0123456789ab',
        provider_uuid: null,
        interest: null,
      })
    );
    expect(f.client_uuid).toBe('019f62a6-4444-7023-8abc-0123456789ab');
    expect(f.interest).toBe(0);
    expect('appropriation' in f).toBe(false);
  });
});
