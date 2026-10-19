// @vitest-environment jsdom
// UT-000796 r2 (L2/L3/L5/A5) — listagem de Mov. Caixa/Bancário: Valor com
// sinal, coluna Juros, rodapé de totais da PÁGINA, linha de Saldo Inicial
// somente leitura, "Tipo Cat." fora do filtro de linhas/badge e confirmação de
// cascata na exclusão. Mocks só nas fronteiras (serviço, router, permissões).
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
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
  useAuth: () => ({ activeFarmUuid: 'farm-1', user: { username: 'dev', user_id: 1 } }),
}));

const permissions = vi.hoisted(() => ({ granted: new Set<string>() }));
vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({
    can: (p: string) => permissions.granted.has(p),
    canAny: () => true,
    canAll: () => true,
  }),
}));
vi.mock('@/components/ui/toaster', () => ({
  toaster: { success: vi.fn(), error: vi.fn(), info: vi.fn(), create: vi.fn() },
}));

const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

const filterState = vi.hoisted(() => ({ filter: {} as Record<string, unknown> }));
vi.mock('@/hooks/usePaginatedQueryStorage', () => ({
  userPaginatedQuery: () => ({
    paginatedQuery: {
      pageIndex: 1,
      pageSize: 10,
      pagesCount: 1,
      totalRecords: 3,
      filter: filterState.filter,
    },
    handlePaginatedQuery: vi.fn(),
    handleFilterChange: vi.fn(),
    handleResetFilter: vi.fn(),
  }),
}));

vi.mock('@/services/v2/Movements/movement-service', () => ({
  listMovements: vi.fn(),
  deleteMovement: vi.fn(),
  toggleMovementFiscalDocument: vi.fn(),
}));
vi.mock('./FilterSideMovimento', () => ({ FilterSideMovimento: () => null }));
vi.mock('./HeaderTable', () => ({
  HeaderTable: (props: any) => <div data-testid="filters-applied">{props.filtersApplied}</div>,
}));

import { deleteMovement, listMovements } from '@/services/v2/Movements/movement-service';

import MovimentoList from './index';

function row(over: Record<string, any> = {}) {
  return {
    uuid: 'mov-1',
    code: 'MV-0001',
    date: '2026-10-01',
    type: 'E',
    type_category: 'E',
    account: { uuid: 'acc', bank: 'Banco', agency: '1', account: '2' },
    proprietary: { uuid: 'p', name: 'Prop' },
    value: '100.00',
    interest: '1.00',
    document: null,
    note: null,
    fiscal_document: false,
    generates_obligation: false,
    total_allocated: '100.00',
    created_at: '2026-10-01',
    updated_at: '2026-10-01',
    ...over,
  };
}

function mockList(items: any[], pageTotals: any = null) {
  (listMovements as any).mockResolvedValue({
    success: true,
    message: '',
    data: {
      items,
      pagination: {
        total: items.length,
        count: items.length,
        per_page: 10,
        current_page: 1,
        total_pages: 1,
      },
    },
    pageTotals,
  });
}

function renderList() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ChakraProvider value={system}>
        <MemoryRouter>
          <MovimentoList />
        </MemoryRouter>
      </ChakraProvider>
    </QueryClientProvider>
  );
}

const text = languagePtBr.BR.movements.movement;

beforeEach(() => {
  navigateMock.mockReset();
  (listMovements as any).mockReset();
  (deleteMovement as any).mockReset();
  permissions.granted = new Set(['movements_create', 'movements_delete', 'open-movements_view']);
  filterState.filter = {};
  window.localStorage.clear();
});
afterEach(() => cleanup());

function rowOf(code: string): HTMLElement {
  return screen.getByText(code).closest('tr') as HTMLElement;
}

async function openActions(code: string) {
  const r = rowOf(code);
  const trigger = within(r).getAllByRole('button').pop()!;
  fireEvent.click(trigger);
}

describe('listagem — Valor com sinal, Juros e rodapé (L2/L3)', () => {
  it('Saída aparece negativa; Entrada positiva; coluna Juros presente', async () => {
    mockList([
      row(),
      row({ uuid: 'mov-2', code: 'MV-0002', type: 'S', value: '30.25', interest: '2.50' }),
    ]);
    renderList();
    await screen.findByText('MV-0001');
    expect(screen.getByText(text.list.table.interest)).toBeTruthy();
    expect(rowOf('MV-0001').textContent).toMatch(/R\$\s*100,00/);
    expect(rowOf('MV-0001').textContent).not.toMatch(/-\s*R\$\s*100,00/);
    // Saída (S): valor 30,25 exibido NEGATIVO (e em `fg.error`).
    expect(rowOf('MV-0002').textContent).toMatch(/-\s*R\$\s*30,25/);
  });

  it('rodapé: juros e total líquido da PÁGINA (derivados quando a API não manda page_totals)', async () => {
    mockList([
      row({ interest: '1.00', value: '100.00' }),
      row({ uuid: 'mov-2', code: 'MV-0002', type: 'S', value: '30.25', interest: '2.50' }),
    ]);
    const { container } = renderList();
    await screen.findByText('MV-0001');
    const footer = container.querySelector('tfoot')!;
    expect(footer).toBeTruthy();
    expect(footer.textContent).toContain(text.list.footer.pageTotal);
    expect(footer.textContent).toMatch(/3,50/); // juros 1,00 + 2,50
    expect(footer.textContent).toMatch(/69,75/); // 100,00 - 30,25
  });

  it('rodapé usa meta.page_totals da API quando presente', async () => {
    mockList([row()], { interest: '9.90', net_value: '-123.45' });
    const { container } = renderList();
    await screen.findByText('MV-0001');
    const footer = container.querySelector('tfoot')!;
    expect(footer.textContent).toMatch(/9,90/);
    expect(footer.textContent).toMatch(/123,45/);
  });

  it('sem rodapé quando a página está vazia', async () => {
    mockList([]);
    const { container } = renderList();
    await waitFor(() => expect(listMovements).toHaveBeenCalled());
    expect(container.querySelector('tfoot')).toBeNull();
  });
});

describe('listagem — linha de Saldo Inicial somente leitura (A5)', () => {
  it('badge "Saldo Inicial" e só "Ver em Saldo Inicial" (sem Editar/Editar Rateio/Excluir)', async () => {
    mockList([row({ type_category: 'I', code: 'MV-OB' })]);
    renderList();
    await screen.findByText('MV-OB');
    expect(
      within(rowOf('MV-OB')).getByText(text.form.typeCategoryOptions.initialBalance)
    ).toBeTruthy();
    await openActions('MV-OB');
    expect(await screen.findByText(text.list.actions.viewOpeningBalance)).toBeTruthy();
    expect(screen.queryByText(text.list.actions.edit)).toBeNull();
    expect(screen.queryByText(text.list.actions.allocation)).toBeNull();
    expect(screen.queryByText(text.list.actions.delete)).toBeNull();
    fireEvent.click(screen.getByText(text.list.actions.viewOpeningBalance));
    expect(navigateMock).toHaveBeenCalledWith('/cadastros-base/saldo-inicial');
  });

  it('is_opening_balance=true da API também trava', async () => {
    mockList([row({ is_opening_balance: true, code: 'MV-OB' })]);
    renderList();
    await screen.findByText('MV-OB');
    await openActions('MV-OB');
    expect(await screen.findByText(text.list.actions.viewOpeningBalance)).toBeTruthy();
    expect(screen.queryByText(text.list.actions.edit)).toBeNull();
  });

  it('sem open-movements_view a célula de ações fica vazia', async () => {
    permissions.granted.delete('open-movements_view');
    mockList([row({ type_category: 'I', code: 'MV-OB' })]);
    renderList();
    await screen.findByText('MV-OB');
    expect(within(rowOf('MV-OB')).queryAllByRole('button')).toHaveLength(0);
  });

  it('linha normal mantém Editar, Editar Rateio e Excluir', async () => {
    mockList([row()]);
    renderList();
    await screen.findByText('MV-0001');
    await openActions('MV-0001');
    expect(await screen.findByText(text.list.actions.edit)).toBeTruthy();
    expect(screen.getByText(text.list.actions.allocation)).toBeTruthy();
    expect(screen.getByText(text.list.actions.delete)).toBeTruthy();
  });
});

describe('listagem — filtro Tipo Cat. não filtra linhas (L5)', () => {
  it('category_type não vira type_category na API e não conta no badge de filtros', async () => {
    filterState.filter = { category_type: 'F', type: 'E', category_label: 'x' };
    mockList([row()]);
    renderList();
    await waitFor(() => expect(listMovements).toHaveBeenCalled());
    const params = (listMovements as any).mock.calls[0][0];
    expect(params.type_category).toBeUndefined();
    expect(params.category_type).toBeUndefined();
    expect(params.type).toBe('E');
    // só `type` conta (category_type e *_label ficam de fora)
    expect(screen.getByTestId('filters-applied').textContent).toBe('1');
  });
});

describe('listagem — exclusão com cascata de títulos', () => {
  it('movimento com títulos gerados mostra o aviso de cascata e o botão específico', async () => {
    mockList([row({ generated_obligations_count: 3 })]);
    renderList();
    await screen.findByText('MV-0001');
    await openActions('MV-0001');
    fireEvent.click(await screen.findByText(text.list.actions.delete));
    expect(await screen.findByText(/gerou 3 título\(s\)/)).toBeTruthy();
    expect(screen.getByText(text.list.deleteConfirm.cascadeConfirm)).toBeTruthy();
  });

  it('sem títulos gerados usa o diálogo padrão (sem aviso de cascata)', async () => {
    mockList([row()]);
    renderList();
    await screen.findByText('MV-0001');
    await openActions('MV-0001');
    fireEvent.click(await screen.findByText(text.list.actions.delete));
    await waitFor(() => expect(screen.getByText(/MV-0001/, { selector: 'span' })).toBeTruthy());
    expect(screen.queryByText(/título\(s\)/)).toBeNull();
  });
});
