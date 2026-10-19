// src/pages/Frota/ManutencoesPreventivas/ManutencaoPreventivaDetalhe.tsx
// -----------------------------------------------------------------------------
// Tela de Visualização (somente leitura) de Manutenção Preventiva
// (MaintenancePreventive) — Tarefa 43. Mirror estrutural de
// `Frota/Abastecimentos/AbastecimentoDetalhe.tsx`.
//
// Dados idênticos aos da listagem (mesmo `show` da API, sem `.../edit`), via
// `useMaintenancePreventiveDetailQuery` (`fillForm: () => undefined`).
//
// D6 — campo `note` SEMPRE exibido (reversão do CLM-08/OQ-5 do legado, que
// nunca exibia `note` em `show`) — `—` quando vazio, nunca omitido.
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

import type { MaintenancePreventiveDetail } from '@/@types/v2/MaintenancePreventives';

import {
  useDeleteMaintenancePreventiveMutation,
  useMaintenancePreventiveDetailQuery,
} from './useManutencoesPreventivas';

const MANUTENCOES_PREVENTIVAS_LIST_ROUTE = '/frota/preventivas';

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

export default function ManutencaoPreventivaDetalhe() {
  const { maintenancePreventiveId } = useParams<{ maintenancePreventiveId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.maintenancePreventives.maintenancePreventive;
  const detailText = text.detail;
  const noData = '—';

  useEffect(() => {
    if (!isValidGuid(maintenancePreventiveId)) {
      navigate(MANUTENCOES_PREVENTIVAS_LIST_ROUTE, { replace: true });
    }
  }, [maintenancePreventiveId, navigate]);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const detailQuery = useMaintenancePreventiveDetailQuery({
    registrationId: isValidGuid(maintenancePreventiveId) ? maintenancePreventiveId : undefined,
    fillForm: () => undefined,
  });

  const isLoading = checkLoadingStatus([detailQuery as any]);
  const item = detailQuery.data as MaintenancePreventiveDetail | undefined;
  const notFound = !isLoading && (detailQuery as any).isError;

  const canEdit = can('maintenance-preventives_edit');
  const canDelete = can('maintenance-preventives_delete');

  const deleteMutation = useDeleteMaintenancePreventiveMutation({
    actionSuccess: () => navigate(MANUTENCOES_PREVENTIVAS_LIST_ROUTE),
  });

  if (!isValidGuid(maintenancePreventiveId)) {
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
                onClick={() => navigate(MANUTENCOES_PREVENTIVAS_LIST_ROUTE)}
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
                onClick={() =>
                  navigate(`${MANUTENCOES_PREVENTIVAS_LIST_ROUTE}/${maintenancePreventiveId}`)
                }
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
              <InfoField label={detailText.fields.code} value={item?.code ?? noData} />
              <InfoField label={detailText.fields.date} value={item?.date ?? noData} />
              <InfoField
                label={detailText.fields.requester}
                value={item?.employee?.name ?? item?.user?.name ?? noData}
              />
              <InfoField label={detailText.fields.user} value={item?.user?.name ?? noData} />
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
                      <Table.ColumnHeader>{text.list.itemsTable.date}</Table.ColumnHeader>
                      <Table.ColumnHeader>{text.list.itemsTable.message}</Table.ColumnHeader>
                      <Table.ColumnHeader>{text.list.itemsTable.hourMeterKm}</Table.ColumnHeader>
                      {/* D6 — `note` SEMPRE exibido, reversão do CLM-08/OQ-5 do legado */}
                      <Table.ColumnHeader>{text.list.itemsTable.note}</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {(item?.items ?? []).map((row) => (
                      <Table.Row key={row.uuid}>
                        <Table.Cell>{row.equipment.description}</Table.Cell>
                        <Table.Cell>{row.date ?? noData}</Table.Cell>
                        <Table.Cell>{row.message}</Table.Cell>
                        <Table.Cell>{row.hour_meter_km ?? noData}</Table.Cell>
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
        onConfirm={() =>
          maintenancePreventiveId &&
          deleteMutation.mutate({ maintenancePreventiveUuid: maintenancePreventiveId })
        }
        isLoading={deleteMutation.isPending}
        itemName={item?.code}
        tone="danger"
      />
    </FormContainer>
  );
}
