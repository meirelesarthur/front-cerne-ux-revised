// src/services/v2/BaseRegistrations/depreciationForecasts-service.ts
// -----------------------------------------------------------------------------
// Depreciation Forecast Service — API v1 do backend Laravel GB.Cerne (Previsão
// de Depreciação). TASK-FE-230 (fundação de dados, sem UI).
//
// Contrato (envelope ApiResponse: { success, message, data, errors, meta }):
//   GET /depreciation-forecasts/equipment-options → data: EquipmentOption[],
//                                                    SEM paginação (meta null,
//                                                    §6 do contrato de API —
//                                                    "o legado nunca paginou
//                                                    este select").
//   GET /depreciation-forecasts?equipment_id=&forecast_time= → data:
//                                                    DepreciationForecastData,
//                                                    SEM paginação (meta null),
//                                                    SEM persistência (projeção
//                                                    efêmera).
//
// Farm-scoped (D1 do contrato de API — `farm.context` ESTRITO): header
// X-Farm-Id anexado automaticamente pelo interceptor genérico do `api.ts`,
// nenhum código manual aqui.
//
// `listEquipmentOptions` NÃO adapta paginação (diferente de `listIndexers`/
// `listBirthNotes`) — o endpoint não pagina, retorna o array `data` direto.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type { DepreciationForecastData, EquipmentOption } from '@/@types/v2/BaseRegistrations/depreciationForecasts';

// GET /depreciation-forecasts/equipment-options — SEM adaptador de paginação
// (endpoint não pagina, D6/§6 do contrato de API). Retorna o array `data`
// direto — nunca `id`/`uuid` trocados aqui, `EquipmentOption.id` é bigint por
// design (D4, exceção documentada).
async function listEquipmentOptions(): Promise<EquipmentOption[]> {
  const { data } = await api.V2.get<Response<EquipmentOption[]>>(
    '/depreciation-forecasts/equipment-options'
  );
  return data.data;
}

// GET /depreciation-forecasts?equipment_id=&forecast_time= — retorna o
// envelope completo (`Response<DepreciationForecastData>`), consumido por
// `useCustomFormQueryByTwoNumericIds` (o hook lê `.data` para preencher a
// tela, TASK-FE-231). `equipmentId` é `id` bigint (D4), NUNCA `uuid`.
async function getDepreciationForecast(
  equipmentId: number,
  forecastTime: number
): Promise<Response<DepreciationForecastData>> {
  const { data } = await api.V2.get<Response<DepreciationForecastData>>('/depreciation-forecasts', {
    equipment_id: equipmentId,
    forecast_time: forecastTime,
  });
  return data;
}

export { getDepreciationForecast, listEquipmentOptions };
