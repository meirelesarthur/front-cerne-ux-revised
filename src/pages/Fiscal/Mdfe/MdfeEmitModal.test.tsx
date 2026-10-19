// @vitest-environment jsdom
// T-DEF02-FE-01 (D3) — modal "Emitir MDF-e": Select de emissor obrigatório, pré-selecionado com o
// emissor do MDF-e, opções de GET /mdfes/issuer-options.
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { getLanguageRouter } from '@/utils/get-language-route';

const mocks = vi.hoisted(() => ({ options: vi.fn() }));

vi.mock('@/services/v2/Fiscal/mdfe-service', () => ({
  listMdfeIssuerOptions: () => mocks.options(),
}));

import { MdfeEmitModal } from './MdfeEmitModal';

const languageGB = getLanguageRouter('BR');
const modalText = languageGB.mdfes.mdfe.emission.emitModal;

const issuer = (uuid: string, name: string) => ({
  uuid,
  razao_social: name,
  nome_fantasia: null,
  document: '12345678000190',
  ambiente: 2,
  state_registrations: ['111'],
});

function renderModal(
  detail: Record<string, unknown>,
  props: { onConfirm?: (p: unknown) => void; errorMessage?: string } = {}
) {
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <ChakraProvider value={system}>
        <MdfeEmitModal
          isOpen
          onClose={vi.fn()}
          mdfeDetail={detail as any}
          languageGB={languageGB}
          mutation={{ isPending: false } as any}
          onConfirm={(props.onConfirm ?? vi.fn()) as any}
          errorMessage={props.errorMessage}
        />
      </ChakraProvider>
    </QueryClientProvider>
  );
}

const confirmButton = () =>
  Array.from(document.querySelectorAll('button')).find(
    (b) => b.textContent === modalText.confirmButton
  ) as HTMLButtonElement;

afterEach(() => {
  cleanup();
  mocks.options.mockReset();
});

describe('MdfeEmitModal — emissor obrigatório (D3)', () => {
  it('pré-seleciona o emissor do MDF-e e envia { issuer_uuid } ao confirmar', async () => {
    mocks.options.mockResolvedValue({ data: [issuer('a', 'Emissor A'), issuer('b', 'Emissor B')] });
    const onConfirm = vi.fn();
    renderModal({ uuid: 'm1', issue: { uuid: 'b' } }, { onConfirm });
    await waitFor(() =>
      expect(
        Array.from(document.querySelectorAll('[data-part=value-text]')).map((e) => e.textContent)
      ).toEqual(['Emissor B'])
    );
    await waitFor(() => expect(confirmButton().disabled).toBe(false));
    fireEvent.click(confirmButton());
    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith({ issuer_uuid: 'b' }));
  });

  it('sem emissor no MDF-e: nada pré-selecionado e Confirmar desabilitado', async () => {
    mocks.options.mockResolvedValue({ data: [issuer('a', 'Emissor A')] });
    const onConfirm = vi.fn();
    renderModal({ uuid: 'm1', issue: null }, { onConfirm });
    await waitFor(() => expect(confirmButton()).toBeTruthy());
    await waitFor(() => expect(mocks.options).toHaveBeenCalled());
    expect(confirmButton().disabled).toBe(true);
    fireEvent.click(confirmButton());
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('emissor do MDF-e fora das opções elegíveis: não pré-seleciona', async () => {
    mocks.options.mockResolvedValue({ data: [issuer('a', 'Emissor A')] });
    renderModal({ uuid: 'm1', issue: { uuid: 'zzz' } });
    await waitFor(() => expect(mocks.options).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 50));
    expect(confirmButton().disabled).toBe(true);
  });

  it('exibe a mensagem 422 da API no modal', async () => {
    mocks.options.mockResolvedValue({ data: [issuer('a', 'Emissor A')] });
    renderModal({ uuid: 'm1', issue: null }, { errorMessage: 'Informe o emissor do MDF-e.' });
    await waitFor(() => expect(document.body.textContent).toContain('Informe o emissor do MDF-e.'));
  });
});
