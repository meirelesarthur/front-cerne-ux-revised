// src/validations/schemas/RequestPurchases/request-purchase-schema.test.ts
// -----------------------------------------------------------------------------
// Smoke ad hoc (agente) da TASK-RP-FE-05 — Cenários da Tarefa: `type=F` sem
// `amount` no item reprova (DA-RP-18, correção). Execução 081 (T-081-FE-05):
// produto OPCIONAL em P/M/U (legado), anexos F/E/U mín. 1 linha com descrição,
// máximos de item, Encarregado condicional e observação máx. 800. Cobre também `type=B` (divergência documentada no
// cabeçalho de `request-purchase-schema.ts` — `service_description`
// obrigatório) e `attachments[].file` condicional (DA-RP-18/legado). Ambiente
// `node` (default do `vitest.config.ts`, sem sufixo `.tsx`).
// -----------------------------------------------------------------------------

import { describe, expect, it } from 'vitest';

import { languagePtBr } from '@/constants/languages/languagePtBr';

import { requestPurchaseSchema } from './request-purchase-schema';

const languageGB = languagePtBr.BR;
const schema = requestPurchaseSchema(languageGB);

const baseHeader = {
  type: { label: 'Compra Efetuada', value: 'F' },
  request_date: '2026-08-06',
  justification: 'Justificativa de teste',
  description: 'Descrição de teste',
  attachments: [],
};

describe('requestPurchaseSchema — matriz condicional por type (DA-RP-05/DA-RP-18)', () => {
  it('type=F (Compra Efetuada) sem amount no item REPROVA (DA-RP-18, correção)', async () => {
    const payload = {
      ...baseHeader,
      type: { label: 'Compra Efetuada', value: 'F' },
      items: [{ product_uuid: null, quantity: null, amount: null }],
      attachments: [{ attachment_uuid: 'existing-uuid', name: 'Nota', file: null }],
    };

    await expect(schema.validate(payload, { abortEarly: false })).rejects.toMatchObject({
      inner: expect.arrayContaining([
        expect.objectContaining({
          path: 'items[0].amount',
          message:
            languageGB.requestPurchases.requestPurchase.form.validation.amountRequiredForType,
        }),
      ]),
    });
  });

  it('type=F (Compra Efetuada) COM amount no item PASSA a checagem do item', async () => {
    const payload = {
      ...baseHeader,
      type: { label: 'Compra Efetuada', value: 'F' },
      items: [
        { product_uuid: null, quantity: null, amount: 150.5, description: 'Descrição do item' },
      ],
      attachments: [{ attachment_uuid: 'existing-uuid', name: 'Nota', file: null }],
    };

    await expect(schema.validate(payload, { abortEarly: false })).resolves.toBeTruthy();
  });

  it('type=P (Produto) sem product_uuid PASSA: produto é opcional como no legado (PR-I01)', async () => {
    const payload = {
      ...baseHeader,
      type: { label: 'Produto', value: 'P' },
      items: [{ product_uuid: null, quantity: 3, description: 'Parafuso' }],
      attachments: [],
    };

    await expect(schema.validate(payload, { abortEarly: false })).resolves.toBeTruthy();
  });

  it('type=P sem descrição REPROVA e descrição com mais de 60 caracteres REPROVA (PR-I03)', async () => {
    const messages = languageGB.requestPurchases.requestPurchase.form.validation;
    const semDescricao = {
      ...baseHeader,
      type: { label: 'Produto', value: 'P' },
      items: [{ quantity: 1, description: '' }],
    };
    await expect(schema.validate(semDescricao, { abortEarly: false })).rejects.toMatchObject({
      inner: expect.arrayContaining([
        expect.objectContaining({
          path: 'items[0].description',
          message: messages.descriptionRequiredForType,
        }),
      ]),
    });

    const longa = {
      ...baseHeader,
      type: { label: 'Produto', value: 'P' },
      items: [{ quantity: 1, description: 'x'.repeat(61) }],
    };
    await expect(schema.validate(longa, { abortEarly: false })).rejects.toMatchObject({
      inner: expect.arrayContaining([
        expect.objectContaining({
          path: 'items[0].description',
          message: messages.itemDescriptionMaxLength,
        }),
      ]),
    });
  });

  it('type=F sem produto PASSA (select opcional em F/E, PR-I12)', async () => {
    const payload = {
      ...baseHeader,
      type: { label: 'Compra Efetuada', value: 'F' },
      items: [{ product_uuid: null, amount: 10, description: 'Nota' }],
      attachments: [{ attachment_uuid: null, name: 'Nota', file: new File(['x'], 'nota.pdf') }],
    };
    await expect(schema.validate(payload, { abortEarly: false })).resolves.toBeTruthy();
  });

  it('type=P (Produto) sem quantity no item REPROVA (regra 4)', async () => {
    const payload = {
      ...baseHeader,
      type: { label: 'Produto', value: 'P' },
      items: [
        {
          product_uuid: { label: 'Produto X', value: 'uuid-produto' },
          quantity: null,
          description: 'Item',
        },
      ],
      attachments: [],
    };

    await expect(schema.validate(payload, { abortEarly: false })).rejects.toMatchObject({
      inner: expect.arrayContaining([
        expect.objectContaining({
          path: 'items[0].quantity',
          message:
            languageGB.requestPurchases.requestPurchase.form.validation.quantityRequiredForType,
        }),
      ]),
    });
  });

  it('type=B (Despesa Fixa) sem service_description REPROVA (divergência documentada — contrato §4 inclui B)', async () => {
    const payload = {
      ...baseHeader,
      type: { label: 'Despesa Fixa', value: 'B' },
      items: [{ amount: 200, service_description: null }],
      attachments: [],
    };

    await expect(schema.validate(payload, { abortEarly: false })).rejects.toMatchObject({
      inner: expect.arrayContaining([
        expect.objectContaining({
          path: 'items[0].service_description',
          message:
            languageGB.requestPurchases.requestPurchase.form.validation
              .serviceDescriptionRequiredForType,
        }),
      ]),
    });
  });

  it('type=F sem attachments[].file e sem attachment_uuid existente REPROVA (contrato §4)', async () => {
    const payload = {
      ...baseHeader,
      type: { label: 'Compra Efetuada', value: 'F' },
      items: [{ product_uuid: null, quantity: null, amount: 100 }],
      attachments: [{ attachment_uuid: null, name: 'Nota', file: null }],
    };

    await expect(schema.validate(payload, { abortEarly: false })).rejects.toMatchObject({
      inner: expect.arrayContaining([
        expect.objectContaining({
          path: 'attachments[0].file',
          message:
            languageGB.requestPurchases.requestPurchase.form.validation
              .attachmentFileRequiredForType,
        }),
      ]),
    });
  });

  it('type=S (Serviço) não exige attachments[].file (fora dos 3 tipos F/E/U)', async () => {
    const payload = {
      ...baseHeader,
      type: { label: 'Serviço', value: 'S' },
      items: [{ quantity: 2, description: 'Descrição do item' }],
      attachments: [{ attachment_uuid: null, file: null }],
    };

    await expect(schema.validate(payload, { abortEarly: false })).resolves.toBeTruthy();
  });

  it('items vazio REPROVA (min(1), itemsMinOne)', async () => {
    const payload = {
      ...baseHeader,
      type: { label: 'Produto', value: 'P' },
      items: [],
      attachments: [],
    };

    await expect(schema.validate(payload, { abortEarly: false })).rejects.toMatchObject({
      inner: expect.arrayContaining([
        expect.objectContaining({
          path: 'items',
          message: languageGB.requestPurchases.requestPurchase.form.validation.itemsMinOne,
        }),
      ]),
    });
  });

  it('type=U, F e E sem nenhuma linha de anexo REPROVAM (PR-N01, mín. 1)', async () => {
    const message = languageGB.requestPurchases.requestPurchase.form.validation.attachmentsMinOne;
    for (const value of ['F', 'E', 'U']) {
      const payload = {
        ...baseHeader,
        type: { label: value, value },
        items: [{ amount: 10, quantity: 1, description: 'Item' }],
        attachments: [],
      };
      await expect(schema.validate(payload, { abortEarly: false })).rejects.toMatchObject({
        inner: expect.arrayContaining([
          expect.objectContaining({ path: 'attachments', message }),
        ]),
      });
    }
  });

  it('type=U com anexo sem descrição REPROVA (nome obrigatório por linha, SV16)', async () => {
    const payload = {
      ...baseHeader,
      type: { label: 'Emergencial', value: 'U' },
      items: [{ quantity: 1, description: 'Item' }],
      attachments: [{ attachment_uuid: null, name: '', file: new File(['x'], 'a.pdf') }],
    };
    await expect(schema.validate(payload, { abortEarly: false })).rejects.toMatchObject({
      inner: expect.arrayContaining([
        expect.objectContaining({ path: 'attachments[0].name' }),
      ]),
    });
  });

  it('type=C (Empreita) exige Descrição de serviços e valor (A-16)', async () => {
    const payload = {
      ...baseHeader,
      type: { label: 'Empreita', value: 'C' },
      items: [{ amount: null, service_description: '' }],
    };
    await expect(schema.validate(payload, { abortEarly: false })).rejects.toMatchObject({
      inner: expect.arrayContaining([
        expect.objectContaining({ path: 'items[0].amount' }),
        expect.objectContaining({ path: 'items[0].service_description' }),
      ]),
    });
  });

  it('type=D (Diária): descrição do serviço com mais de 200 caracteres REPROVA', async () => {
    const payload = {
      ...baseHeader,
      type: { label: 'Diária', value: 'D' },
      items: [
        {
          name: 'João',
          nif: '123.456.789-09',
          phone: '(11) 99999-9999',
          daily_quantity: 2,
          service_description: 'x'.repeat(201),
        },
      ],
    };
    await expect(schema.validate(payload, { abortEarly: false })).rejects.toMatchObject({
      inner: expect.arrayContaining([
        expect.objectContaining({
          path: 'items[0].service_description',
          message:
            languageGB.requestPurchases.requestPurchase.form.validation
              .itemServiceDescriptionMaxLength,
        }),
      ]),
    });
  });

  it('observação do cabeçalho com mais de 800 caracteres REPROVA (PR-C10)', async () => {
    const payload = {
      ...baseHeader,
      type: { label: 'Serviço', value: 'S' },
      observation: 'x'.repeat(801),
      items: [{ quantity: 1, description: 'Serviço' }],
    };
    await expect(schema.validate(payload, { abortEarly: false })).rejects.toMatchObject({
      inner: expect.arrayContaining([expect.objectContaining({ path: 'observation' })]),
    });
  });

  it('Encarregado: obrigatório só quando a API informa requires_authorizer (PR-A04)', async () => {
    const payload = {
      ...baseHeader,
      type: { label: 'Serviço', value: 'S' },
      authorizer_uuid: null,
      items: [{ quantity: 1, description: 'Serviço' }],
    };
    await expect(schema.validate(payload, { abortEarly: false })).resolves.toBeTruthy();

    const strict = requestPurchaseSchema(languageGB, { requiresAuthorizer: true });
    await expect(strict.validate(payload, { abortEarly: false })).rejects.toMatchObject({
      inner: expect.arrayContaining([expect.objectContaining({ path: 'authorizer_uuid' })]),
    });
    await expect(
      strict.validate(
        { ...payload, authorizer_uuid: { label: 'Chefe', value: 'uuid-chefe' } },
        { abortEarly: false }
      )
    ).resolves.toBeTruthy();
  });

  it('UT-000743: valida sem harvest_uuid/parent_uuid/nfe e o schema não declara esses campos', async () => {
    const payload = {
      ...baseHeader,
      type: { label: 'Serviço', value: 'S' },
      items: [{ quantity: 1, description: 'Serviço' }],
    };
    await expect(schema.validate(payload, { abortEarly: false })).resolves.toBeTruthy();
    const fields = Object.keys(schema.fields);
    for (const key of ['harvest_uuid', 'parent_uuid', 'nfe']) {
      expect(fields).not.toContain(key);
    }
  });
});
