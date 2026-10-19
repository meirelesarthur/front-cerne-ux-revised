// src/pages/Operacional/Separations/SeparationDetalhe.tsx
// -----------------------------------------------------------------------------
// Tela de VISUALIZAÇÃO (read-only) da Apartação — 97-Esteiras/005 Tarefa 24.
// Rota: /operacional/apartacao/:separationUuid, gate `separation_view`.
//
// Mirror `Operacional/Nascimentos/BirthAnimalDetalhe.tsx` — tela DEDICADA,
// não o formulário em modo desabilitado (contrato de tela §6 — a API tem
// `show()` separado, mesma decisão de não usar form desabilitado).
//
// Campos: `code`, `date`, `employee_name`/`user_name`, lista de `batches[]`
// (uuid+description), badge de `finished_processing` (mesmo mapper da
// listagem). Ações "Editar"/"Excluir" seguem a mesma condição
// `!finished_processing` da listagem — SEM tooltip explicativo quando
// escondidas por `finished_processing` (contrato §6, mirror §5 — o badge de
// status já explica; diferente do precedente `has_weaning`).
// -----------------------------------------------------------------------------

import { ElementType, useEffect } from 'react';

import {
  Badge,
  Box,
  EmptyState,
  Flex,
  Icon,
  SimpleGrid,
  Skeleton,
  Table,
  Text,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FiAlertTriangle, FiEdit, FiTrash2 } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';
import formatDate from '@/utils/formatDate';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';
import { separationProcessingStatus } from '@/constants/Separations/separation-processing-status';

import { deleteSeparation } from '@/services/v2/Separations/separation-service';

import type { SeparationDetail } from '@/@types/v2/Separations';

import { useSeparationDetail } from './useSeparations';

const SEPARATIONS_LIST_ROUTE = '/operacional/apartacao';

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

function SectionTitle({ children }: { children: string }) {
  return (
    <Text
      fontSize="sm"
      fontWeight="semibold"
      color="fg.default"
      mb={4}
      pb={2}
      borderBottom="1px solid"
      borderColor="border.subtle"
    >
      {children}
    </Text>
  );
}

export default function SeparationDetalhe() {
  const { separationUuid } = useParams<{ separationUuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.separations.separation;
  const detailText = text.detail;
  const noData = '—';

  // Guard de UUID malformado ANTES de qualquer chamada (mirror
  // `BirthAnimalDetalhe.tsx`/`RomaneioDetalhe.tsx`).
  useEffect(() => {
    if (!isValidGuid(separationUuid)) {
      navigate(SEPARATIONS_LIST_ROUTE, { replace: true });
    }
  }, [separationUuid, navigate]);

  const separationQuery = useSeparationDetail(
    isValidGuid(separationUuid) ? separationUuid : undefined
  );

  const isLoading = checkLoadingStatus([separationQuery as any]);
  const item = separationQuery.data as SeparationDetail | undefined;
  const notFound = !isLoading && (separationQuery as any).isError;

  if (!isValidGuid(separationUuid)) {
    return null;
  }

  const canEdit = can('separation_edit');
  const canDelete = can('separation_delete');
  const isFinishedProcessing = !!item?.finished_processing;

  // ---- Estado de exclusão (contrato §6 — mesmas regras de §5) ------------
  const queryClient = useQueryClient();
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const deleteMutation = useMutation({
    mutationFn: async (uuid: string) => deleteSeparation(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey.separations.separationsList] });

      toaster.success({
        title: text.singularLabel,
        description: text.list.deletedToast,
        duration: 7000,
      });

      navigate(SEPARATIONS_LIST_ROUTE);
    },
    onError: (error) => {
      toaster.error({
        title: text.singularLabel,
        description: extractApiErrorMessage(error) ?? languageGB.common.errorLog.unknownError,
        duration: 7000,
      });
    },
  });

  const isDeleting = deleteMutation.isPending;

  function handleConfirmDelete() {
    if (separationUuid) {
      deleteMutation.mutate(separationUuid);
    }
  }

  if (notFound) {
    return (
      <FormContainer title={detailText.notFound.title}>
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
                variant="outline"
                size="sm"
                onClick={() => navigate(SEPARATIONS_LIST_ROUTE)}
              />
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  return (
    <FormContainer
      title={item ? detailText.pageTitleTemplate.replace('{code}', item.code) : text.singularLabel}
      footer={
        <>
          <Button
            title={detailText.backButton}
            variant="outline"
            type="button"
            onClick={() => navigate(-1)}
          />
          {canDelete && !isFinishedProcessing && (
            <Button
              title={text.list.actions.delete}
              icon={FiTrash2 as ElementType}
              type="button"
              variant="outline"
              colorPalette="red"
              disabled={isDeleting}
              onClick={onOpenDeleteDialog}
            />
          )}
          {canEdit && !isFinishedProcessing && (
            <Button
              title={text.list.actions.edit}
              icon={FiEdit as ElementType}
              type="button"
              onClick={() => navigate(`${SEPARATIONS_LIST_ROUTE}/${separationUuid}/editar`)}
            />
          )}
        </>
      }
    >
      <Box px={{ base: 4, md: 10 }} pb={8}>
        <Skeleton loading={isLoading} width="fit-content">
          <Flex align="center" gap={3}>
            <Text fontSize="sm" color="fg.muted">
              {item ? item.code : text.singularLabel}
            </Text>
            {item && (
              <Badge
                colorPalette={separationProcessingStatus.getColor(item.finished_processing)}
                variant="subtle"
                py={1}
                px={3}
              >
                {separationProcessingStatus.getLabel(item.finished_processing, languageGB)}
              </Badge>
            )}
          </Flex>
        </Skeleton>

        <Flex direction="column" gap={6} mt={4}>
          {/* ---- Seção 1 — Cabeçalho (contrato §6) ---- */}
          <Box>
            <SectionTitle>{detailText.sections.header}</SectionTitle>
            <SimpleGrid columns={columnsForm.default} gap={6}>
              <InfoField label={detailText.fields.code} value={item ? item.code : noData} />
              <InfoField
                label={detailText.fields.date}
                value={item ? formatDate(item.date) : noData}
              />
              <InfoField
                label={detailText.fields.employeeName}
                value={item?.employee_name || item?.user_name || noData}
              />
            </SimpleGrid>
          </Box>

          {/* ---- Seção 2 — Lotes (contrato §6), somente leitura ---- */}
          <Box>
            <SectionTitle>{detailText.sections.batches}</SectionTitle>
            {(item?.batches ?? []).length === 0 && !isLoading ? (
              <Text fontSize="sm" color="fg.muted">
                {detailText.batchesTable.empty}
              </Text>
            ) : (
              <Box overflowX="auto">
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>{detailText.batchesTable.description}</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {(item?.batches ?? []).map((row) => (
                      <Table.Row key={row.uuid}>
                        <Table.Cell>{row.description}</Table.Cell>
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
        isOpen={isOpenDeleteDialog}
        onClose={onCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title={text.deleteDialog.title}
        description={
          item ? text.deleteDialog.descriptionTemplate.replace('{code}', item.code) : undefined
        }
        hideQuestionMark
        tone="danger"
      />
    </FormContainer>
  );
}
