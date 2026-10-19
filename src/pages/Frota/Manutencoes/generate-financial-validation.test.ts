import { describe, expect, it } from 'vitest';

import { validateProvidersInstallments } from './generate-financial-validation';

describe('validateProvidersInstallments', () => {
  it('sem fornecedores: sem pendências', () => {
    expect(validateProvidersInstallments([])).toEqual([]);
    expect(validateProvidersInstallments(undefined)).toEqual([]);
  });

  it('fornecedor sem parcelas: missing', () => {
    expect(
      validateProvidersInstallments([{ provider_label: 'Oficina A', installments: [] }])
    ).toEqual([{ providerIndex: 0, providerLabel: 'Oficina A', reason: 'missing' }]);
    expect(validateProvidersInstallments([{ provider_label: 'B' }])[0].reason).toBe('missing');
  });

  it('parcela sem data ou com valor <= 0: invalid', () => {
    const base = { provider_label: 'X' };
    expect(
      validateProvidersInstallments([{ ...base, installments: [{ due_date: null, value: 10 }] }])[0]
        .reason
    ).toBe('invalid');
    expect(
      validateProvidersInstallments([
        { ...base, installments: [{ due_date: '2026-10-10', value: 0 }] },
      ])[0].reason
    ).toBe('invalid');
    expect(
      validateProvidersInstallments([
        { ...base, installments: [{ due_date: '2026-10-10', value: null }] },
      ])[0].reason
    ).toBe('invalid');
  });

  it('parcelas válidas: sem pendências; reporta só o fornecedor afetado', () => {
    const issues = validateProvidersInstallments([
      { provider_label: 'OK', installments: [{ due_date: '2026-10-10', value: 0.01 }] },
      { provider_label: 'Ruim', installments: [] },
    ]);
    expect(issues).toHaveLength(1);
    expect(issues[0].providerIndex).toBe(1);
  });
});
