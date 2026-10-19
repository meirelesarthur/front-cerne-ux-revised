// @vitest-environment jsdom
// UT-000719 / FE-T06 — guard individual: `can('mov_sale_edit') && status === 'P'`. Sem a permissão ou
// com status diferente de P o botão Finalizar não existe e os campos ficam desabilitados; com o guard
// satisfeito o submit emite a mutation (PUT slaughter) com o payload completo — a inversão de
// `isEmpty()` (ERRO-FE-001) não pode descartar a finalização. Superfícies S-719-14/S-719-17.
import { ChakraProvider } from '@chakra-ui/react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { languages } from '@/constants/languages';

import { makeSlaughterDetail, SALE_UUID } from './finish-fixtures';

const h = vi.hoisted(() => ({
  can: vi.fn(),
  mutate: vi.fn(),
  detail: { current: null as unknown },
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
// Schema (Yup) tem cobertura própria; aqui o resolver é pass-through para provar só o guard/submit.
vi.mock('@/validations/schemas/MovementSales/movement-sale-schema', async (orig) => ({
  ...(await orig<typeof import('@/validations/schemas/MovementSales/movement-sale-schema')>()),
  movementSaleFinishSchemaResolver: () => async (values: unknown) => ({ values, errors: {} }),
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
  };
});

import FinishMovementSale from '../FinishMovementSale';

const finishText = languages.BR.movementSales.movementSale.finish;
const FISCAL = languages.BR.movementSales.movementSale.form.fields.fiscalDocument;

function renderScreen() {
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

beforeEach(() => {
  h.can.mockImplementation((p: string) => p === 'mov_sale_edit');
  h.detail.current = makeSlaughterDetail();
});

afterEach(() => {
  cleanup();
  h.can.mockReset();
  h.mutate.mockReset();
});

describe('guard individual', () => {
  it('bloqueia sem mov_sale_edit ou status diferente de P; submit emite PUT slaughter (isEmpty nao descarta)', async () => {
    // 1) sem mov_sale_edit => sem botão Finalizar e campos desabilitados
    h.can.mockImplementation(() => false);
    const noPerm = renderScreen();
    await screen.findByText(finishText.headerSummary.code, { exact: false });
    expect(screen.queryByRole('button', { name: finishText.submit })).toBeNull();
    expect((screen.getByLabelText(FISCAL) as HTMLSelectElement).disabled).toBe(true);
    noPerm.unmount();

    // 2) com permissão mas venda Finalizada (status F) => bloqueado igualmente
    h.can.mockImplementation((p: string) => p === 'mov_sale_edit');
    h.detail.current = makeSlaughterDetail({ status: 'F', status_label: 'Finalizada' });
    const finished = renderScreen();
    await screen.findByText('Finalizada');
    expect(screen.queryByRole('button', { name: finishText.submit })).toBeNull();
    expect((screen.getByLabelText(FISCAL) as HTMLSelectElement).disabled).toBe(true);
    finished.unmount();

    // 3) guard satisfeito (permissão + status P) => botão presente e submit emite a mutation
    h.detail.current = makeSlaughterDetail();
    renderScreen();
    const submit = await screen.findByRole('button', { name: finishText.submit });
    expect((screen.getByLabelText(FISCAL) as HTMLSelectElement).disabled).toBe(false);

    fireEvent.change(screen.getByLabelText(FISCAL), { target: { value: 'false' } });
    fireEvent.click(submit);

    await waitFor(() => expect(h.mutate).toHaveBeenCalledTimes(1));
    const arg = h.mutate.mock.calls[0][0];
    expect(arg.uuid).toBe(SALE_UUID);
    expect(arg.payload).toMatchObject({
      has_financial: true,
      items: [{ animal_uuid: 'animal-1' }],
      financial: { fiscal_document: false },
    });
    expect(arg.payload).not.toHaveProperty('sale_uuids');
  });
});
