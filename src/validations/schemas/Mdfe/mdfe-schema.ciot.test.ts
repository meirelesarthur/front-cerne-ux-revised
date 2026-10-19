// UT-000776 / T-776-FE-03 — `ciots` do schema de MDF-e espelha `MdfeRequest`/`MdfeCiotRule`:
// obrigatório só com `tp_emit` 1 ou 3 (tp_transp fora da regra); código = 12 dígitos.
import { describe, expect, it } from 'vitest';

import { getLanguageRouter } from '@/utils/get-language-route';

import { languageContextTypes } from '@/constants/languages';

import { mdfeRequiresCiot, mdfeSchema } from './mdfe-schema';

const lang = getLanguageRouter(languageContextTypes.BR);
const schema = mdfeSchema(lang);

const ciotOk = { codigo: '123456789012', cpf_cnpj: '12345678901' };

async function ciotErrors(values: Record<string, unknown>): Promise<string[]> {
  try {
    await schema.validateAt('ciots', values, { abortEarly: false });
    return [];
  } catch (error) {
    return (error as { errors: string[] }).errors;
  }
}

describe('mdfe-schema ciots', () => {
  it('tp_emit=1 sem CIOT → erro', async () => {
    expect(
      await ciotErrors({ tp_emit: { value: 1 }, tp_transp: { value: 1 }, ciots: [] })
    ).toContain(lang.mdfes.mdfe.ciot.requiredForTpEmit);
  });

  it('tp_emit=3 sem CIOT → erro', async () => {
    expect((await ciotErrors({ tp_emit: { value: 3 }, ciots: [] })).length).toBeGreaterThan(0);
  });

  it('tp_emit=2 + tp_transp=1 sem CIOT → válido (tp_transp fora da regra)', async () => {
    expect(await ciotErrors({ tp_emit: { value: 2 }, tp_transp: { value: 1 }, ciots: [] })).toEqual(
      []
    );
  });

  it('tp_emit=2 com CIOT → válido', async () => {
    expect(await ciotErrors({ tp_emit: { value: 2 }, ciots: [ciotOk] })).toEqual([]);
  });

  it('tp_emit=1 com CIOT de 12 dígitos → válido', async () => {
    expect(await ciotErrors({ tp_emit: { value: 1 }, ciots: [ciotOk] })).toEqual([]);
  });

  it('código com 11 dígitos → erro; 12 → OK; letras → erro', async () => {
    const bad = await ciotErrors({
      tp_emit: { value: 2 },
      ciots: [{ ...ciotOk, codigo: '12345678901' }],
    });
    expect(bad).toContain(lang.mdfes.mdfe.ciot.codeLengthError);
    expect(
      await ciotErrors({ tp_emit: { value: 2 }, ciots: [{ ...ciotOk, codigo: '12345678901A' }] })
    ).toContain(lang.mdfes.mdfe.ciot.codeLengthError);
  });

  it('mdfeRequiresCiot aceita Option, número e string', () => {
    expect(mdfeRequiresCiot({ value: '3' })).toBe(true);
    expect(mdfeRequiresCiot(1)).toBe(true);
    expect(mdfeRequiresCiot(2)).toBe(false);
    expect(mdfeRequiresCiot(null)).toBe(false);
  });
});
