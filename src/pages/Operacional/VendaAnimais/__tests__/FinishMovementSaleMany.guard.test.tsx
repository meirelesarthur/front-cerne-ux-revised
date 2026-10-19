// @vitest-environment jsdom
// UT-000719 / FE-T08 — guard do lote: exige só `can('mov_sale_edit')` (sem checagem de status no
// cliente; o servidor filtra Pendentes) e o submit emite PUT slaughter-many com `sale_uuids` e sem
// `type_payment`. Superfícies S-719-15/S-719-17.
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
vi.mock('@/components/Form/Textarea', async () => {
  const { forwardRef } = await import('react');
  return { Textarea: forwardRef<HTMLTextAreaElement, any>(() => <textarea aria-label="nota" />) };
});
vi.mock('@/components/Layout/FormContainer', () => ({
  FormContainer: ({ title, footer, children }: any) => (
    <section>
      <h1>{title}</h1>
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
// Schema (Yup) tem cobertura própria; aqui o resolver é pass-through para provar só o guard/submit.
vi.mock('@/validations/schemas/MovementSales/movement-sale-schema', async (orig) => ({
  ...(await orig<typeof import('@/validations/schemas/MovementSales/movement-sale-schema')>()),
  movementSaleFinishManySchemaResolver: () => async (values: unknown) => ({ values, errors: {} }),
}));
vi.mock('../useMovementSales', async (orig) => ({
  ...(await orig<typeof import('../useMovementSales')>()),
  useMovementSalesPendingSlaughterMany: () => ({
    data: h.details.current,
    isLoading: false,
    isError: false,
  }),
  useFinishMovementSaleMany: () => ({ mutate: h.mutate, isPending: false }),
}));

import FinishMovementSaleMany from '../FinishMovementSaleMany';

const finishManyText = languages.BR.movementSales.movementSale.finishMany;
const FISCAL = languages.BR.movementSales.movementSale.form.fields.fiscalDocument;

function renderScreen() {
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

describe('guard lote', () => {
  it('exige so mov_sale_edit; submit emite PUT slaughter-many com sale_uuids', async () => {
    // sem mov_sale_edit => sem botão "Finalizar lote" e campos desabilitados
    h.can.mockImplementation(() => false);
    const noPerm = renderScreen();
    await screen.findByLabelText(FISCAL);
    expect(screen.queryByRole('button', { name: finishManyText.submit })).toBeNull();
    expect((screen.getByLabelText(FISCAL) as HTMLSelectElement).disabled).toBe(true);
    noPerm.unmount();

    // só mov_sale_edit (sem mov_sale_view/outras) já habilita o lote
    h.can.mockImplementation((p: string) => p === 'mov_sale_edit');
    renderScreen();
    const submit = await screen.findByRole('button', { name: finishManyText.submit });
    expect((screen.getByLabelText(FISCAL) as HTMLSelectElement).disabled).toBe(false);

    fireEvent.change(screen.getByLabelText(FISCAL), { target: { value: 'false' } });
    fireEvent.click(submit);

    await waitFor(() => expect(h.mutate).toHaveBeenCalledTimes(1));
    const payload = h.mutate.mock.calls[0][0];
    expect(payload.sale_uuids).toEqual([SALE_UUID, SALE_UUID_2]);
    expect(payload).not.toHaveProperty('type_payment');
    expect(payload).toMatchObject({
      has_financial: true,
      financial: { fiscal_document: false },
    });
    // itens achatados das duas vendas (1 animal por venda no fixture)
    expect(payload.items).toHaveLength(2);
  });
});
