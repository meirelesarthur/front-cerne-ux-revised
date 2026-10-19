// src/pages/Administrativo/BaixaEstoque/stock-writeoff-form-mapper.ts
// -----------------------------------------------------------------------------
// TASK-FE-3004 — mapeamento PURO `StockWriteoffForm` (RHF) → `StockWriteoffCreatePayload`
// (`POST /stock-writeoffs`, `StockWriteoffRequest`). Mirror
// `service-order-form-mapper.ts`/`tryPersistWarehouseTransfer` (mapper
// dedicado + `.filter().map()` de linhas incompletas).
//
// Cabeçalho da linha do bloco de itens (`items[].stock`, contrato de tela
// §4.3): a linha SELECIONA uma linha de ESTOQUE (`stock.uuid`, via
// `GET /stocks?warehouse_uuid=`) só para hidratar saldo/unidade/custo médio/
// lote — o payload da API usa `product_uuid`+`lot` SEPARADOS (embutidos na
// própria Option pelo `mapOptions` do `ItemRow.tsx`), NUNCA `stock_uuid`
// (não existe no wire do `StockWriteoffRequest`). `amount` (total) NÃO vai
// ao payload — o backend recalcula (`value * quantity`).
//
// `attachments` — só linhas com `file` preenchido entram no payload
// (`sometimes` no backend); `name` vazio com `file` válido recebe o default
// traduzido (FLD-020, "Não Informado"/"Not Informed"/"No Informado").
//
// `center` (D3/D-FE-BE-04) — fidelidade AS-IS ao legado: enviado quando
// preenchido, mesmo sabendo que a API descarta (não persiste, não valida).
// -----------------------------------------------------------------------------

import type { StockWriteoffCreatePayload, StockWriteoffForm } from '@/@types/v2/StockWriteoffs';

/**
 * @param {StockWriteoffForm} data - Valores do `useForm<StockWriteoffForm>` no submit.
 * @param {string} defaultAttachmentName - Rótulo traduzido do default de
 *   nome de anexo (FLD-020, `languageGB.stockWriteoffs.stockWriteoff.form.attachments.defaultName`).
 * @return {StockWriteoffCreatePayload} Payload fiel ao `StockWriteoffRequest`.
 */
export function mapStockWriteoffFormToPayload(
  data: StockWriteoffForm,
  defaultAttachmentName: string
): StockWriteoffCreatePayload {
  return {
    date: data.date,
    warehouse_uuid: data.warehouse!.value,
    type: data.type!.value,
    type_note: data.type_note?.trim() || undefined,
    justification: data.justification.trim(),
    items: data.items
      .filter((item) => item.stock && item.quantity != null && item.quantity > 0)
      .map((item) => ({
        product_uuid: item.stock!.product_uuid,
        quantity: Number(item.quantity),
        value: Number(item.value ?? 0),
        lot: item.stock!.lot ?? null,
      })),
    attachments: data.attachments
      .filter((row): row is typeof row & { file: File } => !!row.file)
      .map((row) => ({
        name: row.name?.trim() || defaultAttachmentName,
        file: row.file,
      })),
    center: data.cost_center?.value || undefined,
  };
}

export default mapStockWriteoffFormToPayload;
