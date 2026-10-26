// src/pages/Operacional/CompraAnimais/MovementPurchaseXmlImport.tsx
// -----------------------------------------------------------------------------
// Diálogo de importação de XML de NFe de Compra — TASK-CP-08 (contrato
// §4.5/§5, FLOW-XML-IMPORT). Só disponível em modo CRIAÇÃO
// (`CreateOrUpdateMovementPurchase.tsx`).
//
// Diferente do fluxo inline de `MovementSale` (que aplica o draft direto ao
// `reset()` do form assim que o upload termina, sem passo de preview), esta
// Tarefa pede EXPLICITAMENTE um passo de preview antes de aplicar
// ("upload de XML → preview do draft → 'Aplicar' popula o form") — por isso
// este componente é um diálogo PRÓPRIO com 2 estados (preview → aplicar),
// `useMutation` DIRETO (mirror `useIssueMovementSaleNfe`/
// `MovementSaleEmitNfeDialog.tsx`: ação não-persistente, sem toast de
// sucesso formal, sem queryKey a invalidar — nada muda no servidor até o
// Salvar final da compra).
//
// Achado confirmado contra `ImportMovementPurchaseXmlAction`/
// `MovementPurchaseXmlDraftData` reais (ver docblock de
// `movement-purchase-service.ts::importMovementPurchaseXml`) — o draft NÃO
// inclui os 15 campos fiscais nem resolve `category_uuid` (sempre `null`).
// O "Aplicar" popula cabeçalho (`dt_sale`/`chave`/`serie`/`number`/`note`/
// `provider_uuid` quando casado) + itens (`quantity`/`value_unit`/`amount`/
// `item_description`, mirror `description`→`item_description`), SEM tentar
// abrir nenhum sub-bloco fiscal (não existe — decisão de escopo já tomada em
// `CreateOrUpdateMovementPurchase.tsx`/`MovementPurchaseItemRow.tsx`).
//
// 088 D4-FE-T1 — o preview também mostra as duplicatas (nº/vencimento/valor), os
// defaults do título e os avisos não bloqueantes (`warnings[]`, texto por `code`);
// o "Aplicar" leva o financeiro ao form (`movementPurchaseXmlDraft.ts`). Erros 422
// do upload (mensagens literais do legado vindas da API) vão ao toast de erro.
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Badge, Box, Flex, Icon, SimpleGrid, Skeleton, Text, VStack } from '@chakra-ui/react';
import { useMutation } from '@tanstack/react-query';
import { FiAlertTriangle, FiFileText } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { CustomDialog } from '@/components/CustomDialog';
import { FileUpload } from '@/components/Form/FileUpload';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';
import formatDate from '@/utils/formatDate';

import { importMovementPurchaseXml } from '@/services/v2/MovementPurchases/movement-purchase-service';
import type { MovementPurchaseXmlDraft } from '@/services/v2/MovementPurchases/movement-purchase-service';

import { resolveXmlWarningMessage } from './movementPurchaseXmlDraft';

const XML_FILE_ACCEPT = '.xml';

function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export interface MovementPurchaseXmlImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** Chamado SÓ quando o dono clica "Aplicar" — nada é aplicado ao form
   *  automaticamente após o upload (passo de preview explícito). */
  onApply: (draft: MovementPurchaseXmlDraft) => void;
}

export function MovementPurchaseXmlImportDialog({
  isOpen,
  onClose,
  onApply,
}: MovementPurchaseXmlImportDialogProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.movementPurchases.movementPurchase.form.xmlImport;
  const financialHeaderText = languageGB.movementPurchases.movementPurchase.form.financial.header;
  const classificationLabels = {
    N: financialHeaderText.classificationNone,
    C: financialHeaderText.classificationCapex,
    O: financialHeaderText.classificationOpex,
  } as const;

  const [file, setFile] = useState<File | null>(null);
  const [draft, setDraft] = useState<MovementPurchaseXmlDraft | null>(null);

  const importMutation = useMutation({
    mutationFn: (selected: File) => importMovementPurchaseXml(selected),
    onSuccess: (response) => {
      setDraft(response.data);
    },
    onError: (error) => {
      setFile(null);
      toaster.error({
        title: text.title,
        description: extractApiErrorMessage(error) ?? text.errorToast,
        duration: 7000,
      });
    },
  });

  function handleFileSelected(selected: File | null) {
    setFile(selected);
    setDraft(null);
    if (selected) importMutation.mutate(selected);
  }

  function handleClose() {
    setFile(null);
    setDraft(null);
    importMutation.reset();
    onClose();
  }

  function handleApply() {
    if (!draft) return;
    onApply(draft);
    toaster.success({ title: text.title, description: text.successToast });
    if (!draft.provider.matched) {
      toaster.create({
        type: 'warning',
        title: text.title,
        description: text.providerNotMatchedToast,
      });
    }
    handleClose();
  }

  const isImporting = importMutation.isPending;

  return (
    <CustomDialog
      isOpen={isOpen}
      onClose={handleClose}
      title={text.title}
      size="lg"
      scrollableBody
      footer={
        <Flex gap={3}>
          <Button title={languageGB.defaltStrings.cancel} variant="secondary" onClick={handleClose} />
          <Button title={text.applyButton} onClick={handleApply} disabled={!draft || isImporting} />
        </Flex>
      }
    >
      <VStack align="stretch" gap={4}>
        <Text fontSize="sm" color="fg.muted">
          {text.hint}
        </Text>

        <FileUpload
          label={text.fileLabel}
          file={file}
          onFileSelected={handleFileSelected}
          onRemove={() => handleFileSelected(null)}
          accept={XML_FILE_ACCEPT}
          disabled={isImporting}
          dropzoneTitle={text.dropzoneTitle}
          dropzoneDraggingTitle={text.dropzoneDraggingTitle}
          changeLabel={text.changeLabel}
          removeLabel={text.removeFileLabel}
          errorTypeMessage={text.errorTypeMessage}
          errorSizeMessage={text.errorSizeMessage}
        />

        {isImporting && (
          <VStack align="stretch" gap={2}>
            <Skeleton height="20px" />
            <Skeleton height="20px" />
            <Skeleton height="20px" />
          </VStack>
        )}

        {draft && !isImporting && (
          <Box p={4} border="1px solid" borderColor="border.subtle" borderRadius="lg">
            <Flex justify="space-between" align="center" mb={3} gap={3} wrap="wrap">
              <Text fontSize="sm" fontWeight="semibold">
                {text.previewTitle}
              </Text>
              <Badge colorPalette={draft.provider.matched ? 'green' : 'orange'} variant="subtle">
                {draft.provider.matched ? text.providerMatched : text.providerNotMatched}
              </Badge>
            </Flex>

            <SimpleGrid columns={{ base: 1, sm: 2 }} gap={3} mb={3}>
              <XmlPreviewField label={text.fields.provider} value={draft.provider.name || '—'} />
              <XmlPreviewField label={text.fields.dtSale} value={formatDate(draft.dt_sale)} />
              <XmlPreviewField label={text.fields.chave} value={draft.chave || '—'} />
              <XmlPreviewField label={text.fields.number} value={draft.number || '—'} />
              <XmlPreviewField label={text.fields.serie} value={draft.serie || '—'} />
              <XmlPreviewField label={text.fields.total} value={formatCurrencyBRL(draft.total)} />
            </SimpleGrid>

            <Text fontSize="xs" color="fg.muted" mb={2}>
              {text.itemsCountTemplate.replace('{count}', String(draft.items.length))}
            </Text>

            {draft.installments.length > 0 && (
              <Box mb={3} data-testid="xml-preview-installments">
                <Text fontSize="xs" fontWeight="semibold" color="fg.muted" mb={1}>
                  {text.installmentsTitle}
                </Text>
                {draft.installments.map((row, index) => (
                  <Flex key={`${row.due_date}-${index}`} gap={4} fontSize="sm" wrap="wrap">
                    <Text minW="12">
                      {text.installmentNumber} {row.number ?? String(index + 1).padStart(3, '0')}
                    </Text>
                    <Text>
                      {text.installmentDueDate}: {formatDate(row.due_date)}
                    </Text>
                    <Text>
                      {text.installmentAmount}: {formatCurrencyBRL(row.amount)}
                    </Text>
                  </Flex>
                ))}
              </Box>
            )}

            {draft.financial_defaults && (
              <Box mb={3} data-testid="xml-preview-defaults">
                <Text fontSize="xs" fontWeight="semibold" color="fg.muted" mb={1}>
                  {text.defaultsTitle}
                </Text>
                <SimpleGrid columns={{ base: 1, sm: 2 }} gap={2}>
                  <XmlPreviewField
                    label={financialHeaderText.number}
                    value={draft.financial_defaults.number || '—'}
                  />
                  <XmlPreviewField
                    label={financialHeaderText.typeTitle}
                    value={draft.financial_defaults.type_title?.description ?? '—'}
                  />
                  <XmlPreviewField
                    label={financialHeaderText.fiscalDocument}
                    value={
                      draft.financial_defaults.fiscal_document
                        ? languageGB.defaltStrings.yes
                        : languageGB.defaltStrings.no
                    }
                  />
                  <XmlPreviewField
                    label={financialHeaderText.classification}
                    value={classificationLabels[draft.financial_defaults.classification]}
                  />
                </SimpleGrid>
              </Box>
            )}

            {(draft.warnings?.length ?? 0) > 0 && (
              <Flex
                direction="column"
                gap={1}
                p={3}
                mb={3}
                bg="feedBack.info"
                borderRadius="lg"
                role="status"
                data-testid="xml-preview-warnings"
              >
                <Text fontSize="xs" fontWeight="semibold" color="feedBack.infoMain">
                  {text.warningsTitle}
                </Text>
                {draft.warnings!.map((warning) => (
                  <Text key={warning.code} fontSize="xs" color="feedBack.infoMain">
                    {resolveXmlWarningMessage(warning, text.warnings)}
                  </Text>
                ))}
              </Flex>
            )}

            {!draft.provider.matched && (
              <Flex
                align="flex-start"
                gap={2}
                p={3}
                bg="feedBack.warn"
                borderRadius="lg"
                role="alert"
              >
                <Icon as={FiAlertTriangle} color="feedBack.warnMain" mt={0.5} flexShrink={0} />
                <Text fontSize="xs" color="feedBack.warnMain">
                  {text.providerNotMatchedMessage}
                </Text>
              </Flex>
            )}
          </Box>
        )}

        {!draft && !isImporting && !file && (
          <Flex align="center" gap={2} color="fg.muted">
            <Icon as={FiFileText} />
            <Text fontSize="sm">{text.emptyHint}</Text>
          </Flex>
        )}
      </VStack>
    </CustomDialog>
  );
}

function XmlPreviewField({ label, value }: { label: string; value: string }) {
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
      <Text fontSize="sm">{value}</Text>
    </Box>
  );
}
