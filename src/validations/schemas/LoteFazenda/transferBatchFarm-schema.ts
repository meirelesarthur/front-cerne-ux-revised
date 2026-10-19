// src/validations/schemas/LoteFazenda/transferBatchFarm-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de CRIAÇÃO de Transferência de Lote
// entre Fazendas (TransferBatchFarm — Operacional > Pecuária >
// Transferências, 97-Esteiras/041, TASK-FE-041-LF-01), espelhando
// `TransferBatchFarmRequest::rules()` (lido no código real, `GB.Cerne.Api`):
// `date` (required), `employee_uuid` (opcional), `batch_uuid` (required),
// `farm_to_uuid` (required), `category_uuid` (opcional).
//
// DECISÃO DE FIDELIDADE (atualizada, TASK-FE-041-LF-06): até esta Tarefa, o
// Form Request de `POST /transfer-batch-farms` NÃO aceitava bloco financeiro
// embutido — só resultado (`has_financial` no Resource) de já existir
// registro em `.../financial`, gerado À PARTE via `SCR-FIN`. A contrapartida
// backend (`TASK-BE-041-LF-06`, commit `2d8bc411`, §6.4 do plano) mudou isso:
// `TransferBatchFarmRequest::rules()` agora aceita `generate_financial`
// (bool, opcional) que, quando `true`, EXIGE o bloco `financial.*` — MESMO
// bloco de regras do `POST .../financial` standalone, reusado no backend via
// trait `HasTransferBatchFarmFinancialRules`. O toggle abaixo tem
// contrapartida real no payload — não é mais o mock client-side que esta
// nota alertava antes (DIV-08 do doc-bruta segue evitado: 1 única
// requisição, atômica, não 2). `SCR-FIN` standalone continua existindo e
// intocado para gerar financeiro DEPOIS do create.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

import { transferBatchFarmFinancialSchema } from './transferBatchFarmFinancial-schema';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

/**
 * Schema de criação de Transferência de Lote entre Fazendas — cabeçalho +
 * bloco financeiro OPCIONAL condicionado a `has_financial` (TASK-FE-041-LF-06).
 * Quando `has_financial.value === true`, `financial` reusa (import, NÃO
 * cópia) o MESMO schema da tela `SCR-FIN` standalone
 * (`transferBatchFarmFinancialSchema`), fonte única de verdade das regras
 * de parcelas/rateio.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {yup.ObjectSchema<any>} Schema Yup de criação.
 */
export const transferBatchFarmSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.loteFazenda.transferBatchFarm.form.validation;

  return yup.object({
    date: yup.string().trim().nullable().required(messages.dateRequired),
    category_uuid: optionSchema,
    batch_uuid: optionSchema.required(messages.batchRequired),
    farm_to_uuid: optionSchema.required(messages.farmToRequired),

    has_financial: optionSchema,

    financial: yup.object().when('has_financial', {
      is: (option: { value?: boolean } | null) => option?.value === true,
      then: () => transferBatchFarmFinancialSchema(languageGB),
      otherwise: (schema) => schema.notRequired(),
    }),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema de criação do módulo.
 */
export const transferBatchFarmSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(transferBatchFarmSchema(languageGB)) as any;
