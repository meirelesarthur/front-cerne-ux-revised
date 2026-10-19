// src/validations/schemas/RequestQuotations/request-quotation-schema.test.ts
// -----------------------------------------------------------------------------
// Smoke ad hoc (agente) da TASK-CQ-FE-01 — cobre os 4 campos do Dialog
// Criar/Editar Cotação (FIELD-01..04): `provider_uuid` obrigatório,
// `requires_file` obrigatório mas aceita a opção "Não" (`value: false`, caso
// crítico do padrão `Option<boolean>` — `false` é um valor DEFINIDO, não deve
// ser tratado como ausente), `branch_uuid`/`note` opcionais. Ambiente `node`
// (default do `vitest.config.ts`, sem sufixo `.tsx`).
// -----------------------------------------------------------------------------

import { describe, expect, it } from 'vitest';

import { languagePtBr } from '@/constants/languages/languagePtBr';

import { requestQuotationSchema } from './request-quotation-schema';

const languageGB = languagePtBr.BR;
const schema = requestQuotationSchema(languageGB);

const validPayload = {
  provider_uuid: { label: 'Fornecedor X', value: 'provider-uuid-1' },
  branch_uuid: null,
  requires_file: { label: 'Não', value: false },
  note: null,
};

describe('requestQuotationSchema — FIELD-01..04 (Dialog Criar/Editar Cotação)', () => {
  it('payload completo e válido PASSA', async () => {
    await expect(schema.validate(validPayload)).resolves.toBeTruthy();
  });

  it('sem provider_uuid REPROVA (FIELD-01, required)', async () => {
    const payload = { ...validPayload, provider_uuid: null };

    await expect(schema.validate(payload, { abortEarly: false })).rejects.toMatchObject({
      inner: expect.arrayContaining([
        expect.objectContaining({
          path: 'provider_uuid',
          message: languageGB.requestQuotations.requestQuotation.form.validation.providerRequired,
        }),
      ]),
    });
  });

  it('requires_file = Option{value:false} PASSA (false é valor definido, não ausente)', async () => {
    const payload = {
      ...validPayload,
      requires_file: { label: 'Não', value: false },
    };

    await expect(schema.validate(payload, { abortEarly: false })).resolves.toBeTruthy();
  });

  it('sem requires_file REPROVA (FIELD-03, required)', async () => {
    const payload = { ...validPayload, requires_file: null };

    await expect(schema.validate(payload, { abortEarly: false })).rejects.toMatchObject({
      inner: expect.arrayContaining([
        expect.objectContaining({
          path: 'requires_file',
          message:
            languageGB.requestQuotations.requestQuotation.form.validation.requiresFileRequired,
        }),
      ]),
    });
  });

  it('branch_uuid ausente PASSA (FIELD-02, opcional/dependente de cascata)', async () => {
    const payload = { ...validPayload, branch_uuid: null };

    await expect(schema.validate(payload)).resolves.toBeTruthy();
  });

  it('note ausente PASSA (FIELD-04, opcional, sem limite server-side)', async () => {
    const payload = { ...validPayload, note: null };

    await expect(schema.validate(payload)).resolves.toBeTruthy();
  });
});
