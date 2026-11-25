// src/components/ui/ModuleLinkCard.tsx
// Card que leva a um módulo: ícone, título, uma linha de apoio e, opcionalmente, uma tag de
// destino (Badge `success`). O card inteiro é o botão — não há "Continuar" separado.
// `size="lg"`: card central de escolha (ícone grande, conteúdo centralizado).
// `size="sm"`: atalho compacto em linha (ícone à esquerda).

import { Box, Flex, Text } from '@chakra-ui/react';

import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import type { IconName } from '@/components/ui/Icon';

// `as="button"` não aceita `type` nos tipos do Chakra; entra por spread.
const BUTTON_ATTRS = { type: 'button' } as Record<string, string>;

export interface ModuleLinkCardProps {
  icon: IconName;
  title: string;
  description?: string;
  /** Destino em linguagem do usuário (ex.: "Abre a solicitação de serviço"). */
  tag?: string;
  size?: 'lg' | 'sm';
  onClick: () => void;
}

export function ModuleLinkCard({
  icon,
  title,
  description,
  tag,
  size = 'lg',
  onClick,
}: ModuleLinkCardProps) {
  const large = size === 'lg';

  return (
    <Flex
      as="button"
      {...BUTTON_ATTRS}
      onClick={onClick}
      direction={large ? 'column' : 'row'}
      align={large ? 'center' : 'flex-start'}
      textAlign={large ? 'center' : 'left'}
      gap={large ? '12px' : '10px'}
      w="100%"
      h="100%"
      minW={0}
      minH="44px"
      p={large ? '24px 20px' : '12px'}
      borderRadius="xl"
      borderWidth="1.5px"
      borderColor="semanticNeutral.200"
      bg="cardBG"
      cursor="pointer"
      transition="border-color 0.15s, background-color 0.15s"
      _hover={{ borderColor: 'green.600', bg: 'selectedBG' }}
      _focusVisible={{ outline: '2px solid', outlineColor: 'green.600', outlineOffset: '2px' }}
    >
      <Flex
        flexShrink={0}
        align="center"
        justify="center"
        w={large ? '48px' : 'auto'}
        h={large ? '48px' : 'auto'}
        borderRadius="full"
        bg={large ? 'selectedBG' : 'transparent'}
        color="green.600"
      >
        <Icon name={icon} size={large ? 'xl' : 'sm'} />
      </Flex>
      <Box minW={0}>
        <Text fontSize={large ? 'xl' : 'md'} fontWeight="semibold" color="fg.default">
          {title}
        </Text>
        {description && (
          <Text mt="4px" fontSize={large ? 'md' : 'sm'} color="fg.muted">
            {description}
          </Text>
        )}
      </Box>
      {tag && (
        <Box mt="auto" pt={large ? '4px' : 0}>
          <Badge label={tag} variant="success" />
        </Box>
      )}
    </Flex>
  );
}

export default ModuleLinkCard;
