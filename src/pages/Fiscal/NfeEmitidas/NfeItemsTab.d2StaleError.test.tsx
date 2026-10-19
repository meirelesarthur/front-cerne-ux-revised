// @vitest-environment jsdom
// D-101-15 — a cascata Produto→item limpa erros obsoletos dos campos preenchidos.
import { useEffect } from 'react';

import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { getLanguageRouter } from '@/utils/get-language-route';

import { languageContextTypes } from '@/constants/languages';

import type { NfeForm } from '@/@types/v2/Nfes';

vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({ languageGB: getLanguageRouter(languageContextTypes.BR) }),
}));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ activeFarmUuid: 'farm-uuid-1' }) }));
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
  getProduct: vi.fn(async () => ({
    data: {
      uuid: 'prod-x',
      description: 'Soja',
      cfop_saida_interno: '5102',
      cfop_saida_externo: '6102',
      cst_csosn: '102',
      cst_pis: '01',
      cst_cofins: '01',
      origem: 0,
      measurement: { description: 'Kg' },
      group: { description: 'Grãos' },
      package_uuids: [],
    },
  })),
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

let formApi: UseFormReturn<NfeForm> | null = null;

function Harness({ withClear }: { withClear: boolean }) {
  const form = useForm<NfeForm>({
    defaultValues: { items: [emptyNfeItem, emptyNfeItem] } as unknown as NfeForm,
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
      clearErrors={withClear ? form.clearErrors : undefined}
      isLoading={false}
      canSave
      additionalInfoOption={null}
      onAdditionalInfoChange={() => undefined}
      natureOperationData={null}
    />
  );
}

async function run(withClear: boolean) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <ChakraProvider value={system}>
      <QueryClientProvider client={client}>
        <Harness withClear={withClear} />
      </QueryClientProvider>
    </ChakraProvider>
  );
  await waitFor(() => expect(formApi).not.toBeNull());
  act(() => {
    formApi?.setError('items.1.cst_csosn', { type: 'typeError', message: 'must be a string' });
    formApi?.setError('items.1.quantity', { type: 'required', message: 'obrigatório' });
    formApi?.setError('items.0.cst_csosn', { type: 'typeError', message: 'item 0' });
  });
  act(() => {
    formApi?.setValue('items.1.product_uuid', { label: 'Soja', value: 'prod-x' });
  });
  await waitFor(() => expect(formApi?.getValues('items.1.cst_csosn')).toBe('102'));
}

afterEach(() => {
  cleanup();
  formApi = null;
});

describe('NfeItemsTab — erro obsoleto após cascata (D-101-15)', () => {
  it('limpa o erro do campo preenchido; preserva erro de campo não coberto e de outro item', async () => {
    await run(true);
    await waitFor(() => expect(formApi?.formState.errors.items?.[1]?.cst_csosn).toBeUndefined());
    expect(formApi?.formState.errors.items?.[1]?.quantity).toBeDefined();
    expect(formApi?.formState.errors.items?.[0]?.cst_csosn).toBeDefined();
  });

  it('sem clearErrors o erro obsoleto permanece (prova do defeito)', async () => {
    await run(false);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });
    expect(formApi?.formState.errors.items?.[1]?.cst_csosn).toBeDefined();
  });
});
