// @vitest-environment jsdom
// Execução 081, T-081-FE-01 — FilterSideSolicitacao: sem as props novas se
// comporta como antes (9 campos); `visibleFields` restringe; placeholder do
// legado; reidratação em `[isOpen]` (contrato B, 6 props).
import { ChakraProvider } from '@chakra-ui/react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { languageRequestPurchases } from '@/constants/languages/languagePtBr/languageRequestPurchases';

vi.mock('@/services/v2/Farms/farm-admin-service', () => ({ listFarms: vi.fn() }));
vi.mock('@/services/v2/Users/user-service', () => ({ listUsers: vi.fn() }));

vi.mock('@/components/FilterSide', () => ({
  FilterSide: ({ isOpen, children }: any) =>
    isOpen ? <div data-testid="drawer">{children}</div> : null,
}));

vi.mock('@/components/Form/Select', () => ({
  Select: ({ label }: any) => <div data-testid={`select-${label}`}>{label}</div>,
}));

vi.mock('@/components/Form/SelectAsyncPaginate', () => ({
  SelectAsyncPaginate: ({ label }: any) => <div data-testid={`async-${label}`}>{label}</div>,
}));

vi.mock('@/components/DateInput', () => ({
  DateInput: () => <input data-testid="date" />,
}));

import { FilterSideSolicitacao } from './FilterSideSolicitacao';

const languageGB: any = {
  requestPurchases: languageRequestPurchases,
  defaltStrings: {
    clearAllFilters: 'Limpar tudo',
    cancel: 'Cancelar',
    applyFilters: 'Aplicar filtros',
  },
};

function setup(props: Record<string, unknown> = {}, isOpen = true, filter: any = undefined) {
  const handlers = { onClose: vi.fn(), handleReset: vi.fn(), handleFilterChange: vi.fn() };
  const element = (open: boolean, currentFilter: any) => (
    <ChakraProvider value={system}>
      <FilterSideSolicitacao
        isOpen={open}
        onClose={handlers.onClose}
        handleReset={handlers.handleReset}
        handleFilterChange={handlers.handleFilterChange}
        filter={currentFilter}
        languageGB={languageGB}
        {...props}
      />
    </ChakraProvider>
  );
  const utils = render(element(isOpen, filter));
  return {
    ...handlers,
    rerender: (open: boolean, currentFilter: any) => utils.rerender(element(open, currentFilter)),
  };
}

describe('FilterSideSolicitacao — execução 081, T-081-FE-01', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('sem as props novas: mostra os 9 campos como antes', () => {
    setup();
    expect(screen.getByPlaceholderText('Pesquisar por descrição/chamado/código')).toBeTruthy();
    expect(screen.getByTestId('select-Tipo')).toBeTruthy();
    expect(screen.getByTestId('select-Status')).toBeTruthy();
    expect(screen.getAllByTestId('date').length).toBe(2);
    expect(screen.getByTestId('async-Fazenda')).toBeTruthy();
    expect(screen.getByTestId('async-Solicitante')).toBeTruthy();
    expect(screen.getByTestId('select-Prioridade')).toBeTruthy();
    expect(screen.getByTestId('async-Responsável Atual')).toBeTruthy();
  });

  it('visibleFields restringe o painel (Rejeitados: busca, tipo e datas)', () => {
    setup({ visibleFields: ['search', 'type', 'date_from', 'date_to'] });
    expect(screen.getByPlaceholderText('Pesquisar por descrição/chamado/código')).toBeTruthy();
    expect(screen.getByTestId('select-Tipo')).toBeTruthy();
    expect(screen.getAllByTestId('date').length).toBe(2);
    expect(screen.queryByTestId('select-Status')).toBeNull();
    expect(screen.queryByTestId('async-Fazenda')).toBeNull();
    expect(screen.queryByTestId('async-Solicitante')).toBeNull();
    expect(screen.queryByTestId('select-Prioridade')).toBeNull();
    expect(screen.queryByTestId('async-Responsável Atual')).toBeNull();
  });

  it('reidrata a busca com o filtro aplicado ao reabrir (deps [isOpen])', () => {
    const view = setup({}, true, { search: 'compra 123' });
    const input = screen.getByPlaceholderText(
      'Pesquisar por descrição/chamado/código'
    ) as HTMLInputElement;
    expect(input.value).toBe('compra 123');

    // usuário digita algo que NÃO foi aplicado e fecha
    fireEvent.change(input, { target: { value: 'rascunho' } });
    view.rerender(false, { search: 'compra 123' });
    view.rerender(true, { search: 'compra 123' });

    const reopened = screen.getByPlaceholderText(
      'Pesquisar por descrição/chamado/código'
    ) as HTMLInputElement;
    expect(reopened.value).toBe('compra 123');
  });

  it('aplicar chama handleFilterChange com a busca aparada e fecha', async () => {
    const view = setup({ visibleFields: ['search'] });
    const input = screen.getByPlaceholderText('Pesquisar por descrição/chamado/código');
    fireEvent.change(input, { target: { value: '  ABC  ' } });
    fireEvent.click(screen.getByText('Aplicar filtros'));
    await waitFor(() =>
      expect(view.handleFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'ABC' })
      )
    );
    expect(view.onClose).toHaveBeenCalled();
  });
});
