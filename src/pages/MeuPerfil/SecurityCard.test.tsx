// @vitest-environment jsdom
// src/pages/MeuPerfil/SecurityCard.test.tsx
// Execução 071, TASK-071-FE-04 — contrato de tela §5, D2 (regra do legado,
// mínimo 6 caracteres, diferente da atual, NUNCA os 8 + complexidade da UX).
// Matriz FID-G3F FE04-T01..T06.

import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AxiosError } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

const changeOwnPasswordMock = vi.fn();

vi.mock('@/services/v2/Me/me-service', () => ({
  changeOwnPassword: (...args: any[]) => changeOwnPasswordMock(...args),
}));

const securityText = {
  title: 'Segurança',
  currentPassword: { label: 'Senha atual', requiredError: 'Campo obrigatório.' },
  newPassword: {
    label: 'Nova senha',
    hint: 'Mínimo 6 caracteres, diferente da senha atual.',
    requiredError: 'Campo obrigatório.',
    minError: 'Mínimo 6 caracteres.',
    sameAsCurrentError: 'A nova senha deve ser diferente da atual.',
  },
  confirmPassword: {
    label: 'Confirmar nova senha',
    requiredError: 'Campo obrigatório.',
    mismatchError: 'As senhas não coincidem.',
  },
  submitButton: 'Alterar senha',
  saveSuccessMessage: 'Senha alterada com sucesso.',
};

const languageGBStub = {
  common: {
    myProfile: { security: securityText },
    errorLog: {
      unknownError: 'Erro desconhecido.',
      networkError: 'Erro de rede.',
      byStatus: { forbidden: '-', notFound: '-', conflict: '-', server: '-' },
    },
  },
  defaltStrings: {
    updateRegister: 'atualizado(a) com sucesso',
    createRegister: 'criado(a) com sucesso',
    exportRegister: 'exportado(a) com sucesso',
    revokeRegister: 'revogado(a) com sucesso',
    restoreRegister: 'restaurado(a) com sucesso',
    appliedRegister: 'aplicado(a) com sucesso',
  },
};

vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({
    languageGB: languageGBStub,
    languageInUse: 'BR',
    updateLanguageGB: vi.fn(),
  }),
}));

vi.mock('@/components/ui/toaster', () => ({
  toaster: { success: vi.fn(), error: vi.fn(), create: vi.fn() },
}));

import { toaster } from '@/components/ui/toaster';

import { SecurityCard } from './SecurityCard';

function make422(errors: Record<string, string[]>) {
  const error = new AxiosError('Unprocessable', '422');
  (error as any).response = {
    status: 422,
    data: { success: false, message: 'Os dados informados são inválidos.', data: null, errors },
  };
  return error;
}

function renderCard(onDirtyChange = vi.fn()) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return {
    onDirtyChange,
    ...render(
      <QueryClientProvider client={queryClient}>
        <ChakraProvider value={system}>
          <SecurityCard onDirtyChange={onDirtyChange} />
        </ChakraProvider>
      </QueryClientProvider>
    ),
  };
}

describe('SecurityCard — Execução 071, TASK-071-FE-04', () => {
  // `cleanup()` OBRIGATÓRIO — mirror `PersonalDataCard.test.tsx` (sem
  // auto-cleanup neste projeto, `render()`s se acumulam entre `it`s).
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('FE04-T01 — submit vazio → 3 erros obrigatórios; sem request', async () => {
    renderCard();

    fireEvent.click(screen.getByText('Alterar senha'));

    await waitFor(() => {
      expect(screen.getAllByText('Campo obrigatório.').length).toBe(3);
    });
    expect(changeOwnPasswordMock).not.toHaveBeenCalled();
  });

  it('FE04-T02 — nova com 5 chars → "Mínimo 6 caracteres."; nova igual à atual → "diferente"; "abcdef" (6, sem complexidade) é aceita', async () => {
    renderCard();
    const inputs = screen.getAllByLabelText(/senha/i, { exact: false }) as HTMLInputElement[];
    const [currentInput, newInput, confirmInput] = inputs;

    fireEvent.change(currentInput, { target: { value: 'outrasenha' } });
    fireEvent.change(newInput, { target: { value: '12345' } });
    fireEvent.change(confirmInput, { target: { value: '12345' } });
    fireEvent.click(screen.getByText('Alterar senha'));
    await waitFor(() => screen.getByText('Mínimo 6 caracteres.'));

    fireEvent.change(currentInput, { target: { value: 'abcdef' } });
    fireEvent.change(newInput, { target: { value: 'abcdef' } });
    fireEvent.change(confirmInput, { target: { value: 'abcdef' } });
    fireEvent.click(screen.getByText('Alterar senha'));
    await waitFor(() => screen.getByText('A nova senha deve ser diferente da atual.'));

    changeOwnPasswordMock.mockResolvedValueOnce({
      success: true,
      message: null,
      data: null,
      errors: null,
      meta: null,
    });
    fireEvent.change(currentInput, { target: { value: 'senhaatual' } });
    fireEvent.change(newInput, { target: { value: 'abcdef' } });
    fireEvent.change(confirmInput, { target: { value: 'abcdef' } });
    fireEvent.click(screen.getByText('Alterar senha'));

    await waitFor(() => expect(changeOwnPasswordMock).toHaveBeenCalled());
  });

  it('FE04-T03 — confirmação diferente → "As senhas não coincidem."', async () => {
    renderCard();
    const [currentInput, newInput, confirmInput] = screen.getAllByLabelText(/senha/i, {
      exact: false,
    }) as HTMLInputElement[];

    fireEvent.change(currentInput, { target: { value: 'senhaatual' } });
    fireEvent.change(newInput, { target: { value: 'novasenha' } });
    fireEvent.change(confirmInput, { target: { value: 'diferente' } });
    fireEvent.click(screen.getByText('Alterar senha'));

    await waitFor(() => screen.getByText('As senhas não coincidem.'));
  });

  it('FE04-T04 — válido → changeOwnPassword com os 3 campos; toast uma vez; campos vazios', async () => {
    changeOwnPasswordMock.mockResolvedValueOnce({
      success: true,
      message: null,
      data: null,
      errors: null,
      meta: null,
    });
    renderCard();
    const [currentInput, newInput, confirmInput] = screen.getAllByLabelText(/senha/i, {
      exact: false,
    }) as HTMLInputElement[];

    fireEvent.change(currentInput, { target: { value: 'senhaatual' } });
    fireEvent.change(newInput, { target: { value: 'novasenha' } });
    fireEvent.change(confirmInput, { target: { value: 'novasenha' } });
    fireEvent.click(screen.getByText('Alterar senha'));

    await waitFor(() => {
      expect(changeOwnPasswordMock).toHaveBeenCalledWith({
        current_password: 'senhaatual',
        password: 'novasenha',
        password_confirmation: 'novasenha',
      });
    });
    await waitFor(() => expect(toaster.success).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(currentInput.value).toBe(''));
    expect(newInput.value).toBe('');
    expect(confirmInput.value).toBe('');
  });

  it('FE04-T05 — 422 current_password exibido no campo Senha atual', async () => {
    changeOwnPasswordMock.mockRejectedValueOnce(
      make422({ current_password: ['O campo da senha atual não corresponde à sua senha'] })
    );
    renderCard();
    const [currentInput, newInput, confirmInput] = screen.getAllByLabelText(/senha/i, {
      exact: false,
    }) as HTMLInputElement[];

    fireEvent.change(currentInput, { target: { value: 'senhaerrada' } });
    fireEvent.change(newInput, { target: { value: 'novasenha' } });
    fireEvent.change(confirmInput, { target: { value: 'novasenha' } });
    fireEvent.click(screen.getByText('Alterar senha'));

    await waitFor(() => screen.getByText('O campo da senha atual não corresponde à sua senha'));
  });

  it('FE04-T06 — digitar em qualquer campo → onDirtyChange(true); depois do sucesso → false', async () => {
    changeOwnPasswordMock.mockResolvedValueOnce({
      success: true,
      message: null,
      data: null,
      errors: null,
      meta: null,
    });
    const onDirtyChange = vi.fn();
    renderCard(onDirtyChange);
    const [currentInput, newInput, confirmInput] = screen.getAllByLabelText(/senha/i, {
      exact: false,
    }) as HTMLInputElement[];

    fireEvent.change(currentInput, { target: { value: 'senhaatual' } });
    await waitFor(() => expect(onDirtyChange).toHaveBeenCalledWith(true));

    fireEvent.change(newInput, { target: { value: 'novasenha' } });
    fireEvent.change(confirmInput, { target: { value: 'novasenha' } });
    fireEvent.click(screen.getByText('Alterar senha'));

    await waitFor(() => expect(onDirtyChange).toHaveBeenLastCalledWith(false));
  });
});
