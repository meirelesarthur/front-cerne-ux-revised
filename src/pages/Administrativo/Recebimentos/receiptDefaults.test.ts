// Execução 081, T-081-FE-10 — defaults do Confirmar Recebimento (contrato 09, FLD-03..10).
import { describe, expect, it } from 'vitest';

import type { RequestReceiptData } from '@/@types/v2/RequestReceipts';

import { buildConfirmReceiptDefaults, type ConfirmDefaultsContext } from './receiptDefaults';

const ctx: ConfirmDefaultsContext = {
  today: '2026-10-01',
  loggedUserName: 'Maria Logada',
  itemStatusOption: (value) => ({ label: value, value }),
  completionOption: (value) => ({
    label: value === 1 ? 'Compra Recebida' : 'Recebida Parcial',
    value,
  }),
};

function data(overrides: Partial<RequestReceiptData> = {}): RequestReceiptData {
  return {
    uuid: 'r1',
    code: '0012',
    type: 'P',
    type_label: 'Produto',
    status: 7,
    status_label: 'Compra Efetuada',
    request_date: '2026-09-01',
    description: 'x',
    nfe: null,
    receipt_date: '2026-09-20',
    receipt_date_suggested: '2026-10-01',
    receipt_note: 'antiga',
    responsible: { uuid: 'u', name: 'Outra Pessoa' },
    items: [
      {
        uuid: 'i1',
        description: 'Parafuso',
        status: null,
        delivery_date: null,
        quantity: 3,
      } as RequestReceiptData['items'][number],
      {
        uuid: 'i2',
        description: 'Porca',
        status: 'E',
        delivery_date: '2026-09-25',
        quantity: 1,
      } as RequestReceiptData['items'][number],
    ],
    updated_at: '2026-09-30',
    ...overrides,
  };
}

describe('buildConfirmReceiptDefaults', () => {
  it('abre com a data sugerida pela API e o status "Compra Recebida" (Total)', () => {
    const form = buildConfirmReceiptDefaults(data(), ctx);
    expect(form.receipt_date).toBe('2026-10-01');
    expect(form.purchase_status).toEqual({ label: 'Compra Recebida', value: 1 });
  });

  it('sem data sugerida cai em hoje (não na data gravada)', () => {
    const form = buildConfirmReceiptDefaults(data({ receipt_date_suggested: null }), ctx);
    expect(form.receipt_date).toBe('2026-10-01');
  });

  it('itens sem status viram P e sem data viram hoje; os preenchidos são mantidos', () => {
    const { items } = buildConfirmReceiptDefaults(data(), ctx);
    expect(items[0]).toMatchObject({
      uuid: 'i1',
      status: { value: 'P' },
      delivery_date: '2026-10-01',
    });
    expect(items[1]).toMatchObject({
      uuid: 'i2',
      status: { value: 'E' },
      delivery_date: '2026-09-25',
    });
  });

  it('Responsável é o usuário logado; Observações abrem vazias; NF-e vem do pedido', () => {
    const form = buildConfirmReceiptDefaults(data({ nfe: '555' }), ctx);
    expect(form.responsible).toBe('Maria Logada');
    expect(form.receipt_note).toBe('');
    expect(form.nfe).toBe('555');
  });

  it('abre com uma linha de anexo vazia', () => {
    expect(buildConfirmReceiptDefaults(data(), ctx).attachments).toEqual([
      { name: '', file: null },
    ]);
  });
});
