// src/validations/schemas/Movement/movement-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário completo "Mov. Caixa/Bancário"
// (Movement — Financeiro, TASK-MV-FE-01), espelhando `MovementRequest::rules()`
// (Movement-contrato.md §4/§8 Decisão #1 — validação server-side real de tudo
// que era só HTML no legado). Vive em `src/validations/schemas/Movement/`
// (pasta pelo NOME DA ENTIDADE, NUNCA em `src/pages/` — instrução explícita
// do task-packet, divergindo do sibling `OpenMovement` que usou a pasta do
// módulo de página `CadastrosBase/`, ver Movement-contrato-tela.md §3, nota
// de divergência).
//
// Mirror estrutural de `open-movement-schema.ts`: FUNÇÃO que recebe
// `languageGB` e devolve o schema. Mensagens sempre derivadas de
// `languageGB.movements.movement.form.validation`.
//
// Convenção de valor RHF por tipo de campo (mirror `open-movement-schema.ts`):
//   - `type`/`type_category`/`account_uuid`/`destination_account_uuid`/
//     `farm_uuid`/`proprietary_uuid`/`client_uuid`/`provider_uuid` — Select,
//     RHF guarda o `Option{label,value}` INTEIRO; extração do valor cru para
//     o payload acontece só na tela do formulário.
//   - `allocations[].category_uuid`/`.center_uuid`/`.plan_account_uuid`/
//     `.harvest_uuid` — idem, Option inteiro.
//
// `destination_account_uuid` — condicional a `type_category === 'T'`
// (Movement-contrato-tela.md §2.1, mirror `required_if:type_category,T` do
// backend) via `.when('type_category', ...)`.
//
// `allocations` — obrigatório, `min(1)` (Movement-contrato.md §2, campo #18),
// cada linha com `category_uuid`/`center_uuid` obrigatórios (Option) e
// `plan_account_uuid`/`harvest_uuid` opcionais, `value` numérico `min(0.01)`.
//
// REVERSÃO DE DECISÃO (TASK-MV-FE-08, Ajuste 2, 2026-08-10) — pedido do dono
// em homologação (bug reproduzido: salvou Movimento de R$ 1.500,00 com
// rateio somando R$ 1.200,00). A decisão original acima ("SEM `.test()` de
// soma bloqueando o submit") deixou de valer: agora HÁ `.test()` cross-field
// (`sum-matches-header`, via `context.parent.value` — arrow function, não
// `function`/`this`, mesma técnica de `parameterWeights-schema.ts`/
// `request-purchase-schema.ts` para evitar `no-invalid-this` do eslint do
// projeto) bloqueando o submit quando a soma de `allocations[].value`
// diverge do `value` do cabeçalho (tolerância de 1 centavo,
// `allocationsSumMatchesHeader`, `src/utils/movementAllocationSum.ts`). O
// badge/Alert cosmético (`MovementAllocationEditor.tsx`) permanece — só
// passou a ter um bloqueio real por trás.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { allocationsSumMatchesHeader } from '@/utils/movementAllocationSum';

import type { LanguageDate } from '@/@types/language';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const movementSchema = (languageGB: LanguageDate) => {
  const v = languageGB.movements.movement.form.validation;

  return yup.object({
    date: yup.string().trim().required(v.dateRequired),
    type: optionSchema.test('required', v.typeRequired, (value) => !!value),
    type_category: optionSchema.test('required', v.typeCategoryRequired, (value) => !!value),
    account_uuid: optionSchema.test('required', v.accountRequired, (value) => !!value),
    // Obrigatório SÓ quando `type_category === 'T'` (transferência) — mirror
    // `required_if:type_category,T` do backend.
    destination_account_uuid: optionSchema.when('type_category', {
      is: (typeCategory: { value?: string } | null) => typeCategory?.value === 'T',
      then: (schema) => schema.test('required', v.destinationAccountRequired, (value) => !!value),
      otherwise: (schema) => schema.nullable(),
    }),
    farm_uuid: optionSchema,
    proprietary_uuid: optionSchema.test('required', v.proprietaryRequired, (value) => !!value),
    client_uuid: optionSchema,
    provider_uuid: optionSchema,
    // Rejeita zero (feedback client-side imediato; o backend também valida
    // magnitude `> 0`, Movement-contrato.md §4).
    value: yup
      .number()
      .typeError(v.valueRequired)
      .required(v.valueRequired)
      .test('not-zero', v.valueNotZero, (val) => val !== 0),
    // Opcional — omitido do payload quando vazio (backend default 0).
    interest: yup
      .number()
      .transform((val, original) => (original === '' || original === null ? undefined : val))
      .notRequired(),
    document: yup.string().trim().nullable().max(100, v.documentMaxLength),
    note: yup.string().trim().nullable().max(600, v.noteMaxLength),
    fiscal_document: yup.boolean().default(false),
    // Derivado de `type_category === 'F'` (UT-000796, D-102-05) — a UI envia o
    // valor derivado e a API valida (422) a divergência / deriva no servidor.
    generates_obligation: yup.boolean().default(false),
    allocations: yup
      .array()
      .of(
        yup.object({
          category_uuid: optionSchema.test(
            'required',
            v.allocationCategoryRequired,
            (value) => !!value
          ),
          center_uuid: optionSchema.test(
            'required',
            v.allocationCenterRequired,
            (value) => !!value
          ),
          plan_account_uuid: optionSchema,
          harvest_uuid: optionSchema,
          value: yup
            .number()
            .typeError(v.allocationValueRequired)
            .required(v.allocationValueRequired)
            .min(0.01, v.allocationValueMin),
        })
      )
      // TASK-MV-FE-08 (Ajuste 2) — cross-field: `context.parent` é o objeto
      // irmão do MESMO `yup.object()` (`value` é campo de topo do form
      // completo). Arrow function (não `function`/`this`) — mesma técnica
      // de `parameterWeights-schema.ts`/`request-purchase-schema.ts` para
      // evitar `no-invalid-this` do eslint do projeto. Roda ANTES do
      // `.min(1)` — array vazio já falha ali; com ≥1 linha, a soma precisa
      // bater com o cabeçalho (tolerância de 1 centavo,
      // `allocationsSumMatchesHeader`).
      .test('sum-matches-header', v.allocationsSumMismatch, (items, context) =>
        allocationsSumMatchesHeader(items, context.parent?.value)
      )
      .min(1, v.allocationsMinLength)
      .required(v.allocationsMinLength),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const movementSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(movementSchema(languageGB)) as any;

export default movementSchemaResolver;
