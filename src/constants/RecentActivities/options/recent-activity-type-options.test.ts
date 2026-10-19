// UT-000690 / TASK-092-FE-01 — T-FE-01.03: fábrica 19 × 3 idiomas, sem label
// vazio, sem tipo excluído (D-092-06) e fallback para valor desconhecido.

import { describe, expect, it } from 'vitest';

import { languageEnUs } from '@/constants/languages/languageEnUs';
import { languageEsEs } from '@/constants/languages/languageEsEs';
import { languagePtBr } from '@/constants/languages/languagePtBr';
import { recentActivityType } from '@/constants/RecentActivities/recent-activity-type';

import type { LanguageDate } from '@/@types/language';

import { recentActivityTypeOptions } from './recent-activity-type-options';

const idiomas: Array<[string, LanguageDate]> = [
  ['pt-BR', languagePtBr.BR as unknown as LanguageDate],
  ['en-US', languageEnUs.US as unknown as LanguageDate],
  ['es-ES', languageEsEs.ES as unknown as LanguageDate],
];

const EXCLUIDOS = ['initial_herd', 'animal_registration', 'daily_feeding', 'trough_reading'];

describe('recentActivityTypeOptions', () => {
  it('enum tem exatamente 19 tipos ativos, sem os excluídos', () => {
    const values = Object.values(recentActivityType);
    expect(values).toHaveLength(19);
    EXCLUIDOS.forEach((x) => expect(values).not.toContain(x));
  });

  it.each(idiomas)('%s: 19 opções com label não vazio e valores únicos', (_nome, lang) => {
    const options = recentActivityTypeOptions.options(lang);
    expect(options).toHaveLength(19);
    options.forEach((o) => expect(o.label.trim()).not.toBe(''));
    expect(new Set(options.map((o) => o.value)).size).toBe(19);
    expect(options.map((o) => o.value).sort()).toEqual(Object.values(recentActivityType).sort());
  });

  it('getLabel de valor desconhecido devolve undefined (a tela aplica o fallback)', () => {
    expect(recentActivityTypeOptions.getLabel('tipo_futuro', idiomas[0][1])).toBeUndefined();
    expect(recentActivityTypeOptions.getLabel('death_animal', idiomas[0][1])).toBe('Mortes');
  });
});
