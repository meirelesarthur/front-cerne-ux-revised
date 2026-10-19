import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useGridStorageScope } from '@/hooks/useGridStorageScope';

// Mock do `useAuth` — o helper deriva o escopo exclusivamente do usuário
// logado e da fazenda ativa expostos por `useAuth()`.
const useAuthMock = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}));

describe('useGridStorageScope', () => {
  beforeEach(() => {
    useAuthMock.mockReset();
  });

  it('devolve null quando não há usuário logado', () => {
    useAuthMock.mockReturnValue({ user: null, activeFarmUuid: null });

    const { result } = renderHook(() => useGridStorageScope());

    expect(result.current).toBeNull();
  });

  it('com user_id placeholder (0), ancora no email (perfis com user_id 0)', () => {
    useAuthMock.mockReturnValue({
      user: { user_id: 0, email: 'suporte@greenbelt.com', username: 'suporte' },
      activeFarmUuid: null,
    });

    const { result } = renderHook(() => useGridStorageScope());

    expect(result.current).toBe('user-suporte@greenbelt.com');
  });

  it('cai para username quando não há user_id nem email', () => {
    useAuthMock.mockReturnValue({ user: { user_id: 0, username: 'suporte' }, activeFarmUuid: null });

    const { result } = renderHook(() => useGridStorageScope());

    expect(result.current).toBe('user-suporte');
  });

  it('devolve null quando não há nenhum identificador estável', () => {
    useAuthMock.mockReturnValue({ user: { user_id: 0 }, activeFarmUuid: 'farm-x' });

    const { result } = renderHook(() => useGridStorageScope());

    expect(result.current).toBeNull();
  });

  it('ancora só no usuário quando não há fazenda ativa (persistência mantida)', () => {
    useAuthMock.mockReturnValue({ user: { user_id: 42 }, activeFarmUuid: null });

    const { result } = renderHook(() => useGridStorageScope());

    expect(result.current).toBe('user-42');
  });

  it('usa a fazenda como sub-escopo quando há usuário e fazenda', () => {
    useAuthMock.mockReturnValue({ user: { user_id: 42 }, activeFarmUuid: 'abc-uuid' });

    const { result } = renderHook(() => useGridStorageScope());

    expect(result.current).toBe('user-42:farm-abc-uuid');
  });
});
