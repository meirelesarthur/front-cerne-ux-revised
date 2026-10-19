// @vitest-environment jsdom
// src/components/NoFarmOnboardingGuard.test.tsx
// TASK-072-FE-11 (DEC-362) — guard "contratante sem fazenda" com o
// `AuthProvider` REAL (só `auth-service` mockado): rota bloqueada devolve o
// `<Navigate replace>` para Fazendas SEM montar o filho; após `markHasFarms()`
// (integração FE-09) a mesma rota renderiza sem novo login.

import { useEffect } from 'react';

import { ChakraProvider } from '@chakra-ui/react';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import {
  MemoryRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

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

const getUserProfileMock = vi.fn();
const saveUserMock = vi.fn();
const saveAccessTokenMock = vi.fn();
const clearAuthStorageMock = vi.fn();
const getAccessTokenMock = vi.fn();
const logoutMock = vi.fn();
const updateFavoritesMock = vi.fn();

getAccessTokenMock.mockReturnValue(null);

vi.mock('@/services/v2/Auth/auth-service', () => ({
  getUserProfile: (...args: any[]) => getUserProfileMock(...args),
  saveUser: (...args: any[]) => saveUserMock(...args),
  saveAccessToken: (...args: any[]) => saveAccessTokenMock(...args),
  clearAuthStorage: (...args: any[]) => clearAuthStorageMock(...args),
  getAccessToken: (...args: any[]) => getAccessTokenMock(...args),
  logout: (...args: any[]) => logoutMock(...args),
  updateFavorites: (...args: any[]) => updateFavoritesMock(...args),
}));

vi.mock('@/services/v2/Auth/two-factor-service', () => ({
  verifyTwoFactorCode: vi.fn(),
  verifyTwoFactorBackupCode: vi.fn(),
}));

// Modo cookie (não-token): `verifySession()` sempre chama `getUserProfile()`
// no mount, independente de token salvo.
vi.mock('@/config/env', () => ({
  IS_TOKEN_AUTH: false,
  IS_COOKIE_AUTH: true,
}));

// `Loading` (renderizado enquanto `loading===true`) usa `useLanguage()` só
// para o texto do spinner — stub mínimo.
vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({
    languageGB: { defaltStrings: { loading: 'Carregando...' } },
    languageInUse: 'BR',
    updateLanguageGB: vi.fn(),
  }),
}));

import { AuthProvider } from '@/contexts/AuthContext';

import { useAuth } from '@/hooks/useAuth';

import { NO_FARM_NOTICE_STATE_KEY } from '@/constants/routes/no-farm-allowed-routes';

import { NoFarmOnboardingGuard } from './NoFarmOnboardingGuard';
import { PrivateRoute } from './PrivateRoute';

function makeEnvelope(data: unknown) {
  return { data: { success: true, message: null, data, errors: null, meta: null } };
}

function makeProfile(overrides: Record<string, unknown> = {}) {
  return {
    uuid: 'u-1',
    name: 'Contratante 629',
    email: 'c629@exemplo.com',
    photo_url: null,
    roles: ['Contratante'],
    permissions: [],
    favorites: [],
    farm_context: { is_contractor: true, has_farms: false },
    ...overrides,
  };
}

const homeRenderSpy = vi.fn();

function HomeContent() {
  homeRenderSpy();
  return <div>HOME CONTENT</div>;
}

// Rota privada fora da allowlist (qualquer tela operacional farm-scoped).
const BLOCKED_PATH = '/financeiro/contas-pagar';
const blockedRenderSpy = vi.fn();

function BlockedContent() {
  blockedRenderSpy();
  return <div>BLOCKED CONTENT</div>;
}

let exposed: { markHasFarms: () => void; goBlocked: () => void } | null = null;

function FarmsPage() {
  const { markHasFarms } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const notice = Boolean(
    (location.state as Record<string, unknown> | null)?.[NO_FARM_NOTICE_STATE_KEY]
  );
  useEffect(() => {
    exposed = { markHasFarms, goBlocked: () => navigate(BLOCKED_PATH) };
  }, [markHasFarms, navigate]);
  return <div>FARMS PAGE{notice ? ' WITH NOTICE' : ''}</div>;
}

function renderApp(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <ChakraProvider value={system}>
        <AuthProvider>
          <Routes>
            {/* Mesma composição do app: PrivateRoute (não renderiza nada
                durante o loading) → layout → guard em volta do Outlet. */}
            <Route
              element={
                <PrivateRoute>
                  <NoFarmOnboardingGuard>
                    <Outlet />
                  </NoFarmOnboardingGuard>
                </PrivateRoute>
              }
            >
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/home" element={<HomeContent />} />
              <Route path="/home/sub" element={<BlockedContent />} />
              <Route path={BLOCKED_PATH} element={<BlockedContent />} />
              <Route path="/cadastros-base/fazendas" element={<FarmsPage />} />
              <Route path="/cadastros-base/centros-custo" element={<div>CENTROS CUSTO</div>} />
            </Route>
          </Routes>
        </AuthProvider>
      </ChakraProvider>
    </MemoryRouter>
  );
}

describe('TASK-072-FE-11 — NoFarmOnboardingGuard', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    exposed = null;
  });

  it('rota bloqueada: redireciona para Fazendas com aviso e NÃO renderiza o filho', async () => {
    getUserProfileMock.mockResolvedValueOnce(makeEnvelope(makeProfile()));
    renderApp(BLOCKED_PATH);

    await waitFor(() => expect(screen.getByText('FARMS PAGE WITH NOTICE')).toBeTruthy());
    expect(screen.queryByText('BLOCKED CONTENT')).toBeNull();
    // Sem flash: o conteúdo da rota bloqueada NUNCA montou (nem durante o
    // loading — PrivateRoute — nem depois — guard devolve o Navigate).
    expect(blockedRenderSpy).not.toHaveBeenCalled();
  });

  it('Home liberada (decisão do dono 2026-09-27): contratante sem fazenda abre /home sem redirect', async () => {
    getUserProfileMock.mockResolvedValueOnce(makeEnvelope(makeProfile()));
    renderApp('/home');

    await waitFor(() => expect(screen.getByText('HOME CONTENT')).toBeTruthy());
    expect(screen.queryByText(/FARMS PAGE/)).toBeNull();
  });

  it('raiz `/` (redirect para /home) também chega à Home sem desviar para Fazendas', async () => {
    getUserProfileMock.mockResolvedValueOnce(makeEnvelope(makeProfile()));
    renderApp('/');

    await waitFor(() => expect(screen.getByText('HOME CONTENT')).toBeTruthy());
    expect(screen.queryByText(/FARMS PAGE/)).toBeNull();
  });

  it('subrota de /home NÃO é liberada por prefixo (redireciona)', async () => {
    getUserProfileMock.mockResolvedValueOnce(makeEnvelope(makeProfile()));
    renderApp('/home/sub');

    await waitFor(() => expect(screen.getByText('FARMS PAGE WITH NOTICE')).toBeTruthy());
    expect(blockedRenderSpy).not.toHaveBeenCalled();
  });

  it('rota liberada (Centros de Custo): sem redirect', async () => {
    getUserProfileMock.mockResolvedValueOnce(makeEnvelope(makeProfile()));
    renderApp('/cadastros-base/centros-custo');

    await waitFor(() => expect(getUserProfileMock).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText('CENTROS CUSTO')).toBeTruthy());
    expect(screen.queryByText(/FARMS PAGE/)).toBeNull();
  });

  it('após markHasFarms() o filho bloqueado renderiza (liberação imediata, sem novo login)', async () => {
    getUserProfileMock.mockResolvedValueOnce(makeEnvelope(makeProfile()));
    renderApp(BLOCKED_PATH);

    await waitFor(() => expect(screen.getByText('FARMS PAGE WITH NOTICE')).toBeTruthy());
    expect(exposed).not.toBeNull();

    act(() => {
      exposed!.markHasFarms();
    });
    act(() => {
      exposed!.goBlocked();
    });

    await waitFor(() => expect(screen.getByText('BLOCKED CONTENT')).toBeTruthy());
    expect(getUserProfileMock).toHaveBeenCalledTimes(1);
  });

  it('Gestor_Plataf: nada muda (Home abre)', async () => {
    getUserProfileMock.mockResolvedValueOnce(
      makeEnvelope(
        makeProfile({
          roles: ['Gestor_Plataf'],
          farm_context: { is_contractor: false, has_farms: false },
        })
      )
    );
    renderApp('/home');

    await waitFor(() => expect(getUserProfileMock).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText('HOME CONTENT')).toBeTruthy());
    expect(screen.queryByText(/FARMS PAGE/)).toBeNull();
  });

  it('perfil sem farm_context (back antigo): fail-open, sem redirect', async () => {
    getUserProfileMock.mockResolvedValueOnce(
      makeEnvelope(makeProfile({ farm_context: undefined }))
    );
    renderApp('/home');

    await waitFor(() => expect(getUserProfileMock).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText('HOME CONTENT')).toBeTruthy());
    expect(screen.queryByText(/FARMS PAGE/)).toBeNull();
  });
});
