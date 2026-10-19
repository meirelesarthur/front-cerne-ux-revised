// Execução 081, T-081-FE-06 — rateio do Ordenador (vetores CV06/CV07 do contrato
// LEGADO-SUPRIMENTOS-07, IG03/IG07/IG08).
import { describe, expect, it } from 'vitest';

import {
  initialRatioRows,
  ratioExceedsTotal,
  ratioTotal,
  validateRatio,
  zipRatioRows,
  type RatioRow,
} from './authorizationRules';

const row = (percent: number | null, category = 'cat', center = 'ctr'): RatioRow => ({
  category_uuid: category,
  center_uuid: center,
  percent,
});

// D-100-22: a validação só olha as linhas (soma, categoria, centro).
const ratio = (rows: RatioRow[]) => ({ rows });

describe('rateio do Ordenador', () => {
  it('começa com uma linha de 100,00 (legado: linha única 100,00)', () => {
    const rows = initialRatioRows();
    expect(rows).toHaveLength(1);
    expect(rows[0].percent).toBe(100);
  });

  it('CV06: 60 + 40 fecha 100 e é aceito', () => {
    expect(ratioTotal([row(60), row(40)])).toBe(100);
    expect(validateRatio(ratio([row(60), row(40)]))).toBeNull();
  });

  it('CV06: 60 + 50 não fecha 100 e bloqueia com "sum"', () => {
    expect(validateRatio(ratio([row(60), row(50)]))).toBe('sum');
  });

  it('IG03: total acima de 100 zera o campo editado; 100 exato não', () => {
    expect(ratioExceedsTotal([row(60), row(50)])).toBe(true);
    expect(ratioExceedsTotal([row(60), row(40)])).toBe(false);
    expect(ratioExceedsTotal([row(60), row(null)])).toBe(false);
  });

  it('CV07: 33,33 + 33,33 + 33,34 fecha 100 sem erro de ponto flutuante', () => {
    expect(validateRatio(ratio([row(33.33), row(33.33), row(33.34)]))).toBeNull();
  });

  it('IG08: categoria vazia bloqueia com "category"; centro vazio com "center"', () => {
    expect(validateRatio(ratio([row(100, '')]))).toBe('category');
    expect(validateRatio(ratio([row(100, 'cat', '')]))).toBe('center');
  });

  it('IG07 vem antes de IG08 (soma é checada primeiro)', () => {
    expect(validateRatio(ratio([row(50, '', '')]))).toBe('sum');
  });

  it('TF-09 (D-100-22): Safra e Classificação vazias com 60/40 válido aceitam (null)', () => {
    // O estado da tela carrega Safra/Classificação, mas a regra não os lê.
    const withEmptyHeader = { classification: '', harvestUuid: '', rows: [row(60), row(40)] };
    expect(validateRatio(withEmptyHeader)).toBeNull();
  });

  it('ordem: soma, categoria, centro', () => {
    expect(validateRatio(ratio([row(50, '', '')]))).toBe('sum');
    expect(validateRatio(ratio([row(100, '', '')]))).toBe('category');
    expect(validateRatio(ratio([row(100, 'cat', '')]))).toBe('center');
  });

  it('zip em 3 arrays paralelos por índice; percentual vazio vira 0', () => {
    expect(zipRatioRows([row(60, 'a', 'x'), row(null, 'b', 'y')])).toEqual({
      categories: ['a', 'b'],
      centers: ['x', 'y'],
      category_percent_values: [60, 0],
    });
  });
});
