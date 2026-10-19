// UT-000743 / TF-02 + TF-04 — contrato de wire do service de Solicitação de Compra.
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getMock } = vi.hoisted(() => ({ getMock: vi.fn() }));

vi.mock('@/services/api', () => ({
  default: { V2: { get: getMock, post: vi.fn(), put: vi.fn(), delete: vi.fn() } },
}));

import type { RequestPurchasePayload } from '@/@types/v2/RequestPurchases';

import {
  buildRequestPurchaseFormData,
  getNextRequestPurchaseCode,
} from './request-purchase-service';

const base: RequestPurchasePayload = {
  type: 'P',
  request_date: '2026-10-11',
  justification: 'J',
  description: 'D',
  priority: 1,
  authorizer_uuid: 'auth-uuid',
  observation: 'obs',
  items: [{ item_uuid: 'i1', product_uuid: 'p1', quantity: 2 } as never],
  attachments: [{ attachment_uuid: null, name: 'Nota', file: new File(['x'], 'a.txt') }],
};

describe('buildRequestPurchaseFormData (UT-000743)', () => {
  it('não envia harvest_uuid/parent_uuid/nfe mesmo se forçados por cast', () => {
    const forced = {
      ...base,
      harvest_uuid: 'h-uuid',
      parent_uuid: 'p-uuid',
      nfe: '999',
    } as unknown as RequestPurchasePayload;
    const fd = buildRequestPurchaseFormData(forced);
    expect(fd.has('harvest_uuid')).toBe(false);
    expect(fd.has('parent_uuid')).toBe(false);
    expect(fd.has('nfe')).toBe(false);
  });

  it('mantém type, campos do cabeçalho, itens e anexos indexados', () => {
    const fd = buildRequestPurchaseFormData(base);
    expect(fd.get('type')).toBe('P');
    expect(fd.get('request_date')).toBe('2026-10-11');
    expect(fd.get('priority')).toBe('1');
    expect(fd.get('authorizer_uuid')).toBe('auth-uuid');
    expect(fd.get('observation')).toBe('obs');
    expect(fd.get('items[0][item_uuid]')).toBe('i1');
    expect(fd.get('items[0][product_uuid]')).toBe('p1');
    expect(fd.get('items[0][quantity]')).toBe('2');
    expect(fd.get('attachments[0][name]')).toBe('Nota');
    expect(fd.get('attachments[0][file]')).toBeInstanceOf(File);
  });
});

describe('getNextRequestPurchaseCode (UT-000743)', () => {
  beforeEach(() => getMock.mockReset());

  it('chama /request-purchases/next-code e devolve { code } desempacotado', async () => {
    getMock.mockResolvedValue({
      data: { success: true, message: 'ok', data: { code: '0042' } },
    });
    await expect(getNextRequestPurchaseCode()).resolves.toEqual({ code: '0042' });
    expect(getMock).toHaveBeenCalledWith('/request-purchases/next-code');
  });
});
