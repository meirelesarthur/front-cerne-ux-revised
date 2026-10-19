// src/pages/Operacional/ServiceOrders/tabs/ServiceOrderBelowMinStockWarningDialog.tsx
// -----------------------------------------------------------------------------
// exec-038 HOMOLOG R2 (R2-05) — modal de aviso quando "Estoque − Qtd Total"
// fica abaixo do estoque mínimo do item (`min_stock`), no bloco Insumos.
// Mirror de mecânica/texto do legado
// (`agro365/resources/views/service-orders/_product.blade.php:84-88`,
// `swal('Atenção', 'O estoque ficará abaixo do estoque mínimo.', 'warning')`)
// — NÃO zera nenhum campo (só avisa, diferente de
// `ServiceOrderStockExceedsWarningDialog`).
// -----------------------------------------------------------------------------

import { Dialog, Flex, Icon, Portal, Text } from '@chakra-ui/react';
import { FiAlertTriangle } from 'react-icons/fi';

import { Button } from '@/components/Button';

import { useLanguage } from '@/hooks/useLanguage';

export interface ServiceOrderBelowMinStockWarningDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ServiceOrderBelowMinStockWarningDialog({
  isOpen,
  onClose,
}: ServiceOrderBelowMinStockWarningDialogProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.serviceOrders.serviceOrder.form.products.belowMinStockWarning;

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
              <Text>{text.message}</Text>
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
