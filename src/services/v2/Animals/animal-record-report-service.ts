// src/services/v2/Animals/animal-record-report-service.ts
// -----------------------------------------------------------------------------
// Animal Record Report Service — API v1 do backend Laravel GB.Cerne (Tarefa 47,
// frontend-contract-ficha-animal.md §8). Endpoint FLAT
// (`GET /animal-record-report`, permissão `animal-record-report_view`,
// checada de verdade no servidor — diferente de Vacas Prenhas/Horas
// Logadas/Prod.Área) — deliberadamente NÃO estendido em `animal-service.ts`
// (aquele arquivo tem `basePath` `/animals`; misturar quebraria a
// consistência do arquivo, mesma razão registrada no cabeçalho de
// `pregnant-cows-report-service.ts`).
//
// Resposta SEMPRE um PDF binário (`Content-Disposition: inline`), fora do
// envelope `ApiResponse` — sem tipo de resposta novo (mirror estrutural
// `pregnant-cows-report-service.ts::downloadPregnantCowsReport`, sem o campo
// `type`, pois esta tela NÃO tem Excel, contrato §3/§8).
//
// Todos os 3 filtros são opcionais; nenhum default de negócio — omitir a
// chave quando vazia, nunca enviar string vazia (contrato §4). `X-Farm-Id` é
// propagado pelo interceptor genérico do `api.ts` (nunca `farm_id`/
// `tenant_id` no payload — `CL-10`, parâmetros mortos removidos do contrato
// de API).
// -----------------------------------------------------------------------------

import api from '@/services/api';

export interface AnimalRecordReportFilterParams {
  category_uuid?: string;
  batch_uuid?: string;
  animal_uuid?: string;
}

async function downloadAnimalRecordReport(params: AnimalRecordReportFilterParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/animal-record-report',
    { ...params },
    {
      responseType: 'blob',
    }
  );
  return data;
}

export { downloadAnimalRecordReport };
