// src/pages/CadastrosBase/Fazendas/steps/StepDemarcacao.tsx
// -----------------------------------------------------------------------------
// Etapa 4/6 do wizard de Fazenda — Demarcação (GAP-FE-121 reaberto,
// `TASK-FE-411`/`TASK-FE-412`): mapa Leaflet + `leaflet-draw` restrito a
// POLÍGONO, fiel a `GB.Cerne.UX/src/pages/cadastros/fazendas/steps/Step3Mapa.tsx`
// (`ux_root`), adaptado à stack deste front (Chakra v3 + React Hook Form —
// `setValue`/`getValues` do formulário COMPARTILHADO do wizard, em vez do
// `onChange(field, value)` local do `cerne`).
//
// O perímetro desenhado/importado é a fonte da verdade LOCAL (sem chamada de
// rede): dele derivamos `coordinates` (GeoJSON serializado), a área geodésica
// (`total_area`, ha) e o centróide (`latitude`/`longitude`) — tudo client-side,
// via `L.GeometryUtil.geodesicArea` (extensão do `leaflet-draw`). SEM
// geocodificação reversa (decisão final do dev, `GAP-FE-121`/
// `PLANO-farm-demarcacao-mapa.md` §1.4/§6) — Cidade/Bairro/CEP/País continuam
// 100% manuais em `StepEndereco.tsx`, a Demarcação não os toca.
//
// Step OPCIONAL: avançar sem desenhar nada não bloqueia o wizard
// (`farm-schema.ts::coordinates` é `nullable`, sem `.required()`).
//
// Importação de KML/KMZ (`TASK-FE-412`) — decisão do dev: SEM parse client-side
// (limitação conhecida do `cerne`, que não desempacota `.kmz` de verdade — ver
// `PLANO-farm-demarcacao-mapa.md` §1.3). O upload vai para o endpoint backend
// `POST /api/v1/kml-import` (`TASK-BE-425`), que devolve GeoJSON já pronto —
// desenhado no MESMO `FeatureGroup` do desenho manual (indistinguível do
// resto do form, mesma UX do legado).
// -----------------------------------------------------------------------------

import { ElementType, useCallback, useEffect, useRef, useState } from 'react';

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

import { addSatelliteBaseLayer } from '@/constants/map/satellite-tile-layer';

import { importFarmKml } from '@/services/v2/Farms/farm-kml-service';

import type { FarmFormType } from '@/@types/v2/Farms/farm-admin';

import { StepHeading, type StepProps } from './parts';

import type { UseFormGetValues, UseFormSetValue } from 'react-hook-form';

interface StepDemarcacaoProps extends StepProps {
  getValues: UseFormGetValues<FarmFormType>;
  setValue: UseFormSetValue<FarmFormType>;
}

const ACCEPTED_EXTENSIONS = ['.kml', '.kmz'];

function hasAcceptedExtension(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

/**
 * Anel de coordenadas de um polígono desenhado — mesmo shallow-unwrap do
 * `cerne` (polígono simples, sem furos/multi-parte).
 * @param {L.Layer} layer - Camada do `FeatureGroup` (espera-se um `L.Polygon`).
 * @return {L.LatLng[] | null} anel de vértices, ou `null` se a camada não expõe `getLatLngs`.
 */
function polygonRing(layer: L.Layer): L.LatLng[] | null {
  const candidate = layer as unknown as {
    getLatLngs?: () => L.LatLng[] | L.LatLng[][] | L.LatLng[][][];
  };
  const latlngs = candidate.getLatLngs?.();
  if (!latlngs || latlngs.length === 0) return null;
  const first = latlngs[0];
  return Array.isArray(first) ? (first as L.LatLng[]) : (latlngs as L.LatLng[]);
}

export function StepDemarcacao({ disabled, loading, getValues, setValue }: StepDemarcacaoProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.farms.farm.form;
  const demarcacaoText = text.demarcacao;

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const drawnRef = useRef<L.FeatureGroup | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [hasPerimeter, setHasPerimeter] = useState(false);
  const [areaHa, setAreaHa] = useState<number | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  // Cor do perímetro — token semântico do projeto (`primaryMain`), resolvido
  // para hex porque o Leaflet exige CSS/hex cru nas `PathOptions`, não props
  // do Chakra (mesma técnica de `SpinnerGreenBelt.tsx`/`SvgImage.tsx`).
  const [polygonColor] = useToken('colors', ['primaryMain']);
  const polyStyle: L.PathOptions = {
    color: polygonColor,
    fillColor: polygonColor,
    fillOpacity: 0.15,
  };

  // O perímetro é a fonte da verdade local: dele derivamos `total_area`
  // (área geodésica) e `latitude`/`longitude` (centróide) — sem geocodificação
  // reversa (decisão fechada, GAP-FE-121). `coordinates` também é escrito
  // aqui (GeoJSON serializado do `FeatureGroup` inteiro).
  const applyDrawnState = useCallback(
    (fg: L.FeatureGroup) => {
      const layers = fg.getLayers();

      // `coordinates` — GeoJSON serializado do FeatureGroup inteiro
      const geojson = fg.toGeoJSON() as GeoJSON.FeatureCollection;
      const hasFeatures = (geojson.features?.length ?? 0) > 0;
      setValue('coordinates', hasFeatures ? JSON.stringify(geojson) : null, { shouldDirty: true });

      if (layers.length === 0) {
        setValue('total_area', null, { shouldDirty: true });
        setValue('latitude', '', { shouldDirty: true });
        setValue('longitude', '', { shouldDirty: true });
        setHasPerimeter(false);
        setAreaHa(null);
        return;
      }

      // Área total (ha) — soma geodésica de todos os polígonos do FeatureGroup
      let totalM2 = 0;
      layers.forEach((layer) => {
        const ring = polygonRing(layer);
        if (ring) totalM2 += L.GeometryUtil.geodesicArea(ring);
      });
      const totalHa = totalM2 > 0 ? Math.round((totalM2 / 10000) * 100) / 100 : null;
      if (totalHa !== null) {
        setValue('total_area', totalHa, { shouldDirty: true });
      }

      // Centróide → latitude/longitude (6 casas decimais)
      const center = fg.getBounds().getCenter();
      setValue('latitude', center.lat.toFixed(6), { shouldDirty: true });
      setValue('longitude', center.lng.toFixed(6), { shouldDirty: true });

      setHasPerimeter(true);
      setAreaHa(totalHa);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Corrige os ícones default do Leaflet quebrados pelo bundling do Vite
    // (mesmo patch aplicado pelo `cerne`, `Step3Mapa.tsx`/`MapView.tsx`).
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

    const drawControl = new L.Control.Draw({
      edit: { featureGroup: drawn },
      draw: {
        polygon: { shapeOptions: polyStyle, showArea: true },
        rectangle: false,
        circle: false,
        marker: false,
        circlemarker: false,
        polyline: false,
      },
    });
    map.addControl(drawControl);

    map.on(L.Draw.Event.CREATED, (e) => {
      const event = e as L.DrawEvents.Created;
      drawn.addLayer(event.layer);
      applyDrawnState(drawn);
    });
    map.on(L.Draw.Event.EDITED, () => applyDrawnState(drawn));
    map.on(L.Draw.Event.DELETED, () => applyDrawnState(drawn));

    // Restaura o polígono existente em modo edição (`coordinates` já vindo do
    // `FarmDetailResource`, ver `TASK-FE-410`).
    const existingCoordinates = getValues('coordinates');
    if (existingCoordinates) {
      try {
        const geojson = JSON.parse(existingCoordinates) as GeoJSON.FeatureCollection;
        L.geoJSON(geojson, { style: polyStyle }).eachLayer((layer) => drawn.addLayer(layer));
        if (drawn.getLayers().length > 0) {
          map.fitBounds(drawn.getBounds(), { padding: [24, 24] });
          setHasPerimeter(true);
          const totalArea = getValues('total_area');
          setAreaHa(totalArea ?? null);
        }
      } catch {
        // GeoJSON malformado — ignora, mapa abre vazio (mesmo comportamento do `cerne`)
      }
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      drawnRef.current = null;
    };
    // Efeito de montagem única — replicado 1:1 do `cerne` (`Step3Mapa.tsx`):
    // recriar o mapa a cada render duplicaria a instância do Leaflet.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const importKmlMutation = useMutation({
    mutationFn: importFarmKml,
    onSuccess: (featureCollection) => {
      const drawn = drawnRef.current;
      const map = mapRef.current;
      if (!drawn || !map) return;

      // Substitui, não acumula — mesmo comportamento do `cerne`/legado.
      drawn.clearLayers();
      L.geoJSON(featureCollection, { style: polyStyle }).eachLayer((layer) => {
        drawn.addLayer(layer);
      });

      if (drawn.getLayers().length > 0) {
        map.fitBounds(drawn.getBounds(), { padding: [24, 24] });
      }
      applyDrawnState(drawn);

      toaster.success({
        title: text.steps.demarcacao,
        description: demarcacaoText.importSuccessToast,
        duration: 7000,
      });
    },
    onError: (error) => {
      const resData = isAxiosError(error) ? (error.response?.data as { message?: string }) : null;
      toaster.error({
        title: text.steps.demarcacao,
        description:
          extractApiFieldErrorMessage(error) ?? resData?.message ?? demarcacaoText.importErrorToast,
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
        title: text.steps.demarcacao,
        description: demarcacaoText.importInvalidExtension,
        duration: 7000,
      });
      return;
    }

    setSelectedFileName(selected.name);
    importKmlMutation.mutate(selected);
  }

  return (
    <Box>
      <StepHeading title={text.stepsTitle.demarcacao} subtitle={text.stepsSubtitle.demarcacao} />

      {/* Toolbar — dica de uso + importação de KML (mirror `Step3Mapa.tsx`) */}
      <Flex align="center" justify="space-between" gap={4} mb={3} wrap="wrap">
        <Flex align="center" gap={2}>
          <Icon as={FiMapPin as ElementType} color="fg.muted" boxSize={4} />
          <Text fontSize="sm" color="fg.muted">
            {demarcacaoText.mapHint}
          </Text>
        </Flex>

        <Flex align="center" gap={3}>
          {selectedFileName && (
            <Text fontSize="xs" color="brandColorText">
              {selectedFileName}
            </Text>
          )}
          <Button
            title={
              importKmlMutation.isPending
                ? demarcacaoText.importInProgress
                : demarcacaoText.importButton
            }
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
              {demarcacaoText.perimeterDefinedLabel}
              {areaHa !== null ? ` · ${areaHa} ${demarcacaoText.areaUnit}` : ''}
            </Text>
          </Flex>
        ) : (
          <Text fontSize="sm" color="fg.muted">
            {demarcacaoText.noPerimeter}
          </Text>
        )}
      </Box>
    </Box>
  );
}
