// src/validations/schemas/Operacional/AnimalFazenda/transferAnimalFarm-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de CRIAÇÃO de Transferência de Animal
// entre Fazendas (TransferAnimalFarm — Operacional > Pecuária >
// Transferências, 97-Esteiras/042, TASK-FE-042-101), mirror ESTRUTURAL de
// `transferBatchFarm-schema.ts` (Lote/Fazenda, 97-Esteiras/041), espelhando
// `TransferAnimalFarmRequest::rules()`: `date` (required), `farm_to_uuid`
// (required), `animal_uuids` (required, min 1 — DIFERENÇA ESTRUTURAL da
// irmã: array de STRING, não um único `batch_uuid`). SEM campo "Categoria"
// persistido — o legado nunca preenche `category_id` no `store()` (Item A,
// 063-est03-9-reprovacoes).
//
// `generate_financial`/`financial`: bloco financeiro OPCIONAL e ATÔMICO no
// MESMO `POST`, reusando o schema financeiro dedicado
// (`transferAnimalFarmFinancialSchema`, mirror irmã TASK-BE-041-LF-06 já
// replicado pela API desta feature em TASK-BE-042-101).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

import { transferAnimalFarmFinancialSchema } from './transferAnimalFarmFinancial-schema';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

/**
 * Schema de criação de Transferência de Animal entre Fazendas — cabeçalho +
 * seleção de animais + bloco financeiro OPCIONAL condicionado a
 * `has_financial`. Quando `has_financial.value === true`, `financial` reusa
 * (import, NÃO cópia) o MESMO schema da tela financeira dedicada
 * (`transferAnimalFarmFinancialSchema`), fonte única de verdade das regras
 * de parcelas/rateio.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {yup.ObjectSchema<any>} Schema Yup de criação.
 */
export const transferAnimalFarmSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.animalFazenda.transferAnimalFarm.form.validation;

  return yup.object({
    date: yup.string().trim().nullable().required(messages.dateRequired),
    farm_to_uuid: optionSchema.required(messages.farmToRequired),

    // Filtro (não persistido) do seletor de animais — sem regra de
    // obrigatoriedade própria, quem fecha o form é `animal_uuids` abaixo.
    batch_uuid: optionSchema,
    category_filter_uuids: yup.array().of(optionSchema).default([]),

    // FLD-012 — array de STRING (uuids), NUNCA `Option[]` (diferença
    // estrutural do `batch_uuid` único da irmã).
    animal_uuids: yup
      .array()
      .of(yup.string().required())
      .min(1, messages.animalsRequired)
      .required(messages.animalsRequired),

    has_financial: optionSchema,

    financial: yup.object().when('has_financial', {
      is: (option: { value?: boolean } | null) => option?.value === true,
      then: () => transferAnimalFarmFinancialSchema(languageGB),
      otherwise: (schema) => schema.notRequired(),
    }),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema de criação do módulo.
 */
export const transferAnimalFarmSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(transferAnimalFarmSchema(languageGB)) as any;
