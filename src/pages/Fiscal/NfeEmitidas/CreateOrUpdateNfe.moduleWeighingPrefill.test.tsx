// @vitest-environment jsdom
// UT-000715 / T-FE-715-03 — consumidor do handoff "Emitir NFe" da Pesagem Rodoviária em
// `CreateOrUpdateNfe` (`location.state.moduleWeighingNfePrefill`): pesos (bruto REAL != líquido),
// item (produto com rótulo legível, quantidade = líquido, valor 0, armazém null), efeito one-shot,
// modo edição ignora o state, falha de produto -> toast, e campos NÃO pré-preenchidos (D-097-08).
//
// A aba "Itens" (`NfeItemsTab`) e a aba Financeiro são substituídas por stubs que só expõem o
// estado do form raiz (`useWatch`) e o flag `cascadeOnMount`; a cascata fiscal em si é provada em
// `NfeItemsTab.cascadeOnMount.test.tsx`. Cabeçalho, hook-form e o efeito de hidratação são REAIS.
import { StrictMode } from 'react';

import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { getLanguageRouter } from '@/utils/get-language-route';

import { languageContextTypes } from '@/constants/languages';

import type { ModuleWeighingNfePrefill } from '@/@types/v2/ModuleWeighing/module-weighing';

const toasterErrorMock = vi.fn();

vi.mock('@/components/ui/toaster', () => ({
  toaster: {
    error: (...args: unknown[]) => toasterErrorMock(...args),
    warning: vi.fn(),
    success: vi.fn(),
  },
}));
vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({ languageGB: getLanguageRouter(languageContextTypes.BR) }),
}));
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ activeFarmUuid: 'farm-uuid-1' }),
}));
vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasFarm: true, can: () => true }),
}));
vi.mock('@/hooks/useRequest', () => ({
  useRequest: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock('@/pages/CadastrosBase/Clientes/useClientes', () => ({
  useClientForm: () => ({ data: undefined }),
}));
vi.mock('@/pages/CadastrosBase/Clientes/ClientFormModal', () => ({
  ClientFormModal: () => null,
}));
vi.mock('./useNfes', () => ({
  useNfeForm: () => ({ data: undefined, isLoading: false, isFetching: false }),
}));
vi.mock('./useNfeDetail', () => ({
  useNfeDetail: () => ({ data: undefined, isLoading: false }),
}));
vi.mock('./NfeFinancialTab', () => ({
  NfeFinancialTab: () => null,
}));
vi.mock('./NfeItemsTab', async () => {
  const { useWatch: useWatchStub } = await import('react-hook-form');
  return {
    emptyNfeItem: {},
    formatSize: (value: number) => String(value),
    NfeItemsTab: ({ control, cascadeOnMount }: { control: any; cascadeOnMount?: boolean }) => {
      const values = useWatchStub({ control });
      return (
        <div>
          <pre data-testid="form-values">{JSON.stringify(values)}</pre>
          <span data-testid="cascade-on-mount">{String(!!cascadeOnMount)}</span>
        </div>
      );
    },
  };
});

const getProductMock = vi.fn();

vi.mock('@/services/v2/Products/product-service', () => ({
  getProduct: (...args: unknown[]) => getProductMock(...args),
}));
vi.mock('@/services/v2/AdditionalInfo/additional-info-service', () => ({
  getAdditionalInfo: vi.fn(async () => ({ data: null })),
}));
vi.mock('@/services/v2/NatureOperations/nature-operation-service', () => ({
  getNatureOperation: vi.fn(async () => ({ data: null })),
  listNatureOperations: vi.fn(async () => ({ data: { items: [], meta: {} } })),
}));
vi.mock('@/services/v2/CadastrosBase/Client/client-service', () => ({
  listClients: vi.fn(async () => ({ data: { items: [], meta: {} } })),
}));
vi.mock('@/services/v2/CadastrosBase/Provider/provider-service', () => ({
  listProviderOptions: vi.fn(async () => ({ data: { items: [], meta: {} } })),
}));
vi.mock('@/services/v2/Cities/city-service', () => ({
  listCityOptions: vi.fn(async () => ({ data: { items: [], meta: {} } })),
}));
vi.mock('@/services/v2/Harvests/harvest-service', () => ({
  listHarvests: vi.fn(async () => ({ data: { items: [], meta: {} } })),
}));
vi.mock('@/services/v2/Issuers/issuer-service', () => ({
  listIssuers: vi.fn(async () => ({ data: { items: [], meta: {} } })),
}));
vi.mock('@/services/v2/Fiscal/nfe-service', () => ({
  createNfe: vi.fn(),
  updateNfe: vi.fn(),
}));
vi.mock('@/services/v2/StockWriteoffs/stock-writeoff-service', () => ({
  getStockWriteoffNfeDraft: vi.fn(),
  linkNfeToStockWriteoff: vi.fn(),
}));

import CreateOrUpdateNfe from './CreateOrUpdateNfe';

const PREFILL: ModuleWeighingNfePrefill = {
  module_weighing_uuid: 'mw-uuid-1',
  gross_weight: '45000.50',
  net_weight: '30000.25',
  measurement_uuid: 'meas-uuid-1',
  items: [
    { product_uuid: 'prod-uuid-1', quantity: '30000.2500', amount: '99', warehouse_uuid: 'wh-1' },
  ],
  block_financial: true,
};

const NEW_ROUTE = '/fiscal/nfe-emitidas/novo';
const EDIT_UUID = '3f2b8c1e-4d5a-4e6f-8a7b-9c0d1e2f3a4b';

function renderScreen(options: {
  prefill?: ModuleWeighingNfePrefill;
  path?: string;
  strict?: boolean;
}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const path = options.path ?? NEW_ROUTE;
  const tree = (
    <ChakraProvider value={system}>
      <QueryClientProvider client={client}>
        <MemoryRouter
          initialEntries={[
            {
              pathname: path,
              state: options.prefill
                ? { moduleWeighingNfePrefill: options.prefill, moduleWeighingUuid: 'mw-uuid-1' }
                : null,
            },
          ]}
        >
          <Routes>
            <Route path="/fiscal/nfe-emitidas/novo" element={<CreateOrUpdateNfe />} />
            <Route path="/fiscal/nfe-emitidas/:nfeId/editar" element={<CreateOrUpdateNfe />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </ChakraProvider>
  );
  return render(options.strict ? <StrictMode>{tree}</StrictMode> : tree);
}

function readFormValues(): Record<string, any> {
  return JSON.parse(screen.getByTestId('form-values').textContent ?? '{}');
}

beforeEach(() => {
  getProductMock.mockImplementation(async (uuid: string) => ({
    data: { uuid, code: '001', description: 'Milho em grãos' },
  }));
});

afterEach(() => {
  cleanup();
  getProductMock.mockReset();
  toasterErrorMock.mockReset();
});

describe('CreateOrUpdateNfe — handoff moduleWeighingNfePrefill (UT-000715)', () => {
  it('aplica pesos, produto e quantidade uma única vez', async () => {
    renderScreen({ prefill: PREFILL, strict: true });

    await waitFor(() => expect(readFormValues().items?.length).toBe(1));
    const values = readFormValues();
    expect(values.items).toHaveLength(1);
    expect(values.net_weight).toBe(30000.25);
    expect(values.gross_weight).toBe(45000.5);
    expect(screen.getByTestId('cascade-on-mount').textContent).toBe('true');
    // one-shot: mesmo com StrictMode (efeito duas vezes) o produto é resolvido uma única vez
    expect(getProductMock).toHaveBeenCalledTimes(1);
    expect(getProductMock).toHaveBeenCalledWith('prod-uuid-1');
  });

  it('coage strings numéricas e mantém bruto distinto do líquido', async () => {
    renderScreen({ prefill: PREFILL });

    await waitFor(() => expect(readFormValues().net_weight).toBe(30000.25));
    const values = readFormValues();
    expect(typeof values.net_weight).toBe('number');
    expect(typeof values.gross_weight).toBe('number');
    expect(values.gross_weight).toBe(45000.5);
    expect(values.gross_weight).not.toBe(values.net_weight);
  });

  it('não seta peso nulo/NaN', async () => {
    renderScreen({
      prefill: { ...PREFILL, gross_weight: null, net_weight: 'abc' },
    });

    await waitFor(() => expect(readFormValues().items?.length).toBe(1));
    const values = readFormValues();
    expect(values.net_weight ?? null).toBeNull();
    expect(values.gross_weight ?? null).toBeNull();
  });

  it('item recebe label code — description, quantity, amount 0 e warehouse null', async () => {
    renderScreen({ prefill: PREFILL });

    await waitFor(() => expect(readFormValues().items?.length).toBe(1));
    const item = readFormValues().items[0];
    expect(item.product_uuid).toEqual({ label: '001 — Milho em grãos', value: 'prod-uuid-1' });
    expect(item.product_uuid.label).not.toBe('prod-uuid-1');
    expect(item.quantity).toBe(30000.25);
    expect(item.amount).toBe(0);
    expect(item.warehouse_uuid ?? null).toBeNull();
  });

  it('falha ao resolver produto: toast, pesos aplicados, item não injetado', async () => {
    getProductMock.mockRejectedValue({ message: 'Produto indisponível' });
    renderScreen({ prefill: PREFILL });

    await waitFor(() => expect(toasterErrorMock).toHaveBeenCalledTimes(1));
    const values = readFormValues();
    expect(values.net_weight).toBe(30000.25);
    expect(values.gross_weight).toBe(45000.5);
    expect(values.items ?? []).toHaveLength(0);
    expect(screen.getByTestId('cascade-on-mount').textContent).toBe('false');
  });

  it('não pré-preenche cliente, placa, natureza nem block_financial (D-097-08)', async () => {
    renderScreen({ prefill: PREFILL });

    await waitFor(() => expect(readFormValues().items?.length).toBe(1));
    const values = readFormValues();
    expect(values.client_uuid ?? null).toBeNull();
    expect(values.shipping_board_vehicle ?? null).toBeNull();
    expect(values.natureza_uuid ?? null).toBeNull();
    // D-101-16 — nova NF-e já nasce com frete '0 – Por conta do emitente'.
    expect(values.shipping_type).toBe(0);
    expect(values.block_financial).toBeUndefined();
    expect(values.module_weighing_uuid).toBeUndefined();
  });

  it('em modo edição ignora moduleWeighingNfePrefill', async () => {
    renderScreen({ prefill: PREFILL, path: `/fiscal/nfe-emitidas/${EDIT_UUID}/editar` });

    await screen.findByTestId('form-values');
    await new Promise((resolve) => setTimeout(resolve, 150));
    const values = readFormValues();
    expect(getProductMock).not.toHaveBeenCalled();
    expect(values.net_weight ?? null).toBeNull();
    expect(values.gross_weight ?? null).toBeNull();
    expect(values.items ?? []).toHaveLength(0);
  });

  it('sem state (Nova NF-e em branco) não resolve produto nem liga a cascata', async () => {
    renderScreen({});

    await screen.findByTestId('form-values');
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(getProductMock).not.toHaveBeenCalled();
    expect(screen.getByTestId('cascade-on-mount').textContent).toBe('false');
    expect(readFormValues().items ?? []).toHaveLength(0);
  });
});
