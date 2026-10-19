// @vitest-environment jsdom
// D-101-07 — NfeEmissionPanel: permissões do legado. Emitir/CC-e = nfe_edit; Cancelar = nfe_delete.
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { getLanguageRouter } from '@/utils/get-language-route';

import { languageContextTypes } from '@/constants/languages';

import type { NfeDetail } from '@/@types/v2/Nfes';

let granted: string[] = [];

vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({ languageGB: getLanguageRouter(languageContextTypes.BR) }),
}));
vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasFarm: true, can: (k: string) => granted.includes(k) }),
}));
vi.mock('./useNfeEmissionStatus', () => ({
  useNfeEmissionStatus: () => ({ data: undefined, isLoading: false, isError: false }),
}));
vi.mock('./NfeEmitModal', () => ({ NfeEmitModal: () => null }));
vi.mock('./NfeMotivoModal', () => ({ NfeMotivoModal: () => null }));
vi.mock('@/hooks/useRequest', () => ({
  useRequest: () => ({ isPending: false, mutate: vi.fn() }),
}));
vi.mock('@/components/ui/toaster', () => ({ toaster: { create: vi.fn(), error: vi.fn() } }));
vi.mock('@/services/v2/Fiscal/nfe-service', () => ({
  cancelNfe: vi.fn(),
  consultNfe: vi.fn(),
  correctNfe: vi.fn(),
  emitNfe: vi.fn(),
  downloadNfeCancellationPdf: vi.fn(),
  downloadNfeCorrectionPdf: vi.fn(),
  downloadNfeDanfe: vi.fn(),
  downloadNfeDanfePreview: vi.fn(),
  downloadNfeXml: vi.fn(),
  downloadNfeXmlPreview: vi.fn(),
}));

import { NfeEmissionPanel } from './NfeEmissionPanel';

const text = getLanguageRouter(languageContextTypes.BR).nfes.nfe.emission;

function renderPanel(estado: string, perms: string[]) {
  granted = perms;
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const detail = { uuid: 'u', estado, code: '1' } as unknown as NfeDetail;
  return render(
    <ChakraProvider value={system}>
      <QueryClientProvider client={client}>
        <NfeEmissionPanel nfeDetail={detail} />
      </QueryClientProvider>
    </ChakraProvider>
  );
}

afterEach(() => cleanup());

describe('NfeEmissionPanel — permissões do legado', () => {
  it('Emitir aparece com nfe_edit (novo) e some sem', () => {
    renderPanel('novo', ['nfe_edit']);
    expect(screen.queryByText(text.emitButton)).not.toBeNull();
    cleanup();
    renderPanel('novo', ['nfe_view', 'nfe_delete']);
    expect(screen.queryByText(text.emitButton)).toBeNull();
  });

  it('CC-e aparece com nfe_edit (aprovado) e Cancelar só com nfe_delete', () => {
    renderPanel('aprovado', ['nfe_edit']);
    expect(screen.queryByText(text.correctButton)).not.toBeNull();
    expect(screen.queryByText(text.cancelButton)).toBeNull();
    cleanup();
    renderPanel('aprovado', ['nfe_delete']);
    expect(screen.queryByText(text.cancelButton)).not.toBeNull();
    expect(screen.queryByText(text.correctButton)).toBeNull();
  });
});
