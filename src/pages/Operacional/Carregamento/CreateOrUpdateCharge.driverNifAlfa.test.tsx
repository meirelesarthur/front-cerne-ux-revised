// @vitest-environment jsdom
// UT-000776 / T-776-FE-08b — campo "CPF/CNPJ" (driver_nif) do Carregamento aceita CNPJ
// alfanumérico: a máscara MaskedInput kind="cpfCnpj" preserva letras (sem apagá-las).
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import CreateOrUpdateCharge from './CreateOrUpdateCharge';

vi.mock('@/hooks/useLanguage', async () => {
  const { languages: langs } = await import('@/constants/languages');
  return { useLanguage: () => ({ languageGB: langs.BR }) };
});
vi.mock('@/hooks/usePermissions', () => ({ usePermissions: () => ({ can: () => true }) }));
vi.mock('@/hooks/useRequest', () => ({
  useRequest: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }),
}));
// Mocks parciais: mantém os demais exports reais (ex.: `getCharge` usado por useChargeForm)
// e só zera as chamadas de rede usadas pela tela no fluxo de digitação.
vi.mock('@/services/v2/CadastrosBase/Client/client-service', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  listClients: vi.fn(async () => ({ data: [], meta: {} })),
}));
vi.mock('@/services/v2/CadastrosBase/Provider/provider-service', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  listProviderOptions: vi.fn(async () => []),
}));
vi.mock('@/services/v2/Carregamentos/charge-service', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  createCharge: vi.fn(),
  updateCharge: vi.fn(),
  getCharge: vi.fn(async () => null),
}));
vi.mock('@/services/v2/Products/product-service', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  getProduct: vi.fn(),
}));
vi.mock('@/services/v2/States/state-service', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  listStateOptions: vi.fn(async () => ({ data: [], meta: {} })),
}));
vi.mock('./ChargeItemsTab', () => ({ ChargeItemsTab: () => null }));
vi.mock('./ChargeExpensesTab', () => ({ ChargeExpensesTab: () => null }));

afterEach(() => cleanup());

function renderScreen() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <ChakraProvider value={system}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/operacional/carregamentos/create']}>
          <Routes>
            <Route path="/operacional/carregamentos/create" element={<CreateOrUpdateCharge />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </ChakraProvider>
  );
}

describe('CreateOrUpdateCharge — driver_nif com CNPJ alfanumérico (UT-000776)', () => {
  it('mantém as letras do CNPJ alfanumérico ao digitar (não apaga letras)', async () => {
    const { container } = renderScreen();
    const input = container.querySelector<HTMLInputElement>('input[name="driver_nif"]');
    expect(input).not.toBeNull();

    fireEvent.change(input!, { target: { value: '12ABC34501DE35' } });

    await waitFor(() => {
      expect(input!.value).toBe('12.ABC.345/01DE-35');
    });
  });

  it('aplica máscara de CPF para documento numérico de 11 dígitos', async () => {
    const { container } = renderScreen();
    const input = container.querySelector<HTMLInputElement>('input[name="driver_nif"]');

    fireEvent.change(input!, { target: { value: '52998224725' } });

    await waitFor(() => {
      expect(input!.value).toBe('529.982.247-25');
    });
  });
});
