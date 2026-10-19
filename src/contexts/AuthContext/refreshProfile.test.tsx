// @vitest-environment jsdom
// src/contexts/AuthContext/refreshProfile.test.tsx
// Execução 071, TASK-071-FE-02 (retrabalho, ACRÉSCIMO 2026-09-26) — prova a
// correção do defeito achado pelo dono em teste manual: ao trocar a foto em
// "Dados pessoais" e salvar, `PersonalDataCard` chama `refreshProfile()`
// (AuthContext), mas o `user` do Context (consumido por
// `AccountSummaryCard`/`AccountMenu` para foto/nome no header) NÃO
// atualizava — `refreshProfile` só chamava `saveProfile(profileData)`
// (atualiza `profile`), nunca `setUser`/`authService.saveUser`. Mesmo padrão
// já usado por `verifySession`/`signIn`/`completeTwoFactorLogin` no próprio
// arquivo (`index.tsx`).
//
// Este teste prova: depois de `refreshProfile()`, `user.photoUrl` e
// `user.username` (consumidos por header/menu) refletem o NOVO `/auth/me`.

import type { ReactNode } from 'react';

import { ChakraProvider } from '@chakra-ui/react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

// Stub de `localStorage` in-memory — mesmo achado/mesma técnica de
// `FinishProcessing.discardDraft.test.tsx`: o jsdom desta suíte não expõe uma
// implementação funcional de `Storage` (`window.localStorage` chega como `{}`
// sem `getItem`/`setItem`), e o `AuthProvider` real (não-mockado, sob teste)
// lê/escreve nele (`app-active-farm`, `app-user-profile`) fora do try/catch.
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

import { useAuth } from '@/hooks/useAuth';

import { AuthProvider } from './index';

function makeEnvelope(data: any) {
  return { data: { success: true, message: null, data, errors: null, meta: null } };
}

const PROFILE_OLD = {
  uuid: '9c1e-abc',
  name: 'Maria Silva',
  email: 'maria@exemplo.com',
  photo_url: null,
  roles: [],
  permissions: [],
  favorites: [],
};

const PROFILE_NEW = {
  uuid: '9c1e-abc',
  name: 'Maria Silva Editado',
  email: 'maria@exemplo.com',
  photo_url: 'https://cdn.example.com/fotos/nova.png',
  roles: [],
  permissions: [],
  favorites: [],
};

function wrapper({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter>
      <ChakraProvider value={system}>
        <AuthProvider>{children}</AuthProvider>
      </ChakraProvider>
    </MemoryRouter>
  );
}

describe('AuthContext.refreshProfile — reflete /auth/me novo em `user` (header/menu)', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('após refreshProfile(), user.photoUrl e user.username refletem o novo /auth/me', async () => {
    getUserProfileMock.mockResolvedValueOnce(makeEnvelope(PROFILE_OLD));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.user?.username).toBe('Maria Silva'));
    expect(result.current.user?.photoUrl).toBeNull();

    getUserProfileMock.mockResolvedValueOnce(makeEnvelope(PROFILE_NEW));

    await act(async () => {
      await result.current.refreshProfile();
    });

    await waitFor(() => {
      expect(result.current.user?.username).toBe('Maria Silva Editado');
      expect(result.current.user?.photoUrl).toBe('https://cdn.example.com/fotos/nova.png');
    });

    // `authService.saveUser` (localStorage) tem que espelhar o mesmo `user`
    // reativo — mesmo padrão de `signIn`/`completeTwoFactorLogin`.
    expect(saveUserMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        username: 'Maria Silva Editado',
        photoUrl: 'https://cdn.example.com/fotos/nova.png',
      })
    );
  });
});
