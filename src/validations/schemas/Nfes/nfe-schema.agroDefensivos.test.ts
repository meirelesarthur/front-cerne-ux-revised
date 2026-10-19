// UT-000776 / T-776-FE-05 — regras do grupo `agro_defensivos` no schema da NF-e:
// guia + defensivo → erro; > 20 → erro; CPF inválido → erro; linha válida passa.
import { describe, expect, it } from 'vitest';

import { getLanguageRouter } from '@/utils/get-language-route';

import { languageContextTypes } from '@/constants/languages';

import { nfeSchema } from './nfe-schema';

const lang = getLanguageRouter(languageContextTypes.BR);
const messages = lang.nfes.nfe.form.validation;
const schema = nfeSchema(lang);

const row = (n = 'REC-1', cpf = '52998224725') => ({ n_receituario: n, cpf_resp_tec: cpf });

async function errorOf(values: Record<string, unknown>, path = 'agro_defensivos') {
  try {
    await schema.validateAt(path, values);
    return null;
  } catch (error) {
    return (error as { message: string }).message;
  }
}

describe('nfeSchema — agro_defensivos', () => {
  it('lista vazia e linha válida passam', async () => {
    expect(await errorOf({ agro_defensivos: [] })).toBeNull();
    expect(await errorOf({ agro_defensivos: [row()] })).toBeNull();
  });

  it('guia + defensivo → erro de exclusão (qualquer campo da guia)', async () => {
    for (const guide of [
      { type_guide: '1' },
      { uf_guide: 'MT' },
      { number_guide: '123' },
      { serie_guide: '1' },
    ]) {
      expect(await errorOf({ ...guide, agro_defensivos: [row()] })).toBe(
        messages.agroDefensivosGuideExclusive
      );
    }
  });

  it('guia sem defensivo não gera erro de exclusão', async () => {
    expect(await errorOf({ type_guide: '1', agro_defensivos: [] })).toBeNull();
  });

  it('mais de 20 linhas → erro', async () => {
    const items = Array.from({ length: 21 }, (_, i) => row(`R${i}`));
    expect(await errorOf({ agro_defensivos: items })).toBe(messages.agroDefensivosMax);
    expect(await errorOf({ agro_defensivos: items.slice(0, 20) })).toBeNull();
  });

  it('CPF inválido, receituário vazio ou > 30 → erro por campo', async () => {
    expect(
      await errorOf(
        { agro_defensivos: [row('R', '11111111111')] },
        'agro_defensivos[0].cpf_resp_tec'
      )
    ).toBe(messages.agroDefensivosCpfInvalid);
    expect(
      await errorOf(
        { agro_defensivos: [row('', '52998224725')] },
        'agro_defensivos[0].n_receituario'
      )
    ).toBe(messages.agroDefensivosReceituarioRequired);
    expect(
      await errorOf({ agro_defensivos: [row('x'.repeat(31))] }, 'agro_defensivos[0].n_receituario')
    ).toBe(messages.agroDefensivosReceituarioMax);
  });
});
