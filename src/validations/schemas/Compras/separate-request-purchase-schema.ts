// src/validations/schemas/Compras/separate-request-purchase-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do dialog "Criar Sub Solicitação" (bifurcação) da
// fila Compras (`POST /request-purchases/{uuid}/separate`, TASK-CP-API-03,
// TASK-CPS-FE-01, esteira 97-Esteiras/036). Vive em
// `src/validations/schemas/Compras/` (pasta pelo NOME DA TELA, mesma regra de
// `inform-request-purchase-status-schema.ts` — schema de AÇÃO, não de
// cabeçalho/item da entidade).
//
// `selected_item_uuids` = uuids de `RequestItem` (NÃO de
// `RequestQuotationItem`, que não tem uuid próprio — achado de leitura direta
// da Tarefa, `request_item_uuid` do preview). `min(1, ...)` é MIRROR EXATO do
// backend (`SeparateRequestPurchaseRequest::rules()`, `items` `min:1`) — o
// client já bloqueia antes do submit (mirror do legado IG-09, SweetAlert
// "Selecione ao menos um item").
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const separateRequestPurchaseSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.requestPurchases.requestPurchase.inPurchase.dialogs.separate;

  return yup.object({
    selected_item_uuids: yup
      .array()
      .of(yup.string().required())
      .min(1, messages.itemsMinError)
      .required(messages.itemsMinError),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do dialog "Criar Sub Solicitação".
 */
export const separateRequestPurchaseSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(separateRequestPurchaseSchema(languageGB)) as any;

export default separateRequestPurchaseSchemaResolver;
