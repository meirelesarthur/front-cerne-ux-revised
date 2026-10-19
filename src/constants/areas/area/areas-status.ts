// src/constants/areas/area/areas-status.ts
// -----------------------------------------------------------------------------
// TASK-FE-415 (fundação do módulo Áreas) — enums de dados de `Area` (backend
// `App\Enums\AreaType`/`App\Enums\AreaColor`), mirror EXATO dos valores físicos
// validados por `AreaRequest::rules()` (`GB.Cerne.Api/app/Http/Requests/Api/V1/
// AreaRequest.php`). Fábricas de options (Map + getLabel/getOption/options,
// `get_pwa_constants_and_mappers_pattern §3`) ficam em `./options/*.ts` — este
// arquivo é só a fonte de dados (enum + mapa), nunca tradução.
//
// -- AreaType (App\Enums\AreaType, backed int) -------------------------------
// PRODUCTIVE = 1 ("Produtiva"), RESERVE = 2 ("Reserva") — mirror do array
// legado `App\Area::types()` (chave 1 explícita + chave implícita 2), fixado
// por Enum backed no destino (`AreaType.php` cabeçalho).
//
// -- AreaColor (App\Enums\AreaColor, backed string) --------------------------
// Paleta FECHADA de 14 cores — as 14 cores são DADOS que pintam o polígono no
// mapa (Leaflet), não token de tema — única exceção legítima de hex neste
// projeto, mesmo racional já registrado para `chart.series`
// (`src/constants/dashboards/chart-series-palette.ts`) e já aplicado ao gêmeo
// `src/constants/Grazing/options/grazing-color-options.ts` (`GrazingRequest`
// valida `color` contra este MESMO Enum `AreaColor` do backend — mesma lista,
// mesma ordem). `areaColor` abaixo é o mapa de metadado por valor (hoje só o
// próprio hex, ponto único de extensão se um dia precisar de mais metadado
// por cor, ex.: contraste de texto do chip).
// -----------------------------------------------------------------------------

// ============================================
// AreaType — `type` (smallint), 1 Produtiva | 2 Reserva
// ============================================

export const AreaType = {
  PRODUCTIVE: 1,
  RESERVE: 2,
} as const;

export type AreaTypeValue = (typeof AreaType)[keyof typeof AreaType];

// ============================================
// AreaColor — `color` (string(7) hex), paleta fechada de 14 cores
// ============================================

// Mesma ordem de declaração de `App\Enums\AreaColor` (backend) — NÃO reordenar
// (facilita comparação visual com o Enum na revisão de código, mesmo racional
// de `GRAZING_COLOR_VALUES`).
export const AreaColor = {
  WHITE: '#ffffff',
  BLUE: '#0074d9',
  BLACK: '#000000',
  GREEN: '#2ecc40',
  YELLOW: '#ffdc00',
  RED: '#ff4136',
  GRAY: '#aaaaaa',
  LIGHT_GRAY: '#dddddd',
  LIGHT_BLUE: '#7fdbff',
  DARK_BLUE: '#001f3f',
  TURQUOISE: '#39cccc',
  DARK_GREEN: '#3d9970',
  LIGHT_GREEN: '#01ff70',
  ORANGE: '#ff851b',
} as const;

export type AreaColorValue = (typeof AreaColor)[keyof typeof AreaColor];

/** Ordem canônica das 14 cores — mirror `GRAZING_COLOR_VALUES` (mesma paleta). */
export const AREA_COLOR_VALUES = Object.values(AreaColor) as AreaColorValue[];

/** Metadado por cor (hoje só o hex — ponto único de extensão futuro). */
export interface AreaColorMeta {
  hex: AreaColorValue;
}

/** Mapa ÚNICO de metadado de cor (`areaColor`), consumido pelo chip/swatch da
 *  UI (TASK-FE-420) e pela fábrica de options (`./options/area-color-options.ts`). */
export const areaColor: Record<AreaColorValue, AreaColorMeta> = AREA_COLOR_VALUES.reduce(
  (acc, hex) => {
    acc[hex] = { hex };
    return acc;
  },
  {} as Record<AreaColorValue, AreaColorMeta>
);
