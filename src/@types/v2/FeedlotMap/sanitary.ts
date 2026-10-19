// src/@types/v2/FeedlotMap/sanitary.ts
// Tipagem do Sanitário Múltiplo do Curral — TASK-FE-042-215, correção de
// fidelidade GAP-FE-244 (execução 042). Mirror
// `[[09-front-sanitario-morte]]` §1 / `[[04-sanitario-morte]]` §1 e do
// legado `ModalSanitario.js`:
//   GET .../sanitary-data                  → animais + armazéns do curral.
//   GET .../sanitary/products-by-warehouse/{warehouseUuid}
//       → 1 opção POR LINHA de `Stock` (produto+LOTE), não deduplicada por
//         produto (mirror `product.quantity`/`product.lot` do legado,
//         `stocks.quantity`/`stocks.lot` sem agregação) — `StockAvailabilityResource`,
//         reuso do mesmo Resource do GAP-BE-600.
//   POST .../sanitaries-multiple            → JSON (NÃO FormData),
//       `{ animal_uuids: string[], items: SanitaryItemPayload[] }` — mirror
//       EXATO de `StoreFeedlotCorralSanitaryMultipleRequest::rules()`
//       (`app/Http/Requests/Api/V1/StoreFeedlotCorralSanitaryMultipleRequest.php`).
//       `stock_uuid` por item identifica a linha física de estoque exata
//       (produto+armazém+lote) escolhida — mirror do `lots[]` do legado
//       (`ModalSanitario.js` envia `lot` por item, usado no débito), mas via
//       uuid do próprio `Stock` (convenção Cerne: sempre uuid, nunca valor
//       ambíguo).

import type { Option } from '@/@types/option';

export interface FeedlotCorralSanitaryData {
  animals: Option<string>[];
  warehouses: Option<string>[];
}

/**
 * Uma linha de `Stock` (produto+armazém+lote) disponível no armazém — o
 * "produto" do Select é, na prática, um lote específico (mirror legado:
 * mesmo `product_id` pode aparecer 2× com `lot`/`quantity` diferentes).
 */
export interface FeedlotCorralSanitaryStockOption {
  /** uuid do próprio `Stock` — vai como `items[].stock_uuid` no submit. */
  uuid: string;
  product: {
    uuid: string;
    description: string;
  };
  /** Saldo bruto desta linha de estoque (unidade PRIMÁRIA do produto). */
  quantity: number;
  min_stock: number | null;
  lot: string | null;
  provider_lot: string | null;
  warehouse_uuid: string | null;
  measurement: { uuid: string; name: string; description: string } | null;
  measurement_second: { uuid: string; name: string; description: string } | null;
  factor: number | null;
  factor_type: 'M' | 'D' | null;
}

export interface SanitaryItemPayload {
  warehouse_uuid: string;
  product_uuid: string;
  stock_uuid: string;
  measurement_uuid: string;
  quantity: number;
  note?: string | null;
}

export interface SaveMultipleSanitariesRequest {
  animal_uuids: string[];
  items: SanitaryItemPayload[];
}

export interface SaveMultipleSanitariesResponseData {
  sanitary: unknown;
  warnings: string[];
}
