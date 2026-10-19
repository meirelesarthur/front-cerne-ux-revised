// @vitest-environment jsdom
// UT-000715 / T-FE-715-04 — `cascadeOnMount` do NfeItemsTab: itens injetados por handoff
// (Pesagem -> Nova NF-e) disparam a cascata fiscal do Produto no mount; o default (false)
// mantém o comportamento inalterado (hidratação de edição/duplicação não cascateia); a troca
// manual de produto continua disparando.
import { useEffect } from 'react';

import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { getLanguageRouter } from '@/utils/get-language-route';

import { languageContextTypes } from '@/constants/languages';

import type { NfeForm, NfeItemForm } from '@/@types/v2/Nfes';

vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({ languageGB: getLanguageRouter(languageContextTypes.BR) }),
}));
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ activeFarmUuid: 'farm-uuid-1' }),
}));
vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasFarm: true, can: () => true }),
}));
vi.mock('@/pages/CadastrosBase/Produtos/Catalogo/useProducts', () => ({
  usePackageOptionsList: () => ({ data: [] }),
}));
vi.mock('@/pages/CadastrosBase/Produtos/Catalogo/ProductFormModal', () => ({
  ProductFormModal: () => null,
}));

const getProductMock = vi.fn();

vi.mock('@/services/v2/Products/product-service', () => ({
  getProduct: (...args: unknown[]) => getProductMock(...args),
  getProductWarehouses: vi.fn(async () => ({ data: [] })),
  listProductOptions: vi.fn(async () => ({ data: { items: [], meta: {} } })),
}));
vi.mock('@/services/v2/AdditionalInfo/additional-info-service', () => ({
  listAdditionalInfos: vi.fn(async () => ({ data: { items: [], meta: {} } })),
}));
vi.mock('@/services/v2/BaseRegistrations/areas-service', () => ({
  listAreas: vi.fn(async () => ({ data: { items: [], meta: {} } })),
}));

import { emptyNfeItem, NfeItemsTab } from './NfeItemsTab';

const PRODUCT_A = {
  uuid: 'prod-a',
  description: 'Milho',
  code: '001',
  cfop_saida_interno: '5101',
  cfop_saida_externo: '6101',
  cst_csosn: '102',
  cst_csosn_exp: '102',
  cst_pis: '01',
  cst_cofins: '01',
  cst_ipi: '50',
  cenq_ipi: '999',
  origem: 0,
  measurement: { description: 'Quilograma' },
  group: { description: 'Grãos' },
  package_uuids: [],
};
const PRODUCT_B = {
  ...PRODUCT_A,
  uuid: 'prod-b',
  description: 'Soja',
  code: '002',
  cfop_saida_interno: '5102',
  cfop_saida_externo: '6102',
};

let formApi: UseFormReturn<NfeForm> | null = null;

function buildItem(productUuid: string): NfeItemForm {
  return {
    ...emptyNfeItem,
    product_uuid: { label: productUuid, value: productUuid },
    quantity: 1000,
    amount: 0,
  };
}

function Harness({
  cascadeOnMount,
  productUuid,
}: {
  cascadeOnMount?: boolean;
  productUuid: string;
}) {
  const form = useForm<NfeForm>({
    defaultValues: { items: [buildItem(productUuid)] } as unknown as NfeForm,
  });
  useEffect(() => {
    formApi = form;
  });
  return (
    <NfeItemsTab
      control={form.control}
      errors={form.formState.errors}
      watch={form.watch}
      setValue={form.setValue}
      isLoading={false}
      canSave
      additionalInfoOption={null}
      onAdditionalInfoChange={() => undefined}
      natureOperationData={null}
      cascadeOnMount={cascadeOnMount}
    />
  );
}

function renderTab(props: { cascadeOnMount?: boolean; productUuid?: string }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <ChakraProvider value={system}>
      <QueryClientProvider client={client}>
        <Harness
          cascadeOnMount={props.cascadeOnMount}
          productUuid={props.productUuid ?? 'prod-a'}
        />
      </QueryClientProvider>
    </ChakraProvider>
  );
}

beforeEach(() => {
  formApi = null;
  getProductMock.mockImplementation(async (uuid: string) => ({
    data: uuid === 'prod-b' ? PRODUCT_B : PRODUCT_A,
  }));
});

afterEach(() => {
  cleanup();
  getProductMock.mockReset();
});

describe('NfeItemsTab — cascadeOnMount (UT-000715)', () => {
  it('com cascadeOnMount dispara a cascata fiscal no mount', async () => {
    renderTab({ cascadeOnMount: true });

    await waitFor(() => {
      expect(formApi?.getValues('items.0.cfop_saida_interno')).toBe('5101');
    });
    expect(formApi?.getValues('items.0.cfop_saida_externo')).toBe('6101');
    expect(formApi?.getValues('items.0.cst_csosn')).toBe('102');
    expect(formApi?.getValues('items.0.cst_pis')).toBe('01');
    expect(formApi?.getValues('items.0.cst_cofins')).toBe('01');
    expect(formApi?.getValues('items.0.cst_ipi')).toBe('50');
    expect(formApi?.getValues('items.0.product_measurement_label')).toBe('Quilograma');
    // quantidade/valor injetados pelo handoff não são sobrescritos pela cascata
    expect(formApi?.getValues('items.0.quantity')).toBe(1000);
    expect(formApi?.getValues('items.0.amount')).toBe(0);
  });

  it('sem cascadeOnMount (default) não dispara no mount', async () => {
    renderTab({});

    await waitFor(() => expect(getProductMock).toHaveBeenCalledWith('prod-a'));
    // dá tempo ao efeito pós-resolução da query
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });
    expect(formApi?.getValues('items.0.cfop_saida_interno')).toBeNull();
    expect(formApi?.getValues('items.0.cst_csosn')).toBeNull();
    expect(formApi?.getValues('items.0.product_measurement_label')).toBeNull();
  });

  it('troca manual de produto continua disparando a cascata', async () => {
    renderTab({});
    await waitFor(() => expect(getProductMock).toHaveBeenCalledWith('prod-a'));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(formApi?.getValues('items.0.cfop_saida_interno')).toBeNull();

    act(() => {
      formApi?.setValue('items.0.product_uuid', { label: 'Soja', value: 'prod-b' });
    });

    await waitFor(() => {
      expect(formApi?.getValues('items.0.cfop_saida_interno')).toBe('5102');
    });
    expect(formApi?.getValues('items.0.cfop_saida_externo')).toBe('6102');
  });
});
