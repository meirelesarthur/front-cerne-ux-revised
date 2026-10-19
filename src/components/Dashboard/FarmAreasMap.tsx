// src/components/Dashboard/FarmAreasMap.tsx
// Mapa de talhões SÓ-LEITURA (execução 062, TASK-FE-211-02 — F-211 Painel de
// Controle) — GAP-COMPONENTE-MAPA (`PainelControle-Frontend-Contrato.md
// §4/§7`): não existia no fork um mapa read-only de N áreas coloridas por
// cultura com tooltip; `GrazingMap.tsx` é seleção (clique alterna vínculo) e
// `TraceabilityMap.tsx` desenha um único produto/config por vez. Este
// componente REUSA a montagem Leaflet dos dois (patch de ícones default
// quebrados pelo Vite, tile layer OSM, `ResizeObserver`+`invalidateSize`,
// cleanup no unmount) sem recriar uma 4ª integração do zero, e fica em
// `components/Dashboard/` por ser primitiva de DASHBOARD (não de
// cadastro/formulário) — reutilizável por outras dashboards com mapa no
// futuro.
//
// Fidelidade ao `cerne`: mirror de `FarmAreasMap` do design system
// (`GB.Cerne.UX/src/components/ui/FarmAreasMap.tsx`) — adaptação de stack:
// o UX desenha polígonos mock com SVG próprio; aqui o polígono é geoJSON
// real via Leaflet (`L.geoJSON`), cor por área, tooltip ao hover.
//
// Ajuste transversal "todos os mapas em satélite igual à home" (execução
// F-348/Áreas): a tile layer de satélite Esri (fix F-211 abaixo) foi
// extraída para `@/constants/map/satellite-tile-layer` — este componente é
// a REFERÊNCIA CANÔNICA que os outros 6 mapas Leaflet do fork passaram a
// seguir; o comportamento visual permanece idêntico ao de antes da extração.
//
// GAP-FE-260 (execução 067/F-348, residual do GAP-FE-CRIT-01): o `rAF`
// único que existia aqui supunha que 1 frame após o mount o container já
// tinha layout final — falso em navegação client-side (React Router) e em
// `reload()` do `DetalheArea.tsx` (o card ainda está assentando no 1º
// paint), fazendo o Leaflet cachear `_size` como 0x0 e nunca requisitar
// tile (0 tiles, confirmado no diagnóstico E2E do Tester). O `rAF` foi
// REMOVIDO; o `ResizeObserver` passa a ser a ÚNICA fonte de verdade sobre
// "o container tem tamanho usável agora" — só chamamos `invalidateSize`/
// `fitBounds` quando ele reporta width/height > 0, e ele continua ativo
// durante toda a vida do mapa (cobre tanto o container já nascer com
// tamanho final — `page.goto` novo — quanto ganhar tamanho depois —
// client-nav/reload).
//
// GAP-FE-260 Fix A (diagnóstico de causa raiz, `RELATORIOS/GAP-FE-260-
// causa-raiz-mapa-em-branco.md §3`): a causa raiz real não era timing de
// medida — era um DESALINHAMENTO efeito↔DOM. `DetalheArea.tsx` combina
// `areaQuery`+`farmQuery` num único `isLoading` (OR), enquanto o mapa só
// depende de `areaQuery`. Quando `areaQuery` resolvia ANTES de `farmQuery`,
// existia um commit intermediário em que `hasAnyGeometry` já virava `true`
// mas o `<div ref>` ainda não tinha montado (branch `Skeleton` do
// `isLoading` combinado) — o antigo `useEffect([hasAnyGeometry])` disparava
// nesse commit, encontrava `containerRef.current === null` e saía; quando o
// container finalmente montava, `hasAnyGeometry` não mudava de novo e o
// efeito NUNCA re-executava — `L.map` nunca era criado (0 tiles). Corrigido
// substituindo `useRef`+`useEffect([hasAnyGeometry])` por um CALLBACK REF:
// o `L.map` agora nasce no exato momento em que o `<div>` é anexado ao DOM
// (ciclo de vida atrelado ao NÓ REAL, não a um flag derivado de query) e é
// destruído no desanexo. Complementado pelo Fix B em `DetalheArea.tsx`
// (isLoading area-only para o mapa).
//
// Fix "zoom da home" (execução 067/F-348, item (a)): na home o container do
// mapa nasce com altura FIXA (560px, `MapaTalhoes.tsx`), então o
// `ResizeObserver` costuma disparar UMA ÚNICA notificação (o tamanho nunca
// muda de novo). Como o grupo só era desenhado pelo `useEffect([areas])`
// (passivo — roda DEPOIS do commit/paint), existia uma corrida: se a 1ª
// notificação do RO chegasse antes desse efeito, `fitToBounds` via
// `group.getLayers().length === 0` e saía; como o RO nunca disparava de
// novo (container não redimensiona), `fitBounds` NUNCA rodava com o grupo
// preenchido — mapa ficava preso no zoom/centro default (Brasil). Corrigido
// tornando o próprio callback do `ResizeObserver` responsável por desenhar
// (`drawGroup`) ANTES de enquadrar, sempre que encontrar o grupo vazio —
// elimina a dependência de ordem entre o RO e o efeito passivo. `fitBounds`
// também ganhou um guard explícito de `bounds.isValid()` (reforço ao
// try/catch já existente) — mesma blindagem "sem geometria/bounds
// degenerados nunca lança, mantém o view atual".
//
// Perímetro da fazenda (execução 067/F-348, item (b) — melhoria, backend
// ZERO): o endpoint da home já devolve `map.farm_coordinates` (GeoJSON) —
// só não era consumido. Novo prop opcional `perimeter` é desenhado no MESMO
// `FeatureGroup` das Áreas (para o `fitBounds` enquadrar fazenda+áreas
// juntas) com ESTILO DISTINTO (`@/constants/map/farm-perimeter-style` —
// contorno neutro tracejado, sem preenchimento, não-interativo, SEM
// tooltip) e adicionado ANTES das Áreas (fica por baixo — nunca captura
// hover que pertence a uma Área sobreposta). `hasAnyGeometry` passou a
// considerar também o perímetro (fazenda com perímetro e sem Áreas ainda
// mostra o mapa, não o empty-state).

import { useCallback, useEffect, useRef } from 'react';

import { Flex, Skeleton, Text, useToken } from '@chakra-ui/react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FiMapPin } from 'react-icons/fi';

import { Icon } from '@/components/Icon';

import { buildFarmPerimeterStyle } from '@/constants/map/farm-perimeter-style';
import { addSatelliteBaseLayer } from '@/constants/map/satellite-tile-layer';

const MAP_DEFAULT_CENTER: L.LatLngExpression = [-15.7801, -47.9292];
const MAP_DEFAULT_ZOOM = 5;

export interface FarmAreasMapArea {
  id: string;
  name: string;
  subtitle?: string;
  color: string;
  fillOpacity?: number;
  /** GeoJSON da área — string JSON crua ou objeto já desserializado (parse defensivo, nunca lança). */
  coordinates: GeoJSON.GeoJsonObject | string | null;
}

export interface FarmAreasMapProps {
  areas: FarmAreasMapArea[];
  /** GeoJSON do perímetro da fazenda (opcional) — desenhado no MESMO
   *  `FeatureGroup` das áreas, com estilo distinto (contorno neutro
   *  tracejado, sem tooltip). String JSON crua ou objeto já desserializado
   *  (mesmo parse defensivo de `FarmAreasMapArea['coordinates']`); `null`/
   *  ausente = fazenda sem perímetro cadastrado, estado honesto. */
  perimeter?: GeoJSON.GeoJsonObject | string | null;
  isLoading?: boolean;
  height?: string | number;
  ariaLabel?: string;
  emptyTitle: string;
  emptyDescription?: string;
}

// Parse defensivo (mirror `TraceabilityMap.tsx::parseGeoJson`) — geoJSON
// malformado/ausente é estado de UI honesto, nunca um mapa centrado em
// [0,0] nem exceção não tratada. Aceita `undefined` (prop `perimeter`
// opcional) além de `null`/string/objeto (`FarmAreasMapArea['coordinates']`).
function parseGeoJson(
  raw: GeoJSON.GeoJsonObject | string | null | undefined
): GeoJSON.GeoJsonObject | null {
  if (!raw) return null;
  if (typeof raw === 'object') return raw;
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed) as GeoJSON.GeoJsonObject;
  } catch {
    return null;
  }
}

// GAP-FE-260 — único critério de "posso desenhar tiles/bounds agora": o
// container tem dimensão REAL (>0x0). `clientWidth/Height` força a leitura
// do layout já resolvido pelo browser no instante da chamada (nunca um
// valor cacheado stale).
function hasValidSize(container: HTMLDivElement | null): boolean {
  return !!container && container.clientWidth > 0 && container.clientHeight > 0;
}

// (Re)desenha o snapshot de `perimeter` + `areas` no grupo — extraído para
// ser chamado tanto pelo efeito de redesenho (mudança de `areas`/
// `perimeter`) quanto pelo callback do `ResizeObserver`, quando este
// encontra o grupo ainda vazio (fix "zoom da home", ver header do arquivo),
// sem duplicar a lógica de estilo/tooltip em 2 lugares.
//
// Ordem deliberada: perímetro ANTES das áreas — fica por baixo no
// `FeatureGroup`/SVG, então uma Área sobreposta sempre captura o hover no
// lugar dele (reforçado por `interactive: false` no estilo do perímetro,
// `@/constants/map/farm-perimeter-style`).
function drawGroup(
  group: L.FeatureGroup,
  areas: FarmAreasMapArea[],
  perimeter: GeoJSON.GeoJsonObject | string | null | undefined,
  perimeterStrokeColor: string
) {
  group.clearLayers();

  const perimeterGeometry = parseGeoJson(perimeter);
  if (perimeterGeometry) {
    L.geoJSON(perimeterGeometry, {
      style: buildFarmPerimeterStyle(perimeterStrokeColor),
    }).addTo(group);
  }

  areas.forEach((area) => {
    const geometry = parseGeoJson(area.coordinates);
    if (!geometry) return;

    const layer = L.geoJSON(geometry, {
      style: {
        color: area.color,
        fillColor: area.color,
        fillOpacity: area.fillOpacity ?? 0.28,
        weight: 2,
      },
    });
    layer.bindTooltip(area.subtitle ? `${area.name} · ${area.subtitle}` : area.name, {
      sticky: true,
      direction: 'top',
    });
    layer.addTo(group);
  });
}

/**
 * Mapa read-only de áreas/talhões — N polígonos coloridos com tooltip.
 * @return {JSX.Element} Skeleton (loading) | estado vazio | mapa Leaflet.
 */
export function FarmAreasMap({
  areas,
  perimeter = null,
  isLoading = false,
  height = '100%',
  ariaLabel,
  emptyTitle,
  emptyDescription,
}: FarmAreasMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const groupRef = useRef<L.FeatureGroup | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const areasRef = useRef(areas);
  areasRef.current = areas;
  const perimeterRef = useRef(perimeter);
  perimeterRef.current = perimeter;
  // Cor do contorno do perímetro — token de paleta CRU `white` (estável em
  // light/dark, ver `@/constants/map/farm-perimeter-style`), resolvido para
  // hex porque o Leaflet exige CSS/hex cru em `PathOptions` (mesma técnica
  // de `StepDemarcacao.tsx::polygonColor`).
  const [perimeterStrokeColor] = useToken('colors', ['white']);
  const perimeterStrokeColorRef = useRef(perimeterStrokeColor);
  perimeterStrokeColorRef.current = perimeterStrokeColor;
  // GAP-FE-260 — função de "ajustar ao container/bounds atuais", recriada a
  // cada montagem do mapa e reaproveitada tanto pelo `ResizeObserver` quanto
  // pelo efeito de redesenho por `areas`/`perimeter` (mesma lógica, uma só
  // fonte).
  const fitToBoundsRef = useRef<(() => void) | null>(null);

  const hasAnyGeometry =
    areas.some((area) => !!parseGeoJson(area.coordinates)) || !!parseGeoJson(perimeter);

  // GAP-FE-260 Fix A — CALLBACK REF: cria o `L.map` no exato momento em que
  // o nó `<div>` é anexado ao DOM (React chama callback refs de forma
  // SÍNCRONA na fase de commit, antes de qualquer `useEffect` passivo) e o
  // destrói no desanexo (`node === null`). Isso elimina a classe inteira de
  // "efeito disparou num commit em que o branch com o container não estava
  // montado" — o ciclo de vida do mapa passa a depender do NÓ REAL, nunca de
  // `hasAnyGeometry` (flag derivado de query que pode virar `true` antes do
  // container existir, ver GAP-FE-260 §1). Mesmo racional de montagem de
  // `GrazingMap.tsx`/`TraceabilityMap.tsx` (patch de ícones, tile layer,
  // cleanup) — só a fonte do ciclo de vida mudou.
  const setContainerNode = useCallback((node: HTMLDivElement | null) => {
    containerRef.current = node;

    if (!node) {
      // Desanexado do DOM — cleanup (mirror do antigo `return () => {...}`).
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      fitToBoundsRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
      groupRef.current = null;
      return;
    }

    if (mapRef.current) return; // idempotente — nunca recria com o mapa já vivo.

    delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    const map = L.map(node, { attributionControl: false }).setView(
      MAP_DEFAULT_CENTER,
      MAP_DEFAULT_ZOOM
    );
    // Fix wave F-211 (execução 062), item D: camada base trocada de OSM (rua)
    // para satélite (Esri World Imagery) — default satélite, sem toggle
    // (opção "mais limpa" do dispatch: mapa de talhões é leitura de geometria
    // de área, satélite dá contexto real do terreno sem exigir 2ª tile layer).
    // URL/options/`maxNativeZoom` (fix do placeholder cinza em zona rural)
    // vivem em `@/constants/map/satellite-tile-layer` — ponto único
    // reutilizado pelos outros 6 mapas Leaflet do fork (comportamento
    // idêntico ao anterior, só a duplicação foi eliminada).
    addSatelliteBaseLayer(map);

    const group = new L.FeatureGroup();
    group.addTo(map);
    groupRef.current = group;
    mapRef.current = map;

    // Fix "zoom da home" — `bounds.isValid()` é um guard EXPLÍCITO antes de
    // `fitBounds` (reforço ao try/catch abaixo, que continua como rede de
    // segurança para qualquer outro erro de geometria degenerada do
    // Leaflet): grupo vazio ou com geometria sem extensão válida nunca deve
    // tentar enquadrar — mantém o view atual em vez de lançar/mover o mapa
    // para um estado indefinido.
    const fitToBounds = () => {
      map.invalidateSize();
      if (group.getLayers().length === 0) return;
      const bounds = group.getBounds();
      if (!bounds.isValid()) return;
      try {
        map.fitBounds(bounds, { padding: [24, 24] });
      } catch {
        // GeoJSON degenerado/bounds inválidos — mantém o view atual.
      }
    };
    fitToBoundsRef.current = fitToBounds;

    // GAP-FE-260 — o `ResizeObserver` é a ÚNICA fonte usada para decidir
    // "posso desenhar/ajustar agora": o browser sempre dispara uma 1ª
    // notificação pouco depois de `.observe()` com o tamanho ATUAL do
    // elemento (cobre o container já nascer com tamanho final — `page.goto`
    // novo) e CONTINUA disparando toda vez que o tamanho mudar de novo
    // (cobre o container nascer em 0 e ganhar tamanho depois — client-nav e
    // `reload()`, os 2 caminhos que falhavam). Só chamamos
    // `invalidateSize`/`fitBounds` quando a notificação reporta
    // width/height > 0 — nunca com o container ainda zerado.
    //
    // Fix "zoom da home": containers de altura FIXA (ex. `MapaTalhoes.tsx`,
    // 560px) costumam disparar só ESTA notificação (nunca redimensionam de
    // novo depois) — se o grupo ainda estiver vazio neste ponto (o
    // `useEffect([areas, perimeter])` é passivo e pode não ter rodado
    // ainda), desenhamos AQUI antes de enquadrar, em vez de sair e nunca
    // mais tentar. Idempotente com o efeito: quando ele rodar depois,
    // redesenha o mesmo snapshot sem efeito colateral.
    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0]?.contentRect ?? { width: 0, height: 0 };
      if (width <= 0 || height <= 0) return;
      if (group.getLayers().length === 0) {
        drawGroup(group, areasRef.current, perimeterRef.current, perimeterStrokeColorRef.current);
      }
      fitToBounds();
    });
    resizeObserver.observe(node);
    resizeObserverRef.current = resizeObserver;

    // Cinto e suspensório síncrono: se o container já mede >0 no instante
    // da anexação (layout já resolvido, ex. `page.goto` direto), não
    // esperamos a notificação assíncrona do observer — idempotente com ela
    // (roda de novo sem efeito colateral quando o observer também disparar).
    if (hasValidSize(node)) {
      fitToBounds();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // (Re)desenha o perímetro + polígonos quando `areas`/`perimeter` mudam.
  // Permanece em `useEffect` — React executa callback refs de forma
  // SÍNCRONA na fase de commit, antes dos efeitos passivos, então
  // `mapRef`/`groupRef` já existem aqui mesmo no commit inicial de montagem
  // (nenhum `fitBounds` é perdido: este efeito roda sempre que `areas`/
  // `perimeter` mudam, inclusive na 1ª vez). Redundância segura frente ao
  // fix "zoom da home" no `ResizeObserver`: se este efeito rodar primeiro,
  // `drawGroup` aqui já preenche o grupo e o RO só ajusta; se o RO rodar
  // primeiro (container de altura fixa, 1ª notificação síncrona), ele
  // mesmo desenha — este efeito redesenha o mesmo snapshot depois, sem
  // efeito colateral (idempotente).
  useEffect(() => {
    const map = mapRef.current;
    const group = groupRef.current;
    if (!map || !group) return;

    drawGroup(group, areasRef.current, perimeterRef.current, perimeterStrokeColorRef.current);

    // GAP-FE-260 — só ajusta bounds aqui se o container já tiver dimensão
    // real; do contrário o `ResizeObserver` (mesma instância do mapa,
    // montado pelo callback ref) faz isso assim que medir um tamanho válido —
    // `fitToBoundsRef` sempre lê o grupo já redesenhado acima, então nenhum
    // `fitBounds` é perdido, só adiado até o container ficar mensurável.
    if (hasValidSize(containerRef.current)) {
      fitToBoundsRef.current?.();
    }
  }, [areas, perimeter, perimeterStrokeColor]);

  if (isLoading) {
    return <Skeleton height={height} width="100%" borderRadius="inherit" />;
  }

  if (!hasAnyGeometry) {
    return (
      <Flex
        align="center"
        justify="center"
        direction="column"
        gap="2"
        height={height}
        width="100%"
        background="cardBG"
        padding="4"
      >
        <Icon as={FiMapPin} boxSize={6} color="cardTextSecondary" />
        <Text fontSize="sm" fontWeight="bold" color="cardTextPrimary" textAlign="center">
          {emptyTitle}
        </Text>
        {emptyDescription && (
          <Text fontSize="xs" color="cardTextSecondary" textAlign="center">
            {emptyDescription}
          </Text>
        )}
      </Flex>
    );
  }

  return (
    <div
      ref={setContainerNode}
      style={{ width: '100%', height: typeof height === 'number' ? `${height}px` : height }}
      role="img"
      aria-label={ariaLabel}
    />
  );
}

export default FarmAreasMap;
