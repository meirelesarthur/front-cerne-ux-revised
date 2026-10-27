// src/components/ui/PageHeader.tsx
// Título de página (DS `PageHeader`): título 24px em negrito, contador opcional em pílula e
// descrição de apoio. Fonte única do título das telas — não montar `Text` inline.

import { Box, Flex, Heading, Text } from '@chakra-ui/react';

export interface PageHeaderProps {
  title: string;
  description?: string;
  /** Total de registros (pílula ao lado do título). */
  count?: number;
}

export function PageHeader({ title, description, count }: PageHeaderProps) {
  return (
    <Box minW={0}>
      <Flex align="center" gap="8px">
        <Heading as="h1" fontSize="title" fontWeight="bold" lineHeight="1.2" color="strongText" letterSpacing="-0.4px">
          {title}
        </Heading>
        {count !== undefined && (
          <Box as="span" px="7px" py="1px" borderRadius="md" bg="semanticNeutral.100" color="fg.muted" fontSize="sm" fontWeight="medium" lineHeight="1.6">
            {count}
          </Box>
        )}
      </Flex>
      {description && (
        <Text fontSize="sm" color="fg.muted" mt="4px">
          {description}
        </Text>
      )}
    </Box>
  );
}

export default PageHeader;
