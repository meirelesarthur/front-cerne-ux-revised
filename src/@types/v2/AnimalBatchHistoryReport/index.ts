// src/@types/v2/AnimalBatchHistoryReport/index.ts
// -----------------------------------------------------------------------------
// Tipos do relatório "Histórico de Animais/Lote" (F-221, esteira
// 97-Esteiras/058, TASK-058-F221-FE-01). Mirror estrutural de
// `@/@types/v2/AccountsReports`/`reproductive-history-report-service` — tela
// de filtro puro + download binário (PDF inline OU Excel), SEM
// `columns`/`order`/`order_direction` (colunas e ordenação são fixas no
// servidor, `AnimalBatchHistoryReportRequest` não expõe esses parâmetros —
// FRONT-F221-plano.md §"Leitura do dev").
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';
import type { AnimalStatusValue } from '@/@types/v2/Animals';

/** `type` decide o FORMATO da resposta binária (PDF inline OU Excel
 * download) — nome do campo mantido igual ao literal esperado pela API
 * (`?type=pdf|excel`), evita mapeamento silencioso (plano §"Riscos", item 2). */
export type AnimalBatchHistoryReportOutputType = 'pdf' | 'excel';

/** Payload flat enviado para `GET /animal-batch-history-report`
 * (`responseType:'blob'`) — `Option<T>` já desembrulhado para o valor. */
export interface AnimalBatchHistoryReportParams {
  start_date: string;
  end_date?: string;
  batch: string;
  status?: AnimalStatusValue;
  type: AnimalBatchHistoryReportOutputType;
}

/** Estado do formulário de filtro (React Hook Form) — selects em
 * `Option<T>|null`, convertidos para o payload flat no submit. */
export interface AnimalBatchHistoryReportFilterForm {
  start_date: string | null;
  end_date: string | null;
  batch: Option<string> | null;
  status: Option<AnimalStatusValue> | null;
  type: Option<AnimalBatchHistoryReportOutputType> | null;
}
