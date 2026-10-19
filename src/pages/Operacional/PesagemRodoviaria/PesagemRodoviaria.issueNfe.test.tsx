// @vitest-environment jsdom
// UT-000715 / T-FE-715-02(b) — `handleIssueNfe` da listagem de Pesagem Rodoviária: a ação
// "Emitir NFe" consulta a elegibilidade e navega para `/fiscal/nfe-emitidas/novo` com
// `state.moduleWeighingNfePrefill` (+ `moduleWeighingUuid`); em erro 4xx mostra toast com a
// `message` da API e permanece na lista (sem navegar).
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AxiosError, AxiosHeaders } from 'axios';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { getLanguageRouter } from '@/utils/get-language-route';

import { languageContextTypes } from '@/constants/languages';

const toasterErrorMock = vi.fn();
const eligibilityMock = vi.fn();

vi.mock('@/components/ui/toaster', () => ({
  toaster: {
    error: (...args: unknown[]) => toasterErrorMock(...args),
    success: vi.fn(),
    warning: vi.fn(),
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
vi.mock('@/hooks/usePaginatedQueryStorage', () => ({
  userPaginatedQuery: () => ({
    paginatedQuery: { page: 1, pageSize: 10, filter: null },
    handlePaginatedQuery: vi.fn(),
    handleFilterChange: vi.fn(),
    handleResetFilter: vi.fn(),
  }),
}));
vi.mock('./useModuleWeighings', () => ({
  useModuleWeighingsList: () => ({
    data: {
      data: {
        items: [
          {
            uuid: 'mw-uuid-1',
            status: 5,
            code: '0001',
            responsible: { name: 'Fulano' },
            date: '2026-10-01',
            warehouse: { description: 'Armazém 1' },
            product: { description: 'Milho' },
            type: 0,
            category: 0,
            nfe_uuid: null,
            transfer_uuid: null,
          },
        ],
        meta: { current_page: 1, last_page: 1, per_page: 10, total: 1 },
      },
    },
    isLoading: false,
    isFetching: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
}));
vi.mock('./HeaderTable', () => ({ HeaderTable: () => null }));
vi.mock('./FilterSideModuleWeighing', () => ({ FilterSideModuleWeighing: () => null }));
vi.mock('./ModuleWeighingStatusLegend', () => ({ ModuleWeighingStatusLegend: () => null }));
vi.mock('./DeleteModuleWeighingDialog', () => ({ DeleteModuleWeighingDialog: () => null }));
vi.mock('@/services/v2/ModuleWeighing/module-weighing-service', () => ({
  deleteModuleWeighing: vi.fn(),
  getModuleWeighingNfeEligibility: (...args: unknown[]) => eligibilityMock(...args),
  getModuleWeighingTransferEligibility: vi.fn(),
}));

import ModuleWeighingList from './index';

function NovaNfeProbe() {
  const location = useLocation();
  return (
    <div>
      <span data-testid="nova-nfe-route">{location.pathname}</span>
      <pre data-testid="nova-nfe-state">{JSON.stringify(location.state)}</pre>
    </div>
  );
}

function renderList() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <ChakraProvider value={system}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/operacional/pesagem-rodoviaria']}>
          <Routes>
            <Route path="/operacional/pesagem-rodoviaria" element={<ModuleWeighingList />} />
            <Route path="/fiscal/nfe-emitidas/novo" element={<NovaNfeProbe />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </ChakraProvider>
  );
}

async function clickIssueNfe() {
  fireEvent.click(await screen.findByRole('button', { name: /a[çc][õo]es|actions/i }));
  fireEvent.click(await screen.findByText(/Emitir NFe/i));
}

beforeEach(() => {
  eligibilityMock.mockReset();
  toasterErrorMock.mockReset();
});

afterEach(() => {
  cleanup();
});

describe('Pesagem Rodoviária — handleIssueNfe (UT-000715)', () => {
  it('navega com state moduleWeighingNfePrefill e moduleWeighingUuid', async () => {
    const prefill = {
      module_weighing_uuid: 'mw-uuid-1',
      gross_weight: '45000.00',
      net_weight: '30000.00',
      items: [
        { product_uuid: 'prod-1', quantity: '30000.0000', amount: '0', warehouse_uuid: null },
      ],
    };
    eligibilityMock.mockResolvedValue({ success: true, data: prefill });
    renderList();

    await clickIssueNfe();

    await waitFor(() =>
      expect(screen.getByTestId('nova-nfe-route').textContent).toBe('/fiscal/nfe-emitidas/novo')
    );
    expect(eligibilityMock).toHaveBeenCalledWith('mw-uuid-1');
    const state = JSON.parse(screen.getByTestId('nova-nfe-state').textContent ?? '{}');
    expect(state.moduleWeighingNfePrefill).toEqual(prefill);
    expect(state.moduleWeighingUuid).toBe('mw-uuid-1');
    expect(toasterErrorMock).not.toHaveBeenCalled();
  });

  it('exibe toast com a message da API no erro de elegibilidade e permanece na lista', async () => {
    eligibilityMock.mockRejectedValue(
      new AxiosError('Request failed with status code 422', 'ERR_BAD_REQUEST', undefined, null, {
        status: 422,
        statusText: 'Unprocessable Entity',
        headers: {},
        config: { headers: new AxiosHeaders() },
        data: { success: false, message: 'Pesagem não elegível para NF-e.', errors: null },
      })
    );
    renderList();

    await clickIssueNfe();

    await waitFor(() => expect(toasterErrorMock).toHaveBeenCalledTimes(1));
    expect(toasterErrorMock.mock.calls[0][0].description).toBe('Pesagem não elegível para NF-e.');
    expect(screen.queryByTestId('nova-nfe-route')).toBeNull();
  });
});
