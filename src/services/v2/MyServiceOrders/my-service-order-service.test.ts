// TASK-FE-090-01 (bloco B) — prova a serialização multipart de
// `updateMyServiceOrderExecution` conforme TASK-090-API-03: chave ausente =
// "não mexe"; `campo=""` = "limpa"; nunca `campo=""` junto com `campo[i]`.

import { afterEach, describe, expect, it, vi } from 'vitest';

const ENVELOPE = { success: true, message: null, data: null, errors: null, meta: null };

const postMock = vi.fn<(...args: any[]) => Promise<{ data: typeof ENVELOPE }>>(async () => ({
  data: ENVELOPE,
}));

vi.mock('@/services/api', () => ({
  default: {
    V2: {
      get: vi.fn(),
      post: (...args: any[]) => postMock(...args),
    },
  },
}));

import type { MyServiceOrderExecutionPayload } from '@/@types/v2/MyServiceOrders';

import { updateMyServiceOrderExecution } from './my-service-order-service';

const ID_FIELDS = [
  'employees_checked_ids',
  'equipments_checked_ids',
  'products_checked_ids',
  'productions_checked_ids',
  'protections_checked_ids',
] as const;

function basePayload(
  overrides: Partial<MyServiceOrderExecutionPayload> = {}
): MyServiceOrderExecutionPayload {
  return {
    status: 2,
    execution_start_date: '2026-10-04 08:00:00',
    employees_checked_ids: [],
    equipments_checked_ids: [],
    products_checked_ids: [],
    productions_checked_ids: [],
    protections_checked_ids: [],
    attachments: [],
    ...overrides,
  };
}

async function sendAndCapture(payload: MyServiceOrderExecutionPayload): Promise<FormData> {
  await updateMyServiceOrderExecution('os-uuid', payload);
  expect(postMock).toHaveBeenCalledTimes(1);
  expect(postMock.mock.calls[0][0]).toBe('/my-service-orders/os-uuid');
  return postMock.mock.calls[0][1] as FormData;
}

function keys(fd: FormData): string[] {
  return Array.from(fd.keys());
}

describe('updateMyServiceOrderExecution — multipart (API-03)', () => {
  afterEach(() => {
    postMock.mockClear();
  });

  it('a) 5 listas vazias e attachments [] -> 6 chaves com valor vazio', async () => {
    const fd = await sendAndCapture(basePayload());
    [...ID_FIELDS, 'attachments'].forEach((field) => {
      expect(fd.getAll(field)).toEqual(['']);
    });
    expect(keys(fd).filter((k) => fd.get(k) === '')).toHaveLength(6);
  });

  it('b) listas preenchidas -> só campo[i], nenhum campo=""', async () => {
    const fd = await sendAndCapture(
      basePayload({
        employees_checked_ids: [1, 2],
        equipments_checked_ids: [3],
        products_checked_ids: [4],
        productions_checked_ids: [5],
        protections_checked_ids: [6],
      })
    );
    expect(fd.get('employees_checked_ids[0]')).toBe('1');
    expect(fd.get('employees_checked_ids[1]')).toBe('2');
    expect(fd.get('equipments_checked_ids[0]')).toBe('3');
    expect(fd.get('products_checked_ids[0]')).toBe('4');
    expect(fd.get('productions_checked_ids[0]')).toBe('5');
    expect(fd.get('protections_checked_ids[0]')).toBe('6');
    ID_FIELDS.forEach((field) => expect(fd.has(field)).toBe(false));
  });

  it('c) só linha de anexo em branco -> attachments=""', async () => {
    const fd = await sendAndCapture(
      basePayload({ attachments: [{ uuid: undefined, name: '', file: null }] as any })
    );
    expect(fd.getAll('attachments')).toEqual(['']);
    expect(keys(fd).some((k) => k.startsWith('attachments['))).toBe(false);
  });

  it('d) linha com uuid -> attachments[0][uuid] e nenhum attachments=""', async () => {
    const fd = await sendAndCapture(basePayload({ attachments: [{ uuid: 'anexo-uuid' }] as any }));
    expect(fd.get('attachments[0][uuid]')).toBe('anexo-uuid');
    expect(fd.has('attachments')).toBe(false);
  });

  it('e) _method=PUT presente', async () => {
    const fd = await sendAndCapture(basePayload());
    expect(fd.get('_method')).toBe('PUT');
  });
});
