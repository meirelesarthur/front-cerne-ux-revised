// src/components/Form/NumberInput.tsx
// -----------------------------------------------------------------------------
// REESCRITO (TASK-FE-143 / 2ª rodada pós-E2E da TASK-FE-142): o dev reprovou a
// correção anterior porque o mecanismo do Chakra v3 `NumberInput.Root`
// (Ark/Zag-js, `formatOptions`) só reformata o texto exibido no BLUR — durante
// a digitação o Zag mantém o texto cru, um paradigma diferente da máscara
// fill-da-direita usada na referência oficial
// (`../GB.Cerne.UX/src/pages/cadastros/contas-bancarias/ContaBancariaCadastro.tsx`,
// `mask="currency"`) e nos precedentes já corrigidos no próprio fork
// (`MoneyInput.tsx`, `CommissionPercentInput.tsx`).
//
// Este componente abandona `ChakraNumberInput.Root` e passa a ser construído
// sobre o `ChakraInput` cru — MESMA base estrutural de `MoneyInput`/
// `CommissionPercentInput` — reformatando o texto exibido A CADA `onChange`,
// a partir dos dígitos crus acumulados, sem prefixo/sufixo, generalizado por
// `decimalPlaces` (0/2/4...). Ver "Leitura do dev" da TASK-FE-143 para a
// tabela completa de digitação → exibição → payload.
//
// Contrato de saída MUDA de shape (breaking change deliberado): antes
// `onValueChange?: (details: { value: string; valueAsNumber: number }) => void`
// (formato do Chakra) e `value` era `string`; agora espelha EXATAMENTE
// `MoneyInputProps`/`CommissionPercentInputProps` — `value?: number | null` e
// `onValueChange?: (value: number | null) => void` (número puro, `null`
// quando o campo está vazio). Os 5 callsites (Regras Fiscais, Família de
// Bens, Centro de Custo, Operações, Agrupadores) foram ajustados nas Tarefas
// TASK-FE-144..148.
// -----------------------------------------------------------------------------
import { ChangeEvent, FocusEvent, forwardRef } from 'react';

import { Input as ChakraInput, InputProps as ChakraInputProps } from '@chakra-ui/react';

import { Field } from './Field';

interface Props extends Omit<ChakraInputProps, 'onChange' | 'value' | 'min' | 'max'> {
  name: string;
  label?: string;
  /** Também governa o estado visual "invalid" do `Field` (`invalid={!!error}`) — não é mais um prop externo separado (ver FIX da TASK-FE-144/146: `invalid` era exclusivo de `NumberInputRootProps`/Ark-Zag, inexistente em `ChakraInputProps`). */
  error?: string;
  helperText?: string;
  /** Ícone de informação ao lado da label (mirror `Input`/`Select`/`Textarea` —
   *  `Form/Field.tsx` já suporta `tooltip`; faltava só o forward aqui,
   *  adicionado em `TASK-FOOD-FE-08` para mover o helper text longo do
   *  campo `quantity` (Formulação) para tooltip). */
  tooltip?: string;
  isRequired?: boolean;
  /**
   * Mantido na interface por compatibilidade — NENHUM dos 5 consumidores
   * atuais passa `true` (confirmado por grep na TASK-FE-143). Sem efeito
   * nesta versão baseada em `ChakraInput` cru: não há steppers +/- (o
   * `ChakraNumberInput.Control` era exclusivo do `ChakraNumberInput.Root`
   * abandonado nesta reescrita).
   */
  incrementDecrement?: boolean;
  /** `false` força inteiro (`effectiveDecimalPlaces = 0`), ignorando `decimalPlaces`. */
  allowDot?: boolean;
  /** Casas decimais quando `allowDot` é `true` (default 2). */
  decimalPlaces?: number;
  /** Validação de faixa mínima delegada ao Yup/RHF — usado aqui só no clamp do blur. */
  min?: number;
  /** Cap de dígitos crus (digitação) + clamp real no blur. */
  max?: number;
  /** Valor numérico puro (ex.: 1234.56) — nunca a string mascarada. */
  value?: number | null;
  /** Devolve o valor numérico puro, ou `null` quando o campo está vazio — nunca a string mascarada. */
  onValueChange?: (value: number | null) => void;
}

const onlyDigits = (raw: string) => raw.replace(/\D/g, '');

// Formata dígitos crus em texto exibido com fill-da-direita (os últimos
// `decimalPlaces` dígitos viram a parte decimal) — mesmo algoritmo de
// `MoneyInput.formatCurrency()`, generalizado por `decimalPlaces` e SEM
// prefixo/sufixo. `decimalPlaces <= 0` agrupa os dígitos crus como inteiro
// puro (milhar com ".", sem parte decimal).
function formatMaskedNumber(digits: string, decimalPlaces: number): string {
  if (!digits) return '';

  if (decimalPlaces <= 0) {
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  const cents = (parseInt(digits, 10) / 10 ** decimalPlaces).toFixed(decimalPlaces);
  const [int, dec] = cents.split('.');
  const intGrouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${intGrouped},${dec}`;
}

// Converte dígitos crus no número puro (ex.: decimalPlaces=2, "123456" -> 1234.56).
// `''` -> `null` (preserva a distinção "vazio" vs. "zero digitado").
function digitsToNumber(digits: string, decimalPlaces: number): number | null {
  if (!digits) return null;
  return Number(digits) / 10 ** decimalPlaces;
}

// Converte o número puro do form nos dígitos crus usados para formatar a
// exibição — arredonda para fugir de erro de ponto flutuante.
function numberToDigits(value: number, decimalPlaces: number): string {
  return String(Math.round(value * 10 ** decimalPlaces));
}

export const NumberInput = forwardRef<HTMLInputElement, Props>(
  (
    {
      name,
      label,
      error,
      helperText,
      tooltip,
      isRequired,
      incrementDecrement = false,
      allowDot = false,
      decimalPlaces = 2,
      min,
      max,
      value,
      onValueChange,
      onBlur,
      ...rest
    },
    ref
  ) => {
    // Sem efeito nesta versão — ver comentário da prop na interface `Props`.
    void incrementDecrement;

    const effectiveDecimalPlaces = allowDot ? decimalPlaces : 0;

    // Cap de dígitos crus derivado de `max` (mesmo princípio de
    // `CommissionPercentInput.MAX_RAW_DIGITS`, mas calculado a partir do
    // prop): impede digitar mais dígitos do que o maior valor válido tem.
    // Limitação aceita (documentada na TASK-FE-143): não impede um valor
    // intermediário que excede `max` mas tem o mesmo número de dígitos — por
    // isso o clamp no `onBlur` abaixo é obrigatório.
    const maxRawDigits =
      max !== undefined ? String(Math.round(max * 10 ** effectiveDecimalPlaces)).length : undefined;

    const digits =
      value === undefined || value === null || Number.isNaN(value)
        ? ''
        : numberToDigits(value, effectiveDecimalPlaces);
    const displayValue = formatMaskedNumber(digits, effectiveDecimalPlaces);

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
      let rawDigits = onlyDigits(event.target.value);
      if (maxRawDigits !== undefined) {
        rawDigits = rawDigits.slice(0, maxRawDigits);
      }
      onValueChange?.(digitsToNumber(rawDigits, effectiveDecimalPlaces));
    }

    // Repõe o `clampValueOnBlur` que o `ChakraNumberInput.Root` fazia
    // nativamente e que se perde ao abandonar esse componente (ver risco 3
    // da TASK-FE-143): ao perder o foco, se o valor atual estiver fora de
    // `[min, max]`, grampeia para o limite mais próximo e dispara
    // `onValueChange` com o valor grampeado — o texto mascarado é
    // recalculado automaticamente no próximo render, a partir do `value`
    // controlado que o caller (RHF) atualiza.
    function handleBlur(event: FocusEvent<HTMLInputElement>) {
      if (value !== undefined && value !== null && !Number.isNaN(value)) {
        let clamped = value;
        if (max !== undefined && clamped > max) clamped = max;
        if (min !== undefined && clamped < min) clamped = min;

        if (clamped !== value) {
          onValueChange?.(clamped);
        }
      }

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
        <ChakraInput
          id={name}
          name={name}
          ref={ref}
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          {...rest}
        />
      </Field>
    );
  }
);

NumberInput.displayName = 'NumberInput';
