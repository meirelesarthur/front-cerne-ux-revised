// Execução 081, T-081-FE-06 — schema do envio da Ciência: justificativa de no máximo
// 400 (T-081-API-01), obrigatória fora do status 3; autorizador obrigatório no status 3.
import { describe, expect, it } from 'vitest';

import { languagePtBr } from '@/constants/languages/languagePtBr';

import { requestAuthorizationAcknowledgeSchema } from './request-authorization-acknowledge-schema';

function schema() {
  return requestAuthorizationAcknowledgeSchema(languagePtBr.BR);
}

describe('requestAuthorizationAcknowledgeSchema', () => {
  it('aceita justificativa de 400 caracteres e recusa 401', async () => {
    const base = { status: 2 };
    await expect(schema().validate({ ...base, justify: 'a'.repeat(400) })).resolves.toBeTruthy();
    await expect(schema().validate({ ...base, justify: 'a'.repeat(401) })).rejects.toThrow(/400/);
  });

  it('justificativa é obrigatória fora do status 3', async () => {
    await expect(schema().validate({ status: 4, justify: '' })).rejects.toBeTruthy();
    await expect(schema().validate({ status: 2 })).rejects.toBeTruthy();
  });

  it('status 3: autorizador obrigatório, justificativa opcional', async () => {
    await expect(schema().validate({ status: 3, justify: '' })).rejects.toBeTruthy();
    await expect(
      schema().validate({ status: 3, authorizer_uuid: 'uuid-1', justify: '' })
    ).resolves.toBeTruthy();
  });
});
