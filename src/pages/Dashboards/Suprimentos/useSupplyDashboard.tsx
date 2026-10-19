// src/pages/Dashboards/Suprimentos/useSupplyDashboard.tsx
// -----------------------------------------------------------------------------
// Hook de dados da tela "Suprimentos" (Tarefa 38). `useSupplyDashboardQuery` é
// `useQuery` DIRETO — mirror PADRÃO 12/Hook 7
// (`get_pwa_complex_screen_compositions_pattern`/`get_pwa_grid_query_pattern`):
// agregado sem paginação, V3 não tem `useDashboardQuery` canônico (compõe
// manualmente com `useQuery` por tela).
//
// A `queryKey` depende do filtro JÁ APLICADO (`useState` local da página,
// `SupplyDashboardPage`), NUNCA do estado interno do formulário do drawer —
// a query só refaz no "Aplicar filtros" (mirror IG-1/contrato §7.2).
//
// A cascata Safra→datas (AD-03/FID-G3F §5) usa `useHarvestDetail` DIRETO de
// `src/pages/CadastrosBase/Safra/useHarvests.tsx` dentro de
// `FilterSideSuprimentos.tsx` — reuso direto, zero fetch novo, sem
// reexport aqui (nenhum outro consumidor desta tela precisa dele).
// -----------------------------------------------------------------------------

import { useQuery } from '@tanstack/react-query';

import { queryKey } from '@/constants/query-key';

import { getSupplyDashboard } from '@/services/v2/SupplyDashboard/supply-dashboard-service';

import type { SupplyDashboardFilterRequest } from '@/@types/v2/SupplyDashboard';

export function useSupplyDashboardQuery(filter: SupplyDashboardFilterRequest) {
  return useQuery({
    queryKey: [queryKey.supplyDashboard.detail, filter],
    queryFn: async () => (await getSupplyDashboard(filter)).data,
    refetchOnWindowFocus: false,
  });
}
