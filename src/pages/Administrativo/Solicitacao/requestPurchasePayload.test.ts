// UT-000743 / TF-01 — o payload de POST/PUT NÃO carrega harvest_uuid/parent_uuid/nfe.
import { describe, expect, it } from 'vitest';

import type { RequestPurchaseForm } from '@/@types/v2/RequestPurchases';

import { buildRequestPurchasePayload } from './requestPurchasePayload';

const FORBIDDEN = ['harvest_uuid', 'parent_uuid', 'nfe'] as const;

function makeForm(overrides: Partial<RequestPurchaseForm> = {}): RequestPurchaseForm {
  return {
    type: { label: 'Compra', value: 'P' },
    request_date: '2026-10-11',
    justification: '  Justificativa  ',
    description: '  Descrição  ',
    priority: { label: 'Alta', value: 2 },
    authorizer_uuid: { label: 'Fulano', value: 'auth-uuid' },
    observation: '   ',
    items: [
      {
        item_uuid: null,
        product_uuid: { label: 'Prod', value: 'prod-uuid' },
        quantity: 3,
        amount: null,
        name: '  ',
        description: ' desc ',
      },
    ],
    attachments: [
      { attachment_uuid: null, name: ' Nota ', file: null },
      { attachment_uuid: null, name: '', file: null },
    ],
    ...overrides,
  };
}

describe('buildRequestPurchasePayload', () => {
  it('create: não contém as chaves harvest_uuid/parent_uuid/nfe', () => {
    const payload = buildRequestPurchasePayload(makeForm(), { isEditing: false });
    for (const key of FORBIDDEN) expect(key in payload).toBe(false);
  });

  it('update: não contém as chaves (nem null) mesmo se o form as carregar por cast', () => {
    const form = {
      ...makeForm(),
      harvest_uuid: { label: 'Safra', value: 'h' },
      parent_uuid: { label: 'Pai', value: 'p' },
      nfe: '123',
    } as unknown as RequestPurchaseForm;
    const payload = buildRequestPurchasePayload(form, { isEditing: true, persistedType: 'P' });
    for (const key of FORBIDDEN) expect(key in payload).toBe(false);
  });

  it('create usa o tipo do form; update usa o tipo PERSISTIDO (imutável)', () => {
    expect(buildRequestPurchasePayload(makeForm(), { isEditing: false }).type).toBe('P');
    expect(
      buildRequestPurchasePayload(makeForm({ type: { label: 'Outro', value: 'S' } }), {
        isEditing: true,
        persistedType: 'F',
      }).type
    ).toBe('F');
  });

  it('update sem tipo persistido cai no valor do form', () => {
    expect(buildRequestPurchasePayload(makeForm(), { isEditing: true }).type).toBe('P');
  });

  it('aplica trim e converte opcionais vazios em null', () => {
    const payload = buildRequestPurchasePayload(makeForm(), { isEditing: false });
    expect(payload.justification).toBe('Justificativa');
    expect(payload.description).toBe('Descrição');
    expect(payload.observation).toBeNull();
    expect(payload.priority).toBe(2);
    expect(payload.authorizer_uuid).toBe('auth-uuid');
    expect(payload.items[0]).toMatchObject({
      product_uuid: 'prod-uuid',
      quantity: 3,
      amount: null,
      name: null,
      description: 'desc',
    });
  });

  it('descarta linhas de anexo vazias e mantém as preenchidas', () => {
    const payload = buildRequestPurchasePayload(makeForm(), { isEditing: false });
    expect(payload.attachments).toHaveLength(1);
    expect(payload.attachments?.[0].name).toBe('Nota');
  });

  it('priority/authorizer ausentes viram null', () => {
    const payload = buildRequestPurchasePayload(
      makeForm({ priority: null, authorizer_uuid: null }),
      { isEditing: false }
    );
    expect(payload.priority).toBeNull();
    expect(payload.authorizer_uuid).toBeNull();
  });
});
