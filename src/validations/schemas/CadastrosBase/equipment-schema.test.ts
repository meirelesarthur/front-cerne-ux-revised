import { describe, expect, it } from 'vitest';

import { languagePtBr } from '@/constants/languages/languagePtBr';

import { equipmentSchema } from './equipment-schema';

const pt = languagePtBr.BR;
const v = pt.equipments.equipment.form.validation;

const FISCAL_REQUIRED = [
  ['type', v.typeRequiredWithFiscal],
  ['body_type', v.bodyTypeRequiredWithFiscal],
  ['wheel_type', v.wheelTypeRequiredWithFiscal],
  ['tara', v.taraRequiredWithFiscal],
  ['capacity', v.capacityRequiredWithFiscal],
  ['owner_type', v.ownerTypeRequiredWithFiscal],
  ['owner_document', v.ownerDocumentRequiredWithFiscal],
  ['owner_name', v.ownerNameRequiredWithFiscal],
  ['owner_ie', v.ownerIeRequiredWithFiscal],
  ['owner_uf', v.ownerUfRequiredWithFiscal],
  ['owner_tp', v.ownerTpRequiredWithFiscal],
] as const;

const fiscalFull = {
  use_fiscal: true,
  plate: 'ABC1D23',
  type: '1',
  body_type: '1',
  wheel_type: '1',
  tara: 10,
  capacity: 20,
  owner_type: 'f',
  owner_document: '52998224725',
  owner_name: 'Fulano',
  owner_ie: '123456',
  owner_uf: 'SP',
  owner_tp: 1,
};

const base = {
  family_equipment_uuid: { value: 'fam-1', label: 'Família' },
  description: 'Trator',
  status: 1,
  vl_time_productive: 100,
  vl_acquisition: 1000,
  year_mod: '2020',
  has_depreciation: false,
  depreciation_type: 0,
  ...fiscalFull,
};

async function errorsOf(payload: Record<string, unknown>) {
  try {
    await equipmentSchema(pt).validate(payload, { abortEarly: false });
    return {} as Record<string, string>;
  } catch (e) {
    const map: Record<string, string> = {};
    (e as { inner: { path: string; message: string }[] }).inner.forEach((i) => {
      map[i.path] = i.message;
    });
    return map;
  }
}

describe('UT-000688 — equipmentSchema obrigatoriedade fiscal condicional', () => {
  it.each(FISCAL_REQUIRED)(
    'use_fiscal=true e %s vazio falha com a mensagem i18n',
    async (field, message) => {
      const empty =
        field === 'tara' || field === 'capacity'
          ? null
          : field.startsWith('owner_') &&
              ['owner_document', 'owner_name', 'owner_ie'].includes(field)
            ? ''
            : null;
      const errors = await errorsOf({ ...base, [field]: empty });
      expect(errors[field]).toBe(message);
    }
  );

  it('valores zero (tara, capacity, owner_tp) são válidos', async () => {
    const errors = await errorsOf({ ...base, tara: 0, capacity: 0, owner_tp: 0 });
    expect(errors.tara).toBeUndefined();
    expect(errors.capacity).toBeUndefined();
    expect(errors.owner_tp).toBeUndefined();
  });

  it('use_fiscal=false com os 11 campos nulos passa', async () => {
    const cleared = Object.fromEntries(FISCAL_REQUIRED.map(([field]) => [field, null]));
    const errors = await errorsOf({ ...base, use_fiscal: false, plate: null, ...cleared });
    expect(errors).toEqual({});
  });

  it('use_fiscal=true com payload fiscal completo passa', async () => {
    expect(await errorsOf(base)).toEqual({});
  });

  it('uf, rntrc e brand vazios passam; plate vazio falha com plateRequiredWithFiscal', async () => {
    const optional = await errorsOf({ ...base, uf: null, rntrc: '', brand: '' });
    expect(optional).toEqual({});

    const plate = await errorsOf({ ...base, plate: '' });
    expect(plate.plate).toBe(v.plateRequiredWithFiscal);
  });
});
