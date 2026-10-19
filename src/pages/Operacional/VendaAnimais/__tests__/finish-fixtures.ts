// Fixtures compartilhadas pelos testes de componente da Finalização de Venda (UT-000719).
// Sem mocks de módulo aqui (vi.mock é hoisted por arquivo de teste).
import type { MovementSaleDetail } from '@/@types/v2/MovementSales';

export const SALE_UUID = '0198a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5b';
export const SALE_UUID_2 = '0198a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5c';

export function makeSlaughterDetail(
  overrides: Partial<MovementSaleDetail> = {}
): MovementSaleDetail {
  return {
    uuid: SALE_UUID,
    code: '1001',
    status: 'P',
    status_label: 'Pendente',
    dt_sale: '2026-09-10',
    type_sale: 2,
    type_sale_label: 'Abate',
    pricing_type: 1,
    gtas: null,
    batch_sale: false,
    items: [
      {
        animal: { uuid: 'animal-1', identification: '329' },
        category: { uuid: 'cat-1', description: 'Boi' },
        weight_kg: 500,
        carcass_weight: 0,
        performance: 0,
        gain: 0,
        gmd: 0,
        note: null,
      },
    ],
    categories: [
      {
        uuid: 'cat-1',
        description: 'Boi',
        quantity: 1,
        value_real: 0,
        value_arroba: 0,
        value_head: 0,
        value_total: 0,
      },
    ],
    total_products: 0,
    freight: 0,
    other_values: 0,
    discount: 0,
    total: 0,
    seller: null,
    client: { uuid: 'client-1', name: 'Cliente Teste' },
    batch: null,
    incomes: [],
    ...overrides,
  } as unknown as MovementSaleDetail;
}
