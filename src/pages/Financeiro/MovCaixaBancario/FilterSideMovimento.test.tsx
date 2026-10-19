// @vitest-environment jsdom
// UT-000796 r2 (L5/L6) — drawer de filtro: o "Tipo Cat." NÃO filtra linhas, só
// configura o lookup de Categoria (E:2, S:1, T:3, F:2) e habilita/limpa o
// select Categoria. A limpeza acontece só por interação do usuário; a
// re-hidratação ao abrir o drawer não limpa nada.
import { useState } from 'react';

import { ChakraProvider } from '@chakra-ui/react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { languagePtBr } from '@/constants/languages/languagePtBr';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ activeFarmUuid: 'farm-1' }) }));
vi.mock('@/pages/CadastrosBase/ContasBancarias/useAccounts', () => ({
  useProprietariesList: () => ({ data: [], isLoading: false }),
}));
vi.mock('@/services/v2/CadastrosBase/Account/account-service', () => ({ listAccounts: vi.fn() }));
vi.mock('@/services/v2/FinancialCategories/financial-category-service', () => ({
  listFinancialCategoryOptions: vi.fn(),
}));
vi.mock('@/services/v2/Harvests/harvest-service', () => ({ listHarvestOptions: vi.fn() }));

vi.mock('@/components/FilterSide', () => ({
  FilterSide: (props: any) => (props.isOpen ? <div>{props.children}</div> : null),
}));
vi.mock('@/components/DateInput', () => ({ DateInput: () => null }));
vi.mock('@/components/Form/MoneyInput', () => ({ MoneyInput: () => null }));
vi.mock('@/components/Form/SelectCombobox', () => ({ SelectCombobox: () => null }));

vi.mock('@/components/Form/Select', () => ({
  Select: (props: any) => (
    <select
      data-testid={`select-${props.name}`}
      data-placeholder={props.placeholder ?? ''}
      value={props.value?.value ?? ''}
      onChange={(e) =>
        props.onChange(props.options.find((o: any) => o.value === e.target.value) ?? null)
      }
    >
      <option value="" />
      {props.options.map((o: any) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  ),
}));

// Expõe isDisabled, cacheUniqs e o resultado de `findParams('x')`.
vi.mock('@/components/Form/SelectAsyncPaginate', () => ({
  SelectAsyncPaginate: (props: any) => (
    <div
      data-testid={`sap-${props.name}`}
      data-disabled={String(!!props.isDisabled)}
      data-value={props.value?.value ?? ''}
      data-uniqs={JSON.stringify(props.cacheUniqs ?? null)}
      data-find={JSON.stringify(props.findParams ? props.findParams('x') : null)}
    >
      <button
        type="button"
        data-testid={`pick-${props.name}`}
        onClick={() => props.onChange({ label: `L-${props.name}`, value: `V-${props.name}` })}
      />
    </div>
  ),
}));

import { FilterSideMovimento } from './FilterSideMovimento';

const handleFilterChange = vi.fn();
const handleReset = vi.fn();

function Host({
  initialFilter = {},
  startOpen = true,
}: {
  initialFilter?: any;
  startOpen?: boolean;
}) {
  const [open, setOpen] = useState(startOpen);
  return (
    <ChakraProvider value={system}>
      <button type="button" data-testid="toggle" onClick={() => setOpen((v) => !v)} />
      <FilterSideMovimento
        isOpen={open}
        onClose={() => setOpen(false)}
        handleFilterChange={handleFilterChange}
        handleReset={handleReset}
        filter={initialFilter}
        languageGB={languagePtBr.BR}
      />
    </ChakraProvider>
  );
}

const pickType = (v: string) =>
  fireEvent.change(screen.getByTestId('select-category_type'), { target: { value: v } });
const cat = () => screen.getByTestId('sap-category_uuid');
const find = () => JSON.parse(cat().getAttribute('data-find')!);

beforeEach(() => {
  handleFilterChange.mockReset();
  handleReset.mockReset();
});
afterEach(() => cleanup());

describe('FilterSideMovimento — Tipo Cat. (L5/L6)', () => {
  it('oferece as 4 opções do legado (E, S, Trans. Interna, Financiamento/Empréstimo), sem Saldo Inicial', () => {
    render(<Host />);
    const values = Array.from(
      (screen.getByTestId('select-category_type') as HTMLSelectElement).options
    )
      .map((o) => o.value)
      .filter(Boolean);
    expect(values).toEqual(['E', 'S', 'T', 'F']);
    const labels = Array.from(
      (screen.getByTestId('select-category_type') as HTMLSelectElement).options
    ).map((o) => o.textContent);
    expect(labels).toContain('Trans. Interna');
    expect(labels).toContain('Financiamento/Empréstimo');
    expect(labels).not.toContain('Saldo Inicial');
  });

  it('Categoria nasce desabilitada sem Tipo Cat. e habilita ao escolher', () => {
    render(<Host />);
    expect(cat().getAttribute('data-disabled')).toBe('true');
    pickType('E');
    expect(cat().getAttribute('data-disabled')).toBe('false');
  });

  it.each([
    ['E', { type_id: 2, cost_center_scoped: 'true' }],
    ['S', { type_id: 1, cost_center_scoped: 'true' }],
    ['F', { type_id: 2, cost_center_scoped: 'true' }],
    ['T', { bank_movement_scoped: 'true', class: 2, is_enabled: 'true' }],
  ])('Tipo Cat. %s: findParams e cacheUniqs da Categoria acompanham o tipo', (type, params) => {
    render(<Host />);
    pickType(type);
    expect(find()).toEqual({ search: 'x', ...params });
    expect(JSON.parse(cat().getAttribute('data-uniqs')!)).toEqual([type]);
  });

  it('escolher/trocar o Tipo Cat. limpa a Categoria (só por interação)', () => {
    render(<Host />);
    pickType('E');
    fireEvent.click(screen.getByTestId('pick-category_uuid'));
    expect(cat().getAttribute('data-value')).toBe('V-category_uuid');
    pickType('S');
    expect(cat().getAttribute('data-value')).toBe('');
  });

  it('re-hidratação ao abrir com filtro persistido NÃO limpa a Categoria', () => {
    render(
      <Host
        startOpen={false}
        initialFilter={{
          category_type: 'F',
          category_uuid: 'cat-1',
          category_label: '1 — Cat',
        }}
      />
    );
    fireEvent.click(screen.getByTestId('toggle')); // abre
    expect((screen.getByTestId('select-category_type') as HTMLSelectElement).value).toBe('F');
    expect(cat().getAttribute('data-value')).toBe('cat-1');
    expect(cat().getAttribute('data-disabled')).toBe('false');
  });

  it('filtro antigo (Categoria sem Tipo Cat.) mantém Categoria habilitada, como o legado com $category', () => {
    render(<Host initialFilter={{ category_uuid: 'cat-1', category_label: 'x' }} />);
    expect(cat().getAttribute('data-disabled')).toBe('false');
    expect(cat().getAttribute('data-value')).toBe('cat-1');
  });

  it('Aplicar persiste category_type junto com a Categoria', () => {
    render(<Host />);
    pickType('F');
    fireEvent.click(screen.getByTestId('pick-category_uuid'));
    fireEvent.click(screen.getByText(languagePtBr.BR.defaltStrings.applyFilters));
    return vi
      .waitFor(() => expect(handleFilterChange).toHaveBeenCalledTimes(1))
      .then(() => {
        expect(handleFilterChange.mock.calls[0][0]).toMatchObject({
          category_type: 'F',
          category_uuid: 'V-category_uuid',
        });
      });
  });
});
