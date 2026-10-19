// src/constants/Marker/options/marker-in-use-table-labels.ts
// -----------------------------------------------------------------------------
// Dicionário de rótulos de exibição para as chaves reais de
// `errors.in_use` (`DeleteMarkerAction`/`MarkerRepository::dependencyUsageCounts()`,
// api_root) — mapa `{tabela: count}`, NÃO `Array<{resource, table, count}>`.
//
// Decisão do Arquiteto Frontend (GAP-MK-FE-01, [AVALIADO], Opção 2): a API
// nunca envia rótulo amigável para Marker (família `dependencyUsageCounts()`,
// diferente de `Contador`/`hasDependents()`, que monta `resource` no PHP) —
// o front traduz localmente cada chave via esta fábrica, mesmo padrão
// `(languageGB) => Map` de `markerTypeOptions`. API intocada.
//
// Os 10 rótulos são sourced por leitura direta (não inventados) — ver
// `[[04-Gaps_Frontend_UI/GAP-MK-FE-01-marker-in-use-shape-diverge-sem-resource-label]]`
// para o sourcing completo: hierarquia geográfica (Área/Setor/Local/Sub-local)
// confirmada por `belongsTo` real em `app/Area.php`/`Sector.php`/`Place.php`/
// `SubPlace.php` (legado); "Centro de Custo"/"Rateio" (`activity_cost_centers`/
// `apportionment_items`) já em produção no `frontend_root`,
// `src/pages/CadastrosBase/CentroCusto/`.
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';

const labels = (languageGB: LanguageDate): Map<string, string> =>
  new Map([
    ['areas', languageGB.markers.marker.deleteBlocked.tableLabels.areas],
    ['sectors', languageGB.markers.marker.deleteBlocked.tableLabels.sectors],
    ['places', languageGB.markers.marker.deleteBlocked.tableLabels.places],
    ['sub_places', languageGB.markers.marker.deleteBlocked.tableLabels.subPlaces],
    ['area_infrastructure', languageGB.markers.marker.deleteBlocked.tableLabels.areaInfrastructure],
    [
      'sector_infrastructure',
      languageGB.markers.marker.deleteBlocked.tableLabels.sectorInfrastructure,
    ],
    [
      'place_infrastructure',
      languageGB.markers.marker.deleteBlocked.tableLabels.placeInfrastructure,
    ],
    [
      'sub_place_infrastructure',
      languageGB.markers.marker.deleteBlocked.tableLabels.subPlaceInfrastructure,
    ],
    [
      'activity_cost_centers',
      languageGB.markers.marker.deleteBlocked.tableLabels.activityCostCenters,
    ],
    ['apportionment_items', languageGB.markers.marker.deleteBlocked.tableLabels.apportionmentItems],
  ]);

// Fallback defensivo: só ativa se a API devolver uma 11ª chave nunca vista
// (nome cru da tabela) — não deve acontecer em uso normal, mas evita quebrar
// a tela silenciosamente caso o backend adicione uma nova FK dependente sem
// o dicionário ser atualizado em conjunto.
const getLabel = (table: string, languageGB: LanguageDate): string =>
  labels(languageGB).get(table) ?? table;

export const markerInUseTableLabels = { getLabel };
