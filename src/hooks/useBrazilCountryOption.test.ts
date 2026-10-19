// @vitest-environment jsdom
// TASK-072-FE-03 — resolução do Brasil por `codigo` (API-D1 mockada: o filtro
// `?codigo=` é contrato da TASK-072-API-03, ainda não implementado no back).
import { createElement } from 'react';
import type { ReactNode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { CountryOptionItem } from '@/@types/v2/Countries';

const listCountryOptionsMock = vi.fn();

vi.mock('@/services/v2/Countries/country-service', () => ({
  listCountryOptions: (params: unknown) => listCountryOptionsMock(params),
}));

const { pickBrazilCountryOption, useBrazilCountryOption } =
  await import('@/hooks/useBrazilCountryOption');

const ARGENTINA: CountryOptionItem = {
  uuid: 'uuid-ar',
  nome: 'Argentina',
  codigo: 639,
} as CountryOptionItem;
const BRASIL: CountryOptionItem = {
  uuid: 'uuid-br',
  nome: 'Brasil',
  codigo: 1058,
} as CountryOptionItem;
const PARAGUAI: CountryOptionItem = {
  uuid: 'uuid-py',
  nome: 'Paraguai',
  codigo: 5860,
} as CountryOptionItem;

function envelope(items: CountryOptionItem[]) {
  return {
    success: true,
    message: '',
    data: {
      items,
      pagination: {
        total: items.length,
        count: items.length,
        per_page: 15,
        current_page: 1,
        total_pages: 1,
      },
    },
  };
}

function renderUseBrazil() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
  return renderHook(() => useBrazilCountryOption(), { wrapper });
}

describe('TASK-072-FE-03 — useBrazilCountryOption', () => {
  beforeEach(() => {
    listCountryOptionsMock.mockReset();
  });

  it('pickBrazilCountryOption escolhe o item com codigo 1058 entre vários', () => {
    expect(pickBrazilCountryOption([ARGENTINA, BRASIL, PARAGUAI])).toEqual({
      label: 'Brasil',
      value: 'uuid-br',
      codigo: 1058,
    });
  });

  it('pickBrazilCountryOption aceita codigo textual e devolve null se ausente', () => {
    expect(
      pickBrazilCountryOption([{ ...BRASIL, codigo: '1058' as unknown as number }])?.value
    ).toBe('uuid-br');
    expect(pickBrazilCountryOption([ARGENTINA, PARAGUAI])).toBeNull();
    expect(pickBrazilCountryOption([])).toBeNull();
  });

  it('consulta GET /countries/options com codigo=1058 e devolve a Option do Brasil', async () => {
    listCountryOptionsMock.mockResolvedValue(envelope([ARGENTINA, BRASIL]));
    const { result } = renderUseBrazil();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(listCountryOptionsMock).toHaveBeenCalledWith({ codigo: 1058 });
    expect(result.current.data).toEqual({ label: 'Brasil', value: 'uuid-br', codigo: 1058 });
  });

  it('devolve null quando a API não retorna o Brasil (sem inventar país)', async () => {
    listCountryOptionsMock.mockResolvedValue(envelope([ARGENTINA]));
    const { result } = renderUseBrazil();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it('expõe erro (sem mascarar) quando a consulta falha', async () => {
    listCountryOptionsMock.mockRejectedValue(new Error('network'));
    const { result } = renderUseBrazil();

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });
});
