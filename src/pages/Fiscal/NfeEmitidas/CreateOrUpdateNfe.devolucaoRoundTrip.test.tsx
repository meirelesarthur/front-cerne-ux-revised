// @vitest-environment jsdom
// UT-000776 / T-776-FE-04 — round-trip da referência por item (NF-e de devolução) em
// `CreateOrUpdateNfe`: GET hidrata `ref_access_key`/`ref_item_number` por item, o payload de
// update os reenvia (e só em devolução), NF-e normal não os envia e os campos RTC do item
// continuam no round-trip (FE-NFE-RT-01). 422 `items.N.ref_*` vira erro no campo da linha.
// `NfeItemsTab`/`NfeFinancialTab` são stubs (a UI do item é provada em `NfeItemsTab.devolucaoRef`);
// cabeçalho, hook-form, hidratação e `tryPersistNfe` são REAIS.
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
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
          <pre data-testid="item-errors">
            {JSON.stringify(
              (errors as any).items?.map?.((row: any) => ({
                key: row?.ref_access_key?.message,
                num: row?.ref_item_number?.message,
                mot: row?.mot_des_icms?.message,
              })) ?? []
            )}
          </pre>
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

const KEY_44 = '35240112345678000190550010000001231000001234';
const EDIT_UUID = '3f2b8c1e-4d5a-4e6f-8a7b-9c0d1e2f3a4b';

function buildDetail(finnfe: number, itemOver: Record<string, unknown> = {}) {
  return {
    uuid: EDIT_UUID,
    estado: 'novo',
    client: { uuid: 'cli-1', name: 'Cliente' },
    nature: { uuid: 'nat-1', descricao: 'Devolução' },
    state_registration_client: '123',
    type_payment: '01',
    tipo: 0,
    finnfe,
    type_emission: 1,
    ref_nfe: KEY_44,
    items: [
      {
        uuid: 'it-1',
        product: { uuid: 'prod-1', description: 'Milho' },
        quantity: 2,
        amount: 10,
        cst_csosn: '102',
        c_class_trib: '000001',
        cst_ibs_cbs: '000',
        perc_cbs: 0.9,
        ref_access_key: finnfe === 4 ? KEY_44 : null,
        ref_item_number: finnfe === 4 ? 7 : null,
        ...itemOver,
      },
    ],
  };
}

function renderEdit(finnfe: number, itemOver: Record<string, unknown> = {}) {
  captured.detail = buildDetail(finnfe, itemOver);
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
  // a cascata cliente→inscrição estadual pode limpar o campo no 1º render; o payload exige o valor
  values.state_registration_client = values.state_registration_client ?? '123';
  values.type_payment = values.type_payment ?? '01';
  return values;
}

afterEach(() => {
  cleanup();
  createNfeMock.mockReset();
  updateNfeMock.mockReset();
  captured.persist = null;
  captured.detail = null;
});

describe('CreateOrUpdateNfe — referência por item na devolução (UT-000776)', () => {
  it('D1: em devolução o campo de cabeçalho vira atalho de preenchimento, com ajuda', async () => {
    const formText = getLanguageRouter(languageContextTypes.BR).nfes.nfe.form;
    renderEdit(4);
    await hydrated();
    expect(await screen.findByText(formText.fields.refNfeDevolucao, { exact: false })).toBeTruthy();
    expect(screen.getByText(formText.fields.refNfeDevolucaoHint)).toBeTruthy();
    expect(screen.queryByText(formText.fields.refNfe)).toBeNull();
  });

  it('D1: fora de devolução o rótulo segue "Referência NFe", sem a ajuda', async () => {
    const formText = getLanguageRouter(languageContextTypes.BR).nfes.nfe.form;
    renderEdit(1);
    await hydrated();
    expect(await screen.findByText(formText.fields.refNfe, { exact: false })).toBeTruthy();
    expect(screen.queryByText(formText.fields.refNfeDevolucaoHint)).toBeNull();
  });

  it('GET hidrata chave e nº do item por item e o update os reenvia', async () => {
    updateNfeMock.mockResolvedValue({ data: { uuid: EDIT_UUID } });
    renderEdit(4);
    const values = await hydrated();
    expect(values.items[0].ref_access_key).toBe(KEY_44);
    expect(values.items[0].ref_item_number).toBe(7);

    // update parcial: troca só o nº do item e reenvia
    values.items[0].ref_item_number = 9;
    await captured.persist!(values);
    const [uuid, payload] = updateNfeMock.mock.calls[0];
    expect(uuid).toBe(EDIT_UUID);
    expect(payload.items[0].ref_access_key).toBe(KEY_44);
    expect(payload.items[0].ref_item_number).toBe(9);
  });

  it('NF-e normal não envia ref_access_key/ref_item_number no payload', async () => {
    updateNfeMock.mockResolvedValue({ data: { uuid: EDIT_UUID } });
    renderEdit(1);
    const values = await hydrated();
    expect(values.items[0].ref_access_key ?? null).toBeNull();
    await captured.persist!(values);
    const item = updateNfeMock.mock.calls[0][1].items[0];
    expect('ref_access_key' in item).toBe(false);
    expect('ref_item_number' in item).toBe(false);
  });

  it('regressão FE-NFE-RT-01: campos RTC do item seguem no round-trip', async () => {
    updateNfeMock.mockResolvedValue({ data: { uuid: EDIT_UUID } });
    renderEdit(4);
    const values = await hydrated();
    await captured.persist!(values);
    const item = updateNfeMock.mock.calls[0][1].items[0];
    expect(item.c_class_trib).toBe('000001');
    expect(item.cst_ibs_cbs).toBe('000');
    expect(item.perc_cbs).toBe(0.9);
  });

  it('422 items.N.ref_* aparece no campo da linha e o erro é repropagado', async () => {
    const error = new AxiosError('422');
    error.response = {
      status: 422,
      data: {
        errors: {
          'items.0.ref_access_key': ['Chave inválida no servidor'],
          'items.0.ref_item_number': ['Item inválido no servidor'],
        },
      },
    } as any;
    updateNfeMock.mockRejectedValue(error);
    renderEdit(4);
    const values = await hydrated();

    await expect(captured.persist!(values)).rejects.toBe(error);
    await waitFor(() => {
      const rows = JSON.parse(screen.getByTestId('item-errors').textContent ?? '[]');
      expect(rows[0]).toEqual({
        key: 'Chave inválida no servidor',
        num: 'Item inválido no servidor',
      });
    });
  });
});

describe('CreateOrUpdateNfe — campos C1 por item (FE-C1-05, D-101-19)', () => {
  const c1Item = {
    cst_csosn: '20',
    mot_des_icms: 3,
    perc_dif: null,
    perc_fcp: 2,
    perc_ipi_devol: 5,
  };

  it('GET hidrata os 4 campos C1 e o update em devolução os reenvia (CST 20)', async () => {
    updateNfeMock.mockResolvedValue({ data: { uuid: EDIT_UUID } });
    renderEdit(4, c1Item);
    const values = await hydrated();
    expect(values.items[0]).toMatchObject({ mot_des_icms: 3, perc_fcp: 2, perc_ipi_devol: 5 });
    await captured.persist!(values);
    const item = updateNfeMock.mock.calls[0][1].items[0];
    expect(item.mot_des_icms).toBe(3);
    expect(item.perc_fcp).toBe(2);
    expect(item.perc_dif).toBeNull();
    expect(item.perc_ipi_devol).toBe(5);
  });

  it('fora de devolução perc_ipi_devol nem vai no payload; C1 do CST segue', async () => {
    updateNfeMock.mockResolvedValue({ data: { uuid: EDIT_UUID } });
    renderEdit(1, c1Item);
    const values = await hydrated();
    await captured.persist!(values);
    const item = updateNfeMock.mock.calls[0][1].items[0];
    expect('perc_ipi_devol' in item).toBe(false);
    expect(item.mot_des_icms).toBe(3);
  });

  it('CST sem grupo (60) com residuo oculto sai tudo null; FCP 0 vira null', async () => {
    updateNfeMock.mockResolvedValue({ data: { uuid: EDIT_UUID } });
    renderEdit(1, { cst_csosn: '60', mot_des_icms: 3, perc_dif: 10, perc_fcp: 0 });
    const values = await hydrated();
    await captured.persist!(values);
    const item = updateNfeMock.mock.calls[0][1].items[0];
    expect([item.mot_des_icms, item.perc_dif, item.perc_fcp]).toEqual([null, null, null]);
    cleanup();
    renderEdit(1, { cst_csosn: '20', mot_des_icms: 3, perc_fcp: 0 });
    const values2 = await hydrated();
    await captured.persist!(values2);
    expect(updateNfeMock.mock.calls[1][1].items[0].perc_fcp).toBeNull();
  });

  it('422 items.N.mot_des_icms aparece no campo da linha', async () => {
    const error = new AxiosError('422');
    error.response = {
      status: 422,
      data: { errors: { 'items.0.mot_des_icms': ['Motivo invalido para o CST'] } },
    } as any;
    updateNfeMock.mockRejectedValue(error);
    renderEdit(1, c1Item);
    const values = await hydrated();
    await expect(captured.persist!(values)).rejects.toBe(error);
    await waitFor(() => {
      const rows = JSON.parse(screen.getByTestId('item-errors').textContent ?? '[]');
      expect(rows[0].mot).toBe('Motivo invalido para o CST');
    });
  });
});
