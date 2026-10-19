// src/pages/Public/Site/SitePublicoMap.tsx
// -----------------------------------------------------------------------------
// Mapa Leaflet READ-ONLY do marcador único de `farm.coordinates` (97-Esteiras/
// 061, TASK-SITE-13, `05-CONTRATO-TELA-pagina-publica-site.md ## 1` linha 5 /
// `## 3` SUR-PUB-09).
//
// Mirror ESTRUTURAL de `src/pages/Public/Rastreio/RastreioMap.tsx` (mesmo
// `parseLatLng`, mesma montagem Leaflet + tile de satélite via
// `@/constants/map/satellite-tile-layer` + `ResizeObserver`, mesma proibição
// de Google Maps — Esri World Imagery NÃO é Google Maps) — NÃO import direto
// (`latlng`/`coordinates` são domínios de dados distintos, `## 7` do contrato
// de tela). Sem ferramentas de desenho (read-only, `05-CONTRATO-TELA... §248-255`).
//
// A exibição textual de `farm.latitude`/`farm.longitude` fica em
// `ContactSection.tsx` (campo cru separado, `## 1` do contrato de tela) —
// este componente NUNCA duplica essa string, só desenha o marcador a partir
// do JSON cru `farm.coordinates`.
//
// Estados: `empty` (`coordinates` ausente/malformado — mensagem honesta,
// NUNCA lança exceção, mirror `CL-17`/`OQ-05` de F-067) e `success` (mapa +
// marcador). `loading` é responsabilidade do consumidor (`index.tsx`, só
// monta este widget depois que `query.data` resolve).
// -----------------------------------------------------------------------------

import { useEffect, useMemo, useRef } from 'react';

import { Box, Flex, Icon, Text } from '@chakra-ui/react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FiMapPin } from 'react-icons/fi';

import { addSatelliteBaseLayer } from '@/constants/map/satellite-tile-layer';

const MAP_ZOOM = 15;
const MAP_DEFAULT_CENTER: L.LatLngExpression = [-15.7801, -47.9292];
const MAP_DEFAULT_ZOOM = 5;

interface SitePublicoMapProps {
  /** Valor CRU do campo `farm.coordinates` (`PublicSiteFarm.coordinates`) —
   *  string JSON `{lat,lng}` OU `null`. O backend NÃO valida/parseia; o
   *  parse defensivo é 100% responsabilidade deste componente. */
  coordinates: string | null;
  /** `content.map.unavailable` — único rótulo do dicionário para este
   *  componente (`## 6` do contrato de tela). */
  unavailableText: string;
}

interface LatLngPoint {
  lat: number;
  lng: number;
}

// Mirror 1:1 de `RastreioMap.tsx::parseLatLng` — try/catch, validação de
// range lat/lng, null-safe. NUNCA lança exceção (fixture malformada/`null`
// testada, corrige `CL-17`/`OQ-05`).
function parseLatLng(raw: string | null): LatLngPoint | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;

  try {
    const parsed = JSON.parse(trimmed) as Partial<LatLngPoint>;
    const { lat, lng } = parsed;

    if (
      typeof lat !== 'number' ||
      typeof lng !== 'number' ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      return null;
    }

    return { lat, lng };
  } catch {
    // JSON malformado — estado neutro, nunca quebra o resto da tela.
    return null;
  }
}

export function SitePublicoMap({ coordinates, unavailableText }: SitePublicoMapProps) {
  const point = useMemo(() => parseLatLng(coordinates), [coordinates]);
  const hasPoint = point !== null;

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Montagem única do mapa — só quando existe um ponto válido a desenhar
  // (guard `mapRef.current` evita recriação). Patch de ícones default
  // quebrados pelo bundling do Vite + tile de satélite, mirror `RastreioMap.tsx`.
  useEffect(() => {
    if (!hasPoint) return;
    if (!containerRef.current || mapRef.current) return;

    delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    const map = L.map(containerRef.current, { attributionControl: true }).setView(
      MAP_DEFAULT_CENTER,
      MAP_DEFAULT_ZOOM
    );
    addSatelliteBaseLayer(map);

    mapRef.current = map;

    // Cinto e suspensório: o container pode inicializar com 0/poucos px de
    // largura ANTES do layout do pai assentar — o Leaflet nunca recalcula
    // sozinho. `ResizeObserver` chama `invalidateSize()` sempre que o
    // container muda de tamanho real (mirror `RastreioMap.tsx`).
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [hasPoint]);

  // (Re)posiciona o marcador único — separado da montagem, mirror
  // `RastreioMap.tsx` (efeito de desenho isolado do efeito de montagem).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !point) return;

    if (markerRef.current) {
      map.removeLayer(markerRef.current);
    }
    markerRef.current = L.marker([point.lat, point.lng], { draggable: false }).addTo(map);
    map.setView([point.lat, point.lng], MAP_ZOOM);
  }, [point]);

  if (!point) {
    return (
      <Flex
        align="center"
        gap={2}
        bg="bg.muted"
        border="1px dashed"
        borderColor="border.subtle"
        borderRadius="lg"
        px={4}
        py={6}
        w="full"
        h="360px"
      >
        <Icon as={FiMapPin} color="fg.muted" boxSize={5} />
        <Text fontSize="sm" color="fg.muted">
          {unavailableText}
        </Text>
      </Flex>
    );
  }

  return (
    <Box
      ref={containerRef}
      w="full"
      height="360px"
      borderRadius="lg"
      border="1px solid"
      borderColor="border.subtle"
      overflow="hidden"
    />
  );
}

export default SitePublicoMap;
