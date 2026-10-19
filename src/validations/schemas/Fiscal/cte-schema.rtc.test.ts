// T-776-FE-02 — campos IBS/CBS do CT-e: todos opcionais; percentuais 0..100;
// cClassTrib com 6 dígitos quando informado.
import { describe, expect, it } from 'vitest';

import { languages } from '@/constants/languages';

import { cteSchema } from './cte-schema';

const languageGB = languages.BR;
const schema = cteSchema(languageGB);
const messages = languageGB.ctes.cte.validation;

describe('cteSchema.rtc', () => {
  it.each([
    'percIbsUf',
    'percIbsMun',
    'percCbs',
    'percReducaoAliqIbsUf',
    'percReducaoAliqIbsMun',
    'percReducaoAliqCbs',
    'percDifIbsUf',
    'percDifIbsMun',
    'percDifCbs',
  ])('%s: vazio é válido, 100 é válido, >100 e <0 são erro', async (field) => {
    await expect(schema.validateAt(field, { [field]: null })).resolves.toBeUndefined();
    await expect(schema.validateAt(field, { [field]: 100 })).resolves.toBe(100);
    await expect(schema.validateAt(field, { [field]: 100.0001 })).rejects.toThrow(
      messages.percentRange
    );
    await expect(schema.validateAt(field, { [field]: -1 })).rejects.toThrow(messages.percentRange);
  });

  it('cClassTrib: vazio e 6 dígitos válidos; 5 dígitos e letras são erro', async () => {
    await expect(schema.validateAt('cClassTrib', { cClassTrib: '' })).resolves.toBe('');
    await expect(schema.validateAt('cClassTrib', { cClassTrib: '000001' })).resolves.toBe('000001');
    await expect(schema.validateAt('cClassTrib', { cClassTrib: '00001' })).rejects.toThrow(
      messages.cClassTribInvalid
    );
    await expect(schema.validateAt('cClassTrib', { cClassTrib: '00000A' })).rejects.toThrow(
      messages.cClassTribInvalid
    );
  });

  it('cstIbsCbs é opcional', async () => {
    await expect(schema.validateAt('cstIbsCbs', { cstIbsCbs: null })).resolves.toBeNull();
  });
});
