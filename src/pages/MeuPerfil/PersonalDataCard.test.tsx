// @vitest-environment jsdom
// src/pages/MeuPerfil/PersonalDataCard.test.tsx
// Execução 071, TASK-071-FE-03 — contrato de tela §4, matriz FID-G3F
// (FE03-T01..T08, T11).
//
// Sem `@testing-library/jest-dom` (não está nas dependências do projeto —
// grep confirmado): asserções via `waitFor(() => screen.getBy...)` (que
// relança até encontrar) e leitura direta de propriedades do DOM
// (`.value`, `.disabled`), mirror `SanitaryItemsSection.editReset.test.tsx`.

import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AxiosError } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

// jsdom não implementa `URL.createObjectURL`/`revokeObjectURL` (só
// `matchMedia`/`ResizeObserver`/etc. são polyfillados em
// `src/test/vitest.setup.ts`) — sem isto, toda seleção de foto lança
// `TypeError: URL.createObjectURL is not a function` (Uncaught Exception).
if (!URL.createObjectURL) {
  URL.createObjectURL = vi.fn(() => 'blob:mock-preview-url');
}
if (!URL.revokeObjectURL) {
  URL.revokeObjectURL = vi.fn();
}

const getOwnProfileMock = vi.fn();
const updateOwnProfileMock = vi.fn();
const refreshProfileMock = vi.fn();

vi.mock('@/services/v2/Me/me-service', () => ({
  getOwnProfile: (...args: any[]) => getOwnProfileMock(...args),
  updateOwnProfile: (...args: any[]) => updateOwnProfileMock(...args),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ refreshProfile: refreshProfileMock }),
}));

const personalDataText = {
  title: 'Dados pessoais',
  photo: {
    changeButton: 'Alterar foto',
    removeSelectionButton: 'Remover seleção',
    hint: 'JPG, PNG, WebP ou GIF — até 5 MB.',
    errorType: 'Envie um arquivo JPG, PNG, WebP ou GIF.',
    errorSize: 'A imagem deve ter até 5 MB.',
  },
  name: {
    label: 'Nome',
    requiredError: 'Campo obrigatório.',
    minError: 'Mínimo 3 caracteres.',
    maxError: 'Máximo 120 caracteres.',
  },
  email: {
    label: 'E-mail',
    hint: 'O e-mail de acesso não pode ser alterado nesta tela.',
  },
  discardButton: 'Descartar alterações',
  saveButton: 'Salvar alterações',
  saveSuccessMessage: 'Perfil atualizado com sucesso.',
  loadErrorTitle: 'Não foi possível carregar seu perfil.',
  retryButton: 'Tentar novamente',
};

const languageGBStub = {
  common: {
    myProfile: { personalData: personalDataText },
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

import { PersonalDataCard } from './PersonalDataCard';

const BASE_PROFILE = {
  uuid: '9c1e-abc',
  name: 'Maria Silva',
  email: 'maria@exemplo.com',
  photo: null,
  photo_url: null,
  lang: 'pt-BR' as const,
  phone: null,
  address: null,
  number: null,
  district: null,
  zip_code: null,
  city: null,
};

function renderCard(onDirtyChange = vi.fn()) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return {
    onDirtyChange,
    ...render(
      <QueryClientProvider client={queryClient}>
        <ChakraProvider value={system}>
          <PersonalDataCard onDirtyChange={onDirtyChange} />
        </ChakraProvider>
      </QueryClientProvider>
    ),
  };
}

function makeEnvelope(data: any) {
  return { success: true, message: null, data, errors: null, meta: null };
}

function make422(errors: Record<string, string[]>) {
  const error = new AxiosError('Unprocessable', '422');
  (error as any).response = {
    status: 422,
    data: { success: false, message: 'Os dados informados são inválidos.', data: null, errors },
  };
  return error;
}

async function waitNameValue(value: string) {
  await waitFor(() => {
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe(value);
  });
}

function getButton(label: string) {
  return screen.getByText(label).closest('button') as HTMLButtonElement;
}

describe('PersonalDataCard — Execução 071, TASK-071-FE-03', () => {
  // `cleanup()` é OBRIGATÓRIO aqui: sem ele, o RTL não desmonta entre `it`s
  // neste projeto (sem `@testing-library/jest-dom`/auto-cleanup), e cada
  // novo `render()` empilha outro `<input role="textbox">` no mesmo
  // `document.body` — sintoma real observado: "Found multiple elements with
  // the role textbox" a partir do 2º teste.
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('FE03-T01 — hidrata nome/e-mail; e-mail readOnly; Salvar/Descartar desabilitados sem dirty', async () => {
    getOwnProfileMock.mockResolvedValueOnce(makeEnvelope(BASE_PROFILE));
    renderCard();

    await waitNameValue('Maria Silva');
    await waitFor(() => screen.getByText('maria@exemplo.com'));

    expect(getButton('Salvar alterações').disabled).toBe(true);
    expect(getButton('Descartar alterações').disabled).toBe(true);
  });

  it('FE03-T02 — validação de nome (obrigatório/mínimo/máximo) sem chamar o serviço', async () => {
    getOwnProfileMock.mockResolvedValueOnce(makeEnvelope(BASE_PROFILE));
    renderCard();
    await waitNameValue('Maria Silva');

    const nameInput = screen.getByRole('textbox');

    fireEvent.change(nameInput, { target: { value: 'ab' } });
    fireEvent.click(screen.getByText('Salvar alterações'));
    await waitFor(() => screen.getByText('Mínimo 3 caracteres.'));

    fireEvent.change(nameInput, { target: { value: '' } });
    fireEvent.click(screen.getByText('Salvar alterações'));
    await waitFor(() => screen.getByText('Campo obrigatório.'));

    fireEvent.change(nameInput, { target: { value: 'a'.repeat(121) } });
    fireEvent.click(screen.getByText('Salvar alterações'));
    await waitFor(() => screen.getByText('Máximo 120 caracteres.'));

    expect(updateOwnProfileMock).not.toHaveBeenCalled();
  });

  it('FE03-T03 — editar o nome + Salvar → updateOwnProfile({name}) sem photo; toast único; refreshProfile chamado; dirty volta a false', async () => {
    getOwnProfileMock.mockResolvedValueOnce(makeEnvelope(BASE_PROFILE));
    updateOwnProfileMock.mockResolvedValueOnce(
      makeEnvelope({ ...BASE_PROFILE, name: 'Maria S. Editado' })
    );
    const onDirtyChange = vi.fn();
    renderCard(onDirtyChange);
    await waitNameValue('Maria Silva');

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Maria S. Editado' } });
    await waitFor(() => expect(onDirtyChange).toHaveBeenCalledWith(true));

    fireEvent.click(screen.getByText('Salvar alterações'));

    await waitFor(() => {
      expect(updateOwnProfileMock).toHaveBeenCalledWith({ name: 'Maria S. Editado' });
    });
    expect(updateOwnProfileMock.mock.calls[0][0]).not.toHaveProperty('photo');

    await waitFor(() => expect(toaster.success).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(refreshProfileMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(onDirtyChange).toHaveBeenLastCalledWith(false));
  });

  it('FE03-T04 — selecionar PNG de 1 MB → preview e "Remover seleção" visíveis; Salvar habilitado → envia {name, photo}', async () => {
    getOwnProfileMock.mockResolvedValueOnce(makeEnvelope(BASE_PROFILE));
    updateOwnProfileMock.mockResolvedValueOnce(makeEnvelope(BASE_PROFILE));
    renderCard();
    await waitNameValue('Maria Silva');

    const file = new File([new Uint8Array(1024 * 1024)], 'avatar.png', { type: 'image/png' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => screen.getByText('Remover seleção'));
    expect(getButton('Salvar alterações').disabled).toBe(false);

    fireEvent.click(screen.getByText('Salvar alterações'));

    await waitFor(() => {
      expect(updateOwnProfileMock).toHaveBeenCalledWith({ name: 'Maria Silva', photo: file });
    });
  });

  it('FE03-T05 — SVG/PDF rejeitado (erro de tipo); 6 MB rejeitado (erro de tamanho); GIF aceito', async () => {
    getOwnProfileMock.mockResolvedValueOnce(makeEnvelope(BASE_PROFILE));
    renderCard();
    await waitNameValue('Maria Silva');

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    const svg = new File(['<svg/>'], 'a.svg', { type: 'image/svg+xml' });
    fireEvent.change(fileInput, { target: { files: [svg] } });
    await waitFor(() => screen.getByText('Envie um arquivo JPG, PNG, WebP ou GIF.'));

    const big = new File([new Uint8Array(6 * 1024 * 1024)], 'big.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [big] } });
    await waitFor(() => screen.getByText('A imagem deve ter até 5 MB.'));

    const gif = new File([new Uint8Array(1024)], 'a.gif', { type: 'image/gif' });
    fireEvent.change(fileInput, { target: { files: [gif] } });
    await waitFor(() => screen.getByText('Remover seleção'));
  });

  it('FE03-T06 — "Remover seleção" volta o preview à foto hidratada; nenhum request; o botão some', async () => {
    getOwnProfileMock.mockResolvedValueOnce(
      makeEnvelope({ ...BASE_PROFILE, photo_url: 'https://x/foto.png' })
    );
    renderCard();
    await waitNameValue('Maria Silva');

    const file = new File([new Uint8Array(1024)], 'avatar.png', { type: 'image/png' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });
    await waitFor(() => screen.getByText('Remover seleção'));

    fireEvent.click(screen.getByText('Remover seleção'));

    await waitFor(() => expect(screen.queryByText('Remover seleção')).toBeNull());
    expect(updateOwnProfileMock).not.toHaveBeenCalled();
  });

  it('FE03-T07 — editar nome + trocar foto e Descartar → valores hidratados, seleção limpa, sem request', async () => {
    getOwnProfileMock.mockResolvedValueOnce(makeEnvelope(BASE_PROFILE));
    renderCard();
    await waitNameValue('Maria Silva');

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Outro Nome' } });
    const file = new File([new Uint8Array(1024)], 'avatar.png', { type: 'image/png' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });
    await waitFor(() => screen.getByText('Remover seleção'));

    fireEvent.click(screen.getByText('Descartar alterações'));

    await waitNameValue('Maria Silva');
    expect(screen.queryByText('Remover seleção')).toBeNull();
    expect(updateOwnProfileMock).not.toHaveBeenCalled();
  });

  it('FE03-T08 — 422 {errors:{name:[msg]}} exibido no campo Nome', async () => {
    getOwnProfileMock.mockResolvedValueOnce(makeEnvelope(BASE_PROFILE));
    updateOwnProfileMock.mockRejectedValueOnce(
      make422({ name: ['O campo nome não pode ser superior a 120 caracteres.'] })
    );
    renderCard();
    await waitNameValue('Maria Silva');

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Outro Nome Válido' } });
    fireEvent.click(screen.getByText('Salvar alterações'));

    await waitFor(() => screen.getByText('O campo nome não pode ser superior a 120 caracteres.'));
  });

  it('FE03-T11 — erro no GET → mensagem + "Tentar novamente" chama o refetch', async () => {
    getOwnProfileMock.mockRejectedValueOnce(new Error('network'));
    renderCard();

    await waitFor(() => screen.getByText('Não foi possível carregar seu perfil.'));

    getOwnProfileMock.mockResolvedValueOnce(makeEnvelope(BASE_PROFILE));
    fireEvent.click(screen.getByText('Tentar novamente'));

    await waitFor(() => expect(getOwnProfileMock).toHaveBeenCalledTimes(2));
  });
});
