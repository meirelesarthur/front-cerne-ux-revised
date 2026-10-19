// src/pages/Administrativo/Solicitacao/RequestQuotationWhatsAppModal.tsx
// -----------------------------------------------------------------------------
// Modal "Enviar mensagens" do WhatsApp de orçamento (execução 081, T-081-FE-08;
// contrato LEGADO 05 AM-03, 10 PQ07..PQ11; `send_quotation_message_modal`).
//
// Legado: o botão WhatsApp da cotação abre uma tabela "Fornecedor/Vendedor" com
// o fornecedor e cada vendedor dele; cada linha tem um ícone que abre o
// WhatsApp (`api.whatsapp.com/send?phone=55{número}&text=...`) com o texto
// literal do orçamento, sem permissão. Os vendedores vêm em
// `quotation.provider.sellers[]` (T-081-API-07), sem chamada extra; o texto é
// montado no navegador por `buildRequestQuotationWhatsAppLink`
// (EXEC-API-09 §5). Número vazio não bloqueia (como no legado).
// -----------------------------------------------------------------------------

import { Dialog, Flex, Icon, Portal, Table, Text } from '@chakra-ui/react';
import { FaWhatsapp } from 'react-icons/fa';

import { Button } from '@/components/Button';
import { IconButtonTable } from '@/components/IconButtonTable';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import {
  buildRequestQuotationPublicFormUrl,
  buildRequestQuotationWhatsAppLink,
  type RequestQuotationWhatsAppContact,
  type RequestQuotationWhatsAppPurchaseContext,
} from '@/utils/requestQuotationWhatsApp';

import type { RequestQuotationData } from '@/@types/v2/RequestQuotations';

interface RequestQuotationWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotation: RequestQuotationData | null;
  purchase: RequestQuotationWhatsAppPurchaseContext;
}

interface Recipient {
  key: string;
  name: string;
  override: RequestQuotationWhatsAppContact | null;
}

export function RequestQuotationWhatsAppModal({
  isOpen,
  onClose,
  quotation,
  purchase,
}: RequestQuotationWhatsAppModalProps) {
  const { languageGB } = useLanguage();
  const whatsAppText = languageGB.requestQuotations.requestQuotation.whatsApp;
  const modalText = languageGB.requestQuotations.requestQuotation.stage.whatsAppModal;

  // Linha do fornecedor (usa o contato principal) + uma linha por vendedor.
  const recipients: Recipient[] = quotation?.provider
    ? [
        { key: 'provider', name: quotation.provider.name ?? '—', override: null },
        ...(quotation.provider.sellers ?? []).map((seller) => ({
          key: seller.uuid,
          name: seller.name ?? '—',
          override: {
            name: seller.name ?? '',
            phone: seller.phone,
            email: seller.email,
          } satisfies RequestQuotationWhatsAppContact,
        })),
      ]
    : [];

  function handleSend(recipient: Recipient) {
    if (!quotation) return;
    const formUrl = buildRequestQuotationPublicFormUrl(quotation.hash, window.location.origin);
    const outcome = buildRequestQuotationWhatsAppLink(
      quotation,
      purchase,
      formUrl,
      whatsAppText,
      recipient.override
    );

    if (!outcome.ok) {
      toaster.error({ title: whatsAppText.providerMissingError });
      return;
    }

    window.open(outcome.url, '_blank', 'noopener,noreferrer');
  }

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
              <Dialog.Title>{modalText.title}</Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              {recipients.length === 0 ? (
                <Text fontSize="sm" color="fg.muted">
                  {whatsAppText.providerMissingError}
                </Text>
              ) : (
                <Table.Root size="sm" aria-label={modalText.title}>
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>{modalText.column}</Table.ColumnHeader>
                      <Table.ColumnHeader />
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {recipients.map((recipient) => (
                      <Table.Row key={recipient.key}>
                        <Table.Cell>
                          <Flex align="center" gap={2}>
                            <Text>{recipient.name}</Text>
                            {recipient.override === null && (
                              <Text as="span" fontSize="xs" color="fg.muted">
                                ({modalText.supplierTag})
                              </Text>
                            )}
                          </Flex>
                        </Table.Cell>
                        <Table.Cell textAlign="end">
                          <IconButtonTable
                            aria-label={`${modalText.sendTo} ${recipient.name}`}
                            mensegerTooltip={`${modalText.sendTo} ${recipient.name}`}
                            variant="ghost"
                            colorPalette="green"
                            onClick={() => handleSend(recipient)}
                          >
                            <Icon as={FaWhatsapp} />
                          </IconButtonTable>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              )}
            </Dialog.Body>

            <Dialog.Footer>
              <Button title={modalText.close} type="button" onClick={onClose} />
            </Dialog.Footer>

            {/* @ts-ignore ChakraUI v3 headless dialog */}
            <Dialog.CloseTrigger />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
