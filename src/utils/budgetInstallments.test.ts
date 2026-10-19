// src/utils/budgetInstallments.test.ts
// -----------------------------------------------------------------------------
// Cobertura unitária pura (Vitest, ambiente `node`, sem RTL/DOM) das funções
// portadas do legado (CV-06/IG-06/IG-10, `TASK-BG-FE-04`). Mirror do padrão
// de teste de util puro já usado em `requestQuotationWhatsApp.test.ts`.
// -----------------------------------------------------------------------------

import { describe, expect, it } from 'vitest';

import { adjustInstallmentsDifference, calcInstallments } from './budgetInstallments';

describe('calcInstallments', () => {
  it('divide o total igualmente entre as parcelas, datas espaçadas pelo intervalo', () => {
    const rows = calcInstallments({
      total: 300,
      inputValue: null,
      qtdInstallments: 3,
      firstInstallment: '2026-09-01',
      intervalDays: 30,
    });

    expect(rows).toEqual([
      { date: '2026-09-01', value: 100 },
      { date: '2026-10-01', value: 100 },
      { date: '2026-10-31', value: 100 },
    ]);
  });

  it('concentra o resto do arredondamento na última parcela', () => {
    const rows = calcInstallments({
      total: 100,
      inputValue: null,
      qtdInstallments: 3,
      firstInstallment: '2026-09-01',
      intervalDays: 15,
    });

    // 100 / 3 = 33.33 * 2 + resto na última.
    expect(rows).toHaveLength(3);
    expect(rows[0].value).toBe(33.33);
    expect(rows[1].value).toBe(33.33);
    expect(rows[2].value).toBe(33.34);
    const sum = rows.reduce((acc, row) => acc + row.value, 0);
    expect(Math.round(sum * 100) / 100).toBe(100);
  });

  it('abate o valor de entrada do valor financiado quando inputValue é informado', () => {
    const rows = calcInstallments({
      total: 300,
      inputValue: 100,
      qtdInstallments: 2,
      firstInstallment: '2026-09-01',
      intervalDays: 30,
    });

    expect(rows).toEqual([
      { date: '2026-09-01', value: 100 },
      { date: '2026-10-01', value: 100 },
    ]);
  });

  it('retorna vazio (IG-06) sem firstInstallment', () => {
    expect(
      calcInstallments({
        total: 300,
        inputValue: null,
        qtdInstallments: 3,
        firstInstallment: null,
        intervalDays: 30,
      })
    ).toEqual([]);
  });

  it('retorna vazio (IG-06) sem qtdInstallments', () => {
    expect(
      calcInstallments({
        total: 300,
        inputValue: null,
        qtdInstallments: 0,
        firstInstallment: '2026-09-01',
        intervalDays: 30,
      })
    ).toEqual([]);
  });

  it('retorna vazio quando o valor financiado (total - entrada) não é positivo', () => {
    expect(
      calcInstallments({
        total: 100,
        inputValue: 100,
        qtdInstallments: 2,
        firstInstallment: '2026-09-01',
        intervalDays: 30,
      })
    ).toEqual([]);
  });
});

describe('adjustInstallmentsDifference', () => {
  const baseRows = [
    { date: '2026-09-01', value: 100 },
    { date: '2026-10-01', value: 100 },
    { date: '2026-10-31', value: 100 },
  ];

  it('editar uma parcela intermediária reconcilia a soma ajustando a última', () => {
    const result = adjustInstallmentsDifference(baseRows, 0, 150, 300);

    expect(result).toEqual([
      { date: '2026-09-01', value: 150 },
      { date: '2026-10-01', value: 100 },
      { date: '2026-10-31', value: 50 },
    ]);
  });

  it('recusa e mantém o array original quando a última parcela zeraria', () => {
    const result = adjustInstallmentsDifference(baseRows, 0, 300, 300);

    expect(result).toBe(baseRows);
  });

  it('recusa e mantém o array original quando a última parcela ficaria negativa', () => {
    const result = adjustInstallmentsDifference(baseRows, 1, 250, 300);

    expect(result).toBe(baseRows);
  });

  it('editar a última parcela diretamente aceita valores positivos', () => {
    const result = adjustInstallmentsDifference(baseRows, 2, 80, 300);

    expect(result[2]).toEqual({ date: '2026-10-31', value: 80 });
  });

  it('recusa editar a última parcela diretamente para zero/negativo', () => {
    const result = adjustInstallmentsDifference(baseRows, 2, 0, 300);

    expect(result).toBe(baseRows);
  });

  it('retorna o array original quando não há parcelas', () => {
    expect(adjustInstallmentsDifference([], 0, 10, 100)).toEqual([]);
  });
});
