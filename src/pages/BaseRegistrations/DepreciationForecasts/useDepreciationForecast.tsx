// src/pages/BaseRegistrations/DepreciationForecasts/useDepreciationForecast.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo de PREVISÃO DE DEPRECIAÇÃO — TASK-FE-230 (fundação
// de dados, sem UI, consumido por PrevisaoDepreciacao.tsx na TASK-FE-231).
//
// Nenhum hook de família (`useCustomFormQueryByGuid`/`useCustomGridQuery`) se
// encaixa aqui: não há `uuid`, não há "registro" a editar, não há paginação.
// Mesmo racional já documentado em `useHarvestDetail`/`useHarvestCurrentWeek`
// (`SafraDetalhe.tsx`, TASK-FE-010) — leitura direta nomeada via `useQuery`.
//
// Para a projeção especificamente, reaproveita o hook JÁ EXISTENTE e nunca
// consumido `useCustomFormQueryByTwoNumericIds` (`src/hooks/
// useCustomFormQueryByTwoNumericIds.tsx`) — criado para "2 ids numéricos → 1
// leitura", `enabled` só quando os 2 são válidos. Encaixe funcional quase
// perfeito: `equipmentId`/`forecastTime` no lugar de `firstId`/`secondId`.
// Sem `fillForm` — não é formulário de edição, o componente lê `data` direto
// da query para renderizar a tabela.
// -----------------------------------------------------------------------------

import { useQuery } from '@tanstack/react-query';

import { useCustomFormQueryByTwoNumericIds } from '@/hooks/useCustomFormQueryByTwoNumericIds';

import { queryKey } from '@/constants/query-key';

import {
  getDepreciationForecast,
  listEquipmentOptions,
} from '@/services/v2/BaseRegistrations/depreciationForecasts-service';

// Query de opções elegíveis (select "Bem imobilizado") — SEM paginação
// (endpoint não pagina), refetch desabilitado no foco da janela (mesmo
// racional de catálogos globais/quase-estáticos consumidos por outros
// selects do projeto).
export function useEquipmentOptions() {
  return useQuery({
    queryKey: [queryKey.depreciationForecasts.equipmentOptions],
    queryFn: async () => listEquipmentOptions(),
    refetchOnWindowFocus: false,
  });
}

interface UseDepreciationForecastQueryProps {
  equipmentId?: number;
  forecastTime?: number;
}

// Query da projeção calculada — dispara automaticamente quando os 2
// parâmetros são válidos (`enabled` interno do hook de família), sem botão de
// submit (decisão ratificada no contrato de tela §2/item 1).
export function useDepreciationForecastQuery({
  equipmentId,
  forecastTime,
}: UseDepreciationForecastQueryProps) {
  return useCustomFormQueryByTwoNumericIds({
    firstId: equipmentId,
    secondId: forecastTime,
    queryKey: queryKey.depreciationForecasts.projection,
    asyncFunctionByTwoIds: (equipmentIdParam, forecastTimeParam) =>
      getDepreciationForecast(equipmentIdParam, forecastTimeParam),
  });
}
