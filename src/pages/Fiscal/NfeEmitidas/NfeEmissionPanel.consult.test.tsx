// @vitest-environment jsdom
// UT-000748 / T-748-FE-02 — NfeEmissionPanel: consulta sincroniza o estado (invalida detalhe +
// listagem, mostra a label da situação e avisa o cancelamento), 422 de negócio na consulta,
// 422 `errors.motivo` do cancelamento chega ao modal como `fieldError`, e
// `extractMotivoFieldError`.
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';

import { system } from '@/theme';

import { getLanguageRouter } from '@/utils/get-language-route';

import { languageContextTypes } from '@/constants/languages';
import { queryKey } from '@/constants/query-key';

import type { NfeDetail } from '@/@types/v2/Nfes';

vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({ languageGB: getLanguageRouter(languageContextTypes.BR) }),
}));
vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasFarm: true, can: () => true }),
}));
vi.mock('./useNfeEmissionStatus', () => ({
  useNfeEmissionStatus: () => ({ data: undefined, isLoading: false, isError: false }),
}));
vi.mock('./NfeEmitModal', () => ({ NfeEmitModal: () => null }));

// `useRequest` stub: executa a asyncFunction e repassa o erro ao `onError` da chamada.
vi.mock('@/hooks/useRequest', () => ({
  useRequest: (opts: { asyncFunction: (p: unknown) => Promise<unknown> }) => ({
    isPending: false,
    mutate: (payload: unknown, cb?: { onError?: (e: unknown) => void }) => {
      opts.asyncFunction(payload).catch((e) => cb?.onError?.(e));
    },
  }),
}));

// Modal stub: expõe as props relevantes e um botão que dispara `onConfirm`.
vi.mock('./NfeMotivoModal', () => ({
  NfeMotivoModal: (props: {
    title: string;
    fieldError?: string;
    serverError?: string;
    maxLength: number;
    onConfirm: (m: string) => void;
  }) => (
    <div data-testid={`modal-${props.title}`}>
      <span data-testid={`max-${props.title}`}>{props.maxLength}</span>
      <span data-testid={`field-${props.title}`}>{props.fieldError ?? ''}</span>
      <span data-testid={`server-${props.title}`}>{props.serverError ?? ''}</span>
      <button type="button" onClick={() => props.onConfirm('x'.repeat(20))}>
        {`go-${props.title}`}
      </button>
    </div>
  ),
}));

const toasterCreate = vi.fn();
vi.mock('@/components/ui/toaster', () => ({
  toaster: { create: (...a: unknown[]) => toasterCreate(...a), error: vi.fn() },
}));

const consultNfeMock = vi.fn();
const cancelNfeMock = vi.fn();
vi.mock('@/services/v2/Fiscal/nfe-service', () => ({
  cancelNfe: (...a: unknown[]) => cancelNfeMock(...a),
  consultNfe: (...a: unknown[]) => consultNfeMock(...a),
  correctNfe: vi.fn(),
  emitNfe: vi.fn(),
  downloadNfeCancellationPdf: vi.fn(),
  downloadNfeCorrectionPdf: vi.fn(),
  downloadNfeDanfe: vi.fn(),
  downloadNfeDanfePreview: vi.fn(),
  downloadNfeXml: vi.fn(),
  downloadNfeXmlPreview: vi.fn(),
}));

import { extractMotivoFieldError, NfeEmissionPanel } from './NfeEmissionPanel';

const lang = getLanguageRouter(languageContextTypes.BR);
const cancelTitle = lang.nfes.nfe.emission.cancelModal.title;

function make422(data: unknown): AxiosError {
  const response = { status: 422, data } as AxiosResponse;
  return new AxiosError(
    'Unprocessable',
    'ERR_BAD_REQUEST',
    {} as InternalAxiosRequestConfig,
    {},
    response
  );
}

const detail = { uuid: 'nfe-uuid', estado: 'aprovado', code: '1' } as unknown as NfeDetail;

let client: QueryClient;
let invalidateSpy: MockInstance<QueryClient['invalidateQueries']>;

function renderPanel() {
  return render(
    <ChakraProvider value={system}>
      <QueryClientProvider client={client}>
        <NfeEmissionPanel nfeDetail={detail} />
      </QueryClientProvider>
    </ChakraProvider>
  );
}

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  invalidateSpy = vi.spyOn(client, 'invalidateQueries');
  vi.clearAllMocks();
});
afterEach(() => cleanup());

describe('NfeEmissionPanel — consulta sincronizada', () => {
  it('cancelado sobre detalhe aprovado: invalida detalhe+lista, mostra label e avisa', async () => {
    consultNfeMock.mockResolvedValue({
      data: {
        situacao: 'cancelado',
        estado: 'cancelado',
        protocol_number: '1',
        protocol_status: '101',
        protocol_motivo: null,
        chave: 'abc',
      },
    });
    renderPanel();
    fireEvent.click(screen.getByText(lang.nfes.nfe.emission.consultButton));
    await waitFor(() => expect(screen.getByText('Cancelada')).toBeTruthy());
    const keys = invalidateSpy.mock.calls.map((c) => (c[0] as { queryKey: unknown[] }).queryKey);
    expect(keys).toContainEqual([queryKey.nfes.nfe]);
    expect(keys).toContainEqual([queryKey.nfes.nfesList]);
    expect(toasterCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'warning',
        description: lang.nfes.nfe.emission.consultCancelledNotice,
      })
    );
  });

  it('processando não dispara o aviso de cancelamento', async () => {
    consultNfeMock.mockResolvedValue({
      data: {
        situacao: 'processando',
        estado: 'aprovado',
        protocol_number: null,
        protocol_status: null,
        protocol_motivo: null,
        chave: 'abc',
      },
    });
    renderPanel();
    fireEvent.click(screen.getByText(lang.nfes.nfe.emission.consultButton));
    await waitFor(() => expect(screen.getByText('Processando')).toBeTruthy());
    expect(toasterCreate).not.toHaveBeenCalled();
  });

  it('422 de negócio (emissor sem ambiente) aparece no banner da consulta', async () => {
    consultNfeMock.mockRejectedValue(make422({ message: 'Emissor sem ambiente configurado.' }));
    renderPanel();
    fireEvent.click(screen.getByText(lang.nfes.nfe.emission.consultButton));
    await waitFor(() => expect(screen.getByText('Emissor sem ambiente configurado.')).toBeTruthy());
  });
});

describe('NfeEmissionPanel — modais de motivo', () => {
  it('limites por evento chegam aos modais (255 / 1000)', () => {
    renderPanel();
    expect(screen.getByTestId(`max-${cancelTitle}`).textContent).toBe('255');
    expect(screen.getByTestId(`max-${lang.nfes.nfe.emission.correctModal.title}`).textContent).toBe(
      '1000'
    );
  });

  it('cancel com 422 errors.motivo[] chega como fieldError ao modal', async () => {
    cancelNfeMock.mockRejectedValue(
      make422({
        message: 'invalid',
        errors: { motivo: ['O motivo deve ter pelo menos 15 caracteres.'] },
      })
    );
    renderPanel();
    fireEvent.click(screen.getByText(`go-${cancelTitle}`));
    await waitFor(() =>
      expect(screen.getByTestId(`field-${cancelTitle}`).textContent).toBe(
        'O motivo deve ter pelo menos 15 caracteres.'
      )
    );
    expect(screen.getByTestId(`server-${cancelTitle}`).textContent).toBe('');
  });

  it('cancel com 422 de negócio chega como serverError ao modal', async () => {
    cancelNfeMock.mockRejectedValue(make422({ message: 'Emissor sem ambiente configurado.' }));
    renderPanel();
    fireEvent.click(screen.getByText(`go-${cancelTitle}`));
    await waitFor(() =>
      expect(screen.getByTestId(`server-${cancelTitle}`).textContent).toBe(
        'Emissor sem ambiente configurado.'
      )
    );
  });
});

describe('extractMotivoFieldError', () => {
  it('array, string, ausente e não-422', () => {
    expect(extractMotivoFieldError(make422({ errors: { motivo: ['a', 'b'] } }))).toBe('a');
    expect(extractMotivoFieldError(make422({ errors: { motivo: 'só texto' } }))).toBe('só texto');
    expect(extractMotivoFieldError(make422({ message: 'x', errors: null }))).toBeUndefined();
    expect(extractMotivoFieldError(make422({ errors: { outro: ['z'] } }))).toBeUndefined();
    expect(extractMotivoFieldError(new Error('boom'))).toBeUndefined();
    const e500 = new AxiosError('x', 'E', {} as InternalAxiosRequestConfig, {}, {
      status: 500,
      data: { errors: { motivo: ['a'] } },
    } as AxiosResponse);
    expect(extractMotivoFieldError(e500)).toBeUndefined();
  });
});
