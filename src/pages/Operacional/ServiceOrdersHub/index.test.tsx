// @vitest-environment jsdom
// Central de Trabalho e compras (OS desligada): dois cards levam direto ao Apontamento
// ou à Ordem de compra, e a jornada da ordem de compra fica na ajuda "Como funciona".
import { ChakraProvider } from '@chakra-ui/react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { languagePtBr } from '@/constants/languages/languagePtBr';

import ServiceOrdersHub from './index';

const lang = languagePtBr.BR;
const text = lang.serviceOrders.hub;
const navigate = vi.fn();
let allowed = true;

vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useNavigate: () => navigate,
}));
vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({ languageInUse: 'BR', languageGB: lang, updateLanguageGB: vi.fn() }),
}));
vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ can: () => allowed, canAny: () => allowed, canAll: () => allowed }),
}));

function renderHub() {
  return render(
    <ChakraProvider value={system}>
      <MemoryRouter>
        <ServiceOrdersHub />
      </MemoryRouter>
    </ChakraProvider>
  );
}

function card(title: string) {
  return screen.getByRole('button', { name: new RegExp(title) });
}

afterEach(() => {
  cleanup();
  navigate.mockReset();
  allowed = true;
});

describe('ServiceOrdersHub', () => {
  it('mostra só dois cards (apontamento e ordem de compra), sem botão Continuar', () => {
    renderHub();
    expect(screen.getByText(text.options.internal.destination)).toBeTruthy();
    expect(screen.getByText(text.options.purchase.destination)).toBeTruthy();
    expect(screen.queryByText(/Ordem de Serviço/i)).toBeNull();
    expect(screen.queryByRole('button', { name: 'Continuar' })).toBeNull();
  });

  it('cada card leva direto ao módulo certo', () => {
    renderHub();
    fireEvent.click(card(text.options.internal.title));
    expect(navigate).toHaveBeenLastCalledWith('/operacional/apontamentos/novo');
    fireEvent.click(card(text.options.purchase.title));
    expect(navigate).toHaveBeenLastCalledWith('/administrativo/solicitacao/novo');
  });

  it('a jornada só aparece na ajuda; a etapa Receber abre os recebimentos', async () => {
    renderHub();
    expect(screen.queryByText(text.help.journey.title)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: text.helpButton }));
    expect(await screen.findByText(text.help.journey.title)).toBeTruthy();
    fireEvent.click(
      screen.getByRole('tab', { name: new RegExp(text.help.journey.steps.receive.label) })
    );
    expect(screen.getByText(new RegExp(text.help.journey.steps.receive.who))).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: text.help.journey.steps.receive.open }));
    expect(navigate).toHaveBeenCalledWith('/administrativo/recebimentos');
  });

  it('sem permissão, os cards e os atalhos não aparecem', async () => {
    allowed = false;
    renderHub();
    expect(screen.queryByText(text.options.purchase.destination)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: text.helpButton }));
    expect(await screen.findByText(text.help.journey.title)).toBeTruthy();
    expect(screen.queryByText(text.help.shortcuts.title)).toBeNull();
  });
});
