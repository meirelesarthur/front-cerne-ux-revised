// @vitest-environment jsdom
// Execução 086, FE-01 — diálogo "Cancelar OS": motivo obrigatório (5..1000),
// chamada `POST /service-orders/{uuid}/cancel`, invalidação das 5 telas e toast.
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { languageServiceOrders } from '@/constants/languages/languagePtBr/languageServiceOrders';
import { queryKey } from '@/constants/query-key';

const cancelServiceOrderMock = vi.fn();
const toasterSuccess = vi.fn();

vi.mock('@/services/v2/ServiceOrders/service-order-service', () => ({
  cancelServiceOrder: (...args: unknown[]) => cancelServiceOrderMock(...args),
}));

vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({
    languageGB: {
      serviceOrders: languageServiceOrders,
      defaltStrings: { updateRegister: 'atualizado', cancel: 'Cancelar' },
      common: { errorLog: { unknownError: 'Erro', networkError: 'Rede', byStatus: {} } },
    },
  }),
}));

vi.mock('@/components/ui/toaster', () => ({
  toaster: {
    success: (...args: unknown[]) => toasterSuccess(...args),
    error: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('@/components/CustomDialog', () => ({
  CustomDialog: ({ isOpen, title, children, footer }: any) =>
    isOpen ? (
      <div role="dialog">
        <h2>{title}</h2>
        {children}
        {footer}
      </div>
    ) : null,
}));

import { CancelServiceOrderDialog } from './CancelServiceOrderDialog';

const text = languageServiceOrders.serviceOrder.cancel;

function renderDialog(props: Partial<React.ComponentProps<typeof CancelServiceOrderDialog>> = {}) {
  const onClose = vi.fn();
  const onSuccess = vi.fn();
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

  render(
    <QueryClientProvider client={queryClient}>
      <ChakraProvider value={system}>
        <CancelServiceOrderDialog
          isOpen
          onClose={onClose}
          onSuccess={onSuccess}
          serviceOrder={{ uuid: 'os-1', code: '000123' }}
          {...props}
        />
      </ChakraProvider>
    </QueryClientProvider>
  );

  return { onClose, onSuccess, invalidateSpy };
}

const confirmButton = () => screen.getByText(text.confirm).closest('button') as HTMLButtonElement;
const reasonField = () => screen.getByRole('textbox') as HTMLTextAreaElement;

describe('CancelServiceOrderDialog — execução 086, FE-01', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('mostra o código da OS e não chama a API sem motivo (validação obrigatória)', async () => {
    renderDialog();

    expect(screen.getByText(/000123/)).toBeTruthy();
    fireEvent.click(confirmButton());

    await waitFor(() => expect(screen.getByText(text.validation.reasonRequired)).toBeTruthy());
    expect(cancelServiceOrderMock).not.toHaveBeenCalled();
  });

  it('motivo com menos de 5 caracteres é rejeitado com a mensagem traduzida', async () => {
    renderDialog();

    fireEvent.change(reasonField(), { target: { value: 'abc' } });
    fireEvent.click(confirmButton());

    await waitFor(() =>
      expect(screen.getByText('O motivo deve ter ao menos 5 caracteres')).toBeTruthy()
    );
    expect(cancelServiceOrderMock).not.toHaveBeenCalled();
  });

  it('motivo acima de 1000 caracteres é rejeitado', async () => {
    renderDialog();

    fireEvent.change(reasonField(), { target: { value: 'a'.repeat(1001) } });
    fireEvent.click(confirmButton());

    await waitFor(() =>
      expect(screen.getByText('O motivo deve ter no máximo 1000 caracteres')).toBeTruthy()
    );
    expect(cancelServiceOrderMock).not.toHaveBeenCalled();
  });

  it('motivo válido: POST cancel com o motivo, toast, fecha e invalida as 5 telas', async () => {
    cancelServiceOrderMock.mockResolvedValue({ success: true, data: {} });
    const { onClose, onSuccess, invalidateSpy } = renderDialog();

    fireEvent.change(reasonField(), { target: { value: '  Chuva forte no talhão  ' } });
    fireEvent.click(confirmButton());

    await waitFor(() => expect(cancelServiceOrderMock).toHaveBeenCalledTimes(1));
    expect(cancelServiceOrderMock).toHaveBeenCalledWith('os-1', {
      cancellation_reason: 'Chuva forte no talhão',
    });

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(onClose).toHaveBeenCalled();
    expect(toasterSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ description: text.successToast })
    );

    const invalidatedKeys = invalidateSpy.mock.calls.map(
      (call) => (call[0] as { queryKey: string[] }).queryKey[0]
    );
    [
      queryKey.serviceOrders.serviceOrders,
      queryKey.serviceOrders.serviceOrder,
      queryKey.myServiceOrders.myServiceOrders,
      queryKey.monitoring.monitorings,
      queryKey.ratingServiceOrders.ratingServiceOrders,
    ].forEach((key) => expect(invalidatedKeys).toContain(key));
  });

  it('erro da API (422) não fecha o diálogo nem invalida', async () => {
    cancelServiceOrderMock.mockRejectedValue(new Error('422'));
    const { onClose, onSuccess, invalidateSpy } = renderDialog();

    fireEvent.change(reasonField(), { target: { value: 'Motivo válido' } });
    fireEvent.click(confirmButton());

    await waitFor(() => expect(cancelServiceOrderMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(confirmButton().disabled).toBe(false));
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it('"Voltar" fecha sem chamar a API', () => {
    const { onClose } = renderDialog();

    fireEvent.click(screen.getByText(text.close));

    expect(onClose).toHaveBeenCalled();
    expect(cancelServiceOrderMock).not.toHaveBeenCalled();
  });
});
