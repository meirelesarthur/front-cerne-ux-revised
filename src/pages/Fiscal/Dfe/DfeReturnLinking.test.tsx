// @vitest-environment jsdom
// UT-000752 (T-752-FE-03) — Vínculo de Retorno sobre
// `GET /dfes/{uuid}/return-candidates`: cabeçalho vem da API (sem
// `location.state`), "Aceitar sugestão" marca os uuids, 1 → /finalizar,
// N → /finalizar-lote?ids=, 422 → estado de erro com a mensagem e os filtros
// date/search vão para o servidor (sem filtro no cliente).
import { ChakraProvider } from '@chakra-ui/react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AxiosError } from 'axios';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { languageDfes } from '@/constants/languages/languagePtBr/languageDfes';

const h = vi.hoisted(() => ({
  navigate: vi.fn(),
  handleFilterChange: vi.fn(),
  gridQuery: vi.fn(),
  paginatedFilter: undefined as any,
  query: {} as any,
}));

vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useNavigate: () => h.navigate,
}));
vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({ languageGB: { dfes: languageDfes, defaltStrings: {} } }),
}));
vi.mock('@/hooks/usePaginatedQueryStorage', () => ({
  userPaginatedQuery: () => ({
    paginatedQuery: {
      pageIndex: 1,
      pageSize: 10,
      pagesCount: 1,
      totalRecords: 3,
      filter: h.paginatedFilter,
    },
    handlePaginatedQuery: vi.fn(),
    handleFilterChange: h.handleFilterChange,
  }),
}));
vi.mock('@/hooks/useCustomGridQueryById', () => ({
  useCustomGridQueryById: (args: unknown) => {
    h.gridQuery(args);
    return h.query;
  },
}));
vi.mock('@/services/v2/Fiscal/dfe-service', () => ({ listDfeReturnCandidates: vi.fn() }));
vi.mock('@/components/Table', () => ({ Table: () => <div data-testid="table" /> }));
vi.mock('@/contexts/TableContext', () => ({
  TableProvider: ({ children }: any) => <div>{children}</div>,
}));
vi.mock('@/components/HeaderGrid', () => ({
  HeaderGrid: ({ header, children }: any) => (
    <div>
      {header}
      {children}
    </div>
  ),
}));
vi.mock('@/components/DateInput', () => ({
  DateInput: ({ onChange }: any) => (
    <input data-testid="date" onChange={(event) => onChange(event.target.value)} />
  ),
}));

import DfeReturnLinking from './DfeReturnLinking';

const text = languageDfes.dfe.return;

const candidate = (uuid: string, code: string) => ({
  uuid,
  code,
  dt_sale: '2026-01-02',
  total: 100,
  nfe_number: null,
  client_name: 'Frigorífico X',
  type_label: 'Venda Animal',
});

const dfe = {
  uuid: 'dfe-1',
  chave: '3526CHAVEDFE',
  cpf_cnpj: '12.345.678/0001-90',
  razao_social: 'Frigorífico X Ltda',
  valor: 5000,
};

function okQuery(items: any[], suggestions: any[]) {
  return {
    data: {
      data: { items, pagination: { total: items.length } },
      context: { dfe, suggestions },
    },
    isError: false,
    error: null,
    isFetching: false,
    isLoading: false,
    isPending: false,
    refetch: vi.fn(),
  };
}

function setup() {
  render(
    <ChakraProvider value={system}>
      <MemoryRouter initialEntries={['/fiscal/dfes/dfe-1/retorno']}>
        <Routes>
          <Route path="/fiscal/dfes/:dfeUuid/retorno" element={<DfeReturnLinking />} />
        </Routes>
      </MemoryRouter>
    </ChakraProvider>
  );
}

describe('DfeReturnLinking — UT-000752 T-752-FE-03', () => {
  beforeEach(() => {
    h.paginatedFilter = undefined;
  });
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('cabeçalho vem de context.dfe (sem location.state) e consulta o endpoint novo pelo uuid do path', () => {
    h.query = okQuery([candidate('s1', 'V-1')], []);
    setup();

    expect(screen.getByText('Frigorífico X Ltda')).toBeTruthy();
    expect(screen.getByText('12.345.678/0001-90')).toBeTruthy();
    expect(screen.getByText('3526CHAVEDFE')).toBeTruthy();

    const args = h.gridQuery.mock.calls[0][0];
    expect(args.registrationId).toBe('dfe-1');
    expect(args.queryKey).toBe('dfe-return-candidates');
  });

  it('"Aceitar sugestão" marca os uuids sugeridos; 2 selecionados → finalizar-lote', () => {
    h.query = okQuery([], [candidate('s1', 'V-1'), candidate('s2', 'V-2')]);
    setup();

    expect(screen.getByText(text.suggestionsTitle)).toBeTruthy();
    const link = screen.getByText(text.linkAndFinishButton).closest('button') as HTMLButtonElement;
    expect(link.disabled).toBe(true);

    fireEvent.click(screen.getByText(text.acceptSuggestionButton));
    expect(link.disabled).toBe(false);

    fireEvent.click(link);
    expect(h.navigate).toHaveBeenCalledWith('/operacional/venda-animais/finalizar-lote?ids=s1,s2');
  });

  it('1 selecionado → /finalizar da venda', () => {
    h.query = okQuery([], [candidate('s1', 'V-1')]);
    setup();

    fireEvent.click(screen.getByText(text.acceptSuggestionButton));
    fireEvent.click(screen.getByText(text.linkAndFinishButton));

    expect(h.navigate).toHaveBeenCalledWith('/operacional/venda-animais/s1/finalizar');
  });

  it('422 → estado de erro com a mensagem da API e "Voltar" (sem grade)', () => {
    const error = new AxiosError('failed');
    error.response = {
      status: 422,
      data: { message: 'Esta DF-e não é de retorno.' },
      statusText: '',
      headers: {},
      config: {} as never,
    };
    h.query = {
      data: undefined,
      isError: true,
      error,
      isFetching: false,
      isLoading: false,
      isPending: false,
      refetch: vi.fn(),
    };
    setup();

    expect(screen.getByRole('alert').textContent).toContain('Esta DF-e não é de retorno.');
    expect(screen.queryByTestId('table')).toBeNull();
    fireEvent.click(screen.getAllByText(text.backButton).pop() as HTMLElement);
    expect(h.navigate).toHaveBeenCalledWith(-1);
  });

  it('filtros date/search vão para a query do servidor (sem filtro no cliente)', async () => {
    h.query = okQuery([candidate('s1', 'V-1'), candidate('s9', 'OUTRA')], []);
    setup();

    fireEvent.change(screen.getByTestId('date'), { target: { value: '2026-01-02' } });
    expect(h.handleFilterChange).toHaveBeenCalledWith({ date: '2026-01-02' });

    fireEvent.change(screen.getByPlaceholderText(text.filter.searchPlaceholder), {
      target: { value: 'abc' },
    });
    await waitFor(() => expect(h.handleFilterChange).toHaveBeenCalledWith({ search: 'abc' }));
  });
});
