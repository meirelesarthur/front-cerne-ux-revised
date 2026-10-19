// src/pages/Operacional/ServiceOrders/ServiceOrderDetalhe.tsx
// -----------------------------------------------------------------------------
// Tela de Visualização (somente leitura) de Ordem de Serviço (ServiceOrder) —
// TASK-FE-2003 (esteira 038, fatia READ). Mirror estrutural de
// `Appropriations/AppropriationDetalhe.tsx` (bloco read-only, sem `useForm`),
// com o agrupamento D-FRONT-03 (default aplicado): seções escalares do
// cabeçalho em `CollapsibleSection` (accordion), os 5 blocos de linha em
// `Tabs.Root` — mirror `Appropriations/CreateOrUpdateAppropriation.tsx`
// (casca de Tabs), paridade com o canon (Pattern 11).
//
// Execução 086 (FE-01): corpo extraído para `ServiceOrderDetailBody.tsx`
// (labels/anexos/cancelamento, testável por fixture); esta casca mantém
// carregamento/erro, o botão "Cancelar OS" (permissão `service-orders_cancel`
// + status 1/2) e o `CancelServiceOrderDialog`.
// -----------------------------------------------------------------------------

import { ElementType, useEffect } from 'react';

import { EmptyState, Flex, Icon, VStack, useDisclosure } from '@chakra-ui/react';
import { FiAlertTriangle, FiArrowLeft, FiRefreshCw, FiXCircle } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { FormContainer } from '@/components/Layout/FormContainer';
import { Status } from '@/components/Status';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';

import { SERVICE_ORDER_CANCEL_PERMISSION } from '@/constants/serviceOrders/service-order-cancel-rules';

import type { ServiceOrderDetail } from '@/@types/v2/ServiceOrders';

import { CancelServiceOrderDialog } from './CancelServiceOrderDialog';
import { ServiceOrderDetailBody } from './ServiceOrderDetailBody';
import { canCancelServiceOrder, getServiceOrderStatusBadgeColor } from './serviceOrderStatus';
import { useServiceOrderDetail } from './useServiceOrders';

const SERVICE_ORDERS_LIST_ROUTE = '/operacional/lista-os';

export default function ServiceOrderDetalhe() {
  const { serviceOrderId } = useParams<{ serviceOrderId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const { open: isCancelOpen, onOpen: onOpenCancel, onClose: onCloseCancel } = useDisclosure();

  const text = languageGB.serviceOrders.serviceOrder;
  const detailText = text.detail;

  const validId = isValidGuid(serviceOrderId);

  useEffect(() => {
    if (!validId) {
      navigate(SERVICE_ORDERS_LIST_ROUTE, { replace: true });
    }
  }, [validId, navigate]);

  const detailQuery = useServiceOrderDetail({
    registrationId: validId ? serviceOrderId : undefined,
  });

  const isLoading = checkLoadingStatus([detailQuery as any]);
  const item = detailQuery.data as ServiceOrderDetail | undefined;
  const isError = !isLoading && (detailQuery as any).isError;

  if (!validId) {
    return null;
  }

  if (isError) {
    return (
      <FormContainer title={text.singularLabel}>
        <Flex direction="column" align="center" justify="center" py={16} px={4}>
          <EmptyState.Root>
            <EmptyState.Content>
              <EmptyState.Indicator>
                <Icon as={FiAlertTriangle} boxSize={8} color="fg.muted" />
              </EmptyState.Indicator>
              <VStack textAlign="center" gap={1}>
                <EmptyState.Title>{detailText.notFound.title}</EmptyState.Title>
                <EmptyState.Description>{detailText.notFound.description}</EmptyState.Description>
              </VStack>
              <Flex gap={3}>
                <Button
                  title={languageGB.defaltStrings.tryAgain}
                  icon={FiRefreshCw as ElementType}
                  variant="outline"
                  size="sm"
                  onClick={() => (detailQuery as any).refetch?.()}
                />
                <Button
                  title={detailText.notFound.back}
                  icon={FiArrowLeft as ElementType}
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(SERVICE_ORDERS_LIST_ROUTE)}
                />
              </Flex>
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  return (
    <FormContainer
      title={item?.code ?? text.singularLabel}
      headerActions={
        item && (
          <Flex align="center" gap={3} flexShrink={0}>
            <Status
              text={item.status.label}
              backgroundColor={getServiceOrderStatusBadgeColor(item.status.value)}
            />
            {canCancelServiceOrder(can(SERVICE_ORDER_CANCEL_PERMISSION), item.status.value) && (
              <Button
                title={detailText.actions.cancel}
                icon={FiXCircle as ElementType}
                variant="outline"
                size="sm"
                onClick={onOpenCancel}
              />
            )}
            <Button
              title={detailText.actions.back}
              icon={FiArrowLeft as ElementType}
              variant="outline"
              size="sm"
              onClick={() => navigate(SERVICE_ORDERS_LIST_ROUTE)}
            />
          </Flex>
        )
      }
    >
      <ServiceOrderDetailBody item={item} isLoading={isLoading} />

      <CancelServiceOrderDialog
        isOpen={isCancelOpen}
        onClose={onCloseCancel}
        serviceOrder={item ? { uuid: item.uuid, code: item.code } : null}
      />
    </FormContainer>
  );
}
