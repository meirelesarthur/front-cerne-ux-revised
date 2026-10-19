// src/pages/Operacional/FeedlotMapDashboard/CardCurral.tsx
// Card do Curral (FeedlotCorral) na grade 2D do Mapa de Confinamento —
// TASK-FE-042-201, `LM04-17`. Mirror EXATO (fórmulas e condições de
// visibilidade) de `agro365/resources/js/components/FeedlotMap/CardCurral.js`
// — o CÁLCULO das métricas de origem (`animals_count`/`average_weight`/
// `average_gmd`/`capacity_percent`/`capacity_status`/...) já vem pronto do
// backend (`CorralCardData`); este componente só formata e deriva os campos
// que o legado SEMPRE calculou no cliente (`duration`/`confinement_days`/
// `remaining_days`/`expected_final_weight`/`score_gmd` — comentário de
// `GetFeedlotMapTreeAction`).

import { Box, Flex, Icon, Text, VStack } from '@chakra-ui/react';
import {
  AlertCircle,
  ArrowLeftRight,
  Beef,
  Calendar,
  CalendarCheck,
  Copy,
  Crosshair,
  Flag,
  Gauge,
  Layers,
  Mars,
  Receipt,
  Scale,
  Skull,
  Syringe,
  Tag,
  TrendingUp,
  Venus,
} from 'lucide-react';

import { Actions } from '@/components/Action';
import { Tooltip } from '@/components/TooLtip';

import { feedlotCorralCapacityBands } from '@/constants/FeedlotMap/feedlot-corral-capacity-bands';
import {
  FEEDLOT_CORRAL_EMPTY_STATUSES,
  FEEDLOT_CORRAL_HEAVY_TINT_STATUSES,
  FEEDLOT_CORRAL_MANAGE_BATCHES_STATUSES,
  FEEDLOT_CORRAL_OCCUPIED_STATUSES,
  FEEDLOT_CORRAL_SANITARY_STATUSES,
  feedlotCorralStatus,
  feedlotCorralStatusIcon,
} from '@/constants/FeedlotMap/feedlot-corral-status';

import type { CorralCardData } from '@/@types/v2/FeedlotMap';

const weightFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const scoreFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function formatDisplayDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

function calcDuration(entryStr: string, exitStr: string): number | null {
  const entry = new Date(`${entryStr}T00:00:00`);
  const exit = new Date(`${exitStr}T00:00:00`);
  const diff = Math.round((exit.getTime() - entry.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : null;
}

function calcConfinementDays(entryStr: string): number | null {
  const entry = new Date(`${entryStr}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (entry >= today) return null;
  return Math.round((today.getTime() - entry.getTime()) / (1000 * 60 * 60 * 24));
}

function calcRemainingDays(exitStr: string): number {
  const exit = new Date(`${exitStr}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((exit.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff >= 0 ? diff : 0;
}

interface CardCurralProps {
  corral: CorralCardData;
  isDimmed: boolean;
  onEdit: () => void;
  onChangeStatus: () => void;
  onDuplicate: () => void;
  onManageBatches: () => void;
  onTransferBatch: () => void;
  onUpdateDates: () => void;
  onChangeDiet: () => void;
  onWeighing: () => void;
  onSanitary: () => void;
  /**
   * `DEC-FE-MAP-03` SUPERADA — `MovementSale` agora existe na SPA
   * (`/operacional/venda-animais`). Religa "Vender Animais" ao módulo real
   * (mirror `Setor.js::handleSaleAnimals`, agro365) — navegação para o form
   * de criação com `corral_id` pré-vinculado, não mais um diálogo local do
   * Mapa. Mesmo gate de visibilidade preservado (`animalsCount > 0 &&
   * batchCount > 0`).
   */
  onSellAnimals: () => void;
  onDeath: () => void;
  /** DnD nativo (`GAP-FE-240` resolvido, BUGFIX execução 042) — mirror `CardCurral.js` (`draggable`/`onDragStart`/`onDragOver`/`onDragEnd`/`onDrop`). */
  draggable?: boolean;
  isDragging?: boolean;
  isDropTarget?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}

export function CardCurral({
  corral,
  isDimmed,
  onEdit,
  onChangeStatus,
  onDuplicate,
  onManageBatches,
  onTransferBatch,
  onUpdateDates,
  onChangeDiet,
  onWeighing,
  onSanitary,
  onSellAnimals,
  onDeath,
  draggable = false,
  isDragging = false,
  isDropTarget = false,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
}: CardCurralProps) {
  const animalsCount = corral.animals_count || 0;
  const malesCount = corral.males_count || 0;
  const femalesCount = corral.females_count || 0;
  const batchCount = corral.batches.length;

  const isEmptyStatus = FEEDLOT_CORRAL_EMPTY_STATUSES.includes(corral.status);
  const isSanitaryStatus = FEEDLOT_CORRAL_SANITARY_STATUSES.includes(corral.status);

  // Cor de fundo (LM05) — mirror `CardCurral.js` (`bgColor`).
  let bgColor: string;
  if (corral.status === feedlotCorralStatus.occupied) {
    if (femalesCount > 0 && malesCount > 0) {
      bgColor = 'rgba(0, 153, 0, 0.18)';
    } else if (femalesCount > 0) {
      bgColor = 'rgba(255, 56, 108, 0.18)';
    } else if (malesCount > 0) {
      bgColor = 'rgba(83, 150, 213, 0.18)';
    } else {
      bgColor = hexToRgba(corral.status_color, 0.18);
    }
  } else if (FEEDLOT_CORRAL_HEAVY_TINT_STATUSES.includes(corral.status)) {
    // Mirror `["LI", "EN"].includes(corral.status)` (legado) — tint mais forte.
    bgColor = hexToRgba(corral.status_color, 0.45);
  } else {
    bgColor = hexToRgba(corral.status_color, 0.18);
  }

  const StatusIcon = feedlotCorralStatusIcon[corral.status] ?? Beef;

  // LM08/09/10/11 — datas/duração/confinamento.
  const showDates = !isEmptyStatus && Boolean(corral.entry_date) && Boolean(corral.exit_date);
  const duration = showDates
    ? calcDuration(corral.entry_date as string, corral.exit_date as string)
    : null;
  const confinementDays = showDates ? calcConfinementDays(corral.entry_date as string) : null;
  const remainingDays = showDates ? calcRemainingDays(corral.exit_date as string) : null;

  // LM16 — Peso Prev. Pós Confinamento.
  const expectedFinalWeight =
    remainingDays !== null && corral.expected_adg != null
      ? (corral.average_weight || 0) + remainingDays * corral.expected_adg
      : null;

  // LM17 — Score GMD.
  const performanceScore =
    corral.average_gmd != null && corral.expected_adg != null && corral.expected_adg > 0
      ? (corral.average_gmd / corral.expected_adg) * 100
      : null;
  const performanceColor =
    performanceScore !== null
      ? performanceScore >= 95
        ? '#28a745'
        : performanceScore >= 80
          ? '#ffc107'
          : '#dc3545'
      : null;

  // Disposição melhorada (execução 042, ajuste do dono): bloco esquerdo =
  // identidade/contagem de animais + peso médio; bloco direito = as 4
  // métricas de performance (GMD real, GMD previsto, peso final previsto,
  // score GMD) agrupadas — em vez do agrupamento estrito do legado, que
  // deixava GMD real/previsto à esquerda e só peso final/score à direita.
  //
  // Ajuste do dono (pedido posterior): as métricas de desempenho só fazem
  // sentido em currais que PERMITEM ter animais presentes — Ocupado (`OC`)
  // e Enfermaria (`EN`), mirror `FEEDLOT_CORRAL_OCCUPIED_STATUSES`
  // (`["OC","EN"].includes`, `CardCurral.js` legado, ações "Transferir
  // Lote"/"Atualizar Dados"). Em Vazio/Vazio Sanitário/Manutenção/Limpeza/
  // Interditado (status sem animal possível) os dois blocos ficam ocultos —
  // o card mantém nome/status/datas/liberação, só o bloco de desempenho some.
  const isOccupiedStatus = FEEDLOT_CORRAL_OCCUPIED_STATUSES.includes(corral.status);
  const showAnimalsBlock = isOccupiedStatus && (malesCount > 0 || femalesCount > 0);
  const showPerformanceBlock =
    isOccupiedStatus &&
    (corral.average_gmd !== null ||
      corral.expected_adg !== null ||
      expectedFinalWeight !== null ||
      performanceScore !== null);

  // Tooltip multi-linha do indicador de capacidade — mirror `tooltipLines`
  // (`CardCurral.js`) com MELHORIA sobre o legado: uma faixa por linha, com
  // bolinha (●) na cor correspondente em vez de texto corrido único.
  const capacityTooltipContent = (
    <Box textAlign="left" css={{ whiteSpace: 'nowrap' }}>
      {corral.capacity_percent > 100 && (
        <Text fontSize="xs" fontWeight="bold" color="#ff0000" mb={0.5}>
          ACIMA DA CAPACIDADE!
        </Text>
      )}
      <Text fontSize="xs" fontWeight="bold" mb={1}>
        Capacidade utilizada {corral.capacity_percent.toFixed(2)}%
      </Text>
      <VStack align="flex-start" gap={0.5}>
        {feedlotCorralCapacityBands.map((band) => (
          <Flex key={band.label} align="center" gap={1.5}>
            <Text as="span" color={band.color} fontSize="sm" lineHeight="1">
              ●
            </Text>
            <Text as="span" fontSize="xs">
              {band.label}
            </Text>
          </Flex>
        ))}
      </VStack>
    </Box>
  );

  return (
    <Box
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDrop={onDrop}
      borderWidth="1px"
      borderRadius="md"
      p={1.5}
      width="200px"
      minH="150px"
      overflow="hidden"
      bg={bgColor}
      borderColor={hexToRgba(corral.status_color, 0.4)}
      opacity={isDimmed ? 0.45 : isDragging ? 0.4 : 1}
      filter={isDimmed ? 'grayscale(0.3)' : undefined}
      cursor={draggable ? 'grab' : undefined}
      outline={isDropTarget ? '2px solid' : undefined}
      outlineColor={isDropTarget ? 'brandColorText' : undefined}
      css={{ userSelect: 'none' }}
    >
      <Flex align="center" justify="space-between" gap={1}>
        <Flex
          align="center"
          gap={1}
          cursor="pointer"
          overflow="hidden"
          onClick={onEdit}
          title={corral.name}
          maxW="120px"
        >
          <Flex
            align="center"
            justify="center"
            boxSize="14px"
            borderRadius="full"
            bg={corral.status_color}
            color="white"
            flexShrink={0}
            title={corral.status_label}
          >
            <Icon as={StatusIcon} boxSize="8px" />
          </Flex>
          <Text as="span" fontSize="xs" fontWeight="semibold" lineClamp="1">
            {corral.name}
          </Text>
          <Tooltip content={capacityTooltipContent}>
            <Icon as={AlertCircle} boxSize="12px" color={corral.capacity_status} flexShrink={0} />
          </Tooltip>
        </Flex>
        <Actions size="sm">
          <Actions.Item icon={<Icon as={ArrowLeftRight} />} onClick={onChangeStatus}>
            Alterar Status
          </Actions.Item>
          <Actions.Item icon={<Icon as={Copy} />} onClick={onDuplicate}>
            Duplicar Curral
          </Actions.Item>
          {FEEDLOT_CORRAL_MANAGE_BATCHES_STATUSES.includes(corral.status) && (
            <Actions.Item icon={<Icon as={Layers} />} onClick={onManageBatches}>
              Gerenciar Lotes
            </Actions.Item>
          )}
          {FEEDLOT_CORRAL_OCCUPIED_STATUSES.includes(corral.status) && batchCount > 0 && (
            <Actions.Item icon={<Icon as={ArrowLeftRight} />} onClick={onTransferBatch}>
              Transferir Lote
            </Actions.Item>
          )}
          {FEEDLOT_CORRAL_OCCUPIED_STATUSES.includes(corral.status) && (
            <Actions.Item icon={<Icon as={Calendar} />} onClick={onUpdateDates}>
              Atualizar Dados
            </Actions.Item>
          )}
          <Actions.Item icon={<Icon as={Receipt} />} onClick={onChangeDiet}>
            Alterar Dieta
          </Actions.Item>
          {animalsCount > 0 && (
            <Actions.Item icon={<Icon as={Scale} />} onClick={onWeighing}>
              Realizar Pesagem
            </Actions.Item>
          )}
          {animalsCount > 0 && (
            <Actions.Item icon={<Icon as={Syringe} />} onClick={onSanitary}>
              Realizar Sanitário
            </Actions.Item>
          )}
          {animalsCount > 0 && batchCount > 0 && (
            // `DEC-FE-MAP-03` religada — `MovementSale` já existe na SPA.
            <Actions.Item icon={<Icon as={Tag} />} onClick={onSellAnimals}>
              Vender Animais
            </Actions.Item>
          )}
          {animalsCount > 0 && (
            <Actions.Item icon={<Icon as={Skull} />} onClick={onDeath} tone="danger">
              Lançar Morte
            </Actions.Item>
          )}
        </Actions>
      </Flex>

      {batchCount === 0 && (
        <Box mt={0.5}>
          <Text fontSize="2xs" color="fg.muted">
            {corral.status_label}
          </Text>
          {isSanitaryStatus && corral.available_at && (
            <Flex align="center" gap={1} mt={0.5}>
              <Icon as={CalendarCheck} boxSize="10px" color="fg.muted" />
              <Text fontSize="2xs" color="fg.muted">
                Liberação: {corral.available_at}
              </Text>
            </Flex>
          )}
        </Box>
      )}

      {showDates && (
        <Box mt={1} borderTopWidth="1px" pt={1}>
          <Flex justify="space-between" gap={2}>
            <Box>
              <Text fontSize="2xs" color="fg.muted">
                Entrada
              </Text>
              <Text fontSize="2xs">{formatDisplayDate(corral.entry_date)}</Text>
            </Box>
            <Box>
              <Text fontSize="2xs" color="fg.muted">
                Saída
              </Text>
              <Text fontSize="2xs">{formatDisplayDate(corral.exit_date)}</Text>
            </Box>
          </Flex>
          {(duration !== null || confinementDays !== null) && (
            <Flex justify="space-between" gap={2} mt={0.5}>
              {duration !== null && (
                <Box>
                  <Text fontSize="2xs" color="fg.muted">
                    Duração
                  </Text>
                  <Text fontSize="2xs">{duration}d</Text>
                </Box>
              )}
              {confinementDays !== null && (
                <Box>
                  <Text fontSize="2xs" color="fg.muted">
                    Confin.
                  </Text>
                  <Text fontSize="2xs">{confinementDays}d</Text>
                </Box>
              )}
            </Flex>
          )}
        </Box>
      )}

      {(showAnimalsBlock || showPerformanceBlock) && (
        <Flex mt={1} justify="space-between" align="flex-end" gap={2}>
          {showAnimalsBlock && (
            <VStack align="flex-start" gap={0}>
              {malesCount > 0 && (
                <Flex align="center" gap={1}>
                  <Icon as={Mars} boxSize="10px" />
                  <Text fontSize="2xs">
                    {malesCount} Macho{malesCount !== 1 ? 's' : ''}
                  </Text>
                </Flex>
              )}
              {femalesCount > 0 && (
                <Flex align="center" gap={1}>
                  <Icon as={Venus} boxSize="10px" />
                  <Text fontSize="2xs">
                    {femalesCount} Fêmea{femalesCount !== 1 ? 's' : ''}
                  </Text>
                </Flex>
              )}
              {malesCount > 0 && femalesCount > 0 && animalsCount > 0 && (
                <Flex align="center" gap={1}>
                  <Icon as={Beef} boxSize="10px" />
                  <Text fontSize="2xs">
                    {animalsCount} Animai{animalsCount !== 1 ? 's' : ''}
                  </Text>
                </Flex>
              )}
              <Tooltip content="Peso médio (kg) dos Animais — Soma dos pesos / Qtd Animais">
                <Flex align="center" gap={1} mt={0.5}>
                  <Icon as={Scale} boxSize="10px" />
                  <Text fontSize="2xs">{weightFormatter.format(corral.average_weight || 0)}Kg</Text>
                </Flex>
              </Tooltip>
            </VStack>
          )}
          {showPerformanceBlock && (
            <VStack align="flex-end" gap={0}>
              {corral.average_gmd !== null && (
                <Tooltip content="GMD é calculado c/ pesagens feitas posteriormente a entrada dos lotes no curral.">
                  <Flex align="center" gap={1}>
                    <Icon as={TrendingUp} boxSize="10px" />
                    <Text fontSize="2xs">{weightFormatter.format(corral.average_gmd)}Kg/GMD</Text>
                  </Flex>
                </Tooltip>
              )}
              {corral.expected_adg !== null && (
                <Flex align="center" gap={1}>
                  <Icon as={Crosshair} boxSize="10px" />
                  <Text fontSize="2xs">{weightFormatter.format(corral.expected_adg)}Kg/d/Prev</Text>
                </Flex>
              )}
              {expectedFinalWeight !== null && (
                <Tooltip content="Peso Prev. Pós Confinamento: dias rest. conf. x gmd prev.">
                  <Flex align="center" gap={1}>
                    <Icon as={Flag} boxSize="10px" />
                    <Text fontSize="2xs">{weightFormatter.format(expectedFinalWeight)}Kg</Text>
                  </Flex>
                </Tooltip>
              )}
              {performanceScore !== null && (
                <Tooltip content="Score GMD: (GMD Real / GMD Prev.) x 100 — ≥95% bom; 80-94,99% atenção; <80% baixo.">
                  <Flex align="center" gap={1} cursor="help">
                    <Icon as={Gauge} boxSize="10px" color={performanceColor ?? undefined} />
                    <Text fontSize="2xs" fontWeight="bold" color={performanceColor ?? undefined}>
                      {scoreFormatter.format(performanceScore)}%
                    </Text>
                  </Flex>
                </Tooltip>
              )}
            </VStack>
          )}
        </Flex>
      )}
    </Box>
  );
}
