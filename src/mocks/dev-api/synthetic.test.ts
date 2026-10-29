import { beforeAll, describe, expect, it } from 'vitest';

import { loadSynthetic, syntheticHandle } from './synthetic';

const get = (path: string, params: Record<string, any> = {}) => syntheticHandle({ method: 'get', path, params, body: undefined });

describe('mock sintético', () => {
  beforeAll(async () => {
    expect(await loadSynthetic()).toBe(true);
  });

  it('lista paginada no formato do envelope, determinística', () => {
    const a = get('/banks', { page: 1, per_page: 10 })!;
    const b = get('/banks', { page: 1, per_page: 10 })!;
    expect(a.status).toBe(200);
    const env = a.data as any;
    expect(env.success).toBe(true);
    expect(env.data).toHaveLength(10);
    expect(env.meta).toMatchObject({ current_page: 1, per_page: 10, total: 15, last_page: 2 });
    expect(env.data[0]).toEqual(expect.objectContaining({ uuid: expect.any(String), name: expect.any(String), code: expect.any(String) }));
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect((get('/banks', { page: 2, per_page: 10 })!.data as any).data).toHaveLength(5);
  });

  it('busca filtra pelas linhas', () => {
    const all = (get('/banks', { per_page: 50 })!.data as any).data;
    const term = String(all[3].name).slice(0, 8);
    const found = (get('/banks', { per_page: 50, search: term })!.data as any).data;
    expect(found.length).toBeGreaterThan(0);
    expect(found.every((r: any) => Object.values(r).some((v) => typeof v === 'string' && v.toLowerCase().includes(term.toLowerCase())))).toBe(true);
    expect((get('/banks', { search: 'zzzz-nao-existe' })!.data as any).data).toHaveLength(0);
  });

  it('detalhe devolve a mesma linha da lista', () => {
    const row = (get('/banks', { per_page: 50 })!.data as any).data[2];
    const detail = (get(`/banks/${row.uuid}`)!.data as any).data;
    expect(detail.uuid).toBe(row.uuid);
    expect(detail.name).toBe(row.name);
  });

  it('criar, editar e excluir em memória', () => {
    const created = syntheticHandle({ method: 'post', path: '/banks', params: {}, body: { code: '999', name: 'Banco Novo' } })!;
    expect(created.status).toBe(201);
    const row = (created.data as any).data;
    expect(row.name).toBe('Banco Novo');
    expect((get('/banks', { per_page: 50 })!.data as any).data[0].uuid).toBe(row.uuid);

    const edited = syntheticHandle({ method: 'put', path: `/banks/${row.uuid}`, params: {}, body: { name: 'Banco Editado' } })!;
    expect((edited.data as any).data.name).toBe('Banco Editado');
    expect((get(`/banks/${row.uuid}`)!.data as any).data.name).toBe('Banco Editado');

    const removed = syntheticHandle({ method: 'delete', path: `/banks/${row.uuid}`, params: {}, body: undefined })!;
    expect(removed.status).toBe(204);
    expect((get('/banks', { per_page: 50 })!.data as any).data.some((r: any) => r.uuid === row.uuid)).toBe(false);
  });

  it('rotas fora dos serviços não são atendidas', () => {
    expect(get('/rota-que-nao-existe-em-servico')).toBeNull();
  });
});
