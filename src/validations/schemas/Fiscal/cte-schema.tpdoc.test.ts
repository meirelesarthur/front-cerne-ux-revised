// T-776-FE-02 / T-776-API-04c — `tpDoc` obrigatório quando não há chave de NF-e
// (espelha `Rule::requiredIf(empty(chaves_nfe))` da API); com chave, é opcional.
import { describe, expect, it } from 'vitest';

import { cteFormDefaultValues } from '@/constants/Fiscal/cte/default-values';
import { languages } from '@/constants/languages';

import { cteSchema } from './cte-schema';

const languageGB = languages.BR;
const schema = cteSchema(languageGB);
const message = languageGB.ctes.cte.validation.tpDocRequired;

describe('cteSchema.tpDoc', () => {
  it('sem chave de NF-e e sem tpDoc -> erro', async () => {
    await expect(schema.validateAt('tpDoc', { chavesNfe: [], tpDoc: null })).rejects.toThrow(
      message
    );
  });

  it('sem chave de NF-e e com tpDoc -> válido', async () => {
    await expect(
      schema.validateAt('tpDoc', { chavesNfe: [], tpDoc: { value: '00', label: 'Declaração' } })
    ).resolves.toBeTruthy();
  });

  it('com chave de NF-e e sem tpDoc -> válido', async () => {
    await expect(
      schema.validateAt('tpDoc', { chavesNfe: [{ value: '1'.repeat(44) }], tpDoc: null })
    ).resolves.toBeNull();
  });

  it('default do formulário é 00 (Declaração), como o legado', () => {
    expect(cteFormDefaultValues.tpDoc?.value).toBe('00');
  });
});
