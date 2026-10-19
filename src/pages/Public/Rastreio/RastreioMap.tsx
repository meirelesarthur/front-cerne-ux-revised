// src/pages/Public/Rastreio/RastreioMap.tsx
// -----------------------------------------------------------------------------
// Widget de mapa Leaflet READ-ONLY do marcador único de `latlng` (`## 4.9`/
// `## 7` do contrato de tela, F-067, `97-Esteiras/058`, TASK-TR-PUB-FE-04).
// Mirror ESTRUTURAL de `src/pages/Operacional/Rastreabilidade/Traceability/
// TraceabilityMap.tsx` — `parseLatLng` copiado 1:1 (try/catch, validação de
// range lat/lng, null-safe), montagem `L.map` + tile de satélite
// (`@/constants/map/satellite-tile-layer`, Esri World Imagery — ajuste
// transversal "todos os mapas em satélite igual à home") + `ResizeObserver` +
// `invalidateSize()` + marcador único `draggable:false`. SUBTRAÍDO do mirror:
// farm-context/áreas/cerca — esta página só desenha UM ponto (o `latlng` já
// resolvido no payload principal, TASK-TR-PUB-FE-01), SEM query adicional
// (`Hooks: nenhum` na ficha da Tarefa).
//
// Google Maps PROIBIDO (gate da Tarefa) — só Leaflet, zero chave de API
// embutida. A tile layer é Esri World Imagery (ArcGIS REST, provider aberto
// sem chave) — NÃO é Google Maps, o gate permanece respeitado.
//
// Estados: `loading` é responsabilidade do CONSUMIDOR (`index.tsx` já mostra
// um `Spinner` de página inteira enquanto a query-pai está pendente — este
// widget só é montado depois que `query.data` resolve, mirror do slot
// marcado em `index.tsx`); aqui só existem `empty` (`latlng` ausente/
// malformado — mensagem honesta, NUNCA lança exceção, corrige `CL-17`/
// `OQ-05`) e `success` (mapa + marcador + coordenada em texto, `toFixed(6)`,
// `## 5` do contrato de tela).
// -----------------------------------------------------------------------------

import { useEffect, useMemo, useRef } from 'react';

import { Box, Flex, Icon, Text } from '@chakra-ui/react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FiMapPin } from 'react-icons/fi';

import { addSatelliteBaseLayer } from '@/constants/map/satellite-tile-layer';

import type { RastreioPublicoLanguage } from '@/@types/language/module-rastreabilidade/rastreio-publico';

const MAP_ZOOM = 15;
const MAP_DEFAULT_CENTER: L.LatLngExpression = [-15.7801, -47.9292];
const MAP_DEFAULT_ZOOM = 5;

interface RastreioMapProps {
  /** Valor CRU do campo `latlng` (`## 3.2` do `CONTRATO-DESTINO`) — string
   *  JSON `{lat,lng}` OU `null`. O backend NÃO valida/parseia (decisão
   *  explícita do api-architect); o parse defensivo é 100% responsabilidade
   *  deste componente. */
  latlng: string | null;
  text: RastreioPublicoLanguage['map'];
}

interface LatLngPoint {
  lat: number;
  lng: number;
}

// Mirror 1:1 de `TraceabilityMap.tsx::parseLatLng` — try/catch, validação de
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

export function RastreioMap({ latlng, text }: RastreioMapProps) {
  const point = useMemo(() => parseLatLng(latlng), [latlng]);
  const hasPoint = point !== null;

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Montagem única do mapa — só quando existe um ponto válido a desenhar
  // (guard `mapRef.current` evita recriação). Patch de ícones default
  // quebrados pelo bundling do Vite + tile de satélite, mirror `TraceabilityMap.tsx`.
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
    // container muda de tamanho real (mirror `TraceabilityMap.tsx`).
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
  // `TraceabilityMap.tsx` (efeito de desenho isolado do efeito de montagem).
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
      >
        <Icon as={FiMapPin} color="fg.muted" boxSize={5} />
        <Text fontSize="sm" color="fg.muted">
          {text.unavailable}
        </Text>
      </Flex>
    );
  }

  return (
    <Box w="full">
      <Text fontSize="lg" fontWeight="semibold" mb={3}>
        {text.title}
      </Text>
      <Box
        ref={containerRef}
        w="full"
        height="360px"
        borderRadius="lg"
        border="1px solid"
        borderColor="border.subtle"
        overflow="hidden"
      />
      {/* Exibição textual da coordenada — alternativa acessível ao mapa
          visual, mirror `TraceabilityMap.tsx` (`toFixed(6)`, `## 5` do
          contrato de tela — substitui o truncamento por `substr` do
          legado). */}
      <Text fontSize="sm" color="fg.muted" mt={2}>
        {text.coordinatesLabel}: {point.lat.toFixed(6)}, {point.lng.toFixed(6)}
      </Text>
    </Box>
  );
}

export default RastreioMap;
