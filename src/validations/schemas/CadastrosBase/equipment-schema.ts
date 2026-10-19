// src/validations/schemas/CadastrosBase/equipment-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Inventário (Equipment) — TASK-FE-1003
// (execução 026). Localização: `src/validations/schemas/CadastrosBase/`, NUNCA
// `src/validations/schemas/Equipments/` — mirror do precedente mais recente do
// fork (`product-schema.ts`/`provider-schema.ts`/`package-schema.ts`), mesmo
// racional já registrado em Equipment-Frontend-Contrato.md §4 (nota sobre a
// pasta) e em TASK-FE-500 (linha 82-87, `Product`).
//
// Compõe `fieldValidationSchema(languageGB)` para o genérico e mensagens 100%
// via `languageGB.equipments.equipment.form.validation.*` (zero string
// literal) — mirror mecânico de `centro-custo-schema.ts`/
// `family-equipment-schema.ts` (mesma "empresa": função que recebe
// `languageGB` e devolve o schema).
//
// ⚠️ HARDENING DELIBERADO (decisão já tomada pelo contrato de tela §6, NÃO é
// dúvida do Executor — mirror do precedente `DepreciationForecast`/`code`/
// `rntrc` já aplicado em outros módulos deste fork):
//   - `description` max **60** (coluna real via pgloader), não os 40 do blade
//     legado (Doc Bruta).
//   - `code` SEM validação de tamanho no client — é `readonly` (RN-1, gerado
//     pelo servidor), nunca entra no payload de escrita, portanto nem no
//     `.shape()` abaixo.
//   - `rntrc` max **12** (coluna real), não os 14 do blade legado.
//   - `year_mod`/`depreciation_type` **obrigatórios** — fecham o mismatch
//     legado onde só o blade (client) exigia e o `rules()` do Controller não.
//
// `depreciation_type` reaproveita o MESMO enum de `FamilyEquipment`
// (`FamilyEquipmentDepreciationType`, D-EQ4 do contrato de API — zero Enum
// duplicado) — valor RAW `0|1` no RHF (Select booleano-por-número), mesma
// convenção confirmada em `family-equipment-schema.ts` (`type_depreciation`).
// `has_depreciation`/`use_fiscal` são booleanos RAW (`true`/`false`) no RHF —
// mesma convenção confirmada em `CreateOrUpdateFamiliaBens.tsx` (`is_enabled`,
// Select Sim/Não ligado por `Controller`, nunca `Option<boolean>`).
//
// -- `.when()` cruzados (Riscos + solução da Tarefa) --------------------------
// `has_depreciation` → (`dt_acquisition`, `life_bens`) obrigatórios.
// `depreciation_type === COM_RESIDUAL (1)` → `residual` obrigatório.
// `use_fiscal === true` → UT-000688: obrigatórios `plate` e `type`, `body_type`,
//   `wheel_type`, `tara`, `capacity`, `owner_type`, `owner_document`,
//   `owner_name`, `owner_ie`, `owner_uf`, `owner_tp` (espelha `EquipmentRequest`
//   da API); `uf` e `rntrc` seguem opcionais.
//
// `isReadOnly` de campos travados por `depreciations_count > 0` (RN-3) NÃO é
// regra deste schema (é UI, `CreateOrUpdateEquipamento.tsx`/abas,
// `TASK-FE-1005..1006`) — não confundir os dois mecanismos (Riscos da
// Tarefa).
//
// -- Rateio (RN-8, `.test()` de ARRAY) ---------------------------------------
// Mirror estrutural de `centro-custo-schema.ts` (`apportionments`,
// `cost_center_uuid` + `percentage` por linha), MAS com enforcement REAL da
// soma 100% (divergência deliberada do precedente mais brando de `CostCenter`,
// que só valida `.min(1)` quando `type === 'apportioned'`, sem checar soma —
// Equipment-Frontend-Contrato.md §7 exige bloquear o submit quando a soma ≠
// 100%, mirror do `swal`/tolerância 0,01 do legado). Array vazio é permitido
// (rateio é opcional) — o `.test()` só entra em ação quando há ao menos 1
// linha com `cost_center_uuid` preenchido.
//
// -- Anexos (RN-9) ------------------------------------------------------------
// `attachments[].name` com `max(100)` (mensagem `attachmentNameMaxLength`) —
// sem `.required()` (Doc Bruta: default `'Não Informado'` se vazio, aplicado
// no componente/submit, não no schema). `file`/`uuid` fora do Yup (`file` é
// `File`/`undefined`, `uuid` só string de controle) — mesmo racional de
// `image`/`removeImage` ficarem fora do schema em `family-equipment-schema.ts`.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { isValidPlate } from '@/utils/masks/plate';

import { FamilyEquipmentDepreciationType } from '@/constants/FamilyEquipmentDepreciationType';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

/** Tolerância de soma do rateio (RN-8) — mirror da tolerância `0,01` do
 *  `swal` legado (comparação de ponto flutuante nunca é exata). */
const COST_CENTER_SUM_TOLERANCE = 0.01;
const COST_CENTER_SUM_TARGET = 100;

/** Shape mínimo de linha do rateio usado só pelo `.test()` de soma (RN-8) —
 *  não é o tipo de payload completo (`EquipmentPayload.cost_centers`,
 *  `@/@types/v2/Equipments`), só o suficiente para o cálculo. */
type CostCenterRowShape = { cost_center_uuid?: string | null; percentage?: number };

export const equipmentSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.equipments.equipment.form.validation;

  const costCenterRowSchema = yup.object({
    cost_center_uuid: yup.string().nullable(),
    percentage: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? undefined : value))
      .typeError(messages.costCenterPercentageRequired)
      .required(messages.costCenterPercentageRequired),
  });

  const attachmentRowSchema = yup.object({
    uuid: yup.string().nullable(),
    name: yup.string().trim().nullable().max(100, messages.attachmentNameMaxLength),
    file: yup.mixed().nullable(),
  });

  return yup.object({
    // -- Aba "Identificação" --
    family_equipment_uuid: v.option<string>().required(messages.familyRequired),
    description: yup
      .string()
      .trim()
      .required(messages.descriptionRequired)
      // HARDENING: coluna real via pgloader é 60, não os 40 do blade legado
      // (Doc Bruta) — decisão já tomada pelo contrato de tela §6, não é
      // dúvida do Executor.
      .max(60, messages.descriptionMaxLength),
    specification: yup.string().trim().nullable().max(200, messages.specificationMaxLength),
    model: yup.string().trim().nullable().max(30, messages.modelMaxLength),
    patrimony: yup.string().trim().nullable().max(40, messages.patrimonyMaxLength),
    product_uuid: yup.mixed().nullable(),
    status: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? undefined : value))
      .typeError(messages.statusRequired)
      .required(messages.statusRequired),
    equipment_type: yup.string().nullable(),
    features: yup.array().of(yup.string()).default([]),

    // -- Aba "Financeiro/Depreciação" --
    vl_time_productive: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? undefined : value))
      .typeError(messages.vlTimeProductiveRequired)
      .required(messages.vlTimeProductiveRequired),
    provider_uuid: yup.mixed().nullable(),
    dt_acquisition: yup
      .mixed()
      .nullable()
      .when('has_depreciation', {
        is: true,
        then: (schema) => schema.required(messages.dtAcquisitionRequiredWithDepreciation),
      }),
    vl_acquisition: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? undefined : value))
      .typeError(messages.vlAcquisitionRequired)
      .required(messages.vlAcquisitionRequired),
    hour_meter: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable(),
    // HARDENING: obrigatório (fecha mismatch legado — blade exigia, rules()
    // não) — decisão já tomada pelo contrato de tela §6.
    year_mod: yup.string().trim().required(messages.yearModRequired),
    has_depreciation: yup.boolean().required(messages.hasDepreciationRequired),
    life_bens: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      .when('has_depreciation', {
        is: true,
        then: (schema) => schema.required(messages.lifeBensRequiredWithDepreciation),
      }),
    // HARDENING: obrigatório (fecha mismatch legado) — reaproveita o MESMO
    // enum de FamilyEquipment (D-EQ4), zero Enum duplicado.
    depreciation_type: yup
      .number()
      .oneOf(
        [
          FamilyEquipmentDepreciationType.SEM_RESIDUAL,
          FamilyEquipmentDepreciationType.COM_RESIDUAL,
        ],
        messages.depreciationTypeRequired
      )
      .required(messages.depreciationTypeRequired),
    residual: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      .when('depreciation_type', {
        is: FamilyEquipmentDepreciationType.COM_RESIDUAL,
        then: (schema) => schema.required(messages.residualRequiredWithResidualType),
      }),
    // RN-2 — calculados CLIENT-SIDE (`watch`/`useEffect` no componente), o
    // schema só tipa (sem `.required()`: são preenchidos programaticamente,
    // nunca digitados pelo usuário).
    vl_residual: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? 0 : value))
      .default(0),
    vl_depreciate: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? 0 : value))
      .default(0),
    depreciation: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable(),

    // -- Aba "Fiscal/Veículo" (gate `use_fiscal`) --
    use_fiscal: yup.boolean().default(true),
    chassi: yup.string().trim().nullable().max(17, messages.chassiMaxLength),
    renavam: yup.string().trim().nullable().max(11, messages.renavamMaxLength),
    serie: yup.string().trim().nullable().max(40, messages.serieMaxLength),
    plate: yup
      .string()
      .trim()
      .nullable()
      .max(10, messages.plateMaxLength)
      // UT-000787 (D4): formato estrito só com "Usa Dados Fiscais"; sem fiscal
      // a placa segue livre (até 10) para não bloquear cadastros antigos.
      .when('use_fiscal', {
        is: true,
        then: (schema) =>
          schema
            .required(messages.plateRequiredWithFiscal)
            .test(
              'plate-format',
              languageGB.defaltStrings.validations.plateInvalid,
              (value) => !value || isValidPlate(value)
            ),
      }),
    color: yup.string().trim().nullable().max(10, messages.colorMaxLength),
    uf: yup.mixed().nullable(),
    // Fora do gate `use_fiscal` — sempre visível, fiel ao legado (contrato §6).
    brand: yup.string().trim().nullable(),
    rntrc: yup.string().trim().nullable().max(12, messages.rntrcMaxLength),
    type: yup
      .mixed()
      .nullable()
      .when('use_fiscal', {
        is: true,
        then: (schema) => schema.required(messages.typeRequiredWithFiscal),
      }),
    body_type: yup
      .mixed()
      .nullable()
      .when('use_fiscal', {
        is: true,
        then: (schema) => schema.required(messages.bodyTypeRequiredWithFiscal),
      }),
    wheel_type: yup
      .mixed()
      .nullable()
      .when('use_fiscal', {
        is: true,
        then: (schema) => schema.required(messages.wheelTypeRequiredWithFiscal),
      }),
    tara: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      .when('use_fiscal', {
        is: true,
        then: (schema) => schema.required(messages.taraRequiredWithFiscal),
      }),
    capacity: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      .when('use_fiscal', {
        is: true,
        then: (schema) => schema.required(messages.capacityRequiredWithFiscal),
      }),
    owner_type: yup
      .mixed()
      .nullable()
      .when('use_fiscal', {
        is: true,
        then: (schema) => schema.required(messages.ownerTypeRequiredWithFiscal),
      }),
    owner_document: yup
      .string()
      .trim()
      .nullable()
      .when('use_fiscal', {
        is: true,
        then: (schema) => schema.required(messages.ownerDocumentRequiredWithFiscal),
      }),
    owner_name: yup
      .string()
      .trim()
      .nullable()
      .max(100, messages.ownerNameMaxLength)
      .when('use_fiscal', {
        is: true,
        then: (schema) => schema.required(messages.ownerNameRequiredWithFiscal),
      }),
    owner_ie: yup
      .string()
      .trim()
      .nullable()
      .max(12, messages.ownerIeMaxLength)
      .when('use_fiscal', {
        is: true,
        then: (schema) => schema.required(messages.ownerIeRequiredWithFiscal),
      }),
    owner_uf: yup
      .mixed()
      .nullable()
      .when('use_fiscal', {
        is: true,
        then: (schema) => schema.required(messages.ownerUfRequiredWithFiscal),
      }),
    owner_tp: yup
      .mixed()
      .nullable()
      .when('use_fiscal', {
        is: true,
        then: (schema) => schema.required(messages.ownerTpRequiredWithFiscal),
      }),

    // -- Aba "Rateio — Centro de Custo" (RN-8) --
    // Array vazio permitido (rateio é opcional); soma 100% ENFORÇADA de
    // verdade quando há ao menos 1 linha com `cost_center_uuid` preenchido —
    // divergência deliberada do precedente mais brando de `CostCenter`
    // (badge só visual, sem bloquear submit).
    cost_centers: yup
      .array()
      .of(costCenterRowSchema)
      .default([])
      .test(
        'cost-center-sum-100',
        messages.costCenterPercentageSum100,
        (rows: CostCenterRowShape[] | undefined) => {
          const filled = (rows ?? []).filter((row) => !!row?.cost_center_uuid);
          if (filled.length === 0) return true;

          const sum = filled.reduce((total, row) => total + (Number(row?.percentage) || 0), 0);
          return Math.abs(sum - COST_CENTER_SUM_TARGET) <= COST_CENTER_SUM_TOLERANCE;
        }
      ),

    // -- Aba "Anexos" (RN-9) --
    attachments: yup.array().of(attachmentRowSchema).default([]),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const equipmentSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(equipmentSchema(languageGB));

export default equipmentSchemaResolver;
