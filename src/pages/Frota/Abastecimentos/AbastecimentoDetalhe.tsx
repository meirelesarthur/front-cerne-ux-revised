// src/pages/Frota/Abastecimentos/AbastecimentoDetalhe.tsx
// -----------------------------------------------------------------------------
// Tela de Visualização (somente leitura) de Abastecimento (Supply) —
// Tarefa 40. Mirror estrutural de
// `Operacional/Appropriations/AppropriationDetalhe.tsx`, MENOS tudo
// relacionado a status/workflow (Abastecimentos é CRUD flat, AD-02/FID-G3F
// §7 `SF-FLOW-DIRECT`, NAO_APLICAVEL).
//
// Dados idênticos aos da listagem (contrato §6/§7.2 — "sem reconversão
// adicional") — reusa `GET /supplies/{uuid}` (mesmo `show` da API, sem
// `.../edit`), via `useSupplyDetailQuery` (`fillForm: () => undefined`,
// mirror `useAppropriationForm` na Visualização).
// -----------------------------------------------------------------------------

import { ElementType, useEffect, useState } from 'react';

import {
  Box,
  EmptyState,
  Flex,
  Icon,
  SimpleGrid,
  Skeleton,
  Table,
  Text,
  VStack,
} from '@chakra-ui/react';
import { FiAlertTriangle, FiArrowLeft, FiEdit, FiTrash2 } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';

import type { SupplyDetail } from '@/@types/v2/Supplies';

import { useDeleteSupplyMutation, useSupplyDetailQuery } from './useAbastecimentos';

const ABASTECIMENTOS_LIST_ROUTE = '/frota/abastecimentos';

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

export default function AbastecimentoDetalhe() {
  const { supplyId } = useParams<{ supplyId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.supplies.supply;
  const detailText = text.detail;
  const noData = '—';

  useEffect(() => {
    if (!isValidGuid(supplyId)) {
      navigate(ABASTECIMENTOS_LIST_ROUTE, { replace: true });
    }
  }, [supplyId, navigate]);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const detailQuery = useSupplyDetailQuery({
    registrationId: isValidGuid(supplyId) ? supplyId : undefined,
    fillForm: () => undefined,
  });

  const isLoading = checkLoadingStatus([detailQuery as any]);
  const item = detailQuery.data as SupplyDetail | undefined;
  const notFound = !isLoading && (detailQuery as any).isError;

  const canEdit = can('appropriation-supplies_edit');
  const canDelete = can('appropriation-supplies_delete');

  const deleteMutation = useDeleteSupplyMutation({
    actionSuccess: () => navigate(ABASTECIMENTOS_LIST_ROUTE),
  });

  if (!isValidGuid(supplyId)) {
    return null;
  }

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
                title={detailText.notFound.back}
                icon={FiArrowLeft as ElementType}
                variant="outline"
                size="sm"
                onClick={() => navigate(ABASTECIMENTOS_LIST_ROUTE)}
              />
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
            {canEdit && (
              <Button
                title={detailText.actions.edit}
                icon={FiEdit as ElementType}
                size="sm"
                onClick={() => navigate(`${ABASTECIMENTOS_LIST_ROUTE}/${supplyId}`)}
              />
            )}
            {canDelete && (
              <Button
                title={detailText.actions.delete}
                icon={FiTrash2 as ElementType}
                variant="ghost"
                color="red.500"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
              />
            )}
          </Flex>
        )
      }
    >
      <Box px={{ base: 4, md: 10 }} pb={8}>
        <Skeleton loading={isLoading} width="fit-content">
          <Text fontSize="sm" color="fg.muted">
            {item?.code ?? text.singularLabel}
          </Text>
        </Skeleton>

        <Flex direction="column" gap={6} mt={6}>
          {/* ---- Identificação ---- */}
          <Box>
            <SimpleGrid columns={columnsForm.default} gap={6}>
              <InfoField label={text.form.fields.code} value={item?.code ?? noData} />
              <InfoField label={text.form.fields.date} value={item?.date ?? noData} />
              <InfoField
                label={text.form.fields.requester}
                value={item?.requester ?? item?.employee?.name ?? noData}
              />
              <InfoField label={text.form.fields.user} value={item?.user?.name ?? noData} />
            </SimpleGrid>
          </Box>

          {/* ---- Itens ---- */}
          <Box>
            <Text
              fontSize="sm"
              fontWeight="semibold"
              color="fg.default"
              mb={4}
              pb={2}
              borderBottom="1px solid"
              borderColor="border.subtle"
            >
              {detailText.sections.items}
            </Text>
            {(item?.items ?? []).length === 0 ? (
              <Text fontSize="sm" color="fg.muted">
                {noData}
              </Text>
            ) : (
              <Box overflowX="auto">
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>{text.list.itemsTable.equipment}</Table.ColumnHeader>
                      <Table.ColumnHeader>{text.list.itemsTable.warehouse}</Table.ColumnHeader>
                      <Table.ColumnHeader>{text.list.itemsTable.product}</Table.ColumnHeader>
                      <Table.ColumnHeader>{text.list.itemsTable.measurement}</Table.ColumnHeader>
                      <Table.ColumnHeader>{text.list.itemsTable.hourMeter}</Table.ColumnHeader>
                      <Table.ColumnHeader>{text.list.itemsTable.mileage}</Table.ColumnHeader>
                      <Table.ColumnHeader>{text.list.itemsTable.quantity}</Table.ColumnHeader>
                      <Table.ColumnHeader>{text.list.itemsTable.amount}</Table.ColumnHeader>
                      <Table.ColumnHeader>{text.list.itemsTable.totalAmount}</Table.ColumnHeader>
                      <Table.ColumnHeader>{text.list.itemsTable.responsible}</Table.ColumnHeader>
                      <Table.ColumnHeader>{text.list.itemsTable.note}</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {(item?.items ?? []).map((row) => (
                      <Table.Row key={row.uuid}>
                        <Table.Cell>{row.equipment.description}</Table.Cell>
                        <Table.Cell>{row.warehouse?.description ?? noData}</Table.Cell>
                        <Table.Cell>{row.product?.description ?? noData}</Table.Cell>
                        <Table.Cell>{row.measurement.name}</Table.Cell>
                        <Table.Cell>{row.hour_meter ?? noData}</Table.Cell>
                        <Table.Cell>{row.mileage ?? noData}</Table.Cell>
                        <Table.Cell>{row.quantity}</Table.Cell>
                        <Table.Cell>{row.amount}</Table.Cell>
                        <Table.Cell>{row.total_amount}</Table.Cell>
                        <Table.Cell>{row.responsible?.name ?? noData}</Table.Cell>
                        <Table.Cell>{row.note ?? noData}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>
            )}
          </Box>
        </Flex>
      </Box>

      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={() => supplyId && deleteMutation.mutate({ supplyUuid: supplyId })}
        isLoading={deleteMutation.isPending}
        itemName={item?.code}
        tone="danger"
      />
    </FormContainer>
  );
}
