// src/@types/v2/WeighingInOutReport/index.ts
// -----------------------------------------------------------------------------
// Tipos do relatório "Pesagem Entrada/Saída" (F-336, esteira 97-Esteiras/058,
// FRONT-F336-plano.md §3). Mirror estrutural de `@/@types/v2/TransferClienteReport`
// / `@/@types/v2/WeighingHarvestReport` — tela de filtro + download binário,
// SEM grid/prévia, SEM `columns`/`order` (colunas e cálculo de saldo/balanço
// são fixos no servidor, `ModuleWeighingRepository`).
//
// `product_uuid` é OBRIGATÓRIO (CORRIGE C9/FID-13 do legado — produto ausente com
// datas preenchidas zerava o resultado silenciosamente); `client_uuid`/`warehouse_uuid`
// são OPCIONAIS. `format` decide PDF×Excel via 1 único endpoint
// (`GET /weighing-in-out-report?...&format=pdf|xlsx`).
//
// `WeighingInOutReportFilterForm` valida a FORMA INTERNA do form (Option-based,
// react-hook-form) — `WeighingInOutReportParams` é o payload 1:1 com o service
// (`responseType:'blob'`), campos opcionais SEMPRE `undefined` quando vazios.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

export type WeighingInOutReportFormat = 'pdf' | 'xlsx';

export interface WeighingInOutReportParams {
  start_date: string;
  end_date: string;
  product_uuid: string;
  client_uuid?: string;
  warehouse_uuid?: string;
  format: WeighingInOutReportFormat;
}

export interface WeighingInOutReportFilterForm {
  start_date: string | null;
  end_date: string | null;
  product: Option<string> | null;
  client: Option<string> | null;
  warehouse: Option<string> | null;
  format: Option<WeighingInOutReportFormat> | null;
}
