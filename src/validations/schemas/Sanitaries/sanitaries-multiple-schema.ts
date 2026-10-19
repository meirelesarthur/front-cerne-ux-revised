// src/validations/schemas/Sanitaries/sanitaries-multiple-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do diálogo de criação múltipla de Sanitário —
// `CreateSanitariesMultipleDialog.tsx` (F-062, TASK-SAN-FE-07,
// contrato-tela-lane-c-sanitario-frontend.md §6.7, ADR-FE-SAN-01). Fábrica
// `(languageGB) => resolver`, mirror `sanitaries-schema.ts`/
// `multipleSanitaries-schema.ts` (FeedlotMap). Schema NUNCA em `pages/`
// (SEVERIDADE inviolável) — arquivo próprio mesmo o dialog não estando
// listado em "Arquivos afetados" da Tarefa (infraestrutura obrigatória, não
// escopo de tela).
//
// `batch_uuids` — ao menos 1 lote (Regra 2 da Tarefa: seleção é a UNIÃO dos
// lotes, nunca travada a 1 só). `date` reusa o helper genérico
// `fieldValidationSchema` (mensagens de `languageGB.defaltStrings.validations`,
// mesma convenção de outras telas fora do módulo Sanitário — este diálogo NÃO
// reusa `languageGB.sanitary.sanitary.form.validation.*`, que é escopo do
// form principal). `items` — mesma forma de linha do form principal
// (`SanitaryItemFormValue`, `SanitaryItemsSection`/`SanitaryItemRow` reusados
// 1:1, Regra 3 da Tarefa): `warehouse_uuid`/`product`/`measurement_uuid`/
// `quantity` obrigatórios, `cost_center_uuid`/`note` opcionais — o
// `cost_center_uuid` continua VALIDÁVEL/exibível no componente reusado, só
// não entra no payload (Regra 1 da Tarefa, mapeamento feito no próprio
// diálogo, não aqui). `animal_uuids` (agregação client-side, readonly) NÃO
// é validado aqui — não é digitado pelo usuário, é derivado dos lotes
// selecionados; o diálogo desabilita o submit quando a agregação vem vazia.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

export const sanitariesMultipleSchema = (languageGB: LanguageDate) => {
  const fv = fieldValidationSchema(languageGB);
  const dialogMsgs = languageGB.sanitary.sanitary.createMultipleDialog.validation;
  const itemMsgs = languageGB.sanitary.sanitary.form.validation;

  const itemSchema = yup.object({
    row_uuid: yup.string().nullable(),
    warehouse_uuid: yup.object().nullable().required(itemMsgs.warehouseRequired),
    product: yup.object().nullable().required(itemMsgs.productRequired),
    measurement_uuid: yup.object().nullable().required(itemMsgs.measurementRequired),
    quantity: yup
      .number()
      .transform((_value, original) =>
        original === '' || original == null ? undefined : Number(original)
      )
      .typeError(itemMsgs.quantityRequired)
      .required(itemMsgs.quantityRequired)
      .min(0, itemMsgs.quantityMin),
    cost_center_uuid: yup.mixed().nullable(),
    note: yup.string().nullable(),
  });

  return yup.object({
    date: fv.date(),
    batch_uuids: yup.array().min(1, dialogMsgs.batchesRequired),
    items: yup.array().of(itemSchema).min(1, dialogMsgs.itemsRequired),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })` — mirror
 * `sanitarySchemaResolver`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo.
 * @return {Function} Resolver ligado ao schema do diálogo.
 */
export const sanitariesMultipleSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(sanitariesMultipleSchema(languageGB) as any);

export default sanitariesMultipleSchemaResolver;
