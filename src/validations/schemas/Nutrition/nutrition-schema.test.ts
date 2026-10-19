import { describe, expect, it } from 'vitest';

import { languagePtBr } from '@/constants/languages/languagePtBr';

import { nutritionSchema } from './nutrition-schema';

const languageGB = languagePtBr.BR;
const schema = nutritionSchema(languageGB);
const messages = languageGB.nutritions.nutrition.form.validation;

const warehouse = { label: 'Armazém 1', value: 'w-1' };
const baseItem = {
  trough_id: { label: 'Cocho', value: 't-1' },
  quantity: 5,
  product_id: { label: 'Produto', value: 'p-1' },
  diet_beat_id: null,
  warehouse_id: warehouse as typeof warehouse | null,
  batches: ['b-1'],
};

async function errorsOf(item: Record<string, unknown>) {
  try {
    await schema.validate(
      { date: '2026-10-01', time_control: false, items: [{ ...baseItem, ...item }] },
      { abortEarly: false }
    );
    return [] as { path?: string; message: string }[];
  } catch (error) {
    return (error as { inner: { path?: string; message: string }[] }).inner;
  }
}

describe('nutritionSchema — armazém obrigatório (TASK-095-FE-R2-01)', () => {
  it('aceita item de produto com armazém', async () => {
    expect(await errorsOf({})).toEqual([]);
  });

  it('recusa item de produto sem armazém, no campo warehouse_id', async () => {
    const errors = await errorsOf({ warehouse_id: null });
    expect(errors).toContainEqual(
      expect.objectContaining({
        path: 'items[0].warehouse_id',
        message: messages.itemWarehouseRequired,
      })
    );
  });

  it('não exige armazém em item de dieta automática (sem produto)', async () => {
    const errors = await errorsOf({
      product_id: null,
      warehouse_id: null,
      diet_beat_id: { label: 'Dieta', value: 'd-1' },
    });
    expect(errors).toEqual([]);
  });
});
