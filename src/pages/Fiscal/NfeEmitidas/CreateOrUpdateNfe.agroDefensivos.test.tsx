// @vitest-environment jsdom
// UT-000776 / T-776-FE-05 — bloco Defensivos agrícolas em
// `CreateOrUpdateNfe`: GET hidrata `ref_access_key`/`ref_item_number` por item, o payload de
// update os reenvia (e só em devolução), NF-e normal não os envia e os campos RTC do item
// continuam no round-trip (FE-NFE-RT-01). 422 `items.N.ref_*` vira erro no campo da linha.
// `NfeItemsTab`/`NfeFinancialTab` são stubs (a UI do item é provada em `NfeItemsTab.devolucaoRef`);
// cabeçalho, hook-form, hidratação e `tryPersistNfe` são REAIS.
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AxiosError } from 'axios';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { getLanguageRouter } from '@/utils/get-language-route';

import { languageContextTypes } from '@/constants/languages';

const captured = vi.hoisted(() => ({
  persist: null as null | ((data: any) => Promise<unknown>),
  detail: null as any,
}));
const createNfeMock = vi.hoisted(() => vi.fn());
const updateNfeMock = vi.hoisted(() => vi.fn());

const toasterErrorMock = vi.fn();

vi.mock('@/components/ui/toaster', () => ({
  toaster: {
    error: (...args: unknown[]) => toasterErrorMock(...args),
    warning: vi.fn(),
    success: vi.fn(),
  },
}));
vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({ languageGB: getLanguageRouter(languageContextTypes.BR) }),
}));
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ activeFarmUuid: 'farm-uuid-1' }),
}));
vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasFarm: true, can: () => true }),
}));
vi.mock('@/hooks/useRequest', () => ({
  useRequest: (options: { asyncFunction: (data: any) => Promise<unknown> }) => {
    captured.persist = options.asyncFunction;
    return { mutateAsync: options.asyncFunction, isPending: false };
  },
}));
vi.mock('@/pages/CadastrosBase/Clientes/useClientes', () => ({
  useClientForm: () => ({ data: undefined }),
}));
vi.mock('@/pages/CadastrosBase/Clientes/ClientFormModal', () => ({
  ClientFormModal: () => null,
}));
vi.mock('./useNfes', async () => {
  const { useEffect: useEffectStub } = await import('react');
  return {
    useNfeForm: ({ fillForm }: { fillForm: (data: unknown, force?: boolean) => void }) => {
      useEffectStub(() => {
        if (captured.detail) fillForm(captured.detail, true);
      }, []);
      return { data: captured.detail, isLoading: false, isFetching: false };
    },
  };
});
vi.mock('./useNfeDetail', () => ({
  useNfeDetail: () => ({ data: undefined, isLoading: false }),
}));
vi.mock('./NfeFinancialTab', () => ({
  NfeFinancialTab: () => null,
}));
vi.mock('./NfeItemsTab', async () => {
  const { useWatch: useWatchStub, useFormState: useFormStateStub } =
    await import('react-hook-form');
  return {
    emptyNfeItem: {},
    formatSize: (value: number) => String(value),
    NfeItemsTab: ({ control }: { control: any }) => {
      const values = useWatchStub({ control });
      const { errors } = useFormStateStub({ control });
      return (
        <div>
          <pre data-testid="form-values">{JSON.stringify(values)}</pre>
          <pre data-testid="item-errors">{JSON.stringify((errors as any).items ?? [])}</pre>
        </div>
      );
    },
  };
});

const getProductMock = vi.fn();

vi.mock('@/services/v2/Products/product-service', () => ({
  getProduct: (...args: unknown[]) => getProductMock(...args),
}));
vi.mock('@/services/v2/AdditionalInfo/additional-info-service', () => ({
  getAdditionalInfo: vi.fn(async () => ({ data: null })),
}));
vi.mock('@/services/v2/NatureOperations/nature-operation-service', () => ({
  getNatureOperation: vi.fn(async () => ({ data: null })),
  listNatureOperations: vi.fn(async () => ({ data: { items: [], meta: {} } })),
}));
vi.mock('@/services/v2/CadastrosBase/Client/client-service', () => ({
  listClients: vi.fn(async () => ({ data: { items: [], meta: {} } })),
}));
vi.mock('@/services/v2/CadastrosBase/Provider/provider-service', () => ({
  listProviderOptions: vi.fn(async () => ({ data: { items: [], meta: {} } })),
}));
vi.mock('@/services/v2/Cities/city-service', () => ({
  listCityOptions: vi.fn(async () => ({ data: { items: [], meta: {} } })),
}));
vi.mock('@/services/v2/Harvests/harvest-service', () => ({
  listHarvests: vi.fn(async () => ({ data: { items: [], meta: {} } })),
}));
vi.mock('@/services/v2/Issuers/issuer-service', () => ({
  listIssuers: vi.fn(async () => ({ data: { items: [], meta: {} } })),
}));
vi.mock('@/services/v2/Fiscal/nfe-service', () => ({
  createNfe: (...args: unknown[]) => createNfeMock(...args),
  updateNfe: (...args: unknown[]) => updateNfeMock(...args),
}));
vi.mock('@/services/v2/StockWriteoffs/stock-writeoff-service', () => ({
  getStockWriteoffNfeDraft: vi.fn(),
  linkNfeToStockWriteoff: vi.fn(),
}));

import CreateOrUpdateNfe from './CreateOrUpdateNfe';

const EDIT_UUID = '3f2b8c1e-4d5a-4e6f-8a7b-9c0d1e2f3a4b';
const CPF_OK = '52998224725';
const CPF_OK_2 = '11144477735';

const lang = getLanguageRouter(languageContextTypes.BR);
const text = lang.nfes.nfe.form.agroDefensivos;

function buildDetail(extra: Record<string, unknown> = {}) {
  return {
    uuid: EDIT_UUID,
    estado: 'novo',
    client: { uuid: 'cli-1', name: 'Cliente' },
    nature: { uuid: 'nat-1', descricao: 'Venda' },
    state_registration_client: '123',
    type_payment: '01',
    tipo: 1,
    finnfe: 1,
    type_emission: 1,
    items: [
      {
        uuid: 'it-1',
        product: { uuid: 'prod-1', description: 'Herbicida' },
        quantity: 2,
        amount: 10,
        cst_csosn: '102',
      },
    ],
    ...extra,
  };
}

function renderEdit(detail: Record<string, unknown>) {
  captured.detail = detail;
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <ChakraProvider value={system}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[`/fiscal/nfe-emitidas/${EDIT_UUID}/editar`]}>
          <Routes>
            <Route path="/fiscal/nfe-emitidas/:nfeId/editar" element={<CreateOrUpdateNfe />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </ChakraProvider>
  );
}

function readFormValues(): Record<string, any> {
  return JSON.parse(screen.getByTestId('form-values').textContent ?? '{}');
}

async function hydrated() {
  await waitFor(() => expect(readFormValues().items?.length).toBe(1));
  const values = readFormValues();
  values.state_registration_client = values.state_registration_client ?? '123';
  values.type_payment = values.type_payment ?? '01';
  return values;
}

function stagingReceituario() {
  return document.querySelector('input[name="agro-staging-receituario"]') as HTMLInputElement;
}
function stagingCpf() {
  return document.querySelector('input[name="agro-staging-cpf"]') as HTMLInputElement;
}
function addButton() {
  return screen.getByRole('button', { name: text.addButton }) as HTMLButtonElement;
}

afterEach(() => {
  cleanup();
  createNfeMock.mockReset();
  updateNfeMock.mockReset();
  captured.persist = null;
  captured.detail = null;
});

describe('CreateOrUpdateNfe — Defensivos agrícolas (UT-000776 / T-776-FE-05)', () => {
  it('adiciona e remove linhas; payload leva só dígitos do CPF e a lista vazia limpa no servidor', async () => {
    updateNfeMock.mockResolvedValue({ data: { uuid: EDIT_UUID } });
    renderEdit(buildDetail());
    await hydrated();

    fireEvent.change(stagingReceituario(), { target: { value: 'REC-001' } });
    fireEvent.change(stagingCpf(), { target: { value: CPF_OK } });
    fireEvent.click(addButton());
    await waitFor(() => expect(readFormValues().agro_defensivos).toHaveLength(1));
    expect(screen.getByText('REC-001 — 529.982.247-25')).toBeTruthy();

    let values = await hydrated();
    await captured.persist!(values);
    expect(updateNfeMock.mock.calls[0][1].agro_defensivos).toEqual([
      { n_receituario: 'REC-001', cpf_resp_tec: CPF_OK },
    ]);

    fireEvent.click(screen.getByRole('button', { name: text.removeButton }));
    await waitFor(() => expect(readFormValues().agro_defensivos).toHaveLength(0));
    values = await hydrated();
    await captured.persist!(values);
    expect(updateNfeMock.mock.calls[1][1].agro_defensivos).toEqual([]);
  });

  it('recusa CPF inválido e staging incompleto', async () => {
    renderEdit(buildDetail());
    await hydrated();

    fireEvent.click(addButton());
    expect(await screen.findByText(text.stagingMessage)).toBeTruthy();

    fireEvent.change(stagingReceituario(), { target: { value: 'REC-001' } });
    fireEvent.change(stagingCpf(), { target: { value: '11111111111' } });
    fireEvent.click(addButton());
    expect(await screen.findByText(text.cpfInvalid)).toBeTruthy();
    expect(readFormValues().agro_defensivos).toHaveLength(0);
  });

  it('21ª linha bloqueada (botão desabilitado com 20 hidratadas)', async () => {
    const rows = Array.from({ length: 20 }, (_, i) => ({
      uuid: `d-${i}`,
      n_receituario: `R${i}`,
      cpf_resp_tec: CPF_OK,
    }));
    renderEdit(buildDetail({ agro_defensivos: rows }));
    await waitFor(() => expect(readFormValues().agro_defensivos).toHaveLength(20));
    expect(addButton().disabled).toBe(true);
  });

  it('round-trip: GET hidrata sem uuid de linha e o update reenvia a lista', async () => {
    updateNfeMock.mockResolvedValue({ data: { uuid: EDIT_UUID } });
    renderEdit(
      buildDetail({
        agro_defensivos: [
          { uuid: 'd-1', n_receituario: 'R1', cpf_resp_tec: CPF_OK },
          { uuid: 'd-2', n_receituario: 'R2', cpf_resp_tec: CPF_OK_2 },
        ],
      })
    );
    await waitFor(() => expect(readFormValues().agro_defensivos).toHaveLength(2));
    expect(readFormValues().agro_defensivos[0]).toEqual({
      n_receituario: 'R1',
      cpf_resp_tec: CPF_OK,
    });
    const values = await hydrated();
    await captured.persist!(values);
    expect(updateNfeMock.mock.calls[0][1].agro_defensivos).toEqual([
      { n_receituario: 'R1', cpf_resp_tec: CPF_OK },
      { n_receituario: 'R2', cpf_resp_tec: CPF_OK_2 },
    ]);
  });

  it('exclusão (P-FE-05): guia com dado desabilita o bloco com aviso', async () => {
    renderEdit(buildDetail({ type_guide: '1', uf_guide: 'MT', number_guide: '123' }));
    await hydrated();
    expect(screen.getByText(text.disabledByGuide)).toBeTruthy();
    expect(stagingReceituario().disabled).toBe(true);
    expect(stagingCpf().disabled).toBe(true);
    expect(addButton().disabled).toBe(true);
  });

  it('exclusão (P-FE-05): defensivo desabilita os campos da guia com aviso', async () => {
    renderEdit(
      buildDetail({ agro_defensivos: [{ uuid: 'd-1', n_receituario: 'R1', cpf_resp_tec: CPF_OK }] })
    );
    await hydrated();
    expect(screen.getByText(text.guideDisabledByDefensivos)).toBeTruthy();
    expect((document.querySelector('input[name="serie_guide"]') as HTMLInputElement).disabled).toBe(
      true
    );
    expect(stagingReceituario().disabled).toBe(false);
  });

  it('422 agro_defensivos.N.cpf_resp_tec aparece na linha e o erro é repropagado', async () => {
    const error = new AxiosError('422');
    error.response = {
      status: 422,
      data: {
        errors: {
          'agro_defensivos.0.cpf_resp_tec': ['CPF recusado no servidor'],
          'agro_defensivos.0.n_receituario': ['Receituário recusado no servidor'],
        },
      },
    } as any;
    updateNfeMock.mockRejectedValue(error);
    renderEdit(
      buildDetail({ agro_defensivos: [{ uuid: 'd-1', n_receituario: 'R1', cpf_resp_tec: CPF_OK }] })
    );
    const values = await hydrated();

    await expect(captured.persist!(values)).rejects.toBe(error);
    expect(await screen.findByText('CPF recusado no servidor')).toBeTruthy();
    expect(await screen.findByText('Receituário recusado no servidor')).toBeTruthy();
  });

  it('422 raiz agro_defensivos (guia + defensivo no servidor) aparece acima da lista', async () => {
    const error = new AxiosError('422');
    error.response = {
      status: 422,
      data: { errors: { agro_defensivos: ['Guia e defensivos são exclusivos (servidor)'] } },
    } as any;
    updateNfeMock.mockRejectedValue(error);
    renderEdit(buildDetail());
    const values = await hydrated();
    await expect(captured.persist!(values)).rejects.toBe(error);
    expect(await screen.findByText('Guia e defensivos são exclusivos (servidor)')).toBeTruthy();
  });
});
