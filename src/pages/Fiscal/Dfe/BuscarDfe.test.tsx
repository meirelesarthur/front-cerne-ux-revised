// @vitest-environment jsdom
// UT-000752 (T-752-FE-02) — Buscar DFe: sucesso usa `message` (API devolve
// `data: null`), 409 → warning sem banner, 422 ambiente/certificado → banner
// com link, demais erros → toast + redireciona para a lista (P-FE-01).
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AxiosError } from 'axios';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { languageDfes } from '@/constants/languages/languagePtBr/languageDfes';

const syncDfeMock = vi.fn();
vi.mock('@/services/v2/Fiscal/dfe-service', () => ({
  syncDfe: (...args: unknown[]) => syncDfeMock(...args),
}));
vi.mock('@/services/v2/Issuers/issuer-service', () => ({ listIssuers: vi.fn() }));

const toaster = vi.hoisted(() => ({ success: vi.fn(), warning: vi.fn(), error: vi.fn() }));
vi.mock('@/components/ui/toaster', () => ({ toaster }));

vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({ languageGB: { dfes: languageDfes, defaltStrings: {} } }),
}));

const navigateMock = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useNavigate: () => navigateMock,
}));

vi.mock('@/components/Form/SelectAsyncPaginate', () => ({
  SelectAsyncPaginate: ({ onChange }: any) => (
    <button type="button" onClick={() => onChange({ label: 'Emissor X', value: 'issuer-1' })}>
      pick-issuer
    </button>
  ),
}));

import BuscarDfe from './BuscarDfe';
import { DFE_RECEBIDAS_STORAGE_KEY } from './storage';

function storedFilter() {
  return JSON.parse(localStorage.getItem('storageKeyGB' + DFE_RECEBIDAS_STORAGE_KEY) ?? 'null');
}

const text = languageDfes.dfe.syncScreen;

function apiError(status: number, message: string): AxiosError {
  const error = new AxiosError('failed');
  error.response = { status, data: { message }, statusText: '', headers: {}, config: {} as never };
  return error;
}

async function submit() {
  fireEvent.click(screen.getByText('pick-issuer'));
  const button = screen.getByText(text.submitButton);
  await waitFor(() => expect((button.closest('button') as HTMLButtonElement).disabled).toBe(false));
  fireEvent.click(button);
}

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <ChakraProvider value={system}>
        <MemoryRouter>
          <BuscarDfe />
        </MemoryRouter>
      </ChakraProvider>
    </QueryClientProvider>
  );
}

describe('BuscarDfe — UT-000752 T-752-FE-02', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('sucesso com data:null mostra a message da API e navega para a lista', async () => {
    syncDfeMock.mockResolvedValue({
      data: null,
      message: 'Sincronização com a SEFAZ realizada com sucesso.',
    });
    setup();
    await submit();

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/fiscal/dfes'));
    expect(toaster.success).toHaveBeenCalledWith(
      expect.objectContaining({ description: 'Sincronização com a SEFAZ realizada com sucesso.' })
    );
    expect(storedFilter().filter).toEqual({ issue_uuid: 'issuer-1' });
  });

  it('409 → warning com a mensagem, fica na tela, sem banner', async () => {
    syncDfeMock.mockRejectedValue(apiError(409, 'Sincronização deste emissor já em andamento.'));
    setup();
    await submit();

    await waitFor(() =>
      expect(toaster.warning).toHaveBeenCalledWith(
        expect.objectContaining({ description: 'Sincronização deste emissor já em andamento.' })
      )
    );
    expect(navigateMock).not.toHaveBeenCalled();
    expect(storedFilter()).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('422 de ambiente → banner com link para o cadastro do emissor', async () => {
    syncDfeMock.mockRejectedValue(
      apiError(422, 'Emissor sem ambiente SEFAZ configurado (produção/homologação).')
    );
    setup();
    await submit();

    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    expect(screen.getByText(text.environmentMissingError)).toBeTruthy();
    fireEvent.click(screen.getByText(text.environmentMissingLink));
    expect(navigateMock).toHaveBeenCalledWith('/cadastros-base/emissores/issuer-1');
    expect(toaster.error).not.toHaveBeenCalled();
  });

  it('422 de certificado → banner com link para o certificado', async () => {
    syncDfeMock.mockRejectedValue(apiError(422, 'Emissor sem certificado digital configurado.'));
    setup();
    await submit();

    await waitFor(() => expect(screen.getByText(text.certificateMissingError)).toBeTruthy());
    fireEvent.click(screen.getByText(text.certificateMissingLink));
    expect(navigateMock).toHaveBeenCalledWith('/cadastros-base/emissores/issuer-1/certificado');
  });

  it('erro SEFAZ (xMotivo) → toast de erro e redireciona para a lista filtrada pelo emissor', async () => {
    syncDfeMock.mockRejectedValue(apiError(422, 'Rejeição 656: Consumo Indevido'));
    setup();
    await submit();

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/fiscal/dfes'));
    expect(toaster.error).toHaveBeenCalledWith(
      expect.objectContaining({ description: 'Rejeição 656: Consumo Indevido' })
    );
    expect(storedFilter().filter).toEqual({ issue_uuid: 'issuer-1' });
  });
});
