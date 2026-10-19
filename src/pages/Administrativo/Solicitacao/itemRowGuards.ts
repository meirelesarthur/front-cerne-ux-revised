// src/pages/Administrativo/Solicitacao/itemRowGuards.ts
// -----------------------------------------------------------------------------
// Regras PURAS das linhas de itens e anexos da Solicitação (execução 081,
// T-081-FE-05; contrato LEGADO 03: IG07-IG10, FM24, PR-I14/PR-I15/PR-N01).
//
//   - "Adicionar item" fica BLOQUEADO enquanto a última linha estiver incompleta
//     (legado: swal "Atenção" / "Preencha todos os campos antes de adicionar
//     novos.");
//   - o último item não pode ser removido (legado: "Você deve ter ao menos um
//     item na lista");
//   - em F, E e U a lista de anexos é obrigatória (mín. 1 linha), então a última
//     linha de anexo também não sai;
//   - Serviço (S) nasce com quantidade 1 (legado: `quantity ?? 1`);
//   - CPF da Diária é somente leitura na edição de uma linha já gravada (FM29).
//
// "Incompleta" usa a MESMA matriz de obrigatórios do schema
// (`REQUIRED_ITEM_FIELDS_BY_TYPE`): campos com classe `ignore` no legado
// (produto, observação do Serviço) não entram — igual ao JS do legado.
// -----------------------------------------------------------------------------

import { requestPurchaseType } from '@/constants/RequestPurchases/request-purchase-type';

import {
  ATTACHMENT_FILE_REQUIRED_TYPES,
  isItemFieldEmpty,
  REQUIRED_ITEM_FIELDS_BY_TYPE,
} from '@/validations/schemas/RequestPurchases/request-purchase-schema';
import type { RequestItemRowShape } from '@/validations/schemas/RequestPurchases/request-purchase-schema';

import type { RequestAttachmentFormRow, RequestItemFormRow } from '@/@types/v2/RequestPurchases';

// Linha de item vazia para o tipo (Serviço nasce com quantidade 1).
export function emptyItemRow(type?: string | null): RequestItemFormRow {
  return {
    item_uuid: null,
    product_uuid: null,
    quantity: type === requestPurchaseType.servico ? 1 : null,
    amount: null,
    name: null,
    nif: null,
    phone: null,
    description: null,
    service_description: null,
    daily_quantity: null,
    brand: null,
    observation: null,
    delivery_date: null,
  };
}

// Linha de anexo vazia.
export function emptyAttachmentRow(): RequestAttachmentFormRow {
  return { attachment_uuid: null, name: '', file: null };
}

// `true` quando algum campo obrigatório do tipo está vazio na linha.
export function isItemRowIncomplete(
  type: string | null | undefined,
  row: RequestItemRowShape | null | undefined
): boolean {
  if (!type || !row) return true;
  const required = REQUIRED_ITEM_FIELDS_BY_TYPE[type] ?? [];
  return required.some((field) => isItemFieldEmpty(field, row));
}

// `true` quando a linha de anexo não tem descrição ou arquivo (linha gravada
// dispensa o arquivo novo).
export function isAttachmentRowIncomplete(
  row:
    { attachment_uuid?: string | null; name?: string | null; file?: File | null } | null | undefined
): boolean {
  if (!row) return true;
  const hasName = !!String(row.name ?? '').trim();
  const hasFile = !!row.file || !!row.attachment_uuid;
  return !hasName || !hasFile;
}

// Só remove item quando sobrar ao menos um.
export function canRemoveItem(itemCount: number): boolean {
  return itemCount > 1;
}

// Anexos obrigatórios (F/E/U) mantêm ao menos uma linha; nos demais tipos a
// lista pode ficar vazia.
export function canRemoveAttachment(
  type: string | null | undefined,
  attachmentCount: number
): boolean {
  if (type && ATTACHMENT_FILE_REQUIRED_TYPES.has(type)) return attachmentCount > 1;
  return true;
}

// Tipos em que a aba de anexos é obrigatória.
export function attachmentsRequired(type: string | null | undefined): boolean {
  return !!type && ATTACHMENT_FILE_REQUIRED_TYPES.has(type);
}

// CPF (`nif`) da Diária: somente leitura em linha já gravada.
export function isDailyNifReadOnly(
  row: Pick<RequestItemFormRow, 'item_uuid'> | undefined
): boolean {
  return !!row?.item_uuid;
}

// Remove linhas de anexo totalmente vazias (sem descrição, arquivo ou uuid) do
// payload — a API exige arquivo em toda linha nova.
export function dropEmptyAttachmentRows<T extends RequestAttachmentFormRow>(rows: T[]): T[] {
  return rows.filter(
    (row) => !!row.attachment_uuid || !!row.file || !!String(row.name ?? '').trim()
  );
}
