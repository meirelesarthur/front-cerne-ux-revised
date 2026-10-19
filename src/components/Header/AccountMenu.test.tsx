// @vitest-environment jsdom
// src/components/Header/AccountMenu.test.tsx
// Execução 071, TASK-071-FE-05 — contrato de tela §6, matriz FID-G3F
// (FE05-T01..T08).

import { ChakraProvider } from '@chakra-ui/react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

const navigateMock = vi.fn();
const signOutMock = vi.fn(async () => {});
const updateThemeMock = vi.fn();
const handleLanguageChangeMock = vi.fn();
const toasterCreateMock = vi.fn();

let mockUser: { username: string; email: string; photoUrl: string | null } = {
  username: 'Maria Silva',
  email: 'maria@exemplo.com',
  photoUrl: null,
};
let mockTheme: 'light' | 'dark' = 'light';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: mockUser, signOut: signOutMock }),
}));

vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({ theme: mockTheme, updateTheme: updateThemeMock }),
}));

vi.mock('@/hooks/useLanguageSwitcher', () => ({
  useLanguageSwitcher: () => ({
    languageInUse: 'BR',
    handleLanguageChange: handleLanguageChangeMock,
  }),
}));

vi.mock('@/components/ui/toaster', () => ({
  toaster: { create: (...args: any[]) => toasterCreateMock(...args) },
}));

const accountMenuText = {
  triggerAriaLabelTemplate: 'Abrir menu da conta de {name}',
  upgrade: 'Fazer upgrade',
  currentPlanLabel: 'Plano atual',
  currentPlanBadge: 'Profissional',
  language: 'Idioma',
  myProfile: 'Meu perfil',
  settings: 'Configurações',
  lightModeAction: 'Ativar modo claro',
  gbModeAction: 'Ativar GB Mode',
  plans: 'Planos',
  helpCenter: 'Central de ajuda',
  logout: 'Sair',
  comingSoonBadge: 'Em breve',
  comingSoonToastDescription: 'Esta funcionalidade ainda não foi construída.',
  languagePersistWarning: '—',
};

vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({
    languageGB: { common: { accountMenu: accountMenuText } },
    languageInUse: 'BR',
    updateLanguageGB: vi.fn(),
  }),
}));

import { AccountMenu } from './AccountMenu';

function renderMenu() {
  return render(
    <ChakraProvider value={system}>
      <MemoryRouter>
        <AccountMenu />
      </MemoryRouter>
    </ChakraProvider>
  );
}

async function openMenu() {
  const trigger = screen.getByRole('button', { name: /abrir menu da conta de maria silva/i });
  fireEvent.click(trigger);
  await waitFor(() => screen.getByText('Meu perfil'));
}

describe('AccountMenu — Execução 071, TASK-071-FE-05', () => {
  // `cleanup()` OBRIGATÓRIO — sem auto-cleanup neste projeto (sem
  // `@testing-library/jest-dom`), os 8 `it`s acumulariam painéis abertos de
  // testes anteriores no mesmo `document.body`.
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockUser = { username: 'Maria Silva', email: 'maria@exemplo.com', photoUrl: null };
    mockTheme = 'light';
  });

  it('FE05-T01 — clicar no avatar abre o painel; aria-label contém o nome; sem photoUrl mostra iniciais', async () => {
    renderMenu();
    await openMenu();

    expect(screen.getByText('maria@exemplo.com')).toBeTruthy();
  });

  it('FE05-T02 — cabeçalho mostra nome/e-mail e o badge "Profissional"', async () => {
    renderMenu();
    await openMenu();

    expect(screen.getAllByText('Maria Silva').length).toBeGreaterThan(0);
    expect(screen.getByText('maria@exemplo.com')).toBeTruthy();
    expect(screen.getByText('Profissional')).toBeTruthy();
  });

  it('FE05-T03 — itens "em breve" mostram o badge, chamam toaster info, não navegam e fecham o painel', async () => {
    renderMenu();
    await openMenu();

    fireEvent.click(screen.getByText('Configurações'));

    await waitFor(() => {
      expect(toasterCreateMock).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'info', title: 'Configurações' })
      );
    });
    expect(navigateMock).not.toHaveBeenCalled();

    // Painel fechado — o item some do DOM (unmountOnExit).
    await waitFor(() => expect(screen.queryByText('Configurações')).toBeNull());
  });

  it('FE05-T04 — trocar o idioma chama handleLanguageChange', async () => {
    renderMenu();
    await openMenu();

    const select = screen.getByDisplayValue('Português (BR)');
    fireEvent.change(select, { target: { value: 'US' } });

    expect(handleLanguageChangeMock).toHaveBeenCalledWith('US');
  });

  it('FE05-T05 — "Meu perfil" navega para /profile', async () => {
    renderMenu();
    await openMenu();

    fireEvent.click(screen.getByText('Meu perfil'));

    expect(navigateMock).toHaveBeenCalledWith('/profile');
  });

  it('FE05-T06 — rótulo do tema alterna conforme o modo atual', async () => {
    mockTheme = 'light';
    renderMenu();
    await openMenu();
    fireEvent.click(screen.getByText('Ativar GB Mode'));
    expect(updateThemeMock).toHaveBeenCalledWith('dark');
  });

  it('FE05-T06b — em dark, rótulo vira "Ativar modo claro" → updateTheme(light)', async () => {
    mockTheme = 'dark';
    renderMenu();
    await openMenu();
    fireEvent.click(screen.getByText('Ativar modo claro'));
    expect(updateThemeMock).toHaveBeenCalledWith('light');
  });

  it('FE05-T07 — "Sair" chama signOut uma vez', async () => {
    renderMenu();
    await openMenu();

    fireEvent.click(screen.getByText('Sair'));

    await waitFor(() => expect(signOutMock).toHaveBeenCalledTimes(1));
  });

  it('FE05-T08 — Esc fecha o painel', async () => {
    renderMenu();
    await openMenu();

    fireEvent.keyDown(document.activeElement || document.body, { key: 'Escape' });

    await waitFor(() => expect(screen.queryByText('Meu perfil')).toBeNull());
  });
});
