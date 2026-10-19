/**
 * DateInput — Componente de input de data sobre o motor NATIVO do Chakra UI
 * 3.37.0 (`DatePicker`, compound/headless sobre `@ark-ui/react`/`@zag-js/
 * date-picker`), substituindo `react-datepicker` (CONTRATO-FE-DATE-NATIVO-
 * CHAKRA, esteira 006, canário TASK-FE-DATE-NATIVO-01).
 *
 * API PÚBLICA INTACTA (nenhum dos ~252 callsites muda):
 *   value: string | null (ISO 'yyyy-MM-dd') · onChange: (value) => void
 *   disabled? · placeholder? · minDate?: Date · maxDate?: Date
 *
 * Respeita o locale do usuário: DD/MM/YYYY (BR/ES) ou MM/DD/YYYY (US).
 * Header/popup seguem o tema light/dark REAL via tokens de `theme.ts`
 * (decisão do dono, contrato seção 6.4, opção B) — zero hex fixo.
 *
 * PARIDADE DE PROPS (CONTRATO-FE-CONSOLIDA-INPUTDATE.md, seção 3, Opção A
 * aprovada pelo dono, esteira 006): `label?/error?/isRequired?` aditivos,
 * embutindo `Field` internamente exatamente como `SelectAsyncPaginate.tsx`
 * já faz — quando nenhuma das 3 é passada, o componente renderiza IDÊNTICO
 * ao comportamento anterior (NFe `StepFuncionario` e demais ~252 callsites
 * da `develop` sem essas props não mudam). `helperText`/`isReadOnly` ficaram
 * de fora desta consolidação — o contrato confirma que estão MORTAS em
 * todo o escopo migrado (nenhum dos usos reais as passa).
 */

import { useMemo, type ReactNode } from 'react';

import {
  DatePicker,
  Icon,
  IconButton,
  InputGroup,
  Portal,
  type DatePickerValueChangeDetails,
} from '@chakra-ui/react';
import { isValid, parse as parseDateFns } from 'date-fns';
import { MdCalendarToday } from 'react-icons/md';

import { Field } from '@/components/Form/Field';

import { useLanguage } from '@/hooks/useLanguage';

import { localTimeZone } from '@/utils/localDate';

import { calendarDateToIso, dateToCalendarDate, isoToCalendarDate } from './dateNativeBridge';

import type { CalendarDate, DateValue } from '@internationalized/date';

interface DateInputProps {
  /** Valor atual no formato YYYY-MM-DD (ou null) */
  value: string | null;
  /** Callback chamado com o novo valor no formato YYYY-MM-DD (ou null) */
  onChange: (value: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
  /** Data mínima selecionável no calendário e na digitação. */
  minDate?: Date;
  /** Data máxima selecionável, simétrica a `minDate` (ex.: bloquear datas
   *  futuras, como nascimento — `StepFuncionario.tsx:176`). */
  maxDate?: Date;
  /**
   * Desabilita o `Portal` do calendário (mirror do `disablePortal` já
   * implementado em `SelectAsyncPaginate.tsx`, TASK-FE-706/DF-31): quando o
   * `DateInput` está DENTRO de um `Dialog`/modal (Ark UI), o popup
   * portalizado em `document.body` fica FORA da árvore de `Portal` do
   * `Dialog.Root` — o Dialog aplica `aria-hidden`/`inert` nela, deixando o
   * calendário VISÍVEL mas NÃO-CLICÁVEL. Com `disablePortal=true`, o
   * `DatePicker.Positioner` renderiza INLINE (sem `Portal`), permanecendo na
   * mesma árvore do Dialog e ficando clicável. Sem essa prop (default), o
   * comportamento com portal permanece intacto (uso fora de modal).
   */
  disablePortal?: boolean;
  /**
   * Paridade com `InputDate`/`SelectAsyncPaginate` (CONTRATO-FE-CONSOLIDA-
   * INPUTDATE.md, seção 3, Opção A). Quando presente (junto com `error` e/ou
   * `isRequired`), o input é embrulhado num `Field` — igual ao `InputDate`
   * legado. Sem `label`/`error`, nada muda (retrocompat total).
   */
  label?: string;
  /** Mensagem de erro exibida pelo `Field` (mesma convenção de `error?:
   *  string` de `InputDate`/`SelectAsyncPaginate`). */
  error?: string;
  /** Marca o `Field` como obrigatório (asterisco no label). Sem `label`,
   *  não tem efeito visual (mirror `SelectAsyncPaginate`). */
  isRequired?: boolean;
}

// Formata CalendarDate → texto exibido no input, sem `Date`/timezone — os
// campos `year`/`month`/`day` do `CalendarDate` já são a fonte da verdade
// (contrato seção 2.3: `CalendarDate` não carrega fuso horário).
function formatDisplay(date: DateValue, isUS: boolean): string {
  const dd = String(date.day).padStart(2, '0');
  const mm = String(date.month).padStart(2, '0');
  const yyyy = String(date.year).padStart(4, '0');
  return isUS ? `${mm}/${dd}/${yyyy}` : `${dd}/${mm}/${yyyy}`;
}

// Digitação → CalendarDate. ACHADO DO CANÁRIO (evidência empírica, não do
// contrato): o `DatePicker.Input` nativo é DELIBERADAMENTE não controlado —
// `getInputProps()` (`@zag-js/date-picker`, `date-picker.connect.js`) expõe
// `defaultValue` (nunca `value`) e sincroniza o texto do DOM via `onInput`/
// `onBlur`/Enter, escrevendo no elemento diretamente. `react-input-mask`
// exige controle total do `value` para aplicar a máscara — as duas
// estratégias são incompatíveis: com `asChild` o clone do Ark grava a
// atualização como `defaultValue` (o texto exibido não sincroniza após
// seleção no calendário); repassando `getInputProps()` manualmente, o campo
// fica permanentemente vazio (não existe `value` controlado a repassar).
// Confirmado no smoke deste canário. Por isso a opção adotada é a (a) do
// contrato (seção 3.4) — digitação livre via `parse` nativo, sem máscara
// visual — aceitando tanto `dd/MM/yyyy` (com barras) quanto 8 dígitos puros
// (`ddMMyyyy`), para não exigir do usuário digitar as barras manualmente.
//
// SEGUNDO ACHADO (também empírico) — `onInput` chama `parse` a CADA tecla
// digitada, não só no Enter/blur. Um `parse` "otimista" que tenta validar
// texto PARCIAL (ex.: "0101199", 7 dígitos) contra `date-fns` pode casar
// erroneamente e comitar uma data ERRADA no meio da digitação. Por isso a
// guarda de comprimento abaixo é OBRIGATÓRIA: só tenta `parseDateFns` com a
// string de 10 caracteres (`dd/MM/yyyy`) já completa — nunca com prefixos.
function parseDisplay(text: string, dateFormat: string): CalendarDate | undefined {
  const digitsOnly = text.replace(/\D/g, '');
  if (digitsOnly.length !== 8) return undefined;

  const withSeparators = text.includes('/')
    ? text
    : `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2, 4)}/${digitsOnly.slice(4, 8)}`;
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(withSeparators)) return undefined;

  const parsed = parseDateFns(withSeparators, dateFormat, new Date());
  if (!isValid(parsed)) return undefined;
  return dateToCalendarDate(parsed) ?? undefined;
}

export function DateInput({
  value,
  onChange,
  disabled = false,
  placeholder,
  minDate,
  maxDate,
  disablePortal = false,
  label,
  error,
  isRequired,
}: DateInputProps) {
  const { languageGB } = useLanguage();

  const isUS = languageGB.country === 'US';
  const dateFormat = isUS ? 'MM/dd/yyyy' : 'dd/MM/yyyy';
  const locale =
    languageGB.country === 'BR' ? 'pt-BR' : languageGB.country === 'ES' ? 'es-ES' : 'en-US';
  const defaultPlaceholder = placeholder ?? (isUS ? 'MM/DD/YYYY' : 'DD/MM/YYYY');

  const selectedValue = useMemo(() => isoToCalendarDate(value), [value]);
  const minValue = useMemo(() => dateToCalendarDate(minDate) ?? undefined, [minDate]);
  const maxValue = useMemo(() => dateToCalendarDate(maxDate) ?? undefined, [maxDate]);

  // Paridade de props (seção 3 do contrato) — sem `label`/`error`, nenhum
  // `Field` é renderizado (retrocompat total com os ~252 callsites atuais,
  // NFe `StepFuncionario` inclusive). Mirror EXATO de como
  // `SelectAsyncPaginate` embute `Field` hoje.
  const datePicker = (
    <DatePicker.Root
      value={selectedValue ? [selectedValue] : []}
      onValueChange={(details: DatePickerValueChangeDetails) =>
        onChange(calendarDateToIso((details.value[0] as CalendarDate | undefined) ?? null))
      }
      disabled={disabled}
      min={minValue}
      max={maxValue}
      locale={locale}
      timeZone={localTimeZone()}
      format={(date: DateValue) => formatDisplay(date, isUS)}
      parse={(text: string) => parseDisplay(text, dateFormat)}
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
                  // O recipe NATIVO do Chakra p/ `date-picker__trigger` aplica um
                  // fundo claro fixo (`gray.100`, fora dos nossos tokens
                  // light/dark) no estado `data-state=open`/`data-expanded` —
                  // ficando BRANCO sólido no dark. Sobrescreve por `css` (mesma
                  // técnica do `DayTable` abaixo, que já vence o recipe nativo)
                  // forçando transparente nos 3 estados e um hover sutil por
                  // token nos dois temas.
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
            width="full"
            height="38px"
            px="3"
            fontSize="14px"
            bg="inputBG"
            color="primitiveTexteColor"
            border="1px solid"
            borderColor="border2"
            borderRadius="6px"
            cursor={disabled ? 'not-allowed' : 'text'}
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

      <PortalWrapper disablePortal={disablePortal}>
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
            <DatePicker.View view="day">
              <DatePicker.Header
                borderBottomWidth="1px"
                borderColor="border1"
                pb="2"
                mb="1"
                css={{
                  // O recipe NATIVO do `date-picker__viewTrigger` já define seu
                  // PRÓPRIO `:hover` (fundo E cor claros fixos, fora dos nossos
                  // tokens) com a MESMA especificidade de um `css`/`_hover`
                  // aplicado DIRETO no `ViewTrigger` (1 classe + pseudo-classe
                  // dos dois lados) — nesse empate o recipe nativo vencia
                  // (texto branco sobre fundo branco no dark, ilegível). Um
                  // seletor aninhado a partir do `Header` (`& [data-part=
                  // view-trigger]`, mesma técnica do `DayTable` abaixo) tem
                  // especificidade MAIOR (classe + atributo) e vence o recipe.
                  '& [data-part="view-trigger"]': {
                    color: 'text.primary',
                    fontWeight: 'semibold',
                    '&:hover': { bg: 'sidebarItemHoverBG', color: 'text.primary' },
                  },
                  // As setas `prev-trigger`/`next-trigger` também têm `:hover`
                  // PRÓPRIO no recipe nativo do Chakra (fundo claro fixo, fora
                  // dos tokens — branco sólido no dark). Um `_hover` inline no
                  // trigger empata em especificidade com o recipe e PERDE
                  // (mesmo achado do `view-trigger` acima); o seletor aninhado
                  // a partir do `Header` tem especificidade maior e vence.
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
                <DatePicker.PrevTrigger aria-label="Mês anterior" />
                <DatePicker.ViewTrigger>
                  <DatePicker.RangeText />
                </DatePicker.ViewTrigger>
                <DatePicker.NextTrigger aria-label="Próximo mês" />
              </DatePicker.Header>
              <DatePicker.DayTable
                css={{
                  width: '100%',
                  tableLayout: 'fixed',
                  borderCollapse: 'collapse',
                  '& [data-part=table-header]': {
                    width: `${100 / 7}%`,
                    minWidth: 0,
                    maxWidth: 'none',
                    boxSizing: 'border-box',
                    px: '0',
                    color: 'text.secondary',
                    textAlign: 'center',
                  },
                  '& [data-part=table-cell]': {
                    width: `${100 / 7}%`,
                    minWidth: 0,
                    maxWidth: 'none',
                    boxSizing: 'border-box',
                    px: '0',
                    textAlign: 'center',
                  },
                  '& [data-part=table-cell-trigger]': {
                    width: '100%',
                    maxWidth: '100%',
                    minWidth: 0,
                    boxSizing: 'border-box',
                    color: 'text.primary',
                    // `primitiveBGHover` resolve a `gray.700` (#1a1a1a, quase
                    // preto) no dark — feio/ilegível como fundo de hover do
                    // dia. `sidebarItemHoverBG` é o token de hover neutro e
                    // sutil já usado em todo o app (Action/SecondaryNav/
                    // NavRail: tint translúcido preto 4%/branco 4%), com bom
                    // contraste nos dois temas sem apagar o número (cor do
                    // texto do dia continua por `color: 'text.primary'` acima).
                    '&:hover': { bg: 'sidebarItemHoverBG' },
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
                    '&[data-outside-range]': {
                      color: 'semanticNeutral.400',
                    },
                  },
                }}
              />
            </DatePicker.View>

            <DatePicker.View view="month">
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
                    '&:hover': { bg: 'sidebarItemHoverBG' },
                    '&[data-selected]': { bg: 'primaryMain', color: 'buttonSolidColor' },
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
      </PortalWrapper>
    </DatePicker.Root>
  );

  if (!label && !error && !isRequired) return datePicker;

  return (
    <Field label={label} errorText={error} isRequired={isRequired}>
      {datePicker}
    </Field>
  );
}

// Espelha o padrão de `disablePortal` do `SelectAsyncPaginate.tsx`: com
// `disablePortal=true`, o `Positioner` renderiza INLINE, na mesma árvore de
// `Portal` do `Dialog` ancestral (evitando `aria-hidden`/`inert` sobre um nó
// portalizado direto em `document.body`). Sem a prop, comportamento padrão
// com `Portal` do Chakra permanece intacto.
function PortalWrapper({
  disablePortal,
  children,
}: {
  disablePortal: boolean;
  children: ReactNode;
}) {
  if (disablePortal) return <>{children}</>;
  return <Portal>{children}</Portal>;
}
