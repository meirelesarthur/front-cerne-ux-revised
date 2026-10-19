// src/pages/CadastrosBase/Areas/AreaMapEditor.tsx
// -----------------------------------------------------------------------------
// Editor de mapa da Área (F-348/UT-000446, esteira 067, TASK-FE-419,
// SURF-04a/04b) — mapa Leaflet + `leaflet-draw` restrito a POLÍGONO ÚNICO,
// importação de KML e marcadores de atividade/infraestrutura. Componente
// REUSÁVEL: 1 instância por formulário no editor single (TASK-FE-420) e 1
// instância por card no fluxo de múltiplas Áreas (TASK-FE-421).
//
// Bloco de desenho COPIADO (adaptado, não importado cru) de
// `src/pages/CadastrosBase/Fazendas/steps/StepDemarcacao.tsx`
// (`CONTRATO-tela-frontend-area.md §2-bis` — não há hook `useLeafletDraw`
// compartilhado no repo; extrair um é melhoria opcional do dev, não
// obrigatória nesta Tarefa). Diferenças de shape/comportamento frente ao
// perímetro de Fazenda:
//   - `coordinates` de Área é um único `Feature` GeoJSON já desserializado
//     (objeto), NUNCA a `FeatureCollection` serializada em string que
//     `Farm.coordinates` usa — nunca `JSON.parse`/`JSON.stringify` aqui.
//   - Só 1 polígono ativo por vez (mirror legado: o botão de desenho some
//     depois do 1º polígono) — trocamos o `L.Control.Draw` inteiro por uma
//     variante SEM a seção `draw` (`rebuildControl`) em vez de manter draw+
//     edit sempre visíveis como no wizard de Fazenda.
//   - Sobreposição com outra Área da MESMA Fazenda é checada NO CLIENTE
//     (CLM-24 preservado, sem revalidação server) ANTES de comitar
//     `coordinates` — corrige o defeito legado CLM-21 (`maps.js:579-588`,
//     que setava o hidden ANTES da checagem). Ver `useFarmAreaGeometries`
//     (`useAreas.tsx`) e `src/utils/geo/polygon-geometry.ts`.
//   - Ícones de Atividade/Infraestrutura (`activity_icon_coordinates`/
//     `infrastructure_icon_coordinates`) são posicionados no centro do
//     polígono e arrastáveis; sair do polígono ao arrastar reverte a
//     posição + aviso (fiel a `maps.js:991-1020`). O SELECT de
//     Atividade/Infraestrutura pertence ao formulário (TASK-FE-420) — este
//     componente só recebe o(s) `uuid` já selecionado(s) + o `icon_url` JÁ
//     RESOLVIDO pelo chamador (`AreaMapEditorMarkerRef.iconUrl`), mantendo o
//     Select fora do seu escopo. Correção do dono (F-348/UT-000446): o
//     `icon_url` deixou de ser resolvido aqui via `GET /markers/{uuid}`
//     (`getMarkerByUuid`, gated `permission:markers_view`, causava 403 para o
//     usuário comum de Área) — o chamador repassa o dado já presente na
//     MESMA lista ABERTA (`GET /markers/active?type=N`,
//     `useActiveMarkersList`) que alimenta o próprio Select.
//
// Import de KML (SURF-04b): `POST /api/v1/kml-import` via
// `@/services/v2/shared/kml-import-service` (generalizado na TASK-FE-415) —
// devolve `FeatureCollection` (shape novo, matriz A-07). Área só guarda 1
// `Feature`: se o arquivo tiver mais de 1 polígono, só o primeiro é usado
// (aviso ao usuário) — o legado nunca documentou checagem de sobreposição
// para o fluxo de KML (evidence_refs de SURF-04b = IG-07/SURF-09, sem
// CV-01..06/CLM-21), então o import substitui o polígono sem checagem de
// sobreposição (fiel ao as-is), só o desenho/edição manual é checado.
// -----------------------------------------------------------------------------

import { ElementType, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Box, Flex, Icon, Text, useToken } from '@chakra-ui/react';
import { useMutation } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import { FiMapPin, FiUpload } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { extractApiFieldErrorMessage } from '@/utils/extractApiErrorMessage';
import { candidateOverlapsAny, isPointInPolygon } from '@/utils/geo/polygon-geometry';

import type { AreaColorValue } from '@/constants/areas/area/areas-status';
import { addSatelliteBaseLayer } from '@/constants/map/satellite-tile-layer';

import { importKml } from '@/services/v2/shared/kml-import-service';

import type { AreaCoordinates, AreaForm } from '@/@types/v2/BaseRegistrations/areas';

import { useFarmAreaGeometries } from './useAreas';

import type { UseFormGetValues, UseFormSetValue } from 'react-hook-form';

const ACCEPTED_EXTENSIONS = ['.kml', '.kmz'];

function hasAcceptedExtension(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

/**
 * Anel de coordenadas de um polígono desenhado — mesmo shallow-unwrap de
 * `StepDemarcacao.tsx::polygonRing` (polígono simples, sem furos/multi-parte).
 * @param {L.Layer} layer - Camada do `FeatureGroup` (espera-se um `L.Polygon`).
 * @return {L.LatLng[] | null} anel de vértices, ou `null` se a camada não expõe `getLatLngs`.
 */
function polygonRingFromLayer(layer: L.Layer): L.LatLng[] | null {
  const candidate = layer as unknown as {
    getLatLngs?: () => L.LatLng[] | L.LatLng[][] | L.LatLng[][][];
  };
  const latlngs = candidate.getLatLngs?.();
  if (!latlngs || latlngs.length === 0) return null;
  const first = latlngs[0];
  return Array.isArray(first) ? (first as L.LatLng[]) : (latlngs as L.LatLng[]);
}

function pathOptionsForColor(hex: string): L.PathOptions {
  return { color: hex, fillColor: hex, fillOpacity: 0.15 };
}

/** Coordenada de 1 marcador de ícone (atividade/infra) — persistida dentro
 *  dos campos `Record<string, unknown>` do `AreaForm` (shape NÃO fixado
 *  pelo contrato — a coluna backend é `json` genérico sem schema declarado,
 *  `LEGACY_CONTRACT_EXTRACTOR_RESULT.area-cadastro.json::data_contract`;
 *  esta é a forma adotada por esta Tarefa, estável o bastante para 420/
 *  round-trip: `{ key, lat, lng }`, `key` = uuid do Marker). */
interface IconCoordinate {
  key: string;
  lat: number;
  lng: number;
}

interface InfrastructureIconCoordinates {
  items: IconCoordinate[];
}

function isIconCoordinate(value: unknown): value is IconCoordinate {
  return (
    !!value &&
    typeof value === 'object' &&
    typeof (value as IconCoordinate).key === 'string' &&
    typeof (value as IconCoordinate).lat === 'number' &&
    typeof (value as IconCoordinate).lng === 'number'
  );
}

function isInfrastructureIconCoordinates(value: unknown): value is InfrastructureIconCoordinates {
  return (
    !!value &&
    typeof value === 'object' &&
    Array.isArray((value as InfrastructureIconCoordinates).items)
  );
}

export interface AreaMapEditorMarkerRef {
  /** `uuid` do Marker (`markers-service`) — chave de correlação com o
   *  `activity`/`infrastructure` Select do formulário (TASK-FE-420). */
  key: string;
  /** `icon_url` do Marker — resolvido pelo CHAMADOR a partir da MESMA lista
   *  ABERTA (`GET /markers/active?type=N`, `useActiveMarkersList`) que já
   *  alimenta o próprio Select de Atividade/Infraestrutura (correção do dono,
   *  F-348/UT-000446). Este componente NÃO faz mais `GET /markers/{uuid}`
   *  (gated `permission:markers_view`) para resolver o ícone — `null`/
   *  `undefined` cai no `L.Icon.Default()` (pino padrão). */
  iconUrl?: string | null;
}

export interface AreaMapEditorProps {
  getValues: UseFormGetValues<AreaForm>;
  setValue: UseFormSetValue<AreaForm>;
  /** Fazenda-pai da Área — SEMPRE conhecida (rota aninhada, `area-routes.ts`).
   *  Usada para buscar as geometrias das Áreas irmãs (aviso de sobreposição). */
  farmUuid: string;
  /** `uuid` da própria Área em edição — `undefined` em criação. Exclui a
   *  própria Área do conjunto de sobreposição (nunca sobrepõe a si mesma). */
  areaUuid?: string;
  /** Cor ATUAL do campo `color` do formulário (Enum `AreaColor`, 14 cores
   *  fixas — dado de negócio, não token de tema). Pinta o polígono ao vivo. */
  color?: AreaColorValue | null;
  /** GAP-FE-261 Fix II.1 — `coordinates` ATUAL do formulário (RHF `watch`),
   *  PROP REATIVA. Em edição, chega `null` na 1ª renderização e só é
   *  populada quando `fillAreaForm`/`getArea` resolvem (assíncrono) — a
   *  hidratação do polígono existente (efeito `[coordinates]` abaixo)
   *  depende de esta prop mudar, NUNCA de um snapshot lido uma única vez
   *  (`RELATORIOS/GAP-FE-261-causa-raiz-poligono-nao-hidrata-na-edicao.md`). */
  coordinates?: AreaCoordinates | null;
  /** Marker de Atividade selecionado no formulário (420) — `null`/`undefined`
   *  quando nenhum selecionado. */
  activityMarker?: AreaMapEditorMarkerRef | null;
  /** Markers de Infraestrutura selecionados (multi) no formulário (420). */
  infrastructureMarkers?: AreaMapEditorMarkerRef[];
  disabled?: boolean;
  loading?: boolean;
}

/**
 * Editor de mapa da Área — desenho/edição/exclusão de 1 polígono, import de
 * KML e marcadores de atividade/infraestrutura arrastáveis.
 * @param {AreaMapEditorProps} props - Ver contrato de cada campo acima.
 * @return {JSX.Element} Toolbar + mapa Leaflet + status do perímetro.
 */
export function AreaMapEditor({
  getValues,
  setValue,
  farmUuid,
  areaUuid,
  color,
  coordinates,
  activityMarker,
  infrastructureMarkers,
  disabled,
  loading,
}: AreaMapEditorProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.areas.area.mapEditor;
  const textRef = useRef(text);
  textRef.current = text;

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const drawnRef = useRef<L.FeatureGroup | null>(null);
  const controlRef = useRef<L.Control.Draw | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastCommittedFeatureRef = useRef<AreaCoordinates | null>(null);
  const activityMarkerLayerRef = useRef<L.Marker | null>(null);
  const infrastructureMarkerLayersRef = useRef<Map<string, L.Marker>>(new Map());

  const [hasPerimeter, setHasPerimeter] = useState(false);
  const [areaHa, setAreaHa] = useState<number | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  /** GAP-FE-262 — sinal de RENDER de que o `L.map` desta instância (a que
   *  sobreviveu ao ciclo de montagem, não uma passada descartada) está
   *  pronto. Substitui a leitura de prontidão por `mapRef.current` dentro do
   *  efeito de hidratação: sob `React.StrictMode` (dev, `main.tsx`) o efeito
   *  de montagem roda 2x (monta→desmonta→remonta); como state muda entre as
   *  passadas, o efeito de hidratação abaixo é forçado a reavaliar na
   *  passada que fica de pé, mesmo sem `coordinates` mudar
   *  (`RELATORIOS/GAP-FE-262-*.md`). */
  const [mapReady, setMapReady] = useState(false);

  const [primaryMain] = useToken('colors', ['primaryMain']);
  const effectiveColor = color ?? primaryMain;
  const colorRef = useRef(effectiveColor);
  colorRef.current = effectiveColor;

  // -- Geometrias das Áreas irmãs (aviso de sobreposição, CLM-24) ----------
  const { geometries: siblingGeometries } = useFarmAreaGeometries({
    farmUuid,
    excludeAreaUuid: areaUuid,
  });
  const siblingGeometriesRef = useRef(siblingGeometries);
  siblingGeometriesRef.current = siblingGeometries;

  // -- Ícones (Atividade/Infraestrutura) — `icon_url` já vem RESOLVIDO pelo
  // CHAMADOR (`iconUrl` de `AreaMapEditorMarkerRef`), a partir da MESMA lista
  // ABERTA (`GET /markers/active?type=N`) que alimenta o Select do
  // formulário — sem `GET /markers/{uuid}` gated aqui (correção do dono,
  // F-348/UT-000446).
  const activityIconUrl = activityMarker?.iconUrl ?? null;

  const infrastructureIcons = useMemo(
    () =>
      (infrastructureMarkers ?? []).map((marker) => ({
        key: marker.key,
        iconUrl: marker.iconUrl ?? null,
      })),
    [infrastructureMarkers]
  );

  // -- Cascata: total/produtiva/improdutiva + commit de coordinates -------
  const commitFeature = useCallback(
    (feature: AreaCoordinates, ring: L.LatLng[]) => {
      const m2 = L.GeometryUtil.geodesicArea(ring);
      const ha = m2 > 0 ? Math.round((m2 / 10000) * 100) / 100 : 0;

      setValue('coordinates', feature, { shouldDirty: true });
      setValue('total_area', ha, { shouldDirty: true });
      setValue('productive_area', ha, { shouldDirty: true });
      setValue('unproductive_area', 0, { shouldDirty: true });

      lastCommittedFeatureRef.current = feature;
      setHasPerimeter(true);
      setAreaHa(ha);
    },
    [setValue]
  );

  const removeIconLayers = useCallback(() => {
    const map = mapRef.current;
    if (activityMarkerLayerRef.current) {
      if (map) map.removeLayer(activityMarkerLayerRef.current);
      activityMarkerLayerRef.current = null;
    }
    infrastructureMarkerLayersRef.current.forEach((marker) => {
      if (map) map.removeLayer(marker);
    });
    infrastructureMarkerLayersRef.current.clear();
  }, []);

  const clearCommitted = useCallback(() => {
    setValue('coordinates', null, { shouldDirty: true });
    setValue('total_area', 0, { shouldDirty: true });
    setValue('productive_area', 0, { shouldDirty: true });
    setValue('unproductive_area', 0, { shouldDirty: true });
    setValue('activity_icon_coordinates', null, { shouldDirty: true });
    setValue('infrastructure_icon_coordinates', null, { shouldDirty: true });

    lastCommittedFeatureRef.current = null;
    setHasPerimeter(false);
    setAreaHa(null);
    removeIconLayers();
  }, [removeIconLayers, setValue]);

  // -- Controle Leaflet-draw: 2 variantes (com/sem seção `draw`) — some o
  // botão de desenho de polígono depois do 1º polígono (mirror legado,
  // `maps.js:515-517,670-672`). ------------------------------------------
  const rebuildControl = useCallback((allowDraw: boolean, hex: string) => {
    const map = mapRef.current;
    const drawn = drawnRef.current;
    if (!map || !drawn) return;

    if (controlRef.current) {
      map.removeControl(controlRef.current);
      controlRef.current = null;
    }

    const control = new L.Control.Draw({
      edit: { featureGroup: drawn, remove: true },
      ...(allowDraw
        ? {
            draw: {
              polygon: { shapeOptions: pathOptionsForColor(hex), showArea: true },
              rectangle: false,
              circle: false,
              marker: false,
              circlemarker: false,
              polyline: false,
            },
          }
        : {}),
    });
    map.addControl(control);
    controlRef.current = control;
  }, []);

  // -- Montagem única do mapa (mirror `StepDemarcacao.tsx`) ----------------
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    const map = L.map(containerRef.current).setView([-15.7801, -47.9292], 5);
    addSatelliteBaseLayer(map);

    const drawn = new L.FeatureGroup();
    map.addLayer(drawn);
    drawnRef.current = drawn;
    mapRef.current = map;
    setMapReady(true);

    map.on(L.Draw.Event.CREATED, (e) => {
      const event = e as L.DrawEvents.Created;
      const ring = polygonRingFromLayer(event.layer);
      if (!ring) return;

      // CLM-21 corrigido: a checagem de sobreposição acontece ANTES de
      // adicionar a layer ao FeatureGroup e ANTES de tocar `coordinates` —
      // o legado setava o hidden primeiro (bug). Se sobrepõe, a layer NUNCA
      // entra no mapa e nada é comitado.
      if (
        candidateOverlapsAny(
          ring,
          siblingGeometriesRef.current.map((area) => area.coordinates)
        )
      ) {
        toaster.error({
          title: textRef.current.overlapWarningTitle,
          description: textRef.current.overlapWarningDescription,
          duration: 7000,
        });
        return;
      }

      drawn.addLayer(event.layer);
      const feature = event.layer.toGeoJSON() as AreaCoordinates;
      commitFeature(feature, ring);
    });

    map.on(L.Draw.Event.EDITED, (e) => {
      const event = e as L.DrawEvents.Edited;
      const editedLayer = event.layers.getLayers()[0];
      if (!editedLayer) return;

      const ring = polygonRingFromLayer(editedLayer);
      if (!ring) return;

      if (
        candidateOverlapsAny(
          ring,
          siblingGeometriesRef.current.map((area) => area.coordinates)
        )
      ) {
        toaster.error({
          title: textRef.current.overlapWarningTitle,
          description: textRef.current.overlapWarningDescription,
          duration: 7000,
        });
        // Reverte a geometria editada para o último estado comitado —
        // mantém dado e mapa sempre em sincronia (o legado tinha mismatch
        // visual×dado aqui, IG-02, não corrigido explicitamente pelo
        // contrato; reverter é a opção mais segura/honesta de UI).
        const lastValid = lastCommittedFeatureRef.current;
        drawn.clearLayers();
        if (lastValid) {
          L.geoJSON(lastValid, { style: pathOptionsForColor(colorRef.current) }).eachLayer(
            (layer) => drawn.addLayer(layer)
          );
        }
        return;
      }

      const feature = (editedLayer as unknown as { toGeoJSON: () => AreaCoordinates }).toGeoJSON();
      commitFeature(feature, ring);
    });

    map.on(L.Draw.Event.DELETED, () => {
      clearCommitted();
    });

    return () => {
      map.remove();
      mapRef.current = null;
      drawnRef.current = null;
      controlRef.current = null;
      setMapReady(false);
    };
    // Montagem única — mirror `StepDemarcacao.tsx` (recriar o mapa a cada
    // render duplicaria a instância do Leaflet). GAP-FE-261: a restauração
    // do polígono existente NÃO mora mais aqui — ver efeito `[mapReady,
    // coordinates]` logo abaixo (fonte única de verdade para hidratação).
    // GAP-FE-262: sob `React.StrictMode` (dev) este efeito roda 2x — o
    // cleanup acima zera `mapReady` na passada descartada, e a remontagem
    // seguinte sobe `mapReady=true` de novo, forçando o efeito de hidratação
    // a reavaliar na instância de mapa que efetivamente sobrevive.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -- GAP-FE-261/262 — hidratação REATIVA do polígono já existente (edição).
  // Substitui o bloco one-shot que existia dentro do efeito de montagem `[]`
  // acima (removido): aquele bloco lia `getValues('coordinates')` por
  // SNAPSHOT no exato instante da montagem — antes de `fillAreaForm` popular
  // o form via `getArea` (assíncrono). Como o efeito de montagem tem deps
  // vazias, ele nunca re-executava quando o dado finalmente chegava, e o
  // polígono nunca entrava no mapa (`RELATORIOS/GAP-FE-261-causa-raiz-
  // poligono-nao-hidrata-na-edicao.md §1`). `coordinates` é uma PROP REATIVA
  // (`watch('coordinates')` em `CreateOrUpdateArea.tsx`).
  //
  // GAP-FE-262: a guarda antiga (`hydratedFromServerRef` one-shot) quebrava
  // sob `React.StrictMode` (dev, `main.tsx:30`, double-mount) no fluxo
  // "Adicionar Múltiplas Áreas" — o KML já chega SÍNCRONO no 1º render, então
  // este efeito roda na 1ª passada (mapa A), desenha e marca a ref como
  // hidratada; o cleanup da montagem destrói o mapa A; a 2ª passada cria o
  // mapa B vazio, mas como a ref já estava `true` e `coordinates` não mudou,
  // o efeito NÃO reexecutava — mapa B ficava sem polígono. A ref foi REMOVIDA:
  // a idempotência agora vem só de `drawn.getLayers().length > 0` (guarda
  // única, cobre tanto "usuário já desenhou/importou" quanto "já hidratado")
  // e `mapReady` entra nas deps para forçar a reavaliação a cada instância de
  // mapa que efetivamente sobrevive (single/edição continuam OK: `coordinates`
  // null na passada descartada faz o efeito sair cedo, sem custo).
  useEffect(() => {
    const map = mapRef.current;
    const drawn = drawnRef.current;
    if (!map || !drawn) return;
    if (!coordinates) return;
    if (drawn.getLayers().length > 0) return;

    L.geoJSON(coordinates as GeoJSON.GeoJsonObject, {
      style: pathOptionsForColor(colorRef.current),
    }).eachLayer((layer) => drawn.addLayer(layer));

    if (drawn.getLayers().length > 0) {
      map.fitBounds(drawn.getBounds(), { padding: [24, 24] });
      lastCommittedFeatureRef.current = coordinates;
      setHasPerimeter(true);
      setAreaHa(getValues('total_area') ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, coordinates]);

  // -- Controle draw/edit + recoloração ao vivo do polígono já comitado ---
  useEffect(() => {
    rebuildControl(!hasPerimeter, effectiveColor);
  }, [hasPerimeter, effectiveColor, rebuildControl]);

  useEffect(() => {
    drawnRef.current?.setStyle(pathOptionsForColor(effectiveColor));
  }, [effectiveColor]);

  // -- Import de KML (SURF-04b) — substitui, não acumula (mirror `cerne`) --
  const importKmlMutation = useMutation({
    mutationFn: importKml,
    onSuccess: (featureCollection) => {
      const drawn = drawnRef.current;
      const map = mapRef.current;
      if (!drawn || !map) return;

      const polygonFeatures = (featureCollection.features ?? []).filter(
        (feature) =>
          feature.geometry?.type === 'Polygon' || feature.geometry?.type === 'MultiPolygon'
      );

      if (polygonFeatures.length === 0) {
        toaster.error({
          title: text.importButton,
          description: text.importErrorToast,
          duration: 7000,
        });
        return;
      }

      if (polygonFeatures.length > 1) {
        toaster.info({
          title: text.importButton,
          description: text.importMultiplePolygonsToast,
          duration: 7000,
        });
      }

      const feature = polygonFeatures[0] as AreaCoordinates;

      drawn.clearLayers();
      L.geoJSON(feature, { style: pathOptionsForColor(colorRef.current) }).eachLayer((layer) =>
        drawn.addLayer(layer)
      );

      if (drawn.getLayers().length > 0) {
        map.fitBounds(drawn.getBounds(), { padding: [24, 24] });
        const ring = polygonRingFromLayer(drawn.getLayers()[0]);
        if (ring) commitFeature(feature, ring);
      }

      toaster.success({
        title: text.importButton,
        description: text.importSuccessToast,
        duration: 7000,
      });
    },
    onError: (error) => {
      const resData = isAxiosError(error) ? (error.response?.data as { message?: string }) : null;
      toaster.error({
        title: text.importButton,
        description:
          extractApiFieldErrorMessage(error) ?? resData?.message ?? text.importErrorToast,
        duration: 7000,
      });
    },
  });

  function openFilePicker() {
    if (disabled || importKmlMutation.isPending) return;
    fileInputRef.current?.click();
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    event.target.value = '';
    if (!selected) return;

    if (!hasAcceptedExtension(selected.name)) {
      toaster.error({
        title: text.importButton,
        description: text.importInvalidExtension,
        duration: 7000,
      });
      return;
    }

    setSelectedFileName(selected.name);
    importKmlMutation.mutate(selected);
  }

  // -- Marcador de Atividade (único, arrastável, dentro do polígono) ------
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!activityMarker) {
      if (activityMarkerLayerRef.current) {
        map.removeLayer(activityMarkerLayerRef.current);
        activityMarkerLayerRef.current = null;
      }
      setValue('activity_icon_coordinates', null, { shouldDirty: true });
      return;
    }

    const ring =
      drawnRef.current && drawnRef.current.getLayers().length > 0
        ? polygonRingFromLayer(drawnRef.current.getLayers()[0])
        : null;
    if (!ring) return;

    const existing = getValues('activity_icon_coordinates');
    const hydrated =
      isIconCoordinate(existing) && existing.key === activityMarker.key ? existing : null;
    const center = drawnRef.current?.getBounds().getCenter() ?? null;
    const initialLatLng = hydrated ? L.latLng(hydrated.lat, hydrated.lng) : center;
    if (!initialLatLng) return;

    const icon = activityIconUrl
      ? L.icon({ iconUrl: activityIconUrl, iconSize: [32, 32], iconAnchor: [16, 32] })
      : new L.Icon.Default();

    let marker = activityMarkerLayerRef.current;
    if (!marker) {
      marker = L.marker(initialLatLng, { icon, draggable: !disabled });
      marker.on('dragend', () => {
        const position = marker?.getLatLng();
        if (!position) return;
        const currentRing =
          drawnRef.current && drawnRef.current.getLayers().length > 0
            ? polygonRingFromLayer(drawnRef.current.getLayers()[0])
            : null;

        if (currentRing && !isPointInPolygon(position, currentRing)) {
          toaster.error({ description: textRef.current.iconOutsideAreaWarning, duration: 7000 });
          const fallback = drawnRef.current?.getBounds().getCenter();
          if (fallback) {
            marker?.setLatLng(fallback);
            setValue(
              'activity_icon_coordinates',
              { key: activityMarker.key, lat: fallback.lat, lng: fallback.lng },
              { shouldDirty: true }
            );
          }
          return;
        }

        setValue(
          'activity_icon_coordinates',
          { key: activityMarker.key, lat: position.lat, lng: position.lng },
          { shouldDirty: true }
        );
      });
      marker.addTo(map);
      activityMarkerLayerRef.current = marker;
    } else {
      marker.setIcon(icon);
    }

    if (!hydrated) {
      setValue(
        'activity_icon_coordinates',
        { key: activityMarker.key, lat: initialLatLng.lat, lng: initialLatLng.lng },
        { shouldDirty: true }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityMarker, activityIconUrl, hasPerimeter, disabled]);

  // -- Marcadores de Infraestrutura (múltiplos, mesmo comportamento) ------
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const layers = infrastructureMarkerLayersRef.current;
    const currentKeys = new Set(infrastructureIcons.map((marker) => marker.key));

    // Remove os que saíram da seleção do formulário (420).
    layers.forEach((marker, key) => {
      if (!currentKeys.has(key)) {
        map.removeLayer(marker);
        layers.delete(key);
      }
    });

    const ring =
      drawnRef.current && drawnRef.current.getLayers().length > 0
        ? polygonRingFromLayer(drawnRef.current.getLayers()[0])
        : null;

    const existing = getValues('infrastructure_icon_coordinates');
    const hydratedItems = isInfrastructureIconCoordinates(existing) ? existing.items : [];

    const nextItems: IconCoordinate[] = [];

    infrastructureIcons.forEach(({ key, iconUrl }) => {
      const icon = iconUrl
        ? L.icon({ iconUrl, iconSize: [28, 28], iconAnchor: [14, 28] })
        : new L.Icon.Default();

      let marker = layers.get(key);
      const hydrated = hydratedItems.find((item) => item.key === key) ?? null;

      if (!marker) {
        if (!ring) return; // sem polígono ainda, sem centro para posicionar
        const center = drawnRef.current?.getBounds().getCenter() ?? null;
        const initialLatLng = hydrated ? L.latLng(hydrated.lat, hydrated.lng) : center;
        if (!initialLatLng) return;

        marker = L.marker(initialLatLng, { icon, draggable: !disabled });
        marker.on('dragend', () => {
          const position = marker?.getLatLng();
          if (!position) return;
          const currentRing =
            drawnRef.current && drawnRef.current.getLayers().length > 0
              ? polygonRingFromLayer(drawnRef.current.getLayers()[0])
              : null;

          if (currentRing && !isPointInPolygon(position, currentRing)) {
            toaster.error({ description: textRef.current.iconOutsideAreaWarning, duration: 7000 });
            const fallback = drawnRef.current?.getBounds().getCenter();
            if (fallback) marker?.setLatLng(fallback);
          }

          const finalLatLng = marker?.getLatLng();
          if (!finalLatLng) return;
          const currentInfraValue = getValues('infrastructure_icon_coordinates');
          const rest = (
            isInfrastructureIconCoordinates(currentInfraValue) ? currentInfraValue.items : []
          ).filter((item) => item.key !== key);
          setValue(
            'infrastructure_icon_coordinates',
            { items: [...rest, { key, lat: finalLatLng.lat, lng: finalLatLng.lng }] },
            { shouldDirty: true }
          );
        });
        marker.addTo(map);
        layers.set(key, marker);
      } else {
        marker.setIcon(icon);
      }

      const finalLatLng = marker.getLatLng();
      nextItems.push({ key, lat: finalLatLng.lat, lng: finalLatLng.lng });
    });

    if (ring) {
      setValue(
        'infrastructure_icon_coordinates',
        nextItems.length > 0 ? { items: nextItems } : null,
        { shouldDirty: true }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [infrastructureIcons, hasPerimeter, disabled]);

  return (
    <Box>
      {/* Toolbar — dica de uso + importação de KML (mirror `Step3Mapa.tsx` /
          `StepDemarcacao.tsx`, botão de toolbar — UX-GAP-01b default). */}
      <Flex align="center" justify="space-between" gap={4} mb={3} wrap="wrap">
        <Flex align="center" gap={2}>
          <Icon as={FiMapPin as ElementType} color="fg.muted" boxSize={4} />
          <Text fontSize="sm" color="fg.muted">
            {text.mapHint}
          </Text>
        </Flex>

        <Flex align="center" gap={3}>
          {selectedFileName && (
            <Text fontSize="xs" color="brandColorText">
              {selectedFileName}
            </Text>
          )}
          <Button
            title={importKmlMutation.isPending ? text.importInProgress : text.importButton}
            variant="outline"
            icon={FiUpload as ElementType}
            onClick={openFilePicker}
            loading={importKmlMutation.isPending}
            disabled={disabled || loading || importKmlMutation.isPending}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".kml,.kmz"
            style={{ display: 'none' }}
            onChange={handleFileChange}
            aria-hidden="true"
            tabIndex={-1}
          />
        </Flex>
      </Flex>

      {/* Mapa */}
      <Box
        ref={containerRef}
        height="460px"
        borderRadius="lg"
        border="1px solid"
        borderColor="border.subtle"
        overflow="hidden"
      />

      {/* Status */}
      <Box mt={3}>
        {hasPerimeter ? (
          <Flex align="center" gap={2}>
            <Box borderRadius="full" bg="brandColorText" boxSize="8px" flexShrink={0} />
            <Text fontSize="sm" color="brandColorText">
              {text.perimeterDefinedLabel}
              {areaHa !== null ? ` · ${areaHa} ${text.areaUnit}` : ''}
            </Text>
          </Flex>
        ) : (
          <Text fontSize="sm" color="fg.muted">
            {text.noPerimeter}
          </Text>
        )}
      </Box>
    </Box>
  );
}

export default AreaMapEditor;
