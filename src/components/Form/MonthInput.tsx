// src/components/Form/MonthInput.tsx
// -----------------------------------------------------------------------------
// MonthInput — seletor de MÊS ('YYYY-MM'), usado pelas linhas de parcelas do
// Adiantamento Salarial (TASK-FE-adiant-salarial, 97-Esteiras/034).
//
// FID-G3F §6.1 (FE-FORM-MONTH-WIDGET, default do dono): NÃO existe widget de
// mês no design system — este componente ADAPTA o mesmo motor NATIVO do
// `DateInput` (`@chakra-ui/react` `DatePicker` sobre `@ark-ui/react`/
// `@zag-js/date-picker`, CONTRATO-FE-DATE-NATIVO-CHAKRA, esteira 006,
// TASK-FE-DATE-NATIVO-02), isolado em arquivo próprio (alternativa
// expressamente aceita pelo FID-G3F em vez de alterar o `DateInput`
// compartilhado, que é consumido por ~250 telas). Serializa/recebe
// `YYYY-MM`; `min` = mês atual (mesmo racional do legado: "mês atual
// implícito pelo min do datepicker").
//
// Fidelidade ao `cerne` (Passo UX/adaptação, não cópia): mesmo
// header/tokens/tema light+dark do `DateInput`, restrito às VIEWs de mês e
// ano (`minView="month" maxView="year"`) — sem view de dia. Clicar no
// header (ano) navega para a grade de anos (igual o `DateInput`); escolher
// ano volta à grade de meses; escolher mês grava `YYYY-MM` (GAP frontend,
// esteira 006 — o `maxView="month"` anterior travava a view e o header
// nunca abria a seleção de ano). Reaproveita
// `dateNativeBridge.ts` (fonte única de conversão ISO↔CalendarDate,
// CONTRATO-FE-DATE-NATIVO-CHAKRA §3.2): 'YYYY-MM' vira 'YYYY-MM-01' na
// entrada e é truncado de volta a 'YYYY-MM' na saída — sem parsing manual
// duplicado.
//
// UX preservada do legado (`react-datepicker` `showMonthYearPicker` com
// `customInput` readOnly): input só-leitura, seleção exclusivamente pelo
// calendário — sem digitação livre de mês (o legado nunca ofereceu isso).
//
// FIX (GAP frontend, esteira 006) — ACHADO EMPÍRICO: `readOnly` no
// `DatePicker.Root` do `@zag-js/date-picker` não bloqueia só a digitação —
// alimenta o computed `isInteractive` (`!disabled && !readOnly`) que também
// guarda os `onClick` do INPUT e do TRIGGER (`if (!interactive) return`,
// `date-picker.connect.mjs`). Com `readOnly` no Root, clicar no campo OU no
// ícone do calendário não abria popup NENHUM (confirmado via inspeção do
// estado real do DOM — `aria-expanded`/`data-state` permaneciam
// `false`/`closed` após o clique). Fix: `readOnly` sai do `Root` (mantém
// `interactive=true`, calendário abre no clique) e migra para o próprio
// `<DatePicker.Input readOnly>` — o `mergeProps` do Ark UI aplica os props
// locais do JSX POR CIMA de `getInputProps()`, então o atributo HTML nativo
// `readonly` do `<input>` (que bloqueia digitação no browser) sobrevive
// isolado, sem tocar o guard de interatividade do Root.
// -----------------------------------------------------------------------------

import { useMemo } from 'react';

import {
  DatePicker,
  Icon,
  IconButton,
  InputGroup,
  Portal,
  type DatePickerValueChangeDetails,
} from '@chakra-ui/react';
import { format, startOfMonth } from 'date-fns';
import { MdCalendarToday } from 'react-icons/md';

import { useLanguage } from '@/hooks/useLanguage';

import { localTimeZone } from '@/utils/localDate';

import {
  calendarDateToIso,
  dateToCalendarDate,
  isoToCalendarDate,
} from '../DateInput/dateNativeBridge';

import type { CalendarDate, DateValue } from '@internationalized/date';

interface MonthInputProps {
  /** Valor atual no formato 'YYYY-MM' (ou null/''). */
  value: string | null;
  /** Callback chamado com o novo valor no formato 'YYYY-MM' (ou null). */
  onChange: (value: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
  /** Mês mínimo selecionável — default: mês atual (FID-G3F §6.1). */
  minMonth?: Date;
}

// 'YYYY-MM' → CalendarDate (1º dia do mês) | null — reaproveita a ponte
// única do motor nativo, completando o dia ausente antes do parse.
function isoMonthToCalendarDate(isoMonth: string | null | undefined): CalendarDate | null {
  if (!isoMonth) return null;
  return isoToCalendarDate(`${isoMonth}-01`);
}

// CalendarDate → 'YYYY-MM' | null — trunca o 'YYYY-MM-DD' da ponte única
// (o dia é sempre descartado; a UI nunca exibe/seleciona dia).
function calendarDateToIsoMonth(value: CalendarDate | null | undefined): string | null {
  const iso = calendarDateToIso(value);
  return iso ? iso.slice(0, 7) : null;
}

// Formata CalendarDate → texto exibido no input ('MM/yyyy').
function formatDisplay(date: DateValue): string {
  const mm = String(date.month).padStart(2, '0');
  const yyyy = String(date.year).padStart(4, '0');
  return `${mm}/${yyyy}`;
}

export function MonthInput({
  value,
  onChange,
  disabled = false,
  placeholder,
  minMonth,
}: MonthInputProps) {
  const { languageGB } = useLanguage();

  const locale =
    languageGB.country === 'BR' ? 'pt-BR' : languageGB.country === 'ES' ? 'es-ES' : 'en-US';
  const defaultPlaceholder = placeholder ?? 'MM/YYYY';

  const selectedValue = useMemo(() => isoMonthToCalendarDate(value), [value]);
  const minValue = useMemo(
    () => dateToCalendarDate(startOfMonth(minMonth ?? new Date())) ?? undefined,
    [minMonth]
  );

  return (
    <DatePicker.Root
      value={selectedValue ? [selectedValue] : []}
      onValueChange={(details: DatePickerValueChangeDetails) =>
        onChange(calendarDateToIsoMonth((details.value[0] as CalendarDate | undefined) ?? null))
      }
      disabled={disabled}
      min={minValue}
      timeZone={localTimeZone()}
      minView="month"
      maxView="year"
      locale={locale}
      format={(date: DateValue) => formatDisplay(date)}
      placeholder={defaultPlaceholder}
      openOnClick
      positioning={{ placement: 'bottom-start', gutter: 4, sameWidth: true }}
      width="full"
    >
      <DatePicker.Control>
        <InputGroup
          width="full"
          endElement={
            <DatePicker.Trigger asChild>
              <IconButton
                aria-label="Abrir calendário"
                variant="ghost"
                size="xs"
                disabled={disabled}
                cursor={disabled ? 'not-allowed' : 'pointer'}
                css={{
                  // Mesmo achado do `DateInput` (`index.tsx`): o recipe NATIVO
                  // do Chakra p/ `date-picker__trigger` aplica um fundo claro
                  // fixo (`gray.100`) no estado `data-state=open`/
                  // `data-expanded`, fora dos tokens light/dark — sólido
                  // branco no dark. Sobrescreve por `css` forçando
                  // transparente nos 3 estados + hover sutil por token.
                  bg: 'transparent',
                  '&[data-state="open"]': { bg: 'transparent' },
                  '&[data-expanded]': { bg: 'transparent' },
                  '&:hover': { bg: 'sidebarItemHoverBG' },
                }}
              >
                <Icon as={MdCalendarToday} color="fg.muted" />
              </IconButton>
            </DatePicker.Trigger>
          }
        >
          <DatePicker.Input
            readOnly
            width="full"
            height="38px"
            px="3"
            fontSize="14px"
            bg="inputBG"
            color="primitiveTexteColor"
            border="1px solid"
            borderColor="border2"
            borderRadius="6px"
            cursor={disabled ? 'not-allowed' : 'pointer'}
            _placeholder={{ color: 'placeholderColor' }}
            _hover={{ borderColor: 'border2' }}
            _focus={{
              borderColor: 'primaryMain',
              boxShadow: '0 0 0 1px var(--chakra-colors-primary-main)',
            }}
            _disabled={{
              bg: 'semanticNeutral.200',
              color: 'semanticNeutral.700',
              cursor: 'not-allowed',
              opacity: 1,
            }}
          />
        </InputGroup>
      </DatePicker.Control>

      <Portal>
        <DatePicker.Positioner minWidth="280px" maxWidth="380px">
          <DatePicker.Content
            width="full"
            minWidth="0"
            maxWidth="none"
            boxSizing="border-box"
            bg="formBG"
            color="text.primary"
            borderWidth="1px"
            borderColor="border1"
            borderRadius="lg"
            boxShadow="lg"
            p="2"
          >
            <DatePicker.View view="month">
              <DatePicker.Header
                borderBottomWidth="1px"
                borderColor="border1"
                pb="2"
                mb="1"
                css={{
                  // Mesmo achado do `DateInput` (`index.tsx`): o `:hover` INLINE
                  // do recipe nativo empata em especificidade com `_hover` direto
                  // no trigger e o recipe vence — fundo claro fixo (branco no
                  // dark) no `view-trigger` e nas setas `prev-trigger`/
                  // `next-trigger`. Seletor aninhado a partir do `Header`
                  // (mesma técnica do `DayTable`) tem especificidade maior e
                  // vence o recipe nativo.
                  '& [data-part="view-trigger"]': {
                    color: 'text.primary',
                    fontWeight: 'semibold',
                    '&:hover': { bg: 'sidebarItemHoverBG', color: 'text.primary' },
                  },
                  '& [data-part="prev-trigger"]': {
                    color: 'text.secondary',
                    '&:hover': { bg: 'sidebarItemHoverBG', color: 'text.primary' },
                  },
                  '& [data-part="next-trigger"]': {
                    color: 'text.secondary',
                    '&:hover': { bg: 'sidebarItemHoverBG', color: 'text.primary' },
                  },
                }}
              >
                <DatePicker.PrevTrigger aria-label="Ano anterior" />
                <DatePicker.ViewTrigger>
                  <DatePicker.RangeText />
                </DatePicker.ViewTrigger>
                <DatePicker.NextTrigger aria-label="Próximo ano" />
              </DatePicker.Header>
              <DatePicker.MonthTable
                css={{
                  width: '100%',
                  tableLayout: 'fixed',
                  '& [data-part=table-cell]': {
                    boxSizing: 'border-box',
                    px: '0.5',
                    textAlign: 'center',
                  },
                  '& [data-part=table-cell-trigger]': {
                    width: '100%',
                    maxWidth: '100%',
                    minWidth: 0,
                    boxSizing: 'border-box',
                    color: 'text.primary',
                    '&:hover': { bg: 'primitiveBGHover' },
                    '&[data-today]': {
                      color: 'primaryMain',
                      fontWeight: 'semibold',
                    },
                    '&[data-selected]': {
                      bg: 'primaryMain',
                      color: 'buttonSolidColor',
                      fontWeight: 'semibold',
                      _hover: { bg: 'primaryMain' },
                    },
                    '&[data-disabled]': {
                      color: 'semanticNeutral.400',
                      opacity: 0.5,
                    },
                  },
                }}
              />
            </DatePicker.View>

            <DatePicker.View view="year">
              <DatePicker.Header
                borderBottomWidth="1px"
                borderColor="border1"
                pb="2"
                mb="1"
                css={{
                  '& [data-part="view-trigger"]': {
                    color: 'text.primary',
                    fontWeight: 'semibold',
                    '&:hover': { bg: 'sidebarItemHoverBG', color: 'text.primary' },
                  },
                  '& [data-part="prev-trigger"]': {
                    color: 'text.secondary',
                    '&:hover': { bg: 'sidebarItemHoverBG', color: 'text.primary' },
                  },
                  '& [data-part="next-trigger"]': {
                    color: 'text.secondary',
                    '&:hover': { bg: 'sidebarItemHoverBG', color: 'text.primary' },
                  },
                }}
              >
                <DatePicker.PrevTrigger />
                <DatePicker.ViewTrigger>
                  <DatePicker.RangeText />
                </DatePicker.ViewTrigger>
                <DatePicker.NextTrigger />
              </DatePicker.Header>
              <DatePicker.YearTable
                css={{
                  width: '100%',
                  tableLayout: 'fixed',
                  '& [data-part=table-cell]': {
                    boxSizing: 'border-box',
                    px: '0.5',
                    textAlign: 'center',
                  },
                  '& [data-part=table-cell-trigger]': {
                    width: '100%',
                    maxWidth: '100%',
                    minWidth: 0,
                    boxSizing: 'border-box',
                    color: 'text.primary',
                    '&:hover': { bg: 'sidebarItemHoverBG' },
                    '&[data-selected]': { bg: 'primaryMain', color: 'buttonSolidColor' },
                  },
                }}
              />
            </DatePicker.View>
          </DatePicker.Content>
        </DatePicker.Positioner>
      </Portal>
    </DatePicker.Root>
  );
}

// Utilitário — usado por `InstallmentsFieldArray` para o valor default da
// linha nova (mês atual serializado 'YYYY-MM').
export function currentMonthIso(): string {
  return format(startOfMonth(new Date()), 'yyyy-MM');
}
