// UT-000754 / T-754-FE-01 — FE-SYNC-01..06 (Buscar DFe: contagem real,
// ambiente, erros distintos, retry e botão travado em `isPending`).
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AxiosError } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { getLanguageRouter } from '@/utils/get-language-route';

import BuscarDfe from './BuscarDfe';

const mocks = vi.hoisted(() => ({
  syncNfses: vi.fn(),
  navigate: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('@/services/v2/BaseRegistrations/nfse-service', () => ({ syncNfses: mocks.syncNfses }));
vi.mock('@/services/v2/Issuers/issuer-service', () => ({ listIssuers: vi.fn() }));
vi.mock('react-router-dom', () => ({ useNavigate: () => mocks.navigate }));
vi.mock('@/components/ui/toaster', () => ({
  toaster: { success: mocks.toastSuccess, error: mocks.toastError },
}));
vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({ languageGB: getLanguageRouter('BR') }),
}));
vi.mock('@/components/ContainerGrid', () => ({
  ContainerGrid: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/components/Button', () => ({
  Button: ({ title, onClick, disabled }: any) => (
    <button type="button" onClick={onClick} disabled={disabled}>
      {title}
    </button>
  ),
}));
vi.mock('@/components/Form/SelectAsyncPaginate', () => ({
  SelectAsyncPaginate: ({ onChange }: any) => (
    <button
      type="button"
      data-testid="pick-issuer"
      onClick={() => onChange({ label: 'Emissor', value: 'issuer-uuid-1' })}
    >
      pick
    </button>
  ),
}));

const text = getLanguageRouter('BR')!.baseRegistrations.nfse.syncScreen;

function renderScreen() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <ChakraProvider value={system}>
      <QueryClientProvider client={client}>
        <BuscarDfe />
      </QueryClientProvider>
    </ChakraProvider>
  );
}

function httpError(status: number, message: string) {
  return new AxiosError('fail', 'ERR', undefined, undefined, {
    status,
    data: { message },
  } as any);
}

async function submit() {
  fireEvent.click(screen.getByTestId('pick-issuer'));
  const button = await screen.findByRole('button', { name: text.submitButton });
  await waitFor(() => expect((button as HTMLButtonElement).disabled).toBe(false));
  fireEvent.click(button);
}

describe('BuscarDfe (UT-000754)', () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('FE-SYNC-01 usa meta.synced_count mesmo com data vazio e sufixa homologação', async () => {
    mocks.syncNfses.mockResolvedValue({
      data: [],
      meta: { synced_count: 2, environment: 'homologacao' },
    });
    renderScreen();
    await submit();
    await waitFor(() => expect(mocks.toastSuccess).toHaveBeenCalled());
    const description = mocks.toastSuccess.mock.calls[0][0].description as string;
    expect(description).toContain(`2 ${text.successToast}`);
    expect(description).toContain(text.environmentHomologation);
    expect(mocks.navigate).toHaveBeenCalledWith('/cadastros-base/nfse-recebidas');
  });

  it('FE-SYNC-02 contagem 0 mostra "nenhuma NFS-e nova"', async () => {
    mocks.syncNfses.mockResolvedValue({
      data: [],
      meta: { synced_count: 0, environment: 'producao' },
    });
    renderScreen();
    await submit();
    await waitFor(() => expect(mocks.toastSuccess).toHaveBeenCalled());
    expect(mocks.toastSuccess.mock.calls[0][0].description).toBe(text.successNone);
  });

  it('FE-SYNC-03 sem meta cai em data.length', async () => {
    mocks.syncNfses.mockResolvedValue({ data: [{}, {}, {}] });
    renderScreen();
    await submit();
    await waitFor(() => expect(mocks.toastSuccess).toHaveBeenCalled());
    expect(mocks.toastSuccess.mock.calls[0][0].description).toBe(`3 ${text.successToast}`);
  });

  it('FE-SYNC-04 422 mostra a mensagem da API e os 2 links, sem texto fixo de certificado', async () => {
    const message = 'Emissor sem ambiente configurado.';
    mocks.syncNfses.mockRejectedValue(httpError(422, message));
    renderScreen();
    await submit();
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByText(message)).toBeTruthy();
    expect(screen.queryByText(text.certificateMissingError)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: text.issuerLink }));
    expect(mocks.navigate).toHaveBeenCalledWith('/cadastros-base/emissores/issuer-uuid-1');
    fireEvent.click(screen.getByRole('button', { name: text.certificateMissingLink }));
    expect(mocks.navigate).toHaveBeenCalledWith(
      '/cadastros-base/emissores/issuer-uuid-1/certificado'
    );
    expect(screen.queryByRole('button', { name: text.retryButton })).toBeNull();
  });

  it('FE-SYNC-05 503 mostra a mensagem e "Tentar novamente" reenvia o mesmo emissor', async () => {
    mocks.syncNfses.mockRejectedValue(httpError(503, 'Serviço indisponível.'));
    renderScreen();
    await submit();
    expect(await screen.findByText('Serviço indisponível.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: text.retryButton }));
    await waitFor(() => expect(mocks.syncNfses).toHaveBeenCalledTimes(2));
    expect(mocks.syncNfses).toHaveBeenLastCalledWith({ issuer_uuid: 'issuer-uuid-1' });
  });

  it('FE-SYNC-06 botão fica desabilitado durante isPending (duplo clique)', async () => {
    mocks.syncNfses.mockReturnValue(new Promise(() => {}));
    renderScreen();
    await submit();
    await screen.findByText(text.loadingMessage);
    const button = screen.getByRole('button', { name: text.submitButton }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    fireEvent.click(button);
    expect(mocks.syncNfses).toHaveBeenCalledTimes(1);
  });
});
