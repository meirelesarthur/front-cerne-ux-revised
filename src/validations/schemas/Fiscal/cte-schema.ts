// src/validations/schemas/Fiscal/cte-schema.ts
// -----------------------------------------------------------------------------
// Schema Yup do formulário de CT-e (Cte — domínio Fiscal, execução 045, Onda
// 1, TASK-CTE-FE-01), espelhando `CteRequest::rules()` (GB.Cerne.Api) —
// validação client-side é UX antecipada, o 422 real do backend é a
// autoridade final de negócio (get_pwa_validation_and_utils_pattern §1).
//
// `medidas`/`componentes` usam `.min(1, ...)` (Contrato §2.3) — mirror
// `HarvestProduct/harvestProduct-schema.ts::boxes`. `chavesNfe` NÃO tem
// `.min(1)` (F10 é opcional) mas valida 44 dígitos + distinct por item.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';
import type {
  CteChaveNfeFieldValue,
  CteComponenteFieldValue,
  CteForm,
  CteMedidaFieldValue,
} from '@/@types/v2/Fiscal/cte';
import type Shape from '@/@types/validations/shape';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const cteSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.ctes.cte.validation;

  const chaveNfeSchema = yup.object().shape<Shape<CteChaveNfeFieldValue>>({
    value: yup.string().required(messages.chaveNfeLength).length(44, messages.chaveNfeLength),
  });

  const medidaSchema = yup.object().shape<Shape<CteMedidaFieldValue>>({
    uuid: yup.string().nullable(),
    codUnidade: optionSchema.required(languageGB.defaltStrings.validations.requiredField),
    tipoMedida: optionSchema.required(languageGB.defaltStrings.validations.requiredField),
    quantidadeCarga: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? undefined : value))
      .typeError(languageGB.defaltStrings.validations.invalidValue)
      .required(languageGB.defaltStrings.validations.requiredField),
  });

  const componenteSchema = yup.object().shape<Shape<CteComponenteFieldValue>>({
    uuid: yup.string().nullable(),
    nome: yup
      .string()
      .trim()
      .required(languageGB.defaltStrings.validations.requiredField)
      .max(15, messages.componenteNomeMax),
    valor: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? undefined : value))
      .typeError(languageGB.defaltStrings.validations.invalidValue)
      .required(languageGB.defaltStrings.validations.requiredField),
  });

  // UT-000776 (M5) — percentuais IBS/CBS opcionais, 0..100 (mirror `between:0,100`
  // do `CteRequest`; o 422 da API segue autoridade).
  const optionalPercent = () =>
    yup
      .number()
      .transform((value, original) => (original === '' || original === null ? undefined : value))
      .nullable()
      .typeError(languageGB.defaltStrings.validations.invalidValue)
      .min(0, messages.percentRange)
      .max(100, messages.percentRange);

  return yup.object().shape<Shape<CteForm>>({
    natureza: optionSchema.required(messages.naturezaRequired),
    globalizado: optionSchema.required(messages.globalizadoRequired),
    cst: optionSchema.required(messages.cstRequired),
    percIcms: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? undefined : value))
      .typeError(languageGB.defaltStrings.validations.invalidValue)
      .min(0)
      .max(99.99)
      .required(messages.percIcmsRequired),
    cClassTrib: yup
      .string()
      .trim()
      .matches(/^(\d{6})?$/, messages.cClassTribInvalid)
      .nullable(),
    cstIbsCbs: optionSchema.nullable(),
    percIbsUf: optionalPercent(),
    percIbsMun: optionalPercent(),
    percCbs: optionalPercent(),
    percReducaoAliqIbsUf: optionalPercent(),
    percReducaoAliqIbsMun: optionalPercent(),
    percReducaoAliqCbs: optionalPercent(),
    percDifIbsUf: optionalPercent(),
    percDifIbsMun: optionalPercent(),
    percDifCbs: optionalPercent(),
    remetente: optionSchema.required(messages.remetenteRequired),
    destinatario: optionSchema.required(messages.destinatarioRequired),

    // F10/F42 — opcional (sem `.min(1)`), 44 dígitos por item. `distinct`
    // (IG02) é reforçado no `onAdd` do `ChavesNfeFieldArray` (mensagem
    // dedicada), não repetido aqui como regra de array Yup.
    chavesNfe: yup.array().of(chaveNfeSchema),

    // T-776-API-04c — espelha `Rule::requiredIf(empty(chaves_nfe))` da API: sem
    // chave de NF-e, o tipo do documento é obrigatório.
    tpDoc: optionSchema.nullable().when('chavesNfe', {
      is: (chaves: CteChaveNfeFieldValue[] | undefined) => !chaves || chaves.length === 0,
      then: (schema: yup.AnySchema) => schema.required(messages.tpDocRequired),
    }),
    descOutros: yup.string().max(100).nullable(),
    nDoc: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? undefined : value))
      .nullable()
      .typeError(languageGB.defaltStrings.validations.invalidValue),
    vDocFisc: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? undefined : value))
      .nullable()
      .min(0)
      .typeError(languageGB.defaltStrings.validations.invalidValue),

    equipment: optionSchema.required(messages.equipmentRequired),
    produtoPredominante: yup
      .string()
      .trim()
      .required(messages.produtoPredominanteRequired)
      .max(30, messages.produtoPredominanteMax),
    tomador: optionSchema.required(messages.tomadorRequired),
    valorCarga: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? undefined : value))
      .typeError(languageGB.defaltStrings.validations.invalidValue)
      .min(0)
      .required(messages.valorCargaRequired),
    modal: optionSchema.required(messages.modalRequired),

    // Contrato §2.3 — guarda "ao menos 1 item" via `.min(1)`, mirror
    // `HarvestProduct::boxes`.
    medidas: yup.array().of(medidaSchema).min(1, messages.medidasMinOne),
    componentes: yup.array().of(componenteSchema).min(1, messages.componentesMinOne),

    // Seletor client-side (F25) — opcional, sem persistência própria
    // (Contrato §2.5).
    enderecoTomador: optionSchema.nullable(),
    ruaTomador: yup.string().trim().required(messages.ruaTomadorRequired).max(80),
    numeroTomador: yup.string().trim().required(messages.numeroTomadorRequired).max(20),
    bairroTomador: yup.string().trim().required(messages.bairroTomadorRequired).max(40),
    cepTomador: yup.string().trim().required(messages.cepTomadorRequired).max(10),
    cidadeTomador: optionSchema.required(messages.cidadeTomadorRequired),

    dataPrevistaEntrega: yup.string().required(messages.dataPrevistaEntregaRequired),

    // F32/F33 — recalculados por §2.4, mas continuam campos numéricos
    // obrigatórios do payload (editáveis manualmente, nota do form).
    valorTransporte: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? undefined : value))
      .typeError(languageGB.defaltStrings.validations.invalidValue)
      .min(0)
      .required(languageGB.defaltStrings.validations.requiredField),
    valorReceber: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? undefined : value))
      .typeError(languageGB.defaltStrings.validations.invalidValue)
      .min(0)
      .required(languageGB.defaltStrings.validations.requiredField),

    municipioEnvio: optionSchema.required(messages.municipioEnvioRequired),
    municipioInicio: optionSchema.required(messages.municipioInicioRequired),
    municipioFim: optionSchema.required(messages.municipioFimRequired),

    retira: optionSchema.nullable(),
    detalhesRetira: yup.string().max(100).nullable(),
    observacao: yup.string().max(191).nullable(),
  });
};

export const cteSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(cteSchema(languageGB)) as any;

export default cteSchemaResolver;
