// @vitest-environment jsdom
// 088 D4-FE-T1 — aplicação do XML na página de Compra (upload e DFe): duplicatas
// irregulares sem regenerar, defaults + Classificação visível, fornecedor de outro
// tipo selecionado, avisos não bloqueantes, rateio de 1 linha, outros valores
// intocado, DFe == upload e reescala por mudança de quantidade mantendo as datas.
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { languagePtBr } from '@/constants/languages/languagePtBr';

import type { MovementPurchaseXmlDraft } from '@/services/v2/MovementPurchases/movement-purchase-service';

const lang = languagePtBr.BR;
const xmlText = lang.movementPurchases.movementPurchase.form.xmlImport;

function xmlDraft(overrides: Partial<MovementPurchaseXmlDraft> = {}): MovementPurchaseXmlDraft {
  return {
    number: '142',
    serie: '1',
    dt_sale: '2026-10-01',
    chave: '3'.repeat(44),
    note: 'infCpl',
    provider: {
      uuid: 'prov-5',
      matched: true,
      nif: '123',
      name: 'Fornecedor Outro Tipo',
      type: 5,
      is_enabled: true,
      created: false,
    },
    total_products: 900,
    freight: 100,
    discount: 0,
    total: 1000,
    items: [
      { category_uuid: null, description: 'Boi gordo', quantity: 10, value_unit: 90, amount: 900 },
    ],
    installments: [
      { number: '001', due_date: '2026-11-01', amount: 500 },
      { number: '002', due_date: '2026-12-15', amount: 300 },
      { number: '003', due_date: '2027-01-02', amount: 200 },
    ],
    interval_days: 44,
    financial_defaults: {
      number: '142',
      type_title: { uuid: 'tt-4', description: 'Compra de animais' },
      proprietary: null,
      note: 'infCpl',
      fiscal_document: true,
      classification: 'N',
      has_input: false,
    },
    warnings: [
      { code: 'PROVIDER_TYPE_MISMATCH', message: 'msg API' },
      { code: 'CITY_NOT_FOUND', message: 'msg API' },
    ],
    ...overrides,
  };
}

let uploadDraft: MovementPurchaseXmlDraft = xmlDraft();

vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({ languageInUse: 'BR', languageGB: lang, updateLanguageGB: vi.fn() }),
}));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { username: 'LOGADO' } }) }));
vi.mock('@/hooks/usePermissions', () => ({ usePermissions: () => ({ can: () => true }) }));
vi.mock('@/components/Form/SelectAsyncPaginate', () => ({
  // Mostra o valor controlado (label) — prova de que o fornecedor/título do XML aparece selecionado.
  SelectAsyncPaginate: (p: any) => (
    <span data-testid={`sel-${p.name}`}>{p.value?.label ?? ''}</span>
  ),
}));
vi.mock('@/components/Form/AllocationCostCenterSelect', () => ({
  AllocationCostCenterSelect: () => null,
}));
vi.mock('@/pages/CadastrosBase/Fornecedores/ProviderFormModal', () => ({
  ProviderFormModal: () => null,
}));
vi.mock('./MovementPurchaseXmlImport', () => ({
  // Dialog substituído por um botão que entrega o draft (o diálogo tem teste próprio).
  MovementPurchaseXmlImportDialog: (p: any) => (
    <button type="button" onClick={() => p.onApply(uploadDraft)}>
      apply-uploaded-xml
    </button>
  ),
}));
vi.mock('@/services/v2/CadastrosBase/Proprietary/proprietary-service', () => ({
  listProprietaryOptions: vi.fn().mockResolvedValue([]),
}));
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
  return { ...actual, useMovementPurchaseForm: () => ({ isLoading: false, isPending: false }) };
});

const { default: CreateOrUpdateMovementPurchase } =
  await import('./CreateOrUpdateMovementPurchase');

function renderPage(state?: unknown) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <ChakraProvider value={system}>
        <MemoryRouter initialEntries={[{ pathname: '/operacional/compra-animais/novo', state }]}>
          <Routes>
            <Route
              path="/operacional/compra-animais/novo"
              element={<CreateOrUpdateMovementPurchase />}
            />
          </Routes>
        </MemoryRouter>
      </ChakraProvider>
    </QueryClientProvider>
  );
}

const input = (name: string) => document.querySelector(`[name="${name}"]`) as HTMLInputElement;
const select = (name: string) =>
  document.querySelector(`select[name="${name}"]`) as HTMLSelectElement;
const amounts = () =>
  [0, 1, 2].map((i) => Number(input(`financial_installments.${i}.amount`)?.value));
const dueDates = () =>
  Array.from(document.querySelectorAll('[data-testid="date-Vencimento"]')).map(
    (el) => (el as HTMLInputElement).value
  );
const selectedLabel = (name: string) => select(name).selectedOptions[0]?.textContent;

async function expectXmlApplied() {
  await waitFor(() => expect(input('financial_installments.0.amount')).not.toBeNull());
  // duplicatas como vieram (sem regenerar), datas irregulares
  expect(amounts()).toEqual([500, 300, 200]);
  expect(dueDates()).toEqual(['2026-11-01', '2026-12-15', '2027-01-02']);
  expect(input('movement_purchase_installments_generator_count').value).toBe('3');
  // cabeçalho financeiro dos defaults
  expect(select('has_financial')).not.toBeNull();
  expect(screen.getByTestId('purchase-financial-header')).not.toBeNull();
  expect(input('financial_number').value).toBe('142');
  expect(screen.getByTestId('sel-financial_type_title').textContent).toBe('Compra de animais');
  expect(selectedLabel('financial_fiscal_document')).toBe(
    lang.movementPurchases.movementPurchase.form.financial.header.yes
  );
  // Classificação visível, valor N
  expect(selectedLabel('financial_classification')).toBe(
    lang.movementPurchases.movementPurchase.form.financial.header.classificationNone
  );
  // fornecedor de OUTRO tipo (type=5) aparece selecionado
  expect(screen.getByTestId('sel-provider_uuid').textContent).toBe('Fornecedor Outro Tipo');
  // rateio: 1 linha com o total
  expect(input('financial_allocations.0.value').value).toBe('1000');
  expect(input('financial_allocations.0.percent').value).toBe('100');
  expect(input('financial_allocations.1.value')).toBeNull();
  // outros valores permanece 0
  expect(Number(input('other_values').value)).toBe(0);
  // avisos (não bloqueantes) com texto por code
  const banner = screen.getByTestId('xml-warnings');
  expect(banner.textContent).toContain(xmlText.warnings.PROVIDER_TYPE_MISMATCH);
  expect(banner.textContent).toContain(xmlText.warnings.CITY_NOT_FOUND);
}

afterEach(cleanup);

describe('XML na página de Compra', () => {
  it('upload: "Aplicar" leva o financeiro do draft ao form (como veio)', async () => {
    uploadDraft = xmlDraft();
    renderPage();
    await act(async () => {
      fireEvent.click(screen.getByText('apply-uploaded-xml'));
    });
    await expectXmlApplied();
  });

  it('DFe (location.state.dfeXmlDraft) aplica o MESMO resultado do upload', async () => {
    renderPage({ dfeXmlDraft: xmlDraft() });
    await expectXmlApplied();
  });

  it('sem duplicata no XML (1 parcela = vNF): 1 linha, sem aviso quando não vier', async () => {
    renderPage({
      dfeXmlDraft: xmlDraft({
        installments: [{ number: '001', due_date: '2026-10-01', amount: 1000 }],
        interval_days: 0,
        warnings: [],
      }),
    });
    await waitFor(() => expect(input('financial_installments.0.amount')).not.toBeNull());
    expect(input('financial_installments.1.amount')).toBeNull();
    expect(input('movement_purchase_installments_generator_interval').value).toBe('0');
    expect(screen.queryByTestId('xml-warnings')).toBeNull();
  });

  it('mudar a quantidade depois: duplicatas reescaladas mantendo as datas; rateio acompanha o total', async () => {
    renderPage({ dfeXmlDraft: xmlDraft() });
    await waitFor(() => expect(input('financial_installments.0.amount')).not.toBeNull());

    // 10 → 11 cabeças: total 990 + 100 = 1.090
    await act(async () => {
      fireEvent.change(input('items.0.quantity'), { target: { value: '11' } });
    });
    await waitFor(
      () => expect(amounts().reduce((a, b) => a + Math.round(b * 100), 0)).toBe(109000),
      { timeout: 3000 }
    );
    expect(dueDates()).toEqual(['2026-11-01', '2026-12-15', '2027-01-02']);
    expect(Number(input('financial_allocations.0.value').value)).toBe(1090);
  });
});
