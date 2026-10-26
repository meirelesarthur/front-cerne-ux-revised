// src/pages/Operacional/Nascimentos/BirthAnimalImportModal.tsx
// -----------------------------------------------------------------------------
// Modal de IMPORT/EXPORT de planilha (.xlsx) de Nascimentos — TASK-NASC-FE-03
// (contrato §5.4/§8/§9). Mirror MECÂNICO de
// `CadastrosBase/Rebanho/AnimalImportModal.tsx` (Dialog nativo Chakra v3,
// steps 'upload'|'result', `FileUpload`, `useMutation` direto).
//
// ATOMICIDADE (contrato §9, "padrão ABORT-ALL"): qualquer linha inválida
// rejeita a importação INTEIRA (422 com `errors.rows[]`), nada é persistido
// parcialmente. `onError` (não `onSuccess`) trata `errors.rows[]`.
//
// DIVERGÊNCIA deliberada do mirror `AnimalImportModal` (disclosure): sucesso
// (200) devolve SÓ `{created}` (`BirthAnimalImportResult`) — NÃO
// `{created, children_created}` de Animal (dev, Leitura §2: "a UI não tenta
// renderizar uma tabela de 'importados', só um toast/resumo com a contagem").
//
// PERMISSÃO (checklist Tarefa 20, mirror GAP-NASC-02): download gateado por
// `birth_animals_view`, import por `birth_animals_create` — gates
// INDEPENDENTES recebidos via prop do header (`HeaderTable.tsx`), nunca
// hardcoded aqui. Categoria fixa do template ([4,5], GAP-NASC-13) e demais
// decisões de paridade da API são opacas a esta tela — nunca "corrigidas"
// ou avisadas na UI (Leitura do dev, Riscos + solução).
// -----------------------------------------------------------------------------

import { ElementType, useState } from 'react';

import { Box, Dialog, Flex, Icon, Portal, Text } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { FiAlertTriangle, FiDownload } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { FileUpload } from '@/components/Form/FileUpload';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { downloadBlob } from '@/utils/downloadBlob';

import { queryKey } from '@/constants/query-key';

import {
  downloadBirthAnimalTemplate,
  importBirthAnimals,
} from '@/services/v2/BirthAnimals/birth-animal-service';

import type { BirthAnimalImportResult } from '@/@types/v2/BirthAnimals';

export interface BirthAnimalImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** `birth_animals_view` — gateia SÓ o botão "Baixar modelo" (GAP-NASC-02). */
  canDownload: boolean;
  /** `birth_animals_create` — gateia a seção de upload/submit (GAP-NASC-02). */
  canImport: boolean;
}

export function BirthAnimalImportModal({
  isOpen,
  onClose,
  canDownload,
  canImport,
}: BirthAnimalImportModalProps) {
  const queryClient = useQueryClient();
  const { languageGB } = useLanguage();
  const text = languageGB.birthAnimals.birthAnimal;
  const importText = text.excel.import;

  const [step, setStep] = useState<'upload' | 'result'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<BirthAnimalImportResult | null>(null);
  const [rowErrors, setRowErrors] = useState<string[]>([]);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);

  function resetState() {
    setStep('upload');
    setFile(null);
    setResult(null);
    setRowErrors([]);
  }

  const importMutation = useMutation({
    mutationFn: importBirthAnimals,
    onSuccess: (response) => {
      // ABORT-ALL — sucesso (200) só acontece quando TODAS as linhas foram
      // gravadas, sempre invalida a listagem (contrato §item 3 da Tarefa 20).
      queryClient.invalidateQueries({ queryKey: [queryKey.birthAnimals.birthAnimalsList] });
      toaster.success({
        title: text.singularLabel,
        description: importText.importSuccessToast,
        duration: 7000,
      });
      setResult(response.data);
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
        description: resData?.message ?? languageGB.common.errorLog.unknownError,
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
      const blob = await downloadBirthAnimalTemplate();
      downloadBlob(blob, 'modelo-nascimentos.xlsx');
    } catch {
      toaster.error({ title: text.singularLabel, description: text.excel.downloadTemplateError });
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

  function handleSubmit() {
    if (!file) return;
    importMutation.mutate(file);
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
                    {canDownload && (
                      <Button
                        title={importText.downloadShortcut}
                        variant="outline"
                        icon={FiDownload as ElementType}
                        onClick={handleDownloadTemplate}
                        loading={isDownloadingTemplate}
                        disabled={isDownloadingTemplate || isSubmitting}
                        flexShrink={0}
                      />
                    )}
                  </Flex>

                  <Text fontSize="sm" color="fg.default">
                    {importText.instructions}
                  </Text>

                  {canImport ? (
                    <>
                      <Flex
                        align="flex-start"
                        gap={3}
                        p={4}
                        bg="orange.500/10"
                        border="1px solid"
                        borderColor="orange.500/30"
                        borderRadius="lg"
                      >
                        <Icon
                          as={FiAlertTriangle}
                          color="orange.400"
                          boxSize={5}
                          flexShrink={0}
                          mt="1px"
                        />
                        <Flex direction="column" gap={1}>
                          <Text fontSize="sm" fontWeight="semibold">
                            {importText.warning.title}
                          </Text>
                          <Text fontSize="xs" color="fg.muted">
                            {importText.warning.description}
                          </Text>
                        </Flex>
                      </Flex>

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
                              <Text
                                as="li"
                                key={`${index}-${rowError}`}
                                fontSize="xs"
                                color="fg.muted"
                              >
                                {rowError}
                              </Text>
                            ))}
                          </Box>
                        </Flex>
                      )}
                    </>
                  ) : (
                    <Text fontSize="sm" color="fg.muted">
                      {importText.noPermission}
                    </Text>
                  )}
                </Flex>
              ) : (
                <Flex direction="column" gap={4}>
                  <Flex gap={3}>
                    <Box flex={1} p={3} borderRadius="lg" bg="bg.subtle" textAlign="center">
                      <Text fontSize="2xl" fontWeight="bold" color="brandColorText">
                        {result?.created ?? 0}
                      </Text>
                      <Text fontSize="xs" color="fg.muted">
                        {importText.result.created}
                      </Text>
                    </Box>
                  </Flex>
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
                  {canImport && (
                    <Button
                      title={importText.submitButton}
                      onClick={handleSubmit}
                      loading={isSubmitting}
                      disabled={!file || isSubmitting}
                    />
                  )}
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
