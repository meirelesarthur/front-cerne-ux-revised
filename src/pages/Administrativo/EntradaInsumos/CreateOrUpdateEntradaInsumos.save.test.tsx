import { StrictMode } from 'react';

import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { languagePtBr } from '@/constants/languages/languagePtBr';

vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({
    languageInUse: 'BR',
    languageGB: languagePtBr.BR,
    updateLanguageGB: vi.fn(),
  }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { username: 'dev.teste' },
    profile: null,
    error: null,
    isAuthenticated: true,
    loading: false,
    activeFarmUuid: 'farm-uuid-1',
    signIn: vi.fn(),
    signOut: vi.fn(),
    refreshProfile: vi.fn(),
  }),
}));

vi.mock('@/hooks/useMyFarms', () => ({
  useMyFarms: () => ({
    data: [{ uuid: 'farm-uuid-1', description: 'Fazenda Teste' }],
    isLoading: false,
  }),
}));

vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({
    permissions: [],
    can: () => true,
    canAny: () => true,
    canAll: () => true,
    hasRole: () => false,
    hasFarm: true,
    isFarmScoped: () => false,
  }),
}));

const mockDetail = vi.hoisted(() => ({ value: null as any }));
vi.mock('@/services/v2/InputEntries/input-entry-service', () => ({
  createInputEntry: vi.fn(),
  deleteInputEntry: vi.fn(),
  getInputEntry: vi.fn(() => Promise.resolve({ data: mockDetail.value })),
  updateInputEntry: vi.fn(),
  listInputEntryAppropriationTypeOptions: vi.fn(() => Promise.resolve({ data: [] })),
}));
vi.mock('@/services/v2/CadastrosBase/Proprietary/proprietary-service', () => ({
  listProprietaries: vi.fn(() => Promise.resolve({ data: { data: [] } })),
}));
vi.mock('@/services/v2/Harvests/harvest-service', () => ({
  listHarvests: vi.fn(() => Promise.resolve({ data: { data: [] } })),
}));
vi.mock('@/services/v2/CostCenters/cost-center-service', () => ({
  listCostCenterOptions: vi.fn(() => Promise.resolve({ data: { data: [] } })),
}));
vi.mock('@/services/v2/Cultivation/cultivation-service', () => ({
  listCultivationOptions: vi.fn(() => Promise.resolve({ data: { data: [] } })),
}));
vi.mock('@/services/v2/FinancialCategories/financial-category-service', () => ({
  listFinancialCategoryOptions: vi.fn(() => Promise.resolve({ data: { data: [] } })),
}));
vi.mock('@/services/v2/Products/product-service', () => ({
  listProducts: vi.fn(() => Promise.resolve({ data: { data: [] } })),
}));
vi.mock('@/services/v2/Warehouses/warehouse-service', () => ({
  listWarehouseOptions: vi.fn(() => Promise.resolve({ data: { data: [] } })),
}));
vi.mock('@/services/v2/CadastrosBase/Account/account-service', () => ({
  listAccounts: vi.fn(() => Promise.resolve({ data: { data: [] } })),
  getAccountBalance: vi.fn(() => Promise.resolve({ data: { balance: 0 } })),
}));

vi.mock('@/components/Form/SelectAsyncPaginate', () => ({
  SelectAsyncPaginate: (props: any) => (
    <div
      data-testid={`sap-${props.name}`}
      data-disabled={String(!!props.isDisabled)}
      data-helper={props.helperText ?? ''}
    >
      <button
        type="button"
        data-testid={`select-${props.name}-pick`}
        onClick={() =>
          props.onChange({
            label: 'Produto Teste',
            value: 'product-uuid-1',
            has_lot: true,
            measurement: { label: 'Kg', value: 'measurement-uuid-1' },
            measurementSecond: { label: 'Ton', value: 'measurement-uuid-2' },
          })
        }
      >
        pick-{props.name}
      </button>
      <button
        type="button"
        data-testid={`select-${props.name}-pick-no-lot`}
        onClick={() =>
          props.onChange({
            label: 'Produto Sem Lote',
            value: 'product-uuid-2',
            has_lot: false,
            measurement: { label: 'Un', value: 'measurement-uuid-3' },
            measurementSecond: null,
          })
        }
      >
        pick-no-lot-{props.name}
      </button>
      <button
        type="button"
        data-testid={`select-${props.name}-clear`}
        onClick={() => props.onChange(null)}
      >
        clear-{props.name}
      </button>
    </div>
  ),
}));

const UUID = '11111111-1111-4111-8111-111111111111';
const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock('@/components/ui/toaster', () => ({
  toaster: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/components/DateInput', () => ({
  DateInput: (props: any) => (
    <input
      data-testid="date-input"
      aria-label={props.label ?? 'date'}
      value={props.value ?? ''}
      onChange={(e) => props.onChange(e.target.value)}
    />
  ),
}));

const detail = {
  uuid: UUID,
  code: 'EI-0001',
  date: '2026-09-30',
  note: 'AAAA',
  total_amount: 1500,
  farm: { uuid: 'farm-uuid-1', description: 'Fazenda Teste' },
  proprietary: { uuid: 'prop-1', name: 'Proprietário Teste' },
  user: { uuid: 'user-uuid-1', name: 'dev.teste' },
  harvest: { uuid: 'harv-1', description: 'Safra 2026/2027' },
  movement: null,
  items: [
    {
      uuid: 'item-uuid-1',
      product: {
        uuid: 'prod-1',
        description: 'Produto Sem Lote',
        has_lot: false,
        measurement: { uuid: 'm-g', description: 'Grama' },
        measurement_second: null,
      },
      measurement: { uuid: 'm-g', description: 'Grama' },
      quantity: 150,
      unit_value: 10,
      total_value: 1500,
      generate_stock: true,
      warehouse: { uuid: 'wh-1', description: 'Armazém Insumos' },
      appropriation_type: null,
      provider_lot: null,
      lot: null,
      shelf_life: null,
      cultivation: null,
      category: { uuid: 'cat-1', description: 'Categoria' },
      center: { uuid: 'cc-1', code: '01', description: 'Centro' },
    },
  ],
};

mockDetail.value = detail;

import { updateInputEntry } from '@/services/v2/InputEntries/input-entry-service';

import CreateOrUpdateEntradaInsumos from './CreateOrUpdateEntradaInsumos';

function renderEdit() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ChakraProvider value={system}>
          <MemoryRouter initialEntries={[`/administrativo/entrada-insumos/${UUID}`]}>
            <Routes>
              <Route
                path="/administrativo/entrada-insumos/:uuid"
                element={<CreateOrUpdateEntradaInsumos />}
              />
            </Routes>
          </MemoryRouter>
        </ChakraProvider>
      </QueryClientProvider>
    </StrictMode>
  );
}

async function openLoaded() {
  renderEdit();
  await waitFor(() => {
    expect(screen.getAllByText('EI-0001').length).toBeGreaterThan(0);
  });
  await waitFor(() => {
    expect(qtyInput()?.value).toBeTruthy();
  });
}

function qtyInput() {
  return document.querySelector('input[name="items.0.quantity"]') as HTMLInputElement;
}
function totalInput() {
  return document.querySelector('input[name="items.0.total_value"]') as HTMLInputElement;
}
async function save() {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /^Salvar$/ }));
  });
}

describe('078 R2 — edição da Entrada de Insumos (Salvar)', () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    navigateMock.mockClear();
    (updateInputEntry as any).mockReset();
    (updateInputEntry as any).mockResolvedValue({ data: { uuid: UUID } });
  });

  it('edição com Qtd alterada chama o PUT uma vez com a nova quantidade', async () => {
    await openLoaded();
    fireEvent.change(qtyInput(), { target: { value: '10000' } });
    await save();
    await waitFor(() => expect(updateInputEntry).toHaveBeenCalledTimes(1));
    const [uuid, payload] = (updateInputEntry as any).mock.calls[0];
    expect(uuid).toBe(UUID);
    expect(payload.items[0].quantity).toBe(10);
    expect(payload.items[0].uuid).toBe('item-uuid-1');
  });

  it('edição só da data chama o PUT', async () => {
    await openLoaded();
    fireEvent.change(screen.getByTestId('date-input'), { target: { value: '2026-09-29' } });
    await save();
    await waitFor(() => expect(updateInputEntry).toHaveBeenCalledTimes(1));
    expect((updateInputEntry as any).mock.calls[0][1].date).toBe('2026-09-29');
  });

  it('edição só do V. Total marca o campo como alterado e envia o PUT', async () => {
    await openLoaded();
    fireEvent.change(totalInput(), { target: { value: '10000' } });
    await save();
    await waitFor(() => expect(updateInputEntry).toHaveBeenCalledTimes(1));
    expect((updateInputEntry as any).mock.calls[0][1].items[0].unit_value).toBeCloseTo(0.6667, 4);
  });

  it('edição sem alteração não chama o PUT e volta', async () => {
    await openLoaded();
    await save();
    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith(-1));
    expect(updateInputEntry).not.toHaveBeenCalled();
  });
});
