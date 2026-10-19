// @vitest-environment jsdom
// src/router/profile-route.test.tsx
// Execução 071, TASK-071-FE-02 (FE02-T02, SRF-071-01) — a rota `/profile`
// existe no bloco PRIVADO (`PrivateRoute` real, com `useAuth` mockado
// autenticado) e renderiza a página `MeuPerfil`. `DashboardLayout` e
// `MeuPerfil` são mockados: este teste prova a FIAÇÃO da rota (contrato de
// tela §1), não o conteúdo da tela (coberto por `PersonalDataCard.test.tsx`
// e vizinhos). Estática complementar (DoD): grep `path={ROUTES.PROFILE}` no
// bloco privado de `src/router/index.tsx`.

import { render, screen } from '@testing-library/react';
import { MemoryRouter, Outlet } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ isAuthenticated: true, loading: false }),
}));

vi.mock('@/layouts/DashboardLayout', () => ({
  DashboardLayout: () => <Outlet />,
}));

vi.mock('@/pages/MeuPerfil', () => ({
  default: () => <div>meu-perfil-stub</div>,
}));

import { AppRoutes } from './index';

describe('Rota /profile — FE02-T02', () => {
  it('renderiza a página MeuPerfil dentro do bloco privado autenticado', async () => {
    render(
      <MemoryRouter initialEntries={['/profile']}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(await screen.findByText('meu-perfil-stub')).toBeTruthy();
  });
});
