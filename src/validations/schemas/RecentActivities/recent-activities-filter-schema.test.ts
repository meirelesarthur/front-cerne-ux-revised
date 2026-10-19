// UT-000690 / TASK-092-FE-01 — T-FE-01.04: schema do filtro (end >= start).

import { describe, expect, it } from 'vitest';

import { languagePtBr } from '@/constants/languages/languagePtBr';

import type { LanguageDate } from '@/@types/language';

import { recentActivitiesFilterSchema } from './recent-activities-filter-schema';

const lang = languagePtBr.BR as unknown as LanguageDate;
const schema = recentActivitiesFilterSchema(lang);

describe('recentActivitiesFilterSchema', () => {
  it('aceita ambos vazios', async () => {
    await expect(schema.isValid({ types: [], start_date: null, end_date: null })).resolves.toBe(
      true
    );
    await expect(schema.isValid({})).resolves.toBe(true);
  });

  it('aceita end >= start', async () => {
    await expect(
      schema.isValid({ start_date: '2026-10-01', end_date: '2026-10-01' })
    ).resolves.toBe(true);
    await expect(
      schema.isValid({ start_date: '2026-10-01', end_date: '2026-10-05' })
    ).resolves.toBe(true);
  });

  it('rejeita end < start com a mensagem i18n', async () => {
    await expect(
      schema.validate({ start_date: '2026-10-05', end_date: '2026-10-01' })
    ).rejects.toThrow(lang.recentActivities.recentActivity.validation.endBeforeStart);
  });

  it('aceita só uma das datas', async () => {
    await expect(schema.isValid({ end_date: '2026-10-01' })).resolves.toBe(true);
    await expect(schema.isValid({ start_date: '2026-10-01' })).resolves.toBe(true);
  });
});
