// @vitest-environment node
import { describe, expect, it } from 'vitest';

import {
  deriveAllocationCategoryParams,
  deriveFilterCategoryParams,
  deriveMovementFieldState,
  planOnTypeCategoryChange,
  planOnTypeChange,
  resetPlanToOperations,
  sanitizeMovementParties,
  type MovementTypeCategoryCode,
  type MovementTypeCode,
} from './movement-field-state';

type Row = [
  MovementTypeCategoryCode | null,
  MovementTypeCode | null,
  { client: boolean; provider: boolean; destination: boolean; generates: boolean },
];

const matrix: Row[] = [
  [null, 'E', { client: true, provider: false, destination: false, generates: false }],
  [null, 'S', { client: false, provider: true, destination: false, generates: false }],
  [null, null, { client: false, provider: false, destination: false, generates: false }],
  ['E', 'E', { client: true, provider: false, destination: false, generates: false }],
  ['E', 'S', { client: true, provider: false, destination: false, generates: false }],
  ['S', 'S', { client: false, provider: true, destination: false, generates: false }],
  ['S', 'E', { client: false, provider: true, destination: false, generates: false }],
  ['T', 'E', { client: false, provider: false, destination: true, generates: false }],
  ['T', 'S', { client: false, provider: false, destination: true, generates: false }],
  ['F', 'E', { client: false, provider: true, destination: false, generates: true }],
  ['F', 'S', { client: true, provider: false, destination: false, generates: true }],
  ['F', null, { client: false, provider: false, destination: false, generates: true }],
];

describe('deriveMovementFieldState — matriz D-102-02', () => {
  it.each(matrix)('Tp.Categoria=%s Tipo=%s', (typeCategory, type, expected) => {
    const s = deriveMovementFieldState({ type, typeCategory, mode: 'create' });
    expect(s.clientEnabled).toBe(expected.client);
    expect(s.providerEnabled).toBe(expected.provider);
    expect(s.clientAddButtonEnabled).toBe(expected.client);
    expect(s.providerAddButtonEnabled).toBe(expected.provider);
    expect(s.destinationAccountVisible).toBe(expected.destination);
    expect(s.destinationAccountRequired).toBe(expected.destination);
    expect(s.generatesObligation).toBe(expected.generates);
  });

  it('desabilita as opções E/S da Tp. Categoria conforme o Tipo', () => {
    expect(
      deriveMovementFieldState({ type: 'E', typeCategory: null, mode: 'create' })
        .typeCategoryDisabledOptions
    ).toEqual({ E: false, S: true, T: false, F: false });
    expect(
      deriveMovementFieldState({ type: 'S', typeCategory: null, mode: 'create' })
        .typeCategoryDisabledOptions
    ).toEqual({ E: true, S: false, T: false, F: false });
    expect(
      deriveMovementFieldState({ type: null, typeCategory: null, mode: 'create' })
        .typeCategoryDisabledOptions
    ).toEqual({ E: true, S: true, T: false, F: false });
  });

  it('label da conta deriva do Tipo', () => {
    expect(
      deriveMovementFieldState({ type: 'E', typeCategory: 'T', mode: 'create' })
        .destinationAccountLabelKey
    ).toBe('origin');
    expect(
      deriveMovementFieldState({ type: 'S', typeCategory: 'T', mode: 'create' })
        .destinationAccountLabelKey
    ).toBe('destination');
  });

  it('readonly de Tipo/Tp.Categoria só em edição de registro originalmente T', () => {
    const base = { type: 'E', typeCategory: 'E' } as const;
    expect(
      deriveMovementFieldState({ ...base, mode: 'edit', originalTypeCategory: 'T' }).typeReadOnly
    ).toBe(true);
    expect(
      deriveMovementFieldState({ ...base, mode: 'edit', originalTypeCategory: 'T' })
        .typeCategoryReadOnly
    ).toBe(true);
    expect(
      deriveMovementFieldState({ ...base, mode: 'edit', originalTypeCategory: 'E' }).typeReadOnly
    ).toBe(false);
    expect(
      deriveMovementFieldState({ ...base, mode: 'create', originalTypeCategory: 'T' }).typeReadOnly
    ).toBe(false);
  });
});

describe('deriveAllocationCategoryParams — §2.1', () => {
  it.each([
    ['E', 'E', { type_id: 2, cost_center_scoped: 'true' }],
    ['E', 'S', { type_id: 2, cost_center_scoped: 'true' }],
    ['S', 'S', { type_id: 1, cost_center_scoped: 'true' }],
    ['F', 'S', { type_id: 1, cost_center_scoped: 'true' }],
    ['F', 'E', { type_id: 2, cost_center_scoped: 'true' }],
    ['F', null, { type_id: 2, cost_center_scoped: 'true' }],
    ['T', 'E', { bank_movement_scoped: 'true', class: 2, is_enabled: 'true' }],
    [null, 'E', undefined],
  ] as const)('Tp.Categoria=%s Tipo=%s', (typeCategory, type, expected) => {
    expect(deriveAllocationCategoryParams(type as any, typeCategory as any)).toEqual(expected);
  });

  it('T nunca combina cost_center_scoped com bank_movement_scoped', () => {
    const p = deriveAllocationCategoryParams('E', 'T')!;
    expect(p.cost_center_scoped).toBeUndefined();
  });
});

describe('deriveFilterCategoryParams — filtro Tipo Cat. do drawer (L5)', () => {
  it.each([
    ['E', { type_id: 2, cost_center_scoped: 'true' }],
    ['S', { type_id: 1, cost_center_scoped: 'true' }],
    ['F', { type_id: 2, cost_center_scoped: 'true' }],
    ['T', { bank_movement_scoped: 'true', class: 2, is_enabled: 'true' }],
    [null, undefined],
    [undefined, undefined],
  ] as const)('Tipo Cat.=%s', (categoryType, expected) => {
    expect(deriveFilterCategoryParams(categoryType as any)).toEqual(expected);
  });

  it('F do filtro NÃO depende do Tipo (contraste com o rateio, F+S => type_id 1)', () => {
    expect(deriveFilterCategoryParams('F')).toEqual({ type_id: 2, cost_center_scoped: 'true' });
    expect(deriveAllocationCategoryParams('S', 'F')).toEqual({
      type_id: 1,
      cost_center_scoped: 'true',
    });
  });

  it('T nunca combina cost_center_scoped com bank_movement_scoped', () => {
    expect(deriveFilterCategoryParams('T')!.cost_center_scoped).toBeUndefined();
  });
});

describe('planos de limpeza', () => {
  it('trocar o Tipo limpa tudo, inclusive categorias do rateio', () => {
    expect(planOnTypeChange()).toEqual({
      clearTypeCategory: true,
      clearClient: true,
      clearProvider: true,
      clearDestination: true,
      clearAllocationCategories: true,
      setGeneratesObligation: false,
    });
  });

  it('trocar Tp.Categoria NÃO limpa categorias do rateio nem a própria Tp.Categoria', () => {
    const plan = planOnTypeCategoryChange('E', 'F');
    expect(plan.clearAllocationCategories).toBeUndefined();
    expect(plan.clearTypeCategory).toBeUndefined();
    expect(plan).toEqual({
      clearClient: true,
      clearDestination: true,
      setGeneratesObligation: true,
    });
  });

  it('E->T limpa Cliente e Fornecedor, mantém Conta destino', () => {
    expect(planOnTypeCategoryChange('E', 'T')).toEqual({
      clearClient: true,
      clearProvider: true,
      setGeneratesObligation: false,
    });
  });

  it('S com Tipo S limpa Cliente e Conta destino', () => {
    expect(planOnTypeCategoryChange('S', 'S')).toEqual({
      clearClient: true,
      clearDestination: true,
      setGeneratesObligation: false,
    });
  });

  it('traduz o plano em operações por linha de rateio', () => {
    const ops = resetPlanToOperations(planOnTypeChange(), { allocationCount: 2 });
    expect(ops.map((o) => o.name)).toEqual([
      'type_category',
      'client_uuid',
      'provider_uuid',
      'destination_account_uuid',
      'allocations.0.category_uuid',
      'allocations.1.category_uuid',
      'generates_obligation',
    ]);
    expect(ops.at(-1)?.value).toBe(false);
  });
});

describe('sanitizeMovementParties', () => {
  it('descarta o que o estado derivado desabilitou', () => {
    const state = deriveMovementFieldState({ type: 'E', typeCategory: 'T', mode: 'create' });
    const c = { value: 'c' };
    const p = { value: 'p' };
    const d = { value: 'd' };
    expect(sanitizeMovementParties(state, { client: c, provider: p, destination: d })).toEqual({
      client: null,
      provider: null,
      destination: d,
    });
  });
  it('mantém a parte permitida', () => {
    const state = deriveMovementFieldState({ type: 'S', typeCategory: 'F', mode: 'create' });
    const c = { value: 'c' };
    const p = { value: 'p' };
    expect(sanitizeMovementParties(state, { client: c, provider: p, destination: null })).toEqual({
      client: c,
      provider: null,
      destination: null,
    });
  });
});

describe('payload do BulkInvestmentBanner (OFX) permanece coerente', () => {
  it.each(['E', 'S'] as const)('Tipo %s + T + destino, sem Cliente/Fornecedor', (type) => {
    const state = deriveMovementFieldState({ type, typeCategory: 'T', mode: 'create' });
    const destination = { value: 'inv-acc' };
    expect(sanitizeMovementParties(state, { client: null, provider: null, destination })).toEqual({
      client: null,
      provider: null,
      destination,
    });
    expect(state.generatesObligation).toBe(false); // banner envia generates_obligation=false
    expect(state.typeCategoryDisabledOptions.T).toBe(false);
  });
});
