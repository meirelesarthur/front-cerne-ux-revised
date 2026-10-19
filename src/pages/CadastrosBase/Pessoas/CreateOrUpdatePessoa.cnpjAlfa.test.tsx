// @vitest-environment jsdom
// T-776-FE-08a — CNPJ alfanumérico no cadastro de Pessoas. Cobre os helpers que
// alimentam o payload (`normalizeDocument`), a validação do NIF, a exibição
// formatada na lista e o `getClientByNif` (letras no path).
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { normalizeDocument } from '@/utils/masks/document';

import { docTypeOfNif, isValidNif, maskNif } from './nif';

const get = vi.fn();
vi.mock('@/services/api', () => ({ default: { V2: { get: (...a: unknown[]) => get(...a) } } }));

const ALFA = '12ABC34501DE35';

describe('Pessoas - CNPJ alfanumérico', () => {
  beforeEach(() => get.mockReset());

  it('payload: normalizeDocument mantém as letras em caixa alta (sem máscara)', () => {
    expect(normalizeDocument('12.abc.345/01de-35')).toBe(ALFA);
  });

  it('valida o NIF alfanumérico (DV) e classifica como CNPJ', () => {
    expect(docTypeOfNif(ALFA)).toBe('cnpj');
    expect(isValidNif('12.ABC.345/01DE-35')).toBe(true);
    expect(isValidNif('12.ABC.345/01DE-36')).toBe(false);
  });

  it('lista exibe o CNPJ alfanumérico formatado', () => {
    expect(maskNif(ALFA)).toBe('12.ABC.345/01DE-35');
  });

  it('getClientByNif envia o NIF alfanumérico normalizado no path', async () => {
    get.mockResolvedValue({ data: { data: null } });
    const { getClientByNif } = await import('@/services/v2/CadastrosBase/Client/client-service');
    await getClientByNif('12.abc.345/01de-35');
    expect(get).toHaveBeenCalledWith(`/clients/by-nif/${ALFA}`);
  });
});
