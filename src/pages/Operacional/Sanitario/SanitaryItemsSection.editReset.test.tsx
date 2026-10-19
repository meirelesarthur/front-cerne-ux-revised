// src/pages/Operacional/Sanitario/SanitaryItemsSection.editReset.test.tsx
// -----------------------------------------------------------------------------
// BUG-SAN-EDIT-01 (correção ao vivo, dono, 2026-08-28) — investigação mais
// funda que `SanitaryItemRow.measurementHydration.test.tsx`: aquele teste
// montava o form já com `defaultValues.items` hidratado (estático) e NÃO
// reproduziu "vazio" (resolveu para "Litro", rótulo != mas presente).
//
// O que aquele teste NÃO exercitou é a sequência REAL de
// `CreateOrUpdateSanitario.tsx` em modo editar:
//   1. `useForm` monta com `defaultValues.items = []` (casca real,
//      CreateOrUpdateSanitario.tsx linha ~104).
//   2. `SanitaryItemsSection`'s `useEffect` (fields.length===0 → append 1
//      linha VAZIA `EMPTY_ITEM`) roda ANTES da query resolver — mirror EXATO
//      do comentário do próprio arquivo ("montagem inicial OU depois de um
//      reset que ainda não hidrata itens reais").
//   3. SÓ DEPOIS a query `getSanitaryByUuid` resolve e `fillForm` chama
//      `reset(toFormValues(data, languageGB))` com os itens REAIS.
//
// Este teste monta `SanitaryItemsSection` de verdade dentro de um harness que
// reproduz essa MESMA sequência (útil `useFieldArray` + `append` no mount +
// `reset()` assíncrono depois) para decidir se a linha vazia adicionada no
// passo 2 sobrevive/corrompe a hidratação real do passo 3.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import type { LanguageDate } from '@/@types/language';
import type { SanitaryDetail, SanitaryFormValues } from '@/@types/v2/Sanitaries';

import { toFormValues } from './sanitario-form-mapper';
import { SanitaryItemsSection } from './SanitaryItemsSection';

// Detalhe REAL capturado por curl de `GET /sanitaries/{uuid}`
// (01a04849-1e50-7045-9e40-ec7707287a5f) — 2 itens, ambos com
// `stock.measurement` preenchido.
const REAL_DETAIL: SanitaryDetail = {
  uuid: '01a04849-1e50-7045-9e40-ec7707287a5f',
  code: '0017',
  date: '2026-08-28',
  time_control: false,
  batch: { uuid: '8f90334f-60e5-41e8-a5d7-de8994b40d88', name: '700 animais' },
  user: { uuid: '0311f7ec-3a8d-496e-8339-79455200ee36', name: 'Suporte' },
  items: [
    {
      uuid: '01a04849-1e66-7318-9c24-62225f7df910',
      product: { uuid: 'c58fb78c-e588-40b6-a0bd-3032fa6d3047', name: 'ÓLEO DIESEL S 10' },
      stock: {
        uuid: '38a20a9c-2fc7-41b8-8217-9bc1baa96405',
        quantity: 4600,
        warehouse: { uuid: '18512ce6-2c70-43bd-9588-cf30abc23927', name: 'Tanque Combustível S10' },
        measurement: { uuid: '67e31908-6a4e-4357-9973-9a8615ae323c', name: 'l' },
      },
      quantity: 0.22,
      total_quantity: 0.44,
      note: null,
    },
    {
      uuid: '01a04849-1e74-72eb-a59b-70f54e0aebf3',
      product: {
        uuid: 'b05696fb-f160-4521-a765-702037ba13dd',
        name: 'SAL MINERAL COEQUI PLUS 25KG',
      },
      stock: {
        uuid: '23c16a55-d0ef-4679-8859-545eaad1ec56',
        quantity: 4.76,
        warehouse: { uuid: 'f18c731b-406c-4007-a015-e339c5069aaf', name: 'Armazém Insumos' },
        measurement: { uuid: '5ed2ab9c-ad99-49aa-a9f2-18bf81580427', name: 'sc' },
      },
      quantity: 0.22,
      total_quantity: 0.44,
      note: null,
    },
  ],
  animals: [
    { uuid: '36afdc4a-a93c-4a0c-b450-b51115ad8380', identification: 'S/ID' },
    { uuid: 'aef72be2-9620-4484-88a9-072cc9584130', identification: '4988' },
  ],
  labor: [],
};

vi.mock('@/services/v2/Sanitaries/sanitaries-service', () => ({
  listSanitaryMeasurements: vi.fn((productUuid: string) => {
    const byProduct: Record<string, { uuid: string; name: string; description: string }[]> = {
      'c58fb78c-e588-40b6-a0bd-3032fa6d3047': [
        { uuid: '67e31908-6a4e-4357-9973-9a8615ae323c', name: 'l', description: 'Litro' },
      ],
      'b05696fb-f160-4521-a765-702037ba13dd': [
        { uuid: '5ed2ab9c-ad99-49aa-a9f2-18bf81580427', name: 'sc', description: 'Saco' },
        { uuid: 'b27394c2-7993-4646-9a72-653ebc32fb6c', name: 'kg', description: 'Quilograma' },
      ],
    };
    return new Promise((resolve) => {
      setTimeout(
        () =>
          resolve({
            success: true,
            message: '',
            data: byProduct[productUuid] ?? [],
            errors: null,
            meta: null,
          }),
        20
      );
    });
  }),
  listSanitaryProductsByWarehouse: vi.fn(),
}));

vi.mock('@/services/v2/Warehouses/warehouse-service', () => ({
  listWarehouseOptions: vi.fn(),
}));

vi.mock('@/services/v2/CostCenters/cost-center-service', () => ({
  listCostCenterOptions: vi.fn(),
}));

const languageGBStub = {
  sanitary: {
    sanitary: {
      form: {
        sections: { items: 'Itens' },
        fields: {
          warehouse: 'Armazém',
          product: 'Produto',
          measurement: 'Un. Medida',
          stock: 'Estoque',
          dose: 'Dose',
          costCenter: 'Centro de Custo',
          note: 'Observação',
        },
        placeholders: { warehouse: 'Selecione', product: 'Selecione' },
        stockInsufficientWarning: 'Estoque insuficiente',
        removeItem: 'Remover',
        addItem: 'Adicionar item',
        emptyItemsRow: 'Nenhum item',
      },
    },
  },
} as unknown as LanguageDate;

// Harness mirror EXATO da sequência real de `CreateOrUpdateSanitario.tsx`:
// `useForm` monta com `items: []` (defaultValues real da casca);
// `SanitaryItemsSection` (não-mockado) roda seu `useEffect` de "mínimo 1
// linha vazia" ANTES da query resolver; só depois (setTimeout, mirror
// `getSanitaryByUuid` assíncrono real) o harness chama `reset(toFormValues(...))`
// — EXATAMENTE o que `fillForm` faz.
function EditHarness() {
  const { control, reset } = useForm<SanitaryFormValues>({
    defaultValues: {
      date: null,
      batch_uuid: null,
      time_control: false,
      animal_uuids: [],
      items: [],
      labor: [],
    },
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      reset(toFormValues(REAL_DETAIL, languageGBStub));
    }, 10);
    return () => clearTimeout(timer);
  }, [reset]);

  return (
    <SanitaryItemsSection
      control={control}
      languageGB={languageGBStub}
      animalsCount={2}
      isDisabled={false}
    />
  );
}

describe('SanitaryItemsSection — sequência real de edição (append vazio → reset real), BUG-SAN-EDIT-01', () => {
  it('os 2 Selects de Un. Medida mostram o valor hidratado depois do reset() real, sem ficar vazios', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={queryClient}>
        <ChakraProvider value={system}>
          <EditHarness />
        </ChakraProvider>
      </QueryClientProvider>
    );

    await waitFor(
      () => {
        const valueTexts = Array.from(document.querySelectorAll('.chakra-select__valueText'));
        expect(valueTexts).toHaveLength(2);
        const texts = valueTexts.map((el) => el.textContent);
        expect(texts).not.toContain('');
        expect(texts.every((t) => t !== 'Selecione uma opção')).toBe(true);
      },
      { timeout: 3000 }
    );
  });
});
