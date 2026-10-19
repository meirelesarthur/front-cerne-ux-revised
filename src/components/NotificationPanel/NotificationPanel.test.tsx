// @vitest-environment jsdom
// src/components/NotificationPanel/NotificationPanel.test.tsx
// T-081-FE-11 — sino global: lista só com `url`, contador total, marcar lida
// ao clicar (e navegar), marcar todas e estado vazio.

import { ChakraProvider } from '@chakra-ui/react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import type { NotificationItem } from '@/@types/v2/Notifications';

const navigateMock = vi.fn();
const markAsReadMutate = vi.fn();
const markAllMutate = vi.fn();

let mockItems: NotificationItem[] = [];
let mockUnread = 0;
let mockState: { isPending: boolean; isError: boolean } = { isPending: false, isError: false };

vi.mock('react-router-dom', () => ({ useNavigate: () => navigateMock }));

vi.mock('./useNotifications', () => ({
  useNotifications: () => ({
    notificationsQuery: {
      isPending: mockState.isPending,
      isError: mockState.isError,
      isFetching: false,
      refetch: vi.fn(),
    },
    items: mockItems,
    unreadCount: mockUnread,
    markAsRead: { mutate: markAsReadMutate, isPending: false },
    markAllAsRead: { mutate: markAllMutate, isPending: false },
  }),
}));

vi.mock('@/components/QueryErrorState', () => ({
  QueryErrorState: ({ message }: { message: string }) => <div>{message}</div>,
}));

vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({
    languageInUse: 'BR',
    languageGB: {
      defaltStrings: { notifications: 'Notificações', markAsReadToolTip: 'Marcar todas' },
      common: {
        navRail: {
          notificationsEmpty: 'Sem notificações',
          notificationsLoadError: 'Erro ao carregar',
          notificationsRetry: 'Tentar novamente',
          notificationsMarkAll: 'Marcar todas como lidas',
          notificationsUnreadLabel: 'não lidas',
        },
      },
    },
  }),
}));

import { NotificationPanel } from './index';

function item(id: string, url: string | null): NotificationItem {
  return { id, message: `Compras nº ${id} pendente`, url, created_at: '2026-10-01T10:00:00+00:00' };
}

function renderPanel() {
  render(
    <ChakraProvider value={system}>
      <NotificationPanel trigger={<button type="button">sino</button>} />
    </ChakraProvider>
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  mockItems = [];
  mockUnread = 0;
  mockState = { isPending: false, isError: false };
});

describe('NotificationPanel', () => {
  it('mostra o contador total mesmo quando só parte tem url e lista só as com url', async () => {
    mockItems = [item('1', 'https://spa/administrativo/compras?search=1'), item('2', null)];
    mockUnread = 5;
    renderPanel();

    expect(screen.getByLabelText('5 não lidas')).toBeTruthy();

    fireEvent.click(screen.getByText('sino'));
    expect(await screen.findByText('Compras nº 1 pendente')).toBeTruthy();
    expect(screen.queryByText('Compras nº 2 pendente')).toBeNull();
  });

  it('oculta o badge com contador 0 e mostra "Sem notificações"', async () => {
    renderPanel();
    expect(screen.queryByLabelText(/não lidas/)).toBeNull();

    fireEvent.click(screen.getByText('sino'));
    expect(await screen.findByText('Sem notificações')).toBeTruthy();
    expect(screen.queryByText('Marcar todas como lidas')).toBeNull();
  });

  it('clicar marca como lida e navega para a rota interna', async () => {
    mockItems = [item('abc', 'https://spa/administrativo/compras?search=0012')];
    mockUnread = 1;
    renderPanel();

    fireEvent.click(screen.getByText('sino'));
    fireEvent.click(await screen.findByText('Compras nº abc pendente'));

    expect(markAsReadMutate).toHaveBeenCalledWith('abc');
    expect(navigateMock).toHaveBeenCalledWith('/administrativo/compras?search=0012');
  });

  it('"Marcar todas como lidas" dispara a mutação', async () => {
    mockItems = [item('1', '/x')];
    mockUnread = 3;
    renderPanel();

    fireEvent.click(screen.getByText('sino'));
    fireEvent.click(await screen.findByText('Marcar todas como lidas'));

    expect(markAllMutate).toHaveBeenCalledTimes(1);
  });

  it('erro de carga mostra estado honesto, sem lista mockada', async () => {
    mockState = { isPending: false, isError: true };
    renderPanel();

    fireEvent.click(screen.getByText('sino'));
    expect(await screen.findByText('Erro ao carregar')).toBeTruthy();
  });
});
