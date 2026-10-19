// src/pages/CadastrosBase/Produtos/Catalogo/ProductReadOnlyField.tsx
// -----------------------------------------------------------------------------
// UT-000781 — campo somente-leitura da tela de DETALHE do Produto com altura
// adaptável e quebra de linha. O `InputReadOnly` compartilhado tem
// `height="8"` fixa e `padding="4"`, então valores longos (NCM, Descrição,
// Centro de Custo...) ultrapassavam a borda. Mesmo visual (tokens), mas
// `minHeight` + `overflowWrap: anywhere`. Local à pasta do Produto — o
// componente compartilhado não é alterado.
// -----------------------------------------------------------------------------

import { Box, Flex, Skeleton } from '@chakra-ui/react';

import { Field } from '@/components/Form/Field';

interface ProductReadOnlyFieldProps {
  name?: string;
  label?: string;
  helperText?: string;
  tooltip?: string;
  value: string;
  suffix?: string;
  loading?: boolean;
}

export function ProductReadOnlyField({
  name,
  label,
  helperText,
  tooltip,
  value,
  suffix,
  loading = false,
}: ProductReadOnlyFieldProps) {
  return (
    <Field label={label} name={name} helperText={helperText} tooltip={tooltip}>
      <Skeleton
        loading={loading}
        width="full"
        borderRadius="md"
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
          minHeight="8"
          paddingX="4"
          paddingY="1.5"
          width="full"
          color="textReadOnlyColor"
          background="semanticNeutral.200"
          alignItems="center"
          cursor="not-allowed"
        >
          <Box whiteSpace="normal" overflowWrap="anywhere" minWidth={0}>
            {value}
          </Box>
          {suffix && <Box ml="1">{suffix}</Box>}
        </Box>
      </Skeleton>
    </Field>
  );
}
