// @vitest-environment jsdom
// 088 D3-FE-T3 — rateio da Compra: cascata categoria → conta/centro (IG-06), valor ↔ %
// (IG-03/IG-04), adicionar/remover (IG-11/IG-12), rodapé. Centro: opções do CATÁLOGO
// (`scope=allocation`); `by-category` só pré-seleciona.
import { useEffect, useState } from 'react';

import { ChakraProvider } from '@chakra-ui/react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useFieldArray, useForm } from 'react-hook-form';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { languagePtBr } from '@/constants/languages/languagePtBr';

const CATALOG = [
  { uuid: 'cc-a', code: '001', description: 'Alfa' },
  { uuid: 'cc-b', code: '002', description: 'Beta' },
];

const listCostCenterOptions = vi.fn();
const listCostCentersByCategory = vi.fn();
const listPlanAccountOptions = vi.fn();
const toasterWarning = vi.fn();

vi.mock('@/services/v2/CostCenters/cost-center-service', () => ({
  listCostCenterOptions: (...a: unknown[]) => listCostCenterOptions(...a),
  listCostCentersByCategory: (...a: unknown[]) => listCostCentersByCategory(...a),
}));
vi.mock('@/services/v2/PlanAccounts/plan-account-service', () => ({
  listPlanAccountOptions: (...a: unknown[]) => listPlanAccountOptions(...a),
}));
vi.mock('@/services/v2/FinancialCategories/financial-category-service', () => ({
  listFinancialCategoryOptions: vi.fn(),
}));
vi.mock('@/components/ui/toaster', () => ({
  toaster: { warning: (...a: unknown[]) => toasterWarning(...a) },
}));

// Dublê do select assíncrono. Categoria = botões que escolhem cat-x/cat-y; conta = valor
// exibido + botão que escolhe manualmente; centro = catálogo via `service(findParams(''))`.
vi.mock('@/components/Form/SelectAsyncPaginate', () => ({
  SelectAsyncPaginate: (props: any) => {
    const [items, setItems] = useState<any[]>([]);
    const name = String(props.name);
    const isCenter = name.includes('center');
    useEffect(() => {
      if (!isCenter) return;
      void props.service(props.findParams('')).then((r: any) => setItems(r.data.items));
    }, []);
    if (name.includes('plan_account')) {
      return (
        <div>
          <span data-testid={`${name}-value`}>{props.value?.value ?? ''}</span>
          <button
            type="button"
            onClick={() => props.onChange({ label: 'Manual', value: 'acc-manual' })}
          >
            {`pick-acc-${name}`}
          </button>
        </div>
      );
    }
    if (!isCenter) {
      return (
        <div>
          <button
            type="button"
            onClick={() => props.onChange({ label: 'Cat X', value: 'cat-x' })}
          >{`pick-cat-x-${name}`}</button>
          <button
            type="button"
            onClick={() => props.onChange({ label: 'Cat Y', value: 'cat-y' })}
          >{`pick-cat-y-${name}`}</button>
        </div>
      );
    }
    return (
      <div data-testid={`${name}-box`}>
        <span data-testid={`${name}-value`}>{props.value?.value ?? ''}</span>
        <span data-testid={`${name}-label`}>{props.value?.label ?? ''}</span>
        <span data-testid={`${name}-count`}>{items.length}</span>
        {items.map((i) => (
          <button
            type="button"
            key={i.uuid}
            onClick={() => props.onChange(props.mapOptions(i))}
          >{`opt-${name}-${i.uuid}`}</button>
        ))}
      </div>
    );
  },
}));

const { MovementPurchaseExpenseAllocation, isAllocationRowComplete } =
  await import('./MovementPurchaseExpenseAllocation');

const messages = languagePtBr.BR.movementPurchases.movementPurchase.form.financial.messages;
let formApi: { getValues: (n?: any) => any };

function Harness({ initial, total = 1000 }: { initial: any[]; total?: number }) {
  const { control, setValue, getValues, formState } = useForm<any>({
    defaultValues: { total, financial_allocations: initial },
  });
  formApi = { getValues };
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'financial_allocations',
  });
  return (
    <ChakraProvider value={system}>
      <MovementPurchaseExpenseAllocation
        control={control}
        fields={fields}
        append={append as any}
        remove={remove}
        setValue={setValue}
        errors={formState.errors}
        languageGB={languagePtBr.BR}
      />
    </ChakraProvider>
  );
}

const catalogResponse = () => ({
  data: { items: CATALOG, pagination: { total: 2, current_page: 1, total_pages: 1 } },
});
const accountResponse = (items: any[]) => ({
  data: { items, pagination: { total: items.length, current_page: 1, total_pages: 1 } },
});

beforeEach(() => {
  listCostCenterOptions.mockReset().mockResolvedValue(catalogResponse());
  listCostCentersByCategory.mockReset().mockResolvedValue({ data: [] });
  listPlanAccountOptions.mockReset().mockResolvedValue(accountResponse([]));
  toasterWarning.mockReset();
});
afterEach(cleanup);

const cat = { label: 'Cat X', value: 'cat-x' };
const center = { label: '001 — Alfa', value: 'cc-a' };
const row = (over: any = {}) => ({
  category: cat,
  plan_account: null,
  center: null,
  percent: null,
  value: null,
  ...over,
});
const input = (name: string) => document.getElementById(name) as HTMLInputElement;
const type = (name: string, digits: string) =>
  fireEvent.change(input(name), { target: { value: digits } });
const blur = (name: string) => fireEvent.blur(input(name));
const values = () => formApi.getValues('financial_allocations');

describe('cascata categoria → conta contábil (IG-06)', () => {
  it('conta = 1º de /plan-accounts/options (conditions[]=1,3, class=2, is_enabled, category_uuid)', async () => {
    listPlanAccountOptions.mockResolvedValue(
      accountResponse([
        { uuid: 'acc-1', code: '3.1', description: 'Primeira' },
        { uuid: 'acc-2', code: '3.2', description: 'Segunda' },
      ])
    );
    render(<Harness initial={[row({ category: null })]} />);
    await act(async () =>
      fireEvent.click(screen.getByText('pick-cat-x-financial_allocations.0.category'))
    );
    await waitFor(() =>
      expect(screen.getByTestId('financial_allocations.0.plan_account-value').textContent).toBe(
        'acc-1'
      )
    );
    expect(listPlanAccountOptions).toHaveBeenCalledWith({
      category_uuid: 'cat-x',
      conditions: [1, 3],
      class: 2,
      is_enabled: 'true',
    });
    expect(values()[0].plan_account.label).toBe('3.1 — Primeira');
  });

  it('categoria sem conta limpa a conta anterior', async () => {
    render(<Harness initial={[row({ plan_account: { label: 'Velha', value: 'acc-old' } })]} />);
    expect(screen.getByTestId('financial_allocations.0.plan_account-value').textContent).toBe(
      'acc-old'
    );
    await act(async () =>
      fireEvent.click(screen.getByText('pick-cat-y-financial_allocations.0.category'))
    );
    await waitFor(() =>
      expect(screen.getByTestId('financial_allocations.0.plan_account-value').textContent).toBe('')
    );
    expect(values()[0].plan_account).toBeNull();
  });

  it('falha da API de contas não quebra e limpa a conta', async () => {
    listPlanAccountOptions.mockRejectedValue(new Error('x'));
    render(<Harness initial={[row({ plan_account: { label: 'Velha', value: 'acc-old' } })]} />);
    await act(async () =>
      fireEvent.click(screen.getByText('pick-cat-y-financial_allocations.0.category'))
    );
    await waitFor(() => expect(values()[0].plan_account).toBeNull());
  });
});

describe('cascata categoria → centro de custo (pré-seleção)', () => {
  it('pré-seleciona o PRIMEIRO centro de by-category sem reduzir o catálogo', async () => {
    listCostCentersByCategory.mockResolvedValue({ data: [CATALOG[1], CATALOG[0]] });
    render(<Harness initial={[row()]} />);
    const name = 'financial_allocations.0.center';
    await waitFor(() => expect(screen.getByTestId(`${name}-count`).textContent).toBe('2'));
    await act(async () =>
      fireEvent.click(screen.getByText('pick-cat-x-financial_allocations.0.category'))
    );
    await waitFor(() => expect(screen.getByTestId(`${name}-value`).textContent).toBe('cc-b'));
    expect(screen.getByTestId(`${name}-count`).textContent).toBe('2');
    expect(listCostCenterOptions.mock.calls[0][0]).toMatchObject({ scope: 'allocation' });
  });

  it('escolha manual do centro NÃO é sobrescrita pela cascata', async () => {
    listCostCentersByCategory.mockResolvedValue({ data: [CATALOG[1]] });
    render(<Harness initial={[row()]} />);
    const name = 'financial_allocations.0.center';
    await waitFor(() => expect(screen.getByTestId(`${name}-count`).textContent).toBe('2'));
    fireEvent.click(screen.getByText(`opt-${name}-cc-a`));
    await act(async () =>
      fireEvent.click(screen.getByText('pick-cat-x-financial_allocations.0.category'))
    );
    await waitFor(() => expect(listCostCentersByCategory).toHaveBeenCalled());
    await act(async () => {});
    expect(screen.getByTestId(`${name}-value`).textContent).toBe('cc-a');
  });

  it('edição: centro hidratado (fora do catálogo) é mantido ao trocar a categoria', async () => {
    listCostCentersByCategory.mockResolvedValue({ data: [CATALOG[0]] });
    render(<Harness initial={[row({ center: { label: '777 — Salvo', value: 'cc-saved' } })]} />);
    const name = 'financial_allocations.0.center';
    await waitFor(() => expect(screen.getByTestId(`${name}-count`).textContent).toBe('2'));
    expect(listCostCentersByCategory).not.toHaveBeenCalled();
    await act(async () =>
      fireEvent.click(screen.getByText('pick-cat-x-financial_allocations.0.category'))
    );
    await waitFor(() => expect(listCostCentersByCategory).toHaveBeenCalled());
    await act(async () => {});
    expect(screen.getByTestId(`${name}-value`).textContent).toBe('cc-saved');
  });
});

describe('valor ↔ % (IG-03/IG-04)', () => {
  it('V5: valor 600 de 1.000 → 60,00 %', async () => {
    render(<Harness initial={[row({ center })]} />);
    type('financial_allocations.0.value', '60000');
    blur('financial_allocations.0.value');
    await waitFor(() => expect(values()[0].percent).toBe(60));
    expect(values()[0].value).toBe(600);
    expect(toasterWarning).not.toHaveBeenCalled();
  });

  it('V6: soma excede → mensagem do legado e linha zerada', async () => {
    render(
      <Harness
        initial={[
          row({ center, value: 600, percent: 60 }),
          row({ center: { ...center, value: 'cc-b' } }),
        ]}
      />
    );
    type('financial_allocations.1.value', '50000');
    blur('financial_allocations.1.value');
    await waitFor(() => expect(values()[1].value).toBe(0));
    expect(values()[1].percent).toBe(0);
    expect(values()[0].value).toBe(600);
    expect(toasterWarning).toHaveBeenCalledWith({ description: messages.allocationExceeds });
  });

  it('% digitado calcula o valor da linha', async () => {
    render(<Harness initial={[row({ center })]} />);
    type('financial_allocations.0.percent', '2500');
    blur('financial_allocations.0.percent');
    await waitFor(() => expect(values()[0].value).toBe(250));
  });

  it('% somando 100 redistribui fechando centavos (V4: 3,34 / 3,33 / 3,33)', async () => {
    render(
      <Harness
        total={10}
        initial={[
          row({ center, percent: 33.33 }),
          row({ center: { ...center, value: 'cc-b' }, percent: 33.33 }),
          row({ center: { ...center, value: 'cc-c' }, percent: 33.34 }),
        ]}
      />
    );
    blur('financial_allocations.2.percent');
    await waitFor(() => expect(values()[2].value).not.toBeNull());
    expect(values().map((r: any) => r.value)).toEqual([3.34, 3.33, 3.33]);
    expect(values().reduce((s: number, r: any) => s + Math.round(r.value * 100), 0)).toBe(1000);
  });

  it('% > 100 no total → aviso e linha zerada', async () => {
    render(<Harness initial={[row({ center, percent: 70 }), row({ center, percent: 50 })]} />);
    blur('financial_allocations.1.percent');
    await waitFor(() => expect(values()[1].percent).toBe(0));
    expect(values()[1].value).toBe(0);
    expect(toasterWarning).toHaveBeenCalledWith({ description: messages.allocationExceeds });
  });

  it('total 0 → aviso "preencha o valor da compra", sem NaN, linha intacta', async () => {
    render(<Harness total={0} initial={[row({ center })]} />);
    type('financial_allocations.0.value', '10000');
    blur('financial_allocations.0.value');
    await waitFor(() =>
      expect(toasterWarning).toHaveBeenCalledWith({ description: messages.fillTotalFirst })
    );
    expect(values()[0].value).toBe(100);
    const footer = screen.getByTestId('allocation-footer').textContent ?? '';
    expect(footer).not.toMatch(/NaN|Infinity/);
  });
});

describe('adicionar / remover (IG-11/IG-12)', () => {
  it('adicionar bloqueado com linha incompleta', async () => {
    render(<Harness initial={[row()]} />);
    fireEvent.click(
      screen.getByText(
        languagePtBr.BR.movementPurchases.movementPurchase.form.financial.allocation.addRow
      )
    );
    expect(toasterWarning).toHaveBeenCalledWith({ description: messages.fillRowBeforeAdd });
    expect(screen.getAllByTestId(/allocation-row-/)).toHaveLength(1);
  });

  it('conta contábil vazia NÃO bloqueia adicionar', async () => {
    render(<Harness initial={[row({ center, percent: 50, value: 500 })]} />);
    fireEvent.click(
      screen.getByText(
        languagePtBr.BR.movementPurchases.movementPurchase.form.financial.allocation.addRow
      )
    );
    await waitFor(() => expect(screen.getAllByTestId(/allocation-row-/)).toHaveLength(2));
    expect(toasterWarning).not.toHaveBeenCalled();
  });

  it('remover pede confirmação e remove a linha', async () => {
    render(
      <Harness
        initial={[
          row({ center, percent: 50, value: 500 }),
          row({ center, percent: 50, value: 500, category: { label: 'Y', value: 'cat-y' } }),
        ]}
      />
    );
    const allocText = languagePtBr.BR.movementPurchases.movementPurchase.form.financial.allocation;
    fireEvent.click(screen.getAllByLabelText(allocText.removeRow)[1]);
    expect(await screen.findByText(messages.removeConfirmTitle)).toBeTruthy();
    expect(screen.getAllByTestId(/allocation-row-/)).toHaveLength(2);
    const confirm = screen.getAllByText(allocText.removeRow).pop() as HTMLElement;
    fireEvent.click(confirm);
    await waitFor(() => expect(screen.getAllByTestId(/allocation-row-/)).toHaveLength(1));
    expect(values()[0].category.value).toBe('cat-x');
  });

  it('nunca deixa zero linhas: confirma mas mantém e avisa', async () => {
    render(<Harness initial={[row({ center, percent: 100, value: 1000 })]} />);
    const allocText = languagePtBr.BR.movementPurchases.movementPurchase.form.financial.allocation;
    fireEvent.click(screen.getByLabelText(allocText.removeRow));
    await screen.findByText(messages.removeConfirmTitle);
    fireEvent.click(screen.getAllByText(allocText.removeRow).pop() as HTMLElement);
    await waitFor(() =>
      expect(toasterWarning).toHaveBeenCalledWith({ description: messages.minOneRow })
    );
    expect(screen.getAllByTestId(/allocation-row-/)).toHaveLength(1);
  });
});

describe('rodapé e helpers', () => {
  it('mostra total/rateado e avisa diferença; some quando fecha', async () => {
    const alloc = languagePtBr.BR.movementPurchases.movementPurchase.form.financial.allocation;
    render(<Harness initial={[row({ center, percent: 60, value: 600 })]} />);
    expect(screen.getByText(alloc.differenceWarning)).toBeTruthy();
    type('financial_allocations.0.value', '100000');
    blur('financial_allocations.0.value');
    await waitFor(() => expect(screen.queryByText(alloc.differenceWarning)).toBeNull());
  });

  it('isAllocationRowComplete: exige categoria, centro, % e valor (conta opcional)', () => {
    expect(isAllocationRowComplete(row({ center, percent: 10, value: 10 }))).toBe(true);
    expect(isAllocationRowComplete(row({ percent: 10, value: 10 }))).toBe(false);
    expect(isAllocationRowComplete(row({ center, value: 10 }))).toBe(false);
    expect(isAllocationRowComplete(null)).toBe(false);
  });
});
