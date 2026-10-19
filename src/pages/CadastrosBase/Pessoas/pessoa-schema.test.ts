import { describe, expect, it } from 'vitest';

import { languagePtBr } from '@/constants/languages/languagePtBr';

import { personSchema } from './pessoa-schema';

const pt = languagePtBr.BR;
const msg = pt.people.person.form.validation.emailRequiredForAccess;

async function emailError(roles: Record<string, { enabled: boolean }>, email = '') {
  try {
    await personSchema(pt).validateAt('email', { email, ...roles });
    return null;
  } catch (e) {
    return (e as Error).message;
  }
}

describe('UT-000683 FE-2 — personSchema e-mail obrigatório por papel', () => {
  it('proprietário habilitado sem e-mail falha com emailRequiredForAccess', async () => {
    expect(await emailError({ proprietary: { enabled: true } })).toBe(msg);
  });

  it('proprietário habilitado com e-mail passa', async () => {
    expect(await emailError({ proprietary: { enabled: true } }, 'a@b.com')).toBeNull();
  });

  it('user/client habilitados continuam exigindo e-mail', async () => {
    expect(await emailError({ user: { enabled: true } })).toBe(msg);
    expect(await emailError({ client: { enabled: true } })).toBe(msg);
  });

  it('nenhum papel habilitado: e-mail opcional', async () => {
    expect(
      await emailError({
        user: { enabled: false },
        client: { enabled: false },
        proprietary: { enabled: false },
      })
    ).toBeNull();
  });
});
