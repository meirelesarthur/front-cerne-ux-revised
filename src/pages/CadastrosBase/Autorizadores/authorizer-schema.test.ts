import { describe, expect, it } from 'vitest';

import { languagePtBr } from '@/constants/languages/languagePtBr';

import { authorizerSchema } from './authorizer-schema';

const languageGB = languagePtBr.BR;
const schema = authorizerSchema(languageGB);
const messages = languageGB.requestAuthorizers.requestAuthorizer.form.validation;

const valid = {
  user_uuid: { label: 'Fulano', value: 'u-1' },
  max_value: 1000 as number | null | undefined | string,
  is_active: true,
  number_quotes: 1,
  expense_organizer: false,
  is_conditional: false,
  farms: [{ farm_uuid: 'f-1', level: 1 as number | null }],
  rules: [],
};

async function errorsOf(overrides: Record<string, unknown>) {
  try {
    await schema.validate({ ...valid, ...overrides }, { abortEarly: false });
    return [] as string[];
  } catch (error) {
    return (error as { errors: string[] }).errors;
  }
}

describe('authorizer-schema — "Até" obrigatório como no legado', () => {
  it('aceita valor preenchido', async () => {
    expect(await errorsOf({})).toEqual([]);
  });

  it('aceita zero ("0,00" grava 0.00 no legado)', async () => {
    expect(await errorsOf({ max_value: 0 })).toEqual([]);
  });

  it.each([null, undefined, ''])('recusa vazio (%p) com a mensagem do legado', async (value) => {
    const errors = await errorsOf({ max_value: value });
    expect(errors).toContain(messages.maxValueRequired);
    expect(messages.maxValueRequired).toBe('O campo Até é obrigatório.');
  });

  it('recusa valor negativo', async () => {
    expect(await errorsOf({ max_value: -1 })).toContain(messages.maxValueRange);
  });

  it('nível vazio na linha de fazenda é recusado', async () => {
    expect(await errorsOf({ farms: [{ farm_uuid: 'f-1', level: null }] })).toContain(
      messages.farmLevelRequired
    );
  });
});
