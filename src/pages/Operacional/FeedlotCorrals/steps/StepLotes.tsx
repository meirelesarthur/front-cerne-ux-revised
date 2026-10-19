// src/pages/Operacional/FeedlotCorrals/steps/StepLotes.tsx
// -----------------------------------------------------------------------------
// Etapa 3/3 do wizard de Curral (FeedlotCorral) — Lotes — TASK-043-CUR-T05
// (`05-Wizard-Etapa3-Lotes.md`, contrato de tela §6 Etapa 3, FID-G3F
// SR-R18-R20/B15-B17/B26/B27/F08/H02/H07/H08/H11/H12/H26-H29/H34).
//
// `batches[]` (FM-017, `useFieldArray`) — cada linha é um `Select` de Lote
// JÁ EXISTENTE (`Option<uuid>`), reusando o MESMO padrão de
// `FeedlotCorralBatchRow.tsx`/`FeedlotCorralBatchesDialog.tsx` do Mapa
// (options pré-carregadas 1x + `usedUuids` filtra duplicatas na origem —
// IG-007 por PREVENÇÃO, não "seleciona e depois limpa": o dropdown nunca
// oferece um lote já usado em outra linha, mesmo efeito final do legado sem
// o passo intermediário de alerta+reset).
//
// Fonte das opções: `listBatchOptionsForForm` (`GET /batches/options`, SEM
// gate própria além de `auth:sanctum`+`farm.context` — mirror EXATO de
// `BatchTransferForm.tsx`, `queryKey.batches.options`), NÃO
// `getCorralBatchOptions` do Mapa (`feedlot-map/corrals/{uuid}/batch-options`,
// gate `feedlot-map_manage`, EXIGE curral já existente). Essa troca é
// deliberada: em CRIAR não há `corral_uuid` ainda (o curral só nasce no
// submit orquestrado, T06) — usar a fonte farm-wide, gate-free, funciona
// igual em criar E editar, e é justamente o motivo de existir
// `PUT /feedlot-corrals/{uuid}/batches` (CUR-02/GAP-API-06) sob
// `feedlot-corrals_edit`: eliminar a dependência cruzada de
// `feedlot-map_manage` (PARADA-B) também do lado da LEITURA das opções. O
// ATTACH real (`batch_ids[]` → `PUT .../batches`) acontece no submit
// orquestrado (T06) — esta Etapa só coleta a intenção do usuário no
// `FeedlotCorralWizardForm.batches`.
//
// Resumo (CV-004) — soma real de `total_animals` por lote selecionado via
// `GET /batches/{uuid}` (`batch_view`, mesmo endpoint do sub-modal). CV-005/
// CV-006 (peso total/médio) NÃO são computáveis: nem `/batches/options` nem
// `AnimalBatchResource` expõem peso agregado do lote — MESMA limitação
// estrutural já declarada em `FeedlotCorralBatchesDialog.tsx` (GAP-FE-241),
// não uma lacuna nova desta Tarefa. Sem `batch_view`, o resumo cai para a
// contagem de linhas (sem chamar a API) — estado honesto (Regra 9), nunca um
// número fabricado.
//
// Bloqueio por status (IG-010/011/PARADA-DEF-D) — status ∈ {VS,FE,MA,LI}
// desabilita a etapa INTEIRA (add + cada linha + botão do modal), corrigindo
// o defeito legado DEF-006 (que só bloqueava a partir do 2º card). Mesmo
// conjunto/mesma função `requiresStatusDetail` de IG-009 (Etapa 1) — sem
// duplicar `FEEDLOT_CORRAL_STATUS_DETAIL_REQUIRED`.
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import { Box, Flex, Heading, IconButton, Text, VStack } from '@chakra-ui/react';
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Control, Controller, UseFormSetValue, useFieldArray, useWatch } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { Select } from '@/components/Form/Select';
import { Tooltip } from '@/components/TooLtip';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { queryKey } from '@/constants/query-key';

import { requiresStatusDetail } from '@/validations/schemas/FeedlotCorrals/feedlotCorralWizard-schema';

import { getBatchById, listBatchOptionsForForm } from '@/services/v2/Batches/batch-service';

import type { Option } from '@/@types/option';
import type { BatchOption } from '@/@types/v2/Batches';
import type { FeedlotCorralWizardForm } from '@/@types/v2/FeedlotCorrals';

import { BatchModal } from './BatchModal';

function mapBatchOption(item: BatchOption): Option<string> {
  return { label: item.label, value: item.uuid };
}

export interface StepLotesProps {
  control: Control<FeedlotCorralWizardForm>;
  setValue: UseFormSetValue<FeedlotCorralWizardForm>;
  disabled?: boolean;
}

export function StepLotes({ control, setValue, disabled }: StepLotesProps) {
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const queryClient = useQueryClient();

  const batchesText = languageGB.feedlotMap.feedlotMap.batches;
  const lotsText = languageGB.feedlotCorrals.feedlotCorral.wizard.lots;

  const { fields, append, remove } = useFieldArray({ control, name: 'batches' });

  const watchedStatus = useWatch({ control, name: 'status' });
  const watchedCapacity = useWatch({ control, name: 'capacity' });
  const watchedBatches = useWatch({ control, name: 'batches' });

  const isBlockedByStatus = requiresStatusDetail(watchedStatus);
  const rowsDisabled = !!disabled || isBlockedByStatus;

  // ---- Opções (1x, farm-wide, gate-free) ----------------------------------
  const batchOptionsQuery = useQuery({
    queryKey: [queryKey.batches.options],
    queryFn: () => listBatchOptionsForForm({}),
  });
  const allOptions = useMemo(
    () => (batchOptionsQuery.data?.data.items ?? []).map(mapBatchOption),
    [batchOptionsQuery.data]
  );

  const usedUuids = useMemo(
    () =>
      new Set(
        (watchedBatches ?? [])
          .map((row) => row.batch_uuid?.value)
          .filter((value): value is string => !!value)
      ),
    [watchedBatches]
  );

  function optionsForRow(currentUuid?: string) {
    return allOptions.filter(
      (option) => option.value === currentUuid || !usedUuids.has(option.value)
    );
  }

  // ---- Resumo (CV-004) — soma real via `GET /batches/{uuid}` -------------
  const canViewBatch = can('batch_view');
  const selectedUuids = useMemo(() => Array.from(usedUuids), [usedUuids]);
  const batchDetailQueries = useQueries({
    queries: selectedUuids.map((uuid) => ({
      queryKey: [queryKey.batches.detail, uuid],
      queryFn: async () => (await getBatchById(uuid)).data,
      enabled: canViewBatch,
    })),
  });
  const totalAnimals = canViewBatch
    ? batchDetailQueries.reduce((sum, query) => sum + (query.data?.total_animals ?? 0), 0)
    : null;

  const capacity = Number(watchedCapacity) || 0;
  const showCapacityWarning = totalAnimals !== null && capacity > 0 && totalAnimals > capacity;

  // ---- Adicionar linha (AC-015/IG-004) ------------------------------------
  const [addBlockedNotice, setAddBlockedNotice] = useState(false);
  function handleAddRow() {
    const lastRow = fields[fields.length - 1];
    if (lastRow && !lastRow.batch_uuid) {
      setAddBlockedNotice(true);
      return;
    }
    setAddBlockedNotice(false);
    append({ batch_uuid: null });
  }

  // ---- Remover linha (AC-016/IG-005) --------------------------------------
  const [rowPendingRemoval, setRowPendingRemoval] = useState<number | null>(null);
  function handleConfirmRemove() {
    if (rowPendingRemoval !== null) remove(rowPendingRemoval);
    setRowPendingRemoval(null);
  }

  // ---- Modal de lote (AC-017/IG-023, PARADA-DEF-C upsert) -----------------
  const [batchModalRowIndex, setBatchModalRowIndex] = useState<number | null>(null);
  const activeRowUuid =
    batchModalRowIndex !== null ? (fields[batchModalRowIndex]?.batch_uuid?.value ?? null) : null;

  const canCreateBatch = can('batch_create');
  const canEditBatch = can('batch_edit') && canViewBatch;

  function handleBatchSaved(option: { uuid: string; description: string }) {
    if (batchModalRowIndex !== null) {
      setValue(
        `batches.${batchModalRowIndex}.batch_uuid`,
        { label: option.description, value: option.uuid },
        { shouldDirty: true, shouldValidate: true }
      );
    }
    queryClient.invalidateQueries({ queryKey: [queryKey.batches.options] });
    setBatchModalRowIndex(null);
  }

  return (
    <Box>
      <Heading size="sm" mb={1}>
        {isBlockedByStatus ? lotsText.blockedHeading : lotsText.heading}
      </Heading>
      <Text fontSize="sm" color="fg.muted" mb={4}>
        {isBlockedByStatus ? lotsText.blockedDescription : lotsText.description}
      </Text>

      {showCapacityWarning && (
        <Box bg="feedBack.warn" borderRadius="md" px={4} py={2} mb={4}>
          <Text fontSize="sm">
            {batchesText.capacityWarning.replace('{capacity}', String(capacity))}
          </Text>
        </Box>
      )}

      <VStack align="stretch" gap={3}>
        {fields.map((field, index) => (
          <Flex key={field.id} align="flex-end" gap={2}>
            <IconButton
              aria-label={batchesText.removeBatch}
              size="sm"
              variant="outline"
              colorPalette="red"
              onClick={() => setRowPendingRemoval(index)}
              disabled={rowsDisabled || fields.length <= 1}
            >
              <Trash2 />
            </IconButton>

            <Box flex="1">
              <Controller
                name={`batches.${index}.batch_uuid`}
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <Select
                    label={batchesText.fields.batch}
                    name={name}
                    value={value}
                    onChange={onChange}
                    options={optionsForRow(value?.value)}
                    loading={batchOptionsQuery.isPending}
                    isDisabled={rowsDisabled}
                  />
                )}
              />
            </Box>

            {(canCreateBatch || canEditBatch) && (
              <IconButton
                aria-label={
                  field.batch_uuid ? lotsText.batchModal.titleEdit : lotsText.batchModal.titleCreate
                }
                size="sm"
                variant="outline"
                onClick={() => setBatchModalRowIndex(index)}
                disabled={rowsDisabled || (field.batch_uuid ? !canEditBatch : !canCreateBatch)}
              >
                {field.batch_uuid ? <Pencil /> : <Plus />}
              </IconButton>
            )}
          </Flex>
        ))}
      </VStack>

      {fields.length === 0 && (
        <Text color="fg.muted" mt={3}>
          {batchesText.empty}
        </Text>
      )}

      <Flex align="center" gap={3} mt={4}>
        <Tooltip content={lotsText.statusBlockedTooltip} disabled={!isBlockedByStatus}>
          <Box display="inline-block">
            <Button
              title={batchesText.addBatch}
              variant="outline"
              type="button"
              onClick={handleAddRow}
              disabled={rowsDisabled}
            />
          </Box>
        </Tooltip>
        {addBlockedNotice && !rowsDisabled && (
          <Text fontSize="sm" color="feedBack.errorMain">
            {lotsText.addBlockedDescription}
          </Text>
        )}
      </Flex>

      <VStack align="flex-start" gap={0} mt={4}>
        <Text fontSize="sm" color="fg.muted">
          {lotsText.summaryCount.replace('{count}', String(usedUuids.size))}
        </Text>
        {canViewBatch && (
          <Text fontSize="sm" color="fg.muted">
            {lotsText.summaryTotalAnimals.replace('{total}', String(totalAnimals ?? 0))}
          </Text>
        )}
      </VStack>

      <DeleteConfirmDialog
        isOpen={rowPendingRemoval !== null}
        onClose={() => setRowPendingRemoval(null)}
        onConfirm={handleConfirmRemove}
        title={lotsText.removeConfirmTitle}
        description={lotsText.removeConfirmDescription}
        hideQuestionMark={false}
        tone="warning"
      />

      <BatchModal
        isOpen={batchModalRowIndex !== null}
        targetUuid={activeRowUuid}
        onClose={() => setBatchModalRowIndex(null)}
        onSaved={handleBatchSaved}
      />
    </Box>
  );
}
