// DD-078-01 — Data da Entrada de Insumos: máximo = hoje (dia local).
// Relógio simulado 22:00 em America/Sao_Paulo (UTC-3): em UTC já é o dia seguinte.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { languagePtBr } from '@/constants/languages/languagePtBr';

import { inputEntrySchema } from './input-entry-schema';

const languageGB = languagePtBr.BR;
const messages = languageGB.inputEntries.inputEntry.form.validation;
const schema = inputEntrySchema(languageGB);

const validateDate = (date: string | null) =>
  schema.validateAt('date', { date, items: [] }, { abortEarly: false });

describe('inputEntrySchema.date — máximo hoje (DD-078-01)', () => {
  const originalTz = process.env.TZ;

  beforeEach(() => {
    process.env.TZ = 'America/Sao_Paulo';
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-29T22:00:00-03:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
    if (originalTz === undefined) delete process.env.TZ;
    else process.env.TZ = originalTz;
  });

  it('aceita hoje (dia local, mesmo que em UTC já seja amanhã)', async () => {
    await expect(validateDate('2026-09-29')).resolves.toBe('2026-09-29');
  });

  it('aceita data passada', async () => {
    await expect(validateDate('2026-09-01')).resolves.toBe('2026-09-01');
  });

  it('recusa amanhã (dia local) com a mensagem de data futura', async () => {
    await expect(validateDate('2026-09-30')).rejects.toMatchObject({
      message: messages.dateFuture,
    });
  });

  it('vazio continua recusado por obrigatoriedade', async () => {
    await expect(validateDate(null)).rejects.toMatchObject({ message: messages.dateRequired });
  });
});

describe('inputEntrySchema.items — lote de item existente (DD-078-07 b)', () => {
  const row = (uuid?: string) => ({
    uuid,
    product_uuid: { label: 'P', value: 'p1', has_lot: true },
    provider_lot: '',
    shelf_life: null,
  });
  const check = (path: string, uuid?: string) =>
    schema.validateAt(path, { date: '2026-09-01', items: [row(uuid)] });

  it('item NOVO com produto has_lot exige lote e validade', async () => {
    await expect(check('items[0].provider_lot')).rejects.toMatchObject({
      message: messages.providerLotRequiredWhenHasLot,
    });
    await expect(check('items[0].shelf_life')).rejects.toMatchObject({
      message: messages.shelfLifeRequiredWhenHasLot,
    });
  });

  it('item EXISTENTE (uuid) não exige lote/validade (somente leitura)', async () => {
    await expect(check('items[0].provider_lot', 'item-1')).resolves.toBe('');
    await expect(check('items[0].shelf_life', 'item-1')).resolves.toBeNull();
  });
});
