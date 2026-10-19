import { describe, expect, it } from 'vitest';

import { languageEnUs } from '@/constants/languages/languageEnUs';
import { languagePtBr } from '@/constants/languages/languagePtBr';

import { tenantSchema } from '@/validations/schemas/BaseRegistrations/tenant-schema';

import type { LanguageDate } from '@/@types/language';

const pt = languagePtBr.BR;
const en = languageEnUs.US;

const BRAZIL = { label: 'Brasil', value: 'uuid-br', codigo: 1058 };
const PARAGUAY = { label: 'Paraguai', value: 'uuid-py', codigo: 5860 };

async function errorAt(
  languageGB: LanguageDate,
  isEditing: boolean,
  path: string,
  values: Record<string, unknown>
) {
  try {
    await tenantSchema(languageGB, { isEditing }).validateAt(path, values);
    return null;
  } catch (error) {
    return (error as Error).message;
  }
}

describe('TASK-072-FE-02 — tenantSchema (DV, CEP, limites)', () => {
  describe('nif', () => {
    it('create: CPF pontuado válido passa', async () => {
      expect(
        await errorAt(pt, false, 'nif', { nif: '529.982.247-25', country: BRAZIL })
      ).toBeNull();
    });

    it('create: CPF com DV errado falha com invalidDocument.cpf', async () => {
      expect(await errorAt(pt, false, 'nif', { nif: '529.982.247-24', country: BRAZIL })).toBe(
        pt.defaltStrings.validations.invalidDocument.cpf
      );
    });

    it('create: CNPJ pontuado válido passa e inválido falha com invalidDocument.cnpj', async () => {
      expect(
        await errorAt(pt, false, 'nif', { nif: '11.222.333/0001-81', country: BRAZIL })
      ).toBeNull();
      expect(await errorAt(pt, false, 'nif', { nif: '11.222.333/0001-80', country: BRAZIL })).toBe(
        pt.defaltStrings.validations.invalidDocument.cnpj
      );
    });

    it('edit: NIF sem DV válido passa (readonly, G-FE-1)', async () => {
      expect(await errorAt(pt, true, 'nif', { nif: '12345678900' })).toBeNull();
    });

    it('edit: NIF vazio continua obrigatório', async () => {
      expect(await errorAt(pt, true, 'nif', { nif: '' })).toBe(
        pt.defaltStrings.validations.requiredField
      );
    });
  });

  describe('zip_code', () => {
    it('12345-678 passa', async () => {
      expect(
        await errorAt(pt, false, 'zip_code', { zip_code: '12345-678', country: BRAZIL })
      ).toBeNull();
    });

    it('1234-567 falha com invalidValue', async () => {
      expect(await errorAt(pt, false, 'zip_code', { zip_code: '1234-567', country: BRAZIL })).toBe(
        pt.defaltStrings.validations.invalidValue
      );
    });

    it('acima de 9 caracteres falha com zipCodeMaxLength (qualquer país)', async () => {
      expect(
        await errorAt(pt, true, 'zip_code', { zip_code: '1234567890', country: PARAGUAY })
      ).toBe(pt.baseRegistrations.tenant.form.validation.zipCodeMaxLength);
    });

    it('vazio passa (opcional)', async () => {
      expect(await errorAt(pt, false, 'zip_code', { zip_code: '' })).toBeNull();
      expect(await errorAt(pt, false, 'zip_code', { zip_code: null })).toBeNull();
    });
  });

  describe('limites I11', () => {
    it('cellphone com 16 caracteres falha', async () => {
      expect(await errorAt(pt, false, 'cellphone', { cellphone: '1'.repeat(16) })).toBe(
        pt.baseRegistrations.tenant.form.validation.cellphoneMaxLength
      );
    });

    it('cellphone com 15 caracteres passa', async () => {
      expect(await errorAt(pt, false, 'cellphone', { cellphone: '1'.repeat(15) })).toBeNull();
    });

    it('contact_phone com 16 caracteres falha', async () => {
      expect(await errorAt(pt, false, 'contact_phone', { contact_phone: '1'.repeat(16) })).toBe(
        pt.baseRegistrations.tenant.form.validation.contactPhoneMaxLength
      );
    });

    it('email inválido falha', async () => {
      expect(await errorAt(pt, false, 'email', { email: 'nao-e-email' })).toBe(
        pt.defaltStrings.validations.emailInvalid
      );
    });

    it('email acima de 89 caracteres falha', async () => {
      const email = `${'a'.repeat(85)}@x.com`;
      expect(await errorAt(pt, false, 'email', { email })).toBe(
        pt.baseRegistrations.tenant.form.validation.emailMaxLength
      );
    });
  });

  describe('edit de contratante estrangeiro (G-FE-1) — save não trava', () => {
    it('NIF sem DV brasileiro passa; vazio segue obrigatório', async () => {
      expect(await errorAt(pt, true, 'nif', { nif: '80012345-6', country: PARAGUAY })).toBeNull();
      expect(await errorAt(pt, true, 'nif', { nif: '', country: PARAGUAY })).toBe(
        pt.defaltStrings.validations.requiredField
      );
    });

    it('CEP livre (fora de 00000-000) até 9 caracteres passa', async () => {
      expect(
        await errorAt(pt, true, 'zip_code', { zip_code: '1209', country: PARAGUAY })
      ).toBeNull();
      expect(
        await errorAt(pt, true, 'zip_code', { zip_code: 'AB-123456', country: PARAGUAY })
      ).toBeNull();
    });

    it('schema completo não acusa erro em nif/zip_code do estrangeiro', async () => {
      const result = await tenantSchema(pt, { isEditing: true })
        .validate({ nif: '80012345-6', zip_code: '1209', country: PARAGUAY }, { abortEarly: false })
        .catch((error: { inner: { path: string }[] }) => error.inner.map((e) => e.path));
      const failedPaths = Array.isArray(result) ? result : [];
      expect(failedPaths).not.toContain('nif');
      expect(failedPaths).not.toContain('zip_code');
    });
  });

  it('troca de locale muda a mensagem (en-US)', async () => {
    const message = await errorAt(en, false, 'nif', { nif: '529.982.247-24', country: BRAZIL });
    expect(message).toBe(en.defaltStrings.validations.invalidDocument.cpf);
    expect(message).not.toBe(pt.defaltStrings.validations.invalidDocument.cpf);
  });
});
