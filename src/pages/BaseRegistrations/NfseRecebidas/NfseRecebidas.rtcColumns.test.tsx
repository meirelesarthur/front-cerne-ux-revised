// UT-000776 / T-776-FE-09 — NfseRecebidas: colunas IBS (v_ibs_uf + v_ibs_mun) e CBS (v_cbs) depois de Valor.
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

const GROUP_NULL = {
  c_class_trib: null,
  cst_ibs_cbs: null,
  v_bc_ibs_cbs: null,
  v_ibs_uf: null,
  v_ibs_mun: null,
  v_cbs: null,
  v_liquido: null,
};

function makeItem(partial: Record<string, unknown> = {}) {
  return {
    uuid: 'nfse-1',
    issuer_uuid: 'issuer-1',
    issuer_razao_social: 'Emissor',
    chave: 'K'.repeat(50),
    name: 'Prestador A',
    cpf_cnpj: '12345678901',
    value: 200,
    dt_emission: '2026-05-10T14:30:00',
    competence: '2026-05-01',
    city_code: '1',
    number: '10',
    serie: '1',
    description: 'd',
    has_file: true,
    is_launched: false,
    launched_expense_uuid: null,
    ...GROUP_NULL,
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

function columnIds(): string[] {
  return mocks.columns.map((c: any) => c.id ?? c.accessorKey);
}

describe('NfseRecebidas colunas IBS e CBS (UT-000776 T-776-FE-09)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.permissions = new Set();
    mocks.items = [];
  });
  afterEach(cleanup);

  it('posiciona IBS e CBS logo depois de Valor, nessa ordem', () => {
    mocks.items = [makeItem({ uuid: 'a' })];
    renderList();
    const ids = columnIds();
    const valor = ids.indexOf('value');
    expect(valor).toBeGreaterThan(-1);
    expect(ids[valor + 1]).toBe('ibs');
    expect(ids[valor + 2]).toBe('v_cbs');
  });

  it('com grupo: IBS = v_ibs_uf + v_ibs_mun, CBS = v_cbs; Valor continua vBC', () => {
    mocks.items = [
      makeItem({
        uuid: 'g',
        value: 200,
        v_bc_ibs_cbs: 200,
        v_ibs_uf: 10,
        v_ibs_mun: 5,
        v_cbs: 9,
        c_class_trib: '000001',
        cst_ibs_cbs: '000',
        v_liquido: 180,
      }),
    ];
    renderList();
    const row = screen.getByTestId('row-g').textContent ?? '';
    expect(row).toContain('200,00');
    expect(row).toContain('15,00');
    expect(row).toContain('9,00');
  });

  it('sem grupo: IBS e CBS exibem placeholder -- sem quebrar a linha', () => {
    mocks.items = [makeItem({ uuid: 'n' })];
    renderList();
    const row = screen.getByTestId('row-n').textContent ?? '';
    expect(row).toContain('--');
    expect(row).toContain('200,00');
    expect(row).not.toContain('NaN');
  });

  it('um dos componentes do IBS nulo: soma o que existe; CBS nulo vira --', () => {
    mocks.items = [makeItem({ uuid: 'p', v_ibs_uf: 7, v_ibs_mun: null, v_cbs: null })];
    renderList();
    const row = screen.getByTestId('row-p').textContent ?? '';
    expect(row).toContain('7,00');
    expect(row).toContain('--');
  });
});
