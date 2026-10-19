// UT-000776 / T-776-FE-07 — NfseRecebidas: a coluna CPF/CNPJ exibe CNPJ alfanumérico formatado.
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { getLanguageRouter } from '@/utils/get-language-route';

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

describe('NfseRecebidas exibição de CNPJ alfanumérico (UT-000776)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.permissions = new Set();
    mocks.items = [];
  });
  afterEach(cleanup);

  it('formata CNPJ com letras (caixa alta) na coluna', () => {
    mocks.items = [makeItem({ uuid: 'a', cpf_cnpj: '12abc345000188' })];
    renderList();
    expect(screen.getByTestId('row-a').textContent).toContain('12.ABC.345/0001-88');
  });
});
