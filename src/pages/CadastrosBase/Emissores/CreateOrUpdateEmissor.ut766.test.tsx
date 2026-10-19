// @vitest-environment jsdom
// UT-000766 / T2+T3 — Emissor: autofill de CEP (ViaCEP via fetch mockado) sem sobrescrever
// campo editado, toast gracioso em falha, e ocultação/não-envio dos campos fiscais com Emite NFe = Não.
import { ChakraProvider } from '@chakra-ui/react';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { getLanguageRouter } from '@/utils/get-language-route';

const mocks = vi.hoisted(() => ({
  createIssuer: vi.fn().mockResolvedValue({}),
  getCityByIso: vi.fn(),
  toast: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({}),
}));
vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({ languageGB: getLanguageRouter('BR') }),
}));
vi.mock('@/hooks/usePermissions', () => ({ usePermissions: () => ({ can: () => true }) }));
vi.mock('@/hooks/useRequest', () => ({
  useRequest: ({ asyncFunction }: any) => ({ mutateAsync: asyncFunction, isPending: false }),
}));
vi.mock('@/components/ui/toaster', () => ({ toaster: { create: mocks.toast } }));
vi.mock('@/services/v2/Issuers/issuer-service', () => ({
  createIssuer: mocks.createIssuer,
  updateIssuer: vi.fn(),
}));
vi.mock('@/services/v2/Cities/city-service', () => ({
  listCityOptions: vi.fn(),
  getCityByIso: mocks.getCityByIso,
}));
vi.mock('./useIssuers', () => ({
  useFarmsList: () => ({ data: [] }),
  useIssuerForm: () => ({ isLoading: false, isFetching: false }),
}));
vi.mock('./emissor-schema', () => ({
  emissorSchemaResolver: () => async (values: unknown) => ({ values, errors: {} }),
}));

import CreateOrUpdateEmissor from './CreateOrUpdateEmissor';

const VIACEP = {
  cep: '01001-000',
  logradouro: 'Praça da Sé',
  bairro: 'Sé',
  localidade: 'São Paulo',
  uf: 'SP',
  ibge: '3550308',
};

function renderScreen() {
  return render(
    <ChakraProvider value={system}>
      <CreateOrUpdateEmissor />
    </ChakraProvider>
  );
}

function field(container: HTMLElement, name: string) {
  return container.querySelector(`input[name="${name}"]`) as HTMLInputElement;
}

async function typeCepAndBlur(container: HTMLElement, cep = '01001000') {
  const input = field(container, 'cep');
  fireEvent.change(input, { target: { value: cep } });
  fireEvent.blur(input);
}

describe('CreateOrUpdateEmissor UT-000766', () => {
  beforeEach(() => {
    mocks.toast.mockReset();
    mocks.createIssuer.mockClear();
    mocks.getCityByIso.mockReset();
    mocks.getCityByIso.mockResolvedValue({
      uuid: 'uuid-sp',
      title: 'São Paulo',
      state: { letter: 'SP' },
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => VIACEP }));
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('não renderiza mais o campo ie', () => {
    const { container } = renderScreen();
    expect(field(container, 'ie')).toBeNull();
  });

  it('preenche Rua, Bairro e Cidade ao sair do CEP', async () => {
    const { container, findByText } = renderScreen();
    await typeCepAndBlur(container);

    await waitFor(() => expect(field(container, 'rua').value).toBe('Praça da Sé'));
    expect(field(container, 'bairro').value).toBe('Sé');
    expect(await findByText('São Paulo — SP')).toBeTruthy();
    expect(mocks.getCityByIso).toHaveBeenCalledWith(3550308);
  });

  it('não sobrescreve Rua já editada pelo usuário', async () => {
    const { container } = renderScreen();
    fireEvent.change(field(container, 'rua'), { target: { value: 'Rua Digitada' } });
    await typeCepAndBlur(container);

    await waitFor(() => expect(field(container, 'bairro').value).toBe('Sé'));
    expect(field(container, 'rua').value).toBe('Rua Digitada');
  });

  it('CEP inexistente: toast de aviso e endereço intacto', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ erro: true }) })
    );
    const { container } = renderScreen();
    fireEvent.change(field(container, 'rua'), { target: { value: 'Rua Digitada' } });
    await typeCepAndBlur(container);

    await waitFor(() =>
      expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ type: 'warning' }))
    );
    expect(field(container, 'rua').value).toBe('Rua Digitada');
  });

  it('falha de rede na cidade: toast de erro', async () => {
    mocks.getCityByIso.mockRejectedValue(new Error('offline'));
    const { container } = renderScreen();
    await typeCepAndBlur(container);

    await waitFor(() =>
      expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }))
    );
  });

  it('CEP incompleto não consulta o ViaCEP', async () => {
    const { container } = renderScreen();
    await typeCepAndBlur(container, '0100');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('Emite NFe = Não: oculta campos fiscais condicionais e não os envia', async () => {
    const { container } = renderScreen();
    expect(field(container, 'aut_xml')).toBeNull();
    expect(field(container, 'ultimo_numero_nfe')).toBeNull();

    fireEvent.submit(container.querySelector('form') as HTMLFormElement);
    await waitFor(() => expect(mocks.createIssuer).toHaveBeenCalled());
    const payload = mocks.createIssuer.mock.calls[0][0];
    expect(payload).not.toHaveProperty('ie');
    expect(payload).not.toHaveProperty('aut_xml');
    expect(payload).not.toHaveProperty('regime');
    expect(payload).not.toHaveProperty('ultimo_numero_cte');
  });
});
