// Execução 081, T-081-FE-10 — vetores CV-01 e CV-02 do contrato LEGADO-SUPRIMENTOS-09
// e regras de totais do rateio.
import { describe, expect, it } from 'vitest';

import {
  addDaysIso,
  buildInstallments,
  fillEmptyRatioValues,
  ratioMatchesTotal,
  sumValues,
} from './installments';

describe('buildInstallments', () => {
  it('CV-01: 1.000 em 3 parcelas, sem entrada, 30 dias: 333,33 x 3 (soma 999,99, sem resíduo)', () => {
    const rows = buildInstallments({
      total: 1000,
      hasEntry: false,
      entryValue: null,
      entryDate: null,
      quantity: 3,
      firstDate: '2026-10-10',
      intervalDays: 30,
    });
    expect(rows).toEqual([
      { due_date: '2026-10-10', value: 333.33 },
      { due_date: '2026-11-09', value: 333.33 },
      { due_date: '2026-12-09', value: 333.33 },
    ]);
    expect(sumValues(rows!)).toBe(999.99);
  });

  it('CV-02: 1.000 com entrada de 200 e 2 parcelas: 200 + 400 + 400', () => {
    const rows = buildInstallments({
      total: 1000,
      hasEntry: true,
      entryValue: 200,
      entryDate: '2026-10-01',
      quantity: 2,
      firstDate: '2026-11-01',
      intervalDays: 30,
    });
    expect(rows).toEqual([
      { due_date: '2026-10-01', value: 200 },
      { due_date: '2026-11-01', value: 400 },
      { due_date: '2026-12-01', value: 400 },
    ]);
  });

  it('"Possui entrada" = Não ignora o valor da entrada', () => {
    const rows = buildInstallments({
      total: 1000,
      hasEntry: false,
      entryValue: 200,
      entryDate: '2026-10-01',
      quantity: 2,
      firstDate: '2026-11-01',
      intervalDays: 30,
    });
    expect(rows?.map((r) => r.value)).toEqual([500, 500]);
  });

  it('intervalo vazio vale 0: todas as parcelas no mesmo dia', () => {
    const rows = buildInstallments({
      total: 100,
      hasEntry: false,
      entryValue: null,
      entryDate: null,
      quantity: 2,
      firstDate: '2026-10-10',
      intervalDays: null,
    });
    expect(rows?.map((r) => r.due_date)).toEqual(['2026-10-10', '2026-10-10']);
  });

  it('devolve null quando falta quantidade, 1ª data ou total', () => {
    const base = {
      total: 100,
      hasEntry: false,
      entryValue: null,
      entryDate: null,
      quantity: 2,
      firstDate: '2026-10-10',
      intervalDays: 30,
    };
    expect(buildInstallments({ ...base, quantity: null })).toBeNull();
    expect(buildInstallments({ ...base, firstDate: null })).toBeNull();
    expect(buildInstallments({ ...base, total: 0 })).toBeNull();
  });
});

describe('addDaysIso', () => {
  it('soma dias sem deslocar por fuso e cruza mês e ano', () => {
    expect(addDaysIso('2026-12-20', 30)).toBe('2027-01-19');
    expect(addDaysIso('2026-10-10', 0)).toBe('2026-10-10');
  });
});

describe('rateio', () => {
  it('fillEmptyRatioValues preenche só as linhas sem valor e recalcula o percentual', () => {
    const rows = fillEmptyRatioValues(
      [
        { value: null, percent: null },
        { value: 250, percent: 25 },
      ],
      1000,
      1000
    );
    expect(rows).toEqual([
      { value: 1000, percent: 100 },
      { value: 250, percent: 25 },
    ]);
  });

  it('ratioMatchesTotal exige a soma exata em centavos', () => {
    expect(ratioMatchesTotal([{ value: 600 }, { value: 400 }], 1000)).toBe(true);
    expect(ratioMatchesTotal([{ value: 600 }, { value: 399.99 }], 1000)).toBe(false);
    expect(ratioMatchesTotal([{ value: 333.33 }, { value: 333.33 }, { value: 333.34 }], 1000)).toBe(
      true
    );
  });
});
