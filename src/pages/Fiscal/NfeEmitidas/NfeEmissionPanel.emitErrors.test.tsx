// @vitest-environment jsdom
// UT-000776 / T-776-FE-01 — NfeEmissionPanel: erros da emissão (422 de negócio e de XSD literais; 500 genérico).
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { getLanguageRouter } from '@/utils/get-language-route';

import { languageContextTypes } from '@/constants/languages';

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
vi.mock('./NfeEmitModal', () => ({
  NfeEmitModal: (props: { onConfirm: (p: unknown) => void }) => (
    <button type="button" onClick={() => props.onConfirm({ emissor_uuid: 'e' })}>
      go-emit
    </button>
  ),
}));

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

vi.mock('@/components/ui/toaster', () => ({ toaster: { create: vi.fn(), error: vi.fn() } }));

const emitNfeMock = vi.fn();
vi.mock('@/services/v2/Fiscal/nfe-service', () => ({
  cancelNfe: vi.fn(),
  consultNfe: vi.fn(),
  correctNfe: vi.fn(),
  emitNfe: (...a: unknown[]) => emitNfeMock(...a),
  downloadNfeCancellationPdf: vi.fn(),
  downloadNfeCorrectionPdf: vi.fn(),
  downloadNfeDanfe: vi.fn(),
  downloadNfeDanfePreview: vi.fn(),
  downloadNfeXml: vi.fn(),
  downloadNfeXmlPreview: vi.fn(),
}));

import { NfeEmissionPanel } from './NfeEmissionPanel';

const lang = getLanguageRouter(languageContextTypes.BR);

function makeError(status: number, data: unknown): AxiosError {
  const response = { status, data } as AxiosResponse;
  return new AxiosError('err', 'ERR_BAD_REQUEST', {} as InternalAxiosRequestConfig, {}, response);
}

const detail = { uuid: 'nfe-uuid', estado: 'novo', code: '1' } as unknown as NfeDetail;

function renderPanel() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <ChakraProvider value={system}>
      <QueryClientProvider client={client}>
        <NfeEmissionPanel nfeDetail={detail} />
      </QueryClientProvider>
    </ChakraProvider>
  );
}

beforeEach(() => vi.clearAllMocks());
afterEach(() => cleanup());

describe('NfeEmissionPanel — erros de emissão', () => {
  it('422 "Configure o responsável técnico" aparece literal', async () => {
    emitNfeMock.mockRejectedValue(makeError(422, { message: 'Configure o responsável técnico' }));
    renderPanel();
    fireEvent.click(screen.getByText('go-emit'));
    await waitFor(() => expect(screen.getByText('Configure o responsável técnico')).toBeTruthy());
    expect(screen.queryByText(lang.nfes.nfe.emission.emitGenericError)).toBeNull();
  });

  it('422 de XSD aparece literal', async () => {
    const xsd = "Element 'infNFe': validation error (XSD).";
    emitNfeMock.mockRejectedValue(makeError(422, { message: xsd, errors: null }));
    renderPanel();
    fireEvent.click(screen.getByText('go-emit'));
    await waitFor(() => expect(screen.getByText(xsd)).toBeTruthy());
  });

  it('500 mostra a mensagem genérica', async () => {
    emitNfeMock.mockRejectedValue(makeError(500, { message: 'SQLSTATE[...] interno' }));
    renderPanel();
    fireEvent.click(screen.getByText('go-emit'));
    await waitFor(() =>
      expect(screen.getByText(lang.nfes.nfe.emission.emitGenericError)).toBeTruthy()
    );
    expect(screen.queryByText(/SQLSTATE/)).toBeNull();
  });
});
