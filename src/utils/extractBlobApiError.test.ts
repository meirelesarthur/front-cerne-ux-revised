import { describe, expect, it } from 'vitest';

import { extractBlobApiError } from './extractBlobApiError';

function blobError(body: string) {
  return { response: { data: new Blob([body], { type: 'application/json' }) } };
}

describe('extractBlobApiError', () => {
  it('extrai a message do envelope', async () => {
    const error = blobError(
      JSON.stringify({ success: false, message: 'Arquivo de log não encontrado.' })
    );
    expect(await extractBlobApiError(error)).toBe('Arquivo de log não encontrado.');
  });

  it('prefere o primeiro erro de campo (422)', async () => {
    const error = blobError(
      JSON.stringify({
        message: 'Dados inválidos',
        errors: { path: ['O caminho informado é inválido.'] },
      })
    );
    expect(await extractBlobApiError(error)).toBe('O caminho informado é inválido.');
  });

  it('devolve undefined para corpo que não é JSON', async () => {
    expect(await extractBlobApiError(blobError('<html>500</html>'))).toBeUndefined();
  });

  it('devolve undefined quando o corpo não é Blob', async () => {
    expect(await extractBlobApiError({ response: { data: { message: 'x' } } })).toBeUndefined();
    expect(await extractBlobApiError(new Error('rede'))).toBeUndefined();
  });
});
