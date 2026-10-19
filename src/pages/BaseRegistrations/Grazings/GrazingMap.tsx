// src/pages/BaseRegistrations/Grazings/GrazingMap.tsx
// -----------------------------------------------------------------------------
// Mapa de SELEÇÃO de piquetes (Áreas já existentes) do Módulo Pastejo
// (TASK-GZ-FE-03) — plugado em `CreateOrUpdateGrazing.tsx` via `Controller
// name="areas"` (RHF), substituindo o placeholder visual deixado pela
// TASK-GZ-FE-02. Ver `Grazing-FrontEnd-contrato.md ## 6` para a tabela
// completa reuso×novo frente a `StepDemarcacao.tsx`.
//
// Diferença estrutural frente a `StepDemarcacao.tsx` (que DESENHA um
// polígono novo com `L.Control.Draw`): aqui não se desenha nada — os
// polígonos já existem (`GET /api/v1/areas`, uma Área = um piquete) e o
// usuário SELECIONA um subconjunto clicando neles. Saída: `areas: string[]`
// (array de `uuid`), nunca GeoJSON serializado.
//
// REUSO literal de `StepDemarcacao.tsx`: init do `L.map`, tile layer de
// satélite (Esri World Imagery, `@/constants/map/satellite-tile-layer`),
// patch de ícones default do Leaflet quebrados pelo Vite. NÃO reusa
// `L.Control.Draw`/`leaflet-draw` como mecanismo de entrada — não há
// desenho aqui.
//
// Fix F-171 (bug — mapa não aparecia, lote 088): AO CONTRÁRIO de
// `StepDemarcacao.tsx` (que renderiza o container do mapa SEMPRE, sem
// early-return antes dele), este componente tem 3 early-returns de
// "Estados de UI" (`!activeFarmUuid`/loading/error) ANTES do
// `<Box ref={containerRef}>` — mesma forma de `FarmAreasMap.tsx`,
// `SitePublicoMap.tsx`, `RastreioMap.tsx` e `TraceabilityMap.tsx`. Por
// isso o efeito de montagem do `L.map` aqui segue o idioma DESSES 4
// componentes (deps alinhadas ao MESMO booleano que gate os early-returns:
// `hasAnyGeometry`/`hasPoint`/`hasAnythingToDraw` → aqui `canMountMap`),
// não o de `StepDemarcacao.tsx` (deps `[]`, container sempre presente).
//
// Exclusividade Área↔Pastejo: ANTES de confirmar uma seleção nova (toggle
// ON), consulta `GET /areas/valid-insert?area_uuid=&grazing_uuid=` (mirror
// `validaAreaInsert` do legado). Se `linked: true` (outra Pastejo já usa a
// Área), a seleção é BLOQUEADA com aviso — a Área só entra na seleção após
// resposta OK do servidor (nunca hidratada só pelo clique local, replicaria
// o defeito do legado que o contrato de API já corrigiu). Deselecionar
// (toggle OFF) NÃO precisa de validação — liberar uma Área nunca gera
// conflito. `grazing_uuid` é passado em modo edição para o próprio Pastejo
// não conflitar consigo mesmo (`AreaValidInsertData::$grazingUuid`, backend).
//
// ⚠️ Este endpoint é UX preventiva, NÃO a garantia de exclusividade — a
// garantia real é a constraint física `UNIQUE(grazing_areas.area_id)` +
// revalidação server-side no `store`/`update` de Pastejo. O 422
// `errors.areas` de uma corrida concorrente é tratado no `onError` do
// submit em `CreateOrUpdateGrazing.tsx` (`## 7.1` do contrato de tela),
// não neste componente.
//
// Recoloração reativa: Áreas SELECIONADAS são pintadas com a cor ATUAL do
// campo `color` do formulário (prop `color`, `useWatch` no componente pai)
// — mudar a cor recolore ao vivo (mirror `maps.js:346-352 changeColor()`).
// Áreas NÃO selecionadas mantêm a cor PRÓPRIA da Área (`area.color`, dado
// de negócio — mesma exceção já aplicada a `polygonColor` em
// `StepDemarcacao.tsx`).
//
// Soma de hectares: preview client-side a partir de `area.total_area` (dado
// do backend, preferido ao recálculo geodésico client-side quando
// disponível) — rotulado explicitamente como preview; o valor autoritativo
// pós-salvamento é `areas_sum_total_area` do `GrazingResource`.
//
// A11y: além do clique no polígono do mapa (interação primária), uma lista
// de chips (`ChakraButton`, mesmo padrão de `grazingColorOptions` em
// `CreateOrUpdateGrazing.tsx`) abaixo do mapa replica o MESMO toggle via
// teclado/leitor de tela (`aria-pressed`, foco nativo) — o mapa Leaflet em
// si não é navegável por teclado, então a seleção nunca fica só
// dependente de mouse/touch.
// -----------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react';

import { Box, Button as ChakraButton, Flex, Icon, Skeleton, Text } from '@chakra-ui/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FiAlertCircle, FiCheck, FiMapPin } from 'react-icons/fi';
import { useContextSelector } from 'use-context-selector';

import { Button } from '@/components/Button';
import { toaster } from '@/components/ui/toaster';

import { AuthContext } from '@/contexts/AuthContext';

import { useLanguage } from '@/hooks/useLanguage';

import { addSatelliteBaseLayer } from '@/constants/map/satellite-tile-layer';
import { queryKey } from '@/constants/query-key';

import { listAreas, validateAreaInsert } from '@/services/v2/BaseRegistrations/areas-service';

import type { AreaListItem } from '@/@types/v2/BaseRegistrations/areas';

const MAP_DEFAULT_CENTER: L.LatLngExpression = [-15.7801, -47.9292];
const MAP_DEFAULT_ZOOM = 5;
// Nenhuma fazenda real deveria ter mais que isso de piquetes — teto de
// segurança do loop de paginação (evita loop indefinido se `total_pages`
// vier corrompido de alguma forma).
const MAX_AREA_PAGES = 50;
const AREAS_PER_PAGE = 100;

export interface GrazingMapProps {
  /** `uuid[]` das Áreas selecionadas — valor controlado pelo `Controller`
   *  RHF (`field.value`) em `CreateOrUpdateGrazing.tsx`. */
  value: string[];
  /** `field.onChange` do `Controller` — recebe o array COMPLETO (não
   *  delta) de `uuid` selecionados. */
  onChange: (value: string[]) => void;
  /** Cor ATUAL do campo `color` do formulário (`useWatch`) — usada para
   *  pintar as Áreas selecionadas (recoloração reativa). */
  color: string;
  /** Presente SÓ em modo edição — o Pastejo sendo editado, para excluir seu
   *  próprio vínculo da checagem de exclusividade (`valid-insert`). */
  grazingUuid?: string;
  isDisabled?: boolean;
}

async function fetchAllAreas(farmUuid: string): Promise<AreaListItem[]> {
  const first = await listAreas({ farm_uuid: farmUuid, per_page: AREAS_PER_PAGE, page: 1 });
  const items = [...first.data.items];
  const totalPages = Math.min(first.data.pagination.total_pages, MAX_AREA_PAGES);

  for (let page = 2; page <= totalPages; page += 1) {
    // eslint-disable-next-line no-await-in-loop -- paginação sequencial deliberada (poucas páginas esperadas)
    const next = await listAreas({ farm_uuid: farmUuid, per_page: AREAS_PER_PAGE, page });
    items.push(...next.data.items);
  }

  return items;
}

function styleForArea(
  area: AreaListItem,
  isSelected: boolean,
  isPending: boolean,
  formColor: string
): L.PathOptions {
  const strokeColor = isSelected ? formColor : area.color;
  return {
    color: strokeColor,
    fillColor: strokeColor,
    fillOpacity: isSelected ? 0.35 : 0.15,
    weight: isSelected ? 3 : 1.5,
    opacity: isPending ? 0.6 : 1,
    dashArray: isPending ? '4 4' : undefined,
  };
}

export function GrazingMap({ value, onChange, color, grazingUuid, isDisabled }: GrazingMapProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.baseRegistrations.grazing;

  // Mesmo padrão de `FarmSwitcher`/`usePermissions.ts` — seletor dedicado
  // direto no `AuthContext`, sem passar por `useAuth()`.
  const activeFarmUuid = useContextSelector(AuthContext, (ctx) => ctx.activeFarmUuid);

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const featureGroupRef = useRef<L.FeatureGroup | null>(null);
  const areaLayersRef = useRef<Map<string, L.GeoJSON>>(new Map());

  const [pendingAreaUuid, setPendingAreaUuid] = useState<string | null>(null);

  // Refs "latest value" — evitam closures obsoletas dentro do listener de
  // clique registrado UMA vez por Área (o listener é recriado só quando a
  // LISTA de Áreas muda, não a cada seleção/troca de cor).
  const valueRef = useRef(value);
  valueRef.current = value;
  const colorRef = useRef(color);
  colorRef.current = color;
  const pendingAreaUuidRef = useRef(pendingAreaUuid);
  pendingAreaUuidRef.current = pendingAreaUuid;
  const grazingUuidRef = useRef(grazingUuid);
  grazingUuidRef.current = grazingUuid;
  const isDisabledRef = useRef(isDisabled);
  isDisabledRef.current = isDisabled;

  const areasQuery = useQuery({
    // Namespace derivado da tradução (`baseRegistrations.grazing`, checklist
    // item de query-key), sem tocar em `query-key.ts` (Área não tem módulo
    // próprio nesta rodada) — mirror da composição já usada por
    // `GRAZINGS_STORAGE_KEY` em `Grazings/index.tsx`.
    queryKey: ['GrazingMapAreas', queryKey.baseRegistrations.grazings, activeFarmUuid],
    queryFn: () => fetchAllAreas(activeFarmUuid as string),
    enabled: !!activeFarmUuid,
  });

  const validateInsertMutation = useMutation({
    mutationFn: validateAreaInsert,
  });

  async function handleAreaClick(area: AreaListItem) {
    if (isDisabledRef.current) return;
    // Só uma validação de cada vez — evita corrida de múltiplos cliques
    // simultâneos enquanto uma checagem de exclusividade está em voo.
    if (pendingAreaUuidRef.current) return;

    const currentValue = valueRef.current;
    const isSelected = currentValue.includes(area.uuid);

    if (isSelected) {
      // Remover NÃO precisa de validação server-side — liberar uma Área
      // nunca gera conflito de exclusividade.
      onChange(currentValue.filter((uuid) => uuid !== area.uuid));
      return;
    }

    setPendingAreaUuid(area.uuid);
    try {
      const response = await validateInsertMutation.mutateAsync({
        area_uuid: area.uuid,
        grazing_uuid: grazingUuidRef.current,
      });

      if (response.data.linked) {
        const occupant = response.data.grazing;
        toaster.warning({
          title: text.map.conflictToast.title,
          description: text.map.conflictToast.description
            .replace('{description}', occupant?.description ?? '')
            .replace('{code}', occupant?.code ?? ''),
          duration: 7000,
        });
        return; // bloqueio preventivo — NÃO entra na seleção
      }

      onChange([...currentValue, area.uuid]);
    } catch {
      toaster.error({
        title: text.map.errorState.title,
        description: text.map.validateErrorToast,
        duration: 7000,
      });
    } finally {
      setPendingAreaUuid(null);
    }
  }

  const handleAreaClickRef = useRef(handleAreaClick);
  handleAreaClickRef.current = handleAreaClick;

  // Fix F-171: MESMO booleano que gate os 3 early-returns de "Estados de
  // UI" abaixo (`!activeFarmUuid` / `areasQuery.isLoading` /
  // `areasQuery.isError`) — o `<Box ref={containerRef}>` só existe no DOM
  // quando `canMountMap` é `true` (ver `return` de sucesso, ao final do
  // arquivo). Causa-raiz do bug: a versão anterior usava deps `[]`
  // (montagem única, mesmo racional de `StepDemarcacao.tsx`) — mas
  // `StepDemarcacao.tsx` renderiza o container SEMPRE (sem early-return
  // antes dele), então lá `containerRef.current` já existe no 1º render.
  // Aqui, na 1ª render com fazenda ativa a query ainda está `isLoading`,
  // o container ainda NÃO existe, o guard `!containerRef.current` abortava
  // a criação do `L.map`, e como o efeito nunca reexecuta com deps `[]`,
  // o mapa NUNCA era criado — caixa vazia mesmo depois da query resolver.
  const canMountMap = !!activeFarmUuid && !areasQuery.isLoading && !areasQuery.isError;

  useEffect(() => {
    if (!canMountMap || !containerRef.current || mapRef.current) return;

    delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    const map = L.map(containerRef.current).setView(MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM);
    addSatelliteBaseLayer(map);

    const group = new L.FeatureGroup();
    group.addTo(map);
    featureGroupRef.current = group;
    mapRef.current = map;

    // Cinto e suspensório: o container vive dentro do `FormContainer` do
    // wizard de Pastejo — troca de aba/reflow pode assentar o layout DEPOIS
    // do `L.map` medir o container (0/poucos px), deixando tile cinza.
    // `ResizeObserver` mirror `FarmAreasMap.tsx`/`SitePublicoMap.tsx`/
    // `RastreioMap.tsx`/`TraceabilityMap.tsx` (mesmo idioma nos 4).
    const resizeObserver = new ResizeObserver(() => map.invalidateSize());
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
      featureGroupRef.current = null;
      areaLayersRef.current.clear();
    };
    // Deps `[canMountMap]` deliberado — mesmo idioma de `FarmAreasMap.tsx`
    // (`hasAnyGeometry`), `SitePublicoMap.tsx`/`RastreioMap.tsx`
    // (`hasPoint`) e `TraceabilityMap.tsx` (`hasAnythingToDraw`): o efeito
    // roda de novo exatamente no render em que o container passa a existir
    // (ou deixa de existir) no DOM.
  }, [canMountMap]);

  // (Re)desenha os polígonos quando a LISTA de Áreas muda (não a cada
  // seleção/cor — isso é responsabilidade do efeito de restilização
  // abaixo). Só aqui o listener de clique é (re)registrado e o
  // `fitBounds` acontece.
  useEffect(() => {
    const map = mapRef.current;
    const group = featureGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();
    areaLayersRef.current.clear();

    const areas = areasQuery.data ?? [];
    areas.forEach((area) => {
      const layer = L.geoJSON(area.coordinates as GeoJSON.GeoJsonObject, {
        style: () =>
          styleForArea(
            area,
            valueRef.current.includes(area.uuid),
            pendingAreaUuidRef.current === area.uuid,
            colorRef.current
          ),
      });
      layer.on('click', () => handleAreaClickRef.current(area));
      layer.addTo(group);
      areaLayersRef.current.set(area.uuid, layer);
    });

    if (areas.length > 0) {
      try {
        map.fitBounds(group.getBounds(), { padding: [24, 24] });
      } catch {
        // GeoJSON degenerado/bounds inválidos — ignora, mantém o view default.
      }
    }
    // Deps intencionalmente só `[areasQuery.data]` — só a LISTA de Áreas
    // recria os layers/listeners; seleção/cor são tratadas pelo efeito de
    // restilização abaixo, via `valueRef`/`colorRef`/`pendingAreaUuidRef`.
  }, [areasQuery.data]);

  // Restilização reativa — seleção (`value`), cor do form (`color`) e
  // estado de validação em voo (`pendingAreaUuid`) recolorem os layers JÁ
  // desenhados, sem recriá-los nem mexer no zoom/bounds atual do usuário.
  useEffect(() => {
    const areas = areasQuery.data ?? [];
    areas.forEach((area) => {
      const layer = areaLayersRef.current.get(area.uuid);
      if (!layer) return;
      layer.setStyle(
        styleForArea(area, value.includes(area.uuid), pendingAreaUuid === area.uuid, color)
      );
    });
  }, [value, color, pendingAreaUuid, areasQuery.data]);

  // ---- Estados de UI --------------------------------------------------
  // Sem fazenda ativa: nenhuma chamada de rede é feita (`enabled` do
  // `useQuery` guarda isso) — estado honesto, não um mapa vazio silencioso.
  if (!activeFarmUuid) {
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
        <Icon as={FiAlertCircle} color="fg.muted" boxSize={5} />
        <Text fontSize="sm" color="fg.muted">
          {text.map.noActiveFarm}
        </Text>
      </Flex>
    );
  }

  if (areasQuery.isLoading) {
    return <Skeleton height="460px" borderRadius="lg" />;
  }

  if (areasQuery.isError) {
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
          onClick={() => areasQuery.refetch()}
        />
      </Flex>
    );
  }

  const areas = areasQuery.data ?? [];
  const isEmpty = areas.length === 0;
  const selectedAreas = areas.filter((area) => value.includes(area.uuid));
  const totalHa =
    Math.round(selectedAreas.reduce((acc, area) => acc + (area.total_area ?? 0), 0) * 100) / 100;

  return (
    <Box>
      <Flex align="center" gap={2} mb={2}>
        <Icon as={FiMapPin} color="fg.muted" boxSize={4} />
        <Text fontSize="sm" color="fg.muted">
          {text.form.hints.areasPlaceholder}
        </Text>
      </Flex>

      <Box
        ref={containerRef}
        height="460px"
        borderRadius="lg"
        border="1px solid"
        borderColor="border.subtle"
        overflow="hidden"
      />

      {isEmpty && (
        <Flex
          align="center"
          gap={2}
          mt={3}
          bg="bg.muted"
          border="1px dashed"
          borderColor="border.subtle"
          borderRadius="lg"
          px={4}
          py={4}
        >
          <Icon as={FiAlertCircle} color="fg.muted" boxSize={5} />
          <Box>
            <Text fontSize="sm" fontWeight="bold" color="fg.muted">
              {text.map.emptyState.title}
            </Text>
            <Text fontSize="sm" color="fg.muted">
              {text.map.emptyState.description}
            </Text>
          </Box>
        </Flex>
      )}

      {!isEmpty && (
        <>
          <Flex align="center" gap={4} mt={3} wrap="wrap">
            <Text fontSize="sm" color="fg.muted">
              {text.map.selectedCountLabel.replace('{count}', String(value.length))}
            </Text>
            <Text fontSize="sm" color="fg.muted">
              {text.map.areaSumPreviewLabel.replace('{value}', String(totalHa))}
            </Text>
          </Flex>

          {/* Lista acessível (teclado/leitor de tela) — replica o MESMO
              toggle do clique no polígono, mirror do padrão de swatch de
              `color` (`ChakraButton` nativo, `type="button"` explícito —
              este bloco está dentro de `<Form onSubmit>`). */}
          <Flex wrap="wrap" gap={2} mt={3}>
            {areas.map((area) => {
              const isSelected = value.includes(area.uuid);
              const isPending = pendingAreaUuid === area.uuid;
              return (
                <ChakraButton
                  key={area.uuid}
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-pressed={isSelected}
                  onClick={() => handleAreaClick(area)}
                  disabled={isDisabled || (pendingAreaUuid !== null && !isPending)}
                  loading={isPending}
                  borderWidth={isSelected ? '2px' : '1px'}
                  borderColor={isSelected ? color : 'border.subtle'}
                  bg={isSelected ? 'bg.muted' : undefined}
                >
                  <Flex align="center" gap={2}>
                    <Box
                      boxSize="10px"
                      borderRadius="full"
                      bg={area.color}
                      border="1px solid"
                      borderColor="border.subtle"
                      flexShrink={0}
                    />
                    <Text fontSize="sm">{area.description}</Text>
                    {isSelected && <Icon as={FiCheck} boxSize={3} color={color} />}
                  </Flex>
                </ChakraButton>
              );
            })}
          </Flex>
        </>
      )}
    </Box>
  );
}

export default GrazingMap;
