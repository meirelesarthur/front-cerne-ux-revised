import { describe, expect, it } from 'vitest';

import { languageEnUs } from '@/constants/languages/languageEnUs';
import { languagePtBr } from '@/constants/languages/languagePtBr';

import fieldValidationSchema from '@/validations/field-validation-schema';

const pt = languagePtBr.BR;
const en = languageEnUs.US;

const VALID_CPF = '529.982.247-25';
const INVALID_CPF = '529.982.247-24';
const VALID_CNPJ = '11.222.333/0001-81';
const INVALID_CNPJ = '11.222.333/0001-80';

async function errorOf(schema: { validate: (v: unknown) => Promise<unknown> }, value: unknown) {
  try {
    await schema.validate(value);
    return null;
  } catch (error) {
    return (error as Error).message;
  }
}

describe('TASK-072-FE-02 — fieldValidationSchema.cpfCnpj()', () => {
  it('CPF pontuado válido passa', async () => {
    expect(await errorOf(fieldValidationSchema(pt).cpfCnpj(), VALID_CPF)).toBeNull();
  });

  it('CPF só dígitos válido passa', async () => {
    expect(await errorOf(fieldValidationSchema(pt).cpfCnpj(), '52998224725')).toBeNull();
  });

  it('CPF com DV errado falha com invalidDocument.cpf', async () => {
    expect(await errorOf(fieldValidationSchema(pt).cpfCnpj(), INVALID_CPF)).toBe(
      pt.defaltStrings.validations.invalidDocument.cpf
    );
  });

  it('CNPJ pontuado válido passa', async () => {
    expect(await errorOf(fieldValidationSchema(pt).cpfCnpj(), VALID_CNPJ)).toBeNull();
  });

  it('CNPJ com DV errado falha com invalidDocument.cnpj', async () => {
    expect(await errorOf(fieldValidationSchema(pt).cpfCnpj(), INVALID_CNPJ)).toBe(
      pt.defaltStrings.validations.invalidDocument.cnpj
    );
  });

  it('vazio falha com requiredField (sem erro duplicado de DV)', async () => {
    expect(await errorOf(fieldValidationSchema(pt).cpfCnpj(), '')).toBe(
      pt.defaltStrings.validations.requiredField
    );
  });

  it('troca de locale muda a mensagem (en-US)', async () => {
    const message = await errorOf(fieldValidationSchema(en).cpfCnpj(), INVALID_CPF);
    expect(message).toBe(en.defaltStrings.validations.invalidDocument.cpf);
    expect(message).not.toBe(pt.defaltStrings.validations.invalidDocument.cpf);
  });
});
