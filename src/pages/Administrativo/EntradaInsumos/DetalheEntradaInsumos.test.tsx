// T-078-FE-05/06 — Detalhe da Entrada mostra os NOMES (não uuid, não "Não informado").

import { StrictMode } from 'react';

import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { languagePtBr } from '@/constants/languages/languagePtBr';

const UUID = '11111111-1111-4111-8111-111111111111';
const SAVED = '01a0eff8-7927-7157-831a-000000000009';

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

const detail = {
  uuid: UUID,
  code: 'EI-0001',
  date: '2026-09-15',
  note: 'Nota',
  total_amount: 150,
  farm: { uuid: 'f1', description: 'Fazenda Teste' },
  proprietary: { uuid: 'p1', name: 'Proprietário Teste' },
  user: { uuid: 'u1', name: 'dev.teste' },
  harvest: { uuid: SAVED, description: 'Safra 2026/2027' },
  movement: null,
  items: [
    {
      uuid: 'i1',
      product: { uuid: 'pr1', description: 'Produto Teste', has_lot: false },
      measurement: { uuid: SAVED, description: 'KG' },
      quantity: 10,
      unit_value: 15,
      total_value: 150,
      generate_stock: false,
      warehouse: null,
      appropriation_type: null,
      provider_lot: null,
      lot: null,
      shelf_life: null,
      cultivation: { uuid: SAVED, name: 'Soja' },
      category: { uuid: 'c1', description: 'Nitrogênio' },
      center: { uuid: SAVED, code: '01.02', description: 'Lavoura' },
    },
  ],
};

vi.mock('@/services/v2/InputEntries/input-entry-service', () => ({
  getInputEntry: vi.fn(() => Promise.resolve({ data: detail })),
}));

import DetalheEntradaInsumos from './DetalheEntradaInsumos';

describe('DetalheEntradaInsumos — labels (DD-078-03)', () => {
  afterEach(() => cleanup());

  it('exibe Safra, Un. Medida, Classificação e CC com nome, sem uuid', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { container } = render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <ChakraProvider value={system}>
            <MemoryRouter initialEntries={[`/administrativo/entrada-insumos/${UUID}/detalhe`]}>
              <Routes>
                <Route
                  path="/administrativo/entrada-insumos/:uuid/detalhe"
                  element={<DetalheEntradaInsumos />}
                />
              </Routes>
            </MemoryRouter>
          </ChakraProvider>
        </QueryClientProvider>
      </StrictMode>
    );

    await waitFor(() => {
      expect(screen.getAllByText('Safra 2026/2027').length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText('KG').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Soja').length).toBeGreaterThan(0);
    expect(screen.getAllByText('01.02 — Lavoura').length).toBeGreaterThan(0);

    expect(container.textContent ?? '').not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-/);
  });

  // 078 R2 — datas ISO (AAAA-MM-DD) da API são exibidas como dd/mm/aaaa.
  it('exibe a data como dd/mm/aaaa (subtítulo e campo Data), nunca AAAA-MM-DD', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { container } = render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <ChakraProvider value={system}>
            <MemoryRouter initialEntries={[`/administrativo/entrada-insumos/${UUID}/detalhe`]}>
              <Routes>
                <Route
                  path="/administrativo/entrada-insumos/:uuid/detalhe"
                  element={<DetalheEntradaInsumos />}
                />
              </Routes>
            </MemoryRouter>
          </ChakraProvider>
        </QueryClientProvider>
      </StrictMode>
    );

    await waitFor(() => {
      expect(screen.getAllByText('Safra 2026/2027').length).toBeGreaterThan(0);
    });
    expect(container.textContent ?? '').toContain('15/09/2026');
    expect(container.textContent ?? '').not.toContain('2026-09-15');
  });
});
