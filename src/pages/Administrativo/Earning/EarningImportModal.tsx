// src/pages/Administrativo/Earning/EarningImportModal.tsx
// -----------------------------------------------------------------------------
// Modal de IMPORTAÇÃO de planilha (.xlsx) de Apuração Mensal — Administrativo,
// 97-Esteiras/002, Tarefa 09. Mirror ESTRUTURAL de
// `CorrecaoEstoque/StockCorrectionImportModal.tsx` (Dialog v3 headless,
// `Portal`, máquina de estados `step: 'upload' | 'result'`, `useMutation`
// DIRETO — NÃO `useRequest`, mesma razão do precedente: precisa diferenciar
// `errors.rows[]` de mensagem única e manter o modal aberto no sucesso para
// mostrar o resultado), ACRESCIDO dos campos GLOBAIS de lote
// (mês/ano/tipo obrigatórios; centro de custo/equipe/proprietário
// opcionais, aplicados à planilha INTEIRA, não por linha — `ImportEarningRequest`).
//
// Download/import SEM gate de permissão granular (`GAP-EARNING-05`
// [AVALIADO], Opção B — preservar) — nenhuma checagem de
// `earnings_view`/`earnings_edit` neste modal, mirror fiel do legado.
// -----------------------------------------------------------------------------

import { ElementType, useState } from 'react';

import { Box, Dialog, Flex, Icon, Portal, SimpleGrid, Text } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Controller, useForm } from 'react-hook-form';
import { FiAlertTriangle, FiDownload } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { FileUpload } from '@/components/Form/FileUpload';
import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { downloadBlob } from '@/utils/downloadBlob';
import { extractApiFieldErrorMessage } from '@/utils/extractApiErrorMessage';

import { queryKey } from '@/constants/query-key';

import { listCostCenterOptions } from '@/services/v2/CostCenters/cost-center-service';
import { downloadEarningTemplate, importEarnings } from '@/services/v2/Earnings/earning-service';
import { listTeams } from '@/services/v2/Teams/team-service';

import type { CostCenterRef } from '@/@types/v2/CostCenters';
import type { EarningImportResult, EarningTypeValue } from '@/@types/v2/Earnings';
import type { TeamListItem } from '@/@types/v2/Teams';

import { useProprietaryOptionsAccess, useTeamOptionsAccess } from './useEarnings';

export interface EarningImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface BatchFieldsForm {
  month: number | '';
  year: number | '';
  type: EarningTypeValue;
  center_uuid: { label: string; value: string } | null;
  team_uuid: { label: string; value: string } | null;
  proprietary_uuid: { label: string; value: string } | null;
}

const TYPE_OPTIONS: { label: string; value: EarningTypeValue }[] = [
  { label: 'Folha Normal', value: 'N' },
  { label: 'Adiantamento 13º', value: 'A' },
  { label: '13º Salário', value: 'D' },
];

const findParamsFromSearch = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
});

const pristineBatchFields: BatchFieldsForm = {
  month: '',
  year: '',
  type: 'N',
  center_uuid: null,
  team_uuid: null,
  proprietary_uuid: null,
};

export function EarningImportModal({ isOpen, onClose }: EarningImportModalProps) {
  const queryClient = useQueryClient();
  const { languageGB } = useLanguage();
  const text = languageGB.earnings.earning;
  const importText = text.importModal;

  const [step, setStep] = useState<'upload' | 'result'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<EarningImportResult | null>(null);
  const [rowErrors, setRowErrors] = useState<string[]>([]);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);

  const { control, handleSubmit, reset } = useForm<BatchFieldsForm>({
    mode: 'onChange',
    defaultValues: pristineBatchFields,
  });

  const proprietaryAccessQuery = useProprietaryOptionsAccess();
  const teamAccessQuery = useTeamOptionsAccess();
  const isProprietaryAvailable = !proprietaryAccessQuery.isError;
  const isTeamAvailable = !teamAccessQuery.isError;

  function resetState() {
    setStep('upload');
    setFile(null);
    setResult(null);
    setRowErrors([]);
    reset(pristineBatchFields);
  }

  const importMutation = useMutation({
    mutationFn: ({
      selectedFile,
      batchFields,
    }: {
      selectedFile: File;
      batchFields: BatchFieldsForm;
    }) =>
      importEarnings(selectedFile, {
        month: Number(batchFields.month),
        year: Number(batchFields.year),
        type: batchFields.type,
        center_uuid: batchFields.center_uuid?.value,
        team_uuid: batchFields.team_uuid?.value,
        proprietary_uuid: batchFields.proprietary_uuid?.value,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [queryKey.earnings.earnings] });
      toaster.success({
        title: text.singularLabel,
        description: importText.importSuccessToast,
        duration: 7000,
      });
      setResult(data.data);
      setRowErrors([]);
      setStep('result');
    },
    onError: (error) => {
      const resData = isAxiosError(error) ? (error.response?.data as any) : null;
      const rows = resData?.errors?.rows;
      if (Array.isArray(rows) && rows.length > 0) {
        setRowErrors(rows);
        return; // permanece na etapa 'upload', mostra a caixa de erro ali
      }
      toaster.error({
        title: text.singularLabel,
        description:
          extractApiFieldErrorMessage(error) ??
          resData?.message ??
          languageGB.common.errorLog.unknownError,
        duration: 7000,
      });
    },
  });

  const isSubmitting = importMutation.isPending;

  function handleClose() {
    if (isSubmitting) return;
    resetState();
    onClose();
  }

  async function handleDownloadTemplate() {
    setIsDownloadingTemplate(true);
    try {
      const blob = await downloadEarningTemplate();
      downloadBlob(blob, 'modelo-apuracao-mensal.xlsx');
    } catch {
      toaster.error({ title: text.singularLabel, description: importText.downloadTemplateError });
    } finally {
      setIsDownloadingTemplate(false);
    }
  }

  function handleFileSelected(selected: File | null) {
    setFile(selected);
    setRowErrors([]);
  }

  function handleFileRemove() {
    setFile(null);
    setRowErrors([]);
  }

  function onSubmit(batchFields: BatchFieldsForm) {
    if (!file) return;
    importMutation.mutate({ selectedFile: file, batchFields });
  }

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(details: { open: boolean }) => {
        if (!details.open) handleClose();
      }}
      size="lg"
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
              <Dialog.Title>{importText.title}</Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              {step === 'upload' ? (
                <Flex direction="column" gap={4}>
                  <Flex align="center" justify="space-between" gap={3}>
                    <Text fontSize="sm" color="fg.muted" flex={1}>
                      {importText.subtitle}
                    </Text>
                    <Button
                      title={importText.downloadShortcut}
                      variant="outline"
                      icon={FiDownload as ElementType}
                      onClick={handleDownloadTemplate}
                      loading={isDownloadingTemplate}
                      disabled={isDownloadingTemplate || isSubmitting}
                      flexShrink={0}
                    />
                  </Flex>

                  <Text fontSize="sm" color="fg.default">
                    {importText.instructions}
                  </Text>

                  <SimpleGrid columns={2} gap={4}>
                    <Controller
                      name="month"
                      control={control}
                      render={({ field }) => (
                        <Input
                          type="number"
                          label={importText.batchFields.month}
                          value={field.value}
                          onChange={(event) => field.onChange(Number(event.target.value) || '')}
                          isRequired
                          disabled={isSubmitting}
                        />
                      )}
                    />
                    <Controller
                      name="year"
                      control={control}
                      render={({ field }) => (
                        <Input
                          type="number"
                          label={importText.batchFields.year}
                          value={field.value}
                          onChange={(event) => field.onChange(Number(event.target.value) || '')}
                          isRequired
                          disabled={isSubmitting}
                        />
                      )}
                    />
                    <Controller
                      name="type"
                      control={control}
                      render={({ field }) => (
                        <Select
                          name={field.name}
                          label={importText.batchFields.type}
                          options={TYPE_OPTIONS}
                          value={
                            TYPE_OPTIONS.find((option) => option.value === field.value) ?? null
                          }
                          onChange={(option: any) => field.onChange(option?.value ?? 'N')}
                          disablePortal
                          isDisabled={isSubmitting}
                        />
                      )}
                    />
                    <Controller
                      name="center_uuid"
                      control={control}
                      render={({ field }) => (
                        <SelectAsyncPaginate
                          name={field.name}
                          label={importText.batchFields.costCenter}
                          service={listCostCenterOptions}
                          mapOptions={(item: CostCenterRef) => ({
                            label: `${item.code} — ${item.description}`,
                            value: item.uuid,
                          })}
                          findParams={findParamsFromSearch}
                          value={field.value ?? null}
                          onChange={(option: any) => field.onChange(option ?? null)}
                          isDisabled={isSubmitting}
                          disablePortal
                        />
                      )}
                    />
                    {isTeamAvailable && (
                      <Controller
                        name="team_uuid"
                        control={control}
                        render={({ field }) => (
                          <SelectAsyncPaginate
                            name={field.name}
                            label={importText.batchFields.team}
                            service={listTeams}
                            mapOptions={(item: TeamListItem) => ({
                              label: item.name,
                              value: item.uuid,
                            })}
                            findParams={findParamsFromSearch}
                            value={field.value ?? null}
                            onChange={(option: any) => field.onChange(option ?? null)}
                            isDisabled={isSubmitting}
                            disablePortal
                          />
                        )}
                      />
                    )}
                    {isProprietaryAvailable && (
                      <Controller
                        name="proprietary_uuid"
                        control={control}
                        render={({ field }) => (
                          <Select
                            name={field.name}
                            label={importText.batchFields.proprietary}
                            options={(proprietaryAccessQuery.data ?? []).map((item) => ({
                              label: item.label,
                              value: item.uuid,
                            }))}
                            value={field.value ?? null}
                            onChange={(option: any) => field.onChange(option ?? null)}
                            disablePortal
                            isDisabled={isSubmitting}
                          />
                        )}
                      />
                    )}
                  </SimpleGrid>

                  <FileUpload
                    label={importText.fileUpload.label}
                    hint={importText.fileUpload.hint}
                    accept=".xlsx"
                    maxSizeMb={10}
                    file={file}
                    onFileSelected={handleFileSelected}
                    onRemove={handleFileRemove}
                    disabled={isSubmitting}
                    dropzoneTitle={importText.fileUpload.dropzoneTitle}
                    dropzoneDraggingTitle={importText.fileUpload.dropzoneDraggingTitle}
                    changeLabel={importText.fileUpload.changeLabel}
                    removeLabel={importText.fileUpload.removeLabel}
                    errorTypeMessage={importText.fileUpload.errorTypeMessage}
                    errorSizeMessage={importText.fileUpload.errorSizeMessage}
                  />

                  {rowErrors.length > 0 && (
                    <Flex
                      direction="column"
                      gap={2}
                      p={4}
                      bg="red.500/10"
                      border="1px solid"
                      borderColor="red.500/30"
                      borderRadius="lg"
                    >
                      <Flex align="center" gap={2}>
                        <Icon as={FiAlertTriangle} color="fg.error" boxSize={4} />
                        <Text fontSize="sm" fontWeight="semibold" color="fg.error">
                          {importText.rowErrors.title}
                        </Text>
                      </Flex>
                      <Box as="ul" pl={5} m={0} display="flex" flexDirection="column" gap={1}>
                        {rowErrors.map((rowError, index) => (
                          <Text as="li" key={`${index}-${rowError}`} fontSize="xs" color="fg.muted">
                            {rowError}
                          </Text>
                        ))}
                      </Box>
                    </Flex>
                  )}
                </Flex>
              ) : (
                <Flex gap={3}>
                  <Box flex={1} p={3} borderRadius="lg" bg="bg.subtle" textAlign="center">
                    <Text fontSize="2xl" fontWeight="bold" color="brandColorText">
                      {result?.employees_processed ?? 0}
                    </Text>
                    <Text fontSize="xs" color="fg.muted">
                      {importText.result.employeesProcessedLabel}
                    </Text>
                  </Box>
                  <Box flex={1} p={3} borderRadius="lg" bg="bg.subtle" textAlign="center">
                    <Text fontSize="2xl" fontWeight="bold" color="brandColorText">
                      {result?.rows_processed ?? 0}
                    </Text>
                    <Text fontSize="xs" color="fg.muted">
                      {importText.result.rowsProcessedLabel}
                    </Text>
                  </Box>
                </Flex>
              )}
            </Dialog.Body>

            <Dialog.Footer>
              {step === 'upload' ? (
                <>
                  <Button
                    title={importText.cancelButton}
                    variant="secondary"
                    onClick={handleClose}
                    disabled={isSubmitting}
                  />
                  <Button
                    title={importText.submitButton}
                    onClick={handleSubmit(onSubmit)}
                    loading={isSubmitting}
                    disabled={!file || isSubmitting}
                  />
                </>
              ) : (
                <Button title={importText.closeButton} onClick={handleClose} />
              )}
            </Dialog.Footer>
            {/* @ts-ignore ChakraUI v3 headless dialog */}
            <Dialog.CloseTrigger />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

export default EarningImportModal;
