// @vitest-environment jsdom
// T-743-FE-04 (F3) — TF-15: o modal REAL "Enviar para Autorização" (sem mock do dialog, do
// Select nem do resolver). Antes o resolver do payload (`string().trim()`) recebia a
// `Option` do Select e estourava `val.trim is not a function`, sem POST. Aqui o POST é
// conferido pelo CORPO: `authorizer_uuid` é string uuid, nunca a Option.
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { languagePtBr } from '@/constants/languages/languagePtBr';

import { SendForAuthorizationDialog } from './SendForAuthorizationDialog';

const AUTHORIZER_UUID = '22222222-2222-4222-8222-222222222222';
const REQUEST_UUID = '11111111-1111-4111-8111-111111111111';
const text = languagePtBr.BR.requestAuthorizations.requestAuthorization;
const dialogText = text.sendForAuthorization;

vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({
    languageInUse: 'BR',
    languageGB: languagePtBr.BR,
    updateLanguageGB: vi.fn(),
  }),
}));

const toasts = vi.hoisted(() => ({ create: vi.fn(), success: vi.fn(), error: vi.fn() }));
vi.mock('@/components/ui/toaster', () => ({ toaster: toasts }));

const svc = vi.hoisted(() => ({ acknowledgeRequestAuthorization: vi.fn() }));
vi.mock('@/services/v2/RequestAuthorizations/request-authorization-service', () => svc);

const authorizers = [{ uuid: AUTHORIZER_UUID, name: 'Maria Autorizadora' }] as any;

function setup(props: Partial<Parameters<typeof SendForAuthorizationDialog>[0]> = {}) {
  const onClose = vi.fn();
  const onSuccess = vi.fn();
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <ChakraProvider value={system}>
      <QueryClientProvider client={client}>
        <SendForAuthorizationDialog
          isOpen
          onClose={onClose}
          onSuccess={onSuccess}
          authorizationUuid={REQUEST_UUID}
          eligibleAuthorizers={authorizers}
          requiresRatio={false}
          getRatioPayload={() => ({})}
          initialJustify=""
          {...props}
        />
      </QueryClientProvider>
    </ChakraProvider>
  );
  return { onClose, onSuccess };
}

async function pickAuthorizer() {
  const trigger = await screen.findByRole('combobox');
  fireEvent.click(trigger);
  await waitFor(() => expect(document.querySelector('[data-part="item"]')).not.toBeNull());
  fireEvent.click(document.querySelector('[data-part="item"]') as Element);
}

describe('SendForAuthorizationDialog (real) — TF-15', () => {
  beforeEach(() => {
    // jsdom não implementa scrollTo (o Select do zag rola até o item selecionado).
    Element.prototype.scrollTo = vi.fn();
    svc.acknowledgeRequestAuthorization.mockReset();
    svc.acknowledgeRequestAuthorization.mockResolvedValue({ data: {} });
    Object.values(toasts).forEach((fn) => fn.mockReset());
  });
  afterEach(cleanup);

  it('escolhendo o autorizador, faz o POST com authorizer_uuid string uuid (sem val.trim)', async () => {
    const { onSuccess } = setup();
    await pickAuthorizer();
    fireEvent.click(screen.getByText(dialogText.sendButton));

    await waitFor(() => expect(svc.acknowledgeRequestAuthorization).toHaveBeenCalledTimes(1));
    const [uuid, body] = svc.acknowledgeRequestAuthorization.mock.calls[0];
    expect(uuid).toBe(REQUEST_UUID);
    expect(body).toEqual({ status: 3, authorizer_uuid: AUTHORIZER_UUID, justify: undefined });
    expect(typeof body.authorizer_uuid).toBe('string');
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
  });

  it('leva o rateio no corpo quando o bloco é exigido', async () => {
    setup({
      requiresRatio: true,
      getRatioPayload: () => ({ harvest_uuid: 'harvest-1', classification: 'C' }),
    });
    await pickAuthorizer();
    fireEvent.click(screen.getByText(dialogText.sendButton));

    await waitFor(() => expect(svc.acknowledgeRequestAuthorization).toHaveBeenCalledTimes(1));
    expect(svc.acknowledgeRequestAuthorization.mock.calls[0][1]).toEqual({
      status: 3,
      authorizer_uuid: AUTHORIZER_UUID,
      justify: undefined,
      harvest_uuid: 'harvest-1',
      classification: 'C',
    });
  });

  it('TF-18 (D-100-22): rateio exigido sem Safra/Classificação ENVIA, com corpo sem as chaves', async () => {
    const { onSuccess } = setup({
      requiresRatio: true,
      getRatioPayload: () => ({
        categories: ['cat'],
        centers: ['ctr'],
        category_percent_values: [100],
      }),
    });
    await pickAuthorizer();
    fireEvent.click(screen.getByText(dialogText.sendButton));

    await waitFor(() => expect(svc.acknowledgeRequestAuthorization).toHaveBeenCalledTimes(1));
    const body = svc.acknowledgeRequestAuthorization.mock.calls[0][1];
    expect(body).toStrictEqual({
      status: 3,
      authorizer_uuid: AUTHORIZER_UUID,
      justify: undefined,
      categories: ['cat'],
      centers: ['ctr'],
      category_percent_values: [100],
    });
    expect(body).not.toHaveProperty('harvest_uuid');
    expect(body).not.toHaveProperty('classification');
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
  });

  it('sem autorizador: mostra a mensagem do schema e não faz POST', async () => {
    setup();
    fireEvent.click(screen.getByText(dialogText.sendButton));

    expect(await screen.findByText(text.validation.authorizerRequired)).toBeTruthy();
    expect(svc.acknowledgeRequestAuthorization).not.toHaveBeenCalled();
  });

  it('422 de harvest_uuid repassa ao container e fecha o modal', async () => {
    svc.acknowledgeRequestAuthorization.mockRejectedValue(
      Object.assign(new Error('422'), {
        isAxiosError: true,
        response: {
          status: 422,
          data: { message: 'x', errors: { harvest_uuid: ['Safra inválida.'] } },
        },
      })
    );
    const onRatioServerError = vi.fn();
    const { onClose } = setup({ onRatioServerError });
    await pickAuthorizer();
    fireEvent.click(screen.getByText(dialogText.sendButton));

    await waitFor(() => expect(onRatioServerError).toHaveBeenCalledTimes(1));
    expect(onClose).toHaveBeenCalled();
  });
});
