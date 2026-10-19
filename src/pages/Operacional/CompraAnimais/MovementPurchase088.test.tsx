// @vitest-environment jsdom
// 088 (T2/T6/D5) — hidratação do financeiro (shape novo §2.3, D3-FE-T4),
// bloqueio por baixa (D2), leitura com processamento finalizado, Valor Unitário > 0
// e responsável original.
import { useEffect } from 'react';

import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { languagePtBr } from '@/constants/languages/languagePtBr';

import { movementPurchaseSchema } from '@/validations/schemas/MovementPurchases/movement-purchase-schema';

import type { MovementPurchaseDetail } from '@/@types/v2/MovementPurchases';

const lang = languagePtBr.BR;
const UUID = '8f14e45f-ceea-4e7a-9a3c-2d0f6b1c9a11';

let showData: MovementPurchaseDetail;

vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({ languageInUse: 'BR', languageGB: lang, updateLanguageGB: vi.fn() }),
}));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { username: 'LOGADO' } }) }));
vi.mock('@/hooks/usePermissions', () => ({ usePermissions: () => ({ can: () => true }) }));
vi.mock('@/components/Form/SelectAsyncPaginate', () => ({ SelectAsyncPaginate: () => null }));
vi.mock('@/pages/CadastrosBase/Fornecedores/ProviderFormModal', () => ({
  ProviderFormModal: () => null,
}));
vi.mock('./MovementPurchaseXmlImport', () => ({ MovementPurchaseXmlImportDialog: () => null }));
vi.mock('./MovementPurchaseExpenseAllocation', () => ({
  MovementPurchaseExpenseAllocation: ({ disabled }: { disabled: boolean }) => (
    <div data-testid="allocation" data-disabled={String(disabled)} />
  ),
}));
vi.mock('./MovementPurchaseFinancialHeader', () => ({
  MovementPurchaseFinancialHeader: ({ disabled }: { disabled: boolean }) => (
    <div data-testid="financial-header" data-disabled={String(disabled)} />
  ),
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
      useEffect(() => {
        fillForm(showData, true);
      }, []);
      return { isLoading: false, isPending: false };
    },
  };
});

const { default: CreateOrUpdateMovementPurchase } =
  await import('./CreateOrUpdateMovementPurchase');
const {
  emptyMovementPurchaseFinancialForm,
  movementPurchaseFinancialToForm,
  buildMovementPurchasePayload,
  movementPurchaseItemDetailToForm,
} = await import('./useMovementPurchases');
const { isMovementPurchaseLocked } = await import('./MovementPurchaseLockBanners');

function detail(overrides: Partial<MovementPurchaseDetail> = {}): MovementPurchaseDetail {
  return {
    uuid: UUID,
    code: '000123',
    type_payment: '01',
    dt_sale: '2026-10-01',
    provider: { uuid: 'p-1', name: 'Fornecedor X' },
    seller: null,
    total_products: 100,
    freight: 0,
    other_values: 0,
    discount: 0,
    total: 100,
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
        value_unit: 10,
        amount: 100,
        note: null,
        item_description: null,
      },
    ],
    documents: [],
    has_financial: true,
    financial: {
      number: '142',
      type_title: { uuid: 'tt-1', description: 'Boleto' },
      proprietary: null,
      note: 'Compra lote 12',
      fiscal_document: true,
      classification: 'N',
      has_input: false,
      input: null,
      generator: { installments_count: 2, first_due_date: '2026-11-01', interval_days: 30 },
      installments: [
        { uuid: 'e1', installment: 1, due_date: '2026-11-01', amount: 60, has_write_off: false },
        { uuid: 'e2', installment: 2, due_date: '2026-12-01', amount: 40, has_write_off: false },
      ],
      allocations: [
        {
          financial_category: { uuid: 'fc-1', description: 'Compra' },
          plan_account: null,
          cost_center: { uuid: 'cc-1', description: 'CC' },
          value: 100,
          percent: 100,
        },
      ],
      allocations_total: 100,
      installments_total: 100,
    },
    ...overrides,
  };
}

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

afterEach(cleanup);

describe('T2 — hidratação do financeiro', () => {
  it('sem baixa: parcelas e rateio vêm do show; salvar sem mudanças reenvia o financeiro', () => {
    const d = detail();
    const f = movementPurchaseFinancialToForm(d);
    expect(f.has_financial).toBe(true);
    expect(f.financial_write_off).toBe(false);
    expect(f.financial_installments).toEqual([
      { due_date: '2026-11-01', amount: 60, origin: 'stored' },
      { due_date: '2026-12-01', amount: 40, origin: 'stored' },
    ]);
    expect(f.financial_allocations[0].category?.value).toBe('fc-1');
    expect(f.financial_allocations[0].center?.value).toBe('cc-1');

    const payload = buildMovementPurchasePayload({
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
      total_products: 100,
      freight: 0,
      other_values: 0,
      discount: 0,
      total: 100,
      items: d.items.map((i) => movementPurchaseItemDetailToForm(i)),
      ...f,
    });
    expect(payload.has_financial).toBe(true);
    expect(payload.financial).toEqual({
      number: '142',
      type_title_uuid: 'tt-1',
      proprietary_uuid: null,
      note: 'Compra lote 12',
      fiscal_document: true,
      classification: 'N',
      has_input: false,
      installments: [
        { due_date: '2026-11-01', amount: 60 },
        { due_date: '2026-12-01', amount: 40 },
      ],
      allocations: [
        {
          financial_category_uuid: 'fc-1',
          plan_account_uuid: null,
          cost_center_uuid: 'cc-1',
          value: 100,
          percent: 100,
        },
      ],
    });
  });

  it('compra sem financeiro reabre vazia', () => {
    const f = movementPurchaseFinancialToForm(detail({ has_financial: false, financial: null }));
    expect(f.has_financial).toBe(false);
    expect(f.financial_installments).toEqual([]);
    expect(f.financial_write_off).toBe(false);
  });

  it('com baixa: financial_write_off = true', () => {
    const d = detail();
    d.financial!.installments[0].has_write_off = true;
    expect(movementPurchaseFinancialToForm(d).financial_write_off).toBe(true);
  });
});

describe('D5 — Valor Unitário obrigatório e > 0', () => {
  const base = (valueUnit: number | null, writeOff = false) => ({
    dt_sale: '2026-10-01',
    provider_uuid: { label: 'F', value: 'p' },
    type_payment: { label: 'x', value: '01' },
    has_financial: false,
    financial_write_off: writeOff,
    items: [
      {
        category_uuid: { label: 'Boi', value: 'c' },
        quantity: 1,
        value_unit: valueUnit,
        amount: 0,
      },
    ],
  });

  it('0 → erro por linha com a mensagem traduzida', async () => {
    await expect(
      movementPurchaseSchema(lang).validate(base(0), { abortEarly: false })
    ).rejects.toMatchObject({
      inner: expect.arrayContaining([
        expect.objectContaining({
          path: 'items[0].value_unit',
          message: lang.movementPurchases.movementPurchase.form.validation.itemValueUnitMin,
        }),
      ]),
    });
  });

  it('vazio → obrigatório; positivo → ok', async () => {
    await expect(
      movementPurchaseSchema(lang).validate(base(null), { abortEarly: false })
    ).rejects.toMatchObject({
      inner: expect.arrayContaining([
        expect.objectContaining({
          message: lang.movementPurchases.movementPurchase.form.validation.itemValueUnitRequired,
        }),
      ]),
    });
    await expect(
      movementPurchaseSchema(lang).validate(base(1.5), { abortEarly: false })
    ).resolves.toBeTruthy();
  });

  it('bloco financeiro com baixa não é validado (parcelas divergentes não bloqueiam)', async () => {
    const data = {
      ...base(2, true),
      has_financial: true,
      total: 100,
      financial_installments: [{ due_date: '2026-11-01', amount: 10, origin: 'stored' }],
      financial_allocations: [
        {
          category: { label: 'a', value: 'a' },
          plan_account: null,
          center: null,
          percent: null,
          value: null,
        },
      ],
    };
    await expect(
      movementPurchaseSchema(lang).validate(data, { abortEarly: false })
    ).resolves.toBeTruthy();
    await expect(
      movementPurchaseSchema(lang).validate(
        { ...data, financial_write_off: false },
        { abortEarly: false }
      )
    ).rejects.toBeTruthy();
  });
});

describe('T6 — trava por processamento finalizado', () => {
  it('isMovementPurchaseLocked só é true com finished_processing === true', () => {
    expect(isMovementPurchaseLocked({ finished_processing: true } as MovementPurchaseDetail)).toBe(
      true
    );
    expect(isMovementPurchaseLocked({ finished_processing: false } as MovementPurchaseDetail)).toBe(
      false
    );
    expect(isMovementPurchaseLocked({} as MovementPurchaseDetail)).toBe(false);
    expect(isMovementPurchaseLocked(null)).toBe(false);
  });
});

describe('Tela de edição', () => {
  const text = lang.movementPurchases.movementPurchase.form;
  const body = () => document.body.textContent ?? '';
  const saveButton = () => document.querySelector('button[form="movement-purchase-form"]');

  it('mostra o responsável ORIGINAL (user do show), não o logado', async () => {
    showData = detail();
    renderPage();
    await waitFor(() => expect(body()).toContain('ORIGINAL'));
    expect(body()).not.toContain('LOGADO');
    expect(saveButton()).not.toBeNull();
    expect(body()).not.toContain(text.writeOffLockMessage);
  });

  it('parcela baixada: aviso D2, financeiro/itens travados, observação editável', async () => {
    showData = detail();
    showData.financial!.installments[0].has_write_off = true;
    renderPage();
    await waitFor(() => expect(body()).toContain(text.writeOffLockMessage));
    expect(
      document.querySelector('[data-testid="allocation"]')?.getAttribute('data-disabled')
    ).toBe('true');
    expect(
      (document.querySelector('input[name="items.0.quantity"]') as HTMLInputElement).disabled
    ).toBe(true);
    expect((document.querySelector('input[name="freight"]') as HTMLInputElement).disabled).toBe(
      true
    );
    expect((document.querySelector('textarea[name="note"]') as HTMLTextAreaElement).disabled).toBe(
      false
    );
    expect((document.querySelector('input[name="serie"]') as HTMLInputElement).disabled).toBe(
      false
    );
    expect(saveButton()).not.toBeNull();
  });

  it('processamento finalizado: aviso, tudo desabilitado e sem Salvar', async () => {
    showData = detail({ finished_processing: true });
    renderPage();
    await waitFor(() => expect(body()).toContain(text.finishedReadOnlyMessage));
    expect(saveButton()).toBeNull();
    expect((document.querySelector('textarea[name="note"]') as HTMLTextAreaElement).disabled).toBe(
      true
    );
    expect((document.querySelector('input[name="serie"]') as HTMLInputElement).disabled).toBe(true);
  });
});

describe('Forma de Pagamento/Observação condicionadas a Gerar Financeiro (088)', () => {
  const body = () => document.body.textContent ?? '';
  const payLabel = lang.movementPurchases.movementPurchase.form.fields.typePayment;
  const noteField = () => document.querySelector('textarea[name="note"]');

  it('com financeiro: campos visíveis, hidratados e ABAIXO de Gerar Financeiro', async () => {
    showData = detail({ note: 'obs da compra' });
    renderPage();
    await waitFor(() => expect(noteField()).not.toBeNull());
    expect((noteField() as HTMLTextAreaElement).value).toBe('obs da compra');
    expect(body()).toContain(payLabel);
    const hasFinancial = document.querySelector('[name="has_financial"]') as Element;
    expect(hasFinancial).not.toBeNull();
    expect(
      hasFinancial.compareDocumentPosition(noteField() as Element) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it('sem financeiro: campos ocultos', async () => {
    showData = detail({ has_financial: false, financial: null });
    renderPage();
    await waitFor(() => expect(body()).toContain('ORIGINAL'));
    expect(noteField()).toBeNull();
    expect(body()).not.toContain(payLabel);
  });

  it('schema: type_payment só é obrigatório com has_financial=true', async () => {
    const base = {
      dt_sale: '2026-10-01',
      provider_uuid: { label: 'F', value: 'p' },
      type_payment: null,
      financial_installments: [{ due_date: '2026-11-01', amount: 100, origin: 'manual' }],
      total: 100,
      items: [
        {
          category_uuid: { label: 'Boi', value: 'c' },
          quantity: 1,
          value_unit: 100,
          amount: 100,
        },
      ],
    };
    await expect(
      movementPurchaseSchema(lang).validate(
        { ...base, has_financial: false },
        { abortEarly: false }
      )
    ).resolves.toBeTruthy();
    await expect(
      movementPurchaseSchema(lang).validate({ ...base, has_financial: true }, { abortEarly: false })
    ).rejects.toMatchObject({
      inner: expect.arrayContaining([expect.objectContaining({ path: 'type_payment' })]),
    });
  });

  it('payload: sem financeiro omite type_payment; com financeiro envia', () => {
    const form = {
      code: '1',
      dt_sale: '2026-10-01',
      provider_uuid: { label: 'F', value: 'p-1' },
      seller_uuid: null,
      chave: null,
      serie: null,
      number: null,
      type_payment: null,
      gtas: '',
      note: '',
      total_products: 100,
      freight: 0,
      other_values: 0,
      discount: 0,
      total: 100,
      items: detail().items.map((i) => movementPurchaseItemDetailToForm(i)),
      ...emptyMovementPurchaseFinancialForm(),
    };
    const semFin = buildMovementPurchasePayload(form as never);
    expect('type_payment' in semFin && semFin.type_payment !== undefined).toBe(false);
    expect(semFin.financial).toBeUndefined();
    const comFin = buildMovementPurchasePayload({
      ...form,
      has_financial: true,
      type_payment: { label: 'x', value: '17' },
      financial_type_title: { label: 'Boleto', value: 'tt-1' },
      financial_installments: [{ due_date: '2026-11-01', amount: 100, origin: 'manual' }],
    } as never);
    expect(comFin.type_payment).toBe('17');
  });
});
