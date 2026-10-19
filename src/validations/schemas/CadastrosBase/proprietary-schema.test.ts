import { describe, expect, it } from 'vitest';

import { languagePtBr } from '@/constants/languages/languagePtBr';

import { proprietarySchema } from './proprietary-schema';

const pt = languagePtBr.BR;
const v = pt.proprietaries.proprietary.form.validation;

const base = {
  nif: '529.982.247-25',
  name: 'Fulano',
  nickname: 'Fulano',
  address: 'Rua A',
  number: '10',
  district: 'Centro',
  city: { value: 1, label: 'Cidade' },
  farms: [{ farm: { value: 'x', label: 'Fazenda' }, percentage: 50 }],
};

async function emailError(email: unknown) {
  try {
    await proprietarySchema(pt).validateAt('email', { ...base, email });
    return null;
  } catch (e) {
    return (e as Error).message;
  }
}

describe('UT-000683 FE-1 — proprietarySchema e-mail obrigatório', () => {
  it('e-mail ausente/nulo/vazio falha com emailRequired', async () => {
    expect(await emailError(undefined)).toBe(v.emailRequired);
    expect(await emailError('')).toBe(v.emailRequired);
    expect(await emailError('   ')).toBe(v.emailRequired);
  });

  it('e-mail inválido falha com emailInvalid', async () => {
    expect(await emailError('abc')).toBe(v.emailInvalid);
  });

  it('e-mail válido passa', async () => {
    expect(await emailError('a@b.com')).toBeNull();
  });
});
