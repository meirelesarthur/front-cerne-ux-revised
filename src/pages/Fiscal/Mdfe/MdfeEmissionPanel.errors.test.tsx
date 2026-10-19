// @vitest-environment jsdom
// UT-000776 / T-776-FE-03 — painel de emissão do MDF-e mostra a mensagem da API (CIOT ausente,
// emissor sem ambiente) em vez do texto genérico.
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { getLanguageRouter } from '@/utils/get-language-route';

import { languageContextTypes } from '@/constants/languages';

import type { MdfeData } from '@/@types/v2/Fiscal/Mdfe';

vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({ languageGB: getLanguageRouter(languageContextTypes.BR) }),
}));
vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasFarm: true, can: () => true }),
}));
vi.mock('@/hooks/useRequest', () => ({
  useRequest: (opts: { asyncFunction: (p: unknown) => Promise<unknown> }) => ({
    isPending: false,
    mutate: (payload: unknown, cb?: { onError?: (e: unknown) => void }) => {
      opts.asyncFunction(payload).catch((e) => cb?.onError?.(e));
    },
  }),
}));
vi.mock('@/components/ui/toaster', () => ({ toaster: { create: vi.fn(), error: vi.fn() } }));
vi.mock('./MdfeEmitModal', () => ({
  MdfeEmitModal: (props: {
    isOpen: boolean;
    onConfirm: (p: { issuer_uuid: string }) => void;
    errorMessage?: string;
  }) =>
    props.isOpen ? (
      <div>
        <button type="button" onClick={() => props.onConfirm({ issuer_uuid: 'iss-1' })}>
          confirm-emit
        </button>
        {props.errorMessage ? <span>{props.errorMessage}</span> : null}
      </div>
    ) : null,
}));
vi.mock('./MdfeMotivoModal', () => ({ MdfeMotivoModal: () => null }));

const emitMdfeMock = vi.fn();
vi.mock('@/services/v2/Fiscal/mdfe-service', () => ({
  cancelMdfe: vi.fn(),
  downloadMdfeXml: vi.fn(),
  emitMdfe: (...a: unknown[]) => emitMdfeMock(...a),
}));

import { extractSefazRejectionMessage, MdfeEmissionPanel } from './MdfeEmissionPanel';

const lang = getLanguageRouter(languageContextTypes.BR);
const emission = lang.mdfes.mdfe.emission;

function make422(data: unknown): AxiosError {
  return new AxiosError('x', 'ERR', {} as InternalAxiosRequestConfig, {}, {
    status: 422,
    data,
  } as AxiosResponse);
}

function renderPanel() {
  const detail = { uuid: 'mdfe-uuid', estado: 'novo' } as unknown as MdfeData;
  return render(
    <ChakraProvider value={system}>
      <QueryClientProvider client={new QueryClient()}>
        <MdfeEmissionPanel mdfeDetail={detail} />
      </QueryClientProvider>
    </ChakraProvider>
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('MdfeEmissionPanel — erros 422 de emissão', () => {
  const GENERIC = 'Os dados informados são inválidos.';
  it.each([
    [
      'ambiente ausente',
      { message: 'Configure o ambiente (produção/homologação) do emissor.' },
      'Configure o ambiente (produção/homologação) do emissor.',
    ],
    [
      'CIOT ausente (errors.ciots)',
      {
        success: false,
        message: GENERIC,
        errors: { ciots: ['Informe ao menos um CIOT: obrigatório para MDF-e (tp_emit 1 ou 3).'] },
      },
      'Informe ao menos um CIOT: obrigatório para MDF-e (tp_emit 1 ou 3).',
    ],
    [
      'CIOT inválido (errors[ciots.0.codigo])',
      {
        success: false,
        message: GENERIC,
        errors: { 'ciots.0.codigo': ['O CIOT deve ter exatamente 12 dígitos numéricos.'] },
      },
      'O CIOT deve ter exatamente 12 dígitos numéricos.',
    ],
  ])('mostra a mensagem útil da API — %s', async (_n, body, expected) => {
    emitMdfeMock.mockRejectedValue(make422(body));
    renderPanel();
    fireEvent.click(screen.getByText(emission.emitButton));
    fireEvent.click(await screen.findByText('confirm-emit'));
    await waitFor(() => expect(screen.getByText(expected)).toBeTruthy());
    expect(screen.queryByText(GENERIC)).toBeNull();
    expect(screen.queryByText(emission.emitGenericError)).toBeNull();
  });

  it('emite com { issuer_uuid } escolhido no modal (D3) e mostra o 422 do emissor', async () => {
    emitMdfeMock.mockRejectedValue(make422({ message: 'Informe o emissor do MDF-e.' }));
    renderPanel();
    fireEvent.click(screen.getByText(emission.emitButton));
    fireEvent.click(await screen.findByText('confirm-emit'));
    await waitFor(() => expect(screen.getByText('Informe o emissor do MDF-e.')).toBeTruthy());
    expect(emitMdfeMock).toHaveBeenCalledWith('mdfe-uuid', { issuer_uuid: 'iss-1' });
  });

  it('chave ciots* prevalece sobre message e sobre outras chaves', () => {
    expect(
      extractSefazRejectionMessage(
        make422({ message: GENERIC, errors: { outro: ['x'], 'ciots.0.codigo': ['CIOT ruim'] } })
      )
    ).toBe('CIOT ruim');
  });

  it('sem `message`, usa a 1ª mensagem por campo; sem nada, devolve undefined', () => {
    expect(extractSefazRejectionMessage(make422({ errors: { ciots: ['CIOT obrigatório'] } }))).toBe(
      'CIOT obrigatório'
    );
    expect(extractSefazRejectionMessage(make422({}))).toBeUndefined();
    expect(extractSefazRejectionMessage(new Error('x'))).toBeUndefined();
  });

  it('cStat+motivo da SEFAZ continuam prioritários', () => {
    expect(
      extractSefazRejectionMessage(
        make422({ message: 'm', errors: { cStat: '684', motivo: 'Rejeição' } })
      )
    ).toBe('Rejeição (cStat 684)');
  });
});
