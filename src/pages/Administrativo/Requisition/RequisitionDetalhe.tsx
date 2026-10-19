// src/pages/Administrativo/Requisition/RequisitionDetalhe.tsx
// -----------------------------------------------------------------------------
// Tela de DETALHE dedicada, SOMENTE LEITURA, de Requisição/Saída
// (Requisition — Estoque, 97-Esteiras/002, Tarefa 04, `GAP-REQUISICAO-FE-02`).
// Rota `/administrativo/requisicao/:uuid`, guardada por
// `<RequirePermission permission="requisitions_view">` (mirror da permissão
// de `.show`).
//
// Como a feature NÃO tem modo editar (`RT-06 NAO_APLICAVEL`), não existe um
// formulário de edição para reaproveitar em modo somente-leitura, e o shape
// do `show` (1 registro flat) é estruturalmente diferente do shape do
// `create` (lote com `items[]`) — por isso esta tela é DEDICADA e LEVE: sem
// tabs, sem `useForm`, sem catálogos de select. Mirror ESTRUTURAL (não
// literal) de `FarmTransferDetalhe.tsx` (`FormContainer` + `SimpleGrid`/
// `InfoField`).
//
// `RequisitionResource` (decisão vinculante já fechada em `GAP-RS-03`, ✅
// CONCLUÍDO na API) NÃO reexibe `cost_center`/`amount`/`status`/
// `signature*` — esta tela reflete essa omissão FIELMENTE, sem tentar
// mostrar nenhum desses campos (checklist de fidelidade da Tarefa 04). NÃO
// contém nenhuma ação de assinatura (essas ficam na listagem, Tarefa 06).
//
// Rodapé: Voltar (sempre) + Excluir (gateado por `requisitions_delete`),
// reaproveitando a MESMA `DeleteConfirmDialog` já usada na listagem.
// -----------------------------------------------------------------------------

import { ElementType, useEffect, useState } from 'react';

import { Box, EmptyState, Flex, Icon, SimpleGrid, Skeleton, Text, VStack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { FiAlertTriangle, FiArrowLeft } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatDate from '@/utils/formatDate';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { deleteRequisition, getRequisition } from '@/services/v2/Requisitions/requisition-service';

const REQUISITION_LIST_ROUTE = '/administrativo/requisicao';

function formatQuantityPtBr(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Text
        fontSize="xs"
        fontWeight="semibold"
        color="fg.muted"
        textTransform="uppercase"
        letterSpacing="wide"
        mb={1}
      >
        {label}
      </Text>
      <Text fontSize="sm" color="fg.default">
        {value}
      </Text>
    </Box>
  );
}

export default function RequisitionDetalhe() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.requisitions.requisition;
  const detailText = text.detail;
  const noData = '—';

  const canDelete = can('requisitions_delete');
  const hasValidUuid = isValidGuid(uuid ?? null);

  // Guarda de entrada — `uuid` ausente/mal-formado NUNCA dispara a chamada
  // de rede; redireciona à Listagem com toast (mirror
  // `FarmTransferDetalhe.tsx`).
  useEffect(() => {
    if (!hasValidUuid) {
      toaster.create({
        type: 'error',
        title: detailText.invalidParamsToast.title,
        description: detailText.invalidParamsToast.description,
      });
      navigate(REQUISITION_LIST_ROUTE, { replace: true });
    }
  }, [hasValidUuid]);

  const detailQuery = useQuery({
    queryKey: [queryKey.requisitions.requisition, uuid],
    queryFn: async () => {
      const response = await getRequisition(uuid as string);
      return response.data;
    },
    enabled: hasValidUuid,
    retry: false,
  });

  const [isOpenDeleteDialog, setIsOpenDeleteDialog] = useState(false);

  const deleteMutation = useRequest({
    asyncFunction: async ({ requisitionUuid }: { requisitionUuid: string }) => {
      await deleteRequisition(requisitionUuid);
      return undefined;
    },
    queryKey: queryKey.requisitions.requisitions,
    typesRequest: 'apply',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      setIsOpenDeleteDialog(false);
      navigate(REQUISITION_LIST_ROUTE);
    },
  });

  function handleConfirmDelete() {
    if (uuid) {
      deleteMutation.mutate({ requisitionUuid: uuid });
    }
  }

  if (!hasValidUuid) {
    return null;
  }

  const isLoading = checkLoadingStatus([detailQuery as any]);
  const item = detailQuery.data;
  const notFound = !isLoading && detailQuery.isError;

  if (notFound) {
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
              <Button
                title={detailText.backButton}
                icon={FiArrowLeft as ElementType}
                variant="outline"
                size="sm"
                onClick={() => navigate(REQUISITION_LIST_ROUTE)}
              />
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  return (
    <FormContainer
      title={detailText.title}
      footer={
        <>
          <Button
            title={detailText.backButton}
            variant="outline"
            type="button"
            onClick={() => navigate(REQUISITION_LIST_ROUTE)}
          />
          {canDelete && (
            <Button
              title={detailText.deleteButton}
              variant="outline"
              colorPalette="red"
              type="button"
              onClick={() => setIsOpenDeleteDialog(true)}
              disabled={!item}
            />
          )}
        </>
      }
    >
      <Box px={{ base: 4, md: 10 }} pb={8}>
        <Skeleton loading={isLoading} width="fit-content">
          <Text fontSize="sm" color="fg.muted">
            {item ? item.code : text.singularLabel}
          </Text>
        </Skeleton>

        {/* Campos do `RequisitionResource` (`show()`) — fidelidade a
            `GAP-RS-03`: NUNCA `cost_center`/`amount`/`status`/`signature*`,
            mesmo esses campos sendo persistidos no backend. */}
        <SimpleGrid columns={columnsForm.default} gap={6} mt={6}>
          <InfoField label={detailText.fields.code} value={item?.code || noData} />
          <InfoField label={detailText.fields.requester} value={item?.requester || noData} />
          <InfoField
            label={detailText.fields.classification}
            value={item?.classification || noData}
          />
          <InfoField label={detailText.fields.area} value={item?.area?.description || noData} />
          <InfoField
            label={detailText.fields.product}
            value={item?.product ? `${item.product.code} — ${item.product.description}` : noData}
          />
          <InfoField
            label={detailText.fields.warehouse}
            value={item?.warehouse?.description || noData}
          />
          <InfoField
            label={detailText.fields.quantity}
            value={
              item !== undefined
                ? `${formatQuantityPtBr(item.quantity)}${item.unit ? ` ${item.unit}` : ''}`
                : noData
            }
          />
          <InfoField label={detailText.fields.user} value={item?.user?.name || noData} />
          <InfoField
            label={detailText.fields.createdAt}
            value={item?.created_at ? formatDate(item.created_at, 'dd/MM/yyyy HH:mm') : noData}
          />
        </SimpleGrid>
      </Box>

      <DeleteConfirmDialog
        isOpen={isOpenDeleteDialog}
        onClose={() => setIsOpenDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        isLoading={deleteMutation.isPending}
        itemName={item?.code}
        tone="danger"
      />
    </FormContainer>
  );
}
