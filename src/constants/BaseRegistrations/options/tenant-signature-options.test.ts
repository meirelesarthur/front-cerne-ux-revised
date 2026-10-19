import { describe, expect, it } from 'vitest';

import { tenantSignatureOptions } from '@/constants/BaseRegistrations/options/tenant-signature-options';
import { languageEnUs } from '@/constants/languages/languageEnUs';
import { languageEsEs } from '@/constants/languages/languageEsEs';
import { languagePtBr } from '@/constants/languages/languagePtBr';

describe('TASK-072-FE-08 — tenantSignatureOptions (rótulos do legado)', () => {
  it.each([
    ['pt-BR', languagePtBr.BR, 'Bianual'],
    ['en-US', languageEnUs.US, 'Biannual'],
    ['es-ES', languageEsEs.ES, 'Bianual'],
  ])('assinatura 6 em %s → %s', (_locale, languageGB, expected) => {
    expect(tenantSignatureOptions.getLabel(6, languageGB)).toBe(expected);
    expect(tenantSignatureOptions.getOption(6, languageGB)).toEqual({ label: expected, value: 6 });
  });

  it('options expõe as 7 assinaturas na ordem do enum', () => {
    expect(tenantSignatureOptions.options(languagePtBr.BR).map((option) => option.value)).toEqual([
      1, 2, 3, 4, 5, 6, 99,
    ]);
  });
});
