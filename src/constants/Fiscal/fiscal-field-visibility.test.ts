import { describe, expect, it } from 'vitest';

import {
  isMotDesIcmsVisible,
  isPercDifVisible,
  isPercFcpVisible,
  isPercIpiDevolVisible,
  normalizePercFcp,
  sanitizeC1ForCst,
} from './fiscal-field-visibility';

describe('fiscal-field-visibility', () => {
  it('mot_des_icms: so CST 20/30/40/41/50/70/90', () => {
    ['20', '30', '40', '41', '50', '70', '90'].forEach((c) =>
      expect(isMotDesIcmsVisible(c)).toBe(true)
    );
    ['00', '10', '51', '60', '101', '900', '', null, undefined].forEach((c) =>
      expect(isMotDesIcmsVisible(c)).toBe(false)
    );
  });

  it('perc_dif: so CST 51', () => {
    expect(isPercDifVisible('51')).toBe(true);
    expect(isPercDifVisible(51)).toBe(true);
    ['00', '20', '151', null].forEach((c) => expect(isPercDifVisible(c)).toBe(false));
  });

  it('perc_fcp: so CST 00/10/20/51/70/90', () => {
    ['00', '10', '20', '51', '70', '90'].forEach((c) => expect(isPercFcpVisible(c)).toBe(true));
    ['30', '40', '60', '900', '500', undefined].forEach((c) =>
      expect(isPercFcpVisible(c)).toBe(false)
    );
  });

  it('perc_ipi_devol: so finnfe = 4 (string ou number)', () => {
    expect(isPercIpiDevolVisible(4)).toBe(true);
    expect(isPercIpiDevolVisible('4')).toBe(true);
    [1, 2, 3, '', null, undefined].forEach((f) => expect(isPercIpiDevolVisible(f)).toBe(false));
  });

  it('normalizePercFcp: vazio/0 => null (P-F2)', () => {
    expect(normalizePercFcp(0)).toBeNull();
    expect(normalizePercFcp('0')).toBeNull();
    expect(normalizePercFcp('')).toBeNull();
    expect(normalizePercFcp(null)).toBeNull();
    expect(normalizePercFcp(undefined)).toBeNull();
    expect(normalizePercFcp('abc')).toBeNull();
    expect(normalizePercFcp(2)).toBe(2);
    expect(normalizePercFcp('1.5')).toBe(1.5);
  });

  it('sanitizeC1ForCst: zera o que nao pertence ao CST e preserva o compativel', () => {
    expect(sanitizeC1ForCst('20', { mot_des_icms: 3, perc_dif: 50, perc_fcp: 2 })).toEqual({
      mot_des_icms: 3,
      perc_dif: null,
      perc_fcp: 2,
    });
    // 3 nao pertence ao dominio do CST 30
    expect(sanitizeC1ForCst('30', { mot_des_icms: 3, perc_fcp: 2 })).toEqual({
      mot_des_icms: null,
      perc_dif: null,
      perc_fcp: null,
    });
    expect(sanitizeC1ForCst('51', { perc_dif: 100, perc_fcp: 0 })).toEqual({
      mot_des_icms: null,
      perc_dif: 100,
      perc_fcp: null,
    });
    expect(sanitizeC1ForCst('60', { mot_des_icms: 9, perc_dif: 1, perc_fcp: 1 })).toEqual({
      mot_des_icms: null,
      perc_dif: null,
      perc_fcp: null,
    });
  });
});
