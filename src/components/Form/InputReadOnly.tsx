// src/components/Form/InputReadOnly.tsx
import { Box, BoxProps, Flex, Skeleton } from '@chakra-ui/react';

import { Field } from './Field'; // 1. Importando nosso wrapper Field

interface InputReadOnlyProps {
  name?: string;
  label?: string;
  error?: string;
  helperText?: string;
  /** Ícone de info no label (hover mostra o texto) — Lote 2 (helperText →
   *  tooltip). Repassado direto ao `Field`, que já suporta essa prop. */
  tooltip?: string;
  value: string;
  suffix?: string;
  loading?: boolean;
  isRequired?: boolean;
  /** Opcional — sobrescreve o `fontSize` do texto do valor (token do design
   *  system). Default: nenhum (mantém o comportamento herdado atual de todos
   *  os consumidores existentes). Uso pontual: paridade visual com outro
   *  controle na mesma linha (ex. `SelectAsyncPaginate`, cujo `singleValue`
   *  usa `fontSizes.md`). */
  fontSize?: BoxProps['fontSize'];
}

export function InputReadOnly({
  name,
  label,
  error,
  helperText,
  tooltip,
  value,
  suffix,
  loading = false,
  isRequired,
  fontSize,
}: InputReadOnlyProps) {
  return (
    // 2. Usando o Field para lidar com rótulo, erro e texto de ajuda
    <Field
      label={label}
      name={name}
      errorText={error}
      helperText={helperText}
      tooltip={tooltip}
      isRequired={isRequired}
    >
      <Skeleton
        loading={loading}
        width="full"
        borderRadius="md"
        // 3. Novas props para cores do Skeleton
        css={{
          '--start-color': 'var(--chakra-colors-primary-500)',
          '--end-color': 'var(--chakra-colors-border2)',
        }}
      >
        <Box
          as={Flex}
          border="1px solid"
          borderColor="border2"
          borderRadius="md"
          height="8"
          padding="4"
          width="full"
          color="textReadOnlyColor"
          background="semanticNeutral.200"
          alignItems="center"
          cursor="not-allowed"
        >
          <Box
            fontSize={fontSize}
            // Truncamento SÓ entra quando `fontSize` é passado (uso pontual
            // deste ajuste) — nenhum outro consumidor do `InputReadOnly`
            // passa essa prop hoje, logo o comportamento deles (sem overflow
            // handling, igual antes) permanece intacto.
            overflow={fontSize ? 'hidden' : undefined}
            textOverflow={fontSize ? 'ellipsis' : undefined}
            whiteSpace={fontSize ? 'nowrap' : undefined}
            title={fontSize ? value : undefined}
          >
            {value}
          </Box>
          {suffix && <Box>{suffix}</Box>}
        </Box>
      </Skeleton>
    </Field>
  );
}
