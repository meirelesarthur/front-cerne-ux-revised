// src/validations/schemas/Appropriations/appropriation-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Apontamentos (Appropriation) —
// TASK-FE-2705 (fundação) + TASK-FE-2708/2709/2710 (regras por linha das 5
// listas). Fábrica `(languageGB) => resolver`, mirror `plan-role-schema.ts`/
// `invoice-schema.ts`. Client-side só impede submit de linha OBVIAMENTE
// incompleta — a autoridade final de negócio é sempre o 422 do backend
// (`AppropriationRequest::rules()`).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

// -- Item mínimo (decisão do dono, desvio consciente do legado) -------------
// O legado (`AppropriationController@store`/`@update`) salva o Apontamento
// com as 5 listas vazias (ver histórico em `CreateOrUpdateAppropriation.tsx`
// — investigação anterior documentada). O dono decidiu conscientemente
// desviar do legado: o Apontamento só pode ser CRIADO com ao menos 1 item em
// PELO MENOS UMA das 5 coleções (MO/Serviços `labor_items`, Máq/Implementos
// `equipment_items`, Insumos `stock_items`, Ocorrências `occurrences`,
// Produção `production_items`). Mirror da regra real do backend
// (`AppropriationRequest::rules()`) — que exige ≥1 item SÓ no `POST`; o
// `PUT` preserva edição parcial (D7, Apontamento pode ficar sem itens numa
// edição). O client-side aqui é UX antecipada, a autoridade final continua
// sendo o 422 do backend.
//
// TASK-FE-610/AP-09 (execução 034, 2ª leva): a regra deixou de viver no
// schema Yup — com `mode: 'onChange'`, um `.test()' no array era reavaliado
// a CADA `onChange` de QUALQUER campo do formulário inteiro, acendendo o
// banner de erro nas 5 abas antes do usuário tentar Salvar (comportamento
// "persistente" reprovado na re-E2E). A regra agora é um gate explícito
// dentro do `onSubmit` de `CreateOrUpdateAppropriation.tsx`, com estado
// local (`itemsError`) limpo reativamente via `watch` — `hasAtLeastOneAppropriationItem`
// e o tipo de shape são exportados para o componente pai reusar a MESMA
// função, sem duplicar a regra de negócio.
//
// "Item" = LINHA PREENCHIDA de fato, não linha vazia adicionada por engano
// (mesmo critério de filtro usado no submit real, `tryPersistAppropriation`
// em `CreateOrUpdateAppropriation.tsx`) — evita falso-positivo de uma linha
// em branco destravar o Salvar e o backend devolver 422 por array vazio.
export type AppropriationItemsFormShape = {
  stock_items?: Array<{ product_uuid?: unknown; warehouse_uuid?: unknown } | null> | null;
  equipment_items?: Array<{ equipment_uuid?: unknown } | null> | null;
  labor_items?: Array<{ type?: unknown } | null> | null;
  production_items?: Array<{ product_uuid?: unknown } | null> | null;
  occurrences?: Array<{ diagnosis?: string | null } | null> | null;
};

export const hasAtLeastOneAppropriationItem = (parent?: AppropriationItemsFormShape | null) => {
  const stockFilled = (parent?.stock_items ?? []).some(
    (item) => !!item?.product_uuid && !!item?.warehouse_uuid
  );
  const equipmentFilled = (parent?.equipment_items ?? []).some((item) => !!item?.equipment_uuid);
  const laborFilled = (parent?.labor_items ?? []).some((item) => !!item?.type);
  const productionFilled = (parent?.production_items ?? []).some((item) => !!item?.product_uuid);
  const occurrencesFilled = (parent?.occurrences ?? []).some((item) => !!item?.diagnosis?.trim());

  return stockFilled || equipmentFilled || laborFilled || productionFilled || occurrencesFilled;
};

export const appropriationSchema = (languageGB: LanguageDate) => {
  const fv = fieldValidationSchema(languageGB);
  const genericMessages = languageGB.defaltStrings.validations;
  const appropriationMessages = languageGB.appropriations.appropriation.form.errors;

  // Número opcional (>=0) — usado pelos campos numéricos das 5 listas
  // (nenhum deles é obrigatório no backend fora dos casos marcados abaixo).
  const optionalNumberMin0 = () =>
    yup
      .number()
      .transform((value, original) =>
        original === '' || original === null || original === undefined ? null : value
      )
      .nullable()
      .min(0, genericMessages.invalidValue)
      .typeError(genericMessages.invalidValue);

  // Percentual opcional (0-100) — guia de UX para os 13 campos da matriz de
  // qualidade (`TASK-FE-2709`); o range real é decidido pelo 422 do backend.
  const optionalPercent = () =>
    yup
      .number()
      .transform((value, original) =>
        original === '' || original === null || original === undefined ? null : value
      )
      .nullable()
      .min(0, genericMessages.invalidValue)
      .max(100, genericMessages.invalidValue)
      .typeError(genericMessages.invalidValue);

  const stockItemSchema = yup.object({
    product_uuid: fv.option(),
    warehouse_uuid: fv.option(),
    quantity: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .required(genericMessages.requiredField)
      .moreThan(0, genericMessages.invalidValue)
      .typeError(genericMessages.invalidValue),
    measurement_uuid: yup.mixed().nullable(),
  });

  // Foto do horímetro — mirror `occurrenceImageSchema` (existingUrl/file),
  // sem latitude/longitude (não existem neste campo). TASK-FE-603/AP-04
  // (GAP-BE-602/TASK-BE-1002, execução 034). OBRIGATÓRIA por linha (AP-38,
  // TASK-FE-712) — regra é PRESENÇA (existingUrl OU file), não "sempre novo
  // arquivo": preserva a edição de um equipamento que já tem foto salva e o
  // usuário não está trocando.
  const equipmentPhotoSchema = yup
    .object({
      existingUrl: yup.string().nullable(),
      file: yup.mixed().nullable(),
    })
    .test(
      'start-hour-photo-required',
      appropriationMessages.startHourPhotoRequired,
      (value) => Boolean(value?.existingUrl) || Boolean(value?.file)
    );

  const equipmentItemSchema = yup.object({
    equipment_uuid: fv.option(),
    start_hour_meter: optionalNumberMin0(),
    note: yup.string().nullable(),
    measurement_uuid: yup.mixed().nullable(),
    start_hour_photo: equipmentPhotoSchema.required(genericMessages.requiredField),
  });

  const laborItemSchema = yup.object({
    type: fv.option<number>(),
    employee_uuid: yup.mixed().nullable(),
    function_uuid: yup.mixed().nullable(),
    provider_uuid: yup.mixed().nullable(),
    quantity: optionalNumberMin0(),
    type_payment: yup.mixed().nullable(),
    // GAP-BE-643 (execução 034, 4ª leva, AP-25) — mirror EXATO de
    // `stockItemSchema.measurement_uuid`/`productionItemSchema.
    // measurement_uuid`: opcional, sem regra de negócio adicional no client.
    measurement_uuid: yup.mixed().nullable(),
    // GAP-BE-650/TASK-FE-686 (AP-30, execução 034, 5ª leva) — "Qtd Total"
    // agora editável real + "Vl. Unitário", ambos opcionais (mirror EXATO de
    // `productionItemSchema.amount`/`total`, sem `.required()`). "Vl. Total"
    // NUNCA é campo RHF (calculado, mirror `total` de Produção) — sem regra
    // aqui.
    total_quantity: optionalNumberMin0(),
    amount: optionalNumberMin0(),
    total_amount: optionalNumberMin0(),
  });

  const productionItemSchema = yup.object({
    product_uuid: fv.option(),
    // TASK-FE-645 (AP-16, execução 034) — mirror EXATO de
    // `stockItemSchema.measurement_uuid` (Insumos): opcional, sem regra de
    // negócio adicional no client (autoridade final é o 422 do backend).
    measurement_uuid: yup.mixed().nullable(),
    quantity: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .required(genericMessages.requiredField)
      .moreThan(0, genericMessages.invalidValue)
      .typeError(genericMessages.invalidValue),
    note: yup.string().nullable(),
    amount: optionalNumberMin0(),
    total: optionalNumberMin0(),
    ph: optionalPercent(),
    phm: optionalPercent(),
    damaged: optionalPercent(),
    burned: optionalPercent(),
    others: optionalPercent(),
    impurities: optionalPercent(),
    qb_impurities: optionalPercent(),
    moisture: optionalPercent(),
    qb_moisture: optionalPercent(),
    rate: optionalPercent(),
    qb_technique: optionalPercent(),
    cleaning_drying: optionalPercent(),
    broken: optionalPercent(),
  });

  const occurrenceImageSchema = yup.object({
    latitude: yup.number().default(0),
    longitude: yup.number().default(0),
    existingUrl: yup.string().nullable(),
    file: yup.mixed().nullable(),
  });

  const occurrenceItemSchema = yup.object({
    diagnosis: yup.string().nullable().required(genericMessages.requiredField),
    recommendation: yup.string().nullable(),
    priority: yup.mixed().nullable(),
    images: yup.array().of(occurrenceImageSchema).max(3, genericMessages.invalidValue),
  });

  return yup.object({
    date: fv.date(),
    area_uuid: fv.option(),
    activity_uuid: fv.option(),
    area_total: yup.number().nullable(),
    operation_uuid: yup.mixed().nullable(),
    warehouse_production_uuid: yup.mixed().nullable(),
    cultivation_uuid: yup.mixed().nullable(),
    harvest_uuid: yup.mixed().nullable(),
    employee_uuid: yup.mixed().nullable(),
    // Área Utilizada ≤ Área PRODUTIVA do talhão — mirror EXATO da regra do
    // legado (`appropriations/_forms.blade.php`, listener `.used-area` em
    // `change`: `if (value > productiveArea) swal(...)`, IGUALDADE
    // permitida) e do backend (`AppropriationRequest::rules()`, valida
    // `used_area ≤ productive_area`). `area_total` é sibling no MESMO nível
    // do objeto (`context.parent`, 2º parâmetro do `TestFunction` — evita
    // `function` com `this`/`no-invalid-this`) — populado por
    // `CreateOrUpdateAppropriation.tsx` a partir de `AreaListItem.
    // productive_area` da Área selecionada (criação) ou do lookup
    // best-effort (edição); o CAMPO chama-se `area_total`/rótulo "Área
    // Total" por fidelidade visual ao legado, mas o VALOR dentro dele é
    // SEMPRE productive_area — NUNCA total_area. Sem `area_total` resolvido
    // ainda, o teste passa (não bloqueia o usuário por uma race de
    // carregamento que não é dele).
    used_area: optionalNumberMin0().test(
      'used-area-lte-total',
      appropriationMessages.usedAreaExceedsTotal,
      (value, context) => {
        const areaTotal = context.parent?.area_total;
        if (value === null || value === undefined) return true;
        if (areaTotal === null || areaTotal === undefined) return true;
        return value <= areaTotal;
      }
    ),
    description: yup.string().nullable(),
    // TASK-FE-610/AP-09: a regra "≥1 item em pelo menos 1 das 5 coleções"
    // NÃO vive mais aqui (reavaliada a cada onChange do formulário inteiro,
    // acendia o banner antes do Salvar) — agora é um gate explícito dentro
    // do `onSubmit` de `CreateOrUpdateAppropriation.tsx`, usando o mesmo
    // `hasAtLeastOneAppropriationItem` exportado acima. Validação por
    // linha/campo de cada array continua aqui, inalterada.
    stock_items: yup.array().of(stockItemSchema),
    equipment_items: yup.array().of(equipmentItemSchema),
    labor_items: yup.array().of(laborItemSchema),
    production_items: yup.array().of(productionItemSchema),
    occurrences: yup.array().of(occurrenceItemSchema),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })` — mirror `invoiceSchemaResolver`.
 *
 * TASK-FE-610/AP-09: não recebe mais `isEditing` — a regra "≥1 item" saiu do
 * schema Yup (reavaliada a cada onChange do formulário inteiro) e passou a
 * ser um gate explícito no `onSubmit` do componente, que já lê `isEditing`
 * diretamente (D7, CREATE-only, mirror do backend).
 * @param {LanguageDate} languageGB - Pacote de idioma ativo.
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const appropriationSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(appropriationSchema(languageGB) as any);

// -----------------------------------------------------------------------------
// TASK-FE-730 (execução 034/035, refação completa da Finalização,
// GAP-BE-655 `[AVALIADO]`) — resolver PRÓPRIO da tela de Finalização
// (`FinishAppropriation.tsx`, TASK-FE-737). Reaproveita `appropriationSchema`
// por completo (mirror do schema base, NÃO um schema paralelo) e SOBRESCREVE
// só as 2 regras que mudam no modo Finalização:
//   - `equipment_items[].end_hour_meter`: deixa de ser opcional/informativo
//     — passa a `.required()` + `.test()` `≥ start_hour_meter` (mirror EXATO
//     do padrão já usado para `used_area` vs `context.parent.area_total`,
//     acima). Essa regra HOJE mora solta dentro do `FinishAppropriation.tsx`
//     anterior (`rules` inline do `Controller` do RHF, TASK-FE-716) — migra
//     para cá (fonte única de verdade de validação, mesmo padrão do resto do
//     módulo).
//   - `equipment_items[].end_hour_photo`: OPCIONAL (mirror `GAP-BE-653`,
//     `nullable`, diferente de `start_hour_photo`, que é obrigatória) — sem
//     `.test()` de presença.
// Demais campos (Labor/Stock/Production/Occurrences) SEM mudança de regra
// nesta Tarefa — a obrigatoriedade de override (ex. "Qtd Total" de Insumos)
// só se define quando `TASK-FE-738` destravar o contrato do backend; por ora
// seguem `optionalNumberMin0()`/regras já existentes, inalteradas.
// -----------------------------------------------------------------------------
export const finishAppropriationSchema = (languageGB: LanguageDate) => {
  const baseSchema = appropriationSchema(languageGB);
  const genericMessages = languageGB.defaltStrings.validations;
  const appropriationMessages = languageGB.appropriations.appropriation.finishScreen.errors;

  const finishEquipmentItemSchema = (baseSchema.fields.equipment_items as any).innerType.shape({
    end_hour_meter: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .required(appropriationMessages.endHourMeterRequired)
      .test(
        'end-hour-meter-gte-start',
        appropriationMessages.endHourMeterLessThanStart,
        (value, context) => {
          const startHourMeter = context.parent?.start_hour_meter;
          if (value === null || value === undefined) return true;
          if (startHourMeter === null || startHourMeter === undefined) return true;
          return Number(value) >= Number(startHourMeter);
        }
      )
      .typeError(genericMessages.invalidValue),
    // GAP-BE-653/TASK-FE-730 — OPCIONAL (nullable), diferente de
    // `start_hour_photo` (obrigatória, herdada sem mudança do schema base).
    end_hour_photo: yup
      .object({
        existingUrl: yup.string().nullable(),
        file: yup.mixed().nullable(),
      })
      .nullable(),
  });

  return baseSchema.shape({
    equipment_items: yup.array().of(finishEquipmentItemSchema),
  });
};

/**
 * Resolver da tela de Finalização (`FinishAppropriation.tsx`, TASK-FE-737) —
 * mirror `appropriationSchemaResolver`, MESMO schema base + as 2 sobrescritas
 * de `finishAppropriationSchema` acima.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo.
 * @return {Function} Resolver ligado ao schema de Finalização.
 */
export const finishAppropriationSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(finishAppropriationSchema(languageGB) as any);

export default appropriationSchemaResolver;
