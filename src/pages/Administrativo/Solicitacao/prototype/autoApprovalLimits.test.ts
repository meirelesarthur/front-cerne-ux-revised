import { describe, expect, it } from 'vitest';

import { redistributeAutoApproval } from './autoApprovalLimits';

const base = { perOrder: 1000, dailyValue: 10000, dailyCount: 10 };

describe('redistributeAutoApproval', () => {
  it('mudar as transações recalcula o limite diário', () => {
    expect(redistributeAutoApproval(base, 'dailyCount', 4)).toEqual({ perOrder: 1000, dailyValue: 4000, dailyCount: 4 });
  });

  it('mudar o limite diário recalcula as transações (ordens que cabem)', () => {
    expect(redistributeAutoApproval(base, 'dailyValue', 7500)).toEqual({ perOrder: 1000, dailyValue: 7500, dailyCount: 7 });
  });

  it('mudar o valor por ordem recalcula o limite diário e mantém as transações', () => {
    expect(redistributeAutoApproval(base, 'perOrder', 500)).toEqual({ perOrder: 500, dailyValue: 5000, dailyCount: 10 });
  });

  it('sem valor por ordem, as transações ficam e o limite diário vai a 0', () => {
    expect(redistributeAutoApproval(base, 'perOrder', null)).toEqual({ perOrder: null, dailyValue: 0, dailyCount: 10 });
    const empty = { perOrder: 0, dailyValue: 0, dailyCount: 3 };
    expect(redistributeAutoApproval(empty, 'dailyValue', 900)).toEqual({ perOrder: 0, dailyValue: 900, dailyCount: 3 });
  });

  it('campos vazios contam como zero', () => {
    expect(redistributeAutoApproval(base, 'dailyCount', null)).toEqual({ perOrder: 1000, dailyValue: 0, dailyCount: null });
    expect(redistributeAutoApproval(base, 'dailyValue', null)).toEqual({ perOrder: 1000, dailyValue: null, dailyCount: 0 });
  });
});
