// @vitest-environment jsdom
// Execução 081, T-081-FE-01 — StepBackDialog: justificativa e status de destino
// obrigatórios; payload com `justify`; campos somente leitura do detalhe.
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { languageRequestPurchases } from '@/constants/languages/languagePtBr/languageRequestPurchases';

const getRequestPurchaseMock = vi.fn();
const changeStatusMock = vi.fn();

vi.mock('@/services/v2/RequestPurchases/request-purchase-service', () => ({
  getRequestPurchase: (...args: any[]) => getRequestPurchaseMock(...args),
  changeRequestPurchaseStatus: (...args: any[]) => changeStatusMock(...args),
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

import { StepBackDialog } from './StepBackDialog';

const detail = {
  uuid: 'rp-1',
  code: '1234',
  request_date: '2026-09-01',
  duration_label: '3 dias',
  user: { uuid: 'u1', name: 'Maria Solicitante' },
  farm: { uuid: 'f1', description: 'Fazenda Boa Vista' },
  status: 6,
  status_label: 'Aguardando a Compra',
  available_status_transitions: [
    { value: 2, label: 'Cotação em Andamento' },
    { value: 1, label: 'Solicitação' },
  ],
};

function renderDialog(onClose = vi.fn()) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return {
    onClose,
    ...render(
      <QueryClientProvider client={queryClient}>
        <ChakraProvider value={system}>
          <StepBackDialog isOpen onClose={onClose} requestPurchaseUuid="rp-1" />
        </ChakraProvider>
      </QueryClientProvider>
    ),
  };
}

describe('StepBackDialog — execução 081, T-081-FE-01', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('mostra título e campos somente leitura do legado', async () => {
    getRequestPurchaseMock.mockResolvedValue({ data: detail });
    renderDialog();

    expect(screen.getByText('Voltar Etapa da Solicitação')).toBeTruthy();
    await waitFor(() => screen.getByText('Maria Solicitante'));
    expect(screen.getByText('1234')).toBeTruthy();
    expect(screen.getByText('01/09/2026')).toBeTruthy();
    expect(screen.getByText('3 dias')).toBeTruthy();
    expect(screen.getByText('Fazenda Boa Vista')).toBeTruthy();
    expect(screen.getByText('Aguardando a Compra')).toBeTruthy();
    expect(screen.getByText('Status Atual')).toBeTruthy();
  });

  it('justificativa obrigatória: com status escolhido e sem justificativa, Salvar fica desabilitado e não envia', async () => {
    getRequestPurchaseMock.mockResolvedValue({ data: detail });
    renderDialog();
    await waitFor(() => screen.getByText('Maria Solicitante'));

    fireEvent.change(screen.getByLabelText('Mudar para Status'), { target: { value: '2' } });
    const save = screen.getByText('Salvar').closest('button') as HTMLButtonElement;
    expect(save.disabled).toBe(true);
    fireEvent.click(save);
    expect(changeStatusMock).not.toHaveBeenCalled();

    // justificativa só com espaços continua inválida
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '   ' } });
    expect((screen.getByText('Salvar').closest('button') as HTMLButtonElement).disabled).toBe(true);
  });

  it('com status e justificativa, envia { status, justify } e fecha', async () => {
    getRequestPurchaseMock.mockResolvedValue({ data: detail });
    changeStatusMock.mockResolvedValue({ data: detail, success: true });
    const { onClose } = renderDialog();
    await waitFor(() => screen.getByText('Maria Solicitante'));

    fireEvent.change(screen.getByLabelText('Mudar para Status'), { target: { value: '2' } });
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '  Cotação refeita  ' } });
    const save = screen.getByText('Salvar').closest('button') as HTMLButtonElement;
    expect(save.disabled).toBe(false);
    fireEvent.click(save);

    await waitFor(() => expect(changeStatusMock).toHaveBeenCalledTimes(1));
    expect(changeStatusMock).toHaveBeenCalledWith('rp-1', {
      status: 2,
      justify: 'Cotação refeita',
    });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('sem etapas anteriores: estado vazio honesto e Salvar desabilitado', async () => {
    getRequestPurchaseMock.mockResolvedValue({
      data: { ...detail, available_status_transitions: [] },
    });
    renderDialog();
    await waitFor(() =>
      screen.getByText('Nenhuma etapa anterior disponível para esta solicitação.')
    );
    expect((screen.getByText('Salvar').closest('button') as HTMLButtonElement).disabled).toBe(true);
  });
});
