import { ReactNode } from 'react';

import { Tooltip as ChakraTooltip, Portal, useMediaQuery } from '@chakra-ui/react';

interface TooltipProps extends ChakraTooltip.RootProps {
  children: ReactNode;
  content?: ReactNode;
  label?: ReactNode; // Alias para content (retrocompatibilidade)
  showArrow?: boolean;
  portalled?: boolean;
  disabled?: boolean;
}

export function Tooltip({
  children,
  content,
  label,
  showArrow = false,
  portalled = true,
  disabled = false,
  ...rest
}: TooltipProps) {
  const [isMobile] = useMediaQuery(['(max-width: 680px)']);

  // Usa content ou label (retrocompatibilidade)
  const tooltipContent = content ?? label;

  // Se disabled ou sem conteúdo, retorna apenas o children
  if (disabled || !tooltipContent) {
    return <>{children}</>;
  }

  return (
    <ChakraTooltip.Root
      openDelay={300}
      closeDelay={100}
      closeOnScroll={isMobile}
      positioning={{ placement: 'top' }}
      {...rest}
    >
      <ChakraTooltip.Trigger asChild>{children}</ChakraTooltip.Trigger>

      <Portal disabled={!portalled}>
        <ChakraTooltip.Positioner>
          <ChakraTooltip.Content
            bg="gray.700"
            color="white"
            px="3"
            py="2"
            borderRadius="md"
            fontSize="sm"
            maxW="xs"
            textAlign="center"
          >
            {showArrow && (
              <ChakraTooltip.Arrow>
                <ChakraTooltip.ArrowTip />
              </ChakraTooltip.Arrow>
            )}
            {tooltipContent}
          </ChakraTooltip.Content>
        </ChakraTooltip.Positioner>
      </Portal>
    </ChakraTooltip.Root>
  );
}
