// src/constants/dashboards/assetsDashboard/assets-status.ts
// Mapa de cor dos 3 baldes operacionais de `AT-STATUS-01` (`MUD-046-02`) —
// CO-LOCADO com o valor do balde (`get_pwa_constants_and_mappers_pattern §4`).
// Nunca um 4º balde ("Aposentado/Baixa" não tem fonte — `LAC-046-03`).

import type { AssetsStatusBucket } from '@/@types/v2/Dashboards/assetsDashboard';

export const assetsStatusColor: Record<AssetsStatusBucket, string> = {
  in_operation: 'green',
  in_maintenance: 'yellow',
  inactive: 'gray',
};
