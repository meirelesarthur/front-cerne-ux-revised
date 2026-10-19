// UT-000787 — validação de placa nos schemas tocados: vazio passa; antiga/Mercosul
// (com ou sem hífen, minúscula) passam; lixo falha. Testa o campo isolado (validateAt).
import { describe, expect, it } from 'vitest';

import { getLanguageRouter } from '@/utils/get-language-route';

import { languageContextTypes } from '@/constants/languages';

import { equipmentSchema } from './CadastrosBase/equipment-schema';
import { chargeSchema } from './Carregamentos/charge-schema';
import { finishChargeSchema } from './Carregamentos/finish-charge-schema';
import { harvestProductSchema } from './HarvestProduct/harvestProduct-schema';
import { invoiceSchema } from './Invoices/invoice-schema';
import { mdfeSchema } from './Mdfe/mdfe-schema';
import { equipmentDialogSchema } from './ModuleWeighing/equipment-dialog-schema';

const lang = getLanguageRouter(languageContextTypes.BR);
const msg = lang.defaltStrings.validations.plateInvalid;

async function errorsAt(
  schema: { validateAt: (p: string, v: unknown, o?: object) => Promise<unknown> },
  path: string,
  values: unknown
) {
  try {
    await schema.validateAt(path, values, { abortEarly: false });
    return [] as string[];
  } catch (e) {
    return (e as { errors: string[] }).errors;
  }
}

const VALID = ['ABC-1234', 'ABC1234', 'abc1d23', 'ABC-1D23'];
const INVALID = ['AB-12', 'ABCD123', 'SEM PLACA'];

describe('placa nos schemas (UT-000787)', () => {
  const suites: Array<[string, any, string, (p: string | null) => unknown]> = [
    [
      'Equipamento use_fiscal',
      equipmentSchema(lang),
      'plate',
      (p) => ({ use_fiscal: true, plate: p }),
    ],
    [
      'EquipmentDialog useFiscal',
      equipmentDialogSchema(lang),
      'plate',
      (p) => ({ useFiscal: true, plate: p }),
    ],
    ['HarvestProduct', harvestProductSchema(lang), 'plate', (p) => ({ plate: p })],
    ['Carga criar', chargeSchema(lang), 'driver_plate', (p) => ({ driver_plate: p })],
    ['Carga finalizar', finishChargeSchema(lang), 'driver_plate', (p) => ({ driver_plate: p })],
    [
      'Invoice item',
      invoiceSchema(lang),
      'items[0].equipment.plate',
      (p) => ({ items: [{ equipment: { plate: p } }] }),
    ],
    [
      'MDF-e tp 1',
      mdfeSchema(lang),
      'info_descarga[0].id_unid_transp',
      (p) => ({ info_descarga: [{ tp_unid_transp: { value: 1 }, id_unid_transp: p }] }),
    ],
    [
      'MDF-e tp 2',
      mdfeSchema(lang),
      'info_descarga[0].id_unid_transp',
      (p) => ({ info_descarga: [{ tp_unid_transp: { value: 2 }, id_unid_transp: p }] }),
    ],
  ];

  describe.each(suites)('%s', (_name, schema, path, build) => {
    it.each(VALID)('aceita %s', async (v) => {
      expect(await errorsAt(schema, path, build(v))).not.toContain(msg);
    });
    it.each(INVALID)('rejeita %s', async (v) => {
      expect(await errorsAt(schema, path, build(v))).toContain(msg);
    });
    it('vazio passa no formato', async () => {
      expect(await errorsAt(schema, path, build(''))).not.toContain(msg);
    });
  });

  it('Equipamento sem use_fiscal permanece livre', async () => {
    expect(
      await errorsAt(equipmentSchema(lang), 'plate', { use_fiscal: false, plate: 'SEM PLACA' })
    ).not.toContain(msg);
    expect(
      await errorsAt(equipmentDialogSchema(lang), 'plate', { useFiscal: false, plate: 'SEM PLACA' })
    ).not.toContain(msg);
  });

  it('MDF-e tipos 3..7: livre ate 20, sem formato de placa', async () => {
    const p = 'info_descarga[0].id_unid_transp';
    const row = (tp: number, v: string) => ({
      info_descarga: [{ tp_unid_transp: { value: tp }, id_unid_transp: v }],
    });
    for (const tp of [3, 4, 5, 6, 7]) {
      expect(await errorsAt(mdfeSchema(lang), p, row(tp, 'NAVIO SAO JOAO'))).toEqual([]);
    }
    expect((await errorsAt(mdfeSchema(lang), p, row(3, 'X'.repeat(21)))).length).toBeGreaterThan(0);
  });
});
