import { describe, expect, it } from 'vitest';

import { tenantDueMonthOptions } from '@/constants/BaseRegistrations/options/tenant-due-month-options';
import { languageEnUs } from '@/constants/languages/languageEnUs';
import { languageEsEs } from '@/constants/languages/languageEsEs';
import { languagePtBr } from '@/constants/languages/languagePtBr';

describe('TASK-072-FE-07 — tenantDueMonthOptions (due_month 1–12)', () => {
  it.each([
    ['pt-BR', languagePtBr.BR, 'Janeiro', 'Dezembro'],
    ['en-US', languageEnUs.US, 'January', 'December'],
    ['es-ES', languageEsEs.ES, 'Enero', 'Diciembre'],
  ])('12 meses traduzidos em %s', (_locale, languageGB, first, last) => {
    const options = tenantDueMonthOptions.options(languageGB);
    expect(options).toHaveLength(12);
    expect(options.map((option) => option.value)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(
      options.every((option) => typeof option.label === 'string' && option.label.length > 0)
    ).toBe(true);
    expect(new Set(options.map((option) => option.label)).size).toBe(12);
    expect(options[0].label).toBe(first);
    expect(options[11].label).toBe(last);
  });

  it('getOption/getLabel usam a mesma tradução', () => {
    expect(tenantDueMonthOptions.getLabel(3, languagePtBr.BR)).toBe('Março');
    expect(tenantDueMonthOptions.getOption(3, languagePtBr.BR)).toEqual({
      label: 'Março',
      value: 3,
    });
  });
});
