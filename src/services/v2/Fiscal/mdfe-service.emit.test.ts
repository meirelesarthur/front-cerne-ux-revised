import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ post: vi.fn(), get: vi.fn() }));
vi.mock('@/services/api', () => ({ default: { V2: { post: mocks.post, get: mocks.get } } }));

import { emitMdfe, listMdfeIssuerOptions } from './mdfe-service';

beforeEach(() => {
  mocks.post.mockReset().mockResolvedValue({ data: { data: {} } });
  mocks.get.mockReset().mockResolvedValue({ data: { data: [] } });
});

describe('mdfe-service — emissão (D3)', () => {
  it('emitMdfe envia { issuer_uuid } no corpo', async () => {
    await emitMdfe('m1', { issuer_uuid: 'iss-1' });
    expect(mocks.post).toHaveBeenCalledWith('/mdfes/m1/emit', { issuer_uuid: 'iss-1' });
  });

  it('listMdfeIssuerOptions consulta GET /mdfes/issuer-options', async () => {
    await listMdfeIssuerOptions();
    expect(mocks.get).toHaveBeenCalledWith('/mdfes/issuer-options');
  });
});
