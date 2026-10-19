// src/validations/schemas/ServiceOrders/service-order-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Ordem de Serviço (ServiceOrder) —
// TASK-FE-2004 (esteira 038, D-FRONT-01 RESOLVIDA). Fábrica
// `(languageGB) => resolver`, mirror `appropriation-schema.ts`/
// `plan-role-schema.ts`. Schema NUNCA em `pages/` (SEVERIDADE inviolável).
//
// Client-side só impede submit de linha OBVIAMENTE incompleta — a
// autoridade final de negócio é sempre o 422 do backend
// (`ServiceOrderRequest::rules()`).
//
// Invariante "exatamente 1 executor" (mão de obra) — mirror
// `ServiceOrderEmployeeLineExactlyOneRule` do backend: quando `func_type`
// está preenchido, o campo `*_uuid` correspondente (1=employee, 2=function,
// 3=provider) é obrigatório. O teste vive no PRÓPRIO campo (`context.parent`,
// mesmo idioma de `used_area` em `appropriation-schema.ts`) para que o erro
// apareça no select certo, não num teste solto do objeto.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

export const serviceOrderSchema = (languageGB: LanguageDate) => {
  const fv = fieldValidationSchema(languageGB);
  const genericMessages = languageGB.defaltStrings.validations;

  // Número opcional (>=0) — campos escalares do cabeçalho sem regra de
  // negócio adicional no client (temperatura mín/máx).
  const optionalNumberMin0 = () =>
    yup
      .number()
      .transform((value, original) =>
        original === '' || original === null || original === undefined ? null : value
      )
      .nullable()
      .min(0, genericMessages.invalidValue)
      .typeError(genericMessages.invalidValue);

  // Número obrigatório (>0) — quantidades das linhas dos blocos (mirror
  // `stockItemSchema.quantity`/`productionItemSchema.quantity` de
  // `appropriation-schema.ts`).
  const requiredNumberMoreThan0 = () =>
    yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .required(genericMessages.requiredField)
      .moreThan(0, genericMessages.invalidValue)
      .typeError(genericMessages.invalidValue);

  // Horário HH:mm opcional — máscara/validação de navegador (`time` input),
  // client-side só valida formato quando preenchido.
  const optionalTime = () =>
    yup
      .string()
      .nullable()
      .matches(/^\d{2}:\d{2}$/, {
        message: genericMessages.invalidValue,
        excludeEmptyString: true,
      });

  // -- Mão de obra (invariante "exatamente 1" — mirror
  // ServiceOrderEmployeeLineExactlyOneRule) ---------------------------------
  const employeeItemSchema = yup.object({
    func_type: fv.option<number>(),
    employee_uuid: yup
      .mixed()
      .nullable()
      .test(
        'required-when-employee',
        genericMessages.requiredField,
        (value, context) => context.parent?.func_type?.value !== 1 || !!value
      ),
    function_uuid: yup
      .mixed()
      .nullable()
      .test(
        'required-when-function',
        genericMessages.requiredField,
        (value, context) => context.parent?.func_type?.value !== 2 || !!value
      ),
    provider_uuid: yup
      .mixed()
      .nullable()
      .test(
        'required-when-provider',
        genericMessages.requiredField,
        (value, context) => context.parent?.func_type?.value !== 3 || !!value
      ),
    note: yup.string().nullable(),
    is_checked: yup.boolean().default(false),
  });

  const equipmentItemSchema = yup.object({
    equipment_uuid: fv.option(),
    note: yup.string().nullable(),
    is_checked: yup.boolean().default(false),
  });

  // -- Insumos (exec-038 HOMOLOG R2, R2-05 — REWORK) — `warehouse_uuid` do
  // BLOCO (fora do array, ver `products_warehouse_uuid` abaixo) é UI-ONLY,
  // sem regra própria. `quantity`/`total_quantity` OBRIGATÓRIOS >0 (mirror
  // `ServiceOrderRequest::rules()`, os dois são `required` no backend) —
  // "Qtd Total" agora É calculada por área produtiva
  // (`ServiceOrderProductTab.tsx`, `areas/options` passou a expor
  // `productive_area`), mas o client-side continua só bloqueando submit
  // obviamente incompleto (autoridade final é o 422 do backend).
  const productItemSchema = yup.object({
    stock_uuid: fv.option(),
    measurement_uuid: fv.option(),
    quantity: requiredNumberMoreThan0(),
    total_quantity: requiredNumberMoreThan0(),
    note: yup.string().nullable(),
    is_checked: yup.boolean().default(false),
  });

  const productionItemSchema = yup.object({
    product_uuid: fv.option(),
    measurement_uuid: fv.option(),
    quantity: requiredNumberMoreThan0(),
    note: yup.string().nullable(),
    is_checked: yup.boolean().default(false),
  });

  const protectionItemSchema = yup.object({
    product_uuid: fv.option(),
    note: yup.string().nullable(),
    is_checked: yup.boolean().default(false),
  });

  return yup.object({
    code: fv.string(),
    executor_uuid: fv.option(),
    dt_emission: fv.date(),
    execution_date: fv.date(),
    deadline: fv.date(),
    category: fv.option<number>(),
    operation_uuid: fv.option(),
    activity_uuid: fv.option(),
    area_uuid: fv.option(),
    // Condicionais por `category` (IG-01 do contrato legado — PRESERVE
    // as-is: legado marca "readonly", nunca "hidden"; a tela mantém os 3
    // campos sempre visíveis, só desabilita o que não se aplica ao `category`
    // corrente — `ServiceOrderHeaderFields.tsx`). Sem `.required()` — nenhum
    // dos 3 é obrigatório no backend (`nullable` em `ServiceOrderRequest`).
    cultivation_uuid: yup.mixed().nullable(),
    batch_uuid: yup.mixed().nullable(),
    category_uuid: yup.mixed().nullable(),
    weather_requirements: yup.string().nullable(),
    minimum_temperature: optionalNumberMin0(),
    maximum_temperature: optionalNumberMin0(),
    allowed_working_period_start: optionalTime(),
    allowed_working_period_end: optionalTime(),
    environmental_restrictions: yup.string().nullable(),
    legal_compliance: yup.string().nullable(),
    service_description: yup.string().nullable(),
    expected_result_description: yup.string().nullable(),
    success_criteria_description: yup.string().nullable(),
    roadmap_description: yup.string().nullable(),
    employees: yup.array().of(employeeItemSchema),
    equipments: yup.array().of(equipmentItemSchema),
    // Armazéns de BLOCO (R2-05/R2-06) — UI-ONLY, nunca vão ao payload.
    products_warehouse_uuid: yup.mixed().nullable(),
    products: yup.array().of(productItemSchema),
    productions_warehouse_uuid: yup.mixed().nullable(),
    productions: yup.array().of(productionItemSchema),
    protections: yup.array().of(protectionItemSchema),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })` — mirror
 * `appropriationSchemaResolver`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo.
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const serviceOrderSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(serviceOrderSchema(languageGB) as any);

export default serviceOrderSchemaResolver;
