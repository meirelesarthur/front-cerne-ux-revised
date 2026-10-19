import { describe, expect, it } from 'vitest';

import {
  getMotDesIcmsOptions,
  isMotDesIcmsValidForCst,
  MOT_DES_ICMS_BY_CST,
} from './mot-des-icms-catalog';
import * as nfeBarrel from './nfe-fiscal-catalogs';

import * as fiscalBarrel from '../FiscalCatalogs';

const values = (cst: string) => getMotDesIcmsOptions(cst).map((o) => o.value);

describe('getMotDesIcmsOptions (MOC 7.0, N28)', () => {
  it.each(['20', '70', '90'])('CST %s = {3, 9, 12}', (cst) => {
    expect(values(cst)).toEqual([3, 9, 12]);
  });

  it('CST 30 = {6, 7, 9} (sem 3 nem 12)', () => {
    expect(values('30')).toEqual([6, 7, 9]);
  });

  it.each(['40', '41', '50'])('CST %s = dominio exato de 12 valores', (cst) => {
    expect(values(cst)).toEqual([1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 16, 90]);
  });

  it.each(['00', '10', '51', '60', '900', '101', '', 'abc'])('CST %s sem opcoes', (cst) => {
    expect(getMotDesIcmsOptions(cst)).toEqual([]);
  });

  it('null/undefined/number sao tolerados', () => {
    expect(getMotDesIcmsOptions(null)).toEqual([]);
    expect(getMotDesIcmsOptions(undefined)).toEqual([]);
    expect(values(String(20))).toEqual([3, 9, 12]);
    expect(getMotDesIcmsOptions(20).length).toBe(3);
  });

  it('valor 2 (revogado) nunca e oferecido', () => {
    Object.keys(MOT_DES_ICMS_BY_CST).forEach((cst) => {
      expect(values(cst)).not.toContain(2);
    });
  });

  it('retorna copia (nao expoe o array interno)', () => {
    const a = getMotDesIcmsOptions('20');
    a.pop();
    expect(getMotDesIcmsOptions('20').length).toBe(3);
  });
});

describe('isMotDesIcmsValidForCst', () => {
  it('3 invalido no CST 30; valido no 20', () => {
    expect(isMotDesIcmsValidForCst('30', 3)).toBe(false);
    expect(isMotDesIcmsValidForCst('20', 3)).toBe(true);
  });
  it('vazio sempre valido; CST sem dominio invalida qualquer valor', () => {
    expect(isMotDesIcmsValidForCst('00', null)).toBe(true);
    expect(isMotDesIcmsValidForCst('00', 9)).toBe(false);
  });
});

describe('barrels', () => {
  it('reexportam o catalogo nas duas barrels', () => {
    expect(nfeBarrel.getMotDesIcmsOptions).toBe(getMotDesIcmsOptions);
    expect(fiscalBarrel.getMotDesIcmsOptions).toBe(getMotDesIcmsOptions);
  });
});
