// @vitest-environment jsdom
// 088 D3-FE-T4 — integração do financeiro na página de Compra de Animais:
// hidratação do show §2.3 SEM regenerar, payload §2.1, entrada, botão "Gerar" com
// confirmação, recálculo por mudança de total (reescala mantendo datas/entrada,
// rateio preservando categoria/conta/centro, rajada sem deriva, sem recálculo com
// baixa, entrada >= novo total) e 422 da API no campo certo.
import { useEffect } from 'react';

import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { languagePtBr } from '@/constants/languages/languagePtBr';

import { movementPurchaseSchema } from '@/validations/schemas/MovementPurchases/movement-purchase-schema';

import type { MovementPurchaseDetail, MovementPurchaseForm } from '@/@types/v2/MovementPurchases';

const lang = languagePtBr.BR;
const fin = lang.movementPurchases.movementPurchase.form.financial;
const UUID = '8f14e45f-ceea-4e7a-9a3c-2d0f6b1c9a11';

let showData: MovementPurchaseDetail;
const updateMock = vi.fn();

vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({ languageInUse: 'BR', languageGB: lang, updateLanguageGB: vi.fn() }),
}));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { username: 'LOGADO' } }) }));
vi.mock('@/hooks/usePermissions', () => ({ usePermissions: () => ({ can: () => true }) }));
vi.mock('@/components/Form/SelectAsyncPaginate', () => ({ SelectAsyncPaginate: () => null }));
vi.mock('@/components/Form/AllocationCostCenterSelect', () => ({
  AllocationCostCenterSelect: () => null,
}));
vi.mock('@/pages/CadastrosBase/Fornecedores/ProviderFormModal', () => ({
  ProviderFormModal: () => null,
}));
vi.mock('./MovementPurchaseXmlImport', () => ({ MovementPurchaseXmlImportDialog: () => null }));
vi.mock('@/services/v2/CadastrosBase/Proprietary/proprietary-service', () => ({
  listProprietaryOptions: vi.fn().mockResolvedValue([]),
}));
vi.mock('@/services/v2/MovementPurchases/movement-purchase-service', async () => {
  const actual = await vi.importActual<
    typeof import('@/services/v2/MovementPurchases/movement-purchase-service')
  >('@/services/v2/MovementPurchases/movement-purchase-service');
  return { ...actual, updateMovementPurchase: (...args: unknown[]) => updateMock(...args) };
});

// Inputs nativos simples (controle por `name`/`data-testid`) no lugar das máscaras.
vi.mock('@/components/DateInput', () => ({
  DateInput: (p: any) => (
    <div>
      <input
        aria-label={p.label ?? 'date'}
        data-testid={`date-${p.label ?? 'sem-label'}`}
        value={p.value ?? ''}
        disabled={p.disabled}
        onChange={(e) => p.onChange(e.target.value || null)}
      />
      {p.error && <span role="alert">{p.error}</span>}
    </div>
  ),
}));
vi.mock('@/components/Form/MoneyInput', () => ({
  MoneyInput: (p: any) => (
    <div>
      <input
        aria-label={p.label}
        name={p.name}
        value={p.value ?? ''}
        disabled={p.disabled}
        onChange={(e) => p.onValueChange?.(e.target.value === '' ? 0 : Number(e.target.value))}
        onBlur={p.onBlur}
      />
      {p.error && <span role="alert">{p.error}</span>}
    </div>
  ),
}));
vi.mock('@/components/Form/PercentInput', () => ({
  PercentInput: (p: any) => (
    <input
      aria-label={p.label}
      name={p.name}
      value={p.value ?? ''}
      disabled={p.disabled}
      onChange={(e) => p.onValueChange?.(e.target.value === '' ? null : Number(e.target.value))}
      onBlur={p.onBlur}
    />
  ),
}));
vi.mock('@/components/Form/NumberInput', () => ({
  NumberInput: (p: any) => (
    <input
      aria-label={p.label}
      name={p.name}
      value={p.value ?? ''}
      disabled={p.disabled}
      onChange={(e) => p.onValueChange(e.target.value === '' ? null : Number(e.target.value))}
    />
  ),
}));
vi.mock('@/components/Form/Select', () => ({
  Select: (p: any) => {
    const current = p.options.findIndex((o: any) => o.value === p.value?.value);
    return (
      <select
        aria-label={p.label}
        name={p.name}
        value={String(current)}
        disabled={p.isDisabled}
        onChange={(e) => p.onChange(p.options[Number(e.target.value)] ?? null)}
      >
        <option value="-1" />
        {p.options.map((o: any, i: number) => (
          <option key={String(o.value)} value={String(i)}>
            {o.label}
          </option>
        ))}
      </select>
    );
  },
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
vi.mock('./useMovementPurchases', async () => {
  const actual =
    await vi.importActual<typeof import('./useMovementPurchases')>('./useMovementPurchases');
  return {
    ...actual,
    useMovementPurchaseForm: ({
      fillForm,
    }: {
      fillForm: (d: MovementPurchaseDetail, r?: boolean) => void;
    }) => {
      // Assíncrono como a query real: o `reset` precisa chegar DEPOIS dos
      // `useFieldArray` da página assinarem (efeitos rodam na ordem dos hooks).
      useEffect(() => {
        const timer = setTimeout(() => fillForm(showData, true), 0);
        return () => clearTimeout(timer);
      }, []);
      return { isLoading: false, isPending: false };
    },
  };
});

const { default: CreateOrUpdateMovementPurchase } =
  await import('./CreateOrUpdateMovementPurchase');
const {
  buildMovementPurchaseFinancialPayload,
  buildMovementPurchasePayload,
  emptyMovementPurchaseFinancialForm,
  mapMovementPurchaseErrorKey,
  movementPurchaseFinancialToForm,
  movementPurchaseItemDetailToForm,
  resolveMovementPurchaseServerErrors,
} = await import('./useMovementPurchases');

function showFinancial(): NonNullable<MovementPurchaseDetail['financial']> {
  return {
    number: '142',
    type_title: { uuid: 'tt-1', description: 'Boleto' },
    proprietary: { uuid: 'pr-1', name: 'Gestor' },
    note: 'Compra lote 12',
    fiscal_document: true,
    classification: 'N',
    has_input: true,
    input: { due_date: '2026-11-01', amount: 200 },
    generator: { installments_count: 3, first_due_date: '2026-12-01', interval_days: 30 },
    installments: [
      { uuid: 'i1', installment: 1, due_date: '2026-11-01', amount: 200, has_write_off: false },
      { uuid: 'i2', installment: 2, due_date: '2026-12-01', amount: 266.67, has_write_off: false },
      { uuid: 'i3', installment: 3, due_date: '2027-01-01', amount: 266.67, has_write_off: false },
      { uuid: 'i4', installment: 4, due_date: '2027-02-01', amount: 266.66, has_write_off: false },
    ],
    allocations: [
      {
        financial_category: { uuid: 'fc-1', description: 'Compra de animais' },
        plan_account: { uuid: 'pa-1', code: '3.1.01', description: 'Animais' },
        cost_center: { uuid: 'cc-1', description: 'Pecuária' },
        value: 600,
        percent: 60,
      },
      {
        financial_category: { uuid: 'fc-2', description: 'Frete' },
        plan_account: null,
        cost_center: { uuid: 'cc-2', description: 'Fazenda' },
        value: 400,
        percent: 40,
      },
    ],
    allocations_total: 1000,
    installments_total: 1000,
  };
}

function detail(overrides: Partial<MovementPurchaseDetail> = {}): MovementPurchaseDetail {
  return {
    uuid: UUID,
    code: '000123',
    type_payment: '01',
    dt_sale: '2026-10-01',
    provider: { uuid: 'p-1', name: 'Fornecedor X' },
    seller: null,
    total_products: 1000,
    freight: 0,
    other_values: 0,
    discount: 0,
    total: 1000,
    chave: null,
    serie: null,
    number: null,
    gtas: null,
    note: null,
    created_at: '',
    updated_at: '',
    finished_processing: false,
    user: { uuid: 'u-1', name: 'ORIGINAL' },
    items: [
      {
        category: { uuid: 'c-1', description: 'Boi' },
        batch: null,
        grazing: null,
        center: null,
        quantity: 10,
        value_unit: 100,
        amount: 1000,
        note: null,
        item_description: null,
      },
    ],
    documents: [],
    has_financial: true,
    financial: showFinancial(),
    ...overrides,
  };
}

const EXPECTED_BLOCK = {
  number: '142',
  type_title_uuid: 'tt-1',
  proprietary_uuid: 'pr-1',
  note: 'Compra lote 12',
  fiscal_document: true,
  classification: 'N',
  has_input: true,
  input: { due_date: '2026-11-01', amount: 200 },
  installments: [
    { due_date: '2026-11-01', amount: 200 },
    { due_date: '2026-12-01', amount: 266.67 },
    { due_date: '2027-01-01', amount: 266.67 },
    { due_date: '2027-02-01', amount: 266.66 },
  ],
  allocations: [
    {
      financial_category_uuid: 'fc-1',
      plan_account_uuid: 'pa-1',
      cost_center_uuid: 'cc-1',
      value: 600,
      percent: 60,
    },
    {
      financial_category_uuid: 'fc-2',
      plan_account_uuid: null,
      cost_center_uuid: 'cc-2',
      value: 400,
      percent: 40,
    },
  ],
};

function formFrom(d: MovementPurchaseDetail): MovementPurchaseForm {
  return {
    code: d.code,
    dt_sale: d.dt_sale,
    provider_uuid: { label: 'F', value: 'p-1' },
    seller_uuid: null,
    chave: null,
    serie: null,
    number: null,
    type_payment: { label: 'x', value: '01' },
    gtas: '',
    note: '',
    total_products: d.total_products,
    freight: d.freight,
    other_values: d.other_values,
    discount: d.discount,
    total: d.total,
    items: d.items.map((i) => movementPurchaseItemDetailToForm(i)),
    ...movementPurchaseFinancialToForm(d),
  };
}

// ---------------------------------------------------------------------------
// Funções puras: hidratação, payload §2.1, 422
// ---------------------------------------------------------------------------

describe('hidratação (pacote 2) e payload §2.1 — round-trip', () => {
  it('show → form NÃO regenera parcelas nem muda valores; % do show é mantido (P-1)', () => {
    const d = detail();
    d.financial!.allocations[0].percent = 60.01; // % derivado difere em 0,01 do calculado
    const f = movementPurchaseFinancialToForm(d);

    expect(f.financial_installments).toEqual([
      { due_date: '2026-11-01', amount: 200, origin: 'input' },
      { due_date: '2026-12-01', amount: 266.67, origin: 'stored' },
      { due_date: '2027-01-01', amount: 266.67, origin: 'stored' },
      { due_date: '2027-02-01', amount: 266.66, origin: 'stored' },
    ]);
    expect(f.generator).toEqual({ count: 3, first_due_date: '2026-12-01', interval_days: 30 });
    expect(f.financial_has_input).toBe(true);
    expect(f.financial_input_date).toBe('2026-11-01');
    expect(f.financial_input_value).toBe(200);
    expect(f.financial_allocations[0]).toEqual({
      category: { label: 'Compra de animais', value: 'fc-1' },
      plan_account: { label: '3.1.01 — Animais', value: 'pa-1' },
      center: { label: 'Pecuária', value: 'cc-1' },
      value: 600,
      percent: 60.01,
    });
    expect(f.financial_allocations[1].plan_account).toBeNull();
    expect(f.financial_fiscal_document).toBe(true);
    expect(f.financial_classification).toBe('N');
    expect(f.financial_type_title).toEqual({ label: 'Boleto', value: 'tt-1' });
    expect(f.financial_proprietary).toEqual({ label: 'Gestor', value: 'pr-1' });
  });

  it('show → form → payload é idêntico ao gravado (shape §2.1, entrada = parcela 1)', () => {
    const f = movementPurchaseFinancialToForm(detail());
    expect(buildMovementPurchaseFinancialPayload(f)).toEqual(EXPECTED_BLOCK);

    const payload = buildMovementPurchasePayload(formFrom(detail()));
    expect(payload.financial).toEqual(EXPECTED_BLOCK);
    expect(payload.financial?.installments[0]).toEqual(payload.financial?.input);
  });

  it('has_input=false: a chave `input` NÃO é enviada', () => {
    const d = detail();
    d.financial = {
      ...showFinancial(),
      has_input: false,
      input: null,
      installments: [
        { uuid: 'i1', installment: 1, due_date: '2026-11-01', amount: 500, has_write_off: false },
        { uuid: 'i2', installment: 2, due_date: '2026-12-01', amount: 500, has_write_off: false },
      ],
    };
    const block = buildMovementPurchaseFinancialPayload(movementPurchaseFinancialToForm(d));
    expect(block.has_input).toBe(false);
    expect('input' in block).toBe(false);
    expect(block.installments).toHaveLength(2);
  });

  it('sem financeiro: defaults da página (intervalo 30, dedutível Sim, classificação N, entrada sem escolha)', () => {
    const f = movementPurchaseFinancialToForm(detail({ has_financial: false, financial: null }));
    expect(f).toEqual(emptyMovementPurchaseFinancialForm());
    expect(f.generator.interval_days).toBe(30);
    expect(f.financial_fiscal_document).toBe(true);
    expect(f.financial_classification).toBe('N');
    expect(f.financial_has_input).toBeNull();
  });
});

describe('422 → campo (§4.7)', () => {
  it.each([
    ['financial.number', 'financial_number'],
    ['financial.type_title_uuid', 'financial_type_title'],
    ['financial.proprietary_uuid', 'financial_proprietary'],
    ['financial.note', 'financial_note'],
    ['financial.fiscal_document', 'financial_fiscal_document'],
    ['financial.classification', 'financial_classification'],
    ['financial.has_input', 'financial_has_input'],
    ['financial.input', 'financial_input_value'],
    ['financial.input.due_date', 'financial_input_date'],
    ['financial.input.amount', 'financial_input_value'],
    ['financial.installments', 'financial_installments.root'],
    ['financial.installments.2.due_date', 'financial_installments.2.due_date'],
    ['financial.installments.0.amount', 'financial_installments.0.amount'],
    ['financial.allocations', 'financial_allocations.root'],
    ['financial.allocations.1.financial_category_uuid', 'financial_allocations.1.category'],
    ['financial.allocations.0.plan_account_uuid', 'financial_allocations.0.plan_account'],
    ['financial.allocations.3.cost_center_uuid', 'financial_allocations.3.center'],
    ['financial.allocations.0.value', 'financial_allocations.0.value'],
    ['total', 'financial_installments.root'],
    ['items.0.value_unit', 'items.0.value_unit'],
    ['provider_uuid', 'provider_uuid'],
  ])('%s → %s', (key, expected) => {
    expect(mapMovementPurchaseErrorKey(key)).toBe(expected);
  });

  it('chave desconhecida → null e vira businessError (nunca descartada)', () => {
    expect(mapMovementPurchaseErrorKey('financial.xyz')).toBeNull();
    expect(mapMovementPurchaseErrorKey('financial')).toBeNull();
    const resolved = resolveMovementPurchaseServerErrors({
      'financial.number': ['Informe o número do título.'],
      'financial.xyz': ['Algo novo.'],
    });
    expect(resolved.fields).toEqual([
      { name: 'financial_number', message: 'Informe o número do título.' },
    ]);
    expect(resolved.business).toEqual(['Algo novo.']);
  });
});

describe('schema composto (T2 + T3)', () => {
  it('compra hidratada válida passa; rateio ≠ total e entrada fora da 1ª linha falham', async () => {
    const valid = formFrom(detail());
    await expect(
      movementPurchaseSchema(lang).validate(valid, { abortEarly: false })
    ).resolves.toBeTruthy();

    const brokenAllocation = {
      ...valid,
      financial_allocations: [{ ...valid.financial_allocations[0], value: 500 }],
    };
    await expect(
      movementPurchaseSchema(lang).validate(brokenAllocation, { abortEarly: false })
    ).rejects.toMatchObject({
      inner: expect.arrayContaining([
        expect.objectContaining({
          path: 'financial_allocations',
          message: fin.messages.allocationTotalMismatch,
        }),
      ]),
    });

    const entryNotFirst = {
      ...valid,
      financial_installments: valid.financial_installments.map((row, i) =>
        i === 0 ? { ...row, origin: 'manual' as const } : row
      ),
    };
    await expect(
      movementPurchaseSchema(lang).validate(entryNotFirst, { abortEarly: false })
    ).rejects.toMatchObject({
      inner: expect.arrayContaining([
        expect.objectContaining({ message: fin.messages.firstInstallmentMustBeInput }),
      ]),
    });
  });
});

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------

function renderPage() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <ChakraProvider value={system}>
        <MemoryRouter initialEntries={[`/operacional/compra-animais/${UUID}/editar`]}>
          <Routes>
            <Route
              path="/operacional/compra-animais/:uuid/editar"
              element={<CreateOrUpdateMovementPurchase />}
            />
          </Routes>
        </MemoryRouter>
      </ChakraProvider>
    </QueryClientProvider>
  );
}

const input = (name: string) => document.querySelector(`[name="${name}"]`) as HTMLInputElement;
const amounts = () =>
  [0, 1, 2, 3].map((i) => Number(input(`financial_installments.${i}.amount`)?.value));
const dueDates = () =>
  Array.from(document.querySelectorAll('[data-testid="date-Vencimento"]')).map(
    (el) => (el as HTMLInputElement).value
  );
const allocValues = () =>
  [0, 1].map((i) => Number(input(`financial_allocations.${i}.value`).value));
const body = () => document.body.textContent ?? '';
const type = (name: string, value: number) =>
  act(() => {
    fireEvent.change(input(name), { target: { value: String(value) } });
  });

async function renderHydrated(d: MovementPurchaseDetail = detail()) {
  showData = d;
  renderPage();
  await waitFor(() => expect(input('financial_installments.0.amount')).not.toBeNull());
}

beforeEach(() => {
  updateMock.mockReset();
});
afterEach(cleanup);

describe('página — hidratação sem regenerar', () => {
  it('mostra as parcelas exatamente como gravadas e o gerador preenchido', async () => {
    await renderHydrated();
    expect(amounts()).toEqual([200, 266.67, 266.67, 266.66]);
    expect(dueDates()).toEqual(['2026-11-01', '2026-12-01', '2027-01-01', '2027-02-01']);
    expect(input('movement_purchase_installments_generator_count').value).toBe('3');
    expect(allocValues()).toEqual([600, 400]);
    expect(input('financial_allocations.0.percent').value).toBe('60');
    expect(body()).not.toContain('O rateio gravado');
  });

  it('rateio gravado ≠ total das parcelas: banner legacyAllocationDiff e submit barrado', async () => {
    const d = detail();
    d.financial!.allocations[1].value = 350;
    d.financial!.allocations_total = 950;
    await renderHydrated(d);
    expect(body()).toContain('O rateio gravado (R$');
    expect(body()).toContain('não fecha com o total das parcelas');

    const save = document.querySelector('button[form="movement-purchase-form"]') as HTMLElement;
    await act(async () => {
      fireEvent.click(save);
    });
    await waitFor(() => expect(body()).toContain(fin.messages.allocationTotalMismatch));
    expect(updateMock).not.toHaveBeenCalled();
  });
});

describe('página — botão Gerar (P-FE-2) e entrada', () => {
  it('Gerar pede confirmação, só então substitui as parcelas (entrada preservada, resíduo na última)', async () => {
    await renderHydrated();
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: fin.installments.generateButton }));
    });
    // Cancelar mantém as gravadas.
    act(() => {
      fireEvent.click(screen.getByText('dlg-cancel'));
    });
    expect(amounts()).toEqual([200, 266.67, 266.67, 266.66]);

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: fin.installments.generateButton }));
    });
    act(() => {
      fireEvent.click(screen.getByText('dlg-confirm'));
    });
    expect(amounts()).toEqual([200, 266.66, 266.66, 266.68]);
    expect(dueDates()).toEqual(['2026-11-01', '2026-12-01', '2026-12-31', '2027-01-30']);
  });

  it('"Possui Entrada?" = Não remove a linha da entrada (sem regenerar as demais)', async () => {
    await renderHydrated();
    const hasInput = document.querySelector('select[name="financial_has_input"]') as HTMLElement;
    await act(async () => {
      fireEvent.change(hasInput, { target: { value: '1' } }); // 0 = Sim, 1 = Não
    });
    await waitFor(() => expect(input('financial_installments.3.amount')).toBeNull());
    expect(amounts().slice(0, 3)).toEqual([266.67, 266.67, 266.66]);
  });
});

describe('página — recálculo por mudança de total (D3-b, P-FE-3)', () => {
  it('compra gravada: reescala as parcelas mantendo datas e entrada; rateio mantém categorias', async () => {
    await renderHydrated();
    type('freight', 100); // total 1.000 → 1.100
    await waitFor(() => expect(amounts()).toEqual([200, 300, 300, 300]), { timeout: 3000 });
    expect(dueDates()).toEqual(['2026-11-01', '2026-12-01', '2027-01-01', '2027-02-01']);
    // Rateio 600/400 fechado → 660/440 (categorias/contas/centros preservados no payload).
    expect(allocValues()).toEqual([660, 440]);
    expect(input('financial_allocations.0.percent').value).toBe('60');
  });

  it('rajada de 3 mudanças = mesmo resultado de 1 mudança (sem deriva de centavos)', async () => {
    await renderHydrated();
    type('freight', 100);
    type('freight', 150);
    type('freight', 200); // total 1.200
    // body 800 → 1.000: 333,34 · 333,34 · 333,32 (resíduo na última)
    await waitFor(() => expect(amounts()).toEqual([200, 333.34, 333.34, 333.32]), {
      timeout: 3000,
    });
    expect(allocValues()).toEqual([720, 480]);
  });

  it('voltar ao total original restaura as linhas da baseline', async () => {
    await renderHydrated();
    type('freight', 100);
    await waitFor(() => expect(amounts()).toEqual([200, 300, 300, 300]), { timeout: 3000 });
    type('freight', 0);
    await waitFor(() => expect(amounts()).toEqual([200, 266.67, 266.67, 266.66]), {
      timeout: 3000,
    });
    expect(allocValues()).toEqual([600, 400]);
  });

  it('com parcela baixada nada recalcula', async () => {
    const d = detail();
    d.financial!.installments[1].has_write_off = true;
    await renderHydrated(d);
    type('freight', 100);
    await new Promise((resolve) => setTimeout(resolve, 900));
    expect(amounts()).toEqual([200, 266.67, 266.67, 266.66]);
    expect(allocValues()).toEqual([600, 400]);
  });

  it('entrada >= novo total: erro no campo da entrada e nada muda', async () => {
    await renderHydrated();
    type('discount', 850); // total 1.000 → 150 (< entrada 200)
    await waitFor(() => expect(body()).toContain(fin.messages.inputLessThanTotal), {
      timeout: 3000,
    });
    // Parcelas intactas (erro no campo da entrada); o rateio acompanha o novo total
    // a partir da baseline (600/400 de 1.000 → 90/60 de 150), categorias preservadas.
    expect(amounts()).toEqual([200, 266.67, 266.67, 266.66]);
    expect(allocValues()).toEqual([90, 60]);
  });

  it('sem parcelas nada recalcula (compra sem financeiro; ligar o financeiro semeia o rateio = total)', async () => {
    showData = detail({ has_financial: false, financial: null });
    renderPage();
    await waitFor(() => expect(body()).toContain('ORIGINAL'));
    const hasFinancial = document.querySelector('select[name="has_financial"]') as HTMLElement;
    await act(async () => {
      fireEvent.change(hasFinancial, { target: { value: '0' } }); // Sim
    });
    await waitFor(() => expect(input('financial_allocations.0.value')).not.toBeNull());
    expect(input('financial_allocations.0.value').value).toBe('1000');
    expect(input('financial_allocations.0.percent').value).toBe('100');
    expect(input('movement_purchase_installments_generator_count').value).toBe('');
    expect(document.querySelector('[name="financial_installments.0.amount"]')).toBeNull();

    // Sem parcelas, mudar o total não recalcula nada (o rateio fica; o aviso de diferença cobre).
    type('freight', 100);
    await new Promise((resolve) => setTimeout(resolve, 900));
    expect(input('financial_allocations.0.value').value).toBe('1000');
    expect(document.querySelector('[name="financial_installments.0.amount"]')).toBeNull();
  });
});

describe('página — submit e 422', () => {
  const save = () => document.querySelector('button[form="movement-purchase-form"]') as HTMLElement;

  it('submit sem mudanças reenvia o financeiro idêntico ao gravado (§2.1)', async () => {
    updateMock.mockResolvedValue({ data: {} });
    await renderHydrated();
    await act(async () => {
      fireEvent.click(save());
    });
    await waitFor(() => expect(updateMock).toHaveBeenCalledTimes(1));
    const [uuid, payload] = updateMock.mock.calls[0];
    expect(uuid).toBe(UUID);
    expect(payload.has_financial).toBe(true);
    expect(payload.financial).toEqual(EXPECTED_BLOCK);
  });

  it('cada chave 422 cai no campo certo; desconhecida vira businessError', async () => {
    const error = Object.assign(new Error('422'), {
      isAxiosError: true,
      response: {
        status: 422,
        data: {
          errors: {
            'financial.installments.1.due_date': ['Venc. 2 inválido.'],
            'financial.allocations.0.value': ['Valor do rateio inválido.'],
            'financial.note': ['Histórico inválido.'],
            total: ['Total inconsistente.'],
            'financial.chave_nova': ['Regra nova da API.'],
          },
        },
      },
    });
    updateMock.mockRejectedValue(error);
    await renderHydrated();
    await act(async () => {
      fireEvent.click(save());
    });
    await waitFor(() => expect(body()).toContain('Regra nova da API.'));
    expect(body()).toContain('Venc. 2 inválido.');
    expect(body()).toContain('Valor do rateio inválido.');
    expect(body()).toContain('Histórico inválido.');
    expect(body()).toContain('Total inconsistente.');

    // O erro de vencimento aparece na linha 2 (índice 1), não na entrada.
    const row1 = document.querySelector('[data-testid="installment-row-1"]') as HTMLElement;
    expect(row1.textContent).toContain('Venc. 2 inválido.');
    const entry = document.querySelector('[data-testid="installment-row-input"]') as HTMLElement;
    expect(entry.textContent).not.toContain('Venc. 2 inválido.');
  });
});
