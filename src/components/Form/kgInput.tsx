// src/components/Form/kgInput.tsx
// -----------------------------------------------------------------------------
// SHIM FINO (97-Esteiras/001, Wave 2 — 02-Mapa-Consolidacao.md §1) — delega
// inteiramente a `MaskedInput kind="weight"` (`./MaskedInput`,
// `utils/masks/numeric.ts::sanitizeDirectTyping`/`numberToDirectTypingDisplay`,
// correção KB-06: digitação direta, nunca right-fill). Algoritmo próprio
// (`formatMasked`/`digitsToNumber`/`numberToDigits`) REMOVIDO — não coexiste
// mais com o módulo novo (mapa §4, item 4).
//
// Contrato público INALTERADO — único consumidor histórico
// (`CreateOrUpdateParameterWeights.tsx`) migrou nesta mesma Wave para
// `MaskedInput` direto, então este shim hoje não tem callsite real; mantido
// (não removido) até a Wave 3 confirmar, por grep, que nenhum import novo
// apareceu (ordem de remoção física do mapa §1, nunca antes de todos os
// callsites migrarem). `onChange(event, maskedValue, floatValue)` continua
// aceito: `event` é sintetizado a partir do valor numérico interno (não há
// `ChangeEvent` real disponível na fronteira `onValueChange` do
// `MaskedInput`) — suficiente para qualquer consumidor futuro que leia só
// `maskedValue`/`floatValue`, mesmo padrão que os 3 argumentos já entregavam.
// -----------------------------------------------------------------------------
import { ChangeEvent, forwardRef } from 'react';

import { InputProps as ChakraInputProps } from '@chakra-ui/react';

import { numberToDirectTypingDisplay } from '@/utils/masks/numeric';

import { NumberInput } from '@/components/Form/NumberInput';

interface KgInputProps extends Omit<ChakraInputProps, 'onChange' | 'min' | 'max'> {
  name: string;
  label?: string;
  isRequired?: boolean;
  isReadOnly?: boolean;
  error?: string;
  helperText?: string;
  value?: string | number;
  /** Retorna o evento (sintetizado), o valor mascarado (string) e o valor puro (number). */
  onChange?: (
    event: ChangeEvent<HTMLInputElement>,
    maskedValue: string,
    floatValue: number
  ) => void;
  /** Mantido por compatibilidade — `MaskedInput kind="weight"` já é sempre fracionário. */
  allowDot?: boolean;
  /** Define o número de casas decimais (default 2, mesmo default do componente antigo). */
  decimalPlaces?: number;
}

export const KgInput = forwardRef<HTMLInputElement, KgInputProps>(
  (
    {
      name,
      label,
      isRequired,
      error,
      helperText,
      value,
      onChange,
      isReadOnly,
      decimalPlaces = 2,
      ...rest
    },
    ref
  ) => {
    const numericValue =
      value === undefined || value === null || value === '' ? null : Number(value);

    function handleValueChange(nextValue: number | null) {
      const maskedValue = numberToDirectTypingDisplay(nextValue, decimalPlaces);
      const floatValue = nextValue ?? 0;
      const syntheticEvent = {
        target: { name, value: maskedValue },
      } as unknown as ChangeEvent<HTMLInputElement>;
      onChange?.(syntheticEvent, maskedValue, floatValue);
    }

    return (
      <NumberInput
        ref={ref}
        allowDot
        name={name}
        label={label}
        isRequired={isRequired}
        error={error}
        helperText={helperText}
        value={numericValue}
        onValueChange={handleValueChange}
        decimalPlaces={decimalPlaces}
        disabled={isReadOnly}
        {...rest}
      />
    );
  }
);

KgInput.displayName = 'KgInput';
