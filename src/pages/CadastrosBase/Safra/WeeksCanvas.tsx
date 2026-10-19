// src/pages/CadastrosBase/Safra/WeeksCanvas.tsx
// -----------------------------------------------------------------------------
// Grade visual de Semanas da Safra — componente COMPARTILHADO entre TASK-FE-009
// (formulário, `editable=true`) e TASK-FE-010 (Detalhe, `editable=false`).
//
// Adaptação (NÃO cópia) de `GB.Cerne.UX/.../WeekCanvas.tsx` (commit 73b5fa86)
// para Chakra UI v3 + tokens semânticos desta SPA: troca `style={}`/`t.*`/
// `useTheme()` por `Box`/`Flex`/tokens (`bg.muted`, `border.subtle`,
// `fg.muted`) e reaproveita `DeleteConfirmDialog`/`Tooltip` já existentes no
// catálogo desta SPA (em vez do `ConfirmDialog` próprio do design system).
// Preserva o COMPORTAMENTO (agrupamento por ano/mês, pintura por clique e por
// arrasto, navegação por teclado, ciclo de cores, distribuição, faixa de
// visão geral), não o CSS-in-JS literal.
//
// NÃO é componente de catálogo (`@/components/`) — vive dentro do módulo de
// Safra, mesmo critério de localidade que `ApportionmentsSection` (Centro de
// Custo, em `CreateOrUpdateCentroCusto.tsx`) usou para uma seção/interação
// sem precedente de reuso em outros módulos hoje.
//
// Recebe `weeks: WeekVintagePayload[]` — o MESMO shape simples do payload
// real (`number_week/start_date/end_date/color`), não um tipo `GeneratedWeek`
// à parte, para funcionar tanto com semanas recém-geradas (TASK-FE-009)
// quanto com semanas vindas prontas do servidor (TASK-FE-010, que nunca
// passam por `generateWeeks`). `year`/`month` (para agrupar) são sempre
// DERIVADOS de `start_date` via `getWeekYearMonth` — nunca lidos de um campo
// à parte — então não há dois "donos" da mesma informação.
//
// Escopo conscientemente reduzido em relação à Referência UX (documentado
// para o Tester/Arquiteto avaliarem):
//   - Sem marcadores de mês sob a faixa de "visão geral" (só a tira colorida
//     + tooltip por segmento) — os cabeçalhos de mês já aparecem na grade
//     principal; repetir sob a faixa era redundante para o ganho.
//   - Sem tooltip por tile na grade principal — cada tile já mostra
//     número/abreviação/datas como texto visível; um tooltip adicional
//     duplicaria informação já legível (mantido só na faixa de visão geral,
//     onde NÃO há texto visível nos segmentos).
//   - Animações de hover reduzidas ao mínimo (mudança de borda/sombra, sem
//     `transform`) — redução de risco/escopo num componente já grande.
// -----------------------------------------------------------------------------

import { ElementType, useEffect, useMemo, useRef, useState } from 'react';

import { Badge, Box, Button as ChakraButton, Flex, Text } from '@chakra-ui/react';
import { FiRotateCcw } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { Tooltip } from '@/components/ui/tooltip';

import type { ModuleHarvests } from '@/@types/language/module-harvests';
import type { WeekVintagePayload } from '@/@types/v2/Harvests';

import {
  getWeekYearMonth,
  isCurrentWeek,
  resolveWeekColorKey,
  WEEK_COLOR_CYCLE,
  WEEK_COLOR_PALETTE,
} from './safra-weeks';

import type { WeekColorKey } from './safra-weeks';

type WeeksText = ModuleHarvests['harvest']['form']['weeks'];

/** `WeekColorKey` (com hífen, chave de payload) → chave camelCase do dicionário i18n. */
const COLOR_LABEL_PROP: Record<WeekColorKey, keyof WeeksText['colorLabels']> = {
  amarelo: 'amarelo',
  'azul-claro': 'azulClaro',
  'azul-escuro': 'azulEscuro',
  'azul-marinho': 'azulMarinho',
  branco: 'branco',
  marrom: 'marrom',
  palha: 'palha',
  preto: 'preto',
  rosa: 'rosa',
};

function colorLabel(weeksText: WeeksText, key: WeekColorKey): string {
  return weeksText.colorLabels[COLOR_LABEL_PROP[key]];
}

// 'YYYY-MM-DD' → 'DD/MM' — exibição compacta no tile (dia/mês, mesma ordem
// da Referência UX; o ano já aparece no cabeçalho do grupo).
function toDayMonth(isoDate: string): string {
  return `${isoDate.slice(8, 10)}/${isoDate.slice(5, 7)}`;
}

interface WeekEntry {
  week: WeekVintagePayload;
  index: number;
}

interface MonthGroup {
  month: number;
  items: WeekEntry[];
}

interface YearGroup {
  year: number;
  months: MonthGroup[];
}

// Agrupa por ano → mês, na ordem em que `weeks` chega (mesma lógica de
// `groupWeeks` da Referência UX).
function groupWeeks(weeks: WeekVintagePayload[]): YearGroup[] {
  const groups: YearGroup[] = [];
  weeks.forEach((week, index) => {
    const { year, month } = getWeekYearMonth(week);
    let yearGroup = groups.find((group) => group.year === year);
    if (!yearGroup) {
      yearGroup = { year, months: [] };
      groups.push(yearGroup);
    }
    let monthGroup = yearGroup.months.find((group) => group.month === month);
    if (!monthGroup) {
      monthGroup = { month, items: [] };
      yearGroup.months.push(monthGroup);
    }
    monthGroup.items.push({ week, index });
  });
  return groups;
}

export interface WeeksCanvasProps {
  weeks: WeekVintagePayload[];
  editable: boolean;
  /** Chamado ao pintar UM tile com a cor ativa da paleta (não usado quando `editable=false`). */
  onWeekColorChange?: (index: number, color: WeekColorKey) => void;
  /** Chamado ao confirmar "Reiniciar ciclo de cores" (não usado quando `editable=false`). */
  onResetCycle?: () => void;
  /** Chamado pelo CTA do estado vazio (ex.: focar o campo de data). Só usado quando `editable=true`. */
  onEmptyAction?: () => void;
  /** Cabeçalho opcional (usado por TASK-FE-010 — a tela de Detalhe, sem o contexto de um form ao redor). */
  desc?: string;
  iniLabel?: string;
  fimLabel?: string;
  /** Fatia i18n do módulo (mesmo padrão de `ApportionmentsSectionProps.text` em Centro de Custo). */
  text: ModuleHarvests['harvest'];
}

export function WeeksCanvas({
  weeks,
  editable,
  onWeekColorChange,
  onResetCycle,
  onEmptyAction,
  desc,
  iniLabel,
  fimLabel,
  text,
}: WeeksCanvasProps) {
  const weeksText = text.form.weeks;
  const monthNames = text.form.monthOptions;

  const gridRef = useRef<HTMLDivElement>(null);
  const isPaintingRef = useRef(false);
  const [selectedColor, setSelectedColor] = useState<WeekColorKey>(WEEK_COLOR_CYCLE[0]);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const grouped = useMemo(() => groupWeeks(weeks), [weeks]);

  const distribution = useMemo(() => {
    const dist: Partial<Record<WeekColorKey, number>> = {};
    weeks.forEach((week) => {
      const key = resolveWeekColorKey(week.color);
      dist[key] = (dist[key] ?? 0) + 1;
    });
    return dist;
  }, [weeks]);

  function paint(index: number) {
    if (!editable) return;
    onWeekColorChange?.(index, selectedColor);
  }

  function focusTile(index: number) {
    gridRef.current?.querySelector<HTMLElement>(`[data-week-idx="${index}"]`)?.focus();
  }

  function handleTileKeyDown(event: React.KeyboardEvent, index: number) {
    switch (event.key) {
      case 'Enter':
      case ' ':
        if (editable) {
          event.preventDefault();
          paint(index);
        }
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        focusTile(Math.min(index + 1, weeks.length - 1));
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        focusTile(Math.max(index - 1, 0));
        break;
      case 'Home':
        event.preventDefault();
        focusTile(0);
        break;
      case 'End':
        event.preventDefault();
        focusTile(weeks.length - 1);
        break;
      default:
        break;
    }
  }

  function handlePaintStart(index: number) {
    isPaintingRef.current = true;
    paint(index);
  }

  function handlePaintDrag(index: number) {
    if (isPaintingRef.current) paint(index);
  }

  // Encerra o "modo pintura por arrasto" ao soltar o botão/dedo em QUALQUER
  // lugar da página (não só dentro da grade) — mesmo comportamento da
  // Referência UX (listener global via `window`). Sem isso, `isPaintingRef`
  // ficaria preso em `true` após o primeiro `mousedown`, pintando tiles em
  // qualquer hover futuro mesmo sem o botão pressionado.
  useEffect(() => {
    const stopPainting = () => {
      isPaintingRef.current = false;
    };
    window.addEventListener('mouseup', stopPainting);
    window.addEventListener('touchend', stopPainting);
    return () => {
      window.removeEventListener('mouseup', stopPainting);
      window.removeEventListener('touchend', stopPainting);
    };
  }, []);

  const handleGridTouchMove = (event: React.TouchEvent) => {
    if (!editable || !isPaintingRef.current) return;
    const touch = event.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const tile = el?.closest<HTMLElement>('[data-week-idx]');
    if (tile) {
      const index = Number(tile.dataset.weekIdx);
      if (!Number.isNaN(index) && resolveWeekColorKey(weeks[index]?.color) !== selectedColor) {
        paint(index);
      }
    }
  };

  if (weeks.length === 0) {
    return (
      <Flex direction="column" align="center" gap={3} py={10}>
        <Text fontSize="sm" color="fg.muted" textAlign="center">
          {weeksText.emptyTitle}
        </Text>
        {editable && onEmptyAction && (
          <Button title={weeksText.emptyCta} variant="outline" onClick={onEmptyAction} />
        )}
      </Flex>
    );
  }

  return (
    <Flex direction="column" gap={5}>
      {/* Cabeçalho */}
      <Flex justify="space-between" align="flex-start" wrap="wrap" gap={3}>
        <Box>
          <Text fontSize="sm" fontWeight="semibold">
            {weeksText.sectionTitle}
          </Text>
          <Text fontSize="xs" color="fg.muted" mt={0.5}>
            {desc ?? weeksText.sectionHint}
          </Text>
          {iniLabel && fimLabel && (
            <Text fontSize="xs" color="fg.muted" mt={0.5}>
              {iniLabel} — {fimLabel} · {weeks.length} {weeksText.weeksCountSuffix}
            </Text>
          )}
        </Box>

        {editable && (
          <Button
            title={weeksText.resetCycleButton}
            icon={FiRotateCcw as ElementType}
            variant="outline"
            onClick={() => setResetConfirmOpen(true)}
          />
        )}
      </Flex>

      {editable && (
        <DeleteConfirmDialog
          isOpen={resetConfirmOpen}
          onClose={() => setResetConfirmOpen(false)}
          onConfirm={() => {
            onResetCycle?.();
            setResetConfirmOpen(false);
          }}
          title={weeksText.resetCycleDialogTitle}
          description={weeksText.resetCycleDialogDescription}
          warningText=""
          confirmButtonText={weeksText.resetCycleDialogConfirm}
          colorPalette="orange"
        />
      )}

      {/* Visão geral — tira proporcional colorida + tooltip por semana (única forma de identificar um segmento, já que não há texto visível nele). */}
      <Box>
        <Text
          fontSize="xs"
          color="fg.muted"
          mb={2}
          textTransform="uppercase"
          letterSpacing="wide"
          fontWeight="medium"
        >
          {weeksText.overviewLabel}
        </Text>
        <Flex h="22px" borderRadius="md" overflow="hidden">
          {weeks.map((week, index) => {
            const key = resolveWeekColorKey(week.color);
            const def = WEEK_COLOR_PALETTE[key];
            return (
              <Tooltip
                key={index}
                content={`${weeksText.tileAriaLabel.prefix} ${week.number_week} · ${colorLabel(
                  weeksText,
                  key
                )} · ${week.start_date} ${weeksText.tileAriaLabel.rangeSeparator} ${week.end_date}`}
              >
                <Box flex="1" h="full" bg={def.bg} />
              </Tooltip>
            );
          })}
        </Flex>
      </Box>

      {/* Paleta — só editable */}
      {editable && (
        <Flex align="center" gap={2} wrap="wrap" bg="bg.muted" borderRadius="lg" px={3} py={2}>
          <Text fontSize="xs" fontWeight="semibold" color="fg.muted" mr={1}>
            {weeksText.toolbarLabel}
          </Text>
          {WEEK_COLOR_CYCLE.map((key) => {
            const def = WEEK_COLOR_PALETTE[key];
            const active = selectedColor === key;
            return (
              <Button
                key={key}
                title={colorLabel(weeksText, key)}
                onClick={() => setSelectedColor(key)}
                variant="outline"
                bg={def.bg}
                color={def.text}
                borderWidth="2px"
                borderColor={active ? def.text : def.border}
                borderRadius="full"
                aria-pressed={active}
                _hover={{ bg: def.bg, opacity: 0.9 }}
              />
            );
          })}
        </Flex>
      )}

      {/* Grade agrupada por ano/mês */}
      <Box
        ref={gridRef}
        role="group"
        aria-label={editable ? weeksText.gridAriaLabelEditable : weeksText.gridAriaLabelReadOnly}
        onTouchMove={handleGridTouchMove}
        display="flex"
        flexDirection="column"
        gap={4}
      >
        {grouped.map((yearGroup) => (
          <Box key={yearGroup.year}>
            {grouped.length > 1 && (
              <Text
                fontSize="sm"
                fontWeight="semibold"
                borderBottom="1px solid"
                borderColor="border.subtle"
                pb={1}
                mb={2}
              >
                {yearGroup.year}
              </Text>
            )}
            <Flex direction="column" gap={2}>
              {yearGroup.months.map((monthGroup) => (
                <Flex key={monthGroup.month} align="flex-start" gap={3}>
                  <Text
                    w="40px"
                    flexShrink={0}
                    fontSize="xs"
                    fontWeight="semibold"
                    color="fg.muted"
                    textAlign="right"
                    textTransform="uppercase"
                    pt={6}
                  >
                    {(monthNames[monthGroup.month] ?? '').slice(0, 3)}
                  </Text>
                  <Flex wrap="wrap" gap={2} flex="1">
                    {monthGroup.items.map(({ week, index }) => (
                      <WeekTile
                        key={index}
                        week={week}
                        index={index}
                        editable={editable}
                        selectedColorLabel={colorLabel(weeksText, selectedColor)}
                        weeksText={weeksText}
                        onKeyDownTile={handleTileKeyDown}
                        onPaintStart={() => handlePaintStart(index)}
                        onPaintDrag={() => handlePaintDrag(index)}
                      />
                    ))}
                  </Flex>
                </Flex>
              ))}
            </Flex>
          </Box>
        ))}
      </Box>

      {/* Distribuição por cor */}
      <Flex
        align="center"
        gap={2}
        wrap="wrap"
        pt={3}
        borderTop="1px solid"
        borderColor="border.subtle"
      >
        <Text fontSize="xs" color="fg.muted" fontWeight="medium">
          {weeksText.distributionLabel}
        </Text>
        {WEEK_COLOR_CYCLE.filter((key) => (distribution[key] ?? 0) > 0).map((key) => {
          const def = WEEK_COLOR_PALETTE[key];
          return (
            <Badge key={key} bg={def.bg} color={def.text} borderRadius="full" px={2}>
              {colorLabel(weeksText, key)}: {distribution[key]} {weeksText.distributionUnitSuffix}
            </Badge>
          );
        })}
      </Flex>
    </Flex>
  );
}

// -----------------------------------------------------------------------------
// WeekTile — tile individual da grade. Sub-componente PRIVADO deste arquivo
// (não é primitiva de catálogo — seletor de cor fechado específico desta
// feature, ver nota de cabeçalho).
// -----------------------------------------------------------------------------

interface WeekTileProps {
  week: WeekVintagePayload;
  index: number;
  editable: boolean;
  selectedColorLabel: string;
  weeksText: WeeksText;
  onKeyDownTile: (event: React.KeyboardEvent, index: number) => void;
  onPaintStart: () => void;
  onPaintDrag: () => void;
}

function WeekTile({
  week,
  index,
  editable,
  selectedColorLabel,
  weeksText,
  onKeyDownTile,
  onPaintStart,
  onPaintDrag,
}: WeekTileProps) {
  const key = resolveWeekColorKey(week.color);
  const def = WEEK_COLOR_PALETTE[key];
  const isCurrent = isCurrentWeek(week);
  const label = weeksText.colorLabels[COLOR_LABEL_PROP[key]];

  const ariaLabel = editable
    ? `${weeksText.tileAriaLabel.prefix} ${week.number_week}, ${week.start_date} ${
        weeksText.tileAriaLabel.rangeSeparator
      } ${week.end_date}, ${weeksText.tileAriaLabel.colorPrefix} ${label}${
        isCurrent ? `, ${weeksText.tileAriaLabel.currentSuffix}` : ''
      }. ${weeksText.tileAriaLabel.paintHint} ${selectedColorLabel}`
    : undefined;

  const tileContent = (
    <>
      {isCurrent && (
        <Box
          position="absolute"
          top="4px"
          right="4px"
          w="7px"
          h="7px"
          borderRadius="full"
          bg="green.500"
        />
      )}
      {/* Abreviação — a cor de fundo sozinha não diferencia os 3 tons de azul p/ daltonismo (WCAG 1.4.1). */}
      <Text
        aria-hidden="true"
        position="absolute"
        top="3px"
        left="4px"
        fontSize="9px"
        fontWeight="bold"
        color={def.text}
        opacity={0.65}
      >
        {def.abbr}
      </Text>
      <Text fontSize="md" fontWeight="bold" color={def.text} lineHeight={1}>
        S{String(week.number_week).padStart(2, '0')}
      </Text>
      <Text fontSize="9px" color={def.text} opacity={0.8} textAlign="center" lineHeight={1.3}>
        {toDayMonth(week.start_date)}
        <br />
        {toDayMonth(week.end_date)}
      </Text>
    </>
  );

  const tileDimensions = {
    w: '76px',
    h: '68px',
    borderRadius: 'lg',
    bg: def.bg,
    border: '2px solid',
    borderColor: isCurrent ? 'green.500' : def.border,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2px',
    position: 'relative',
    userSelect: 'none',
    flexShrink: 0,
  } as const;

  // Modo leitura (TASK-FE-010): tile é puramente informativo — nenhuma
  // semântica de botão (sem `role`/foco/handlers fantasmas de uma ação que
  // não existe nesse modo).
  if (!editable) {
    return (
      <Box {...tileDimensions} cursor="default">
        {tileContent}
      </Box>
    );
  }

  // Modo edição: `ChakraButton` nativo (não `Box as="button"`) — garante
  // `type="button"` tipado corretamente (a tipagem polimórfica de `Box` não
  // resolve atributos de `<button>` mesmo com `as="button"` nesta versão do
  // Chakra) e, por padrão de fábrica do próprio Chakra, já nasce
  // `type="button"` — essencial aqui, já que a grade fica DENTRO do
  // `<Form onSubmit>` do formulário: um botão sem esse cuidado submeteria o
  // form ao ser clicado para pintar.
  return (
    <ChakraButton
      type="button"
      variant="plain"
      data-week-idx={index}
      aria-label={ariaLabel}
      aria-current={isCurrent ? 'date' : undefined}
      onKeyDown={(event: React.KeyboardEvent) => onKeyDownTile(event, index)}
      onMouseDown={onPaintStart}
      onTouchStart={onPaintStart}
      onMouseEnter={onPaintDrag}
      {...tileDimensions}
      p={0}
      minW="unset"
      cursor="pointer"
      _focusVisible={{ outline: '2px solid', outlineColor: 'green.600', outlineOffset: '2px' }}
    >
      {tileContent}
    </ChakraButton>
  );
}
