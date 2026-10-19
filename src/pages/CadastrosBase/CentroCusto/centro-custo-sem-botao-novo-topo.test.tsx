// src/pages/CadastrosBase/CentroCusto/centro-custo-sem-botao-novo-topo.test.tsx
// -----------------------------------------------------------------------------
// OD-074-004 — decisão do dono 2026-09-28: o botão "Novo(a)" do cabeçalho
// (criava centro de TOPO, sem pai) e o CTA de criação de topo do empty state
// da listagem de Centros de Custo saem de vez, PARA TODOS OS PAPÉIS, inclusive
// Gestor_Plataf ("Botão novo na tela de centros de custo é pra sair de vez,
// não é pra aparecer nem para Gestor_Plataf"). Substitui o teste anterior
// (centro-custo-novo-topo-gestor-plataf.test.tsx, GAP-074-FE-EXE-01), que
// provava o oposto — que Gestor_Plataf via o botão.
//
// Este teste prova que NENHUM papel (contratante nem Gestor_Plataf) vê:
//   1. O botão "Novo(a)" do cabeçalho (`HeaderTable.tsx`);
//   2. O CTA de criação de topo do empty state (`index.tsx` → `Table`).
//
// "Cadastrar descendente" (ação de linha, `can_create_descendant`) NÃO muda e
// não é coberta aqui — fora de escopo desta correção.
// -----------------------------------------------------------------------------

import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
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

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { username: 'dev.teste' },
    profile: null,
    error: null,
    isAuthenticated: true,
    loading: false,
    activeFarmUuid: 'farm-uuid-1',
    signIn: vi.fn(),
    signOut: vi.fn(),
    refreshProfile: vi.fn(),
  }),
}));

const permissionsMock = vi.hoisted(() => ({
  can: vi.fn(() => true),
  hasRole: vi.fn(() => false),
}));

vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({
    permissions: [],
    can: permissionsMock.can,
    canAny: () => true,
    canAll: () => true,
    hasRole: permissionsMock.hasRole,
    hasFarm: true,
    isFarmScoped: () => false,
  }),
}));

const emptyCostCentersPage = {
  success: true,
  data: {
    items: [] as unknown[],
    pagination: { total: 0, count: 0, per_page: 10, current_page: 1, total_pages: 0 },
  },
};

vi.mock('@/services/v2/CostCenters/cost-center-service', () => ({
  listCostCenters: vi.fn(() => Promise.resolve(emptyCostCentersPage)),
  deleteCostCenter: vi.fn(),
  getCostCenter: vi.fn(),
  getCostCenterTree: vi.fn(),
  listCostCenterOptions: vi.fn(),
  listGlobalCostCenterOptions: vi.fn(),
  listCostCentersByCategory: vi.fn(),
  createCostCenter: vi.fn(),
  updateCostCenter: vi.fn(),
}));

import CentroCustoList from './index';

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ChakraProvider value={system}>
        <MemoryRouter initialEntries={['/cadastros-base/centros-custo']}>
          <Routes>
            <Route path="/cadastros-base/centros-custo" element={<CentroCustoList />} />
          </Routes>
        </MemoryRouter>
      </ChakraProvider>
    </QueryClientProvider>
  );
}

afterEach(() => {
  permissionsMock.can.mockReset().mockReturnValue(true);
  permissionsMock.hasRole.mockReset().mockReturnValue(false);
  cleanup();
});

describe('Centro de Custo — listagem — botão "Novo(a)" (criação de TOPO) removido para todos os papéis', () => {
  it.each([
    ['CONTRATANTE (hasRole=false)', false],
    ['Gestor_Plataf (hasRole=true)', true],
  ])(
    '%s NÃO vê "Novo(a)" no cabeçalho nem o CTA do empty state',
    async (_label, isGestorPlataf) => {
      permissionsMock.can.mockReturnValue(true);
      permissionsMock.hasRole.mockReturnValue(isGestorPlataf);

      renderPage();

      // Aguarda o fim do carregamento (empty state renderizado). Sem CTA de
      // criação, o empty state SEMPRE usa a variante "NoCreate", para
      // qualquer papel.
      await waitFor(() =>
        expect(
          screen.getByText(
            languagePtBr.BR.costCenters.costCenter.list.emptyState.titleEmptyNoCreate
          )
        ).toBeTruthy()
      );

      expect(screen.queryByRole('button', { name: languagePtBr.BR.defaltStrings.new })).toBeNull();
      expect(
        screen.queryByRole('button', {
          name: languagePtBr.BR.costCenters.costCenter.list.emptyState.cta,
        })
      ).toBeNull();
    }
  );
});
