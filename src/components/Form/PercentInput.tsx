// src/components/Form/PercentInput.tsx
// -----------------------------------------------------------------------------
// Input PERCENTUAL compartilhado — `TASK-FE-330` promove para
// `src/components/Form/` a MESMA mecânica já provada e em produção em
// `src/pages/CadastrosBase/Servicos/CommissionPercentInput.tsx` (achado
// `ServiceExpense-contrato.md` §15/`TASK-FE-132`/`ERRO-FE-009`), porque
// Pessoas precisa da mesma máscara percentual em 3 campos de 3 Steps
// DIFERENTES (`proprietary.farms[].percentage`, `employee.commission`,
// `provider.commission`) dentro do mesmo módulo — copiado (não importado),
// generalizado como componente compartilhado.
//
// `Servicos/CommissionPercentInput.tsx` PERMANECE INTOCADO/local — este
// arquivo NÃO o substitui nem o importa (zero risco de regressão em
// Estorno/Atividades/Serviços ao tocar um componente compartilhado). Mesma
// razão pela qual `MoneyInput.tsx`/`NumberInput.tsx` já existem separados de
// implementações locais mais antigas.
//
// Contrato idêntico ao de origem: `value?: number | null` (dígitos crus →
// "12,50%", SEM agrupamento de milhar — percentual nunca agrupa, mesma nota
// do `ERRO-FE-009`), `onValueChange?: (value: number) => void` sempre número
// puro (nunca a string mascarada), `MAX_RAW_DIGITS = 4` (cap de até
// "99,99%", suficiente para os 3 campos de Pessoas — sempre ≤100%),
// backspace/`Delete` no FIM do campo tratado (mesma correção do
// `ERRO-FE-009` — o sufixo "%" fica ao final do `displayValue`, fora da rota
// natural de edição por backspace nativo).
// -----------------------------------------------------------------------------
import { ChangeEvent, forwardRef, KeyboardEvent } from 'react';

import { Input as ChakraInput, InputProps as ChakraInputProps } from '@chakra-ui/react';

import { Field } from './Field';

interface PercentInputProps extends Omit<ChakraInputProps, 'onChange' | 'value'> {
  name: string;
  label?: string;
  isRequired?: boolean;
  error?: string;
  helperText?: string;
  /** Valor numérico puro (ex.: 12.5) — nunca a string mascarada. */
  value?: number | null;
  /** Devolve o valor numérico puro já convertido (nunca a string mascarada). */
  onValueChange?: (value: number) => void;
  /**
   * TASK-FE-334 — teto opcional do valor numérico (ex.: `100` para permitir
   * digitar até "100,00%"). SEM a prop: comportamento IDÊNTICO ao anterior
   * (`MAX_RAW_DIGITS = 4`, cap ~99,99%, zero mudança observável). COM a
   * prop: o número de dígitos crus é recalculado por instância a partir de
   * `maxValue`, e o valor resultante é CLAMPADO a `maxValue` no
   * `handleChange`, ANTES de chamar `onValueChange` — nunca deixa um valor
   * acima do teto chegar ao form, nem por um frame.
   */
  maxValue?: number;
}

const DEFAULT_MAX_RAW_DIGITS = 4;

// Sem `maxValue`: cap fixo de 4 dígitos crus (~99,99%), comportamento
// preservado. Com `maxValue`: dígitos suficientes para representar o teto
// com 2 casas decimais (ex.: `maxValue=100` -> "10000" -> 5 dígitos).
function maxRawDigitsFor(maxValue?: number): number {
  if (maxValue == null) return DEFAULT_MAX_RAW_DIGITS;
  return String(Math.round(maxValue * 100)).length;
}

const onlyDigits = (raw: string, maxRawDigits: number) =>
  raw.replace(/\D/g, '').slice(0, maxRawDigits);

// Formata dígitos crus em "12,50%" — mesmo algoritmo de máscara de
// `Servicos/CommissionPercentInput.tsx`, SEM agrupamento de milhar
// (percentual nunca agrupa).
function formatPercentage(digits: string): string {
  if (!digits) return '';
  const cents = (parseInt(digits, 10) / 100).toFixed(2);
  const [int, dec] = cents.split('.');
  return `${int},${dec}%`;
}

// Converte dígitos crus (centésimos de %) no número puro (ex.: "1250" -> 12.50).
function digitsToNumber(digits: string): number {
  if (!digits) return 0;
  return Number(digits) / 100;
}

// Converte o número puro do form (ex.: 12.5) nos dígitos crus usados para
// formatar a exibição — arredonda para fugir de erro de ponto flutuante.
function numberToDigits(value: number, maxRawDigits: number): string {
  return String(Math.round(value * 100)).slice(0, maxRawDigits);
}

export const PercentInput = forwardRef<HTMLInputElement, PercentInputProps>(
  (
    { name, label, isRequired, error, helperText, value, onValueChange, maxValue, ...rest },
    ref
  ) => {
    const maxRawDigits = maxRawDigitsFor(maxValue);
    const digits =
      value === undefined || value === null || Number.isNaN(value)
        ? ''
        : numberToDigits(value, maxRawDigits);
    const displayValue = formatPercentage(digits);

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
      const rawDigits = onlyDigits(event.target.value, maxRawDigits);
      const rawNumber = digitsToNumber(rawDigits);
      const clamped = maxValue != null ? Math.min(rawNumber, maxValue) : rawNumber;
      onValueChange?.(clamped);
    }

    // Backspace/Delete com o cursor no fim do campo (na ou após a posição do
    // "%") não alcança nenhum dígito no `event.target.value` nativo — mesma
    // correção do `ERRO-FE-009` em `Servicos/CommissionPercentInput.tsx`.
    function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
      if (event.key !== 'Backspace' && event.key !== 'Delete') return;

      const input = event.currentTarget;
      const selectionStart = input.selectionStart ?? displayValue.length;
      const selectionEnd = input.selectionEnd ?? displayValue.length;
      const percentIndex = displayValue.length > 0 ? displayValue.length - 1 : 0;
      const cursorAtOrAfterPercent = selectionStart >= percentIndex && selectionEnd >= percentIndex;

      if (!cursorAtOrAfterPercent) return;

      event.preventDefault();

      if (selectionStart !== selectionEnd) {
        // Seleção múltipla cobrindo o sufixo: trata como "limpar tudo".
        onValueChange?.(digitsToNumber(''));
        return;
      }

      const currentDigits = onlyDigits(displayValue, maxRawDigits);
      const nextDigits = currentDigits.slice(0, -1);
      onValueChange?.(digitsToNumber(nextDigits));
    }

    return (
      <Field
        label={label}
        errorText={error}
        helperText={helperText}
        isRequired={isRequired}
        invalid={!!error}
      >
        <ChakraInput
          id={name}
          name={name}
          ref={ref}
          inputMode="numeric"
          placeholder="0,00%"
          value={displayValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          {...rest}
        />
      </Field>
    );
  }
);

PercentInput.displayName = 'PercentInput';
