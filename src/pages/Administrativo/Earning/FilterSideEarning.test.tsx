// @vitest-environment jsdom
// UT-000756 — FilterSideEarning: o drawer abre mostrando os valores
// APLICADOS (nunca vazios em mês/ano/tipo), "Limpar filtros" volta ao
// default do legado (mês anterior/ano/Folha Normal — NUNCA vazio) e
// `onSubmit` nunca aplica mês/ano/tipo vazios (fallback ao default). Mirror
// do padrão de teste de `FilterSideSolicitacao.test.tsx` (mesmo contrato B
// de filtro, 6 props).
import { ChakraProvider } from '@chakra-ui/react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

vi.mock('@/services/v2/CadastrosBase/Employee/employee-service', () => ({
  listEmployees: vi.fn(),
}));
vi.mock('@/services/v2/Functions/function-service', () => ({
  listFunctionOptions: vi.fn(),
}));

vi.mock('@/components/FilterSide', () => ({
  FilterSide: ({ isOpen, children }: any) =>
    isOpen ? <div data-testid="drawer">{children}</div> : null,
}));

vi.mock('@/components/Form/Select', () => ({
  // Expõe label, valor exibido e `noClearable` para a asserção — mantém o
  // suficiente de um Select real (sem a árvore do Chakra) para verificar
  // pré-preenchimento sem depender de `createListCollection`/portal.
  Select: ({ label, value, noClearable }: any) => (
    <div data-testid={`select-${label}`} data-noclearable={String(!!noClearable)}>
      {label}:{value?.label ?? ''}
    </div>
  ),
}));

vi.mock('@/components/Form/SelectAsyncPaginate', () => ({
  SelectAsyncPaginate: ({ label }: any) => <div data-testid={`async-${label}`}>{label}</div>,
}));

import { buildDefaultEarningFilter } from './earningTotals';
import { FilterSideEarning } from './FilterSideEarning';

const languageGB: any = {
  earnings: {
    earning: {
      list: {
        filter: {
          title: 'Filtrar Apurações',
          employee: 'Funcionário',
          employeePlaceholder: 'Buscar funcionário por nome...',
          function: 'Função',
          year: 'Ano',
          month: 'Mês',
          type: 'Tipo',
        },
      },
    },
  },
  defaltStrings: {
    clearAllFilters: 'Limpar tudo',
    cancel: 'Cancelar',
    applyFilters: 'Aplicar filtros',
  },
};

function setup(filter: any, isOpen = true) {
  const handlers = { onClose: vi.fn(), handleReset: vi.fn(), handleFilterChange: vi.fn() };
  const utils = render(
    <ChakraProvider value={system}>
      <FilterSideEarning
        isOpen={isOpen}
        onClose={handlers.onClose}
        handleReset={handlers.handleReset}
        handleFilterChange={handlers.handleFilterChange}
        filter={filter}
        languageGB={languageGB}
      />
    </ChakraProvider>
  );
  return { ...handlers, ...utils };
}

describe('FilterSideEarning — UT-000756', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 15)); // 15/mar/2026 → período default = fev/2026
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('abre mostrando o período APLICADO (mês anterior + Folha Normal), nunca vazio', () => {
    const defaults = buildDefaultEarningFilter();
    setup(defaults);

    expect(screen.getByTestId('select-Mês').textContent).toBe('Mês:02');
    expect(screen.getByTestId('select-Tipo').textContent).toBe('Tipo:Folha Normal');
    expect((screen.getByRole('spinbutton') as HTMLInputElement).value).toBe('2026');
  });

  it('Mês e Tipo são renderizados como não-limpáveis (noClearable)', () => {
    setup(buildDefaultEarningFilter());

    expect(screen.getByTestId('select-Mês').getAttribute('data-noclearable')).toBe('true');
    expect(screen.getByTestId('select-Tipo').getAttribute('data-noclearable')).toBe('true');
  });

  it('"Limpar filtros" volta ao default do legado (mês anterior/ano/Folha Normal) — NUNCA vazio', () => {
    // Simula o estado que o bug produzia: filtro salvo com período fora do
    // default atual (mirror de uma visita anterior/outro mês).
    setup({
      employee_uuid: null,
      function_uuid: null,
      year: '2020',
      month: { label: '07', value: 7 },
      type: { label: '13º Salário', value: 'D' },
    });

    fireEvent.click(screen.getByText('Limpar tudo'));

    expect(screen.getByTestId('select-Mês').textContent).toBe('Mês:02');
    expect(screen.getByTestId('select-Tipo').textContent).toBe('Tipo:Folha Normal');
    expect((screen.getByRole('spinbutton') as HTMLInputElement).value).toBe('2026');
  });

  it('onSubmit nunca aplica mês/ano/tipo vazios — cai no default mesmo partindo de um form sem período', async () => {
    const view = setup(undefined); // sem filtro aplicado ainda (pristine) — mês/ano/tipo nascem vazios
    const fallback = buildDefaultEarningFilter();

    // `handleSubmit` do RHF resolve a validação em microtasks — sem timers
    // reais no ar (fake timers fixam a data do sistema nesta suíte), basta
    // dar um `act` assíncrono para esvaziar a fila de microtasks pendente
    // (equivalente ao que `waitFor` faria com setTimeout real).
    await act(async () => {
      fireEvent.click(screen.getByText('Aplicar filtros'));
    });

    expect(view.handleFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        year: fallback.year,
        month: fallback.month,
        type: fallback.type,
      })
    );
    expect(view.onClose).toHaveBeenCalled();
  });
});
