// @vitest-environment jsdom
// src/pages/MeuPerfil/AccountSummaryCard.test.tsx
// Execução 071, TASK-071-FE-03 (FE03-T09, SRF-071-01a) — nome, e-mail,
// avatar (photoUrl ou iniciais), badge por role e badge da fazenda; sem
// fazenda ativa → sem badge (contrato de tela §3, D7).

import { ChakraProvider } from '@chakra-ui/react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

const mockUser: any = {
  username: 'Maria Silva',
  email: 'maria@exemplo.com',
  photoUrl: null,
};
let mockRoles: string[] = ['Gestor_Plataf'];
let mockFarmQuery: any = {
  data: { description: 'Fazenda Modelo' },
  isLoading: false,
  isError: false,
};

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: mockUser, roles: mockRoles }),
}));

vi.mock('@/hooks/useCurrentFarm', () => ({
  useCurrentFarm: () => mockFarmQuery,
}));

vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({
    languageGB: { common: { myProfile: { accountSummary: { title: 'Resumo da conta' } } } },
  }),
}));

import { AccountSummaryCard } from './AccountSummaryCard';

function renderCard() {
  return render(
    <ChakraProvider value={system}>
      <AccountSummaryCard />
    </ChakraProvider>
  );
}

describe('AccountSummaryCard — FE03-T09', () => {
  // Sem `cleanup()`, o RTL não desmonta entre `it`s neste projeto (sem
  // `@testing-library/jest-dom`/auto-cleanup — mirror
  // `GridSettingsFloatingPanel.test.tsx`), e os `render()` se acumulam no
  // mesmo `document.body`, duplicando texto entre testes.
  afterEach(() => {
    cleanup();
    mockRoles = ['Gestor_Plataf'];
    mockFarmQuery = { data: { description: 'Fazenda Modelo' }, isLoading: false, isError: false };
  });

  it('mostra nome, e-mail, badge de role e badge da fazenda', () => {
    renderCard();

    expect(screen.getByText('Maria Silva')).toBeTruthy();
    expect(screen.getByText('maria@exemplo.com')).toBeTruthy();
    expect(screen.getByText('Gestor_Plataf')).toBeTruthy();
    expect(screen.getByText('Fazenda Modelo')).toBeTruthy();
  });

  it('sem fazenda ativa (data undefined) → sem badge de fazenda', () => {
    mockFarmQuery = { data: undefined, isLoading: false, isError: false };
    renderCard();

    expect(screen.queryByText('Fazenda Modelo')).toBeNull();
  });

  it('erro ao buscar fazenda → omite o badge em silêncio', () => {
    mockFarmQuery = { data: undefined, isLoading: false, isError: true };
    renderCard();

    expect(screen.queryByText('Fazenda Modelo')).toBeNull();
  });

  it('sem roles → sem badges de perfil', () => {
    mockRoles = [];
    mockFarmQuery = { data: { description: 'Fazenda Modelo' }, isLoading: false, isError: false };
    renderCard();

    expect(screen.queryByText('Gestor_Plataf')).toBeNull();
  });
});
