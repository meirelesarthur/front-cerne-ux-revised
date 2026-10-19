// UT-000795 — Select "Tipo": sem sufixo "indisponível", opções por API e fallback.
import { describe, expect, it } from 'vitest';

import { languageEnUs } from '@/constants/languages/languageEnUs';
import { languagePtBr } from '@/constants/languages/languagePtBr';

import {
  buildExpenseAppropriationTypeOptions,
  expenseAppropriationTypeOptions,
} from './appropriation-options';

describe('rótulos dos tipos de apropriação', () => {
  it('Pecuária e Manutenção sem o sufixo "(indisponível"', () => {
    const labels = expenseAppropriationTypeOptions
      .options(languagePtBr.BR as any)
      .map((o) => o.label);
    expect(labels).toEqual(['Agricultura', 'Pecuária', 'Área', 'Manutenção']);
    labels.forEach((l) => expect(l.toLowerCase()).not.toContain('indispon'));
  });

  it('en-US também sem sufixo', () => {
    expenseAppropriationTypeOptions
      .options(languageEnUs.US as any)
      .forEach((o) => expect(o.label.toLowerCase()).not.toContain('unavailable'));
  });
});

describe('buildExpenseAppropriationTypeOptions', () => {
  const lang = languagePtBr.BR as any;

  it('com resposta da API [3,4] devolve só 2 opções, rótulo pela i18n do front', () => {
    const result = buildExpenseAppropriationTypeOptions(lang, [
      { value: 3, label: 'qualquer' },
      { value: 4, label: 'outro' },
    ]);
    expect(result).toEqual([
      { label: 'Área', value: 3 },
      { label: 'Manutenção', value: 4 },
    ]);
  });

  it('null, undefined e vazio caem nos 4 tipos (fallback seguro)', () => {
    [null, undefined, []].forEach((input) => {
      const result = buildExpenseAppropriationTypeOptions(lang, input);
      expect(result.map((o) => o.value)).toEqual([1, 2, 3, 4]);
    });
  });

  it('tipo gravado ausente da lista é injetado', () => {
    const result = buildExpenseAppropriationTypeOptions(lang, [{ value: 3, label: 'Área' }], 2);
    expect(result.map((o) => o.value)).toEqual([3, 2]);
    expect(result.find((o) => o.value === 2)?.label).toBe('Pecuária');
  });

  it('tipo gravado já presente não duplica', () => {
    const result = buildExpenseAppropriationTypeOptions(lang, [{ value: 3, label: 'Área' }], 3);
    expect(result).toHaveLength(1);
  });
});
