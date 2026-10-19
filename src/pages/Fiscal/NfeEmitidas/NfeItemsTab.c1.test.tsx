// @vitest-environment jsdom
// FE-C1-05a/05b (D-101-19) — campos C1 no item da NF-e: visibilidade por CST, opcoes por grupo de
// CST, troca de CST 20 -> 30 pelo Select limpando o incompativel, cascata Produto/Natureza
// (igual a percent_reduction) e `perc_ipi_devol` so com finnfe=4 (limpo ao sair de devolucao).
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { chooseSelectOption } from '@/test-helpers/chakraSelect';
import { system } from '@/theme';

import { getLanguageRouter } from '@/utils/get-language-route';

import { languageContextTypes } from '@/constants/languages';

import type { NatureOperationData } from '@/@types/v2/NatureOperations';
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

import { applyNatureOverwriteToAllItems } from './nfe-nature-cascade';
import { emptyNfeItem, NfeItemsTab } from './NfeItemsTab';

const text = getLanguageRouter(languageContextTypes.BR).nfes.nfe.form;
const MOT = text.fields.motDesIcms;
const DIF = text.fields.percDif;
const FCP = text.fields.percFcp;
const IPI_DEVOL = text.fields.percIpiDevol;
const AGRO_3 = /3 - Uso na agropecuária/;

let formApi: UseFormReturn<NfeForm> | null = null;

function Harness({
  finnfe = 1,
  item = {},
  withProduct = false,
  nature = null,
}: {
  finnfe?: number;
  item?: Partial<NfeItemForm>;
  withProduct?: boolean;
  nature?: NatureOperationData | null;
}) {
  const form = useForm<NfeForm>({
    defaultValues: {
      finnfe,
      items: [
        {
          ...emptyNfeItem,
          product_uuid: withProduct ? { label: 'p', value: 'prod-c1' } : { label: 'p', value: 'p' },
          quantity: 1,
          amount: 1,
          ...item,
        } as NfeItemForm,
      ],
    } as unknown as NfeForm,
  });
  formApi = form;
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
      natureOperationData={nature}
      cascadeOnMount={withProduct}
    />
  );
}

function renderTab(props: React.ComponentProps<typeof Harness> = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <ChakraProvider value={system}>
      <QueryClientProvider client={client}>
        <Harness {...props} />
      </QueryClientProvider>
    </ChakraProvider>
  );
}

const values = () => formApi!.getValues('items.0');

beforeEach(() => {
  formApi = null;
  getProductMock.mockResolvedValue({ data: null });
});
afterEach(() => {
  cleanup();
  getProductMock.mockReset();
});

describe('NfeItemsTab — campos C1 (FE-C1-05a)', () => {
  it('CST 20: mostra mot_des_icms (so opcoes do grupo 20) e perc_fcp; oculta perc_dif', async () => {
    renderTab({ item: { cst_csosn: '20', mot_des_icms: 3, perc_fcp: 2 } });
    await screen.findByText(text.fields.cfop);
    expect(screen.getAllByText(MOT).length).toBeGreaterThan(0);
    expect(screen.getAllByText(FCP).length).toBeGreaterThan(0);
    expect(screen.queryByText(DIF)).toBeNull();
    expect(screen.getAllByText(AGRO_3).length).toBeGreaterThan(0);
  });

  it('CST 51: so perc_dif e perc_fcp; CST 60 e CSOSN 102: nenhum dos tres', async () => {
    const first = renderTab({ item: { cst_csosn: '51', perc_dif: 100 } });
    await screen.findByText(text.fields.cfop);
    expect(screen.queryByText(MOT)).toBeNull();
    expect(screen.getAllByText(DIF).length).toBeGreaterThan(0);
    expect(screen.getAllByText(FCP).length).toBeGreaterThan(0);
    first.unmount();
    for (const cst of ['60', '102']) {
      const r = renderTab({ item: { cst_csosn: cst } });
      await screen.findByText(text.fields.cfop);
      expect(screen.queryByText(MOT)).toBeNull();
      expect(screen.queryByText(DIF)).toBeNull();
      expect(screen.queryByText(FCP)).toBeNull();
      r.unmount();
    }
  });

  it('troca de CST 20 -> 30 pelo Select limpa mot_des_icms 3 e perc_fcp no item', async () => {
    renderTab({ item: { cst_csosn: '20', mot_des_icms: 3, perc_fcp: 2 } });
    await screen.findByText(text.fields.cfop);
    await chooseSelectOption(text.fields.cstCsosn, /^30 - /);
    await waitFor(() => expect(values().cst_csosn).toBe('30'));
    await waitFor(() => expect(values().mot_des_icms).toBeNull());
    expect(values().perc_fcp).toBeNull();
    expect(screen.queryByText(AGRO_3)).toBeNull();
    // CST 30 mantem o campo (dominio {6,7,9}); perc_fcp sai do grupo
    expect(screen.getAllByText(MOT).length).toBeGreaterThan(0);
    expect(screen.queryByText(FCP)).toBeNull();
  });

  it('troca de CST 20 -> 60 pelo Select zera os tres campos', async () => {
    renderTab({ item: { cst_csosn: '20', mot_des_icms: 3, perc_fcp: 2, perc_dif: null } });
    await screen.findByText(text.fields.cfop);
    await chooseSelectOption(text.fields.cstCsosn, /^60 - /);
    await waitFor(() => expect(values().cst_csosn).toBe('60'));
    expect([values().mot_des_icms, values().perc_dif, values().perc_fcp]).toEqual([
      null,
      null,
      null,
    ]);
  });

  it('cascata do Produto copia os 3 campos (CST 20) e zera perc_dif fora do 51', async () => {
    getProductMock.mockResolvedValue({
      data: {
        uuid: 'prod-c1',
        description: 'Milho',
        code: '1',
        cst_csosn: '20',
        mot_des_icms: 12,
        perc_dif: 50,
        perc_fcp: 1.5,
        origem: 0,
        measurement: { description: 'Kg' },
        group: { description: 'Graos' },
        package_uuids: [],
      },
    });
    renderTab({ withProduct: true });
    await waitFor(() => expect(values().cst_csosn).toBe('20'));
    expect([values().mot_des_icms, values().perc_dif, values().perc_fcp]).toEqual([12, null, 1.5]);
  });

  it('cascata da Natureza (overwrite_product) copia os 3 campos pelo CST da natureza', () => {
    const calls: Array<[string, unknown]> = [];
    const setValue = ((name: string, value: unknown) => {
      calls.push([name, value]);
    }) as any;
    const items = [{} as NfeItemForm];
    const nature = (over: Record<string, unknown>) =>
      ({ overwrite_product: true, ...over }) as unknown as NatureOperationData;

    applyNatureOverwriteToAllItems(
      nature({ cst_csosn: '51', mot_des_icms: 3, perc_dif: 100, perc_fcp: 0 }),
      items,
      setValue
    );
    const get = (k: string) => calls.find(([n]) => n === `items.0.${k}`)?.[1];
    expect([get('mot_des_icms'), get('perc_dif'), get('perc_fcp')]).toEqual([null, 100, null]);

    calls.length = 0;
    applyNatureOverwriteToAllItems(
      nature({ cst_csosn: '20', mot_des_icms: 3, perc_dif: 10, perc_fcp: 2 }),
      items,
      setValue
    );
    expect([get('mot_des_icms'), get('perc_dif'), get('perc_fcp')]).toEqual([3, null, 2]);
  });
});

describe('NfeItemsTab — perc_ipi_devol (FE-C1-05b)', () => {
  it('so aparece com finnfe=4', async () => {
    renderTab({ finnfe: 1 });
    await screen.findByText(text.fields.cfop);
    expect(screen.queryByText(IPI_DEVOL)).toBeNull();
    cleanup();
    renderTab({ finnfe: 4, item: { perc_ipi_devol: 5 } });
    expect((await screen.findAllByText(IPI_DEVOL)).length).toBeGreaterThan(0);
  });

  it('ao sair de devolucao o valor oculto e limpo', async () => {
    renderTab({ finnfe: 4, item: { perc_ipi_devol: 5 } });
    await screen.findAllByText(IPI_DEVOL);
    expect(values().perc_ipi_devol).toBe(5);
    act(() => formApi!.setValue('finnfe', 1 as any));
    await waitFor(() => expect(values().perc_ipi_devol).toBeNull());
    expect(screen.queryByText(IPI_DEVOL)).toBeNull();
  });
});
