// src/validations/schemas/Movement/movement-allocation-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário DEDICADO de edit-rateio
// (`PATCH /movements/{uuid}/allocation`, Movement — Financeiro,
// TASK-MV-FE-01). Só `allocations[]` — SEM campos de cabeçalho (mirror
// Movement-contrato.md §2.2/Movement-contrato-tela.md §4, "Reuso": o
// edit-rateio NÃO tem `value` de cabeçalho editável). Vive em
// `src/validations/schemas/Movement/` (pasta pelo nome da entidade, NUNCA em
// `src/pages/`).
//
// Mesma regra de linha do schema do form completo
// (`movement-schema.ts` — `category_uuid`/`center_uuid` obrigatórios via
// Option, `plan_account_uuid`/`harvest_uuid` opcionais, `value` numérico
// `min(0.01)`), extraída para reuso isolado pela tela `EditRateioMovimento`.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const movementAllocationSchema = (languageGB: LanguageDate) => {
  const v = languageGB.movements.movement.form.validation;

  return yup.object({
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
      .min(1, v.allocationsMinLength)
      .required(v.allocationsMinLength),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const movementAllocationSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(movementAllocationSchema(languageGB)) as any;

export default movementAllocationSchemaResolver;
