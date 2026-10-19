// @vitest-environment jsdom
// 088 D3-FE-T2 — cabeçalho financeiro: entrada só visível/limpa conforme
// "Possui Entrada?" (Sim/Não), defaults e limites de digitação.
import { useState } from 'react';

import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { languagePtBr } from '@/constants/languages/languagePtBr';

const listProprietaryOptions = vi.fn();
vi.mock('@/services/v2/CadastrosBase/Proprietary/proprietary-service', () => ({
  listProprietaryOptions: (...a: unknown[]) => listProprietaryOptions(...a),
}));
vi.mock('@/services/v2/BaseRegistrations/typeTitles-service', () => ({
  listTypeTitleOptions: vi.fn(),
}));
vi.mock('@/components/Form/SelectAsyncPaginate', () => ({
  SelectAsyncPaginate: (p: any) => (
    <div>
      <span data-testid="type-title-value">{p.value?.label ?? ''}</span>
      <button type="button" onClick={() => p.onChange({ label: 'Duplicata', value: 'tt-1' })}>
        pick-type-title
      </button>
    </div>
  ),
}));
vi.mock('@/components/Form/Select', () => ({
  Select: (p: any) => (
    <select
      aria-label={p.label}
      data-testid={`select-${p.name}`}
      value={p.options.findIndex((o: any) => o.value === p.value?.value)}
      onChange={(e) => p.onChange(p.options[Number(e.target.value)] ?? null)}
    >
      <option value={-1}>{p.placeholder ?? ''}</option>
      {p.options.map((o: any, i: number) => (
        <option key={String(o.value)} value={i}>
          {o.label}
        </option>
      ))}
    </select>
  ),
}));
vi.mock('@/components/DateInput', () => ({
  DateInput: (p: any) => (
    <input
      aria-label={p.label}
      value={p.value ?? ''}
      onChange={(e) => p.onChange(e.target.value || null)}
    />
  ),
}));
vi.mock('@/components/Form/MoneyInput', () => ({
  MoneyInput: (p: any) => (
    <input
      aria-label={p.label}
      value={p.value ?? ''}
      onChange={(e) => p.onValueChange(Number(e.target.value))}
    />
  ),
}));

const { MovementPurchaseFinancialHeader } = await import('./MovementPurchaseFinancialHeader');

const lang = languagePtBr.BR;
const text = lang.movementPurchases.movementPurchase.form.financial.header;
let formApi: { getValues: (n?: any) => any };
const onHasInputChange = vi.fn();

function Harness({ defaults = {} as Record<string, any> }) {
  const { control, setValue, getValues, formState } = useForm<any>({
    defaultValues: {
      financial_number: '',
      financial_note: '',
      financial_has_input: null,
      financial_input_date: null,
      financial_input_value: null,
      financial_fiscal_document: true,
      financial_classification: 'N',
      ...defaults,
    },
  });
  formApi = { getValues };
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: false } } })
  );
  return (
    <QueryClientProvider client={client}>
      <ChakraProvider value={system}>
        <MovementPurchaseFinancialHeader
          control={control}
          setValue={setValue}
          errors={formState.errors}
          languageGB={lang}
          onHasInputChange={onHasInputChange}
        />
      </ChakraProvider>
    </QueryClientProvider>
  );
}

afterEach(() => {
  cleanup();
  onHasInputChange.mockReset();
  listProprietaryOptions.mockReset();
});

const choose = (label: string, index: number) =>
  act(() => {
    fireEvent.change(screen.getByLabelText(label), { target: { value: String(index) } });
  });

describe('MovementPurchaseFinancialHeader', () => {
  it('defaults do create: Dedutível = Sim, Classificação = N, "Possui Entrada?" sem escolha', () => {
    listProprietaryOptions.mockResolvedValue([]);
    render(<Harness />);
    expect(
      (screen.getByLabelText(text.fiscalDocument) as HTMLSelectElement).selectedOptions[0].text
    ).toBe(text.yes);
    expect(
      (screen.getByLabelText(text.classification) as HTMLSelectElement).selectedOptions[0].text
    ).toBe(text.classificationNone);
    expect(screen.getByLabelText(text.hasInput)).toBeTruthy();
    expect(formApi.getValues('financial_has_input')).toBeNull();
  });

  it('entrada (data/valor) só aparece com Possui Entrada = Sim', () => {
    listProprietaryOptions.mockResolvedValue([]);
    render(<Harness />);
    expect(screen.queryByLabelText(text.inputDate)).toBeNull();
    expect(screen.queryByLabelText(text.inputValue)).toBeNull();

    choose(text.hasInput, 0); // Sim
    expect(screen.getByLabelText(text.inputDate)).toBeTruthy();
    expect(screen.getByLabelText(text.inputValue)).toBeTruthy();
    expect(onHasInputChange).toHaveBeenLastCalledWith(true);
  });

  it('Não limpa data e valor da entrada e esconde os campos', () => {
    listProprietaryOptions.mockResolvedValue([]);
    render(
      <Harness
        defaults={{
          financial_has_input: true,
          financial_input_date: '2025-01-05',
          financial_input_value: 200,
        }}
      />
    );
    expect(screen.getByLabelText(text.inputDate)).toBeTruthy();

    choose(text.hasInput, 1); // Não
    expect(screen.queryByLabelText(text.inputDate)).toBeNull();
    expect(formApi.getValues('financial_input_date')).toBeNull();
    expect(formApi.getValues('financial_input_value')).toBeNull();
    expect(formApi.getValues('financial_has_input')).toBe(false);
    expect(onHasInputChange).toHaveBeenLastCalledWith(false);
  });

  it('digitação: Nº do título até 15 e Histórico até 200 caracteres; tipo do título grava Option', () => {
    listProprietaryOptions.mockResolvedValue([]);
    render(<Harness />);
    expect(document.querySelector('[name="financial_number"]')?.getAttribute('maxlength')).toBe(
      '15'
    );
    expect(document.querySelector('[name="financial_note"]')?.getAttribute('maxlength')).toBe(
      '200'
    );

    fireEvent.click(screen.getByRole('button', { name: 'pick-type-title' }));
    expect(formApi.getValues('financial_type_title')).toEqual({
      label: 'Duplicata',
      value: 'tt-1',
    });
  });

  it('proprietário gestor vem de /proprietaries/options?scope=farm e é opcional', async () => {
    listProprietaryOptions.mockResolvedValue([{ uuid: 'p-1', label: 'Fulano' }]);
    render(<Harness />);
    await waitFor(() => expect(screen.getByRole('option', { name: 'Fulano' })).toBeTruthy());
    expect(listProprietaryOptions).toHaveBeenCalledWith(undefined, 'farm');
    choose(text.proprietary, 0);
    expect(formApi.getValues('financial_proprietary')).toEqual({ label: 'Fulano', value: 'p-1' });
  });
});
