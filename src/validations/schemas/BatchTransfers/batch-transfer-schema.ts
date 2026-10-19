// src/validations/schemas/BatchTransfers/batch-transfer-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário "Nova Transferência" (BatchTransfer,
// `426be835`, TASK-LOTE-FE-02), espelhando a validação client-side mínima e
// fiel do legado (`_forms.blade.php:355-367`, contrato §6.6): `date` e
// `new_batch_uuid` (Novo Lote — `batch_id` no payload) são obrigatórios.
//
// A regra "pelo menos 1 animal selecionado" NÃO entra neste schema — é
// checada manualmente no `onSubmit` da tela (mensagem fiel do legado,
// "Selecione ao menos um animal para realizar a transferência.") porque o
// gate precisa disparar ANTES de qualquer chamada à mutação, sem exigir que
// `animal_uuids` seja um campo Yup `required`+`min` (mirror da mesma decisão
// já usada em `CreateOrUpdateBatch` para `animal_uuids`, que é opcional no
// schema por natureza — aqui a obrigatoriedade É real, só que fora do Yup).
//
// `batch_filter_uuid`/`category_uuids` são filtros do PICKER, nunca
// enviados no payload — sem `.required()`.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const batchTransferSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.batchTransfers.batchTransfer.form.validation;

  return yup.object({
    date: yup.mixed().required(messages.dateRequired),
    batch_filter_uuid: yup.mixed().nullable(),
    category_uuids: yup.array().nullable(),
    new_batch_uuid: yup.mixed().required(messages.newBatchRequired),
    animal_uuids: yup.array().nullable(),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const batchTransferSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(batchTransferSchema(languageGB));

export default batchTransferSchemaResolver;
