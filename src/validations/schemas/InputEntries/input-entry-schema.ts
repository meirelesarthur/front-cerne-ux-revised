// src/validations/schemas/InputEntries/input-entry-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Entrada de Insumos (InputEntry) —
// esteira 037, TASK-IE-FE-02. Schema ÚNICO (mirror `invoice-schema.ts`, NÃO
// dois schemas como Devolução) — create/update compartilham o MESMO shape de
// payload (decisão #3 do roteiro).
//
// `warehouse_uuid` é condicional via `.when('generate_stock', ...)` (mirror
// `required_if:generate_stock,true` do backend, risco (e) da Leitura do
// dev).
//
// CORRECAO-R1/E2 — `area_uuid`/`batch_uuid` REMOVIDOS (decisão do dono,
// fidelidade); `cultivation_uuid` mantido (único real do legado).
// CORRECAO-R1/E3 — `provider_lot`/`shelf_life` passam a ser condicionais a
// `product_uuid.has_lot` (embutido na option pelo `mapOptions` de Produto em
// `EntradaInsumosItemsTab.tsx`, mirror `InvoiceItemsTab.tsx`): obrigatórios
// quando `has_lot=true`, opcionais quando `false` (contrato FM-019/FM-020).
// CORRECAO-R1/E5 — `appropriation_type` deixou de ser texto livre e passa a
// ser `Option` (Select Agricultura/Pecuária, constante local do módulo).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { todayLocalIso } from '@/utils/localDate';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

export const inputEntrySchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.inputEntries.inputEntry.form.validation;

  const itemRowSchema = yup.object({
    // DD-078-07 (b) — uuid do item existente (hidratação de edição); ausente em item novo.
    uuid: yup.string().nullable(),
    product_uuid: v.option<string>().required(messages.productRequired),
    measurement_uuid: v.option<string>().required(messages.measurementRequired),
    quantity: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? undefined : value))
      .typeError(messages.quantityRequired)
      .required(messages.quantityRequired)
      .moreThan(0, messages.quantityMin),
    unit_value: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? undefined : value))
      .typeError(messages.unitValueRequired)
      .required(messages.unitValueRequired)
      .min(0, messages.unitValueRequired),
    // Client-only, preview — NUNCA enviado no payload (servidor sempre
    // recalcula `quantity × unit_value`, CL-006).
    total_value: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      .min(0),
    generate_stock: yup.boolean().default(true),
    // `required_if:generate_stock,true` no backend — mirror EXATO da técnica
    // já usada em `invoice-schema.ts` (`warehouse_uuid`).
    warehouse_uuid: yup
      .mixed()
      .nullable()
      .when('generate_stock', {
        is: true,
        then: (schema) => schema.required(messages.warehouseRequiredWhenGenerateStock),
      }),
    // CORRECAO-R1/E5 — Select (Agricultura "1" / Pecuária "2"), `Option`
    // em vez de texto livre.
    appropriation_type: yup.mixed().nullable(),
    // CORRECAO-R1/E3 — obrigatórios quando o produto selecionado tem
    // `has_lot=true` (embutido na option de `product_uuid`).
    provider_lot: yup
      .string()
      .trim()
      .nullable()
      .max(15, messages.providerLotMaxLength)
      // DD-078-07 (b): item já gravado (`uuid`) tem lote somente leitura — não exigir.
      .when(['product_uuid', 'uuid'], {
        is: (productUuid: any, itemUuid: any) => !!productUuid?.has_lot && !itemUuid,
        then: (schema) => schema.required(messages.providerLotRequiredWhenHasLot),
      }),
    shelf_life: yup
      .string()
      .nullable()
      .when(['product_uuid', 'uuid'], {
        is: (productUuid: any, itemUuid: any) => !!productUuid?.has_lot && !itemUuid,
        then: (schema) => schema.required(messages.shelfLifeRequiredWhenHasLot),
      }),
    cultivation_uuid: yup.mixed().nullable(),
    // F-084 item 5 (RODADA FINAL, fidelidade ao legado) — Categoria
    // Financeira passa a ser obrigatória (antes só `nullable`, sem
    // `isRequired` no Select correspondente), mesma técnica de
    // `center_uuid` abaixo.
    category_uuid: v.option<string>().required(messages.categoryRequired),
    // F-084 item 5 (rodada anterior) — Centro de Custo passa a ser obrigatório
    // (antes só `nullable`, sem `isRequired` no Select correspondente).
    center_uuid: v.option<string>().required(messages.centerRequired),
  });

  return yup.object({
    // DD-078-01: sem data futura (dia local; a API segue como autoridade — 422).
    date: yup
      .string()
      .nullable()
      .required(messages.dateRequired)
      .test(
        'max-today',
        messages.dateFuture,
        (value) => !value || value.slice(0, 10) <= todayLocalIso()
      ),
    harvest_uuid: yup.mixed().nullable(),
    proprietary_uuid: yup.mixed().nullable(),
    note: yup.string().trim().nullable(),

    items: yup.array().of(itemRowSchema).min(1, messages.itemsRequired).default([]),

    // -- Seção "Baixa Automática" — HEADER-level, débito, condicional --
    automatic_writeoff: yup.boolean().default(false),
    account_uuid: yup
      .mixed()
      .nullable()
      .when('automatic_writeoff', {
        is: true,
        then: (schema) => schema.required(messages.accountRequiredWhenAutomaticWriteoff),
      }),
    movement_date: yup
      .string()
      .nullable()
      .when('automatic_writeoff', {
        is: true,
        then: (schema) => schema.required(messages.movementDateRequiredWhenAutomaticWriteoff),
      }),
  });
};

export const inputEntrySchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(inputEntrySchema(languageGB));

export default inputEntrySchemaResolver;
