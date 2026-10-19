// @vitest-environment jsdom
// Execução 081, T-081-FE-06 — promoção automática: UMA chamada `auto_promote` por
// abertura; 422 só recarrega; sem a flag, sem chamada.
import type { ReactNode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAutoPromoteOnce } from './useAutoPromoteOnce';

const acknowledgeMock = vi.fn();

vi.mock('@/services/v2/RequestAuthorizations/request-authorization-service', () => ({
  acknowledgeRequestAuthorization: (...args: any[]) => acknowledgeMock(...args),
}));

const available = { auto_promote_available: true, can_acknowledge_second_level: true };

function createWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe('useAutoPromoteOnce', () => {
  beforeEach(() => {
    acknowledgeMock.mockReset();
  });
  afterEach(cleanup);

  it('chama acknowledge {auto_promote:true} uma única vez, mesmo com re-renders', async () => {
    acknowledgeMock.mockResolvedValue({ data: {} });
    const refetch = vi.fn().mockResolvedValue(undefined);

    const { rerender, result } = renderHook(
      (props: { context: typeof available }) =>
        useAutoPromoteOnce({ uuid: 'u1', context: props.context, canEdit: true, refetch }),
      { wrapper: createWrapper(), initialProps: { context: available } }
    );

    expect(result.current.isPromoting).toBe(true);
    await waitFor(() => expect(result.current.isPromoting).toBe(false));

    rerender({ context: { ...available } });
    rerender({ context: { ...available } });

    expect(acknowledgeMock).toHaveBeenCalledTimes(1);
    expect(acknowledgeMock).toHaveBeenCalledWith('u1', { auto_promote: true });
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('TF-14: 422 deixa de ser silencioso — chama onUnprocessable com o erro e refaz o detalhe', async () => {
    const error = Object.assign(new Error('422'), {
      isAxiosError: true,
      response: { status: 422, data: { errors: { harvest_uuid: ['Safra obrigatória.'] } } },
    });
    acknowledgeMock.mockRejectedValue(error);
    const refetch = vi.fn().mockResolvedValue(undefined);
    const onError = vi.fn();
    const onUnprocessable = vi.fn();

    const { result } = renderHook(
      () =>
        useAutoPromoteOnce({
          uuid: 'u1',
          context: available,
          canEdit: true,
          refetch,
          onError,
          onUnprocessable,
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(onUnprocessable).toHaveBeenCalledTimes(1));
    expect(onUnprocessable).toHaveBeenCalledWith(error);
    await waitFor(() => expect(result.current.isPromoting).toBe(false));
    expect(refetch).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
  });

  it('422 sem onUnprocessable: só recarrega (sem exceção)', async () => {
    acknowledgeMock.mockRejectedValue(
      Object.assign(new Error('422'), { isAxiosError: true, response: { status: 422 } })
    );
    const refetch = vi.fn().mockResolvedValue(undefined);
    const onError = vi.fn();

    const { result } = renderHook(
      () => useAutoPromoteOnce({ uuid: 'u1', context: available, canEdit: true, refetch, onError }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(refetch).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(result.current.isPromoting).toBe(false));
    expect(onError).not.toHaveBeenCalled();
    expect(acknowledgeMock).toHaveBeenCalledTimes(1);
  });

  it('outro erro: recarrega e avisa', async () => {
    acknowledgeMock.mockRejectedValue(
      Object.assign(new Error('403'), { isAxiosError: true, response: { status: 403 } })
    );
    const refetch = vi.fn().mockResolvedValue(undefined);
    const onError = vi.fn();

    renderHook(
      () => useAutoPromoteOnce({ uuid: 'u1', context: available, canEdit: true, refetch, onError }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('sem a flag, sem papel de responsável ou sem permissão: nenhuma chamada', async () => {
    const refetch = vi.fn().mockResolvedValue(undefined);

    renderHook(
      () =>
        useAutoPromoteOnce({
          uuid: 'u1',
          context: { auto_promote_available: false, can_acknowledge_second_level: true },
          canEdit: true,
          refetch,
        }),
      { wrapper: createWrapper() }
    );
    renderHook(
      () => useAutoPromoteOnce({ uuid: 'u1', context: available, canEdit: false, refetch }),
      { wrapper: createWrapper() }
    );

    expect(acknowledgeMock).not.toHaveBeenCalled();
    expect(refetch).not.toHaveBeenCalled();
  });

  it('abrir outra solicitação promove de novo (uma vez por abertura)', async () => {
    acknowledgeMock.mockResolvedValue({ data: {} });
    const refetch = vi.fn().mockResolvedValue(undefined);

    const { rerender } = renderHook(
      (props: { uuid: string }) =>
        useAutoPromoteOnce({ uuid: props.uuid, context: available, canEdit: true, refetch }),
      { wrapper: createWrapper(), initialProps: { uuid: 'u1' } }
    );
    await waitFor(() => expect(acknowledgeMock).toHaveBeenCalledTimes(1));
    rerender({ uuid: 'u2' });
    await waitFor(() => expect(acknowledgeMock).toHaveBeenCalledTimes(2));
    expect(acknowledgeMock).toHaveBeenLastCalledWith('u2', { auto_promote: true });
  });
});
