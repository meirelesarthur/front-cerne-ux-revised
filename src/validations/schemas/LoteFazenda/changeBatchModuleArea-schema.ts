// src/validations/schemas/LoteFazenda/changeBatchModuleArea-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do modal "Transferência Módulo/Área"
// (`DLG-AREA`/`FRM-AREA`, 97-Esteiras/041, TASK-FE-041-LF-03), espelhando
// `ChangeBatchModuleAreaRequest::rules()` (lido no código real,
// `GB.Cerne.Api`, `POST /transfer-batch-farms/module-area`): `code`/`date`
// (required), `batch_uuid` (required), `employee_uuid` (opcional),
// `area_uuid` XOR `grazing_uuid` (`required_without` mútuo, replicado aqui
// com `.test()` cruzado — a validação final continua sendo o 422 do
// backend).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

/**
 * Schema do modal "Transferência Módulo/Área".
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {yup.ObjectSchema<any>} Schema Yup do modal.
 */
export const changeBatchModuleAreaSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.loteFazenda.changeBatchModuleArea.validation;

  return yup.object({
    code: yup.string().trim().required(messages.codeRequired),
    date: yup.string().trim().nullable().required(messages.dateRequired),
    batch_uuid: optionSchema.required(messages.batchRequired),
    employee_uuid: optionSchema,
    area_uuid: optionSchema.test(
      'area-or-grazing',
      messages.areaOrGrazingRequired,
      (value: { value?: string } | null | undefined, ctx: yup.TestContext) => {
        const grazingUuid = ctx.parent.grazing_uuid?.value;
        return !!value?.value || !!grazingUuid;
      }
    ),
    grazing_uuid: optionSchema.test(
      'grazing-or-area',
      messages.areaOrGrazingRequired,
      (value: { value?: string } | null | undefined, ctx: yup.TestContext) => {
        const areaUuid = ctx.parent.area_uuid?.value;
        return !!value?.value || !!areaUuid;
      }
    ),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do modal "Módulo/Área".
 */
export const changeBatchModuleAreaSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(changeBatchModuleAreaSchema(languageGB)) as any;
