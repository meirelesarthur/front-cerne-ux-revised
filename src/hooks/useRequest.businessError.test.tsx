// @vitest-environment jsdom
// UT-000715 / TK-FE-715-06 (FE-715-T8 — FALLBACK declarado, S-715-14 limite mensal `qtd_nfe`).
// O teste da tela `CreateOrUpdateNfe.moduleWeighingPrefill.test.tsx` mocka `useRequest` e exigiria
// preencher o formulário inteiro (cliente, placa, natureza, itens, financeiro) para submeter; por
// isso a prova do tratamento do erro de negócio do `POST nfes` é feita no `useRequest` real, que é o
// que `nfeMutation` (`CreateOrUpdateNfe.tsx`) usa: a API rejeita com envelope de negócio (422) ->
// `toaster.error` com a mensagem da API; `actionSuccess` (que faz `navigate(-1)`) NÃO é chamado.
import type { ReactNode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { getLanguageRouter } from '@/utils/get-language-route';

import { languageContextTypes } from '@/constants/languages';

const toasterErrorMock = vi.fn();
const toasterSuccessMock = vi.fn();

vi.mock('@/components/ui/toaster', () => ({
  toaster: {
    error: (...args: unknown[]) => toasterErrorMock(...args),
    success: (...args: unknown[]) => toasterSuccessMock(...args),
    create: vi.fn(),
    warning: vi.fn(),
  },
}));
vi.mock('./useLanguage', () => ({
  useLanguage: () => ({ languageGB: getLanguageRouter(languageContextTypes.BR) }),
}));

import { useRequest } from './useRequest';

const LIMIT_MESSAGE = 'Limite de emissões atingidas para o mês corrente.';

function businessError(message: string) {
  const config = { headers: {} } as InternalAxiosRequestConfig;
  const response: AxiosResponse = {
    status: 422,
    statusText: 'Unprocessable Content',
    headers: {},
    config,
    data: { success: false, message, data: null, errors: null, meta: null },
  };
  return new AxiosError(message, 'ERR_BAD_REQUEST', config, undefined, response);
}

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

afterEach(() => {
  toasterErrorMock.mockReset();
  toasterSuccessMock.mockReset();
  vi.restoreAllMocks();
});

describe('limite/erro de negócio no create (ex.: "Limite de emissões atingidas para o mês corrente.") — useRequest', () => {
  it('createNfe rejeita com envelope de negócio -> toaster.error com a mensagem da API, sem sucesso nem navegação', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const actionSuccess = vi.fn();
    const asyncFunction = vi.fn().mockRejectedValue(businessError(LIMIT_MESSAGE));

    const { result } = renderHook(
      () =>
        useRequest({
          asyncFunction,
          entityName: 'NF-e',
          queryKey: 'nfes-list',
          queryKey2: 'nfe',
          typesRequest: 'create',
          actionSuccess,
        }),
      { wrapper }
    );

    await expect(result.current.mutateAsync({})).rejects.toBeDefined();

    await waitFor(() => expect(toasterErrorMock).toHaveBeenCalledTimes(1));
    expect(toasterErrorMock.mock.calls[0][0]).toMatchObject({
      title: 'NF-e',
      description: LIMIT_MESSAGE,
    });
    expect(toasterSuccessMock).not.toHaveBeenCalled();
    expect(actionSuccess).not.toHaveBeenCalled();
  });
});
