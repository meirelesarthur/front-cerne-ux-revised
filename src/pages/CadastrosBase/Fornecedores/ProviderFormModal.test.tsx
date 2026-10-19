// @vitest-environment jsdom
// UT-000765 / FE-765-E — modal de edição de Fornecedor não pode fechar (onClose)
// nem perder o dialog quando o detalhe termina de carregar (troca skeleton -> form).
import { ChakraProvider } from '@chakra-ui/react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

const PROVIDER_UUID = '123e4567-e89b-42d3-a456-426614174000';

let queryState: { isLoading: boolean; isFetching: boolean; data: any } = {
  isLoading: true,
  isFetching: true,
  data: undefined,
};

vi.mock('./useProviders', () => ({
  useProviderForm: () => queryState,
}));

vi.mock('./useProviderFormController', () => ({
  useProviderFormController: () => ({
    isSubmitting: false,
    dirtyFields: {},
    handleSubmit: () => () => {},
    onSubmit: () => {},
  }),
}));

vi.mock('./ProviderFormFields', () => ({
  ProviderFormFields: () => <div data-testid="provider-fields">campos</div>,
}));

vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ can: () => true }),
}));

vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({
    languageGB: {
      defaltStrings: { cancel: 'Cancelar', save: 'Salvar', update: 'Atualizar' },
      providers: {
        provider: { form: { title: { edit: 'Editar Fornecedor', create: 'Novo Fornecedor' } } },
      },
    },
  }),
}));

vi.mock('@/components/ButtonSaveAndNext', () => ({
  ButtonSaveAndNext: () => <button type="button">Salvar</button>,
}));

import { ProviderFormModal } from './ProviderFormModal';

function renderModal(onClose: () => void, providerUuid?: string) {
  const ui = (uuid?: string) => (
    <ChakraProvider value={system}>
      <button type="button" data-testid="opener">
        abrir
      </button>
      <ProviderFormModal isOpen onClose={onClose} providerUuid={uuid} onSaved={() => {}} />
    </ChakraProvider>
  );
  const utils = render(ui(providerUuid));
  (screen.getByTestId('opener') as HTMLButtonElement).focus();
  return { ...utils, rerenderModal: () => utils.rerender(ui(providerUuid)) };
}

beforeEach(() => {
  queryState = { isLoading: true, isFetching: true, data: undefined };
});
afterEach(cleanup);

async function flush() {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 50));
  });
}

describe('ProviderFormModal — edição com fornecedor selecionado', () => {
  it('cache frio: não chama onClose e mantém o dialog aberto quando o detalhe termina', async () => {
    const onClose = vi.fn();
    const { rerenderModal } = renderModal(onClose, PROVIDER_UUID);
    await flush();
    expect(screen.getByRole('dialog')).toBeTruthy();

    queryState = { isLoading: false, isFetching: false, data: { uuid: PROVIDER_UUID, name: 'F' } };
    rerenderModal();
    await flush();

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByTestId('provider-fields')).toBeTruthy();
  });

  it('cache quente (refetch): isLoading=false, isFetching=true -> pronto não fecha', async () => {
    const onClose = vi.fn();
    queryState = { isLoading: false, isFetching: true, data: { uuid: PROVIDER_UUID, name: 'F' } };
    const { rerenderModal } = renderModal(onClose, PROVIDER_UUID);
    await flush();
    queryState = { isLoading: false, isFetching: false, data: { uuid: PROVIDER_UUID, name: 'F' } };
    rerenderModal();
    await flush();

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('o dialog (mesmo nó) permanece estável na troca skeleton -> formulário', async () => {
    const onClose = vi.fn();
    const { rerenderModal } = renderModal(onClose, PROVIDER_UUID);
    await flush();
    const before = screen.getByRole('dialog');

    queryState = { isLoading: false, isFetching: false, data: { uuid: PROVIDER_UUID, name: 'F' } };
    rerenderModal();
    await flush();

    expect(screen.getByRole('dialog')).toBe(before);
  });

  it('modo criar continua abrindo e exibindo o formulário', async () => {
    const onClose = vi.fn();
    queryState = { isLoading: false, isFetching: false, data: undefined };
    renderModal(onClose, undefined);
    await flush();
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByTestId('provider-fields')).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();
  });
});
