// src/utils/geo/polygon-geometry.ts
// -----------------------------------------------------------------------------
// Utilitário de geometria PURO (sem dependência do Leaflet nem de rede) —
// TASK-FE-419 (Áreas — editor de mapa, F-348/UT-000446, esteira 067).
//
// Não há biblioteca de geometria no repo (`turf`/similar — conferido em
// `package.json`, só `leaflet`/`leaflet-draw`) e o `L.GeometryUtil` do
// `leaflet-draw` só resolve área geodésica (`geodesicArea`), não interseção
// de polígonos. Este módulo cobre os 2 comportamentos exigidos pelo contrato
// de tela (`CONTRATO-tela-frontend-area.md §4`/CLM-24) que dependem de
// interseção/contenção geométrica:
//   1. `ringsOverlap` — sobreposição de polígono (CLM-24, aviso CLIENT-SIDE,
//      sem revalidação server, SURF-04a) via interseção de arestas +
//      contenção (caso um polígono esteja inteiramente dentro do outro sem
//      cruzar nenhuma aresta).
//   2. `isPointInPolygon` — ícone de atividade/infraestrutura arrastado para
//      fora da Área desenhada (`maps.js:991-1020`, legado) — mesma função de
//      ray-casting reaproveitada para os 2 usos.
//
// Convenção de coordenada: `GeoPoint { lat, lng }` (mesma forma de
// `L.LatLng`) — GeoJSON usa `[lng, lat]`; `ringFromGeoJsonPositions` faz a
// inversão na leitura. Só o anel EXTERNO de cada polígono é considerado
// (furos/`holes` ignorados) — suficiente para um aviso client-side, mesmo
// racional de precisão 2 casas do cálculo de hectares.
// -----------------------------------------------------------------------------

export interface GeoPoint {
  lat: number;
  lng: number;
}

/**
 * Ray-casting (par-ímpar) — ponto dentro de um anel poligonal simples.
 * @param {GeoPoint} point - Ponto a testar.
 * @param {GeoPoint[]} ring - Vértices do anel (não precisa estar fechado).
 * @return {boolean} `true` se o ponto está dentro do anel.
 */
export function isPointInPolygon(point: GeoPoint, ring: GeoPoint[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const vi = ring[i];
    const vj = ring[j];
    const intersects =
      vi.lng > point.lng !== vj.lng > point.lng &&
      point.lat < ((vj.lat - vi.lat) * (point.lng - vi.lng)) / (vj.lng - vi.lng) + vi.lat;
    if (intersects) inside = !inside;
  }
  return inside;
}

/**
 * Orientação de 3 pontos (sinal do produto vetorial) — bloco de apoio do
 * teste de interseção de segmentos abaixo.
 * @param {GeoPoint} a - 1º ponto.
 * @param {GeoPoint} b - 2º ponto.
 * @param {GeoPoint} c - 3º ponto.
 * @return {number} `0` colinear, `1`/`-1` sentido horário/anti-horário.
 */
function orientation(a: GeoPoint, b: GeoPoint, c: GeoPoint): number {
  const value = (b.lng - a.lng) * (c.lat - a.lat) - (b.lat - a.lat) * (c.lng - a.lng);
  if (Math.abs(value) < 1e-12) return 0;
  return value > 0 ? 1 : -1;
}

/**
 * Ponto colinear `c` está dentro do segmento `[a,b]` (bounding-box check).
 * @param {GeoPoint} a - Início do segmento.
 * @param {GeoPoint} b - Fim do segmento.
 * @param {GeoPoint} point - Ponto colinear a testar.
 * @return {boolean} `true` se `point` está no segmento `[a,b]`.
 */
function onSegment(a: GeoPoint, b: GeoPoint, point: GeoPoint): boolean {
  return (
    Math.min(a.lat, b.lat) - 1e-9 <= point.lat &&
    point.lat <= Math.max(a.lat, b.lat) + 1e-9 &&
    Math.min(a.lng, b.lng) - 1e-9 <= point.lng &&
    point.lng <= Math.max(a.lng, b.lng) + 1e-9
  );
}

/**
 * Interseção de 2 segmentos de reta (caso geral + casos colineares/toque).
 * @param {GeoPoint} p1 - Início do 1º segmento.
 * @param {GeoPoint} p2 - Fim do 1º segmento.
 * @param {GeoPoint} p3 - Início do 2º segmento.
 * @param {GeoPoint} p4 - Fim do 2º segmento.
 * @return {boolean} `true` se os 2 segmentos se cruzam/tocam.
 */
function segmentsIntersect(p1: GeoPoint, p2: GeoPoint, p3: GeoPoint, p4: GeoPoint): boolean {
  const o1 = orientation(p1, p2, p3);
  const o2 = orientation(p1, p2, p4);
  const o3 = orientation(p3, p4, p1);
  const o4 = orientation(p3, p4, p2);

  if (o1 !== o2 && o3 !== o4) return true;

  if (o1 === 0 && onSegment(p1, p2, p3)) return true;
  if (o2 === 0 && onSegment(p1, p2, p4)) return true;
  if (o3 === 0 && onSegment(p3, p4, p1)) return true;
  if (o4 === 0 && onSegment(p3, p4, p2)) return true;

  return false;
}

/**
 * 2 anéis poligonais se sobrepõem — cruzamento de arestas OU contenção total
 * (um anel inteiro dentro do outro, sem cruzar aresta nenhuma).
 * @param {GeoPoint[]} ringA - Anel do 1º polígono (≥ 3 vértices).
 * @param {GeoPoint[]} ringB - Anel do 2º polígono (≥ 3 vértices).
 * @return {boolean} `true` se os 2 anéis se sobrepõem.
 */
export function ringsOverlap(ringA: GeoPoint[], ringB: GeoPoint[]): boolean {
  if (ringA.length < 3 || ringB.length < 3) return false;

  for (let i = 0; i < ringA.length; i += 1) {
    const a1 = ringA[i];
    const a2 = ringA[(i + 1) % ringA.length];
    for (let j = 0; j < ringB.length; j += 1) {
      const b1 = ringB[j];
      const b2 = ringB[(j + 1) % ringB.length];
      if (segmentsIntersect(a1, a2, b1, b2)) return true;
    }
  }

  if (isPointInPolygon(ringA[0], ringB)) return true;
  if (isPointInPolygon(ringB[0], ringA)) return true;

  return false;
}

type GeoJsonPosition = number[]; // [lng, lat, ...]

/** Entrada aceita por `extractOuterRings`/`candidateOverlapsAny` — `Feature`
 *  OU geometria crua, `null`/`undefined` defensivo (parse nunca lança). */
export type PolygonGeoJsonInput = GeoJSON.GeoJsonObject | GeoJSON.Feature | null | undefined;

function ringFromGeoJsonPositions(positions: GeoJsonPosition[]): GeoPoint[] {
  return positions
    .filter((position) => Array.isArray(position) && position.length >= 2)
    .map(([lng, lat]) => ({ lat, lng }));
}

/**
 * Extrai os anéis EXTERNOS (sem furos) de qualquer `Feature`/geometria
 * GeoJSON de Polígono/MultiPolígono — parse DEFENSIVO (geometria ausente/
 * malformada = lista vazia, nunca exceção; mesmo racional de
 * `FarmAreasMap.tsx::parseGeoJson`).
 * @param {PolygonGeoJsonInput} input - Feature ou geometria GeoJSON.
 * @return {Array<GeoPoint[]>} lista de anéis externos (0 se não há polígono).
 */
export function extractOuterRings(input: PolygonGeoJsonInput): GeoPoint[][] {
  if (!input || typeof input !== 'object') return [];

  const geometry =
    'type' in input && input.type === 'Feature'
      ? (input as GeoJSON.Feature).geometry
      : (input as GeoJSON.GeoJsonObject);

  if (!geometry || typeof geometry !== 'object' || !('type' in geometry)) return [];

  if (geometry.type === 'Polygon') {
    const coordinates = (geometry as GeoJSON.Polygon).coordinates;
    const outer = coordinates?.[0];
    return outer ? [ringFromGeoJsonPositions(outer)] : [];
  }

  if (geometry.type === 'MultiPolygon') {
    const coordinates = (geometry as GeoJSON.MultiPolygon).coordinates;
    return (coordinates ?? [])
      .map((polygon) => (polygon?.[0] ? ringFromGeoJsonPositions(polygon[0]) : []))
      .filter((ring) => ring.length > 0);
  }

  if (geometry.type === 'GeometryCollection') {
    return (geometry as GeoJSON.GeometryCollection).geometries.flatMap((child) =>
      extractOuterRings(child)
    );
  }

  return [];
}

/**
 * O anel candidato (polígono sendo desenhado/editado) sobrepõe QUALQUER
 * geometria de uma lista de outras Áreas — usado pelo aviso de sobreposição
 * (CLM-24) antes de comitar `coordinates` (CLM-21 corrigido).
 * @param {GeoPoint[]} candidateRing - Anel do polígono candidato (do desenho Leaflet).
 * @param {PolygonGeoJsonInput[]} others - Geometrias das Áreas irmãs.
 * @return {boolean} `true` se sobrepõe ao menos uma.
 */
export function candidateOverlapsAny(
  candidateRing: GeoPoint[],
  others: PolygonGeoJsonInput[]
): boolean {
  return others.some((other) =>
    extractOuterRings(other).some((otherRing) => ringsOverlap(candidateRing, otherRing))
  );
}
