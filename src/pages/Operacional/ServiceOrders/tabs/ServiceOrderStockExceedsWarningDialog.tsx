// src/pages/Operacional/ServiceOrders/tabs/ServiceOrderStockExceedsWarningDialog.tsx
// -----------------------------------------------------------------------------
// exec-038 HOMOLOG R2 (R2-05) — modal de aviso quando "Qtd Total" (Qtd/ha ×
// área produtiva) ultrapassa a quantidade em estoque do item selecionado, no
// bloco Insumos. Mirror de mecânica/texto do legado
// (`agro365/resources/views/service-orders/_product.blade.php:45-79`,
// `swal('Atenção', message, 'warning')`) — casca visual mirror EXATA de
// `Appropriations/tabs/StockQuantityExceedsWarningDialog.tsx`, mas com texto
// da PRÓPRIA língua do módulo (`serviceOrders`, não `appropriations` — i18n
// modular, SEVERIDADE inviolável).
// -----------------------------------------------------------------------------

import { Dialog, Flex, Icon, Portal, Text, VStack } from '@chakra-ui/react';
import { FiAlertTriangle } from 'react-icons/fi';

import { Button } from '@/components/Button';

import { useLanguage } from '@/hooks/useLanguage';

export interface ServiceOrderStockExceedsWarningDialogProps {
  isOpen: boolean;
  onClose: () => void;
  informedQuantity: number;
  productiveArea: number;
  stockQuantity: number;
}

function formatNumber(value: number) {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function ServiceOrderStockExceedsWarningDialog({
  isOpen,
  onClose,
  informedQuantity,
  productiveArea,
  stockQuantity,
}: ServiceOrderStockExceedsWarningDialogProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.serviceOrders.serviceOrder.form.products.stockExceedsDialog;

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
                  {text.productiveAreaLabel}: {formatNumber(productiveArea)}
                </Text>
                <Text fontSize="sm">
                  {text.stockQuantityLabel}: {formatNumber(stockQuantity)}
                </Text>
              </VStack>

              <Text mt={4} fontSize="sm" color="fg.muted">
                {text.footerNote}
              </Text>
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
