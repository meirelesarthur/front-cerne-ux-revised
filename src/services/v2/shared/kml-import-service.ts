// src/services/v2/shared/kml-import-service.ts
// -----------------------------------------------------------------------------
// Importação de KML/KMZ — endpoint utilitário STATELESS `POST /api/v1/kml-import`
// (`TASK-BE-425`), GENERALIZADO nesta Tarefa (TASK-FE-415, fundação do módulo
// Áreas) a partir do antigo `src/services/v2/Farms/farm-kml-service.ts`
// (nascido na etapa Demarcação do wizard de Fazenda, `TASK-FE-412`,
// GAP-FE-121 reaberto) — o próprio endpoint NÃO opera sobre um recurso de
// Farm nem de Area (não recebe/retorna `uuid`), é um utilitário puro de
// conversão de arquivo (mirror `agro365/app/Http/Controllers/API/
// KmlImportController.php`), reusado por AMBAS as telas de mapa (Fazenda —
// `StepDemarcacao.tsx` — e Área — TASK-FE-419), conforme
// `CONTRATO-tela-frontend-area.md §2-bis` ("reusar o padrão... não duplicar").
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   POST /kml-import (multipart, campo `kml_file`) → data: GeoJSON `FeatureCollection`
//   (matriz FID-G3A A-07 — shape NOVO, `FeatureCollection`, NUNCA
//   `polygonsCoordinates` do legado; já suporta múltiplos `Placemark` por
//   arquivo, usado em loop pelo fluxo "Adicionar Múltiplas Áreas", TASK-FE-421).
//
// Decisão do dev (2026-07-29, `GAP-FE-121`/`PLANO-farm-demarcacao-mapa.md`
// §1.3/§3.1, preservada aqui): SEM parse client-side — o parse real (`.kml`
// E `.kmz`) acontece no backend, mirror do legado. Este service só faz o
// upload multipart e devolve o GeoJSON já pronto.
//
// `src/services/v2/Farms/farm-kml-service.ts` mantém `importFarmKml` como
// RE-EXPORT deste módulo (compatibilidade do import existente em
// `StepDemarcacao.tsx` — não duplica a implementação).
// -----------------------------------------------------------------------------

import api from '@/services/api';

/** Envelope de resposta de `POST /api/v1/kml-import` — utilitário stateless,
 *  sem `uuid` de recurso (nem Farm, nem Area). */
export interface KmlImportEnvelope {
  success: boolean;
  message: string;
  data: GeoJSON.FeatureCollection;
  errors: Record<string, string[]> | null;
  meta: null;
}

async function importKml(file: File): Promise<GeoJSON.FeatureCollection> {
  const fd = new FormData();
  fd.append('kml_file', file);
  const { data } = await api.V2.post<KmlImportEnvelope>('/kml-import', fd);
  return data.data;
}

export { importKml };
