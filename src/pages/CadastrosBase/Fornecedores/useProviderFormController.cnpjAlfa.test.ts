// @vitest-environment jsdom
import { createElement, type ReactNode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useProviderFormController } from './useProviderFormController';

const createProvider = vi.fn();

vi.mock('@/hooks/useRequest', () => ({
  useRequest: ({ asyncFunction }: { asyncFunction: (d: unknown) => Promise<unknown> }) => ({
    mutateAsync: (d: unknown) => asyncFunction(d),
    isPending: false,
  }),
}));
vi.mock('@/services/v2/CadastrosBase/Provider/provider-service', () => ({
  createProvider: (p: unknown) => createProvider(p),
  updateProvider: vi.fn(),
}));
vi.mock('@/services/v2/CadastrosBase/Provider/receitaws-service', () => ({
  fetchCnpjDataFromReceitaWs: vi.fn(),
}));
vi.mock('@/services/v2/Cities/city-service', () => ({
  getCityByIso: vi.fn(),
  listCityOptions: vi.fn(() => Promise.resolve([])),
}));
vi.mock('@/services/v2/People/person-service', () => ({ getPersonByNif: vi.fn() }));
vi.mock('@/services/viacep', () => ({ getAddressByCep: vi.fn() }));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return createElement(
    QueryClientProvider,
    { client },
    createElement(MemoryRouter, null, children)
  );
}

describe('useProviderFormController - CNPJ alfanumérico', () => {
  beforeEach(() => createProvider.mockReset().mockResolvedValue({ data: {} }));

  it('mantém as letras do CNPJ no payload (maiúsculas, sem máscara)', async () => {
    const { result } = renderHook(
      () => useProviderFormController({ isEditing: false, providerUuid: undefined, canSave: true }),
      { wrapper }
    );

    await act(async () => {
      await result.current.onSubmit({
        nif: '12.abc.345/01de-35',
        nickname: 'n',
        name: 'Fornecedor',
        email: null,
        phone: null,
        zip_code: null,
        address: 'a',
        number: '1',
        district: 'd',
        city: null,
        type: { label: 'x', value: 1 },
        commission: null,
        hour_value: null,
        state_registration: null,
        city_registration: null,
        contact: null,
        contact_phone: null,
        cellphone: null,
        default_cost_center: null,
        is_enabled: { label: 'Sim', value: true },
        bank: null,
        account_type: null,
        agency: null,
        account: null,
        pix_type: null,
        pix: null,
        branches: [
          {
            nif: 'ab.cde.fgh/0001-10',
            name: 'Filial',
            address: 'rua',
            state_registration: null,
            zip_code: null,
            city: null,
          },
        ],
        sellers: [],
      } as never);
    });

    expect(createProvider).toHaveBeenCalledTimes(1);
    expect(createProvider.mock.calls[0][0].nif).toBe('12ABC34501DE35');
    expect(createProvider.mock.calls[0][0].provider.branches[0].nif).toBe('ABCDEFGH000110');
  });
});
