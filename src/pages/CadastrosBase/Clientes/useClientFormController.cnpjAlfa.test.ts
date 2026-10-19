// @vitest-environment jsdom
import { createElement, type ReactNode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useClientFormController } from './useClientFormController';

const createClient = vi.fn();

vi.mock('@/hooks/useRequest', () => ({
  useRequest: ({ asyncFunction }: { asyncFunction: (d: unknown) => Promise<unknown> }) => ({
    mutateAsync: (d: unknown) => asyncFunction(d),
    isPending: false,
  }),
}));
vi.mock('@/services/v2/CadastrosBase/Client/client-service', () => ({
  createClient: (p: unknown) => createClient(p),
  updateClient: vi.fn(),
  getClientByNif: vi.fn(() => Promise.resolve(null)),
}));
vi.mock('@/services/v2/Cities/city-service', () => ({ getCityByIso: vi.fn() }));
vi.mock('@/services/v2/Countries/country-service', () => ({
  listCountryOptions: vi.fn(() => Promise.resolve([])),
}));
vi.mock('@/services/viacep', () => ({ getAddressByCep: vi.fn() }));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return createElement(
    QueryClientProvider,
    { client },
    createElement(MemoryRouter, null, children)
  );
}

describe('useClientFormController - CNPJ alfanumérico', () => {
  beforeEach(() => createClient.mockReset().mockResolvedValue({ data: {} }));

  it('mantém as letras do CNPJ no payload (maiúsculas, sem máscara)', async () => {
    const { result } = renderHook(
      () => useClientFormController({ isEditing: false, clientUuid: undefined, canSave: true }),
      { wrapper }
    );

    await act(async () => {
      await result.current.onSubmit({
        nif: '12.abc.345/01de-35',
        nickname: 'n',
        name: 'Cliente',
        email: null,
        phone: null,
        zip_code: null,
        address: 'a',
        number: '1',
        district: 'd',
        city: null,
        cellphone: '',
        contact: '',
        contact_phone: '',
        city_registration: '',
        farm_name: '',
        is_enabled: true,
        final_costumer: false,
        taxpayer: true,
        code_country: null,
        id_abroad: '',
        state_registrations: [],
      } as never);
    });

    expect(createClient).toHaveBeenCalledTimes(1);
    expect(createClient.mock.calls[0][0].nif).toBe('12ABC34501DE35');
  });
});
