import { describe, expect, it } from 'vitest';

import { tenantStatusOptions } from '@/constants/BaseRegistrations/options/tenant-status-options';
import { languageEnUs } from '@/constants/languages/languageEnUs';
import { languageEsEs } from '@/constants/languages/languageEsEs';
import { languagePtBr } from '@/constants/languages/languagePtBr';

describe('TASK-072-FE-08 — tenantStatusOptions (rótulos do legado)', () => {
  it.each([
    ['pt-BR', languagePtBr.BR, 'Habilitado'],
    ['en-US', languageEnUs.US, 'Enabled'],
    ['es-ES', languageEsEs.ES, 'Habilitado'],
  ])('status 1 = "%s" → %s', (_locale, languageGB, expected) => {
    expect(tenantStatusOptions.getLabel(1, languageGB)).toBe(expected);
    expect(tenantStatusOptions.getOption(1, languageGB)).toEqual({ label: expected, value: 1 });
  });

  it('options expõe os 4 status com o mesmo rótulo do getLabel (form, filtro e coluna)', () => {
    const languageGB = languagePtBr.BR;
    const options = tenantStatusOptions.options(languageGB);
    expect(options.map((option) => option.value)).toEqual([1, 2, 3, 4]);
    options.forEach((option) =>
      expect(option.label).toBe(tenantStatusOptions.getLabel(option.value, languageGB))
    );
  });
});
