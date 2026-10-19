// UT-000776 / T-776-FE-08b — schema do Rastreio aceita CNPJ alfanumérico válido (checksum
// NT Conjunta 2025.001), recusa DV inválido e repetição de caractere, e preserva CPF.
import { describe, expect, it } from 'vitest';

import { languages } from '@/constants/languages';

import { traceabilityConfigSchema } from './traceability-config-schema';

const schema = traceabilityConfigSchema(languages.BR);

async function validateDocument(value: string): Promise<boolean> {
  try {
    await schema.validateAt('cpf_cnpj', { cpf_cnpj: value });
    return true;
  } catch {
    return false;
  }
}

describe('traceabilityConfigSchema — cpf_cnpj alfanumérico (UT-000776)', () => {
  it('aceita CNPJ alfanumérico válido (mascarado)', async () => {
    expect(await validateDocument('12.ABC.345/01DE-35')).toBe(true);
  });

  it('aceita CNPJ alfanumérico válido (cru)', async () => {
    expect(await validateDocument('12ABC34501DE35')).toBe(true);
  });

  it('recusa CNPJ alfanumérico com dígito verificador inválido', async () => {
    expect(await validateDocument('12.ABC.345/01DE-34')).toBe(false);
  });

  it('recusa CNPJ com todos os caracteres iguais', async () => {
    expect(await validateDocument('AAAAAAAAAAAAAA')).toBe(false);
  });

  it('mantém validação de CPF numérico válido', async () => {
    expect(await validateDocument('529.982.247-25')).toBe(true);
  });
});
