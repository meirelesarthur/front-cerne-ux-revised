// @vitest-environment jsdom
// Execução 081, T-081-FE-01 — TransferResponsibleDialog: novo responsável e
// justificativa obrigatórios; opções de `transfer-options` ou pré-carregadas;
// envio injetável (Ciência).
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { languageRequestPurchases } from '@/constants/languages/languagePtBr/languageRequestPurchases';

const listTransferOptionsMock = vi.fn();
const transferMock = vi.fn();

vi.mock('@/services/v2/RequestPurchases/request-purchase-service', () => ({
  listTransferOptions: (...args: any[]) => listTransferOptionsMock(...args),
  transferRequestPurchase: (...args: any[]) => transferMock(...args),
}));

vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({
    languageGB: {
      requestPurchases: languageRequestPurchases,
      defaltStrings: { updateRegister: 'atualizado', cancel: 'Cancelar', confirm: 'Confirmar' },
      common: { errorLog: { unknownError: 'Erro', networkError: 'Rede', byStatus: {} } },
    },
  }),
}));

vi.mock('@/components/ui/toaster', () => ({
  toaster: { success: vi.fn(), error: vi.fn(), create: vi.fn() },
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

vi.mock('@/components/Form/Select', () => ({
  Select: ({ label, options, value, onChange, isDisabled }: any) => (
    <label>
      {label}
      <select
        aria-label={label}
        disabled={isDisabled}
        value={value?.value ?? ''}
        onChange={(event) =>
          onChange(
            options.find((option: any) => String(option.value) === event.target.value) ?? null
          )
        }
      >
        <option value="">--</option>
        {options.map((option: any) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  ),
}));

import { isTransferFormValid, TransferResponsibleDialog } from './TransferResponsibleDialog';

function renderDialog(props: Partial<React.ComponentProps<typeof TransferResponsibleDialog>> = {}) {
  const onClose = vi.fn();
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <ChakraProvider value={system}>
        <TransferResponsibleDialog isOpen onClose={onClose} requestPurchaseUuid="rp-1" {...props} />
      </ChakraProvider>
    </QueryClientProvider>
  );
  return { onClose };
}

function confirmButton() {
  return screen.getByText('Confirmar').closest('button') as HTMLButtonElement;
}

describe('TransferResponsibleDialog — execução 081, T-081-FE-01', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('regra pura: exige responsável E justificativa não vazia', () => {
    expect(isTransferFormValid(null, 'x')).toBe(false);
    expect(isTransferFormValid('u1', '   ')).toBe(false);
    expect(isTransferFormValid('u1', 'motivo')).toBe(true);
  });

  it('responsável obrigatório: só com justificativa, Confirmar fica desabilitado', async () => {
    listTransferOptionsMock.mockResolvedValue([{ uuid: 'u1', name: 'Ana' }]);
    renderDialog();
    await waitFor(() => screen.getByText('Ana'));

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Férias' } });
    expect(confirmButton().disabled).toBe(true);
    fireEvent.click(confirmButton());
    expect(transferMock).not.toHaveBeenCalled();
  });

  it('com responsável e justificativa envia o payload completo', async () => {
    listTransferOptionsMock.mockResolvedValue([{ uuid: 'u1', name: 'Ana' }]);
    transferMock.mockResolvedValue({ data: {}, success: true });
    const { onClose } = renderDialog();
    await waitFor(() => screen.getByText('Ana'));

    fireEvent.change(screen.getByLabelText('Novo Responsável'), { target: { value: 'u1' } });
    fireEvent.change(screen.getByRole('textbox'), { target: { value: ' Férias ' } });
    expect(confirmButton().disabled).toBe(false);
    fireEvent.click(confirmButton());

    await waitFor(() => expect(transferMock).toHaveBeenCalledTimes(1));
    expect(transferMock).toHaveBeenCalledWith('rp-1', {
      responsible_uuid: 'u1',
      justify: 'Férias',
    });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('sem usuários disponíveis: estado vazio honesto', async () => {
    listTransferOptionsMock.mockResolvedValue([]);
    renderDialog();
    await waitFor(() => screen.getByText('Nenhum usuário disponível'));
  });

  it('erro ao carregar: mensagem e "Tentar novamente" refaz a busca', async () => {
    listTransferOptionsMock.mockRejectedValueOnce(new Error('falhou'));
    renderDialog();
    await waitFor(() => screen.getByText('Não foi possível carregar os usuários.'));

    listTransferOptionsMock.mockResolvedValueOnce([{ uuid: 'u2', name: 'Bruno' }]);
    fireEvent.click(screen.getByText('Tentar novamente'));
    await waitFor(() => screen.getByText('Bruno'));
  });

  it('opções pré-carregadas (Ciência) dispensam transfer-options e usam o envio injetado', async () => {
    const submit = vi.fn().mockResolvedValue({ data: {}, success: true });
    renderDialog({ options: [{ uuid: 'c1', name: 'Carla' }], submit });
    expect(screen.getByText('Carla')).toBeTruthy();
    expect(listTransferOptionsMock).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Novo Responsável'), { target: { value: 'c1' } });
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Motivo' } });
    fireEvent.click(confirmButton());

    await waitFor(() =>
      expect(submit).toHaveBeenCalledWith({ responsible_uuid: 'c1', justify: 'Motivo' })
    );
    expect(transferMock).not.toHaveBeenCalled();
  });
});
