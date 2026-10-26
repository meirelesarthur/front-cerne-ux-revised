// src/pages/CadastrosBase/Batches/BatchImportModal.tsx
// -----------------------------------------------------------------------------
// Modal de IMPORTAÇÃO de planilha (.xlsx) de Lote Animal — TASK-FE-1082.
// Mirror MECÂNICO de `Rebanho/AnimalImportModal.tsx` (Dialog nativo Chakra v3,
// steps 'upload'|'result', `FileUpload`, `useMutation` direto — NÃO
// `useRequest` genérico), adaptado ao comportamento REAL e DIFERENTE do
// import de Animal: aqui NÃO é abort-all.
//
// ⚠️ O PONTO CENTRAL DESTA TAREFA (contrato v1.1 §8, D1/D2 — confirmado por
// leitura direta de `AnimalBatchController::import()`/`ImportAnimalBatchAction`,
// api_root): a resposta é SEMPRE HTTP 201 com `success: true` (o Lote, aba
// "cabecalho", já foi persistido) — MESMO quando a aba "animais" falhou e
// nenhum animal foi vinculado (identificação inexistente/já em outro
// lote/de outra fazenda). Nesse caso o Lote fica CRIADO e VAZIO ("Lote
// órfão", fidelidade deliberada ao legado, SEM rollback entre abas) e a
// ÚNICA pista textual do ocorrido é o campo `message` da resposta, que passa
// a listar as identificações não resolvidas.
//
// Por isso este modal NUNCA dispara um toast genérico de sucesso após o
// import — a etapa `step === 'result'` é SEMPRE exibida (não um toast que
// pode ser perdido) com a `message` literal da API renderizada verbatim
// dentro de um Alert (mesmo padrão visual Flex+bg+border+Icon já usado pelo
// aviso pré-envio de `AnimalImportModal`), colorido conforme
// `data.total_animals` do Lote criado: 0 → laranja/aviso (`result.partialTitle`),
// >0 → verde (`result.successTitle`) — a cor é só um rótulo a mais, NUNCA
// substitui a mensagem real da API nem tenta reinterpretar o que aconteceu.
//
// Gate de permissão: `batch_create` — mesma chave do `download` (mesmo
// público, `AnimalBatchImportRequest::authorize()`/rota real,
// `routes/api.php`), decidido no `HeaderTable.tsx` (caller), não aqui.
// -----------------------------------------------------------------------------

import { ElementType, useState } from 'react';

import { Box, Dialog, Flex, Icon, Portal, Text } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { FiAlertTriangle, FiCheckCircle, FiDownload } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { FileUpload } from '@/components/Form/FileUpload';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { downloadBlob } from '@/utils/downloadBlob';

import { queryKey } from '@/constants/query-key';

import { downloadBatchTemplate, importBatch } from '@/services/v2/Batches/batch-service';

interface BatchImportResult {
  code: string;
  totalAnimals: number;
  /** `message` literal devolvida pela API (`ApiResponse::created`) — SEMPRE exibida ao usuário, nunca substituída por um texto genérico. */
  message: string;
}

export interface BatchImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BatchImportModal({ isOpen, onClose }: BatchImportModalProps) {
  const queryClient = useQueryClient();
  const { languageGB } = useLanguage();
  const text = languageGB.batches.batch;
  const importText = text.importExport;

  const [step, setStep] = useState<'upload' | 'result'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<BatchImportResult | null>(null);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);

  function resetState() {
    setStep('upload');
    setFile(null);
    setResult(null);
  }

  const importMutation = useMutation({
    mutationFn: importBatch,
    onSuccess: (response) => {
      // 201/success:true SEMPRE — o Lote foi criado (D2). NÃO invalidamos
      // condicionalmente: mesmo o Lote órfão (vazio) precisa aparecer na
      // listagem para o usuário conferir. A LISTA é invalidada sempre;
      // NENHUM toast de sucesso genérico é disparado aqui — a `message`
      // real vai para a etapa `result` abaixo, sempre visível.
      queryClient.invalidateQueries({ queryKey: [queryKey.batches.list] });
      setResult({
        code: response.data.code,
        totalAnimals: response.data.total_animals,
        message: response.message ?? '',
      });
      setStep('result');
    },
    onError: (error) => {
      // Único caminho de erro real deste endpoint: `AnimalBatchImportRequest`
      // rejeitando o ARQUIVO em si (ausente/mimes/tamanho, 422) antes de
      // qualquer escrita — mensagem NOMEADA da API, nunca texto fixo.
      const resData = isAxiosError(error) ? (error.response?.data as any) : null;
      const fileError = resData?.errors?.file?.[0];
      toaster.error({
        title: text.singularLabel,
        description: fileError ?? resData?.message ?? importText.errorToast,
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
      const blob = await downloadBatchTemplate();
      downloadBlob(blob, 'modelo-lote-animais.xlsx');
    } catch {
      toaster.error({ title: text.singularLabel, description: importText.downloadTemplateError });
    } finally {
      setIsDownloadingTemplate(false);
    }
  }

  function handleFileSelected(selected: File | null) {
    setFile(selected);
  }

  function handleFileRemove() {
    setFile(null);
  }

  function handleSubmit() {
    if (!file) return;
    importMutation.mutate(file);
  }

  const isOrphan = (result?.totalAnimals ?? 0) === 0;

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
              <Dialog.Title>{importText.modalTitle}</Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              {step === 'upload' ? (
                <Flex direction="column" gap={4}>
                  <Flex align="center" justify="space-between" gap={3}>
                    <Text fontSize="sm" color="fg.muted" flex={1}>
                      {importText.modalDescription}
                    </Text>
                    <Button
                      title={importText.downloadTemplate}
                      variant="outline"
                      size="sm"
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
                </Flex>
              ) : (
                <Flex direction="column" gap={4}>
                  {/*
                    Etapa de RESULTADO — SEMPRE exibida (nunca um toast de
                    sucesso genérico). A `message` literal da API é a única
                    fonte confiável de que os animais foram (ou não)
                    vinculados (contrato v1.1 §8, D2) — renderizada verbatim
                    abaixo, sem reinterpretação. A cor/ícone do Alert
                    (laranja/verde) é só um rótulo adicional derivado de
                    `total_animals`, nunca substitui o texto real.
                  */}
                  <Flex
                    align="flex-start"
                    gap={3}
                    p={4}
                    bg={isOrphan ? 'orange.500/10' : 'green.500/10'}
                    border="1px solid"
                    borderColor={isOrphan ? 'orange.500/30' : 'green.500/30'}
                    borderRadius="lg"
                  >
                    <Icon
                      as={isOrphan ? FiAlertTriangle : FiCheckCircle}
                      color={isOrphan ? 'orange.400' : 'green.400'}
                      boxSize={5}
                      flexShrink={0}
                      mt="1px"
                    />
                    <Flex direction="column" gap={1}>
                      <Text fontSize="sm" fontWeight="semibold">
                        {isOrphan ? importText.result.partialTitle : importText.result.successTitle}
                      </Text>
                      <Text fontSize="xs" color="fg.muted">
                        {result?.message}
                      </Text>
                    </Flex>
                  </Flex>

                  <Flex gap={3}>
                    <Box flex={1} p={3} borderRadius="lg" bg="bg.subtle" textAlign="center">
                      <Text fontSize="lg" fontWeight="bold" color="brandColorText" lineClamp="1">
                        {result?.code ?? '—'}
                      </Text>
                      <Text fontSize="xs" color="fg.muted">
                        {importText.result.codeLabel}
                      </Text>
                    </Box>
                    <Box flex={1} p={3} borderRadius="lg" bg="bg.subtle" textAlign="center">
                      <Text fontSize="2xl" fontWeight="bold" color="brandColorText">
                        {result?.totalAnimals ?? 0}
                      </Text>
                      <Text fontSize="xs" color="fg.muted">
                        {importText.result.totalAnimalsLabel}
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
                  <Button
                    title={importText.submitButton}
                    onClick={handleSubmit}
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
