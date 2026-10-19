// src/components/Form/InputReadOnly.tsx
import { Box, Flex, Skeleton } from "@chakra-ui/react";

import { Field } from "./Form/Field"; // 1. Importando nosso wrapper Field

interface InputReadOnlyProps {
  name?: string;
  label?: string;
  error?: string;
  helperText?: string;
  value: string;
  suffix?: string;
  loading?: boolean;
  isRequired?: boolean;
}

export function InputReadOnly({
  name,
  label,
  error,
  helperText,
  value,
  suffix,
  loading = false,
  isRequired,
}: InputReadOnlyProps) {
  return (
    // 2. Usando o Field para lidar com rótulo, erro e texto de ajuda
    <Field
      label={label}
      name={name}
      errorText={error}
      helperText={helperText}
      isRequired={isRequired}
    >
      <Skeleton
        loading={loading}
        width="full"
        borderRadius="md"
        // 3. Novas props para cores do Skeleton
        css={{
          "--start-color": "var(--chakra-colors-primary-500)",
          "--end-color": "var(--chakra-colors-border2)",
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
          <Box>{value}</Box>
          {suffix && <Box>{suffix}</Box>}
        </Box>
      </Skeleton>
    </Field>
  );
}
