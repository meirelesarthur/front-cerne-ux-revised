// @vitest-environment jsdom
// T-DEF02-FE-01 (D2/D4) — avisos na emissão: D4 (emissor com requires_ibscbs + item sem IBS/CBS
// bloqueia Confirmar, exceto finnfe 2/4) e D2 (chave do item é do próprio emissor em devolução de
// saída: aviso, sem bloqueio).
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { getLanguageRouter } from '@/utils/get-language-route';

const mocks = vi.hoisted(() => ({ options: vi.fn() }));

vi.mock('@/services/v2/Fiscal/nfe-service', () => ({
  getNfeIssuerOptions: () => mocks.options(),
}));

import { NfeEmitModal } from './NfeEmitModal';

const languageGB = getLanguageRouter('BR');
const modalText = languageGB.nfes.nfe.emission.emitModal;

const OWN_CNPJ = '12345678000190';
// AAMM=2601, CNPJ do emitente nas posições 6..19, série 001
const keyOf = (cnpj: string, serie = '001') =>
  `35260${1}${cnpj}55${serie}000000123100000123`.slice(0, 44).padEnd(44, '0');

const issuer = (over: Record<string, unknown> = {}) => ({
  uuid: 'iss-1',
  razao_social: 'Emissor Um',
  nome_fantasia: null,
  state_registrations: ['111'],
  series: [{ uuid: 'ser-1', serie: 1, is_default: true }],
  requires_ibscbs: false,
  document: OWN_CNPJ,
  ...over,
});

const okItem = (over: Record<string, unknown> = {}) => ({
  uuid: 'i1',
  product: { uuid: 'p1', description: 'Milho' },
  cst_ibs_cbs: '000',
  c_class_trib: '000001',
  ...over,
});

function renderModal(detail: Record<string, unknown>) {
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <ChakraProvider value={system}>
        <NfeEmitModal
          isOpen
          onClose={vi.fn()}
          nfeDetail={{ uuid: 'nfe-1', issuer: { uuid: 'iss-1' }, ...detail } as any}
          languageGB={languageGB}
          mutation={{ isPending: false } as any}
          onConfirm={vi.fn()}
        />
      </ChakraProvider>
    </QueryClientProvider>
  );
}

const confirmButton = () =>
  Array.from(document.querySelectorAll('button')).find(
    (b) => b.textContent === modalText.confirmButton
  ) as HTMLButtonElement;

const bodyText = () => document.body.textContent ?? '';

async function ready() {
  await waitFor(() => expect(confirmButton()).toBeTruthy());
  await waitFor(() =>
    expect(
      Array.from(document.querySelectorAll('[data-part=value-text]')).map((e) => e.textContent)
    ).toEqual(['Emissor Um', '111', '1'])
  );
}

afterEach(() => {
  cleanup();
  mocks.options.mockReset();
});

describe('NfeEmitModal — D4 aviso IBS/CBS', () => {
  it('requires_ibscbs + item sem CST/cClassTrib: lista o item e desabilita Confirmar', async () => {
    mocks.options.mockResolvedValue({ data: [issuer({ requires_ibscbs: true })] });
    renderModal({
      finnfe: 1,
      items: [
        okItem(),
        okItem({ uuid: 'i2', cst_ibs_cbs: null, product: { description: 'Soja' } }),
      ],
    });
    await ready();
    expect(bodyText()).toContain(modalText.ibsCbsMissingTitle);
    expect(bodyText()).toContain('2 — Soja');
    expect(bodyText()).not.toContain('1 — Milho');
    expect(confirmButton().disabled).toBe(true);
  });

  it('item sem c_class_trib também conta', async () => {
    mocks.options.mockResolvedValue({ data: [issuer({ requires_ibscbs: true })] });
    renderModal({ finnfe: 1, items: [okItem({ c_class_trib: '' })] });
    await ready();
    expect(bodyText()).toContain(modalText.ibsCbsMissingTitle);
    expect(confirmButton().disabled).toBe(true);
  });

  it('itens completos: sem aviso e Confirmar habilitado', async () => {
    mocks.options.mockResolvedValue({ data: [issuer({ requires_ibscbs: true })] });
    renderModal({ finnfe: 1, items: [okItem()] });
    await ready();
    expect(bodyText()).not.toContain(modalText.ibsCbsMissingTitle);
    await waitFor(() => expect(confirmButton().disabled).toBe(false));
  });

  it('emissor sem requires_ibscbs: sem aviso', async () => {
    mocks.options.mockResolvedValue({ data: [issuer({ requires_ibscbs: false })] });
    renderModal({ finnfe: 1, items: [okItem({ cst_ibs_cbs: null })] });
    await ready();
    expect(bodyText()).not.toContain(modalText.ibsCbsMissingTitle);
    await waitFor(() => expect(confirmButton().disabled).toBe(false));
  });

  it('finnfe 2 e 4 (exceção até 2027): sem aviso', async () => {
    for (const finnfe of [2, 4]) {
      mocks.options.mockResolvedValue({ data: [issuer({ requires_ibscbs: true })] });
      renderModal({ finnfe, tipo: 0, items: [okItem({ cst_ibs_cbs: null })] });
      await ready();
      expect(bodyText()).not.toContain(modalText.ibsCbsMissingTitle);
      await waitFor(() => expect(confirmButton().disabled).toBe(false));
      cleanup();
    }
  });
});

describe('NfeEmitModal — D2 aviso 1194 (não bloqueia)', () => {
  it('devolução de saída com chave do próprio emissor: avisa o item e mantém Confirmar', async () => {
    mocks.options.mockResolvedValue({ data: [issuer()] });
    renderModal({
      finnfe: 4,
      tipo: 1,
      items: [
        okItem({ ref_access_key: keyOf(OWN_CNPJ), ref_item_number: 1 }),
        okItem({
          uuid: 'i2',
          product: { description: 'Soja' },
          ref_access_key: keyOf('99999999000191'),
        }),
      ],
    });
    await ready();
    expect(bodyText()).toContain(modalText.ownIssuerKeyWarningTitle);
    expect(bodyText()).toContain('1 — Milho');
    expect(bodyText()).not.toContain('2 — Soja');
    await waitFor(() => expect(confirmButton().disabled).toBe(false));
  });

  it('entrada (tipo 0) ou outra finalidade: sem aviso', async () => {
    for (const over of [
      { finnfe: 4, tipo: 0 },
      { finnfe: 1, tipo: 1 },
    ]) {
      mocks.options.mockResolvedValue({ data: [issuer()] });
      renderModal({ ...over, items: [okItem({ ref_access_key: keyOf(OWN_CNPJ) })] });
      await ready();
      expect(bodyText()).not.toContain(modalText.ownIssuerKeyWarningTitle);
      cleanup();
    }
  });

  it('chave de NFA (série 890-899): sem aviso', async () => {
    mocks.options.mockResolvedValue({ data: [issuer()] });
    renderModal({
      finnfe: 4,
      tipo: 1,
      items: [okItem({ ref_access_key: keyOf(OWN_CNPJ, '890') })],
    });
    await ready();
    expect(bodyText()).not.toContain(modalText.ownIssuerKeyWarningTitle);
  });
});
