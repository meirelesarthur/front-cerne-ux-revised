// @vitest-environment jsdom
// 088 D3-FE-T2 — gerador por botão "Gerar" COM CONFIRMAÇÃO (P-FE-2), tabela de
// parcelas, entrada somente leitura, parcela 0,00 bloqueada (P-5), resíduo na
// última parcela, badge exato em centavos e mensagens.
import { ChakraProvider } from '@chakra-ui/react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useFieldArray, useForm } from 'react-hook-form';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { languagePtBr } from '@/constants/languages/languagePtBr';

vi.mock('@/components/DateInput', () => ({
  DateInput: (p: any) => (
    <input
      aria-label={p.label}
      data-testid={`date-${p.label}`}
      value={p.value ?? ''}
      disabled={p.disabled}
      onChange={(e) => p.onChange(e.target.value || null)}
    />
  ),
}));
vi.mock('@/components/Form/MoneyInput', () => ({
  MoneyInput: (p: any) => (
    <input
      aria-label={p.label}
      data-testid={`money-${p.name}`}
      value={p.value ?? ''}
      disabled={p.disabled}
      onChange={(e) => p.onValueChange(e.target.value === '' ? 0 : Number(e.target.value))}
    />
  ),
}));
vi.mock('@/components/Form/NumberInput', () => ({
  NumberInput: (p: any) => (
    <input
      aria-label={p.label}
      value={p.value ?? ''}
      disabled={p.disabled}
      onChange={(e) => p.onValueChange(e.target.value === '' ? null : Number(e.target.value))}
    />
  ),
}));
vi.mock('@/components/DeleteConfirmDialog', () => ({
  DeleteConfirmDialog: (p: any) =>
    p.isOpen ? (
      <div role="dialog">
        <span>{p.title}</span>
        <button type="button" onClick={p.onConfirm}>
          dlg-confirm
        </button>
        <button type="button" onClick={p.onClose}>
          dlg-cancel
        </button>
      </div>
    ) : null,
}));

const { MovementPurchaseInstallmentsSection } =
  await import('./MovementPurchaseInstallmentsSection');

const lang = languagePtBr.BR;
const fin = lang.movementPurchases.movementPurchase.form.financial;
const text = fin.installments;
const messages = fin.messages;

let formApi: { getValues: (n?: any) => any; setValue: (n: any, v: any) => void };
const onRowsChanged = vi.fn();

function Harness({ defaults }: { defaults: Record<string, any> }) {
  const { control, getValues, setValue, formState } = useForm<any>({ defaultValues: defaults });
  formApi = { getValues, setValue };
  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'financial_installments',
  });
  return (
    <ChakraProvider value={system}>
      <MovementPurchaseInstallmentsSection
        control={control}
        fields={fields}
        append={append as any}
        remove={remove}
        replace={replace as any}
        vlTotal={defaults.total}
        errors={formState.errors}
        languageGB={lang}
        onRowsChanged={onRowsChanged}
      />
    </ChakraProvider>
  );
}

const baseDefaults = (over: Record<string, any> = {}) => ({
  total: 100,
  financial_has_input: false,
  financial_input_date: null,
  financial_input_value: null,
  generator: { count: 3, first_due_date: '2025-01-10', interval_days: 30 },
  financial_installments: [],
  ...over,
});

const rowsOf = () => formApi.getValues('financial_installments');
const click = (name: string | RegExp) =>
  act(() => {
    fireEvent.click(screen.getByRole('button', { name }));
  });

afterEach(() => {
  cleanup();
  onRowsChanged.mockReset();
});

describe('MovementPurchaseInstallmentsSection — gerador por botão (P-FE-2)', () => {
  it('V1: 100,00 em 3 gera 33,33 / 33,33 / 33,34 (resíduo na última) com as datas certas', () => {
    render(<Harness defaults={baseDefaults()} />);
    click(text.generateButton);
    expect(rowsOf().map((r: any) => [r.due_date, r.amount, r.origin])).toEqual([
      ['2025-01-10', 33.33, 'generated'],
      ['2025-02-09', 33.33, 'generated'],
      ['2025-03-11', 33.34, 'generated'],
    ]);
    expect(onRowsChanged).toHaveBeenCalledWith('generated');
    expect(screen.getByTestId('installments-sum-badge').getAttribute('data-complete')).toBe('true');
  });

  it('mexer nos campos do gerador NÃO regenera a tabela sozinho', () => {
    render(<Harness defaults={baseDefaults()} />);
    click(text.generateButton);
    const before = JSON.stringify(rowsOf());
    fireEvent.change(screen.getByLabelText(text.qtdInstallments), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText(text.intInstallments), { target: { value: '10' } });
    expect(JSON.stringify(rowsOf())).toBe(before);
  });

  it('gerador incompleto não mexe na tabela e mostra a dica', () => {
    const existing = [{ due_date: '2025-05-01', amount: 100, origin: 'stored' }];
    render(
      <Harness
        defaults={baseDefaults({
          generator: { count: null, first_due_date: null, interval_days: 30 },
          financial_installments: existing,
        })}
      />
    );
    click(text.generateButton);
    expect(rowsOf()).toEqual(existing);
    expect(screen.getByTestId('generator-error').textContent).toBe(text.emptyHint);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('com parcelas existentes pede CONFIRMAÇÃO: cancelar mantém, confirmar substitui', () => {
    const existing = [{ due_date: '2025-05-01', amount: 100, origin: 'manual' }];
    render(<Harness defaults={baseDefaults({ financial_installments: existing })} />);

    click(text.generateButton);
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText(text.regenerateConfirmTitle)).toBeTruthy();
    expect(rowsOf()).toEqual(existing);

    click('dlg-cancel');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(rowsOf()).toEqual(existing);

    click(text.generateButton);
    click('dlg-confirm');
    expect(rowsOf()).toHaveLength(3);
    expect(rowsOf()[2].amount).toBe(33.34);
  });

  it('V2: entrada só com Sim — 1000,00, entrada 200 (05/01) + 4 de 05/02 a cada 30 dias', () => {
    render(
      <Harness
        defaults={baseDefaults({
          total: 1000,
          financial_has_input: true,
          financial_input_date: '2025-01-05',
          financial_input_value: 200,
          generator: { count: 4, first_due_date: '2025-02-05', interval_days: 30 },
        })}
      />
    );
    click(text.generateButton);
    expect(rowsOf().map((r: any) => [r.due_date, r.amount, r.origin])).toEqual([
      ['2025-01-05', 200, 'input'],
      ['2025-02-05', 200, 'generated'],
      ['2025-03-07', 200, 'generated'],
      ['2025-04-06', 200, 'generated'],
      ['2025-05-06', 200, 'generated'],
    ]);
    // linha da entrada é somente leitura e não tem remover
    const entry = screen.getByTestId('installment-row-input');
    entry
      .querySelectorAll('input')
      .forEach((el) => expect((el as HTMLInputElement).disabled).toBe(true));
    expect(entry.querySelector(`[aria-label="${text.removeInstallment}"]`)).toBeNull();
  });

  it('sem entrada (Não) a tabela não tem a linha 1 da entrada', () => {
    render(<Harness defaults={baseDefaults()} />);
    click(text.generateButton);
    expect(rowsOf().some((r: any) => r.origin === 'input')).toBe(false);
    expect(screen.queryByTestId('installment-row-input')).toBeNull();
  });

  it('entrada marcada Sim mas incompleta bloqueia o gerador', () => {
    render(<Harness defaults={baseDefaults({ financial_has_input: true })} />);
    click(text.generateButton);
    expect(rowsOf()).toEqual([]);
    expect(screen.getByTestId('generator-error').textContent).toBe(messages.requiredFields);
  });

  it('parcela 0,00 é BLOQUEADA (0,05 em 6): mensagem installmentPositive e tabela intacta', () => {
    const existing = [{ due_date: '2025-05-01', amount: 0.05, origin: 'manual' }];
    render(
      <Harness
        defaults={baseDefaults({
          total: 0.05,
          generator: { count: 6, first_due_date: '2025-01-10', interval_days: 30 },
          financial_installments: existing,
        })}
      />
    );
    click(text.generateButton);
    expect(screen.getByTestId('generator-error').textContent).toBe(
      messages.installmentPositive.replace('{{position}}', '1')
    );
    expect(rowsOf()).toEqual(existing);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('total 0 e entrada >= total têm mensagem própria', () => {
    const { unmount } = render(<Harness defaults={baseDefaults({ total: 0 })} />);
    click(text.generateButton);
    expect(screen.getByTestId('generator-error').textContent).toBe(messages.totalMustBePositive);
    unmount();

    render(
      <Harness
        defaults={baseDefaults({
          financial_has_input: true,
          financial_input_date: '2025-01-05',
          financial_input_value: 100,
        })}
      />
    );
    click(text.generateButton);
    expect(screen.getByTestId('generator-error').textContent).toBe(messages.inputLessThanTotal);
  });
});

describe('MovementPurchaseInstallmentsSection — tabela', () => {
  it('editar valor marca origin=manual e avisa o pai; badge só fecha no centavo exato', () => {
    render(<Harness defaults={baseDefaults()} />);
    click(text.generateButton);
    onRowsChanged.mockReset();

    const amount = screen.getByTestId('money-financial_installments.0.amount');
    fireEvent.change(amount, { target: { value: '33.32' } });
    expect(rowsOf()[0].origin).toBe('manual');
    expect(rowsOf()[0].amount).toBe(33.32);
    expect(onRowsChanged).toHaveBeenCalledWith('manual');
    // soma 99,99 ≠ 100,00 → laranja (sem tolerância)
    expect(screen.getByTestId('installments-sum-badge').getAttribute('data-complete')).toBe(
      'false'
    );

    fireEvent.change(amount, { target: { value: '33.33' } });
    expect(screen.getByTestId('installments-sum-badge').getAttribute('data-complete')).toBe('true');
  });

  it('adicionar e remover parcela (P-FE-1) continuam disponíveis', () => {
    render(<Harness defaults={baseDefaults()} />);
    click(text.addInstallment);
    expect(rowsOf()).toEqual([{ due_date: null, amount: null, origin: 'manual' }]);
    fireEvent.click(screen.getByLabelText(text.removeInstallment));
    expect(rowsOf()).toEqual([]);
    expect(screen.getByText(new RegExp(text.emptyHint))).toBeTruthy();
  });

  it('linha da entrada espelha o cabeçalho e some quando "Possui Entrada?" deixa de ser Sim', () => {
    render(
      <Harness
        defaults={baseDefaults({
          total: 1000,
          financial_has_input: true,
          financial_input_date: '2025-01-05',
          financial_input_value: 200,
          financial_installments: [
            { due_date: '2025-01-05', amount: 200, origin: 'input' },
            { due_date: '2025-02-05', amount: 800, origin: 'stored' },
          ],
        })}
      />
    );
    act(() => formApi.setValue('financial_input_value', 250));
    expect(rowsOf()[0].amount).toBe(250);
    expect(rowsOf()[0].origin).toBe('input');

    act(() => formApi.setValue('financial_has_input', false));
    expect(rowsOf()).toEqual([{ due_date: '2025-02-05', amount: 800, origin: 'stored' }]);
  });
});
