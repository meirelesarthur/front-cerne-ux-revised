// src/constants/map/farm-perimeter-style.ts
// -----------------------------------------------------------------------------
// Ponto único do ESTILO do contorno do PERÍMETRO DA FAZENDA quando desenhado
// junto com as Áreas no mesmo `L.FeatureGroup` (execução 067/F-348, item (b)
// — "perímetro da fazenda na home"; par de `satellite-tile-layer.ts`).
//
// Distinção deliberada frente ao estilo das Áreas (`FarmAreasMap.tsx::
// drawAreas` — cor por cultura, preenchimento sólido ~28%, tooltip): o
// perímetro é contexto (limite físico da fazenda), não um item selecionável/
// com tooltip — contorno tracejado, SEM preenchimento (ou traço mínimo),
// mais grosso que o padrão de Área não-selecionada, `interactive: false`
// (nunca captura hover/clique, mesmo em pontos onde não há nenhuma Área por
// cima) e SEM `bindTooltip`.
//
// Cor NEUTRA estável em light/dark: a camada base é sempre satélite (Esri
// World Imagery, foto aérea) — a imagem não muda com o tema do app, então o
// contorno usa o token de paleta CRU `white` (não um token SEMÂNTICO que
// inverteria com o tema do app, o que o deixaria escuro-sobre-satélite no
// dark mode e prejudicaria a legibilidade). Resolução para hex feita pelo
// componente consumidor via `useToken('colors', ['white'])` — Leaflet exige
// CSS/hex cru em `PathOptions`, não props do Chakra (mesma técnica de
// `StepDemarcacao.tsx::polygonColor`).
// -----------------------------------------------------------------------------

import type L from 'leaflet';

/** Espessura do traço do contorno do perímetro (mais grosso que Área ~1.5-2px). */
export const FARM_PERIMETER_STROKE_WEIGHT = 3;

/** Padrão tracejado do contorno — distingue visualmente de área sólida. */
export const FARM_PERIMETER_DASH_ARRAY = '6 4';

/**
 * Monta as `PathOptions` do Leaflet para o contorno do perímetro da fazenda.
 * @param {string} strokeColor - Cor já resolvida (hex) do token `white` (ou
 *   equivalente neutro claro) via `useToken`, nunca hex hardcoded no chamador.
 * @return {L.PathOptions} estilo do contorno — sem preenchimento, tracejado,
 *   não-interativo (nunca captura hover/clique de Área nem do próprio mapa).
 */
export function buildFarmPerimeterStyle(strokeColor: string): L.PathOptions {
  return {
    color: strokeColor,
    weight: FARM_PERIMETER_STROKE_WEIGHT,
    dashArray: FARM_PERIMETER_DASH_ARRAY,
    fill: false,
    fillOpacity: 0,
    interactive: false,
  };
}
