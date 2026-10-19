import { describe, expect, it } from 'vitest';

import { languageEnUs } from '@/constants/languages/languageEnUs';
import { languageEsEs } from '@/constants/languages/languageEsEs';
import { languagePtBr } from '@/constants/languages/languagePtBr';

import { clientSchema } from './client-schema';

const pt = languagePtBr.BR;
const v = pt.clients.client.form.validation;

async function ieError(value: string | undefined) {
  try {
    await clientSchema(pt).validateAt('state_registrations[0].value', {
      state_registrations: [{ value }],
    });
    return null;
  } catch (e) {
    return (e as Error).message;
  }
}

describe('D5 — clientSchema inscrição estadual', () => {
  it('mensagem pt-BR canônica', () => {
    expect(v.stateRegistrationInvalid).toBe(
      'Inscrição estadual inválida: informe de 2 a 14 dígitos ou ISENTO.'
    );
  });

  it('mensagem existe nos 3 idiomas', () => {
    expect(languageEnUs.US.clients.client.form.validation.stateRegistrationInvalid).toBeTruthy();
    expect(languageEsEs.ES.clients.client.form.validation.stateRegistrationInvalid).toBeTruthy();
  });

  it('29 dígitos falha', async () => {
    expect(await ieError('1'.repeat(29))).toBe(v.stateRegistrationInvalid);
  });

  it('15 dígitos e 1 dígito falham', async () => {
    expect(await ieError('1'.repeat(15))).toBe(v.stateRegistrationInvalid);
    expect(await ieError('1')).toBe(v.stateRegistrationInvalid);
  });

  it('texto não numérico falha', async () => {
    expect(await ieError('ABC123')).toBe(v.stateRegistrationInvalid);
  });

  it('ISENTO em qualquer caixa passa', async () => {
    expect(await ieError('ISENTO')).toBeNull();
    expect(await ieError('isento')).toBeNull();
    expect(await ieError(' Isento ')).toBeNull();
  });

  it('com máscara (123.456.789) passa; 2 e 14 dígitos passam', async () => {
    expect(await ieError('123.456.789')).toBeNull();
    expect(await ieError('12')).toBeNull();
    expect(await ieError('1'.repeat(14))).toBeNull();
  });

  it('vazio segue a regra atual (opcional)', async () => {
    expect(await ieError('')).toBeNull();
    expect(await ieError(undefined)).toBeNull();
  });
});
