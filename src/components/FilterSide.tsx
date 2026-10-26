import { Box, CloseButton, Drawer, Flex, Portal, Text } from '@chakra-ui/react';

import { Icon } from './ui/Icon';

import { LanguageDate } from '@/@types/language';

interface FilterSideProps {
  isOpen: boolean;
  onClose: () => void;
  languageGB: LanguageDate;
  children: React.ReactNode;
  /**
   * Contagem de filtros ativos, exibida como badge ao lado do título do
   * drawer (fiel ao `activeCount` do `FilterDrawer.tsx` do cerne). ADITIVO e
   * OPCIONAL — default `undefined`/`0` preserva 100% o header atual (sem
   * badge) para quem já usa `FilterSide` sem esta prop.
   */
  filtersApplied?: number;
}

export function FilterSide({
  isOpen,
  onClose,
  languageGB,
  children,
  filtersApplied,
}: FilterSideProps) {
  return (
    // @ts-ignore
    <Drawer.Root
      open={isOpen}
      onOpenChange={(e: { open: boolean }) => {
        if (!e.open) onClose();
      }}
      placement="end"
      size="xs"
      closeOnInteractOutside={false}
      modal={false}
    >
      <Portal>
        {/* @ts-ignore — inset alinhado à faixa dos cards. Topo = canvas my (8px)
            + topbar h (48px) + padding-de-topo do card (8px); embaixo/à direita =
            canvas (8px) + padding do card (8px). */}
        <Drawer.Positioner
          paddingTop="calc(8px + 48px + 8px)"
          paddingBottom="calc(8px + 8px)"
          paddingInlineEnd="calc(8px + 8px)"
        >
          {/* @ts-ignore */}
          <Drawer.Content
            bg="formBG"
            border="1px solid"
            borderColor="border2"
            borderRadius="xl"
            overflow="hidden"
            boxShadow="overlay"
          >
            <Drawer.Header borderBottom="1px solid" borderColor="border2">
              <Drawer.Title>
                <Flex align="center" gap="8px">
                  <Box color="green.600" display="flex">
                    <Icon name="filter-advanced" size="sm" />
                  </Box>
                  <Text fontSize="md" fontWeight="semibold">
                    {languageGB.defaltStrings.filters}
                  </Text>
                  {!!filtersApplied && filtersApplied > 0 && (
                    <Box as="span" px="6px" borderRadius="full" bg="green.600" color="white" fontSize="xs" fontWeight="bold" lineHeight="1.6">
                      {filtersApplied}
                    </Box>
                  )}
                </Flex>
              </Drawer.Title>
              <Drawer.CloseTrigger asChild position="absolute" top="3" insetEnd="3">
                <CloseButton size="sm" />
              </Drawer.CloseTrigger>
            </Drawer.Header>
            <Drawer.Body overflow="auto" flex="1" minHeight="0">
              {children}
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  );
}
