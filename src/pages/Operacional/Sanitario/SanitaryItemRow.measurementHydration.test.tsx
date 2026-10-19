// src/pages/Operacional/Sanitario/SanitaryItemRow.measurementHydration.test.tsx
// -----------------------------------------------------------------------------
// BUG-SAN-EDIT-01 (correção ao vivo, dono, 2026-08-28) — "Un. Medida continua
// vindo vazio ao abrir a edição do Sanitário", mesmo depois da correção já
// aplicada hoje (`d1ba98424` API / `6993a8df1` frontend) que fez
// `SanitaryResource::items[].stock` devolver `measurement` real.
//
// Investigação real (execução 002 EST-02, lane C):
//   1. `GET /sanitaries/{uuid}` real (curl, sanitary UUID
//      01a04849-1e50-7045-9e40-ec7707287a5f, farm e4316823-...) devolve
//      `data.items[0].stock.measurement = {uuid: '67e31908-...', name: 'l'}`
//      — a API está correta.
//   2. `GET /sanitaries/measurements/{productUuid}` real (EP-SAN-12) para o
//      MESMO produto devolve o MESMO uuid de medida na lista de opções —
//      não é problema de dado divergente entre os 2 endpoints.
//   3. `mapSanitaryItemsToFormValues` (sanitario-form-mapper.ts) hidrata
//      `measurement_uuid` corretamente a partir desse JSON real.
//   4. Este teste monta o `SanitaryItemRow` REAL (não um clone) com esse
//      valor já hidratado no form state (mirror exato do `reset()` de
//      `CreateOrUpdateSanitario.tsx`) e `listSanitaryMeasurements` mockado
//      para responder DE FORMA ASSÍNCRONA (mirror da latência real de rede)
//      com a MESMA lista real do EP-SAN-12 — decide se o Select "Un. Medida"
//      efetivamente exibe "l" depois que a Promise resolve.
// -----------------------------------------------------------------------------

import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import type { LanguageDate } from '@/@types/language';
import type { SanitaryFormValues } from '@/@types/v2/Sanitaries';

import { mapSanitaryItemsToFormValues } from './sanitario-form-mapper';
import { SanitaryItemRow } from './SanitaryItemRow';

// Resposta REAL capturada por curl de `GET /sanitaries/{uuid}` (item 0,
// produto ÓLEO DIESEL S 10) — não é um dado inventado.
const REAL_ITEM_DETAIL = {
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
};

// Resposta REAL capturada por curl de `GET /sanitaries/measurements/{productUuid}`
// (EP-SAN-12) para o MESMO produto — mesmo uuid de medida do item acima.
const REAL_MEASUREMENTS_RESPONSE = {
  success: true,
  message: 'Unidades de medida do produto listadas com sucesso.',
  data: [{ uuid: '67e31908-6a4e-4357-9973-9a8615ae323c', name: 'l', description: 'Litro' }],
  errors: null,
  meta: null,
};

vi.mock('@/services/v2/Sanitaries/sanitaries-service', () => ({
  listSanitaryMeasurements: vi.fn(
    () =>
      new Promise((resolve) => {
        // Mirror de latência de rede real — resolve DEPOIS do 1º paint,
        // exatamente a corrida relatada pelo dono (`value` já hidratado,
        // `options` só chegam depois).
        setTimeout(() => resolve(REAL_MEASUREMENTS_RESPONSE), 20);
      })
  ),
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
      },
    },
  },
} as unknown as LanguageDate;

function Harness() {
  const { control } = useForm<SanitaryFormValues>({
    defaultValues: {
      date: '2026-08-28',
      batch_uuid: null,
      time_control: false,
      animal_uuids: [],
      items: mapSanitaryItemsToFormValues([REAL_ITEM_DETAIL as any]),
      labor: [],
    },
  });

  return (
    <SanitaryItemRow
      control={control}
      index={0}
      canRemove={false}
      onRemove={() => {}}
      animalsCount={2}
      languageGB={languageGBStub}
    />
  );
}

describe('SanitaryItemRow — hidratação real de Un. Medida em modo editar (BUG-SAN-EDIT-01)', () => {
  it('exibe "l" no Select de Un. Medida depois que EP-SAN-12 resolve, sem apagar o valor hidratado', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={queryClient}>
        <ChakraProvider value={system}>
          <Harness />
        </ChakraProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      const valueText = document.querySelector('.chakra-select__valueText');
      expect(valueText).not.toBeNull();
      expect(valueText?.textContent).toBe('l');
    });
  });
});
