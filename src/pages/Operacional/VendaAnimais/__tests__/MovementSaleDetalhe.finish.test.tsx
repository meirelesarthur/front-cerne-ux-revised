// @vitest-environment jsdom
// UT-000719 / FE-T09 — Detalhe: botão Finalizar só com `mov_sale_edit` e status P; badge de status
// verde se F, laranja se P (reabertura pós-finalização mostra a venda como Finalizada, sem ação de
// finalizar). Superfícies S-719-07/S-719-17.
import { ChakraProvider } from '@chakra-ui/react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { languages } from '@/constants/languages';

import { makeSlaughterDetail, SALE_UUID } from './finish-fixtures';

const h = vi.hoisted(() => ({
  can: vi.fn(),
  detail: { current: null as unknown },
}));

vi.mock('@/hooks/useLanguage', async () => {
  const { languages: langs } = await import('@/constants/languages');
  return { useLanguage: () => ({ languageGB: langs.BR }) };
});
vi.mock('@/hooks/usePermissions', () => ({ usePermissions: () => ({ can: h.can }) }));
vi.mock('@chakra-ui/react', async (orig) => ({
  ...(await orig<typeof import('@chakra-ui/react')>()),
  // jsdom não resolve a paleta do Chakra: expõe a colorPalette como atributo para asserção.
  Badge: ({ children, colorPalette }: any) => (
    <span data-testid="status-badge" data-palette={colorPalette}>
      {children}
    </span>
  ),
}));
vi.mock('@/components/Button', () => ({
  Button: ({ title, onClick, disabled }: any) => (
    <button type="button" onClick={onClick} disabled={disabled}>
      {title}
    </button>
  ),
}));
vi.mock('@/components/Layout/FormContainer', () => ({
  FormContainer: ({ title, footer, children }: any) => (
    <section>
      <h1>{title}</h1>
      {children}
      <footer>{footer}</footer>
    </section>
  ),
}));
vi.mock('../MovementSaleLockBanners', () => ({
  isMovementSaleLocked: () => false,
  MovementSaleLockBanners: () => null,
}));
vi.mock('../useMovementSales', async (orig) => ({
  ...(await orig<typeof import('../useMovementSales')>()),
  useMovementSaleDetail: () => ({ data: h.detail.current, isLoading: false, isError: false }),
}));

import MovementSaleDetalhe from '../MovementSaleDetalhe';

const actions = languages.BR.movementSales.movementSale.list.actions;

function LocationProbe() {
  return <div data-testid="location">{useLocation().pathname}</div>;
}

function renderScreen() {
  return render(
    <ChakraProvider value={system}>
      <MemoryRouter initialEntries={[`/operacional/venda-animais/${SALE_UUID}`]}>
        <LocationProbe />
        <Routes>
          <Route path="/operacional/venda-animais/:saleUuid" element={<MovementSaleDetalhe />} />
          <Route path="*" element={null} />
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
});

describe('Detalhe', () => {
  it('botao Finalizar so com mov_sale_edit e status P; badge verde se F, laranja se P', () => {
    // P + mov_sale_edit => Finalizar visível, badge laranja, navega para /finalizar
    const pending = renderScreen();
    expect(screen.getByTestId('status-badge').getAttribute('data-palette')).toBe('orange');
    fireEvent.click(screen.getByRole('button', { name: actions.finish }));
    expect(screen.getByTestId('location').textContent).toBe(
      `/operacional/venda-animais/${SALE_UUID}/finalizar`
    );
    pending.unmount();

    // P sem mov_sale_edit => sem Finalizar (nem Editar)
    h.can.mockImplementation(() => false);
    const noPerm = renderScreen();
    expect(screen.queryByRole('button', { name: actions.finish })).toBeNull();
    expect(screen.queryByRole('button', { name: actions.edit })).toBeNull();
    noPerm.unmount();

    // F com mov_sale_edit => sem Finalizar, badge verde "Finalizada"
    h.can.mockImplementation((p: string) => p === 'mov_sale_edit');
    h.detail.current = makeSlaughterDetail({ status: 'F', status_label: 'Finalizada' });
    renderScreen();
    expect(screen.queryByRole('button', { name: actions.finish })).toBeNull();
    const badge = screen.getByTestId('status-badge');
    expect(badge.getAttribute('data-palette')).toBe('green');
    expect(badge.textContent).toBe('Finalizada');
  });
});
