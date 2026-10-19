// @vitest-environment jsdom
// UT-000776 / T-776-FE-04 — referência por item da NF-e de devolução: os campos só aparecem com
// finalidade = devolução (finnfe=4), a chave nasce com `ref_nfe` do cabeçalho (P-11) e o schema
// exige 44 dígitos + item 1..990 apenas em devolução.
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { getLanguageRouter } from '@/utils/get-language-route';

import { languageContextTypes } from '@/constants/languages';

import { nfeSchema } from '@/validations/schemas/Nfes/nfe-schema';

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
vi.mock('@/services/v2/Products/product-service', () => ({
  getProduct: vi.fn(async () => ({ data: null })),
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

const KEY_44 = '35240112345678000190550010000001231000001234';
const lang = getLanguageRouter(languageContextTypes.BR);
const text = lang.nfes.nfe.form;

let formApi: UseFormReturn<NfeForm> | null = null;

function Harness({ finnfe, refNfe }: { finnfe: number; refNfe?: string }) {
  const form = useForm<NfeForm>({
    defaultValues: {
      finnfe,
      ref_nfe: refNfe ?? null,
      items: [
        {
          ...emptyNfeItem,
          product_uuid: { label: 'p', value: 'p' },
          quantity: 1,
          amount: 1,
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
      natureOperationData={null}
    />
  );
}

function renderTab(props: { finnfe: number; refNfe?: string }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <ChakraProvider value={system}>
      <QueryClientProvider client={client}>
        <Harness {...props} />
      </QueryClientProvider>
    </ChakraProvider>
  );
}

afterEach(() => {
  cleanup();
  formApi = null;
});

describe('NfeItemsTab — referência por item (devolução)', () => {
  it('só mostra chave e nº do item quando finalidade = devolução', async () => {
    renderTab({ finnfe: 1 });
    await screen.findByText(text.fields.cfop);
    expect(screen.queryByText(text.fields.refAccessKey, { exact: false })).toBeNull();
    expect(screen.queryByText(text.fields.refItemNumber, { exact: false })).toBeNull();
    cleanup();

    renderTab({ finnfe: 4 });
    expect(await screen.findByText(text.fields.refAccessKey, { exact: false })).toBeTruthy();
    expect(screen.getByText(text.fields.refItemNumber, { exact: false })).toBeTruthy();
  });

  it('preenche a chave do item com ref_nfe do cabeçalho quando vazia (P-11)', async () => {
    renderTab({ finnfe: 4, refNfe: KEY_44 });
    await waitFor(() => expect(formApi!.getValues('items.0.ref_access_key')).toBe(KEY_44));
  });

  it('não sobrescreve chave já informada no item', async () => {
    const other = '9'.repeat(44);
    renderTab({ finnfe: 4, refNfe: KEY_44 });
    await waitFor(() => expect(formApi!.getValues('items.0.ref_access_key')).toBe(KEY_44));
    formApi!.setValue('items.0.ref_access_key', other);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(formApi!.getValues('items.0.ref_access_key')).toBe(other);
  });

  it('não preenche fora de devolução', async () => {
    renderTab({ finnfe: 1, refNfe: KEY_44 });
    await screen.findByText(text.fields.cfop);
    expect(formApi!.getValues('items.0.ref_access_key') ?? null).toBeNull();
  });
});

describe('nfeSchema — referência por item', () => {
  const schema = nfeSchema(lang);
  const itemSchema = (schema.fields.items as any).innerType;

  async function validateItem(finnfe: number, item: Record<string, unknown>) {
    try {
      await schema.validate({ finnfe, items: [{ ...baseItem, ...item }] }, { abortEarly: false });
      return [] as string[];
    } catch (error: any) {
      return ((error.inner ?? []) as Array<{ path: string; message: string }>)
        .filter((e) => /^items\[0\]\.ref_/.test(e.path))
        .map((e) => e.message);
    }
  }

  const baseItem = {
    product_uuid: { label: 'p', value: 'p' },
    quantity: 1,
    amount: 1,
    cst_csosn: '102',
    cst_pis: '01',
    cst_cofins: '01',
    cst_ipi: '50',
    cenq_ipi: '999',
    modality_bc: 3,
    origem: '0',
  };

  it('define o schema do item', () => {
    expect(itemSchema).toBeTruthy();
  });

  it('devolução: exige chave e nº do item', async () => {
    const errors = await validateItem(4, {});
    expect(errors).toContain(text.validation.refAccessKeyRequired);
    expect(errors).toContain(text.validation.refItemNumberRequired);
  });

  it('devolução: 43 dígitos é erro; 44 dígitos + item 1 é válido', async () => {
    expect(await validateItem(4, { ref_access_key: '1'.repeat(43), ref_item_number: 1 })).toContain(
      text.validation.refAccessKeyLength
    );
    expect(await validateItem(4, { ref_access_key: KEY_44, ref_item_number: 1 })).toEqual([]);
  });

  it('devolução: item fora de 1..990 é erro (0, 991, decimal)', async () => {
    for (const n of [0, 991, 1.5]) {
      expect(await validateItem(4, { ref_access_key: KEY_44, ref_item_number: n })).toContain(
        text.validation.refItemNumberRange
      );
    }
    expect(await validateItem(4, { ref_access_key: KEY_44, ref_item_number: 990 })).toEqual([]);
  });

  it('finalidade normal: campos ausentes não geram erro', async () => {
    expect(await validateItem(1, {})).toEqual([]);
  });
});
