// src/validations/schemas/Sanitaries/sanitaries-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Sanitário (CRUD raiz, F-062,
// TASK-SAN-FE-01). Fábrica `(languageGB) => resolver`, mirror
// `service-order-schema.ts`/`multipleSanitaries-schema.ts`. Schema NUNCA em
// `pages/` (SEVERIDADE inviolável).
//
// Client-side só impede submit de linha OBVIAMENTE incompleta — a
// autoridade final de negócio é sempre o 422 do backend (`SanitaryRequest::
// rules()`, CTR-SAN §3).
//
// Campos obrigatórios/condicionais (Tarefa, "Regras"):
//   - date/batch_uuid/animal_uuids (mín. 1) sempre obrigatórios.
//   - items mín. 1 linha; cada linha com warehouse_uuid/product/
//     measurement_uuid/quantity obrigatórios (mirror `multipleSanitariesSchema`).
//   - labor: validado linha-a-linha SÓ quando `time_control=true` (Regra 4 —
//     quando `false` a chave `labor` é OMITIDA do payload, mirror `Optional`
//     do backend). Cada linha com func_type + EXATAMENTE 1 executor
//     (employee_uuid/function_uuid/provider_uuid conforme `func_type`,
//     mirror `ServiceOrderEmployeeLineExactlyOneRule` de
//     `service-order-schema.ts`) + measurement_uuid + total_quantity.
//     `amount` NUNCA existe no form (Regra 3) — sem campo aqui.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

export const sanitarySchema = (languageGB: LanguageDate) => {
  const fv = fieldValidationSchema(languageGB);
  const msgs = languageGB.sanitary.sanitary.form.validation;

  // -- Itens de produto (mín. 1, mirror `multipleSanitariesSchema.items`) --
  const itemSchema = yup.object({
    row_uuid: yup.string().nullable(),
    warehouse_uuid: yup.object().nullable().required(msgs.warehouseRequired),
    // Opção = linha de `Stock` (produto+lote), mirror `product_id` de
    // `multipleSanitariesSchema` — NÃO é um produto puro.
    product: yup.object().nullable().required(msgs.productRequired),
    measurement_uuid: yup.object().nullable().required(msgs.measurementRequired),
    quantity: yup
      .number()
      .transform((_value, original) =>
        original === '' || original == null ? undefined : Number(original)
      )
      .typeError(msgs.quantityRequired)
      .required(msgs.quantityRequired)
      .min(0, msgs.quantityMin),
    cost_center_uuid: yup.mixed().nullable(),
    note: yup.string().nullable(),
  });

  // -- Mão de obra — invariante "exatamente 1 executor" (mirror
  // `ServiceOrderEmployeeLineExactlyOneRule`/`service-order-schema.ts`):
  // quando `func_type` está preenchido, o campo `*_uuid` correspondente
  // (1=employee, 2=function, 3=provider) é obrigatório. O teste vive no
  // PRÓPRIO campo (`context.parent`) para que o erro apareça no select
  // certo, não num teste solto do objeto.
  const laborItemSchema = yup.object({
    row_uuid: yup.string().nullable(),
    func_type: yup.object().nullable().required(msgs.laborFuncTypeRequired),
    employee_uuid: yup
      .mixed()
      .nullable()
      .test(
        'required-when-employee',
        msgs.laborExecutorRequired,
        (value, context) => context.parent?.func_type?.value !== 1 || !!value
      ),
    function_uuid: yup
      .mixed()
      .nullable()
      .test(
        'required-when-function',
        msgs.laborExecutorRequired,
        (value, context) => context.parent?.func_type?.value !== 2 || !!value
      ),
    provider_uuid: yup
      .mixed()
      .nullable()
      .test(
        'required-when-provider',
        msgs.laborExecutorRequired,
        (value, context) => context.parent?.func_type?.value !== 3 || !!value
      ),
    measurement_uuid: yup.object().nullable().required(msgs.laborMeasurementRequired),
    total_quantity: yup
      .number()
      .transform((_value, original) =>
        original === '' || original == null ? undefined : Number(original)
      )
      .typeError(msgs.laborTotalQuantityRequired)
      .required(msgs.laborTotalQuantityRequired)
      .min(0, msgs.quantityMin),
  });

  return yup.object({
    date: fv.date(),
    batch_uuid: yup.object().nullable().required(msgs.batchRequired),
    time_control: yup.boolean().default(false),
    animal_uuids: yup.array().min(1, msgs.animalsRequired),
    items: yup.array().of(itemSchema).min(1, msgs.itemsRequired),
    // `labor` só é validado linha-a-linha quando `time_control=true` — o
    // bloco fica oculto (não removido do form state) quando `false`, mas
    // não pode bloquear submit (Regra 4 da Tarefa; `sanitario-form-mapper.ts`,
    // Tarefa 29, é quem omite a chave do payload nesse caso).
    labor: yup.array().when('time_control', {
      is: true,
      then: (schema) => schema.of(laborItemSchema),
      otherwise: (schema) => schema.nullable(),
    }),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })` — mirror
 * `serviceOrderSchemaResolver`/`multipleSanitariesSchemaResolver`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo.
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const sanitarySchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(sanitarySchema(languageGB) as any);

export default sanitarySchemaResolver;
