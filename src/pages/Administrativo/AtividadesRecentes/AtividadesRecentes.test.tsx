// @vitest-environment jsdom
// UT-000690 / TASK-092-FE-02 — T-FE-02.01/02/03/07: tela, estados, filtro e gate.

import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { RequirePermission } from '@/components/RequirePermission';

import { languagePtBr } from '@/constants/languages/languagePtBr';

const listMock = vi.fn();
const typesMock = vi.fn();
let canPermission = true;

vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({ languageInUse: 'BR', languageGB: languagePtBr.BR }),
}));
vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({
    can: () => canPermission,
    canAny: () => canPermission,
    canAll: () => canPermission,
    hasRole: () => false,
  }),
}));
vi.mock('@/components/AccessDenied', () => ({
  AccessDenied: () => <div data-testid="access-denied">negado</div>,
}));
vi.mock('@/hooks/useActivateFarm', () => ({ useActivateFarm: () => ({ mutateAsync: vi.fn() }) }));
vi.mock('@/services/v2/RecentActivities/recent-activity-service', () => ({
  listRecentActivities: (...a: unknown[]) => listMock(...a),
  listRecentActivityTypes: (...a: unknown[]) => typesMock(...a),
}));
vi.mock('@/components/FilterSide', () => ({
  FilterSide: ({ isOpen, children }: any) =>
    isOpen ? <div data-testid="drawer">{children}</div> : null,
}));
vi.mock('@/components/Form/Select', () => ({
  Select: ({ options, onChange, value }: any) => (
    <div>
      <span data-testid="select-value">{(value ?? []).map((o: any) => o.value).join(',')}</span>
      <button type="button" onClick={() => onChange([options[0]])}>
        escolher-primeiro
      </button>
    </div>
  ),
}));
vi.mock('@/components/DateInput', () => ({
  DateInput: ({ value, onChange }: any) => (
    <input
      data-testid="date"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
    />
  ),
}));

import { FilterSideAtividadesRecentes } from './FilterSideAtividadesRecentes';

import RecentActivitiesList from './index';

const languageGB: any = languagePtBr.BR;

function page(items: any[], total = items.length) {
  return {
    success: true,
    message: '',
    data: {
      items,
      pagination: { total, count: items.length, per_page: 10, current_page: 1, total_pages: 1 },
    },
  };
}

const rows = [
  {
    type: 'death_animal',
    type_label: 'Mortes',
    uuid: 'a1',
    created_at: '2026-10-05T15:30:00.000Z',
    farm: { uuid: 'f1', name: 'Fazenda Boa Vista' },
    api_path: '/api/v1/death-animals/a1',
    spa_path: '/operacional/mortes/a1/detalhe',
    status: {
      source: 'domain',
      code: '3',
      label: 'Concluída',
      color: '#038F59',
      at: null,
    },
  },
  {
    type: 'animal_batch_transfer',
    type_label: 'Transferência',
    uuid: 'a2',
    created_at: '2026-10-04T10:00:00.000Z',
    farm: { uuid: 'f2', name: 'Fazenda Segunda' },
    api_path: '/api/v1/batch-transfers/a2',
    spa_path: null,
  },
  {
    type: 'tipo_futuro',
    type_label: 'Rótulo da API',
    uuid: 'a3',
    created_at: '2026-10-03T10:00:00.000Z',
    farm: { uuid: 'f1', name: 'Fazenda Boa Vista' },
    api_path: '/api/v1/x/a3',
    spa_path: '/x/a3',
  },
];

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ChakraProvider value={system}>
        <MemoryRouter>
          <RecentActivitiesList />
        </MemoryRouter>
      </ChakraProvider>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  canPermission = true;
  localStorage.clear();
  typesMock.mockResolvedValue([
    { value: 'death_animal', label: 'Mortes' },
    { value: 'weighing', label: 'Pesagens' },
  ]);
});
afterEach(() => {
  cleanup();
  listMock.mockReset();
  typesMock.mockReset();
});

describe('RecentActivitiesList', () => {
  it('T-FE-02.01 — renderiza as 3 colunas, label i18n com fallback e ações', async () => {
    listMock.mockResolvedValue(page(rows));
    renderPage();

    await waitFor(() => expect(screen.getAllByText('Fazenda Boa Vista').length).toBe(2));
    expect(screen.getByText('Mortes')).toBeTruthy();
    expect(screen.getByText('Transferência animal/lote')).toBeTruthy();
    // tipo desconhecido → label da API
    expect(screen.getByText('Rótulo da API')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'Abrir' }).length).toBe(3);
    // spa_path null → desabilitado
    const disabled = screen
      .getAllByRole('button', { name: 'Abrir' })
      .filter((b) => (b as HTMLButtonElement).disabled);
    expect(disabled.length).toBe(1);
    expect(screen.getByText('Tipo')).toBeTruthy();
    expect(screen.getByText('Data')).toBeTruthy();
    // coluna Status (D-092-13): domínio em badge; sem status → "—"
    expect(screen.getByText('Status')).toBeTruthy();
    expect(screen.getByText('Concluída')).toBeTruthy();
    expect(screen.getAllByText('—').length).toBe(2);
    expect(screen.getByText('Fazenda')).toBeTruthy();
  });

  it('T-FE-02.02 — estado vazio (sem filtro)', async () => {
    listMock.mockResolvedValue(page([]));
    renderPage();
    await waitFor(() =>
      expect(
        screen.getByText(languageGB.recentActivities.recentActivity.list.emptyState.titleEmpty)
      ).toBeTruthy()
    );
  });

  it('T-FE-02.02 — erro com retry', async () => {
    listMock.mockRejectedValueOnce(new Error('boom'));
    renderPage();
    const retry = await screen.findByRole('button', { name: /tentar novamente|retry/i });
    listMock.mockResolvedValue(page(rows));
    fireEvent.click(retry);
    await waitFor(() => expect(screen.getAllByText('Fazenda Boa Vista').length).toBe(2));
  });
});

describe('FilterSideAtividadesRecentes', () => {
  function setup(filter?: any, isOpen = true) {
    const handlers = { onClose: vi.fn(), handleReset: vi.fn(), handleFilterChange: vi.fn() };
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const element = (open: boolean, current?: any) => (
      <QueryClientProvider client={queryClient}>
        <ChakraProvider value={system}>
          <FilterSideAtividadesRecentes
            isOpen={open}
            onClose={handlers.onClose}
            handleReset={handlers.handleReset}
            handleFilterChange={handlers.handleFilterChange}
            filter={current}
            languageGB={languageGB}
          />
        </ChakraProvider>
      </QueryClientProvider>
    );
    const utils = render(element(isOpen, filter));
    return { ...utils, handlers, element };
  }

  it('T-FE-02.03 — aplicar envia types/start_date/end_date e fecha', async () => {
    const { handlers } = setup();
    await screen.findByText('escolher-primeiro');
    await waitFor(() => expect(typesMock).toHaveBeenCalled());
    fireEvent.click(screen.getByText('escolher-primeiro'));
    const [start, end] = screen.getAllByTestId('date');
    fireEvent.change(start, { target: { value: '2026-10-01' } });
    fireEvent.change(end, { target: { value: '2026-10-05' } });
    fireEvent.click(screen.getByRole('button', { name: languageGB.defaltStrings.applyFilters }));

    await waitFor(() => expect(handlers.handleFilterChange).toHaveBeenCalled());
    expect(handlers.handleFilterChange).toHaveBeenCalledWith({
      types: ['death_animal'],
      start_date: '2026-10-01',
      end_date: '2026-10-05',
    });
    expect(handlers.onClose).toHaveBeenCalled();
  });

  it('período inválido (end < start) bloqueia o submit e mostra a mensagem', async () => {
    const { handlers } = setup();
    const [start, end] = screen.getAllByTestId('date');
    fireEvent.change(start, { target: { value: '2026-10-05' } });
    fireEvent.change(end, { target: { value: '2026-10-01' } });
    fireEvent.click(screen.getByRole('button', { name: languageGB.defaltStrings.applyFilters }));

    await screen.findByText(languageGB.recentActivities.recentActivity.validation.endBeforeStart);
    expect(handlers.handleFilterChange).not.toHaveBeenCalled();
  });

  it('T-FE-02.03 — re-hidrata o filtro aplicado ao reabrir; limpar não fecha', async () => {
    const filter = { types: ['death_animal'], start_date: '2026-10-01', end_date: '2026-10-05' };
    const { handlers, rerender, element } = setup(filter, false);
    rerender(element(true, filter));

    await waitFor(() =>
      expect((screen.getAllByTestId('date')[0] as HTMLInputElement).value).toBe('2026-10-01')
    );
    expect((screen.getAllByTestId('date')[1] as HTMLInputElement).value).toBe('2026-10-05');
    await waitFor(() =>
      expect(screen.getByTestId('select-value').textContent).toBe('death_animal')
    );

    fireEvent.click(screen.getByRole('button', { name: languageGB.defaltStrings.clearAllFilters }));
    expect(handlers.handleReset).toHaveBeenCalledTimes(1);
    expect(handlers.onClose).not.toHaveBeenCalled();
    await waitFor(() =>
      expect((screen.getAllByTestId('date')[0] as HTMLInputElement).value).toBe('')
    );
  });
});

describe('gate recent-activities_view', () => {
  it('T-FE-02.07 — sem permissão → AccessDenied; com permissão → conteúdo', () => {
    canPermission = false;
    const { rerender } = render(
      <RequirePermission permission="recent-activities_view">
        <div data-testid="conteudo" />
      </RequirePermission>
    );
    expect(screen.getByTestId('access-denied')).toBeTruthy();
    expect(screen.queryByTestId('conteudo')).toBeNull();

    canPermission = true;
    rerender(
      <RequirePermission permission="recent-activities_view">
        <div data-testid="conteudo" />
      </RequirePermission>
    );
    expect(screen.getByTestId('conteudo')).toBeTruthy();
  });
});
