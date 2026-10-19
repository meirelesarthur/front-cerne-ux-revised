// UT-000754 / T-754-FE-01 — FE-SYNC-07: `syncNfses` passa timeout próprio de 120 s.
import { describe, expect, it, vi } from 'vitest';

import api from '@/services/api';

import { NFSE_SYNC_TIMEOUT_MS, syncNfses } from './nfse-service';

vi.mock('@/services/api', () => ({
  default: { V2: { post: vi.fn(), get: vi.fn() } },
}));

describe('nfse-service (UT-000754)', () => {
  it('FE-SYNC-07 syncNfses envia timeout: 120000 ao api.V2.post', async () => {
    const post = vi.mocked(api.V2.post);
    post.mockResolvedValue({ data: { data: [], meta: null } } as any);

    await syncNfses({ issuer_uuid: 'u-1' });

    expect(NFSE_SYNC_TIMEOUT_MS).toBe(120000);
    expect(post).toHaveBeenCalledWith('/nfses', { issuer_uuid: 'u-1' }, { timeout: 120000 });
  });
});
