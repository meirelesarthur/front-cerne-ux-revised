// src/components/Form/MoneyInput.tsx
// -----------------------------------------------------------------------------
// Input monetário (R$ + milhar "." + 2 casas ",") — achado E2E do dev no form
// de Atividades (`vl_hectare`), execução 016. Algoritmo de máscara espelha
// `GB.Cerne.UX/src/components/ui/masks.ts` (mask `currency`: dígitos crus →
// `R$ 1.234,56`), PORTADO para a stack do fork (React 18 + Chakra v3), sem
// import cross-repo.
//
// NÃO usa `react-currency-input` (a lib já presente em
// `src/components/Form/kgInput.tsx`) de propósito: a versão instalada
// (1.3.6) renderiza o `<input>` nativamente dentro do próprio componente e
// NÃO suporta o padrão de render-prop (`children` como função) que o
// `KgInput` tenta usar — isso quebraria em runtime ("void element tag must
// neither have children") se o `KgInput` fosse de fato montado. Aqui o
// mascaramento é feito manualmente sobre o `ChakraInput` já usado em
// `./Input.tsx`, evitando repetir essa armadilha.
//
// Contrato de saída: `onValueChange` entrega SEMPRE o número puro (ex.:
// 1234.56), nunca a string mascarada — o caller (RHF `Controller`) grava
// esse número no formulário; o payload para a API segue número puro, sem
// qualquer conversão de string.
// -----------------------------------------------------------------------------
import { ChangeEvent, forwardRef } from 'react';

import { Input as ChakraInput, InputProps as ChakraInputProps } from '@chakra-ui/react';

import { Field } from './Field';

interface MoneyInputProps extends Omit<ChakraInputProps, 'onChange' | 'value'> {
  name: string;
  label?: string;
  isRequired?: boolean;
  error?: string;
  helperText?: string;
  /** Ícone de info no label (hover mostra o texto) — Lote 2 (helperText →
   *  tooltip). Repassado direto ao `Field`, que já suporta essa prop. */
  tooltip?: string;
  /**
   * Casas decimais da máscara (default 2). ADITIVA (T-081-FE-03): o preço
   * unitário do formulário público do fornecedor usa 4 casas, como o legado
   * (`money4`). Com o default, o comportamento é idêntico ao anterior.
   */
  fractionDigits?: number;
  /** Valor numérico puro (ex.: 1234.56) — nunca a string mascarada. */
  value?: number | null;
  /** Devolve o valor numérico puro já convertido (nunca a string mascarada). */
  onValueChange?: (value: number) => void;
}

const onlyDigits = (raw: string) => raw.replace(/\D/g, '');

// Formata dígitos crus (centavos) em "R$ 1.234,56" — mesmo algoritmo da
// máscara `currency` de GB.Cerne.UX/src/components/ui/masks.ts.
function formatCurrency(digits: string, fractionDigits: number): string {
  if (!digits) return '';
  const padded = digits.replace(/^0+(?=\d)/, '').padStart(fractionDigits + 1, '0');
  const int = padded.slice(0, padded.length - fractionDigits);
  const dec = padded.slice(padded.length - fractionDigits);
  const intGrouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return fractionDigits > 0 ? `R$ ${intGrouped},${dec}` : `R$ ${intGrouped}`;
}

// Converte dígitos crus (centavos) no número puro (ex.: "123456" -> 1234.56).
function digitsToNumber(digits: string, fractionDigits: number): number {
  if (!digits) return 0;
  return Number(digits) / 10 ** fractionDigits;
}

// Converte o número puro do form (ex.: 1234.56) nos dígitos crus (centavos)
// usados para formatar a exibição — arredonda para fugir de erro de ponto
// flutuante (1234.55 * 100 = 123454.99999999999).
function numberToDigits(value: number, fractionDigits: number): string {
  return String(Math.round(value * 10 ** fractionDigits));
}

export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(
  (
    {
      name,
      label,
      isRequired,
      error,
      helperText,
      tooltip,
      fractionDigits = 2,
      value,
      onValueChange,
      ...rest
    },
    ref
  ) => {
    const digits =
      value === undefined || value === null || Number.isNaN(value)
        ? ''
        : numberToDigits(value, fractionDigits);
    const displayValue = formatCurrency(digits, fractionDigits);
    const placeholder = `R$ ${(0).toFixed(fractionDigits).replace('.', ',')}`;

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
      const rawDigits = onlyDigits(event.target.value);
      onValueChange?.(digitsToNumber(rawDigits, fractionDigits));
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
          placeholder={placeholder}
          value={displayValue}
          onChange={handleChange}
          // Estilo explícito espelhando `DateInput`/`Input.tsx` canônico
          // (fix ERRO-FE — Valor de Registro/Eventos, rejeição AD do
          // Arthur): a recipe compartilhada `input` (chakra.config.ts /
          // src/styles/recipes/input.ts) é MERGEADA por
          // `createSystem(defaultConfig, config)` com a recipe NATIVA do
          // Chakra v3 para `Input`. Essa recipe nativa define
          // `variants.variant.outline.bg: "transparent"` — como a recipe do
          // projeto nunca sobrescreve `bg` no nível de VARIANTE (só no
          // `base`), o merge profundo preserva o `bg: "transparent"` nativo
          // no variant "outline" (variant default), que VENCE o `bg:
          // "inputBG"` do `base` (variant é aplicado por cima do base em
          // `cva.js`). Resultado: o `ChakraInput` cru fica com fundo
          // TRANSPARENTE, deixando o cinza do container por trás aparecer —
          // aparentando "disabled" mesmo EDITÁVEL. `DateInput` não sofre
          // isso porque nunca passou pela recipe `input` (usa
          // `DatePicker.Input`, estilizado 100% via props diretas). Props
          // diretas (`bg`, `border`, etc.) vivem na camada "utilities" do
          // Panda/Chakra, que tem precedência SEMPRE sobre a camada
          // "recipes" — por isso setar aqui, explicitamente, resolve sem
          // tocar na recipe compartilhada (blast radius de ~106 telas fica
          // fora do escopo deste fix pontual; ver relatório do Executor).
          bg="inputBG"
          color="primitiveTexteColor"
          border="1px solid"
          borderColor="border2"
          borderRadius="6px"
          height="38px"
          _placeholder={{ color: 'placeholderColor' }}
          _hover={{ borderColor: 'border2' }}
          _focus={{
            borderColor: 'primaryMain',
            boxShadow: '0 0 0 1px var(--chakra-colors-primary-main)',
          }}
          {...rest}
        />
      </Field>
    );
  }
);

MoneyInput.displayName = 'MoneyInput';
