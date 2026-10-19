// @vitest-environment jsdom
// Execução 086, FE-03 — lista de Avaliações: ação da linha "Avaliar" quando
// status 3 e "Visualizar" nos demais (mesma rota, que decide leitura/ação).
import { ReactNode } from 'react';

import { ChakraProvider } from '@chakra-ui/react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { languagePtBr } from '@/constants/languages/languagePtBr';

const lang = languagePtBr.BR;
const navigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useNavigate: () => navigate,
}));
vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({ languageInUse: 'BR', languageGB: lang, updateLanguageGB: vi.fn() }),
}));
vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ can: () => true, canAny: () => true, canAll: () => true }),
}));
vi.mock('@/hooks/useGridStorageScope', () => ({ useGridStorageScope: () => 'test' }));
vi.mock('@/hooks/usePaginatedQueryStorage', () => ({
  userPaginatedQuery: () => ({
    paginatedQuery: { page: 1, pageSize: 10, filter: undefined },
    handlePaginatedQuery: vi.fn(),
    handleFilterChange: vi.fn(),
    handleResetFilter: vi.fn(),
  }),
}));
// Menu do Chakra abre em Portal; aqui as ações são renderizadas inline.
vi.mock('@/components/Action', () => ({
  Actions: Object.assign(({ children }: { children: ReactNode }) => <div>{children}</div>, {
    Item: ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => (
      <button type="button" onClick={onClick}>
        {children}
      </button>
    ),
  }),
}));

const UUID_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const UUID_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const row = (uuid: string, code: string, value: number, label: string) => ({
  uuid,
  code,
  dt_emission: '2026-09-01',
  deadline: '2026-09-10',
  status: { value, label, color: '#999999' },
  user: { uuid: 'u1', name: 'Solicitante' },
  executor: { uuid: 'u2', name: 'Executor' },
});
const items = [
  row(UUID_A, 'OS-1', 3, 'Concluída'),
  row(UUID_B, 'OS-2', 4, 'Avaliado'),
  row('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'OS-3', 9, 'Cancelada'),
];

vi.mock('./useRatingServiceOrders', () => ({
  useRatingServiceOrdersList: () => ({
    data: { data: { items } },
    isLoading: false,
    isFetching: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

import List from './index';

describe('Avaliações — ações da linha (086)', () => {
  afterEach(() => {
    cleanup();
    navigate.mockReset();
  });

  it('Avaliar para status 3 e Visualizar para status 4/9, ambos na mesma rota', () => {
    render(
      <ChakraProvider value={system}>
        <MemoryRouter>
          <List />
        </MemoryRouter>
      </ChakraProvider>
    );

    const actLabel = lang.ratingServiceOrders.ratingServiceOrder.list.actions.rate;
    const viewLabel = lang.ratingServiceOrders.ratingServiceOrder.list.actions.view;
    const actButtons = screen.getAllByRole('button', { name: actLabel });
    const viewButtons = screen.getAllByRole('button', { name: viewLabel });
    expect(actButtons).toHaveLength(1);
    expect(viewButtons).toHaveLength(2);

    fireEvent.click(actButtons[0]);
    expect(navigate).toHaveBeenLastCalledWith('/operacional/avaliacoes/' + UUID_A);
    fireEvent.click(viewButtons[0]);
    expect(navigate).toHaveBeenLastCalledWith('/operacional/avaliacoes/' + UUID_B);
  });
});
