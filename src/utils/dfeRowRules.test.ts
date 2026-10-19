// UT-000752 (T-752-FE-01) — matriz C-24 de elegibilidade por linha.
import { describe, expect, it } from 'vitest';

import {
  canDocuments,
  canLaunchInvoiceOrAnimal,
  canLaunchReturn,
  canManifestRow,
  canTogglePersonal,
  canToggleShipment,
  isLaunchEligible,
  isRowSelectable,
} from './dfeRowRules';

const base = {
  tipo: '1' as '0' | '1',
  tipo_evento: 1 as 0 | 1 | 2 | 3 | 4,
  launched_in: null as 'invoice' | 'animal' | 'expense' | 'return' | null,
  is_personal: false,
  is_shipment: false,
};

describe('dfeRowRules', () => {
  it('Manifestar por linha: {0,1,3,4}', () => {
    expect([0, 1, 2, 3, 4].map(canManifestRow)).toEqual([true, true, false, true, true]);
  });

  it('checkbox / lote: só {0,1}', () => {
    expect([0, 1, 2, 3, 4].map(isRowSelectable)).toEqual([true, true, false, false, false]);
  });

  it('Lançar Produto/Animal: tipo≠0, {1,2}, não lançada, !pessoal, !remessa', () => {
    expect(canLaunchInvoiceOrAnimal(base)).toBe(true);
    expect(canLaunchInvoiceOrAnimal({ ...base, tipo_evento: 2 })).toBe(true);
    expect(canLaunchInvoiceOrAnimal({ ...base, tipo_evento: 0 })).toBe(false);
    expect(canLaunchInvoiceOrAnimal({ ...base, tipo_evento: 3 })).toBe(false);
    expect(canLaunchInvoiceOrAnimal({ ...base, tipo: '0' })).toBe(false);
    expect(canLaunchInvoiceOrAnimal({ ...base, launched_in: 'invoice' })).toBe(false);
    expect(canLaunchInvoiceOrAnimal({ ...base, is_personal: true })).toBe(false);
    expect(canLaunchInvoiceOrAnimal({ ...base, is_shipment: true })).toBe(false);
  });

  it('Lançar Retorno: tipo===0 + elegibilidade comum', () => {
    expect(canLaunchReturn({ ...base, tipo: '0' })).toBe(true);
    expect(canLaunchReturn(base)).toBe(false);
    expect(canLaunchReturn({ ...base, tipo: '0', launched_in: 'return' })).toBe(false);
    expect(isLaunchEligible({ ...base, tipo_evento: 4 })).toBe(false);
  });

  it('DANFE/XML: {1,2,3}', () => {
    expect([0, 1, 2, 3, 4].map(canDocuments)).toEqual([false, true, true, true, false]);
  });

  it('toggles exclusivos e ocultos se lançada', () => {
    expect(canTogglePersonal(base)).toBe(true);
    expect(canTogglePersonal({ ...base, is_shipment: true })).toBe(false);
    expect(canTogglePersonal({ ...base, launched_in: 'animal' })).toBe(false);
    expect(canToggleShipment(base)).toBe(true);
    expect(canToggleShipment({ ...base, is_personal: true })).toBe(false);
    expect(canToggleShipment({ ...base, launched_in: 'invoice' })).toBe(false);
  });
});
