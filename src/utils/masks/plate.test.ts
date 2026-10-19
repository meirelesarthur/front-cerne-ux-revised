import { describe, expect, it } from 'vitest';

import { formatPlateIfValid, formatPlateProgressive, isValidPlate } from './plate';

describe('formatPlateProgressive', () => {
  it('formata placa antiga', () => {
    expect(formatPlateProgressive('kac3328')).toBe('KAC-3328');
  });
  it('formata placa Mercosul', () => {
    expect(formatPlateProgressive('abc1d99')).toBe('ABC-1D99');
  });
  it('e idempotente', () => {
    expect(formatPlateProgressive('KAC-3328')).toBe('KAC-3328');
    expect(formatPlateProgressive('ABC-1D99')).toBe('ABC-1D99');
  });
  it('formata progressivamente', () => {
    expect(formatPlateProgressive('k')).toBe('K');
    expect(formatPlateProgressive('kac')).toBe('KAC');
    expect(formatPlateProgressive('kac3')).toBe('KAC-3');
    expect(formatPlateProgressive('abc12')).toBe('ABC-12');
  });
  it('descarta letra na posicao 4', () => {
    expect(formatPlateProgressive('abcd')).toBe('ABC');
  });
  it('descarta digito nas posicoes 1 a 3', () => {
    expect(formatPlateProgressive('1ab')).toBe('AB');
    expect(formatPlateProgressive('a1b2c')).toBe('ABC');
  });
  it('descarta letra nas posicoes 6 e 7', () => {
    expect(formatPlateProgressive('abc1dxx')).toBe('ABC-1D');
  });
  it('trunca em 7 caracteres', () => {
    expect(formatPlateProgressive('abc1d9999')).toBe('ABC-1D99');
  });
  it('retorna vazio para vazio ou nulo', () => {
    expect(formatPlateProgressive('')).toBe('');
    expect(formatPlateProgressive(undefined as unknown as string)).toBe('');
  });
});

describe('isValidPlate', () => {
  it.each(['KAC-3328', 'KAC3328', 'ABC-1D99', 'abc1d99'])('aceita %s', (v) => {
    expect(isValidPlate(v)).toBe(true);
  });
  it.each(['AB-1234', 'ABC-12', 'ABC-1D9', '1BC-1234', 'ABC-12345', '', 'ABC-1DD9'])(
    'rejeita "%s"',
    (v) => {
      expect(isValidPlate(v)).toBe(false);
    }
  );
});

describe('casos UT-000787 (sem hifen, minuscula, espaco, lixo)', () => {
  it('digitar ABC1234 completa os 7 caracteres (causa da UT-000787)', () => {
    expect(formatPlateProgressive('ABC1234')).toBe('ABC-1234');
    expect(formatPlateProgressive('ABC1D23')).toBe('ABC-1D23');
  });
  it('normaliza minuscula e espacos', () => {
    expect(formatPlateProgressive(' abc 1234 ')).toBe('ABC-1234');
  });
  it('descarta lixo', () => {
    expect(formatPlateProgressive('!!@@')).toBe('');
    expect(formatPlateProgressive('SEM PLACA')).toBe('SEM');
  });
  it.each(['abc 1234', ' ABC-1D23 '])('isValidPlate aceita %s (espaco/minuscula)', (v) => {
    expect(isValidPlate(v)).toBe(true);
  });
  it.each(['SEM PLACA', 'ABCD123', 'AB-12', '1234567'])('isValidPlate rejeita %s', (v) => {
    expect(isValidPlate(v)).toBe(false);
  });
});

describe('formatPlateIfValid (hidratacao)', () => {
  it('formata placa valida sem hifen', () => {
    expect(formatPlateIfValid('ABC1234')).toBe('ABC-1234');
    expect(formatPlateIfValid('abc1d23')).toBe('ABC-1D23');
  });
  it('preserva legado fora do padrao e vazio', () => {
    expect(formatPlateIfValid('SEM PLACA')).toBe('SEM PLACA');
    expect(formatPlateIfValid(null)).toBe('');
    expect(formatPlateIfValid(undefined)).toBe('');
  });
});
