// @vitest-environment jsdom
// UT-000719 / FE-T05 — campo "Documento Fiscal" (Select booleano Sim/Não, default Sim) em
// FinishMovementSale (individual) e FinishMovementSaleMany (lote): só renderiza com
// has_financial=true e some ao desligar. Superfícies S-719-04/05/06/14/15.
import { ChakraProvider } from '@chakra-ui/react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { languages } from '@/constants/languages';

import { makeSlaughterDetail, SALE_UUID, SALE_UUID_2 } from './finish-fixtures';

const h = vi.hoisted(() => ({
  can: vi.fn(),
  mutate: vi.fn(),
  detail: { current: null as unknown },
  details: { current: [] as unknown[] },
}));

vi.mock('@/hooks/useLanguage', async () => {
  const { languages: langs } = await import('@/constants/languages');
  return { useLanguage: () => ({ languageGB: langs.BR }) };
});
vi.mock('@/hooks/usePermissions', () => ({ usePermissions: () => ({ can: h.can }) }));
vi.mock('@/components/ui/toaster', () => ({
  toaster: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), create: vi.fn() },
}));
vi.mock('@/components/Button', () => ({
  Button: ({ title, onClick, disabled, type }: any) => (
    <button type={type ?? 'button'} onClick={onClick} disabled={disabled}>
      {title}
    </button>
  ),
}));
vi.mock('@/components/Form', () => ({
  Form: ({ children, onSubmit }: any) => <form onSubmit={onSubmit}>{children}</form>,
}));
vi.mock('@/components/Form/InputReadOnly', () => ({
  InputReadOnly: ({ label, value }: any) => (
    <div>
      {label}: {value}
    </div>
  ),
}));
vi.mock('@/components/Form/Textarea', async () => {
  const { forwardRef } = await import('react');
  return { Textarea: forwardRef<HTMLTextAreaElement, any>(() => <textarea aria-label="nota" />) };
});
vi.mock('@/components/Layout/FormContainer', () => ({
  FormContainer: ({ title, headerActions, footer, children }: any) => (
    <section>
      <h1>{title}</h1>
      {headerActions}
      {children}
      <footer>{footer}</footer>
    </section>
  ),
}));
vi.mock('@/components/Form/Select', () => ({
  Select: ({ label, name, value, options, onChange, isDisabled }: any) => (
    <label>
      {label}
      <select
        aria-label={label}
        name={name}
        disabled={isDisabled}
        value={String(value?.value)}
        onChange={(e) =>
          onChange(options.find((o: any) => String(o.value) === e.target.value) ?? null)
        }
      >
        {options.map((o: any) => (
          <option key={String(o.value)} value={String(o.value)}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  ),
}));
vi.mock('../MovementSaleItemsSection', () => ({
  MovementSaleItemsSection: () => <div data-testid="items-section" />,
}));
vi.mock('../MovementSaleCategoriesTab', () => ({
  MovementSaleCategoriesTab: () => <div data-testid="categories-tab" />,
}));
vi.mock('../MovementSaleTotalsBlock', () => ({
  MovementSaleTotalsBlock: () => <div data-testid="totals-block" />,
}));
vi.mock('../MovementSaleInstallmentsSection', () => ({
  MovementSaleInstallmentsSection: () => <div data-testid="installments-section" />,
}));
vi.mock('../MovementSaleIncomeAllocation', () => ({
  MovementSaleIncomeAllocation: () => <div data-testid="allocation-section" />,
}));
vi.mock('@/validations/schemas/MovementSales/movement-sale-schema', async (orig) => ({
  ...(await orig<typeof import('@/validations/schemas/MovementSales/movement-sale-schema')>()),
  movementSaleFinishSchemaResolver: () => async (values: unknown) => ({ values, errors: {} }),
  movementSaleFinishManySchemaResolver: () => async (values: unknown) => ({ values, errors: {} }),
}));
vi.mock('../useMovementSales', async (orig) => {
  const { useEffect } = await import('react');
  return {
    ...(await orig<typeof import('../useMovementSales')>()),
    useMovementSaleFinishForm: ({ registrationId, fillForm }: any) => {
      useEffect(() => {
        if (registrationId) fillForm(h.detail.current);
      }, [registrationId]);
      return { isLoading: false, isPending: false, isError: false };
    },
    useMovementSalePaymentTypeOptions: () => ({ data: undefined, isError: true, isPending: false }),
    useFinishMovementSale: () => ({ mutate: h.mutate, isPending: false }),
    useMovementSalesPendingSlaughterMany: () => ({
      data: h.details.current,
      isLoading: false,
      isError: false,
    }),
    useFinishMovementSaleMany: () => ({ mutate: h.mutate, isPending: false }),
  };
});

import FinishMovementSale from '../FinishMovementSale';
import FinishMovementSaleMany from '../FinishMovementSaleMany';

const formText = languages.BR.movementSales.movementSale.form;
const FISCAL = formText.fields.fiscalDocument;
const HAS_FINANCIAL = formText.fields.hasFinancial;

function renderIndividual() {
  return render(
    <ChakraProvider value={system}>
      <MemoryRouter initialEntries={[`/operacional/venda-animais/${SALE_UUID}/finalizar`]}>
        <Routes>
          <Route
            path="/operacional/venda-animais/:saleUuid/finalizar"
            element={<FinishMovementSale />}
          />
        </Routes>
      </MemoryRouter>
    </ChakraProvider>
  );
}

function renderMany() {
  return render(
    <ChakraProvider value={system}>
      <MemoryRouter
        initialEntries={[
          `/operacional/venda-animais/finalizar-lote?ids=${SALE_UUID},${SALE_UUID_2}`,
        ]}
      >
        <Routes>
          <Route
            path="/operacional/venda-animais/finalizar-lote"
            element={<FinishMovementSaleMany />}
          />
        </Routes>
      </MemoryRouter>
    </ChakraProvider>
  );
}

beforeEach(() => {
  h.can.mockImplementation((p: string) => p === 'mov_sale_edit');
  h.detail.current = makeSlaughterDetail();
  h.details.current = [
    makeSlaughterDetail(),
    makeSlaughterDetail({ uuid: SALE_UUID_2, code: '1002' }),
  ];
});

afterEach(() => {
  cleanup();
  h.can.mockReset();
  h.mutate.mockReset();
});

describe('Documento Fiscal', () => {
  it('renderiza só com has_financial=true, default Sim, em individual e lote', async () => {
    for (const [name, renderScreen] of [
      ['individual', renderIndividual],
      ['lote', renderMany],
    ] as const) {
      const { unmount } = renderScreen();

      // default: has_financial=true => campo presente, com Sim selecionado
      const fiscal = (await screen.findByLabelText(FISCAL)) as HTMLSelectElement;
      expect(fiscal.value, `${name}: default Sim`).toBe('true');
      expect(
        Array.from(fiscal.options).map((o) => o.text),
        `${name}: opções i18n`
      ).toEqual([languages.BR.defaltStrings.yes, languages.BR.defaltStrings.no]);
      expect(screen.getByTestId('installments-section')).toBeTruthy();
      expect(screen.getByTestId('allocation-section')).toBeTruthy();

      // has_financial=Não => desmonta campo e seções financeiras
      fireEvent.change(screen.getByLabelText(HAS_FINANCIAL), { target: { value: 'false' } });
      await waitFor(() => expect(screen.queryByLabelText(FISCAL), `${name}: oculto`).toBeNull());
      expect(screen.queryByTestId('installments-section')).toBeNull();
      expect(screen.queryByTestId('allocation-section')).toBeNull();

      // has_financial=Sim de novo => campo volta
      fireEvent.change(screen.getByLabelText(HAS_FINANCIAL), { target: { value: 'true' } });
      expect(await screen.findByLabelText(FISCAL)).toBeTruthy();

      unmount();
    }
  });

  it('reidrata Não a partir de incomes[0].fiscal_document=false (individual e lote)', async () => {
    const withIncome = (over: Record<string, unknown> = {}) =>
      makeSlaughterDetail({
        incomes: [{ fiscal_document: false }] as any,
        ...over,
      });
    h.detail.current = withIncome();
    h.details.current = [withIncome(), withIncome({ uuid: SALE_UUID_2, code: '1002' })];

    for (const renderScreen of [renderIndividual, renderMany]) {
      const { unmount } = renderScreen();
      const fiscal = (await screen.findByLabelText(FISCAL)) as HTMLSelectElement;
      await waitFor(() => expect(fiscal.value).toBe('false'));
      unmount();
    }
  });
});
