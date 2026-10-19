// 088 D3-FE-T1 — vetores do contrato legado (§4.1, §4.2, §6 V1-V6), do plano FE
// §4.1-§4.3 e propriedades em laço (Σ fechada, determinismo, sem NaN/∞, datas sem
// deslocamento em fusos a leste e a oeste de UTC).
import { describe, expect, it } from 'vitest';

import {
  addDaysIso,
  applyPercentBlur,
  applyValueBlur,
  distributeByPercents,
  fromCents,
  generateInstallments,
  isValidIsoDate,
  percentOf,
  recalculateForTotal,
  sumCents,
  toCents,
  type AllocationMathRow,
  type FinancialBaseline,
  type InstallmentCentsRow,
} from './movementPurchaseFinancialMath';

const gen = (over: Partial<Parameters<typeof generateInstallments>[0]> = {}) =>
  generateInstallments({
    totalCents: 10000,
    hasInput: false,
    input: null,
    count: 3,
    firstDueDate: '2025-01-10',
    intervalDays: 30,
    ...over,
  });

const amounts = (rows: InstallmentCentsRow[]) => rows.map((r) => r.amountCents);
const dates = (rows: InstallmentCentsRow[]) => rows.map((r) => r.due_date);

describe('conversões', () => {
  it('toCents/fromCents em reais com 2 casas', () => {
    expect(toCents(33.33)).toBe(3333);
    expect(toCents(1.005)).toBe(101);
    expect(toCents(0.1 + 0.2)).toBe(30);
    expect(fromCents(3334)).toBe(33.34);
  });
  it('entradas inválidas viram 0, nunca NaN', () => {
    expect(toCents(null)).toBe(0);
    expect(toCents(undefined)).toBe(0);
    expect(toCents(Number.NaN)).toBe(0);
    expect(toCents(Number.POSITIVE_INFINITY)).toBe(0);
    expect(fromCents(Number.NaN)).toBe(0);
  });
  it('percentOf: total 0 nunca gera NaN/∞ (DEF-D3-06)', () => {
    expect(percentOf(100, 0)).toBe(0);
    expect(percentOf(0, 0)).toBe(0);
    expect(percentOf(100, -5)).toBe(0);
    expect(percentOf(60000, 100000)).toBe(60);
    expect(percentOf(33333, 100000)).toBe(33.33);
  });
});

describe('§4.1 gerador de parcelas', () => {
  it('V1: 100,00 em 3 → 33,33 · 33,33 · 33,34 (resíduo na última), datas 10/01, 09/02, 11/03', () => {
    const r = gen();
    expect(r.error).toBeUndefined();
    expect(amounts(r.rows)).toEqual([3333, 3333, 3334]);
    expect(dates(r.rows)).toEqual(['2025-01-10', '2025-02-09', '2025-03-11']);
    expect(sumCents(amounts(r.rows))).toBe(10000);
    expect(r.rows.every((row) => row.origin === 'generated')).toBe(true);
  });

  it('V2: 1.000,00 com entrada 200 (05/01) + 4 parcelas de 05/02 a cada 30', () => {
    const r = gen({
      totalCents: 100000,
      hasInput: true,
      input: { due_date: '2025-01-05', amountCents: 20000 },
      count: 4,
      firstDueDate: '2025-02-05',
    });
    expect(amounts(r.rows)).toEqual([20000, 20000, 20000, 20000, 20000]);
    expect(dates(r.rows)).toEqual([
      '2025-01-05',
      '2025-02-05',
      '2025-03-07',
      '2025-04-06',
      '2025-05-06',
    ]);
    expect(r.rows[0].origin).toBe('input');
    expect(r.rows[1].origin).toBe('generated');
  });

  it('V3: 100,00 em 6 → 5 × 16,66 + 16,70', () => {
    const r = gen({ count: 6 });
    expect(amounts(r.rows)).toEqual([1666, 1666, 1666, 1666, 1666, 1670]);
    expect(sumCents(amounts(r.rows))).toBe(10000);
  });

  it('0,05 em 6 → INSTALLMENT_ZERO (P-5), tabela não gerada', () => {
    const r = gen({ totalCents: 5, count: 6 });
    expect(r.error).toBe('INSTALLMENT_ZERO');
    expect(r.rows).toEqual([]);
    expect(r.position).toBe(1);
  });

  it('intervalo 0 → todas na mesma data', () => {
    const r = gen({ intervalDays: 0 });
    expect(new Set(dates(r.rows)).size).toBe(1);
  });

  it('entrada >= total → INPUT_GE_TOTAL; hasInput=false ignora a entrada informada', () => {
    expect(
      gen({ hasInput: true, input: { due_date: '2025-01-05', amountCents: 10000 } }).error
    ).toBe('INPUT_GE_TOTAL');
    expect(
      gen({ hasInput: true, input: { due_date: '2025-01-05', amountCents: 15000 } }).error
    ).toBe('INPUT_GE_TOTAL');
    const off = gen({ hasInput: false, input: { due_date: '2025-01-05', amountCents: 5000 } });
    expect(off.rows).toHaveLength(3);
    expect(sumCents(amounts(off.rows))).toBe(10000);
  });

  it('entrada incompleta (sem data) não gera linha de entrada', () => {
    const r = gen({ hasInput: true, input: { due_date: '', amountCents: 5000 } });
    expect(r.rows).toHaveLength(3);
    expect(sumCents(amounts(r.rows))).toBe(10000);
  });

  it('INCOMPLETE: gerador incompleto não mexe na tabela', () => {
    expect(gen({ count: null }).error).toBe('INCOMPLETE');
    expect(gen({ count: 0 }).error).toBe('INCOMPLETE');
    expect(gen({ count: 2.5 }).error).toBe('INCOMPLETE');
    expect(gen({ firstDueDate: '' }).error).toBe('INCOMPLETE');
    expect(gen({ firstDueDate: '2025-02-30' }).error).toBe('INCOMPLETE');
    expect(gen({ intervalDays: -1 }).error).toBe('INCOMPLETE');
    expect(gen({ intervalDays: null }).error).toBe('INCOMPLETE');
    expect(gen({ count: null }).rows).toEqual([]);
  });

  it('TOTAL_ZERO com total <= 0', () => {
    expect(gen({ totalCents: 0 }).error).toBe('TOTAL_ZERO');
    expect(gen({ totalCents: -10 }).error).toBe('TOTAL_ZERO');
    expect(gen({ totalCents: Number.NaN }).error).toBe('TOTAL_ZERO');
  });

  it('propriedades: Σ parcelas = total, nenhuma <= 0, determinismo, sem NaN/∞', () => {
    for (let total = 1; total <= 400; total += 7) {
      for (let count = 1; count <= 13; count += 1) {
        for (const entry of [0, Math.floor(total / 3)]) {
          const args = {
            totalCents: total,
            hasInput: entry > 0,
            input: entry > 0 ? { due_date: '2025-03-01', amountCents: entry } : null,
            count,
            firstDueDate: '2025-04-01',
            intervalDays: 15,
          };
          const a = generateInstallments(args);
          const b = generateInstallments(args);
          expect(b).toEqual(a);
          if (a.error) {
            expect(a.rows).toEqual([]);
            expect(a.error).toBe('INSTALLMENT_ZERO');
            continue;
          }
          expect(sumCents(amounts(a.rows))).toBe(total);
          for (const row of a.rows) {
            expect(row.amountCents).toBeGreaterThan(0);
            expect(Number.isFinite(row.amountCents)).toBe(true);
          }
        }
      }
    }
  });
});

describe('datas sem deslocamento por fuso (DEF-D3-05)', () => {
  const original = process.env.TZ;
  it.each(['Asia/Tokyo', 'America/Sao_Paulo', 'Pacific/Kiritimati', 'Pacific/Pago_Pago'])(
    'TZ=%s gera as mesmas datas',
    (tz) => {
      process.env.TZ = tz;
      try {
        expect(dates(gen().rows)).toEqual(['2025-01-10', '2025-02-09', '2025-03-11']);
        expect(addDaysIso('2025-03-08', 1)).toBe('2025-03-09');
        expect(addDaysIso('2025-10-18', 1)).toBe('2025-10-19');
        expect(addDaysIso('2024-02-28', 2)).toBe('2024-03-01');
        expect(addDaysIso('2025-12-31', 1)).toBe('2026-01-01');
      } finally {
        if (original === undefined) delete process.env.TZ;
        else process.env.TZ = original;
      }
    }
  );

  it('isValidIsoDate', () => {
    expect(isValidIsoDate('2025-02-28')).toBe(true);
    expect(isValidIsoDate('2025-02-30')).toBe(false);
    expect(isValidIsoDate('10/01/2025')).toBe(false);
    expect(isValidIsoDate('')).toBe(false);
    expect(isValidIsoDate(null)).toBe(false);
  });
});

describe('§4.2 distributeByPercents / blur valor ↔ %', () => {
  it('V4: distributeByPercents(1000, [33.33, 33.33, 33.34]) → [334, 333, 333]', () => {
    expect(distributeByPercents(1000, [33.33, 33.33, 33.34])).toEqual([334, 333, 333]);
  });

  it('diferença negativa distribui de forma descendente', () => {
    // 3 × 33,33…: percentuais 33,34 ×3 passam de 100% → raw soma > total.
    const out = distributeByPercents(1000, [33.34, 33.34, 33.32]);
    expect(sumCents(out)).toBe(1000);
  });

  it('total 0 → zeros; lista vazia → []', () => {
    expect(distributeByPercents(0, [50, 50])).toEqual([0, 0]);
    expect(distributeByPercents(1000, [])).toEqual([]);
  });

  it('propriedade: percentuais fechando 100 → Σ valores = total exato, determinístico', () => {
    const sets = [
      [33.33, 33.33, 33.34],
      [10, 20, 30, 40],
      [14.29, 14.29, 14.29, 14.29, 14.29, 14.29, 14.26],
      [0.01, 99.99],
      [50, 50],
      [100],
    ];
    for (const set of sets) {
      for (const total of [1, 7, 99, 1000, 100001, 123456789]) {
        const a = distributeByPercents(total, set);
        expect(sumCents(a)).toBe(total);
        expect(distributeByPercents(total, set)).toEqual(a);
        a.forEach((v) => expect(Number.isFinite(v)).toBe(true));
      }
    }
  });

  const row = (valueCents: number, percent = 0): AllocationMathRow & { tag: string } => ({
    valueCents,
    percent,
    tag: `r${valueCents}`,
  });

  it('V5: total 1.000 e linha 600 → 60,00 %', () => {
    const r = applyValueBlur([row(60000)], 0, 100000);
    expect(r.warning).toBeUndefined();
    expect(r.rows[0].percent).toBe(60);
    expect(r.rows[0].tag).toBe('r60000');
  });

  it('V6: 600 + 500 em 1.000 → aviso e linha 2 zerada', () => {
    const r = applyValueBlur([row(60000, 60), row(50000)], 1, 100000);
    expect(r.warning).toBe('ALLOCATION_EXCEEDS');
    expect(r.rows[1].valueCents).toBe(0);
    expect(r.rows[1].percent).toBe(0);
    expect(r.rows[0].valueCents).toBe(60000);
  });

  it('total 0 → aviso fillTotalFirst, linha intacta, sem NaN', () => {
    const rows = [row(500, 0)];
    const v = applyValueBlur(rows, 0, 0);
    expect(v.warning).toBe('FILL_TOTAL_FIRST');
    expect(v.rows[0]).toEqual(rows[0]);
    const p = applyPercentBlur([row(0, 50)], 0, 0);
    expect(p.warning).toBe('FILL_TOTAL_FIRST');
    expect(Number.isNaN(p.rows[0].valueCents)).toBe(false);
  });

  it('1 linha com 100 % → valor = total', () => {
    const r = applyPercentBlur([row(0, 100)], 0, 12345);
    expect(r.rows[0].valueCents).toBe(12345);
  });

  it('% simples calcula o valor da linha sem redistribuir', () => {
    const r = applyPercentBlur([row(0, 60), row(0, 0)], 0, 100000);
    expect(r.warning).toBeUndefined();
    expect(r.rows[0].valueCents).toBe(60000);
    expect(r.rows[1].valueCents).toBe(0);
  });

  it('Σ% > 100 → aviso e linha zerada', () => {
    const r = applyPercentBlur([row(60000, 60), row(0, 50)], 1, 100000);
    expect(r.warning).toBe('ALLOCATION_EXCEEDS');
    expect(r.rows[1].percent).toBe(0);
    expect(r.rows[1].valueCents).toBe(0);
  });

  it('V4 na tela: Σ% = 100 exato redistribui todas as linhas (3,34/3,33/3,33)', () => {
    const r = applyPercentBlur([row(0, 33.33), row(0, 33.33), row(0, 33.34)], 2, 1000);
    expect(r.rows.map((x) => x.valueCents)).toEqual([334, 333, 333]);
    expect(sumCents(r.rows.map((x) => x.valueCents))).toBe(1000);
  });

  it('índice inexistente não quebra', () => {
    expect(applyValueBlur([row(1)], 5, 100).rows).toHaveLength(1);
    expect(applyPercentBlur([row(1)], 5, 100).rows).toHaveLength(1);
  });

  it('não muta o array de entrada', () => {
    const rows = [row(60000, 60), row(50000)];
    const snapshot = JSON.parse(JSON.stringify(rows));
    applyValueBlur(rows, 1, 100000);
    expect(rows).toEqual(snapshot);
  });
});

describe('§4.3 recalculateForTotal (D3-b)', () => {
  type Alloc = AllocationMathRow & { id: string };
  const alloc = (id: string, valueCents: number, percent: number): Alloc => ({
    id,
    valueCents,
    percent,
  });

  const generated = (): FinancialBaseline<Alloc> => ({
    totalCents: 10000,
    installments: gen().rows,
    allocations: [alloc('a', 10000, 100)],
    generatedUntouched: true,
    generatorParams: { count: 3, firstDueDate: '2025-01-10', intervalDays: 30 },
  });

  it('gerado 100,00/3 → total 200,00: 66,66 · 66,66 · 66,68 (D3-a)', () => {
    const r = recalculateForTotal(generated(), 20000, null);
    expect(r.installmentsError).toBeUndefined();
    expect(amounts(r.installments)).toEqual([6666, 6666, 6668]);
    expect(dates(r.installments)).toEqual(['2025-01-10', '2025-02-09', '2025-03-11']);
    expect(r.installmentsChanged).toBe(true);
    expect(r.allocations[0].valueCents).toBe(20000);
    expect(r.allocations[0].percent).toBe(100);
    expect(r.allocations[0].id).toBe('a');
  });

  it('XML 500 (01/02) + 500 (03/03), total 1.000 → 1.200: 600 + 600 com as mesmas datas', () => {
    const baseline: FinancialBaseline<Alloc> = {
      totalCents: 100000,
      installments: [
        { due_date: '2025-02-01', amountCents: 50000, origin: 'xml' },
        { due_date: '2025-03-03', amountCents: 50000, origin: 'xml' },
      ],
      allocations: [alloc('a', 100000, 100)],
      generatedUntouched: false,
      generatorParams: { count: 2, firstDueDate: '2025-02-01', intervalDays: 30 },
    };
    const r = recalculateForTotal(baseline, 120000, null);
    expect(amounts(r.installments)).toEqual([60000, 60000]);
    expect(dates(r.installments)).toEqual(['2025-02-01', '2025-03-03']);
    expect(r.installments.every((row) => row.origin === 'xml')).toBe(true);
  });

  it('reescala preserva a entrada e põe o resíduo na última', () => {
    const baseline: FinancialBaseline<Alloc> = {
      totalCents: 100000,
      installments: [
        { due_date: '2025-01-05', amountCents: 20000, origin: 'input' },
        { due_date: '2025-02-05', amountCents: 26667, origin: 'stored' },
        { due_date: '2025-03-07', amountCents: 26667, origin: 'stored' },
        { due_date: '2025-04-06', amountCents: 26666, origin: 'stored' },
      ],
      allocations: [],
      generatedUntouched: false,
      generatorParams: null,
    };
    const input = { due_date: '2025-01-05', amountCents: 20000 };
    const r = recalculateForTotal(baseline, 150000, input);
    expect(r.installmentsError).toBeUndefined();
    expect(r.installments[0]).toMatchObject({ amountCents: 20000, origin: 'input' });
    expect(sumCents(amounts(r.installments))).toBe(150000);
    expect(dates(r.installments)).toEqual(dates(baseline.installments));
  });

  it('rateio 600/400 de 1.000 → 1.001,00: 600,60 / 400,40', () => {
    const baseline: FinancialBaseline<Alloc> = {
      ...generated(),
      totalCents: 100000,
      installments: [],
      allocations: [alloc('a', 60000, 60), alloc('b', 40000, 40)],
    };
    const r = recalculateForTotal(baseline, 100100, null);
    expect(r.allocations.map((x) => x.valueCents)).toEqual([60060, 40040]);
    expect(r.allocations.map((x) => x.percent)).toEqual([60, 40]);
    expect(r.allocations.map((x) => x.id)).toEqual(['a', 'b']);
  });

  it('rateio 333,33/666,67 → 500: 166,67/333,33 (fecha em Σ)', () => {
    const baseline: FinancialBaseline<Alloc> = {
      ...generated(),
      totalCents: 100000,
      installments: [],
      allocations: [alloc('a', 33333, 33.33), alloc('b', 66667, 66.67)],
    };
    const r = recalculateForTotal(baseline, 50000, null);
    expect(r.allocations.map((x) => x.valueCents)).toEqual([16667, 33333]);
    expect(sumCents(r.allocations.map((x) => x.valueCents))).toBe(50000);
  });

  it('rateio aberto/incompleto não fecha: escala pelo total da baseline', () => {
    const baseline: FinancialBaseline<Alloc> = {
      ...generated(),
      totalCents: 100000,
      installments: [],
      allocations: [alloc('a', 50000, 50)],
    };
    const r = recalculateForTotal(baseline, 200000, null);
    expect(r.allocations[0].valueCents).toBe(100000);
    expect(r.allocations[0].percent).toBe(50);
  });

  it('rajada: 3 mudanças a partir da MESMA baseline = resultado de 1 mudança (sem deriva)', () => {
    const baseline = generated();
    baseline.allocations = [alloc('a', 3333, 33.33), alloc('b', 6667, 66.67)];
    const direct = recalculateForTotal(baseline, 12345, null);
    recalculateForTotal(baseline, 99999, null);
    recalculateForTotal(baseline, 50001, null);
    const burst = recalculateForTotal(baseline, 12345, null);
    expect(burst).toEqual(direct);
    // a baseline não foi mutada
    expect(baseline.totalCents).toBe(10000);
    expect(amounts(baseline.installments)).toEqual([3333, 3333, 3334]);
  });

  it('total <= 0 → TOTAL_ZERO e nada muda', () => {
    const baseline = generated();
    const r = recalculateForTotal(baseline, 0, null);
    expect(r.installmentsError).toBe('TOTAL_ZERO');
    expect(r.installmentsChanged).toBe(false);
    expect(r.allocationsChanged).toBe(false);
    expect(amounts(r.installments)).toEqual(amounts(baseline.installments));
    expect(recalculateForTotal(baseline, Number.NaN, null).installmentsError).toBe('TOTAL_ZERO');
  });

  it('entrada >= novo total → INPUT_GE_TOTAL e nada muda', () => {
    const baseline = generated();
    const r = recalculateForTotal(baseline, 15000, { due_date: '2025-01-05', amountCents: 15000 });
    expect(r.installmentsError).toBe('INPUT_GE_TOTAL');
    expect(r.installmentsChanged).toBe(false);
  });

  it('reescala que zera uma parcela → INSTALLMENT_ZERO e baseline mantida', () => {
    const baseline: FinancialBaseline<Alloc> = {
      totalCents: 100000,
      installments: [
        { due_date: '2025-02-01', amountCents: 99999, origin: 'stored' },
        { due_date: '2025-03-01', amountCents: 1, origin: 'stored' },
      ],
      allocations: [],
      generatedUntouched: false,
      generatorParams: null,
    };
    const r = recalculateForTotal(baseline, 50000, null);
    expect(r.installmentsError).toBe('INSTALLMENT_ZERO');
    expect(r.position).toBe(2);
    expect(amounts(r.installments)).toEqual([99999, 1]);
  });

  it('linha de rateio que ficaria <= 0 mantém a baseline e sinaliza', () => {
    const baseline: FinancialBaseline<Alloc> = {
      ...generated(),
      totalCents: 100000,
      installments: [],
      allocations: [alloc('a', 99999, 99.99), alloc('b', 1, 0.01)],
    };
    const r = recalculateForTotal(baseline, 50000, null);
    expect(r.allocationsError).toBe('ALLOCATION_NONPOSITIVE');
    expect(r.allocations.map((x) => x.valueCents)).toEqual([99999, 1]);
    expect(r.allocationsChanged).toBe(false);
  });

  it('S == B → sem mudança; sem base e sem gerador → NO_BASE (sem divisão por zero)', () => {
    const same: FinancialBaseline<Alloc> = {
      totalCents: 100000,
      installments: [{ due_date: '2025-02-01', amountCents: 100000, origin: 'xml' }],
      allocations: [],
      generatedUntouched: false,
      generatorParams: null,
    };
    expect(recalculateForTotal(same, 100000, null).installmentsChanged).toBe(false);
    const zero: FinancialBaseline<Alloc> = {
      ...same,
      installments: [{ due_date: '2025-02-01', amountCents: 0, origin: 'xml' }],
    };
    const r = recalculateForTotal(zero, 50000, null);
    expect(r.installmentsError).toBe('NO_BASE');
    r.installments.forEach((row) => expect(Number.isFinite(row.amountCents)).toBe(true));
  });

  it('propriedades: Σ parcelas e Σ rateio fechado = novo total; nenhum valor <= 0 aplicado', () => {
    for (let newTotal = 300; newTotal <= 50000; newTotal += 1733) {
      const baseline = generated();
      baseline.allocations = [alloc('a', 3333, 33.33), alloc('b', 6667, 66.67)];
      const r = recalculateForTotal(baseline, newTotal, null);
      expect(r.installmentsError).toBeUndefined();
      expect(sumCents(amounts(r.installments))).toBe(newTotal);
      expect(sumCents(r.allocations.map((x) => x.valueCents))).toBe(newTotal);
      [...amounts(r.installments), ...r.allocations.map((x) => x.valueCents)].forEach((v) => {
        expect(v).toBeGreaterThan(0);
        expect(Number.isFinite(v)).toBe(true);
      });
      expect(recalculateForTotal(baseline, newTotal, null)).toEqual(r);
    }
  });
});
