// @vitest-environment jsdom
// D-101-12 / UT-000766 T4 — Emissor: CNAE, Perfil SPED, séries de NF-e (in_use bloqueia),
// round-trip sem séries preserva (nfe_series ausente) e campos fiscais padrão ocultos.
import { ChakraProvider } from '@chakra-ui/react';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { getLanguageRouter } from '@/utils/get-language-route';

const UUID = '019f62a6-1111-7023-8abc-123456789abc';

const mocks = vi.hoisted(() => ({
  force: true,
  updateIssuer: vi.fn().mockResolvedValue({}),
  createIssuer: vi.fn().mockResolvedValue({}),
  navigate: vi.fn(),
  params: {} as Record<string, string>,
  detail: null as any,
}));

const baseDetail = {
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
  issues_nfe: true,
  regime: 'normal',
  ambiente: 'homologacao',
  is_enabled: true,
  cnae: '0111301',
  sped_profile: 'B',
  nfe_series: [
    { uuid: 's-1', serie: 1, ultimo_numero: 1197, is_default: true, is_active: true, in_use: true },
    { uuid: 's-2', serie: 2, ultimo_numero: 0, is_default: false, is_active: true, in_use: false },
  ],
  state_registration_numbers: ['123456789'],
  farm_uuids: [],
};

vi.mock('@/constants/Fiscal/environmentLock', () => ({
  get FISCAL_FORCE_HOMOLOGATION() {
    return mocks.force;
  },
}));
vi.mock('react-router-dom', () => ({
  useNavigate: () => mocks.navigate,
  useParams: () => mocks.params,
}));
vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({ languageGB: getLanguageRouter('BR') }),
}));
vi.mock('@/hooks/usePermissions', () => ({ usePermissions: () => ({ can: () => true }) }));
vi.mock('@/hooks/useRequest', () => ({
  useRequest: ({ asyncFunction }: any) => ({ mutateAsync: asyncFunction, isPending: false }),
}));
vi.mock('@/services/v2/Issuers/issuer-service', () => ({
  createIssuer: mocks.createIssuer,
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
        if (mocks.detail) fillForm(mocks.detail, true);
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
  return render(
    <ChakraProvider value={system}>
      <CreateOrUpdateEmissor />
    </ChakraProvider>
  );
}

const input = (c: HTMLElement, name: string) =>
  c.querySelector(`input[name="${name}"]`) as HTMLInputElement;

async function loadedEdit(c: HTMLElement) {
  await waitFor(() => expect(input(c, 'razao_social').value).toBe('Emissor LTDA'));
}

const selectAmbiente = (c: HTMLElement) =>
  c.querySelector('select[name="ambiente"]') as HTMLSelectElement;

const HELP = 'Travado em Homologação até a liberação para produção.';

describe('CreateOrUpdateEmissor D-101-12 (ambiente travado)', () => {
  beforeEach(() => {
    mocks.updateIssuer.mockClear();
    mocks.createIssuer.mockClear();
    mocks.force = true;
  });
  afterEach(cleanup);

  it('edição travada pela API: emissor em produção aparece como homologação, com ajuda, e envia homologacao', async () => {
    mocks.params = { issuerUuid: UUID };
    mocks.detail = { ...baseDetail, ambiente: 'producao', ambiente_locked: true };
    const { container, getByText } = setup();
    await loadedEdit(container);
    expect(getByText(HELP)).toBeTruthy();
    expect(selectAmbiente(container).disabled).toBe(true);
    expect(selectAmbiente(container).value).toBe('homologacao');
    expect(container.textContent).toContain('Homologação');
    fireEvent.change(input(container, 'razao_social'), { target: { value: 'Novo' } });
    fireEvent.submit(container.querySelector('form') as HTMLFormElement);
    await waitFor(() => expect(mocks.updateIssuer).toHaveBeenCalled());
    expect(mocks.updateIssuer.mock.calls[0][1].ambiente).toBe('homologacao');
  });

  it('edição liberada (ambiente_locked=false): sem ajuda e mantém producao', async () => {
    mocks.params = { issuerUuid: UUID };
    mocks.detail = { ...baseDetail, ambiente: 'producao', ambiente_locked: false };
    mocks.force = false;
    const { container, queryByText } = setup();
    await loadedEdit(container);
    expect(queryByText(HELP)).toBeNull();
    expect(selectAmbiente(container).disabled).toBe(false);
    fireEvent.change(input(container, 'razao_social'), { target: { value: 'Novo' } });
    fireEvent.submit(container.querySelector('form') as HTMLFormElement);
    await waitFor(() => expect(mocks.updateIssuer).toHaveBeenCalled());
    expect(mocks.updateIssuer.mock.calls[0][1].ambiente).toBe('producao');
  });

  it('constante travada vence ambiente_locked=false da API', async () => {
    mocks.params = { issuerUuid: UUID };
    mocks.detail = { ...baseDetail, ambiente: 'producao', ambiente_locked: false };
    const { container, getByText } = setup();
    await loadedEdit(container);
    expect(getByText(HELP)).toBeTruthy();
    expect(selectAmbiente(container).disabled).toBe(true);
  });

  it('criação (constante = true): payload homologacao', async () => {
    mocks.params = {};
    mocks.detail = null;
    const { container } = setup();
    fireEvent.submit(container.querySelector('form') as HTMLFormElement);
    await waitFor(() => expect(mocks.createIssuer).toHaveBeenCalled());
    expect(mocks.createIssuer.mock.calls[0][0].ambiente).toBe('homologacao');
  });
});
