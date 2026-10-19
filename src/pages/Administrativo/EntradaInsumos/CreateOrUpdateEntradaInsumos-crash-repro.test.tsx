// src/pages/Administrativo/EntradaInsumos/CreateOrUpdateEntradaInsumos-crash-repro.test.tsx
// -----------------------------------------------------------------------------
// F-084 (correção pós-entrega, Execução 062) — "/administrativo/entrada-
// insumos/novo cai no ERROR BOUNDARY global assim que o usuário clica em
// 'Adicionar Item'".
//
// CAUSA RAIZ (confirmada por reprodução direta, não suposição):
// `EntradaInsumosItemsTab.tsx`, Controller de `items.${index}.measurement_uuid`
// — o cálculo de `measurementOptions` lia `productOption.measurement` /
// `productOption.measurementSecond` SEM optional chaining. Como uma linha
// recém-adicionada nasce com `product_uuid: null` (nenhum produto escolhido
// ainda), `productOption` é `null` nesse instante e o acesso direto lança
// `TypeError: Cannot read properties of null (reading 'measurement')` DENTRO
// do render — capturado pelo Error Boundary global, quebrando a tela inteira.
// Reproduzido ao vivo revertendo temporariamente para `productOption.measurement`
// (sem `?.`) e confirmando a mesma stack — depois restaurado.
//
// CORREÇÃO (já presente no arquivo): `productOption?.measurement` /
// `productOption?.measurementSecond` (optional chaining), mirror EXATO do
// padrão já usado em `hasLot = !!productOption?.has_lot` alguns campos acima.
//
// Este teste é a REGRESSÃO permanente: monta a tela de CRIAÇÃO real
// (`CreateOrUpdateEntradaInsumos` + `EntradaInsumosItemsTab`), reproduz a
// interação mínima que disparava o crash (clicar "Adicionar Item" sem
// produto selecionado) e cobre os fluxos vizinhos (troca de produto com/sem
// lote, múltiplas linhas, edição/hidratação) para não perder a fidelidade já
// entregue (lote oculto por `has_lot`, Un. Medida restrita ao produto,
// Classificação, Centro de Custo obrigatório, placeholder de Tipo Apropriação).
// -----------------------------------------------------------------------------

import { StrictMode } from 'react';

import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

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

vi.mock('@/hooks/useRequest', () => ({
  useRequest: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('@/services/v2/CadastrosBase/Proprietary/proprietary-service', () => ({
  listProprietaries: vi.fn(() => Promise.resolve({ data: { data: [] } })),
}));
vi.mock('@/services/v2/Harvests/harvest-service', () => ({
  listHarvests: vi.fn(() => Promise.resolve({ data: { data: [] } })),
}));
vi.mock('@/services/v2/InputEntries/input-entry-service', () => ({
  createInputEntry: vi.fn(),
  deleteInputEntry: vi.fn(),
  getInputEntry: vi.fn(() =>
    Promise.resolve({
      data: {
        uuid: '11111111-1111-4111-8111-111111111111',
        code: 'EI-0001',
        date: '2026-09-15',
        note: 'Nota de teste',
        total_amount: 150,
        farm: { uuid: 'farm-uuid-1', description: 'Fazenda Teste' },
        proprietary: { uuid: 'prop-uuid-1', name: 'Proprietário Teste' },
        user: { uuid: 'user-uuid-1', name: 'dev.teste' },
        harvest: { uuid: 'harvest-uuid-1', description: 'Safra 2026/2027' },
        movement: null,
        items: [
          {
            uuid: 'item-uuid-1',
            product: {
              uuid: 'product-uuid-1',
              description: 'Produto Teste',
              has_lot: true,
              measurement: { uuid: 'measurement-uuid-1', description: 'KG' },
              measurement_second: { uuid: 'measurement-uuid-2', description: 'SC' },
            },
            measurement: { uuid: 'measurement-uuid-1', description: 'KG' },
            quantity: 10,
            unit_value: 15,
            total_value: 150,
            generate_stock: true,
            warehouse: { uuid: 'warehouse-uuid-1', description: 'Armazém Teste' },
            appropriation_type: null,
            provider_lot: 'LOTE-123',
            lot: 'AUTOGEN',
            shelf_life: '2026-12-31',
            cultivation: null,
            category: null,
            center: { uuid: 'center-uuid-1', code: '01.02', description: 'Lavoura' },
          },
        ],
      },
    })
  ),
  updateInputEntry: vi.fn(),
  // F-084 (RODADA FINAL, item 3, TASK-BE-1085) — `EntradaInsumosItemsTab`
  // passou a chamar este lookup (1x por aba, `useQuery`) para a elegibilidade
  // de Tipo de Apropriação. Sem o mock, a queryFn lançaria
  // `TypeError: ... is not a function` (capturado pelo React Query, não
  // pelo Error Boundary, mas indesejado em teste). `[]` — nenhum tipo
  // elegível — não afeta nenhum cenário coberto aqui (nenhum teste interage
  // com o Select de Tipo Apropriação).
  listInputEntryAppropriationTypeOptions: vi.fn(() => Promise.resolve({ data: [] })),
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

import type { InputEntryCreateForm } from '@/@types/v2/InputEntries';

import CreateOrUpdateEntradaInsumos from './CreateOrUpdateEntradaInsumos';
import { EntradaInsumosItemsTab } from './EntradaInsumosItemsTab';

function renderPage(path = '/administrativo/entrada-insumos/novo') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ChakraProvider value={system}>
          <MemoryRouter initialEntries={[path]}>
            <Routes>
              <Route
                path="/administrativo/entrada-insumos/novo"
                element={<CreateOrUpdateEntradaInsumos />}
              />
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

describe('F-084 crash repro — CreateOrUpdateEntradaInsumos (/novo)', () => {
  it('monta sem lançar exceção com 0 itens', () => {
    expect(() => renderPage()).not.toThrow();
  });

  it('REGRESSÃO — clicar "Adicionar Item" sem produto selecionado não lança exceção', () => {
    // Reproduz literalmente o crash relatado: linha nova nasce com
    // `product_uuid: null`, e o cálculo de `measurementOptions` em
    // `EntradaInsumosItemsTab.tsx` precisa tolerar isso.
    renderPage();
    const addButtons = screen.getAllByText('Adicionar Item');
    expect(() => fireEvent.click(addButtons[0])).not.toThrow();
  });

  it('adiciona item, seleciona produto COM lote, troca para produto SEM lote, limpa produto — sem exceção', () => {
    renderPage();

    const addButtons = screen.getAllByText('Adicionar Item');
    fireEvent.click(addButtons[0]);

    const pickWithLot = screen.getByTestId('select-items.0.product_uuid-pick');
    expect(() => fireEvent.click(pickWithLot)).not.toThrow();

    const pickNoLot = screen.getByTestId('select-items.0.product_uuid-pick-no-lot');
    expect(() => fireEvent.click(pickNoLot)).not.toThrow();

    // Volta para produto com lote de novo (recascata).
    expect(() => fireEvent.click(pickWithLot)).not.toThrow();

    // Limpar o produto tem que voltar `productOption` para `null` sem
    // reintroduzir o crash original.
    const clearProduct = screen.getByTestId('select-items.0.product_uuid-clear');
    expect(() => fireEvent.click(clearProduct)).not.toThrow();
  });

  it('duas linhas de item — seleciona produto na 2ª linha sem afetar a 1ª — sem exceção', () => {
    renderPage();

    const addButtons = screen.getAllByText('Adicionar Item');
    fireEvent.click(addButtons[0]);
    fireEvent.click(addButtons[0]);

    const pickRow0 = screen.getByTestId('select-items.0.product_uuid-pick');
    const pickRow1 = screen.getByTestId('select-items.1.product_uuid-pick-no-lot');

    expect(() => fireEvent.click(pickRow0)).not.toThrow();
    expect(() => fireEvent.click(pickRow1)).not.toThrow();
  });
});

describe('F-084 crash repro — CreateOrUpdateEntradaInsumos (/:uuid, edição)', () => {
  it('hidrata um registro real (produto com lote) sem lançar exceção', async () => {
    expect(() =>
      renderPage('/administrativo/entrada-insumos/11111111-1111-4111-8111-111111111111')
    ).not.toThrow();

    // A hidratação de edição NÃO embute `measurement`/`measurementSecond`
    // na option de `product_uuid` (só `has_lot` — ver `InputEntryItemForm`),
    // logo `productOption` fica definido mas SEM os 2 campos usados pelo
    // cálculo de `measurementOptions`. Precisa continuar tolerante (mesma
    // guarda `productOption?.measurement`) até a query resolver e o
    // `reset()` de `fillEntradaInsumosForm` popular o item real.
    await waitFor(() => {
      expect(screen.getAllByText('EI-0001').length).toBeGreaterThan(0);
    });
    expect(screen.queryByText(/algo deu errado/i)).toBeNull();
  });

  // T-078-FE-04/06 — Un. Medida hidratada mostra a unidade salva (label da API)
  // e nenhum texto da tela tem padrão de uuid.
  it('mostra a unidade salva e não exibe uuid como label', async () => {
    const { container } = renderPage(
      '/administrativo/entrada-insumos/11111111-1111-4111-8111-111111111111'
    );
    await waitFor(() => {
      expect(screen.getAllByText('EI-0001').length).toBeGreaterThan(0);
    });
    await waitFor(() => {
      expect(screen.getAllByText('KG').length).toBeGreaterThan(0);
    });
    expect(container.textContent ?? '').not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-/);
  });
});

// -----------------------------------------------------------------------------
// Cobertura de unidade da linha isolada (`EntradaInsumosItemRow`), sem
// depender da tela inteira — cobre diretamente o Controller de
// `measurement_uuid` para os 3 estados de `productOption` (ausente, com
// lote, sem lote).
// -----------------------------------------------------------------------------

function ItemsTabHarness({
  withProduct,
  itemUuid,
}: {
  withProduct: 'none' | 'with-lot' | 'no-lot';
  itemUuid?: string;
}) {
  const productOption =
    withProduct === 'none'
      ? null
      : {
          label: 'Produto Teste',
          value: 'product-uuid-1',
          has_lot: withProduct === 'with-lot',
          measurement: { label: 'Kg', value: 'measurement-uuid-1' },
          measurementSecond: { label: 'Ton', value: 'measurement-uuid-2' },
        };

  const { control, watch, setValue, formState } = useForm<InputEntryCreateForm>({
    defaultValues: {
      date: '2026-09-15',
      harvest_uuid: null,
      proprietary_uuid: null,
      note: '',
      automatic_writeoff: false,
      account_uuid: null,
      movement_date: null,
      items: [
        {
          uuid: itemUuid,
          product_uuid: productOption as any,
          measurement_uuid: null,
          quantity: null,
          unit_value: null,
          total_value: 0,
          generate_stock: true,
          warehouse_uuid: null,
          appropriation_type: null,
          provider_lot: itemUuid ? 'LOTE-ORIGINAL' : '',
          shelf_life: itemUuid ? '2026-12-31' : null,
          cultivation_uuid: null,
          category_uuid: null,
          center_uuid: null,
        },
      ],
    },
  });

  return (
    <EntradaInsumosItemsTab
      control={control}
      errors={formState.errors}
      watch={watch}
      setValue={setValue}
      isLoading={false}
      canSave
    />
  );
}

function renderItemsTab(withProduct: 'none' | 'with-lot' | 'no-lot', itemUuid?: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ChakraProvider value={system}>
        <ItemsTabHarness withProduct={withProduct} itemUuid={itemUuid} />
      </ChakraProvider>
    </QueryClientProvider>
  );
}

describe('F-084 crash repro — EntradaInsumosItemsTab row (productOption nulo/definido)', () => {
  it('renderiza linha SEM produto selecionado (productOption=null) sem lançar exceção', () => {
    expect(() => renderItemsTab('none')).not.toThrow();
  });

  it('renderiza linha COM produto has_lot=true sem lançar exceção', () => {
    expect(() => renderItemsTab('with-lot')).not.toThrow();
  });

  it('renderiza linha COM produto has_lot=false sem lançar exceção', () => {
    expect(() => renderItemsTab('no-lot')).not.toThrow();
  });

  // DD-078-07 (b) — lote/validade do item já gravado ficam somente leitura.
  it('item EXISTENTE (uuid) com lote: exibe o lote original e o campo fica desabilitado', () => {
    renderItemsTab('with-lot', 'item-uuid-1');
    const lot = screen.getByDisplayValue('LOTE-ORIGINAL') as HTMLInputElement;
    expect(lot.disabled).toBe(true);
  });

  it('item NOVO (sem uuid) com produto has_lot: lote segue editável', () => {
    renderItemsTab('with-lot');
    const lot = screen
      .getAllByRole('textbox')
      .find((el) => (el as HTMLInputElement).maxLength === 15) as HTMLInputElement | undefined;
    expect(lot).toBeDefined();
    expect(lot!.disabled).toBe(false);
  });

  // DD-078-07 (b) — produto de item existente somente leitura, com dica.
  it('item EXISTENTE: Select Produto desabilitado e com a dica de remover o item', () => {
    renderItemsTab('with-lot', 'item-uuid-1');
    const product = screen.getAllByTestId('sap-items.0.product_uuid').at(-1) as HTMLElement;
    expect(product.getAttribute('data-disabled')).toBe('true');
    expect(product.getAttribute('data-helper')).toBe(
      languagePtBr.BR.inputEntries.inputEntry.form.hints.productLockedWhenSaved
    );
  });

  it('item NOVO: Select Produto editável e sem dica', () => {
    renderItemsTab('with-lot');
    const product = screen.getAllByTestId('sap-items.0.product_uuid').at(-1) as HTMLElement;
    expect(product.getAttribute('data-disabled')).toBe('false');
    expect(product.getAttribute('data-helper')).toBe('');
  });
});
