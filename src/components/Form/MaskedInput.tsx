// src/components/Form/MaskedInput.tsx
// -----------------------------------------------------------------------------
// Componente único de máscara — Wave 0 da esteira 001 (consolidação de
// `InputMask`/`MoneyInput`/`PhoneInput`/`PercentInput`/`NumberInput`/
// `kgInput`/`ServiceExpenses/CommissionPercentInput` em 1 componente, ver
// 97-Esteiras/001/CONTRATOS/01-MaskedInput-Contrato.md). Prop `kind`
// discriminada escolhe o algoritmo certo (`utils/masks/maskSource.ts`) por
// TIPO SEMÂNTICO de campo, não por `decimalPlaces` isolado — corrige o
// defeito KB-06 (right-fill aplicado por engano a percentual/peso/
// quantidade).
//
// Fronteira dupla preservada, não eliminada (§2.1 do contrato — já existe
// em produção nos 7 componentes atuais):
//   - Saída STRING (documento/telefone/CEP): register-compatível
//     (uncontrolled) — intercepta `onChange` e reescreve `event.target.value`
//     com o formato progressivo antes de repassar, mesmo padrão de
//     `PhoneInput.tsx`/`InputMask.tsx` hoje. Funciona também com
//     `Controller` do RHF (que extrai `event.target.value` de um objeto com
//     `target`, ou usa o valor recebido direto quando não há `target`).
//   - Saída NUMBER (moeda/percentual/peso/quantidade/inteiro):
//     Controller-only (controlled) — `value`/`onValueChange` entregam
//     SEMPRE o número puro, nunca a string mascarada.
//
// Sufixo (`%`/unidade) via `endElement` de `InputGroup`, FORA do texto
// editável (§3.4 do contrato) — elimina por construção a classe de bug de
// backspace documentada em `PercentInput.tsx`/`CommissionPercentInput.tsx`.
//
// Casca reaproveitada: `Field.tsx` (label/tooltip/error/helperText) — mesmo
// padrão que TODOS os 7 componentes de máscara atuais já usam (nenhum deles
// monta sobre `Input.tsx`; todos montam `Field` + `ChakraInput` direto,
// porque precisam de `value`/`onChange` mascarados, incompatíveis com o
// `endElement` só-ícone de `Input.tsx`). Nenhuma casca é reescrita aqui.
//
// NÃO usa `react-input-mask` para nenhum `kind` (§5 do contrato) — inclusive
// `cep`, cujo algoritmo progressivo manual (`formatCepProgressive`)
// substitui a lib sem custo.
//
// `kind="digits"` — CAMPO GLOBAL PADRÃO (EST-07) para "número simples /
// inscrições / IDs numéricos" (ex.: Número de endereço, Inscrição Estadual,
// Inscrição Municipal e qualquer outro campo textual que deva aceitar SÓ
// DÍGITOS, sem letras). Diferente de `cpf`/`cnpj`/`cep`/`phone`, NÃO aplica
// nenhuma formatação visual (sem ponto/hífen/espaço) — só filtra não-dígito.
// Register-compatível (uncontrolled, mesmo padrão dos demais `StringMaskKind`)
// E também funcional em modo controlado (`value`/`onChange` via Controller,
// inclusive dentro de field arrays com `useState`). Config "só dígitos" deve
// morar SEMPRE aqui — nunca reimplementar `onlyDigits` inline por tela.
// -----------------------------------------------------------------------------
import { ChangeEvent, ElementType, FocusEvent, forwardRef, useEffect, useState } from 'react';

import {
  Icon,
  Input as ChakraInput,
  InputGroup,
  InputProps as ChakraInputProps,
  Skeleton,
  Text,
} from '@chakra-ui/react';

import {
  createDirectTypingEntry,
  type NumericMaskKind,
  numericMaskSource,
  type StringMaskKind,
  stringMaskSource,
} from '@/utils/masks/maskSource';

import { Field } from './Field';

export type { NumericMaskKind, StringMaskKind };

const NUMERIC_KINDS: ReadonlySet<NumericMaskKind> = new Set([
  'currency',
  'percent',
  'weight',
  'quantity',
  'integer',
]);

interface MaskedInputSharedProps {
  label?: string;
  isRequired?: boolean;
  error?: string;
  helperText?: string;
  tooltip?: string;
  loading?: boolean;
  disabled?: boolean;
  startElement?: ElementType;
}

// ── Saída STRING — register-compatível (uncontrolled) ───────────────────────
export interface MaskedInputStringProps
  extends MaskedInputSharedProps, Omit<ChakraInputProps, 'name' | 'value' | 'mask'> {
  kind: StringMaskKind;
  name: string;
  /** Valor exibido/gravado — a string já formatada (documento/telefone/CEP). */
  value?: string;
}

// ── Saída NUMBER — Controller-only (controlled) ─────────────────────────────
export interface MaskedInputNumericProps
  extends MaskedInputSharedProps, Omit<ChakraInputProps, 'name' | 'value' | 'onChange' | 'mask'> {
  kind: NumericMaskKind;
  name: string;
  /** Valor numérico puro — NUNCA a string mascarada. */
  value: number | null | undefined;
  /** Devolve o valor numérico puro, ou `null` quando o campo está vazio — NUNCA a string mascarada. */
  onValueChange: (value: number | null) => void;
  /** default: `currency`=2 fixo (ignora a prop); `percent`/`weight`/`quantity`=2; `integer`=0 fixo (ignora a prop). */
  decimalPlaces?: number;
  min?: number;
  /** Cap de dígitos crus na digitação + clamp real no blur. */
  max?: number;
  /** default `'%'` quando `kind === 'percent'`, `''` nos demais — via `endElement`, NUNCA concatenado ao texto. */
  suffix?: string;
}

export type MaskedInputProps = MaskedInputStringProps | MaskedInputNumericProps;

function isNumericKind(kind: StringMaskKind | NumericMaskKind): kind is NumericMaskKind {
  return NUMERIC_KINDS.has(kind as NumericMaskKind);
}

export const MaskedInput = forwardRef<HTMLInputElement, MaskedInputProps>((props, ref) => {
  if (isNumericKind(props.kind)) {
    return <NumericMaskedInput {...(props as MaskedInputNumericProps)} ref={ref} />;
  }
  return <StringMaskedInput {...(props as MaskedInputStringProps)} ref={ref} />;
});

MaskedInput.displayName = 'MaskedInput';

// ---------------------------------------------------------------------------
// Saída STRING — register-compatível.
// ---------------------------------------------------------------------------
const StringMaskedInput = forwardRef<HTMLInputElement, MaskedInputStringProps>(
  (
    {
      kind,
      name,
      label,
      isRequired,
      error,
      helperText,
      tooltip,
      loading = false,
      disabled,
      startElement,
      value,
      onChange,
      ...rest
    },
    ref
  ) => {
    const entry = stringMaskSource[kind];

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
      event.target.value = entry.format(event.target.value);
      onChange?.(event);
    }

    return (
      <Field
        label={label}
        errorText={error}
        helperText={helperText}
        tooltip={tooltip}
        isRequired={isRequired}
        invalid={!!error}
      >
        <Skeleton loading={loading} borderRadius="md" width="full">
          <InputGroup
            startElement={
              startElement ? <Icon as={startElement} boxSize="4" color="gray.400" /> : undefined
            }
          >
            <ChakraInput
              id={name}
              name={name}
              ref={ref}
              inputMode={entry.inputMode}
              // Controlado só quando o callsite passa `value` (padrão Controller).
              // Quando ausente (padrão `register`, uncontrolled), NÃO forçamos
              // `value` — senão o input fica preso em '' e não deixa digitar.
              // Nesse caso `handleChange` reescreve `event.target.value` com o
              // formato progressivo e o próprio DOM/register mantém o texto.
              {...(value !== undefined ? { value } : {})}
              onChange={handleChange}
              disabled={disabled}
              {...rest}
            />
          </InputGroup>
        </Skeleton>
      </Field>
    );
  }
);

StringMaskedInput.displayName = 'StringMaskedInput';

// ---------------------------------------------------------------------------
// Saída NUMBER — Controller-only (controlado).
// ---------------------------------------------------------------------------
const DEFAULT_SUFFIX_BY_KIND: Record<NumericMaskKind, string> = {
  currency: '',
  percent: '%',
  weight: '',
  quantity: '',
  integer: '',
};

const FIXED_DECIMAL_PLACES: Partial<Record<NumericMaskKind, number>> = {
  currency: 2,
  integer: 0,
};

const NumericMaskedInput = forwardRef<HTMLInputElement, MaskedInputNumericProps>(
  (
    {
      kind,
      name,
      label,
      isRequired,
      error,
      helperText,
      tooltip,
      loading = false,
      disabled,
      startElement,
      value,
      onValueChange,
      decimalPlaces,
      min,
      max,
      suffix,
      onBlur,
      ...rest
    },
    ref
  ) => {
    const effectiveDecimalPlaces = FIXED_DECIMAL_PLACES[kind] ?? decimalPlaces ?? 2;
    const effectiveSuffix = suffix ?? DEFAULT_SUFFIX_BY_KIND[kind];
    const normalizedValue = value ?? null;

    // `currency`/`integer` usam a entrada estática (decimalPlaces fixo, §2 do
    // contrato); `percent`/`weight`/`quantity` reconstroem a entrada de
    // digitação direta quando `decimalPlaces` diverge do default (2) — mesma
    // família de algoritmo (`sanitizeDirectTyping`), só muda a precisão.
    const entry =
      kind === 'currency' || kind === 'integer'
        ? numericMaskSource[kind]
        : createDirectTypingEntry(effectiveDecimalPlaces);

    // Estado LOCAL do texto exibido — necessário para a digitação direta
    // (percent/weight/quantity) preservar estado parcial (ex.: "18," antes
    // do 2º dígito decimal) que não é recuperável só a partir do valor
    // numérico (`numberToDirectTypingDisplay` sempre formata completo, ex.
    // "18,00"). Sincroniza com o valor EXTERNO (carga inicial via
    // fillForm/reset, clamp programático) só quando ele diverge do que o
    // texto local já representa — nunca sobrescreve o que o usuário está
    // digitando no meio da tecla.
    const [displayText, setDisplayText] = useState(() => entry.toDisplay(normalizedValue));

    useEffect(() => {
      if (entry.parse(displayText) !== normalizedValue) {
        setDisplayText(entry.toDisplay(normalizedValue));
      }
      // Deps deliberadamente restritas a `normalizedValue`/`kind`/
      // `effectiveDecimalPlaces` — `entry`/`displayText` são recomputados a
      // cada render a partir desses mesmos valores; incluí-los criaria loop
      // (a própria atualização de `displayText` disparia o efeito de novo).
    }, [normalizedValue, kind, effectiveDecimalPlaces]);

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
      const formatted = entry.format(event.target.value);
      setDisplayText(formatted);

      let parsed = entry.parse(formatted);
      if (parsed !== null && max !== undefined) parsed = Math.min(parsed, max);
      if (parsed !== null && min !== undefined) parsed = Math.max(parsed, min);
      onValueChange(parsed);
    }

    // Clamp real de `min`/`max` no blur (mesmo mecanismo do `NumberInput`
    // atual) + reformatação para exatamente `decimalPlaces` casas (§3.2,
    // passo 5/6 do contrato).
    function handleBlur(event: FocusEvent<HTMLInputElement>) {
      let clamped = normalizedValue;
      if (clamped !== null) {
        if (max !== undefined && clamped > max) clamped = max;
        if (min !== undefined && clamped < min) clamped = min;
      }

      setDisplayText(entry.toDisplay(clamped));
      if (clamped !== normalizedValue) onValueChange(clamped);
      onBlur?.(event);
    }

    return (
      <Field
        label={label}
        errorText={error}
        helperText={helperText}
        tooltip={tooltip}
        isRequired={isRequired}
        invalid={!!error}
      >
        <Skeleton loading={loading} borderRadius="md" width="full">
          <InputGroup
            startElement={
              startElement ? <Icon as={startElement} boxSize="4" color="gray.400" /> : undefined
            }
            endElement={
              effectiveSuffix ? (
                <Text as="span" fontSize="sm" color="fg.muted" aria-hidden="true">
                  {effectiveSuffix}
                </Text>
              ) : undefined
            }
          >
            <ChakraInput
              id={name}
              name={name}
              ref={ref}
              inputMode={entry.inputMode}
              value={displayText}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={disabled}
              {...rest}
            />
          </InputGroup>
        </Skeleton>
      </Field>
    );
  }
);

NumericMaskedInput.displayName = 'NumericMaskedInput';
