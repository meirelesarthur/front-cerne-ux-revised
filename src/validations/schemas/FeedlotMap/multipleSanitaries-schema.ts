// src/validations/schemas/FeedlotMap/multipleSanitaries-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do diálogo Sanitário Múltiplo — TASK-FE-042-215.
// `animal_id` — ao menos 1 animal (`FM072`, default = todos ativos, mirror
// `[[09-front-sanitario-morte]]` §1). `items` — `useFieldArray` `.min(1)`
// item COMPLETO (`warehouse_id`/`product_id`/`measurement_id`/`quantity`
// required), mirror `guardSanitaryItems` do precedente `ProcessingSanitarySection`.
//
// `product_id` (GAP-FE-244, correção de fidelidade exec-042) — o campo
// continua chamado `product_id` (nome interno do form, não renomeado para
// não tocar em mais superfície do que o necessário), mas o VALOR agora é
// `SanitaryStockFieldOption`: uma linha de `Stock` (produto+LOTE), não um
// produto genérico — `value` = uuid do `Stock` (vai como `stock_uuid` no
// submit), `product_uuid`/`quantity`/`lot` carregados junto (mirror
// `product.quantity`/`product.lot` do legado `ModalSanitario.js`).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

export interface SanitaryStockFieldOption extends Option<string> {
  product_uuid: string;
  quantity: number;
  lot: string | null;
  measurement?: { uuid: string; name: string; description: string } | null;
  measurement_second?: { uuid: string; name: string; description: string } | null;
  factor?: number | null;
  factor_type?: 'M' | 'D' | null;
}

export interface SanitaryItemFormValues {
  warehouse_id: Option<string> | null;
  product_id: SanitaryStockFieldOption | null;
  measurement_id: Option<string> | null;
  quantity: number | '';
  note_item: string;
}

export interface MultipleSanitariesFormValues {
  animal_id: Option<string>[];
  items: SanitaryItemFormValues[];
}

export const multipleSanitariesSchema = (languageGB: LanguageDate) => {
  const msgs = languageGB.feedlotMap.feedlotMap.sanitary.validation;

  return yup.object({
    animal_id: yup.array().min(1, msgs.animalsRequired),
    items: yup
      .array()
      .of(
        yup.object({
          warehouse_id: yup.object().nullable().required(msgs.warehouseRequired),
          product_id: yup.object().nullable().required(msgs.productRequired),
          measurement_id: yup.object().nullable().required(msgs.measurementRequired),
          quantity: yup
            .number()
            .transform((_value, original) =>
              original === '' || original == null ? undefined : Number(original)
            )
            .typeError(msgs.quantityRequired)
            .required(msgs.quantityRequired)
            .min(0, msgs.quantityMin),
          note_item: yup.string(),
        })
      )
      .min(1, msgs.itemsRequired),
  });
};

export const multipleSanitariesSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(multipleSanitariesSchema(languageGB) as any);

export default multipleSanitariesSchemaResolver;
