// src/pages/BaseRegistrations/BatchAreas/BatchAreaDetalhe.tsx
// -----------------------------------------------------------------------------
// Tela de DETALHE (somente leitura, cards) do vínculo Lote/Área (BatchArea)
// — Cadastros Base / Pecuários (TASK-FE-2103, execução 029). Rota:
// /cadastros-base/lote-area/:uuid (já registrada em `router/index.tsx`,
// TASK-FE-2104). SEM edição — a API não tem `PUT`/`PATCH` (D1, `contrato-
// lote-area.md`).
//
// Molde estrutural: `CadastrosBase/CentroCusto/DetalheCentroCusto.tsx`
// (`FormContainer` com `headerActions`, sub-componentes locais `InfoField`/
// `DetailPanel` para os painéis de leitura — nenhuma tela irmã
// `BatchGrazingDetalhe.tsx` existe ainda nesta execução para mirror direto,
// `TASK-FE-2003` não construída no momento desta Tarefa).
//
// Painel "Métricas" usa o conjunto de VISUALIZAÇÃO do contrato de API §7
// (`GetBatchAreaAction`) — DIFERENTE do conjunto de criação:
// Quant/Animais, Peso Total (kg), Peso Médio (kg), Total UA/Lote
// (`average_ua_per_batch`), Hectares. `ua_total` (da criação) NUNCA aparece
// aqui — é métrica de preview pré-save, não dado persistido do vínculo
// (contrato de API §7, DoD desta Tarefa).
//
// "Total UA/Lote" — rótulo literal do legado mantido (D-FE-2 do contrato de
// tela), com nota curta via tooltip ("média de UA por animal, agregada")
// para não parecer a mesma métrica que "Quant/UA" da criação.
//
// Ações: "Remover" por lote (`DELETE /batch-areas/{uuid}/batches/
// {batchUuid}`) e "Excluir vínculo inteiro" no `headerActions` (`DELETE
// /batch-areas/{uuid}`) — AMBAS não-destrutivas (D12 do contrato de API: o
// backend registra saída no histórico, nunca apaga), mesma cópia de diálogo
// não-destrutivo de `index.tsx`.
// -----------------------------------------------------------------------------

import { ElementType, ReactNode, useEffect, useState } from 'react';

import {
  Badge,
  Box,
  EmptyState,
  Flex,
  Icon,
  IconButton,
  SimpleGrid,
  Skeleton,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FiAlertTriangle, FiArrowLeft, FiInfo, FiTrash2, FiX } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { FormContainer } from '@/components/Layout/FormContainer';
import { Tooltip } from '@/components/TooLtip';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';
import formatDate from '@/utils/formatDate';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import {
  deleteBatchArea,
  removeBatchFromArea,
} from '@/services/v2/BaseRegistrations/batch-areas-service';

import type { BatchAreaData } from '@/@types/v2/BaseRegistrations/batch-areas';

import { useBatchAreaForm } from './useBatchAreas';

const BATCH_AREAS_LIST_ROUTE = '/cadastros-base/lote-area';

// Campo de leitura (label + valor), opcionalmente com nota de unidade via
// tooltip (D-FE-2/D9 do contrato de tela) — extensão ADITIVA do `InfoField`
// de `DetalheCentroCusto.tsx` (mesmo padrão visual, tokens Chakra).
function InfoField({ label, value, tooltip }: { label: string; value: string; tooltip?: string }) {
  return (
    <Box>
      <Flex align="center" gap={1} mb={1}>
        <Text
          fontSize="xs"
          fontWeight="semibold"
          color="fg.muted"
          textTransform="uppercase"
          letterSpacing="wide"
        >
          {label}
        </Text>
        {tooltip && (
          <Tooltip content={tooltip}>
            <Icon as={FiInfo} boxSize={3} color="fg.muted" />
          </Tooltip>
        )}
      </Flex>
      <Text fontSize="sm" color="fg.default">
        {value}
      </Text>
    </Box>
  );
}

// Painel agrupado com borda/rótulo — mesma linguagem visual de
// `DetalheCentroCusto.tsx`.
function DetailPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box bg="bg.muted" border="1px solid" borderColor="border.subtle" borderRadius="lg" p={4}>
      <Text
        fontSize="xs"
        fontWeight="semibold"
        color="fg.muted"
        textTransform="uppercase"
        letterSpacing="wide"
        mb={4}
        pb={2}
        borderBottom="1px solid"
        borderColor="border.subtle"
      >
        {title}
      </Text>
      {children}
    </Box>
  );
}

// `useBatchAreaForm` exige `fillForm` no contrato do hook (compartilhado com
// um formulário de edição que NÃO existe aqui, D1 do contrato de API) — esta
// tela não tem `useForm`/RHF, só lê `batchAreaQuery.data` direto. `noop`
// dispensa nomear (e silenciar como "não usado") os 2 parâmetros que este
// callback nunca lê — mirror `DetalheCentroCusto.tsx`.
function noop() {}

export default function BatchAreaDetalhe() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const queryClient = useQueryClient();
  const text = languageGB.baseRegistrations.batchArea;

  const canDelete = can('batch_area_delete');

  // Guard de navegação — uuid mal formado não deve chegar ao hook de query
  // nem renderizar conteúdo (mesmo racional de `DetalheCentroCusto.tsx`).
  useEffect(() => {
    if (!isValidGuid(uuid)) {
      navigate(BATCH_AREAS_LIST_ROUTE, { replace: true });
    }
  }, [uuid, navigate]);

  const batchAreaQuery = useBatchAreaForm({ registrationId: uuid, fillForm: noop });

  // ---- Excluir vínculo inteiro ----------------------------------------------
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const deleteMutation = useMutation({
    mutationFn: async () => await deleteBatchArea(uuid as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey.batchAreas.batchAreasList] });

      toaster.success({
        title: text.singularLabel,
        description: text.list.deletedToast,
        duration: 7000,
      });

      navigate(BATCH_AREAS_LIST_ROUTE);
    },
    onError: (error) => {
      console.error('BatchArea delete - error:', error);
      const errorMessage = extractApiErrorMessage(error) ?? languageGB.common.errorLog.unknownError;
      toaster.error({ title: text.singularLabel, description: errorMessage, duration: 7000 });
    },
  });

  // ---- Remover 1 lote --------------------------------------------------------
  const [batchToRemove, setBatchToRemove] = useState<{ uuid: string; description: string } | null>(
    null
  );
  const removeBatchMutation = useMutation({
    mutationFn: async (batchUuid: string) => await removeBatchFromArea(uuid as string, batchUuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey.batchAreas.batchArea, uuid] });
      queryClient.invalidateQueries({ queryKey: [queryKey.batchAreas.batchAreasList] });

      toaster.success({
        title: text.singularLabel,
        description: `${text.singularLabel} ${languageGB.defaltStrings.updateRegister}`,
        duration: 7000,
      });

      setBatchToRemove(null);
    },
    onError: (error) => {
      console.error('BatchArea removeBatch - error:', error);
      const errorMessage = extractApiErrorMessage(error) ?? languageGB.common.errorLog.unknownError;
      toaster.error({ title: text.singularLabel, description: errorMessage, duration: 7000 });
      setBatchToRemove(null);
    },
  });

  if (!isValidGuid(uuid)) {
    return null;
  }

  const isLoading = checkLoadingStatus([batchAreaQuery as any]);
  const batchArea = batchAreaQuery.data as BatchAreaData | undefined;
  const notFound = !isLoading && (batchAreaQuery as any).isError;

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
                <EmptyState.Title>{text.detail.notFound.title}</EmptyState.Title>
                <EmptyState.Description>{text.detail.notFound.description}</EmptyState.Description>
              </VStack>
              <Button
                title={text.detail.notFound.back}
                icon={FiArrowLeft as ElementType}
                variant="outline"
                size="sm"
                onClick={() => navigate(BATCH_AREAS_LIST_ROUTE)}
              />
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  const batches = batchArea?.batches ?? [];

  // Displays das métricas — guard EXPLÍCITO `!batchArea || campo == null`
  // (nunca `campo || '-'`, item 19 do checklist: `0` é valor legítimo). O
  // guard de `batchArea` primeiro (não `batchArea?.campo === null || ...`)
  // evita depender de narrowing de encadeamento opcional sobre a base
  // opcional dentro de uma disjunção — TS narrowing simples e explícito.
  const animalsQuantityDisplay =
    !batchArea || batchArea.animals_quantity === null || batchArea.animals_quantity === undefined
      ? '—'
      : String(batchArea.animals_quantity);
  const weightTotalDisplay =
    !batchArea || batchArea.weight_total_kg === null || batchArea.weight_total_kg === undefined
      ? '—'
      : `${batchArea.weight_total_kg.toFixed(2)} kg`;
  const weightAverageDisplay =
    !batchArea || batchArea.weight_average_kg === null || batchArea.weight_average_kg === undefined
      ? '—'
      : `${batchArea.weight_average_kg.toFixed(2)} kg`;
  const averageUaPerBatchDisplay =
    !batchArea ||
    batchArea.average_ua_per_batch === null ||
    batchArea.average_ua_per_batch === undefined
      ? '—'
      : batchArea.average_ua_per_batch.toFixed(2);
  const hectaresDisplay =
    !batchArea || batchArea.hectares === null || batchArea.hectares === undefined
      ? '—'
      : `${batchArea.hectares} ha`;

  return (
    <FormContainer
      title={batchArea?.code ? `${text.singularLabel} — ${batchArea.code}` : text.singularLabel}
      headerActions={
        batchArea &&
        canDelete && (
          <Button
            title={text.detail.actions.deleteLink}
            icon={FiTrash2 as ElementType}
            variant="outline"
            colorPalette="red"
            size="sm"
            onClick={() => setIsDeleteOpen(true)}
          />
        )
      }
    >
      <Box px={{ base: 4, md: 10 }} pb={8}>
        <Skeleton loading={isLoading}>
          <Flex direction="column" gap={6}>
            <DetailPanel title={text.detail.sections.generalData}>
              <SimpleGrid columns={columnsForm.default} gap={6}>
                <InfoField label={text.detail.fields.code} value={batchArea?.code ?? '—'} />
                <InfoField
                  label={text.detail.fields.area}
                  value={batchArea?.area.description ?? '—'}
                />
                <InfoField
                  label={text.detail.fields.date}
                  value={batchArea?.date ? formatDate(batchArea.date) : '—'}
                />
                <InfoField
                  label={text.detail.fields.employee}
                  value={batchArea?.employee?.name ?? '—'}
                />
              </SimpleGrid>
            </DetailPanel>

            <DetailPanel title={text.detail.sections.metrics}>
              <SimpleGrid columns={columnsForm.default} gap={6}>
                {/* `0` é valor legítimo (vínculo recém-criado com poucos
                    animais) — checagem explícita de `null`/`undefined`,
                    nunca `campo || '-'` (mesmo cuidado de `index.tsx`). */}
                <InfoField
                  label={text.detail.fields.animalQuantity}
                  value={animalsQuantityDisplay}
                />
                <InfoField label={text.detail.fields.totalWeight} value={weightTotalDisplay} />
                <InfoField label={text.detail.fields.averageWeight} value={weightAverageDisplay} />
                {/* "Total UA/Lote" (`average_ua_per_batch`) — rótulo literal
                    do legado (D-FE-2), com tooltip de nota curta para não
                    parecer a mesma métrica que "Quant/UA" da criação
                    (`ua_total`, que NUNCA aparece aqui). */}
                <InfoField
                  label={text.detail.fields.averageUaPerBatch}
                  tooltip={text.detail.hints.averageUaPerBatchTooltip}
                  value={averageUaPerBatchDisplay}
                />
                <InfoField label={text.detail.fields.hectares} value={hectaresDisplay} />
              </SimpleGrid>
            </DetailPanel>

            <DetailPanel title={text.detail.sections.batchesLinked}>
              {batches.length === 0 ? (
                <Text fontSize="sm" color="fg.muted">
                  —
                </Text>
              ) : (
                <Flex wrap="wrap" gap={2}>
                  {batches.map((batch) => (
                    <Flex
                      key={batch.uuid}
                      align="center"
                      gap={2}
                      bg="cardBG"
                      border="1px solid"
                      borderColor="border.subtle"
                      borderRadius="md"
                      pl={3}
                      pr={canDelete ? 1 : 3}
                      py={1}
                    >
                      <Badge colorPalette="gray" variant="subtle">
                        {batch.description}
                      </Badge>
                      {canDelete && (
                        <Tooltip content={text.detail.actions.removeBatch}>
                          <IconButton
                            aria-label={text.detail.actions.removeBatch}
                            onClick={() => setBatchToRemove(batch)}
                            disabled={removeBatchMutation.isPending}
                            variant="ghost"
                            size="2xs"
                            borderRadius="full"
                            color="fg.muted"
                            minW="20px"
                            width="20px"
                            height="20px"
                            _hover={{ bg: 'bg.muted', color: 'feedBack.errorMain' }}
                          >
                            <Icon as={FiX} boxSize={3} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Flex>
                  ))}
                </Flex>
              )}
            </DetailPanel>
          </Flex>
        </Skeleton>
      </Box>

      <DeleteConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
        isLoading={deleteMutation.isPending}
        title={text.deleteDialog.title}
        description={text.deleteDialog.description}
        warningText={text.deleteDialog.warningText}
        confirmButtonText={text.deleteDialog.confirm}
        itemName={batchArea ? `${batchArea.area.description} (${batchArea.code})` : undefined}
        hideQuestionMark
        tone="warning"
      />

      <DeleteConfirmDialog
        isOpen={!!batchToRemove}
        onClose={() => setBatchToRemove(null)}
        onConfirm={() => batchToRemove && removeBatchMutation.mutate(batchToRemove.uuid)}
        isLoading={removeBatchMutation.isPending}
        title={text.removeBatchDialog.title}
        description={text.removeBatchDialog.description}
        warningText={text.removeBatchDialog.warningText}
        confirmButtonText={text.removeBatchDialog.confirm}
        itemName={batchToRemove?.description}
        hideQuestionMark
        tone="warning"
      />
    </FormContainer>
  );
}
