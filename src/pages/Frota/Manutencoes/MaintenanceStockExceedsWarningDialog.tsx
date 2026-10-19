// src/pages/Frota/Manutencoes/MaintenanceStockExceedsWarningDialog.tsx
// -----------------------------------------------------------------------------
// Modal de aviso quando a Quantidade informada de uma linha ultrapassa a
// quantidade disponível em estoque do item selecionado — Tarefa 44. Mesmo
// COMPORTAMENTO (bloqueio + aviso, mirror CLM-07/CLM-23) de
// `Frota/Abastecimentos/SupplyStockExceedsWarningDialog.tsx` — casca visual
// idêntica (Dialog.Root + Portal), textos próprios de `languageMaintenances`.
// -----------------------------------------------------------------------------

import { Dialog, Flex, Icon, Portal, Text, VStack } from '@chakra-ui/react';
import { FiAlertTriangle } from 'react-icons/fi';

import { Button } from '@/components/Button';

import { useLanguage } from '@/hooks/useLanguage';

export interface MaintenanceStockExceedsWarningDialogProps {
  isOpen: boolean;
  onClose: () => void;
  informedQuantity: number;
  stockQuantity: number;
}

function formatNumber(value: number) {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}

export function MaintenanceStockExceedsWarningDialog({
  isOpen,
  onClose,
  informedQuantity,
  stockQuantity,
}: MaintenanceStockExceedsWarningDialogProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.maintenances.maintenance.form.stockExceedsDialog;

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(details: { open: boolean }) => {
        if (!details.open) onClose();
      }}
      lazyMount
      unmountOnExit
    >
      <Portal>
        <Dialog.Backdrop />
        {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
        <Dialog.Positioner>
          {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
          <Dialog.Content>
            <Dialog.Header>
              {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
              <Dialog.Title>
                <Flex align="center" gap={2}>
                  <Icon as={FiAlertTriangle} color="orange.400" boxSize={5} />
                  <Text>{text.title}</Text>
                </Flex>
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Text>{text.intro}</Text>

              <VStack align="stretch" gap={1} mt={4}>
                <Text fontSize="sm">
                  {text.informedQuantityLabel}: {formatNumber(informedQuantity)}
                </Text>
                <Text fontSize="sm">
                  {text.stockQuantityLabel}: {formatNumber(stockQuantity)}
                </Text>
              </VStack>
            </Dialog.Body>
            <Dialog.Footer>
              <Button title={text.confirm} variant="outline" onClick={onClose} />
            </Dialog.Footer>
            {/* @ts-ignore ChakraUI v3 headless dialog */}
            <Dialog.CloseTrigger />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
