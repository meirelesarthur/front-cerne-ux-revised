// UT-000795 — regras de Apropriação Direta no schema de Contas a Pagar.
import { describe, expect, it } from 'vitest';

import { languagePtBr } from '@/constants/languages/languagePtBr';

import { expenseSchema } from './expense-schema';

const lang = languagePtBr.BR as any;
const schema = expenseSchema(lang);
const messages = lang.financial.expense.form.validation;

const opt = (value: unknown, extra: Record<string, unknown> = {}) => ({
  label: String(value),
  value,
  ...extra,
});

function base(overrides: Record<string, unknown> = {}) {
  return {
    appropriation: opt(1),
    appropriation_type: null,
    is_taxation: opt(false),
    provider_uuid: opt('prov-1'),
    aprop_pec_area_uuid: null,
    aprop_pec_grazing_uuid: null,
    aprop_pec_batch_uuid: null,
    aprop_pec_animal_uuid: null,
    aprop_pec_operation_uuid: null,
    aprop_pec_activity_uuid: null,
    aprop_man_equipment_uuid: null,
    aprop_man_hour_meter: null,
    aprop_man_mileage: null,
    ...overrides,
  };
}

async function errorOf(path: string, values: Record<string, unknown>) {
  try {
    await schema.validateAt(path, values, { context: { isEditing: false } });
    return null;
  } catch (e) {
    return (e as Error).message;
  }
}

const livestock = { appropriation_type: opt(2) };
const maintenance = { appropriation_type: opt(4) };

describe('Pecuária (Direta + tipo 2)', () => {
  it('Operação e Atividade obrigatórias', async () => {
    expect(await errorOf('aprop_pec_operation_uuid', base(livestock))).toBe(
      messages.livestockOperationRequired
    );
    expect(await errorOf('aprop_pec_activity_uuid', base(livestock))).toBe(
      messages.livestockActivityRequired
    );
    expect(
      await errorOf(
        'aprop_pec_operation_uuid',
        base({ ...livestock, aprop_pec_operation_uuid: opt('op') })
      )
    ).toBeNull();
  });

  it('Lote obrigatório quando há Animal', async () => {
    expect(
      await errorOf(
        'aprop_pec_batch_uuid',
        base({ ...livestock, aprop_pec_animal_uuid: opt('an') })
      )
    ).toBe(messages.livestockBatchRequired);
    expect(await errorOf('aprop_pec_batch_uuid', base(livestock))).toBeNull();
    expect(
      await errorOf(
        'aprop_pec_batch_uuid',
        base({
          ...livestock,
          aprop_pec_animal_uuid: opt('an'),
          aprop_pec_batch_uuid: opt('b'),
        })
      )
    ).toBeNull();
  });

  it('Área e Módulo juntos são inválidos; um só é válido', async () => {
    expect(
      await errorOf(
        'aprop_pec_area_uuid',
        base({ ...livestock, aprop_pec_area_uuid: opt('a'), aprop_pec_grazing_uuid: opt('g') })
      )
    ).toBe(messages.areaOrGrazingOnly);
    expect(
      await errorOf('aprop_pec_area_uuid', base({ ...livestock, aprop_pec_area_uuid: opt('a') }))
    ).toBeNull();
  });

  it('fora de Pecuária nenhuma exigência nova (Indireta, Área, Agricultura)', async () => {
    const others = [
      base({ appropriation: opt(2) }),
      base({ appropriation_type: opt(3) }),
      base({ appropriation_type: opt(1) }),
    ];
    for (const values of others) {
      expect(await errorOf('aprop_pec_operation_uuid', values)).toBeNull();
      expect(await errorOf('aprop_pec_activity_uuid', values)).toBeNull();
    }
  });
});

describe('Manutenção (Direta + tipo 4)', () => {
  it('Equipamento obrigatório', async () => {
    expect(await errorOf('aprop_man_equipment_uuid', base(maintenance))).toBe(
      messages.maintenanceEquipmentRequired
    );
    expect(
      await errorOf(
        'aprop_man_equipment_uuid',
        base({ ...maintenance, aprop_man_equipment_uuid: opt('eq', { uses_mileage: false }) })
      )
    ).toBeNull();
  });

  it('Horímetro obrigatório quando o equipamento não usa Km; zero é válido', async () => {
    const withEquipment = {
      ...maintenance,
      aprop_man_equipment_uuid: opt('eq', { uses_mileage: false }),
    };
    expect(await errorOf('aprop_man_hour_meter', base(withEquipment))).toBe(
      messages.hourMeterRequired
    );
    expect(
      await errorOf('aprop_man_hour_meter', base({ ...withEquipment, aprop_man_hour_meter: 0 }))
    ).toBeNull();
    expect(
      await errorOf('aprop_man_hour_meter', base({ ...withEquipment, aprop_man_hour_meter: 12.5 }))
    ).toBeNull();
  });

  it('Km obrigatório só quando o equipamento usa Km; zero é válido; horímetro dispensado', async () => {
    const km = { ...maintenance, aprop_man_equipment_uuid: opt('eq', { uses_mileage: true }) };
    expect(await errorOf('aprop_man_mileage', base(km))).toBe(messages.mileageRequired);
    expect(await errorOf('aprop_man_mileage', base({ ...km, aprop_man_mileage: 0 }))).toBeNull();
    expect(await errorOf('aprop_man_hour_meter', base(km))).toBeNull();
  });

  it('sem equipamento escolhido o medidor ainda não é exigido', async () => {
    expect(await errorOf('aprop_man_hour_meter', base(maintenance))).toBeNull();
    expect(await errorOf('aprop_man_mileage', base(maintenance))).toBeNull();
  });

  it('fora de Manutenção nenhuma exigência', async () => {
    expect(await errorOf('aprop_man_equipment_uuid', base({ appropriation: opt(2) }))).toBeNull();
    expect(
      await errorOf('aprop_man_equipment_uuid', base({ appropriation_type: opt(3) }))
    ).toBeNull();
  });
});

describe('Fornecedor (D-102-12)', () => {
  it('obrigatório em Direta 1/2/4 mesmo com is_taxation=Sim', async () => {
    for (const type of [1, 2, 4]) {
      const values = base({
        appropriation_type: opt(type),
        is_taxation: opt(true),
        provider_uuid: null,
      });
      expect(await errorOf('provider_uuid', values)).toBe(messages.providerRequired);
    }
  });

  it('Direta + Área ou Indireta com is_taxation=Sim: não exige', async () => {
    expect(
      await errorOf(
        'provider_uuid',
        base({ appropriation_type: opt(3), is_taxation: opt(true), provider_uuid: null })
      )
    ).toBeNull();
    expect(
      await errorOf(
        'provider_uuid',
        base({ appropriation: opt(2), is_taxation: opt(true), provider_uuid: null })
      )
    ).toBeNull();
  });

  it('is_taxation=Não continua exigindo (comportamento anterior)', async () => {
    expect(
      await errorOf('provider_uuid', base({ appropriation: opt(2), provider_uuid: null }))
    ).toBe(messages.providerRequired);
  });
});

describe('Agricultura (regressão)', () => {
  it('Área e Atividade obrigatórias; Operação e Cultura opcionais', async () => {
    const agri = base({ appropriation_type: opt(1) });
    expect(await errorOf('aprop_agri_area_uuid', agri)).toBe(messages.agriAreaRequired);
    expect(await errorOf('aprop_agri_activity_uuid', agri)).toBe(messages.agriActivityRequired);
    expect(await errorOf('aprop_agri_operation_uuid', agri)).toBeNull();
    expect(await errorOf('aprop_agri_cultivation_uuid', agri)).toBeNull();
  });
});
