// @vitest-environment jsdom
// UT-000719 / FE-T11 (GAP-FE-719-V3-01, S-719-08 ACTION) — lista de Venda de Animais: menu "Excluir"
// (gate `mov_sale_delete`) -> DeleteConfirmDialog -> `deleteMovementSale(uuid)` -> invalida a lista
// `[queryKey.movementSales.movementSales]` e mostra o toast `deletedToast`. Cancelar não chama a API.
// O efeito servidor (devolver animais a ACTIVE, remover financeiro, C-719-14) é provado em ARQ-API-719 e
// no E2E::E11; aqui prova-se só o disparo pela UI.
import { useContext } from 'react';

import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { flexRender } from '@tanstack/react-table';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { TableContext } from '@/contexts/TableContext';

import { languages } from '@/constants/languages';
import { queryKey } from '@/constants/query-key';

import { SALE_UUID } from './finish-fixtures';

const h = vi.hoisted(() => ({
  can: vi.fn(),
  deleteMovementSale: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

const SALE = {
  uuid: SALE_UUID,
  code: '1001',
  status: 'P',
  status_label: 'Pendente',
  type_sale: 2,
  type_sale_label: 'Abate',
  dt_sale: '2026-09-10',
  total: 0,
  created_at: '2026-09-10T10:00:00Z',
  has_financial: false,
  nfe: null,
  client: { uuid: 'client-1', name: 'Cliente Teste' },
};

vi.mock('@/hooks/useLanguage', async () => {
  const { languages: langs } = await import('@/constants/languages');
  return { useLanguage: () => ({ languageGB: langs.BR }) };
});
vi.mock('@/hooks/usePermissions', () => ({ usePermissions: () => ({ can: h.can }) }));
vi.mock('@/hooks/usePaginatedQueryStorage', () => {
  const state = {
    paginatedQuery: { page: 1, pageSize: 10, filter: {} },
    handlePaginatedQuery: vi.fn(),
    handleFilterChange: vi.fn(),
    handleResetFilter: vi.fn(),
  };
  return { userPaginatedQuery: () => state };
});
vi.mock('@/components/ui/toaster', () => ({
  toaster: { success: h.toastSuccess, error: h.toastError, warning: vi.fn(), create: vi.fn() },
}));
vi.mock('@/services/v2/MovementSales/movement-sale-service', () => ({
  deleteMovementSale: h.deleteMovementSale,
  downloadMovementSaleReport: vi.fn(),
  downloadMovementSaleSisbovRearingReport: vi.fn(),
  downloadMovementSaleSisbovSlaughterReport: vi.fn(),
}));
vi.mock('../useMovementSales', () => ({
  useMovementSalesList: () => ({
    data: { data: { items: [SALE] } },
    isLoading: false,
    isPending: false,
    isError: false,
    isFetching: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

// Casca de layout/menu: a grid real (TableProvider + colunas de index.tsx) é mantida; só a renderização
// visual é simplificada para expor o menu de ações de cada linha.
vi.mock('@/components/ContainerGrid', () => ({
  ContainerGrid: ({ children }: any) => <div>{children}</div>,
}));
vi.mock('@/components/HeaderGrid', () => ({
  HeaderGrid: ({ children }: any) => <div>{children}</div>,
}));
vi.mock('@/components/Table', () => ({
  Table: () => {
    const ctx = useContext(TableContext);
    return (
      <div>
        {ctx?.table.getRowModel().rows.map((row) => (
          <div key={row.id} data-testid="row">
            {row.getVisibleCells().map((cell) => (
              <div key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</div>
            ))}
          </div>
        ))}
      </div>
    );
  },
}));
vi.mock('../HeaderTable', () => ({ HeaderTable: () => <div /> }));
vi.mock('../FilterSideVendaAnimais', () => ({ FilterSideVendaAnimais: () => null }));
vi.mock('../MovementSaleDocumentsModal', () => ({ MovementSaleDocumentsModal: () => null }));
vi.mock('../MovementSaleEmitNfeDialog', () => ({ MovementSaleEmitNfeDialog: () => null }));
vi.mock('@/components/Action', () => {
  const Item = ({ children, onClick, disabled }: any) => (
    <button type="button" role="menuitem" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
  const Actions = ({ children }: any) => <div role="menu">{children}</div>;
  Actions.Item = Item;
  Actions.Separator = () => <hr />;
  return { Actions };
});
vi.mock('@/components/TooLtip', () => ({
  Tooltip: ({ children }: any) => <>{children}</>,
}));

import VendaAnimaisList from '../index';

const text = languages.BR.movementSales.movementSale;
const DELETE_LABEL = text.list.actions.delete;
const CONFIRM_LABEL = languages.BR.admin.common.deleteDialog.confirm;
const CANCEL_LABEL = languages.BR.defaltStrings.cancel;

function renderList() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
  render(
    <QueryClientProvider client={queryClient}>
      <ChakraProvider value={system}>
        <MemoryRouter initialEntries={['/operacional/venda-animais']}>
          <VendaAnimaisList />
        </MemoryRouter>
      </ChakraProvider>
    </QueryClientProvider>
  );
  return { invalidate };
}

async function openConfirmDialog() {
  fireEvent.click(await screen.findByRole('menuitem', { name: DELETE_LABEL }));
  return screen.findByRole('dialog');
}

beforeEach(() => {
  h.can.mockImplementation((p: string) => p === 'mov_sale_delete' || p === 'mov_sale_view');
  h.deleteMovementSale.mockResolvedValue(undefined);
});

afterEach(() => {
  cleanup();
  h.can.mockReset();
  h.deleteMovementSale.mockReset();
  h.toastSuccess.mockReset();
  h.toastError.mockReset();
});

describe('Excluir venda', () => {
  it('confirmar no DeleteConfirmDialog chama deleteMovementSale(uuid) uma vez, invalida [queryKey.movementSales.movementSales] e mostra toast deletedToast; cancelar nao chama', async () => {
    const { invalidate } = renderList();

    // 1) cancelar: abre o diálogo, cancela e nada é enviado à API
    const first = await openConfirmDialog();
    fireEvent.click(within(first).getByRole('button', { name: CANCEL_LABEL }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(h.deleteMovementSale).not.toHaveBeenCalled();
    expect(invalidate).not.toHaveBeenCalled();
    expect(h.toastSuccess).not.toHaveBeenCalled();

    // 2) confirmar: DELETE por uuid (uma vez), invalida a lista e exibe o toast de sucesso
    const dialog = await openConfirmDialog();
    fireEvent.click(within(dialog).getByRole('button', { name: CONFIRM_LABEL }));

    await waitFor(() => expect(h.deleteMovementSale).toHaveBeenCalledTimes(1));
    expect(h.deleteMovementSale.mock.calls[0][0]).toBe(SALE_UUID);
    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({
        queryKey: [queryKey.movementSales.movementSales],
      })
    );
    await waitFor(() =>
      expect(h.toastSuccess).toHaveBeenCalledWith(
        expect.objectContaining({ description: text.list.deletedToast })
      )
    );
    expect(h.toastError).not.toHaveBeenCalled();
  });

  it('sem mov_sale_delete o item Excluir nao existe na linha', async () => {
    h.can.mockImplementation((p: string) => p === 'mov_sale_view');
    renderList();
    await screen.findByTestId('row');
    expect(screen.queryByRole('menuitem', { name: DELETE_LABEL })).toBeNull();
  });
});
