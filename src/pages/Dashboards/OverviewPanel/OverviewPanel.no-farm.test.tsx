// @vitest-environment jsdom
// src/pages/Dashboards/OverviewPanel/OverviewPanel.no-farm.test.tsx
// -----------------------------------------------------------------------------
// Execução 072 — decisão do dono de 2026-09-27 (altera DEC-362): a Home
// (`/home` → `OverviewPanel`) fica ACESSÍVEL ao contratante sem fazenda
// (`is_contractor && !has_farms`). Este teste prova que, para esse usuário
// (sem fazenda ativa → sem `X-Farm-Id`), a Home NÃO dispara nenhum endpoint
// farm-scoped (evita 403 `FARM_CONTEXT_REQUIRED` e toast/erro em loop) e
// mostra o estado honesto "Selecione uma fazenda" — mesmo no pior caso, com
// TODAS as permissões de bloco concedidas. `GET /me/farms` (não farm-scoped,
// já consumido pelo seletor do header) é o único dado lido.
// -----------------------------------------------------------------------------

import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { AuthContext } from '@/contexts/AuthContext';

import { getLanguageRouter } from '@/utils/get-language-route';

import { languageContextTypes } from '@/constants/languages';

import OverviewPanel from './index';

// jsdom desta suíte não expõe um `localStorage` funcional (mirror do stub de
// `src/components/NoFarmOnboardingGuard.test.tsx`) — `useLanguage` o lê.
class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length() {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

Object.defineProperty(window, 'localStorage', {
  value: new MemoryStorage(),
  writable: true,
  configurable: true,
});

const overviewMock = vi.fn();
const financialMock = vi.fn();
const stockMock = vi.fn();
const productMock = vi.fn();
const harvestsMock = vi.fn();
const incomeStatementMock = vi.fn();
const myFarmsMock = vi.fn();

vi.mock('@/services/v2/Dashboards/overviewPanel-service', () => ({
  getOverviewPanelOverview: (...args: unknown[]) => overviewMock(...args),
  getOverviewPanelFinancialSummary: (...args: unknown[]) => financialMock(...args),
  getOverviewPanelStockCoverage: (...args: unknown[]) => stockMock(...args),
  getOverviewPanelProductResult: (...args: unknown[]) => productMock(...args),
}));

vi.mock('@/services/v2/Harvests/harvest-service', () => ({
  listActiveHarvests: (...args: unknown[]) => harvestsMock(...args),
}));

vi.mock('@/services/v2/Relatorios/income-statement-report-service', () => ({
  getIncomeStatementPreview: (...args: unknown[]) => incomeStatementMock(...args),
}));

vi.mock('@/services/v2/Farms/farm-service', () => ({
  getMyFarms: (...args: unknown[]) => myFarmsMock(...args),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const ALL_BLOCK_PERMISSIONS = [
  'home_dashboard_view',
  'home_financial_dashboard_view',
  'incomestatement_view',
  'home_stock_dashboard_view',
  'home_product_result_view',
];

/**
 * Valor completo do `AuthContextType` para um contratante SEM fazenda.
 * @param {string | null} activeFarmUuid Fazenda ativa (null = sem `X-Farm-Id`).
 * @return {object} Valor do Provider.
 */
function buildContractorNoFarmAuth(activeFarmUuid: string | null) {
  const farmContext = { is_contractor: true, has_farms: false };
  return {
    isAuthenticated: true,
    loading: false,
    error: '',
    user: null,
    profile: { farm_context: farmContext } as never,
    permissions: ALL_BLOCK_PERMISSIONS,
    roles: ['Contratante'],
    favorites: [],
    activeFarmUuid,
    farmScopedPermissions: [],
    setActiveFarm: () => {},
    farmContext,
    markHasFarms: () => {},
    toggleFavorite: async () => {},
    twoFactorPending: null,
    signIn: async () => {},
    signOut: async () => {},
    clearError: () => {},
    refreshProfile: async () => {},
    verifyTwoFactor: async () => {},
    verifyTwoFactorBackup: async () => {},
    cancelTwoFactor: () => {},
    setSuppressLoadingOverlay: () => {},
  };
}

function renderPanel() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <ChakraProvider value={system}>
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={buildContractorNoFarmAuth(null)}>
          <MemoryRouter initialEntries={['/home']}>
            <OverviewPanel />
          </MemoryRouter>
        </AuthContext.Provider>
      </QueryClientProvider>
    </ChakraProvider>
  );
}

describe('Execução 072 — Home para contratante sem fazenda (decisão do dono 2026-09-27)', () => {
  it('mostra o estado "Selecione uma fazenda" e não chama nenhum endpoint farm-scoped', async () => {
    myFarmsMock.mockResolvedValue([]);
    const noFarmText = getLanguageRouter(languageContextTypes.BR).dashboards.common.noFarm;

    renderPanel();

    expect(await screen.findByText(noFarmText.title)).toBeTruthy();
    expect(screen.getByText(noFarmText.description)).toBeTruthy();

    // Único dado lido: `GET /me/farms` (não farm-scoped).
    await waitFor(() => expect(myFarmsMock).toHaveBeenCalled());

    expect(overviewMock).not.toHaveBeenCalled();
    expect(financialMock).not.toHaveBeenCalled();
    expect(stockMock).not.toHaveBeenCalled();
    expect(productMock).not.toHaveBeenCalled();
    expect(harvestsMock).not.toHaveBeenCalled();
    expect(incomeStatementMock).not.toHaveBeenCalled();
  });
});
