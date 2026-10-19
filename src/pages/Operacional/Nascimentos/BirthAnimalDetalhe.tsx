// src/pages/Operacional/Nascimentos/BirthAnimalDetalhe.tsx
// -----------------------------------------------------------------------------
// Tela de VISUALIZAÇÃO (read-only) do Nascimento — TASK-NASC-FE-01.
// Rota: /operacional/nascimentos/:birthAnimalUuid, gate `birth_animals_view`.
//
// Mirror `Operacional/Romaneios/RomaneioDetalhe.tsx` — tela DEDICADA, não o
// formulário em modo desabilitado (contrato de tela §6 — Nascimentos tem
// `show()` separado de `edit()` no legado, `mode_matrix.visualizar`).
//
// SEM satélites a resolver — `BirthAnimalDetail` já vem 100% hidratado do
// Resource (mãe/pai/bezerro/raça/categoria/espécie/observação de
// nascimento/lote/lote-transferência já nascem `{uuid, description|
// identification}` no payload) — ZERO chamada extra a `*/options` aqui.
//
// Armadilha #1 (`GAP-NASC-16`, contrato §6/OQ7/C43) — "Lote (transferência)"
// hidratado SEMPRE de `transfer_batch`, NUNCA de `batch` — correção
// deliberada do bug de hidratação do legado, não preservação.
// -----------------------------------------------------------------------------

import { ElementType, useEffect } from 'react';

import {
  Box,
  EmptyState,
  Flex,
  Icon,
  Image,
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

import { deleteBirthAnimal } from '@/services/v2/BirthAnimals/birth-animal-service';

import type { BirthAnimalDetail } from '@/@types/v2/BirthAnimals';

import { BirthAnimalWeaningBanner } from './BirthAnimalWeaningBanner';
import { useBirthAnimalDetail } from './useBirthAnimals';

const NASCIMENTOS_LIST_ROUTE = '/operacional/nascimentos';

function formatWeight(value: number): string {
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

export default function BirthAnimalDetalhe() {
  const { birthAnimalUuid } = useParams<{ birthAnimalUuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.birthAnimals.birthAnimal;
  const detailText = text.detail;
  const noData = '—';

  // Guard de UUID malformado ANTES de qualquer chamada (mirror
  // `RomaneioDetalhe.tsx`/`MovementSaleDetalhe.tsx`).
  useEffect(() => {
    if (!isValidGuid(birthAnimalUuid)) {
      navigate(NASCIMENTOS_LIST_ROUTE, { replace: true });
    }
  }, [birthAnimalUuid, navigate]);

  const birthAnimalQuery = useBirthAnimalDetail(
    isValidGuid(birthAnimalUuid) ? birthAnimalUuid : undefined
  );

  const isLoading = checkLoadingStatus([birthAnimalQuery as any]);
  const item = birthAnimalQuery.data as BirthAnimalDetail | undefined;
  const notFound = !isLoading && (birthAnimalQuery as any).isError;

  if (!isValidGuid(birthAnimalUuid)) {
    return null;
  }

  const canEdit = can('birth_animals_edit');
  const canDelete = can('birth_animals_delete');
  const hasWeaning = !!item?.has_weaning;

  // ---- Estado de exclusão (contrato §6 — mesmas regras de §5.3) ----------
  const queryClient = useQueryClient();
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const deleteMutation = useMutation({
    mutationFn: async (uuid: string) => deleteBirthAnimal(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey.birthAnimals.birthAnimalsList] });

      toaster.success({
        title: text.singularLabel,
        description: text.list.deletedToast,
        duration: 7000,
      });

      navigate(NASCIMENTOS_LIST_ROUTE);
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
    if (birthAnimalUuid) {
      deleteMutation.mutate(birthAnimalUuid);
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
                onClick={() => navigate(NASCIMENTOS_LIST_ROUTE)}
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
          {canDelete && (
            <Button
              title={text.list.actions.delete}
              icon={FiTrash2 as ElementType}
              type="button"
              variant="outline"
              colorPalette="red"
              disabled={hasWeaning || isDeleting}
              tooltip={hasWeaning ? text.list.actions.deleteDisabledTooltip : undefined}
              onClick={onOpenDeleteDialog}
            />
          )}
          {canEdit && (
            <Button
              title={text.list.actions.edit}
              icon={FiEdit as ElementType}
              type="button"
              disabled={hasWeaning}
              tooltip={hasWeaning ? text.list.actions.editDisabledTooltip : undefined}
              onClick={() => navigate(`${NASCIMENTOS_LIST_ROUTE}/${birthAnimalUuid}/editar`)}
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

        <BirthAnimalWeaningBanner detail={item ?? null} languageGB={languageGB} />

        <Flex direction="column" gap={6} mt={2}>
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
                label={detailText.fields.mother}
                value={item?.mother?.identification ?? noData}
              />
              <InfoField label={detailText.fields.fatherText} value={item?.father_text || noData} />
              <InfoField
                label={detailText.fields.fatherAnimal}
                value={item?.father_animal?.identification ?? noData}
              />
              <InfoField
                label={detailText.fields.newborn}
                value={item?.newborn?.identification ?? noData}
              />
              <InfoField
                label={detailText.fields.breed}
                value={item?.breed?.description ?? noData}
              />
              <InfoField
                label={detailText.fields.category}
                value={item?.category?.description ?? noData}
              />
              <InfoField
                label={detailText.fields.specie}
                value={item?.specie?.description ?? noData}
              />
              <InfoField
                label={detailText.fields.birthNote}
                value={item?.birth_note?.description ?? noData}
              />
              <InfoField
                label={detailText.fields.batch}
                value={item?.batch?.description ?? noData}
              />
              {/* GAP-NASC-16 — hidratado de `transfer_batch`, NUNCA de `batch`. */}
              <InfoField
                label={detailText.fields.transferBatch}
                value={item?.transfer_batch?.description ?? noData}
              />
              <InfoField
                label={detailText.fields.weight}
                value={item ? formatWeight(item.weight) : noData}
              />
              <InfoField
                label={detailText.fields.furDescription}
                value={item?.fur_description || noData}
              />
            </SimpleGrid>
            {item?.note && (
              <Box mt={4}>
                <InfoField label={detailText.fields.note} value={item.note} />
              </Box>
            )}
            {item?.photo_url && (
              <Box mt={4}>
                <Text
                  fontSize="xs"
                  fontWeight="semibold"
                  color="fg.muted"
                  textTransform="uppercase"
                  letterSpacing="wide"
                  mb={2}
                >
                  {detailText.fields.photo}
                </Text>
                <Image
                  src={item.photo_url}
                  alt={detailText.fields.photo}
                  maxW="200px"
                  borderRadius="md"
                />
              </Box>
            )}
          </Box>

          {/* ---- Seção 2 — Identificações (contrato §6), somente leitura ---- */}
          <Box>
            <SectionTitle>{detailText.sections.identifications}</SectionTitle>
            {(item?.id_animals ?? []).length === 0 && !isLoading ? (
              <Text fontSize="sm" color="fg.muted">
                {detailText.identificationsTable.empty}
              </Text>
            ) : (
              <Box overflowX="auto">
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>
                        {detailText.identificationsTable.type}
                      </Table.ColumnHeader>
                      <Table.ColumnHeader>
                        {detailText.identificationsTable.identification}
                      </Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {(item?.id_animals ?? []).map((row) => (
                      <Table.Row key={row.uuid}>
                        <Table.Cell>{row.description}</Table.Cell>
                        <Table.Cell>{row.identification}</Table.Cell>
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
