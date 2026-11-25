import { describe, expect, it } from 'vitest';

import { rankQuotations, summarizeQuotations } from './quotationRanking';

const q = (
  uuid: string,
  status: number,
  total_value: number,
  discount = 0,
  date = '2026-11-20'
) => ({ uuid, status, total_value, discount, quotation_date: date, created_at: date });

describe('rankQuotations', () => {
  it('recebidas primeiro, do menor para o maior valor final', () => {
    const ranked = rankQuotations([
      q('a', 3, 500, 0),
      q('b', 1, 0),
      q('c', 3, 450, 10),
      q('d', 3, 480, 100),
    ]);
    expect(ranked.map((r) => r.quotation.uuid)).toEqual(['d', 'c', 'a', 'b']);
    expect(ranked.map((r) => r.netValue)).toEqual([380, 440, 500, null]);
  });

  it('marca só a recebida de menor valor como menor valor', () => {
    const ranked = rankQuotations([q('a', 3, 500), q('b', 3, 300), q('c', 2, 100)]);
    expect(ranked.filter((r) => r.isBest).map((r) => r.quotation.uuid)).toEqual(['b']);
  });

  it('cotação não recebida não tem valor nem pode ser a de menor valor', () => {
    const ranked = rankQuotations([q('a', 1, 10), q('b', 2, 5)]);
    expect(ranked.every((r) => r.netValue === null && !r.isBest)).toBe(true);
  });

  it('ignora recebida com valor zero na escolha do menor valor', () => {
    const ranked = rankQuotations([q('a', 3, 0), q('b', 3, 200)]);
    expect(ranked.find((r) => r.isBest)?.quotation.uuid).toBe('b');
  });

  it('entre não recebidas, enviada antes de aguardando e a mais recente antes', () => {
    const ranked = rankQuotations([
      q('a', 1, 0, 0, '2026-11-01'),
      q('b', 2, 0, 0, '2026-11-02'),
      q('c', 1, 0, 0, '2026-11-05'),
    ]);
    expect(ranked.map((r) => r.quotation.uuid)).toEqual(['b', 'c', 'a']);
  });
});

describe('summarizeQuotations', () => {
  it('conta fornecedores, respostas e aponta o menor valor', () => {
    const summary = summarizeQuotations(rankQuotations([q('a', 3, 500), q('b', 3, 300), q('c', 1, 0)]));
    expect(summary.total).toBe(3);
    expect(summary.received).toBe(2);
    expect(summary.best?.quotation.uuid).toBe('b');
    expect(summary.best?.netValue).toBe(300);
  });

  it('sem cotação recebida não há menor valor', () => {
    expect(summarizeQuotations(rankQuotations([q('a', 1, 0)])).best).toBeNull();
  });
});
