// @vitest-environment jsdom
// UT-000780 / UT-000766 T4 — Emissor: CNAE, Perfil SPED, séries de NF-e (in_use bloqueia),
// round-trip sem séries preserva (nfe_series ausente) e campos fiscais padrão ocultos.
import { ChakraProvider } from '@chakra-ui/react';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { getLanguageRouter } from '@/utils/get-language-route';

const UUID = '019f62a6-1111-7023-8abc-123456789abc';

const mocks = vi.hoisted(() => ({
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

describe('CreateOrUpdateEmissor UT-000780', () => {
  beforeEach(() => {
    mocks.updateIssuer.mockClear();
    mocks.createIssuer.mockClear();
    mocks.navigate.mockClear();
  });
  afterEach(cleanup);

  describe('edição com séries gravadas', () => {
    beforeEach(() => {
      mocks.params = { issuerUuid: UUID };
      mocks.detail = baseDetail;
    });

    it('hidrata CNAE e séries; série em uso bloqueia número e exclusão', async () => {
      const { container, getAllByRole } = setup();
      await loadedEdit(container);
      expect(input(container, 'cnae').value).toBe('0111301');
      expect(input(container, 'nfe_series.0.serie').disabled).toBe(true);
      expect(input(container, 'nfe_series.1.serie').disabled).toBe(false);
      const deletes = getAllByRole('button', { name: /remover série/i });
      expect((deletes[0] as HTMLButtonElement).disabled).toBe(true);
      expect((deletes[1] as HTMLButtonElement).disabled).toBe(false);
    });

    it('não renderiza mais os campos fiscais padrão nem série/último nº únicos', async () => {
      const { container } = setup();
      await loadedEdit(container);
      [
        'cst_csosn_padrao',
        'cst_ipi_padrao',
        'perc_icms_padrao',
        'cfop_saida_interno_padrao',
        'ncm_padrao',
        'token_ibpt',
        'numero_serie_nfe',
        'ultimo_numero_nfe',
      ].forEach((name) => expect(input(container, name)).toBeNull());
    });

    it('round-trip: editar só um campo NÃO envia nfe_series (API preserva)', async () => {
      const { container } = setup();
      await loadedEdit(container);
      fireEvent.change(input(container, 'razao_social'), { target: { value: 'Novo Nome' } });
      fireEvent.submit(container.querySelector('form') as HTMLFormElement);

      await waitFor(() => expect(mocks.updateIssuer).toHaveBeenCalled());
      const payload = mocks.updateIssuer.mock.calls[0][1];
      expect(payload.razao_social).toBe('Novo Nome');
      expect(payload).not.toHaveProperty('nfe_series');
      expect(payload.cnae).toBe('0111301');
      expect(payload.sped_profile).toBe('B');
      expect(payload).not.toHaveProperty('cst_csosn_padrao');
      expect(payload).not.toHaveProperty('token_ibpt');
    });

    it('editar só o último número de uma série envia nfe_series com uuids', async () => {
      const { container } = setup();
      await loadedEdit(container);
      fireEvent.change(input(container, 'nfe_series.1.ultimo_numero'), { target: { value: '5' } });
      fireEvent.submit(container.querySelector('form') as HTMLFormElement);

      await waitFor(() => expect(mocks.updateIssuer).toHaveBeenCalled());
      const series = mocks.updateIssuer.mock.calls[0][1].nfe_series;
      expect(series).toHaveLength(2);
      expect(series[0]).toMatchObject({
        uuid: 's-1',
        serie: 1,
        ultimo_numero: 1197,
        is_default: true,
      });
      expect(series[1]).toMatchObject({
        uuid: 's-2',
        serie: 2,
        ultimo_numero: 5,
        is_default: false,
      });
    });

    it('excluir série não usada envia a lista sem ela', async () => {
      const { container, getAllByRole } = setup();
      await loadedEdit(container);
      fireEvent.click(getAllByRole('button', { name: /remover série/i })[1]);
      fireEvent.submit(container.querySelector('form') as HTMLFormElement);

      await waitFor(() => expect(mocks.updateIssuer).toHaveBeenCalled());
      const series = mocks.updateIssuer.mock.calls[0][1].nfe_series;
      expect(series.map((s: any) => s.uuid)).toEqual(['s-1']);
    });
  });

  describe('criação', () => {
    beforeEach(() => {
      mocks.params = {};
      mocks.detail = null;
    });

    it('Emite NFe = Não: sem bloco de séries e sem nfe_series no payload', async () => {
      const { container, queryByText } = setup();
      expect(queryByText('SÉRIES DE NF-E')).toBeNull();
      fireEvent.submit(container.querySelector('form') as HTMLFormElement);
      await waitFor(() => expect(mocks.createIssuer).toHaveBeenCalled());
      expect(mocks.createIssuer.mock.calls[0][0]).not.toHaveProperty('nfe_series');
    });
  });
});
