// @vitest-environment jsdom
// UT-000780 (D-101-02) — seletor de série na emissão: pré-seleciona a padrão do emissor,
// reseta ao trocar de emissor, bloqueia sem série ativa e envia `series_uuid`.
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { getLanguageRouter } from '@/utils/get-language-route';

const mocks = vi.hoisted(() => ({ options: vi.fn() }));

vi.mock('@/services/v2/Fiscal/nfe-service', () => ({
  getNfeIssuerOptions: () => mocks.options(),
}));

import { NfeEmitModal } from './NfeEmitModal';

const languageGB = getLanguageRouter('BR');

const ISSUERS = [
  {
    uuid: 'iss-1',
    razao_social: 'Emissor Um',
    nome_fantasia: null,
    state_registrations: ['111'],
    series: [
      { uuid: 'ser-1', serie: 1, is_default: false },
      { uuid: 'ser-2', serie: 2, is_default: true },
    ],
  },
  {
    uuid: 'iss-2',
    razao_social: 'Emissor Sem Série',
    nome_fantasia: null,
    state_registrations: ['222'],
    series: [],
  },
];

function renderModal(issuerUuid: string) {
  const onConfirm = vi.fn();
  const utils = render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <ChakraProvider value={system}>
        <NfeEmitModal
          isOpen
          onClose={vi.fn()}
          nfeDetail={{ uuid: 'nfe-1', issuer: { uuid: issuerUuid } } as any}
          languageGB={languageGB}
          mutation={{ isPending: false } as any}
          onConfirm={onConfirm}
        />
      </ChakraProvider>
    </QueryClientProvider>
  );
  return { ...utils, onConfirm };
}

const valueTexts = () =>
  Array.from(document.querySelectorAll('[data-part=value-text]')).map((el) => el.textContent);

describe('NfeEmitModal — série na emissão', () => {
  afterEach(cleanup);

  it('pré-seleciona a série padrão e envia series_uuid ao confirmar', async () => {
    mocks.options.mockResolvedValue({ data: ISSUERS });
    const { findByText, onConfirm } = renderModal('iss-1');

    // emissor, IE e série padrão (2) pré-selecionados
    await waitFor(() => expect(valueTexts()).toEqual(['Emissor Um', '111', '2']));
    const confirm = await findByText(languageGB.nfes.nfe.emission.emitModal.confirmButton);
    await waitFor(() =>
      expect((confirm.closest('button') as HTMLButtonElement).disabled).toBe(false)
    );
    fireEvent.click(confirm);

    await waitFor(() =>
      expect(onConfirm).toHaveBeenCalledWith({
        issuer_uuid: 'iss-1',
        state_registration: '111',
        series_uuid: 'ser-2',
      })
    );
  });

  it('emissor sem série ativa bloqueia a confirmação com aviso', async () => {
    mocks.options.mockResolvedValue({ data: ISSUERS });
    const { findByText } = renderModal('iss-2');

    expect(await findByText(languageGB.nfes.nfe.emission.emitModal.noSeriesForIssuer)).toBeTruthy();
    const confirm = await findByText(languageGB.nfes.nfe.emission.emitModal.confirmButton);
    expect((confirm.closest('button') as HTMLButtonElement).disabled).toBe(true);
  });
});
