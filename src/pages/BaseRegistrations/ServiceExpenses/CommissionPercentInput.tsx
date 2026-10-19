// src/pages/BaseRegistrations/ServiceExpenses/CommissionPercentInput.tsx
// -----------------------------------------------------------------------------
// SHIM LOCAL (97-Esteiras/001, Wave 2 — 02-Mapa-Consolidacao.md §1) — delega
// inteiramente a `MaskedInput kind="percent"` (`@/components/Form/MaskedInput`).
// Algoritmo próprio de máscara (`formatPercentage`/`digitsToNumber`/
// `numberToDigits`/`handleKeyDown` de resgate de backspace no sufixo "%")
// REMOVIDO — a correção KB-06 (digitação direta) e o sufixo via `endElement`
// (fora do texto editável) já eliminam por construção a classe de bug que
// aquele `onKeyDown` existia para contornar (ver cabeçalho anterior deste
// arquivo, preservado no histórico do Git).
//
// PERMANECE no MESMO caminho (decisão do mapa de consolidação — é local à
// tela de Serviços, não migra para `components/Form/`), só troca a
// implementação interna. Único consumidor real
// (`CreateOrUpdateServiceExpenses.tsx`, campo `commission`) NÃO muda
// nenhuma linha nesta Wave — zero diff no callsite, mesmo padrão do shim.
//
// Contrato de saída INALTERADO: `onValueChange` sempre devolve número puro
// (nunca a string mascarada) — `commission` continua `number` no payload.
// -----------------------------------------------------------------------------
import { forwardRef } from 'react';

import { InputProps as ChakraInputProps } from '@chakra-ui/react';

import { NumberInput } from '@/components/Form/NumberInput';

interface CommissionPercentInputProps extends Omit<
  ChakraInputProps,
  'onChange' | 'value' | 'min' | 'max'
> {
  name: string;
  label?: string;
  isRequired?: boolean;
  error?: string;
  helperText?: string;
  /** Valor numérico puro (ex.: 12.5) — nunca a string mascarada. */
  value?: number | null;
  /** Devolve o valor numérico puro já convertido (nunca a string mascarada). */
  onValueChange?: (value: number) => void;
}

export const CommissionPercentInput = forwardRef<HTMLInputElement, CommissionPercentInputProps>(
  ({ name, label, isRequired, error, helperText, value, onValueChange, ...rest }, ref) => (
    <NumberInput
      ref={ref}
      allowDot
      decimalPlaces={2}
      name={name}
      label={label}
      isRequired={isRequired}
      error={error}
      helperText={helperText}
      value={value ?? null}
      onValueChange={(nextValue) => onValueChange?.(nextValue ?? 0)}
      {...rest}
    />
  )
);

CommissionPercentInput.displayName = 'CommissionPercentInput';
