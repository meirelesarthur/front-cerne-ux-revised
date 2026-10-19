import { describe, expect, it } from 'vitest';

import { PRODUCT_FISCAL_AUTOFILL_FIELDS } from './product-fiscal-autofill-fields';

describe('PRODUCT_FISCAL_AUTOFILL_FIELDS (C1)', () => {
  it('contem mot_des_icms, perc_dif e perc_fcp, sem duplicatas', () => {
    expect(PRODUCT_FISCAL_AUTOFILL_FIELDS).toEqual(
      expect.arrayContaining(['mot_des_icms', 'perc_dif', 'perc_fcp'])
    );
    expect(new Set(PRODUCT_FISCAL_AUTOFILL_FIELDS).size).toBe(
      PRODUCT_FISCAL_AUTOFILL_FIELDS.length
    );
  });

  it('nao inclui perc_ipi_devol (so item da NF-e)', () => {
    expect(PRODUCT_FISCAL_AUTOFILL_FIELDS as ReadonlyArray<string>).not.toContain('perc_ipi_devol');
  });
});
