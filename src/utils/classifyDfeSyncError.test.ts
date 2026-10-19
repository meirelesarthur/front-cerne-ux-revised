// UT-000752 (T-752-FE-02) — classificação da falha de `POST /dfes/sync`.
import { AxiosError } from 'axios';
import { describe, expect, it } from 'vitest';

import { classifyDfeSyncError } from './classifyDfeSyncError';

function apiError(status: number, message: string): AxiosError {
  const error = new AxiosError('request failed');
  error.response = { status, data: { message }, statusText: '', headers: {}, config: {} as never };
  return error;
}

describe('classifyDfeSyncError', () => {
  it('409 → in-progress', () => {
    expect(
      classifyDfeSyncError(apiError(409, 'Sincronização deste emissor já em andamento.'))
    ).toBe('in-progress');
  });

  it('422 de ambiente ausente → environment', () => {
    expect(
      classifyDfeSyncError(
        apiError(422, 'Emissor sem ambiente SEFAZ configurado (produção/homologação).')
      )
    ).toBe('environment');
  });

  it('422 de certificado → certificate', () => {
    expect(
      classifyDfeSyncError(apiError(422, 'Emissor sem certificado digital configurado.'))
    ).toBe('certificate');
  });

  it('422 com xMotivo da SEFAZ, 5xx e erros sem resposta → other', () => {
    expect(classifyDfeSyncError(apiError(422, 'Rejeição 656: consumo indevido'))).toBe('other');
    expect(classifyDfeSyncError(apiError(500, 'Erro interno'))).toBe('other');
    expect(classifyDfeSyncError(new Error('network'))).toBe('other');
  });
});
