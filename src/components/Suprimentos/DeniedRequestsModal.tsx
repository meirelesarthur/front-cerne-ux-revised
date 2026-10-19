// src/components/Suprimentos/DeniedRequestsModal.tsx
// -----------------------------------------------------------------------------
// Modal "Sua(s) solicitação(ões) foram negada(s):" (execução 081, T-081-FE-01;
// contrato LEGADO 10, `denied_request_modal.blade.php:6,14,19`).
//
// Uma linha por notificação: `{message}: Clique aqui para ver`, com link para a
// visualização da solicitação, e botão "Fechar". As notificações são marcadas
// como lidas ao abrir (`useDeniedRequestsModal`).
//
// O componente é montado nas telas pela FE-11 (Solicitação, Meus Processos e
// Cotações — ajuste A-11 do plano do front); aqui só existe o componente.
// `enabled` permite montar sem disparar a consulta (ex.: usuário sem acesso).
// -----------------------------------------------------------------------------

import { Flex, Link as ChakraLink, Text, VStack } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';

import { Button } from '@/components/Button';
import { CustomDialog } from '@/components/CustomDialog';

import { useLanguage } from '@/hooks/useLanguage';

import { useDeniedRequestsModal } from './useDeniedRequestsModal';

export function buildRequestViewPath(requestUuid: string): string {
  return `/administrativo/solicitacao/${requestUuid}/visualizar`;
}

interface DeniedRequestsModalProps {
  /** `false` = não consulta nem abre (default `true`). */
  enabled?: boolean;
}

export function DeniedRequestsModal({ enabled = true }: DeniedRequestsModalProps) {
  const { languageGB } = useLanguage();
  const modalText = languageGB.requestPurchases.requestPurchase.supply.deniedModal;
  const { isOpen, items, close } = useDeniedRequestsModal({ enabled });

  return (
    <CustomDialog
      isOpen={isOpen}
      onClose={close}
      title={modalText.title}
      footer={
        <Flex gap={3}>
          <Button title={modalText.close} variant="outline" type="button" onClick={close} />
        </Flex>
      }
    >
      <VStack align="stretch" gap={3}>
        {items.map((item) => (
          <Text key={item.id} fontSize="sm">
            {item.message}:{' '}
            <ChakraLink asChild color="brandColorText" textDecoration="underline" onClick={close}>
              <RouterLink to={buildRequestViewPath(item.request_uuid)}>{modalText.link}</RouterLink>
            </ChakraLink>
          </Text>
        ))}
      </VStack>
    </CustomDialog>
  );
}
