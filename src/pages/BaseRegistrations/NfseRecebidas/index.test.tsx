// UT-000754 / T-754-FE-02 — FE-LIST-01..04, FE-LAUNCH-01..03, FE-FILTER-01 e
// regressão XML/DANFE. A grid real (TableProvider/Table/Actions) é substituída
// por stubs finos que executam os `cell` das colunas da própria tela.
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AxiosError } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { getLanguageRouter } from '@/utils/get-language-route';

import { FilterSideNfseRecebidas } from './FilterSideNfseRecebidas';

import NfseRecebidasList from './index';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  buildNfseExpenseDraft: vi.fn(),
  downloadNfseXml: vi.fn(),
  generateNfseDanfe: vi.fn(),
  downloadBlob: vi.fn(),
  getIssuerByUuid: vi.fn(),
  permissions: new Set<string>(),
  items: [] as any[],
  columns: [] as any[],
}));

vi.mock('react-router-dom', () => ({ useNavigate: () => mocks.navigate }));
vi.mock('@/components/ui/toaster', () => ({
  toaster: { success: mocks.toastSuccess, error: mocks.toastError, create: vi.fn(), info: vi.fn() },
}));
vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({ languageGB: getLanguageRouter('BR') }),
}));
vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ can: (p: string) => mocks.permissions.has(p) }),
}));
vi.mock('@/hooks/usePaginatedQueryStorage', () => ({
  userPaginatedQuery: () => ({
    paginatedQuery: { filter: { issuer_uuid: 'issuer-1' } },
    handlePaginatedQuery: vi.fn(),
    handleFilterChange: vi.fn(),
    handleResetFilter: vi.fn(),
  }),
}));
vi.mock('@/hooks/useCustomGridQuery', () => ({
  useCustomGridQuery: () => ({
    data: { data: { items: mocks.items } },
    isLoading: false,
    isPending: false,
    isError: false,
    isFetching: false,
    refetch: vi.fn(),
  }),
}));
vi.mock('@/hooks/useGridSettings', () => ({
  useGridSettings: () => ({
    columnOrder: [],
    setColumnOrder: vi.fn(),
    columnVisibility: {},
    setColumnVisibility: vi.fn(),
  }),
}));
vi.mock('@/hooks/useGridStorageScope', () => ({ useGridStorageScope: () => null }));
vi.mock('@/utils/downloadBlob', () => ({ downloadBlob: mocks.downloadBlob }));
vi.mock('@/services/v2/BaseRegistrations/nfse-service', () => ({
  buildNfseExpenseDraft: mocks.buildNfseExpenseDraft,
  downloadNfseXml: mocks.downloadNfseXml,
  generateNfseDanfe: mocks.generateNfseDanfe,
  listNfses: vi.fn(),
}));
vi.mock('@/services/v2/Issuers/issuer-service', () => ({
  getIssuerByUuid: mocks.getIssuerByUuid,
  listIssuers: vi.fn(),
}));
vi.mock('@/contexts/TableContext', () => ({
  TableProvider: ({ columns, data, children }: any) => {
    mocks.columns = columns;
    mocks.items = data ?? [];
    return <div>{children}</div>;
  },
}));
vi.mock('@/components/HeaderGrid', () => ({
  HeaderGrid: ({ children }: any) => <div>{children}</div>,
}));
vi.mock('./HeaderTable', () => ({ HeaderTable: () => null }));
vi.mock('@/components/ContainerGrid', () => ({
  ContainerGrid: ({ children }: any) => <div>{children}</div>,
}));
vi.mock('@/components/Button', () => ({
  Button: ({ title, onClick }: any) => (
    <button type="button" onClick={onClick}>
      {title}
    </button>
  ),
}));
vi.mock('@/components/Table', () => ({
  Table: () => (
    <table>
      <tbody>
        {mocks.items.map((item) => (
          <tr key={item.uuid} data-testid={`row-${item.uuid}`}>
            {mocks.columns.map((column: any, index: number) => (
              <td key={column.id ?? column.accessorKey ?? index}>
                {column.cell?.({ row: { original: item } })}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
}));
vi.mock('@/components/Action', () => {
  const Item = ({ children, onClick, disabled, disabledReason }: any) => (
    <button type="button" disabled={disabled} title={disabledReason} onClick={onClick}>
      {children}
    </button>
  );
  const Actions = ({ children }: any) => <div>{children}</div>;
  Actions.Item = Item;
  return { Actions };
});
vi.mock('@/components/FilterSide', () => ({
  FilterSide: ({ children }: any) => <div>{children}</div>,
}));
vi.mock('@/components/Form', () => {
  const Form = ({ children }: any) => <form>{children}</form>;
  Form.BodyFilter = ({ children }: any) => <div>{children}</div>;
  Form.FooterFilter = ({ children }: any) => <div>{children}</div>;
  return { Form };
});
vi.mock('@/components/Form/Field', () => ({ Field: ({ children }: any) => <div>{children}</div> }));
vi.mock('@/components/Form/Input', async () => {
  const { forwardRef } = await import('react');
  return { Input: forwardRef(() => null) };
});
vi.mock('@/components/Form/Select', () => ({ Select: () => null }));
vi.mock('@/components/DateInput', () => ({ DateInput: () => null }));
vi.mock('@/components/Form/SelectAsyncPaginate', () => ({
  SelectAsyncPaginate: ({ value }: any) => (
    <div data-testid="issuer-label">{value?.label ?? ''}</div>
  ),
}));

const text = getLanguageRouter('BR')!.baseRegistrations.nfse;

function makeItem(partial: Record<string, unknown> = {}) {
  return {
    uuid: 'nfse-1',
    issuer_uuid: 'issuer-1',
    issuer_razao_social: 'Emissor',
    chave: 'K'.repeat(50),
    name: 'Prestador A',
    cpf_cnpj: '12345678901',
    value: 100,
    dt_emission: '2026-05-10T14:30:00',
    competence: '2026-05-01',
    city_code: '1',
    number: '10',
    serie: '1',
    description: 'd',
    has_file: true,
    is_launched: false,
    launched_expense_uuid: null,
    ...partial,
  };
}

function renderList() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <ChakraProvider value={system}>
      <QueryClientProvider client={client}>
        <NfseRecebidasList />
      </QueryClientProvider>
    </ChakraProvider>
  );
}

describe('NfseRecebidas lista (UT-000754)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.permissions = new Set(['nfse_launch', 'nfse_danfe', 'nfse_xml', 'expenses_create']);
    mocks.items = [];
  });
  afterEach(cleanup);

  it('FE-LIST-01 mascara CPF (11) e CNPJ (14)', () => {
    mocks.items = [
      makeItem({ uuid: 'a', cpf_cnpj: '12345678901' }),
      makeItem({ uuid: 'b', cpf_cnpj: '12345678000190' }),
    ];
    renderList();
    expect(screen.getByTestId('row-a').textContent).toContain('123.456.789-01');
    expect(screen.getByTestId('row-b').textContent).toContain('12.345.678/0001-90');
  });

  it('FE-LIST-02 emissão em dd/MM/yyyy HH:mm', () => {
    mocks.items = [makeItem()];
    renderList();
    expect(screen.getByTestId('row-nfse-1').textContent).toContain('10/05/2026 14:30');
  });

  it('FE-LIST-03 competência MM/yyyy e nulos viram --', () => {
    mocks.items = [
      makeItem({ uuid: 'a' }),
      makeItem({ uuid: 'b', competence: null, dt_emission: null, cpf_cnpj: '' }),
    ];
    renderList();
    expect(screen.getByTestId('row-a').textContent).toContain('05/2026');
    const nullRow = screen.getByTestId('row-b').textContent ?? '';
    expect(nullRow.match(/--/g)?.length).toBeGreaterThanOrEqual(3);
  });

  it('FE-LIST-04 "Lançar" desabilitado com is_launched ou sem expenses_create', () => {
    mocks.items = [makeItem({ uuid: 'a', is_launched: true })];
    renderList();
    expect(
      (screen.getByRole('button', { name: text.list.actions.launchExpense }) as HTMLButtonElement)
        .disabled
    ).toBe(true);
    cleanup();

    mocks.permissions = new Set(['nfse_launch']);
    mocks.items = [makeItem({ uuid: 'b' })];
    renderList();
    const button = screen.getByRole('button', {
      name: text.list.actions.launchExpense,
    }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(button.title).toBe(text.expenseDraft.noPermissionReason);
  });

  it('FE-LAUNCH-01/03 sucesso navega para /financeiro/pagar/novo com state.nfseDraft, sem modal', async () => {
    const draft = { xml_key: 'K'.repeat(50), provider_uuid: 'p-1' };
    mocks.buildNfseExpenseDraft.mockResolvedValue({ data: draft });
    mocks.items = [makeItem()];
    renderList();
    fireEvent.click(screen.getByRole('button', { name: text.list.actions.launchExpense }));
    await waitFor(() =>
      expect(mocks.navigate).toHaveBeenCalledWith('/financeiro/pagar/novo', {
        state: { nfseDraft: draft },
      })
    );
    expect(mocks.buildNfseExpenseDraft).toHaveBeenCalledWith('nfse-1');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('FE-LAUNCH-02 422 "já vinculada" vira toast e não navega', async () => {
    mocks.buildNfseExpenseDraft.mockRejectedValue(
      new AxiosError('x', '422', undefined, undefined, {
        status: 422,
        data: { message: 'Esta NFS-e já está vinculada a uma despesa.' },
      } as any)
    );
    mocks.items = [makeItem()];
    renderList();
    fireEvent.click(screen.getByRole('button', { name: text.list.actions.launchExpense }));
    await waitFor(() => expect(mocks.toastError).toHaveBeenCalled());
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it('regressão — XML e DANFE continuam baixando', async () => {
    mocks.downloadNfseXml.mockResolvedValue(new Blob(['x']));
    mocks.generateNfseDanfe.mockResolvedValue(new Blob(['y']));
    mocks.items = [makeItem()];
    renderList();
    fireEvent.click(screen.getByRole('button', { name: text.list.actions.downloadXml }));
    await waitFor(() => expect(mocks.downloadBlob).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole('button', { name: text.list.actions.generateDanfe }));
    await waitFor(() => expect(mocks.downloadBlob).toHaveBeenCalledTimes(2));
  });
});

describe('FilterSideNfseRecebidas (UT-000754)', () => {
  afterEach(cleanup);

  it('FE-FILTER-01 reabrir o filtro mostra a razão social do emissor, não o uuid', async () => {
    mocks.getIssuerByUuid.mockResolvedValue({ data: { razao_social: 'Fazenda Boa Vista Ltda' } });
    const languageGB = getLanguageRouter('BR')!;
    render(
      <ChakraProvider value={system}>
        <FilterSideNfseRecebidas
          isOpen
          onClose={vi.fn()}
          handleReset={vi.fn()}
          handleFilterChange={vi.fn()}
          filter={{ issuer_uuid: '99999999-9999-4999-8999-999999999999' }}
          languageGB={languageGB}
        />
      </ChakraProvider>
    );
    await waitFor(() =>
      expect(screen.getByTestId('issuer-label').textContent).toBe('Fazenda Boa Vista Ltda')
    );
    expect(mocks.getIssuerByUuid).toHaveBeenCalledWith('99999999-9999-4999-8999-999999999999');
  });
});
