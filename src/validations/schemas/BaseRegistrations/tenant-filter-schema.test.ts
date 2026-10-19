import { describe, expect, it } from 'vitest';

import { tenantFilterPristineValues } from '@/constants/BaseRegistrations/mappers/tenant-filter-mapper';
import { languagePtBr } from '@/constants/languages/languagePtBr';

import { tenantFilterSchema } from '@/validations/schemas/BaseRegistrations/tenant-filter-schema';

const languageGB = languagePtBr.BR;
const schema = tenantFilterSchema(languageGB);

describe('TASK-072-FE-07 — tenantFilterSchema', () => {
  it('filtro vazio é válido', async () => {
    await expect(schema.isValid(tenantFilterPristineValues)).resolves.toBe(true);
  });

  it('end_date anterior a start_date → invalidValue', async () => {
    await expect(
      schema.validateAt('end_date', {
        ...tenantFilterPristineValues,
        start_date: '2026-05-10',
        end_date: '2026-05-09',
      })
    ).rejects.toThrow(languageGB.defaltStrings.validations.invalidValue);
  });

  it('end_date sem start_date e intervalo igual são válidos', async () => {
    await expect(
      schema.isValid({ ...tenantFilterPristineValues, end_date: '2026-05-09' })
    ).resolves.toBe(true);
    await expect(
      schema.isValid({
        ...tenantFilterPristineValues,
        start_date: '2026-05-09',
        end_date: '2026-05-09',
      })
    ).resolves.toBe(true);
  });

  it('search acima de 60 caracteres usa a mensagem do módulo', async () => {
    await expect(
      schema.validateAt('search', { ...tenantFilterPristineValues, search: 'a'.repeat(61) })
    ).rejects.toThrow(languageGB.baseRegistrations.tenant.filter.searchMaxLength);
  });
});
