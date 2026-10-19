// @vitest-environment jsdom
// src/router/nfe-create-route.test.tsx
// UT-000715 / TK-FE-715-06 (FE-715-T6, S-715-14, legado NfeController.php:52,193-209) — a rota
// `/fiscal/nfe-emitidas/novo` é protegida por `RequirePermission permission="nfe_create"`
// (`src/router/index.tsx`). Prova a FIAÇÃO do guard (RequirePermission e AccessDenied reais;
// `useAuth`, `usePermissions`, `useLanguage`, `DashboardLayout` e a tela `CreateOrUpdateNfe`
// mockados). O conteúdo da tela é coberto por `CreateOrUpdateNfe.moduleWeighingPrefill.test.tsx`.
import { ChakraProvider } from '@chakra-ui/react';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Outlet } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { getLanguageRouter } from '@/utils/get-language-route';

import { languageContextTypes } from '@/constants/languages';

const grantedPermissions = new Set<string>();

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ isAuthenticated: true, loading: false }),
}));

vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({
    hasFarm: true,
    can: (permission: string) => grantedPermissions.has(permission),
    canAny: (permissions: string[]) => permissions.some((p) => grantedPermissions.has(p)),
    canAll: (permissions: string[]) => permissions.every((p) => grantedPermissions.has(p)),
  }),
}));

vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({ languageGB: getLanguageRouter(languageContextTypes.BR) }),
}));

vi.mock('@/layouts/DashboardLayout', () => ({
  DashboardLayout: () => <Outlet />,
}));

vi.mock('@/pages/Fiscal/NfeEmitidas/CreateOrUpdateNfe', () => ({
  default: () => <div>nova-nfe-stub</div>,
}));

import { AppRoutes } from './index';

const NEW_NFE_ROUTE = '/fiscal/nfe-emitidas/novo';
const ACCESS_DENIED_TITLE = 'Acesso negado';

function renderRoute() {
  return render(
    <ChakraProvider value={system}>
      <MemoryRouter initialEntries={[NEW_NFE_ROUTE]}>
        <AppRoutes />
      </MemoryRouter>
    </ChakraProvider>
  );
}

afterEach(() => {
  cleanup();
});

describe('rota /fiscal/nfe-emitidas/novo (UT-000715, S-715-14)', () => {
  it('com nfe_create renderiza a Nova NF-e', async () => {
    grantedPermissions.clear();
    grantedPermissions.add('nfe_create');

    renderRoute();

    expect(await screen.findByText('nova-nfe-stub')).toBeTruthy();
    expect(screen.queryByText(ACCESS_DENIED_TITLE)).toBeNull();
  });

  it('sem nfe_create renderiza AccessDenied e NÃO monta a Nova NF-e', async () => {
    grantedPermissions.clear();

    renderRoute();

    expect(await screen.findByText(ACCESS_DENIED_TITLE)).toBeTruthy();
    expect(screen.queryByText('nova-nfe-stub')).toBeNull();
  });

  it('com nfe_view mas sem nfe_create continua negado', async () => {
    grantedPermissions.clear();
    grantedPermissions.add('nfe_view');

    renderRoute();

    expect(await screen.findByText(ACCESS_DENIED_TITLE)).toBeTruthy();
    expect(screen.queryByText('nova-nfe-stub')).toBeNull();
  });
});
