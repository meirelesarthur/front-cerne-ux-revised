// src/services/v2/Relatorios/animals-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Estoque/Rebanho" (F-228, execução 97-Esteiras/078,
// TASK-F228-F02). Mirror ESTRUTURAL de `discards-report-service.ts` (F-256)
// — `toQuery` como WHITELIST EXPLÍCITA (nunca `{ ...params }`), 1 único
// download binário (PDF-ONLY, FRONT-05 — sem `report_type`, sem Excel).
//
// Endpoint FLAT (raiz, NÃO `/reports/...`):
//   GET /animals-report (PDF, responseType:'blob')
//   params: start_date, end_date, species[]?
//
// `toAnimalsReportParams()` é a FRONTEIRA OBRIGATÓRIA valores→payload —
// monta as chaves campo a campo a partir do form (3 campos). PROIBIDO
// `{ ...values }`, spread parcial — a página nunca remonta chaves inline.
//
// `toQuery` omite `species` quando vazio/nulo (nunca envia `species=`).
//
// `listSpecieOptions()` NÃO é reimplementado aqui — reusa o mirror já vivo em
// `@/services/v2/Species/species-service.ts` (`GET /species/options`,
// farm-scoped via `X-Farm-Id`, `SpeciesOptionsListEnvelope`). NÃO usar
// `listSpecies` (gated `specie_view`) nem endpoint genérico novo.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type {
  AnimalsReportFormValues,
  AnimalsReportParams,
} from '@/@types/v2/Relatorios/animals-report';

function toAnimalsReportParams(values: AnimalsReportFormValues): AnimalsReportParams {
  return {
    start_date: values.start_date as string,
    end_date: values.end_date as string,
    species: values.species?.length ? values.species.map((option) => option.value) : undefined,
  };
}

// Segunda barreira (whitelist explícita, NUNCA `{ ...params }`): garante que
// nenhuma chave indeclarada sobreviva a um refactor, e que `species` vazio/
// nulo não chegue à querystring (nunca `species=`). `arrayFormat:'repeat'`
// (serializer global, mirror `constants_and_mappers_pattern §2.1`) produz
// `species=uuid1&species=uuid2` quando presente.
function toQuery(params: AnimalsReportParams) {
  return {
    start_date: params.start_date,
    end_date: params.end_date,
    species: params.species?.length ? params.species : undefined,
  };
}

async function downloadAnimalsReportPdf(params: AnimalsReportParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>('/animals-report', toQuery(params), {
    responseType: 'blob',
  });
  return data;
}

export { downloadAnimalsReportPdf, toAnimalsReportParams };
