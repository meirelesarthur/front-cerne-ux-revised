// D-101-16 — tipo de frete obrigatório (mirror legado: select sem opção vazia, padrão 0).
import { describe, expect, it } from 'vitest';

import { getLanguageRouter } from '@/utils/get-language-route';

import { languageContextTypes } from '@/constants/languages';

import { nfeSchema } from './nfe-schema';

const lang = getLanguageRouter(languageContextTypes.BR);
const messages = lang.nfes.nfe.form.validation;
const schema = nfeSchema(lang);

async function errorOf(value: unknown) {
  try {
    await schema.validateAt('shipping_type', { shipping_type: value });
    return null;
  } catch (error) {
    return (error as { message: string }).message;
  }
}

describe('nfeSchema — shipping_type obrigatório', () => {
  it('0 (por conta do emitente) é válido', async () => {
    expect(await errorOf(0)).toBeNull();
  });

  it('valor existente (ex.: 9) é mantido/válido', async () => {
    expect(await errorOf(9)).toBeNull();
  });

  it('null/vazio/ausente → erro no campo', async () => {
    expect(await errorOf(null)).toBe(messages.shippingTypeRequired);
    expect(await errorOf('')).toBe(messages.shippingTypeRequired);
    expect(await errorOf(undefined)).toBe(messages.shippingTypeRequired);
  });
});
