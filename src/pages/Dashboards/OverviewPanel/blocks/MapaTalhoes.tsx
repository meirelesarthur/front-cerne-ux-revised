// src/pages/Dashboards/OverviewPanel/blocks/MapaTalhoes.tsx
// Bloco #2 — Mapa de talhões (F-211, execução 062). Mirror visual de
// `OverviewPanel.tsx@ffe92bc L.1272-1296` (bloco que "sangra" até a borda do
// card, `DashboardCard bare`) — badge de contagem de talhões no canto
// superior direito, mapa `FarmAreasMap` preenchendo o card.
//
// FASE B (wiring real) — DIVERGÊNCIA da Fase A documentada: o endpoint real
// (`GetHomeOverviewDashboardAction::build()`, confirmado por leitura direta)
// NÃO devolve `crop`/`area_ha` por talhão — só `uuid`/`description`/
// `coordinates`/`color`/`activity_icon_coordinates`. `color` já vem
// RESOLVIDA pelo servidor (`areas.color`, coluna física, default `#f6c23e`)
// — é dado de registro por talhão, não token de tema; usada tal como a API
// entrega, sem reprojeção para a paleta `chart.series.N`.
//
// Perímetro da fazenda (execução 067/F-348, item (b)): o endpoint já
// devolve `map.farm_coordinates` (`OverviewPanelMap.farm_coordinates`) —
// repassado como `perimeter` ao `FarmAreasMap`, que o desenha no MESMO
// `FeatureGroup` das Áreas (backend ZERO, só consumo de dado já existente).

import { Badge, Box, Flex } from '@chakra-ui/react';

import { DashboardCard, FarmAreasMap, CardInfoTooltip } from '@/components/Dashboard';

import { useLanguage } from '@/hooks/useLanguage';

import type { OverviewPanelMapArea } from '@/@types/v2/Dashboards/overviewPanel';

const DEFAULT_AREA_COLOR = '#f6c23e';

interface MapaTalhoesProps {
  areas: OverviewPanelMapArea[];
  /** GeoJSON do perímetro da fazenda (`map.farm_coordinates`) — `null` =
   *  fazenda sem perímetro cadastrado, estado honesto (repassado tal como
   *  vem da API, sem fallback sintético). */
  farmCoordinates: GeoJSON.GeoJsonObject | null;
  isLoading?: boolean;
}

export function MapaTalhoes({ areas, farmCoordinates, isLoading = false }: MapaTalhoesProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.dashboards.overviewPanel.map;

  const mapAreas = areas.map((area) => ({
    id: area.uuid,
    name: area.description,
    color: area.color || DEFAULT_AREA_COLOR,
    coordinates: area.coordinates,
  }));

  return (
    <DashboardCard bare minHeight="560px">
      <Box position="relative" height="560px" overflow="hidden">
        {/* GAP-FE-CONCRETO-1 (execução 062, F-211): o ícone de info estava no
            canto superior ESQUERDO, mesmo canto do controle de zoom nativo do
            Leaflet (`.leaflet-top.leaflet-left`, z-index ~1000 do
            `leaflet.css`) — ficava atrás do controle e inacessível ao hover.
            Card `bare` sem slot de título/`action` do `DashboardCard` — ícone
            de info e badge de contagem agrupados no canto superior DIREITO
            (canto livre do mapa, mesmo lado do slot `action` usado pelos
            demais cards do painel), mesmo fundo/sombra para contraste sobre
            o satélite (item D). */}
        <Flex position="absolute" top="3" right="4" zIndex="1" align="center" gap="2">
          <Flex
            align="center"
            justify="center"
            background="cardBG"
            borderRadius="full"
            boxSize="7"
            boxShadow="cardShadow"
          >
            <CardInfoTooltip content={text.tooltip} />
          </Flex>
          {!isLoading && areas.length > 0 && (
            <Badge colorPalette="green" borderRadius="full" paddingX="2.5" paddingY="1">
              {text.badgeCount.replace('{count}', String(areas.length))}
            </Badge>
          )}
        </Flex>
        <FarmAreasMap
          areas={mapAreas}
          perimeter={farmCoordinates}
          isLoading={isLoading}
          height="560px"
          ariaLabel={text.title}
          emptyTitle={text.emptyTitle}
          emptyDescription={text.emptyDescription}
        />
      </Box>
    </DashboardCard>
  );
}
