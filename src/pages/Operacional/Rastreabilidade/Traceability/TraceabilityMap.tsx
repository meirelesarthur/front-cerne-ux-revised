// src/pages/Operacional/Rastreabilidade/Traceability/TraceabilityMap.tsx
// -----------------------------------------------------------------------------
// Widget de mapa DISPLAY READ-ONLY (`traceability_config_uuid`, FD-38
// `latlng` do Produto) (TASK-TR-FE-10, F-067 — Rastreabilidade). Plugado em
// `CreateOrUpdateTraceability.tsx` (TASK-TR-FE-06), seção "Área e
// disponibilidade".
//
// Mirror de fidelidade `mapBuild()` do legado (`agro365/public/js/
// map_traceability.js`, verificado pelo Maestro): o legado desenha a
// FAZENDA ATIVA por padrão na carga do form — ANTES de qualquer Produtor
// ser selecionado. Fix de fidelidade (parte 2): SEM `configUuid`, o mapa
// busca o farm-context da fazenda ATIVA (`getTraceabilityFarmContext`, `X-
// Farm-Id`); COM `configUuid`, troca para o farm-context do Produtor/
// Configuração selecionado (`getTraceabilityConfigFarmContext`, `## 1.2`/
// `## 6.6` do contrato) — MESMO shape de resposta nos dois casos
// (`TraceabilityConfigFarmContext`, Resource físico compartilhado no
// servidor). Em ambos os casos, desenha:
//   1. Cada ÁREA (pasto) como polígono geoJSON com sua `color` própria +
//      tooltip PERMANENTE (`description`).
//   2. A CERCA da fazenda (`farm.coordinates`, geoJSON — pode chegar como
//      string JSON crua ou já objeto, `null` se a Fazenda não tiver
//      perímetro desenhado, mirror `StepDemarcacao.tsx`).
//   3. O MARCADOR do produto em `latlng` (se houver); sem `latlng` ainda mas
//      com uma Área selecionada (`area_uuid`), o marcador cai no CENTRO da
//      Área (display-only, não escreve no campo — mirror "ao escolher uma
//      Área, o marcador vai para o centro da área" do legado).
// `fitBounds` no conjunto (pastos + cerca + marcador).
//
// Decisão ratificada `## 9.1` do contrato de tela
// (`97-Esteiras/058/ROTEIROS/CONTRATO-TELA-F067-produtos-rastreabilidade.md`):
// o legado habilita controles de DESENHO (Geoman) sem NENHUM efeito real
// (`D10`, defeito confirmado). Este widget continua SÓ LEITURA — não recria
// os controles de desenho mortos, não instala `leaflet-geoman`/`leaflet-draw`.
//
// Parse defensivo de TODO geoJSON consumido aqui (string OU objeto já
// desserializado) — nunca lança; dado ausente/malformado é estado de UI
// honesto (Lei "SEM MOCK mascarando integração"), nunca um mapa fantasma
// centrado em [0,0].
//
// Mirror ESTRUTURAL de `src/pages/BaseRegistrations/Grazings/GrazingMap.tsx`
// (montagem do `L.map`, `FeatureGroup`, patch dos ícones default quebrados
// pelo bundling do Vite, loading/error/empty) e `CadastrosBase/Fazendas/
// steps/StepDemarcacao.tsx` (parse defensivo de `coordinates` string) — SEM
// o mecanismo de seleção/clique/desenho daqueles widgets (aqui não há
// interação, só leitura; `draggable:false` no marcador).
// -----------------------------------------------------------------------------

import { useEffect, useMemo, useRef } from 'react';

import { Box, Flex, Icon, Skeleton, Text, useToken } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FiAlertCircle, FiMapPin } from 'react-icons/fi';

import { Button } from '@/components/Button';

import { useLanguage } from '@/hooks/useLanguage';

import { addSatelliteBaseLayer } from '@/constants/map/satellite-tile-layer';

import { getTraceabilityConfigFarmContext } from '@/services/v2/Rastreabilidade/traceability-config-service';
import { getTraceabilityFarmContext } from '@/services/v2/Rastreabilidade/traceability-service';

import type { TraceabilityConfigFarmContextArea } from '@/@types/v2/Rastreabilidade/traceability-config';

const MAP_ZOOM = 15;
const MAP_DEFAULT_CENTER: L.LatLngExpression = [-15.7801, -47.9292];
const MAP_DEFAULT_ZOOM = 5;

export interface TraceabilityMapProps {
  /** `traceability_config_uuid` (Produtor/Configuração) selecionado no form
   *  — dirige a busca/desenho do farm-context (mirror `mapBuild()` legado).
   *  `null`/`undefined` = SEM Produtor selecionado → o mapa desenha a
   *  FAZENDA ATIVA por padrão (fix de fidelidade, `getTraceabilityFarmContext`). */
  configUuid: string | null | undefined;
  /** Valor CRU do campo `latlng` (FD-38) do form — JSON `{lat,lng}` ou `''`. */
  latlng: string;
  /** `area_uuid` selecionado no form (opcional) — sem `latlng` ainda, o
   *  marcador é centrado nesta Área (display-only, mirror legado). */
  areaUuid?: string | null;
}

interface LatLngPoint {
  lat: number;
  lng: number;
}

function parseLatLng(raw: string): LatLngPoint | null {
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
    // JSON malformado — estado neutro, nunca quebra o resto do form.
    return null;
  }
}

// Parse defensivo — geoJSON pode chegar como string JSON crua (`farm.
// coordinates`, mirror `StepDemarcacao.tsx`) ou já como objeto desserializado
// (`area.coordinates`, mirror `AreaListItem.coordinates`). Nunca lança.
function parseGeoJson(raw: unknown): GeoJSON.GeoJsonObject | null {
  if (!raw) return null;
  if (typeof raw === 'object') return raw as GeoJSON.GeoJsonObject;
  if (typeof raw !== 'string') return null;

  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed) as GeoJSON.GeoJsonObject;
  } catch {
    return null;
  }
}

export function TraceabilityMap({ configUuid, latlng, areaUuid }: TraceabilityMapProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.rastreabilidade.traceability.form;

  const [primaryColor] = useToken('colors', ['primaryMain']);

  const point = useMemo(() => parseLatLng(latlng), [latlng]);
  const hasPoint = point !== null;

  const farmContextQuery = useQuery({
    // Namespace local, mirror `GrazingMapAreas` (`GrazingMap.tsx`) — a chave
    // distingue os 2 casos (fazenda ATIVA por padrão vs. fazenda do
    // Produtor/Configuração selecionado) para refetch/isolamento de cache
    // corretos ao trocar `configUuid`.
    queryKey: ['TraceabilityMapFarmContext', configUuid ?? 'active-farm'],
    queryFn: () =>
      configUuid ? getTraceabilityConfigFarmContext(configUuid) : getTraceabilityFarmContext(),
    // Sempre há um contexto a desenhar — SEM Produtor selecionado, a
    // fazenda ATIVA (fix de fidelidade, mirror `mapBuild()` legado); COM
    // Produtor, a fazenda do Config.
    enabled: true,
  });

  const farmContext = farmContextQuery.data?.data;
  const areas: TraceabilityConfigFarmContextArea[] = farmContext?.areas ?? [];
  const farmFence = useMemo(() => parseGeoJson(farmContext?.farm?.coordinates), [farmContext]);

  const selectedArea = useMemo(
    () => (areaUuid ? areas.find((area) => area.uuid === areaUuid) : undefined),
    [areas, areaUuid]
  );
  const selectedAreaGeoJson = useMemo(
    () => (selectedArea ? parseGeoJson(selectedArea.coordinates) : null),
    [selectedArea]
  );

  const isLoadingFarmContext = farmContextQuery.isLoading;
  const isErrorFarmContext = farmContextQuery.isError;
  // "Nenhuma localização definida" só aparece quando o contexto resolvido
  // (ATIVO ou do Config) NÃO tem nenhuma área, cerca nem `latlng` — nunca
  // mais por falta de Produtor (fix de fidelidade).
  const hasAnythingToDraw = hasPoint || areas.length > 0 || !!farmFence;

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const layersGroupRef = useRef<L.FeatureGroup | null>(null);

  // Montagem única do mapa — só quando existe algo REAL a desenhar (guard
  // `mapRef.current` evita recriação). Patch de ícones/tile layer mirror
  // `GrazingMap.tsx`/`StepDemarcacao.tsx` — SEM `L.Control.Draw`/Geoman
  // (nada a desenhar manualmente aqui).
  useEffect(() => {
    if (!hasAnythingToDraw) return;
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

    const group = new L.FeatureGroup();
    group.addTo(map);
    layersGroupRef.current = group;
    mapRef.current = map;

    // Cinto e suspensório: o container pode inicializar com 0/poucos px de
    // largura ANTES do layout do pai assentar (ex. flex/grid ainda medindo,
    // troca de tab) — o Leaflet nunca recalcula sozinho. `ResizeObserver`
    // chama `invalidateSize()` sempre que o container muda de tamanho real
    // (mirror do racional de `GrazingMap.tsx`/`StepDemarcacao.tsx` para o
    // mesmo problema de container Leaflet colapsado).
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      layersGroupRef.current = null;
    };
    // Deps `[hasAnythingToDraw]` deliberado — a montagem só depende de HAVER
    // algo a desenhar; o CONTEÚDO (áreas/cerca/marcador) é aplicado pelo
    // efeito de (re)desenho abaixo, mesmo racional do widget original
    // (deps `[hasPoint]` na montagem única).
  }, [hasAnythingToDraw]);

  // (Re)desenha pastos + cerca + marcador — mirror `mapBuild()` legado:
  // 1) Áreas coloridas com tooltip permanente; 2) cerca da fazenda;
  // 3) marcador do produto (latlng ou centro da Área selecionada);
  // fitBounds no conjunto.
  useEffect(() => {
    const map = mapRef.current;
    const group = layersGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();
    if (markerRef.current) {
      map.removeLayer(markerRef.current);
      markerRef.current = null;
    }

    // 1) Pastos (Áreas) — polígono geoJSON + cor própria (dado de negócio,
    // mesma exceção já aplicada em `GrazingMap.tsx::styleForArea`) + tooltip
    // permanente com a descrição.
    areas.forEach((area) => {
      const geometry = parseGeoJson(area.coordinates);
      if (!geometry) return;

      const color = area.color || primaryColor;
      const layer = L.geoJSON(geometry, {
        style: { color, fillColor: color, fillOpacity: 0.25, weight: 2 },
      });
      layer.bindTooltip(area.description, { permanent: true, direction: 'center' });
      layer.addTo(group);
    });

    // 2) Cerca da fazenda — sem preenchimento, tracejada, para se distinguir
    // visualmente dos pastos (mirror `polyStyle` de `StepDemarcacao.tsx`,
    // adaptado a contorno).
    if (farmFence) {
      L.geoJSON(farmFence, {
        style: { color: primaryColor, fillOpacity: 0, weight: 3, dashArray: '6 4' },
      }).addTo(group);
    }

    // 3) Marcador do produto — `latlng` persistido tem prioridade; sem
    // `latlng` ainda, cai no centro da Área selecionada (display-only, NÃO
    // escreve no campo).
    const markerPosition: L.LatLngExpression | null = point
      ? [point.lat, point.lng]
      : selectedAreaGeoJson
        ? L.geoJSON(selectedAreaGeoJson).getBounds().getCenter()
        : null;

    if (markerPosition) {
      markerRef.current = L.marker(markerPosition, { draggable: false }).addTo(map);
    }

    // fitBounds no conjunto (pastos + cerca + marcador).
    const boundsLayers = [...group.getLayers(), ...(markerRef.current ? [markerRef.current] : [])];
    if (boundsLayers.length > 0) {
      try {
        const bounds = new L.FeatureGroup(boundsLayers).getBounds();
        map.fitBounds(bounds, { padding: [24, 24], maxZoom: MAP_ZOOM });
      } catch {
        // GeoJSON degenerado/bounds inválidos — ignora, mantém o view atual.
      }
    }
  }, [areas, farmFence, point, selectedAreaGeoJson, primaryColor]);

  // ---- Estados de UI --------------------------------------------------
  if (isLoadingFarmContext) {
    return <Skeleton height="360px" borderRadius="lg" />;
  }

  if (isErrorFarmContext) {
    return (
      <Flex
        direction="column"
        align="center"
        gap={3}
        bg="bg.muted"
        border="1px dashed"
        borderColor="border.subtle"
        borderRadius="lg"
        px={4}
        py={6}
      >
        <Icon as={FiAlertCircle} color="fg.muted" boxSize={6} />
        <Text fontSize="sm" fontWeight="bold" color="fg.muted">
          {text.map.errorState.title}
        </Text>
        <Text fontSize="sm" color="fg.muted">
          {text.map.errorState.description}
        </Text>
        <Button
          title={text.map.errorState.retry}
          type="button"
          variant="outline"
          size="sm"
          onClick={() => farmContextQuery.refetch()}
        />
      </Flex>
    );
  }

  // Contexto resolvido (fazenda ATIVA ou do Produtor/Configuração) mas SEM
  // nenhum dado geográfico real (nem áreas, nem cerca, nem marcador) —
  // estado neutro, honesto quanto à ausência de dado.
  if (!hasAnythingToDraw) {
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
        <Box>
          <Text fontSize="sm" fontWeight="bold" color="fg.muted">
            {text.map.emptyState.title}
          </Text>
          <Text fontSize="sm" color="fg.muted">
            {text.map.emptyState.description}
          </Text>
        </Box>
      </Flex>
    );
  }

  return (
    <Box w="full">
      <Box
        ref={containerRef}
        w="full"
        height="360px"
        borderRadius="lg"
        border="1px solid"
        borderColor="border.subtle"
        overflow="hidden"
      />
      {/* Exibição textual da coordenada do marcador — alternativa acessível
          (leitor de tela/print) à interação visual do mapa, mirror da lista
          de chips de `GrazingMap.tsx`. */}
      {hasPoint && (
        <Text fontSize="sm" color="fg.muted" mt={2}>
          {point.lat.toFixed(6)}, {point.lng.toFixed(6)}
        </Text>
      )}
    </Box>
  );
}

export default TraceabilityMap;
