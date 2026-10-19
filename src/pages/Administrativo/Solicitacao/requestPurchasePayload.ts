// src/pages/Administrativo/Solicitacao/requestPurchasePayload.ts
// -----------------------------------------------------------------------------
// UT-000743 — montagem PURA do payload de POST/PUT da Solicitação de Compra, a
// partir do form. Extraída de `CreateOrUpdateSolicitacao.tsx` para ser testável
// sem render.
//
// Contrato (API-743-UPDATE-PRESERVE): `harvest_uuid`, `parent_uuid` e `nfe`
// NÃO fazem parte do payload — nem como `null`, nem vazios. A API preserva
// esses dados quando a chave é omitida no PUT (enviar `null` os limparia).
//
// `type` é IMUTÁVEL no update (regra 14), mas o backend o exige `required`
// também no PUT: no update a fonte de verdade é o tipo PERSISTIDO
// (`persistedType`), nunca o campo do form; no create vem do campo.
// -----------------------------------------------------------------------------

import type {
  RequestAttachmentPayload,
  RequestItemPayload,
  RequestPurchaseForm,
  RequestPurchasePayload,
} from '@/@types/v2/RequestPurchases';

import { dropEmptyAttachmentRows } from './itemRowGuards';

export interface BuildRequestPurchasePayloadOptions {
  isEditing: boolean;
  /** `requestPurchaseData.type` carregado do servidor (usado só no update). */
  persistedType?: string | null;
}

export function buildRequestPurchasePayload(
  form: RequestPurchaseForm,
  { isEditing, persistedType }: BuildRequestPurchasePayloadOptions
): RequestPurchasePayload {
  const typeValue = isEditing ? (persistedType ?? form.type?.value) : form.type!.value;

  return {
    type: typeValue!,
    request_date: form.request_date!,
    justification: form.justification.trim(),
    description: form.description.trim(),
    priority: form.priority?.value ?? null,
    authorizer_uuid: form.authorizer_uuid?.value ?? null,
    observation: form.observation?.trim() || null,
    items: form.items.map((row): RequestItemPayload => ({
      item_uuid: row.item_uuid ?? null,
      product_uuid: row.product_uuid?.value ?? null,
      quantity: row.quantity ?? null,
      amount: row.amount ?? null,
      name: row.name?.trim() || null,
      nif: row.nif?.trim() || null,
      phone: row.phone?.trim() || null,
      // `description` do item: gap de caminho-de-escrita já corrigido (Doc Bruta §12).
      description: row.description?.trim() || null,
      service_description: row.service_description?.trim() || null,
      daily_quantity: row.daily_quantity ?? null,
      brand: row.brand?.trim() || null,
      observation: row.observation?.trim() || null,
      delivery_date: row.delivery_date || null,
    })),
    attachments: dropEmptyAttachmentRows(form.attachments ?? []).map(
      (row): RequestAttachmentPayload => ({
        attachment_uuid: row.attachment_uuid ?? null,
        name: row.name?.trim() || null,
        file: row.file ?? null,
      })
    ),
  };
}
