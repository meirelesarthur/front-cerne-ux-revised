// src/validations/schemas/BreedingBatch/breeding-batch-schema.test.ts
// -----------------------------------------------------------------------------
// Smoke (agente) da Tarefa 04 (97-Esteiras/048) — cobre o ponto de fidelidade
// crítico do schema: `batches` exige `.min(1)` (achado #3 do backend,
// `batch_uuids: required|array|min:1`), diferente de `AnimalsFieldArray`/
// `ProductsFieldArray` (BullSeedSeason), que NÃO têm `.min(1)`. Ambiente
// `node` (default do `vitest.config.ts`, sem sufixo `.tsx`).
// -----------------------------------------------------------------------------

import { describe, expect, it } from 'vitest';

import { languagePtBr } from '@/constants/languages/languagePtBr';

import { breedingBatchSchema } from './breeding-batch-schema';

const languageGB = languagePtBr.BR;
const schema = breedingBatchSchema(languageGB);

const validPayload = {
  code: '0001',
  date: '2026-08-24',
  description: 'Lote de reprodução de teste',
  breeding_season: { label: 'Estação 2026', value: 'season-uuid-1' },
  batches: [{ batch: { label: 'Lote A', value: 'batch-uuid-1' } }],
};

describe('breedingBatchSchema — fundação (Tarefa 04, 97-Esteiras/048)', () => {
  it('payload completo e válido PASSA (sem erros)', async () => {
    await expect(schema.validate(validPayload)).resolves.toBeTruthy();
  });

  it('batches: [] REPROVA — .min(1) obrigatório (achado #3, diferente de AnimalsFieldArray/ProductsFieldArray)', async () => {
    const payload = { ...validPayload, batches: [] };

    await expect(schema.validate(payload, { abortEarly: false })).rejects.toMatchObject({
      inner: expect.arrayContaining([
        expect.objectContaining({
          path: 'batches',
          message: languageGB.breedingBatches.breedingBatch.form.validation.batchesMinRequired,
        }),
      ]),
    });
  });

  it('sem date REPROVA (required)', async () => {
    const payload = { ...validPayload, date: '' };

    await expect(schema.validate(payload, { abortEarly: false })).rejects.toMatchObject({
      inner: expect.arrayContaining([
        expect.objectContaining({
          path: 'date',
          message: languageGB.breedingBatches.breedingBatch.form.validation.dateRequired,
        }),
      ]),
    });
  });

  it('sem description REPROVA (required)', async () => {
    const payload = { ...validPayload, description: '' };

    await expect(schema.validate(payload, { abortEarly: false })).rejects.toMatchObject({
      inner: expect.arrayContaining([
        expect.objectContaining({
          path: 'description',
          message: languageGB.breedingBatches.breedingBatch.form.validation.descriptionRequired,
        }),
      ]),
    });
  });

  it('sem breeding_season REPROVA (required)', async () => {
    const payload = { ...validPayload, breeding_season: null };

    await expect(schema.validate(payload, { abortEarly: false })).rejects.toMatchObject({
      inner: expect.arrayContaining([
        expect.objectContaining({
          path: 'breeding_season',
          message: languageGB.breedingBatches.breedingBatch.form.validation.breedingSeasonRequired,
        }),
      ]),
    });
  });

  it('linha de batches sem batch selecionado REPROVA (required por linha)', async () => {
    const payload = { ...validPayload, batches: [{ batch: null }] };

    await expect(schema.validate(payload, { abortEarly: false })).rejects.toMatchObject({
      inner: expect.arrayContaining([
        expect.objectContaining({
          path: 'batches[0].batch',
          message: languageGB.breedingBatches.breedingBatch.form.validation.batchRequired,
        }),
      ]),
    });
  });
});
