// src/constants/rastreabilidade/traceability/default-values.ts
// -----------------------------------------------------------------------------
// `traceabilityFormDefaultValues` — defaults do formulário de Produto
// (Traceability, F-067, TASK-TR-FE-06), 40 campos reais (`TraceabilityForm`,
// TASK-TR-FE-01). `tracking_code`/`lot_number` nascem `''` nos dois modos —
// SEMPRE readonly (round-trip `## 8` do contrato de tela): em criação exibem
// o placeholder "gerado ao salvar" (`## 9.2`), em edição são sobrescritos
// pelo `reset()` de hidratação (`fillTraceabilityForm`) com o valor real do
// servidor.
// -----------------------------------------------------------------------------

import type { TraceabilityForm } from '@/@types/v2/Rastreabilidade/traceability';

export const traceabilityFormDefaultValues: TraceabilityForm = {
  // ---- 1. Identificação ----
  product_uuid: null,
  traceability_config_uuid: null,
  harvested_in: null,
  packing: '',
  gross_weight: '',
  tracking_code: '',
  name_pt: '',
  name_en: '',
  name_es: '',

  // ---- 2. Sobre o produto ----
  description_pt: '',
  description_en: '',
  description_es: '',

  // ---- 3. Informação nutricional (8 pares) ----
  energetic_value: null,
  energetic_value_perc: null,
  carbohydrates: null,
  carbohydrates_perc: null,
  proteins: null,
  proteins_perc: null,
  fat_total: null,
  fat_total_perc: null,
  fat_saturated: null,
  fat_saturated_perc: null,
  fat_trans: null,
  fat_trans_perc: null,
  dietary_fiber: null,
  dietary_fiber_perc: null,
  sodium: null,
  sodium_perc: null,

  // ---- 4. Exportador (opcional) ----
  barcode: '',
  exporter_name: '',
  exporter_address: '',
  exporter_zip_code: '',
  exporter_city: '',
  exporter_state: '',
  exporter_country: '',

  // ---- 5. Área e disponibilidade ----
  area_uuid: null,
  lot_number: '',
  box_quantity: null,
  availability: [],

  // ---- 6. Mapa (display read-only, `## 9.1`) ----
  latlng: '',
};

export default traceabilityFormDefaultValues;
