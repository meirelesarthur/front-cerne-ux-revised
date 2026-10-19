import { describe, expect, it } from 'vitest';

import {
  docTypeOfDigits,
  formatCnpj,
  formatCpf,
  formatCpfCnpjProgressive,
  isValidCnpj,
  isValidCpf,
  isValidCpfCnpj,
  maskDocTypeOfDigits,
  normalizeDocument,
} from './document';
import { stringMaskSource } from './maskSource';

import { formatDocument as formatDocumentLegacy } from '../formatDocument';

// Referência: algoritmo numérico LEGADO (pré UT-000776), copiado verbatim.
function legacyIsValidCnpj(value: string): boolean {
  const digits = (value ?? '').replace(/\D/g, '');
  if (digits.length !== 14 || /^(\d)\1+$/.test(digits)) return false;
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i += 1) sum += Number(digits[i]) * w1[i];
  let r = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (r !== Number(digits[12])) return false;
  sum = 0;
  for (let i = 0; i < 13; i += 1) sum += Number(digits[i]) * w2[i];
  r = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return r === Number(digits[13]);
}

function legacyFormatCnpj(digits: string): string {
  const d = (digits ?? '').replace(/\D/g, '').slice(0, 14);
  return d
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/(\d{2})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3/$4')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

function dvs(base12: string): string {
  const v = Array.from(base12, (c) => c.charCodeAt(0) - 48);
  const calc = (vals: number[], w: number[]) => {
    const s = vals.reduce((a, x, i) => a + x * w[i], 0);
    return s % 11 < 2 ? 0 : 11 - (s % 11);
  };
  const d1 = calc(v, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = calc([...v, d1], [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return `${d1}${d2}`;
}

describe('CNPJ alfanumérico — núcleo', () => {
  it('aceita o vetor oficial 12ABC34501DE35 (mascarado, cru e minúsculo)', () => {
    expect(isValidCnpj('12ABC34501DE35')).toBe(true);
    expect(isValidCnpj('12.ABC.345/01DE-35')).toBe(true);
    expect(isValidCnpj('12.abc.345/01de-35')).toBe(true);
    expect(isValidCpfCnpj('12ABC34501DE35')).toBe(true);
  });

  it('recusa DV errado e DV com letra', () => {
    expect(isValidCnpj('12ABC34501DE34')).toBe(false);
    expect(isValidCnpj('12ABC34501DE36')).toBe(false);
    expect(isValidCnpj('12ABC34501DEAA')).toBe(false);
    expect(isValidCnpj('12ABC34501DE3')).toBe(false);
  });

  it('gera/valida DVs para bases alfanuméricas variadas', () => {
    for (const base of ['AB1CD2EF3GH4', 'ZZZZZZZZZZZY', '0A0A0A0A0A0A', 'Z9Y8X7W6V5U4']) {
      expect(isValidCnpj(base + dvs(base))).toBe(true);
    }
  });

  it('numérico legado inalterado byte a byte (validação e formatação)', () => {
    let seed = 776;
    const rnd = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed;
    };
    for (let n = 0; n < 3000; n += 1) {
      const base = Array.from({ length: 12 }, () => String(rnd() % 10)).join('');
      const valid = base + dvs(base);
      const broken = base + String(rnd() % 100).padStart(2, '0');
      for (const doc of [valid, broken]) {
        expect(isValidCnpj(doc)).toBe(legacyIsValidCnpj(doc));
      }
      const partial = valid.slice(0, 1 + (rnd() % 14));
      expect(formatCnpj(partial)).toBe(legacyFormatCnpj(partial));
      expect(formatCnpj(legacyFormatCnpj(valid))).toBe(legacyFormatCnpj(valid));
      expect(formatDocumentLegacy(valid, 'cnpj')).toBe(legacyFormatCnpj(valid));
    }
    expect(isValidCnpj('11.222.333/0001-81')).toBe(legacyIsValidCnpj('11.222.333/0001-81'));
  });

  it('recusa 14 zeros e repetições', () => {
    expect(isValidCnpj('00000000000000')).toBe(false);
    expect(isValidCnpj('AAAAAAAAAAAAAA')).toBe(false);
    expect(isValidCnpj('11111111111111')).toBe(false);
  });

  it('normalizeDocument: maiúsculo e só [0-9A-Z]', () => {
    expect(normalizeDocument('12.abc.345/01de-35')).toBe('12ABC34501DE35');
    expect(normalizeDocument(' a-b c ')).toBe('ABC');
  });

  it('CPF inalterado', () => {
    expect(isValidCpf('529.982.247-25')).toBe(true);
    expect(isValidCpfCnpj('52998224725')).toBe(true);
    expect(isValidCpfCnpj('52998224724')).toBe(false);
    expect(formatCpf('52998224725')).toBe('529.982.247-25');
    expect(formatCpfCnpjProgressive('52998224725')).toBe('529.982.247-25');
    expect(docTypeOfDigits('52998224725')).toBe('cpf');
    expect(maskDocTypeOfDigits('5299822472')).toBe('cpf');
  });

  it('classificação: letra presente → CNPJ', () => {
    expect(docTypeOfDigits('12ABC34501DE35')).toBe('cnpj');
    expect(docTypeOfDigits('12ABC345')).toBe('unknown');
    expect(maskDocTypeOfDigits('12A')).toBe('cnpj');
    expect(maskDocTypeOfDigits('12345678901')).toBe('cpf');
    expect(maskDocTypeOfDigits('123456789012')).toBe('cnpj');
  });

  it('formatação progressiva com letras (caixa alta, DV só dígitos)', () => {
    const steps: Array<[string, string]> = [
      ['1', '1'],
      ['12a', '12.A'],
      ['12abc', '12.ABC'],
      ['12abc3', '12.ABC.3'],
      ['12abc345', '12.ABC.345'],
      ['12abc3450', '12.ABC.345/0'],
      ['12abc34501de', '12.ABC.345/01DE'],
      ['12abc34501de3', '12.ABC.345/01DE-3'],
      ['12abc34501de35', '12.ABC.345/01DE-35'],
      ['12abc34501deX35', '12.ABC.345/01DE-35'],
    ];
    for (const [raw, expected] of steps) {
      expect(formatCpfCnpjProgressive(raw)).toBe(expected);
      expect(stringMaskSource.cpfCnpj.format(raw)).toBe(expected);
    }
    expect(stringMaskSource.cnpj.format('12abc34501de35')).toBe('12.ABC.345/01DE-35');
    expect(stringMaskSource.cnpj.inputMode).toBe('text');
    expect(stringMaskSource.cpfCnpj.inputMode).toBe('text');
  });

  it('formatDocument de exibição com letras', () => {
    expect(formatDocumentLegacy('12ABC34501DE35', 'cnpj')).toBe('12.ABC.345/01DE-35');
  });
});
