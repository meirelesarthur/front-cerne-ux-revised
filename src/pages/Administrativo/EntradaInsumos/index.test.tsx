// 078 R2 — a listagem exibe a data da Entrada de Insumos como dd/mm/aaaa.
import { StrictMode } from 'react';

import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { languagePtBr } from '@/constants/languages/languagePtBr';

vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({
    languageInUse: 'BR',
    languageGB: languagePtBr.BR,
    updateLanguageGB: vi.fn(),
  }),
}));
vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({
    permissions: [],
    can: () => true,
    canAny: () => true,
    canAll: () => true,
    hasRole: () => false,
    hasFarm: true,
    isFarmScoped: () => false,
  }),
}));

vi.mock('@/services/v2/InputEntries/input-entry-service', () => ({
  deleteInputEntry: vi.fn(),
  listInputEntries: vi.fn(() =>
    Promise.resolve({
      data: {
        items: [
          {
            uuid: '11111111-1111-4111-8111-111111111111',
            code: 'EI-0001',
            date: '2026-09-30',
            farm: { uuid: 'f1', description: 'Fazenda Teste' },
            proprietary: { uuid: 'p1', name: 'Proprietário Teste' },
            user: { uuid: 'u1', name: 'dev.teste' },
            total_amount: 150,
          },
        ],
        pagination: { total: 1, count: 1, per_page: 10, current_page: 1, total_pages: 1 },
      },
    })
  ),
}));

import EntradaInsumosList from './index';

describe('EntradaInsumosList — data (078 R2)', () => {
  afterEach(() => cleanup());

  it('exibe 30/09/2026 e não 2026-09-30 na coluna Data', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { container } = render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <ChakraProvider value={system}>
            <MemoryRouter>
              <EntradaInsumosList />
            </MemoryRouter>
          </ChakraProvider>
        </QueryClientProvider>
      </StrictMode>
    );
    await waitFor(() => {
      expect(screen.getAllByText('EI-0001').length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText('30/09/2026').length).toBeGreaterThan(0);
    expect(container.textContent ?? '').not.toContain('2026-09-30');
  });
});
