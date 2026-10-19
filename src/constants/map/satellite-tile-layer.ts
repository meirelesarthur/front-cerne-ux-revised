// src/constants/map/satellite-tile-layer.ts
// -----------------------------------------------------------------------------
// Ponto único da camada base de SATÉLITE (Esri World Imagery) para TODOS os
// mapas Leaflet do fork (decisão do dono: "todos os mapas em satélite igual
// à home" — ajuste transversal, execução F-348/Áreas). Antes desta extração,
// a URL/options Esri viviam hardcoded só em
// `src/components/Dashboard/FarmAreasMap.tsx` (fix F-211, wave 062) enquanto
// os outros 6 mapas ainda usavam OpenStreetMap — esta constante elimina a
// duplicação e é a ÚNICA fonte de verdade da tile layer de satélite.
//
// Fidelidade Esri (NÃO confundir com a URL OSM que este helper substitui):
//   - Sem subdomínio `{s}` — a URL do World Imagery é um host único
//     (`server.arcgisonline.com`), diferente do OSM (`{s}.tile.openstreetmap.org`).
//   - Ordem de tile `{z}/{y}/{x}` — o OSM usa `{z}/{x}/{y}`. Trocar só o
//     domínio e manter a ordem OSM quebra o mapa silenciosamente (tiles
//     buscados nas coordenadas erradas).
//   - `maxNativeZoom: 17` é OBRIGATÓRIO: o Esri World Imagery só tem tiles
//     NATIVOS até ~z17 em zona rural (fazendas) — pedir z18-20 sem esse
//     limite devolve o placeholder cinza "Map data not yet available".
//     Com `maxNativeZoom`, o Leaflet faz upscale dos tiles de z17 para os
//     zooms maiores (levemente menos nítido, nunca cinza).
//   - `maxZoom: 20` continua permitindo o usuário aproximar até z20 (o
//     upscale acima cobre o gap entre 17 e 20).
//
// Esri NÃO é Google Maps — mapas públicos (`RastreioMap.tsx`/
// `SitePublicoMap.tsx`) têm o gate "Google Maps proibido" (só Leaflet, zero
// chave de API embutida); Esri World Imagery é tile provider aberto via
// ArcGIS REST, sem chave, mesma classe de uso que o OSM que substitui — o
// gate permanece respeitado.
// -----------------------------------------------------------------------------

import L from 'leaflet';

/** URL template da tile layer de satélite Esri World Imagery. */
export const SATELLITE_TILE_LAYER_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

/** Options Leaflet da tile layer de satélite — mesmas de `FarmAreasMap.tsx` (fix F-211). */
export const SATELLITE_TILE_LAYER_OPTIONS: L.TileLayerOptions = {
  attribution:
    'Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
  // Ver nota acima — sem isto, zoom em área rural fica cinza.
  maxNativeZoom: 17,
  maxZoom: 20,
};

/**
 * Adiciona a camada base de satélite (Esri World Imagery) a um mapa Leaflet
 * já instanciado — substitui o antigo `L.tileLayer(OSM_URL, {...}).addTo(map)`
 * por um ponto único, mantendo o comportamento visual idêntico ao da home
 * (`FarmAreasMap.tsx`).
 * @param {L.Map} map - Instância do mapa Leaflet já criada (`L.map(container)`).
 * @return {L.TileLayer} a tile layer criada e já adicionada ao mapa.
 */
export function addSatelliteBaseLayer(map: L.Map): L.TileLayer {
  return L.tileLayer(SATELLITE_TILE_LAYER_URL, SATELLITE_TILE_LAYER_OPTIONS).addTo(map);
}
