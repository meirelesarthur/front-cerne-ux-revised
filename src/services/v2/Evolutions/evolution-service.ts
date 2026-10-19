// src/services/v2/Evolutions/evolution-service.ts
// -----------------------------------------------------------------------------
// Evolution Service — API v1 do backend Laravel GB.Cerne (`/evolutions*`,
// api-contract-evolucao-rebanho.md, spa-contract-evolucao-rebanho.md §6,
// Tarefas 26/27). 100% somente-leitura — sem `create`/`update`/`delete`.
//
// `listEvolutions` adapta o envelope `ApiResponse::paginated` (`{ data:
// [array plano], meta: { current_page, last_page, per_page, total } }`) para
// o shape `ResponsePagination<T>` que `useCustomGridQuery` consome — mesmo
// adaptador de `listSeparations`/`listAnimalOptions`. Nunca envia
// `animal_label`/`farm_id`/`tenant_id`.
//
// `downloadEvolutionsReportPdf`/`downloadEvolutionsReportXlsx` (Tarefa 27) —
// `GET /evolutions/report` binário síncrono, `responseType: 'blob'`, mirror
// `supply-status-sla-report-service.ts`. `type` só é enviado quando `1`
// (Excel); ausente → PDF (`CL-19`).
//
// `X-Farm-Id` anexado automaticamente pelo interceptor genérico de
// `@/services/api.ts` — este service não manipula o header manualmente
// (para o relatório, o header é enviado e IGNORADO pelo servidor,
// `GAP-EVO-02`/`GAP-EVO-FE-02` preservados AS-IS, sem `skipFarmHeader`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { ResponsePagination } from '@/@types/response-api';
import type {
  EvolutionFilterRequest,
  EvolutionListItem,
  EvolutionReportParams,
} from '@/@types/v2/Evolutions';

export interface ListEvolutionsParams extends PaginationQueryParams, EvolutionFilterRequest {}

interface EvolutionsApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface EvolutionsListEnvelope {
  success: boolean;
  message: string;
  data: EvolutionListItem[];
  errors: Record<string, string[]> | null;
  meta: EvolutionsApiPaginationMeta | null;
}

// `GET /evolutions` — filtros opcionais (`animal_uuid`/`start_date`/
// `end_date`), enviados só quando preenchidos. Paginação real, mas o
// servidor IGNORA `per_page` e pagina fixo em 10 (`CL-12`) — a tela
// (`Tarefa 26`) passa `pageSizeOptions={[10]}` para não oferecer um
// controle mentiroso; este service não precisa compensar isso.
async function listEvolutions(
  params: ListEvolutionsParams
): Promise<ResponsePagination<EvolutionListItem[]>> {
  const { data } = await api.V2.get<EvolutionsListEnvelope>('/evolutions', {
    page: params.page,
    per_page: params.per_page,
    animal_uuid: params.animal_uuid || undefined,
    start_date: params.start_date || undefined,
    end_date: params.end_date || undefined,
  });

  return {
    success: data.success,
    message: data.message,
    data: {
      items: data.data,
      pagination: {
        total: data.meta?.total ?? data.data.length,
        count: data.data.length,
        per_page: data.meta?.per_page ?? params.per_page ?? data.data.length,
        current_page: data.meta?.current_page ?? params.page ?? 1,
        total_pages: data.meta?.last_page ?? 1,
      },
    },
  };
}

// -----------------------------------------------------------------------------
// Consumidos pela Tarefa 27 (tela de relatório) — declarados aqui por
// instrução da fundação (contrato §8 — "o arquivo de serviço nasce aqui").
// -----------------------------------------------------------------------------

// `GET /evolutions/report` sem `type` → PDF (`CL-19`). Rota fora de
// `farm.context` e sem permissão no servidor (`GAP-EVO-01`/`GAP-EVO-02`) —
// preservado AS-IS, nenhum filtro/gate inventado aqui.
async function downloadEvolutionsReportPdf(params: EvolutionReportParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/evolutions/report',
    { start_date: params.start_date, end_date: params.end_date },
    { responseType: 'blob' }
  );
  return data;
}

// `GET /evolutions/report?type=1` → Excel (`CL-19`). Mesma rota/mesmos
// defeitos preservados do export em PDF acima.
async function downloadEvolutionsReportXlsx(params: EvolutionReportParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/evolutions/report',
    { start_date: params.start_date, end_date: params.end_date, type: 1 },
    { responseType: 'blob' }
  );
  return data;
}

export { downloadEvolutionsReportPdf, downloadEvolutionsReportXlsx, listEvolutions };
