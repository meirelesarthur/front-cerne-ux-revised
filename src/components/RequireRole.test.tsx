// @vitest-environment jsdom
// src/components/RequireRole.test.tsx
// U-02 (execução 079) — o guard de papel renderiza os filhos com o papel e
// `AccessDenied` sem ele.

import { ChakraProvider } from '@chakra-ui/react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

const hasRoleMock = vi.fn();

vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasRole: (role: string) => hasRoleMock(role) }),
}));

vi.mock('@/components/AccessDenied', () => ({
  AccessDenied: () => <div data-testid="access-denied">negado</div>,
}));

import { RequireRole } from './RequireRole';

function renderGuard() {
  return render(
    <ChakraProvider value={system}>
      <RequireRole role="Gestor_Plataf">
        <div data-testid="conteudo">logs</div>
      </RequireRole>
    </ChakraProvider>
  );
}

afterEach(() => {
  cleanup();
  hasRoleMock.mockReset();
});

describe('RequireRole', () => {
  it('renderiza os filhos quando o usuário tem o papel', () => {
    hasRoleMock.mockImplementation((role: string) => role === 'Gestor_Plataf');
    renderGuard();

    expect(screen.getByTestId('conteudo')).toBeTruthy();
    expect(screen.queryByTestId('access-denied')).toBeNull();
    expect(hasRoleMock).toHaveBeenCalledWith('Gestor_Plataf');
  });

  it('mostra AccessDenied sem o papel', () => {
    hasRoleMock.mockReturnValue(false);
    renderGuard();

    expect(screen.getByTestId('access-denied')).toBeTruthy();
    expect(screen.queryByTestId('conteudo')).toBeNull();
  });
});
