// @vitest-environment jsdom
// UT-000766 — guard de edição do Emissor: sem alteração volta sem salvar; com alteração
// (campo RHF ou só numbers[]) salva.
import { ChakraProvider } from '@chakra-ui/react';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { getLanguageRouter } from '@/utils/get-language-route';

const UUID = '019f62a6-1111-7023-8abc-123456789abc';

const mocks = vi.hoisted(() => ({
  updateIssuer: vi.fn().mockResolvedValue({}),
  navigate: vi.fn(),
}));

const detail = {
  uuid: '019f62a6-1111-7023-8abc-123456789abc',
  razao_social: 'Emissor LTDA',
  nome_fantasia: 'Emissor',
  cpf_cnpj: '11222333000181',
  endereco: {
    rua: 'Rua A',
    numero: '10',
    bairro: 'Centro',
    cep: '01001000',
    cidade_uuid: 'uuid-sp',
    cidade_nome: 'São Paulo',
    uf: 'SP',
  },
  telefone: '11999999999',
  email: 'a@b.com',
  issues_nfe: false,
  is_enabled: true,
  cnae: null,
  sped_profile: null,
  nfe_series: [],
  state_registration_numbers: ['123456789'],
  farm_uuids: [],
};

vi.mock('react-router-dom', () => ({
  useNavigate: () => mocks.navigate,
  useParams: () => ({ issuerUuid: UUID }),
}));
vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({ languageGB: getLanguageRouter('BR') }),
}));
vi.mock('@/hooks/usePermissions', () => ({ usePermissions: () => ({ can: () => true }) }));
vi.mock('@/hooks/useRequest', () => ({
  useRequest: ({ asyncFunction }: any) => ({ mutateAsync: asyncFunction, isPending: false }),
}));
vi.mock('@/services/v2/Issuers/issuer-service', () => ({
  createIssuer: vi.fn(),
  updateIssuer: mocks.updateIssuer,
}));
vi.mock('@/services/v2/Cities/city-service', () => ({
  listCityOptions: vi.fn(),
  getCityByIso: vi.fn(),
}));
vi.mock('./useIssuers', async () => {
  const React = await import('react');
  return {
    useFarmsList: () => ({ data: [] }),
    useIssuerForm: ({ fillForm }: any) => {
      React.useEffect(() => {
        fillForm(detail, true);
      }, []);
      return { isLoading: false, isFetching: false };
    },
  };
});
vi.mock('./emissor-schema', () => ({
  emissorSchemaResolver: () => async (values: unknown) => ({ values, errors: {} }),
}));

import CreateOrUpdateEmissor from './CreateOrUpdateEmissor';

function setup() {
  const utils = render(
    <ChakraProvider value={system}>
      <CreateOrUpdateEmissor />
    </ChakraProvider>
  );
  return utils;
}

async function loaded(container: HTMLElement) {
  await waitFor(() =>
    expect((container.querySelector('input[name="razao_social"]') as HTMLInputElement).value).toBe(
      'Emissor LTDA'
    )
  );
}

describe('CreateOrUpdateEmissor guard de edição', () => {
  beforeEach(() => {
    mocks.updateIssuer.mockClear();
    mocks.navigate.mockClear();
  });
  afterEach(cleanup);

  it('(a) alterar razao_social salva e não volta', async () => {
    const { container } = setup();
    await loaded(container);
    fireEvent.change(container.querySelector('input[name="razao_social"]') as HTMLInputElement, {
      target: { value: 'Novo Nome' },
    });
    fireEvent.submit(container.querySelector('form') as HTMLFormElement);

    await waitFor(() => expect(mocks.updateIssuer).toHaveBeenCalled());
    expect(mocks.updateIssuer.mock.calls[0][1].razao_social).toBe('Novo Nome');
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it('(b) sem alteração volta sem salvar', async () => {
    const { container } = setup();
    await loaded(container);
    fireEvent.submit(container.querySelector('form') as HTMLFormElement);

    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith(-1));
    expect(mocks.updateIssuer).not.toHaveBeenCalled();
  });

  it('(c) alterar só numbers[] salva', async () => {
    const { container } = setup();
    await loaded(container);
    fireEvent.change(container.querySelector('input[name="numbers.0"]') as HTMLInputElement, {
      target: { value: '987654321' },
    });
    fireEvent.submit(container.querySelector('form') as HTMLFormElement);

    await waitFor(() => expect(mocks.updateIssuer).toHaveBeenCalled());
    expect(mocks.updateIssuer.mock.calls[0][1].numbers).toEqual(['987654321']);
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
});
