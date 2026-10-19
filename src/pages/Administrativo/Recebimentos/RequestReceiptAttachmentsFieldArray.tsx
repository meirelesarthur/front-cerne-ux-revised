// src/pages/Administrativo/Recebimentos/RequestReceiptAttachmentsFieldArray.tsx
// -----------------------------------------------------------------------------
// Subregistro "Anexos" da tela Confirmar Recebimento (RequestReceipt —
// Administrativo / Suprimentos, esteira 97-Esteiras/040, TASK-RCB-FE-02).
// `useFieldArray` DINÂMICO de `{ name(Input), file(FileUpload) }` —
// obrigatórios quando `purchase_status==1` (Total, IG-01/CLM-15; validação
// real fica no schema, `.test()` no nível do array — este componente só
// espelha o estado visual "obrigatório" no label/hint).
//
// Guardas de UX (add/remove, §5.3):
//   - Não adiciona nova linha sem a linha ATUAL preenchida (`name`+`file`).
//   - Não remove a ÚLTIMA linha (sempre resta ao menos 1, mesmo vazia).
// `watch` é recebido do formulário PAI (mirror `IncomeInstallmentsTab.tsx`)
// — nunca acessa API interna do `control` (`_formValues`).
// -----------------------------------------------------------------------------

import { Box, Flex, Icon, Text } from '@chakra-ui/react';
import { Control, Controller, useFieldArray, UseFormWatch } from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { FileUpload } from '@/components/Form/FileUpload';
import { Input } from '@/components/Form/Input';
import { IconButtonTable } from '@/components/IconButtonTable';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import type { ConfirmReceiptForm } from '@/@types/v2/RequestReceipts';

export interface RequestReceiptAttachmentsFieldArrayProps {
  control: Control<ConfirmReceiptForm>;
  watch: UseFormWatch<ConfirmReceiptForm>;
  isDisabled: boolean;
  /** `purchase_status.value===1` (Total) — anexos passam a ser obrigatórios
   *  (IG-01), o componente só reflete essa obrigatoriedade no rótulo. */
  isRequired: boolean;
}

export function RequestReceiptAttachmentsFieldArray({
  control,
  watch,
  isDisabled,
  isRequired,
}: RequestReceiptAttachmentsFieldArrayProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.requestReceipts.requestReceipt.confirm.attachments;

  const { fields, append, remove } = useFieldArray({ control, name: 'attachments' });
  const watchedRows = watch('attachments') ?? [];

  function handleAppend() {
    const lastRow = watchedRows[watchedRows.length - 1];
    if (lastRow && !lastRow.name?.trim() && !lastRow.file) {
      toaster.create({ type: 'warning', title: text.fillBeforeAddError });
      return;
    }
    append({ name: '', file: null });
  }

  function handleRemove(index: number) {
    if (fields.length <= 1) {
      toaster.create({ type: 'warning', title: text.removeLastRowError });
      return;
    }
    remove(index);
  }

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={4}>
        <Text fontWeight="bold" color="brandColorText">
          {text.title}
          {isRequired ? ' *' : ''}
        </Text>
      </Flex>

      {fields.length === 0 ? (
        <Box py={2} mb={4}>
          <Text fontSize="sm" color="fg.muted">
            {text.emptyLabel}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={4} mb={4}>
          {fields.map((field, index) => (
            <Flex key={field.id} gap={3} align="flex-start" wrap="wrap">
              <Box flex="1" minW="220px">
                <Controller
                  name={`attachments.${index}.name`}
                  control={control}
                  render={({ field: rowField }) => (
                    <Input
                      name={rowField.name}
                      label={text.fields.name}
                      value={rowField.value ?? ''}
                      onChange={rowField.onChange}
                      disabled={isDisabled}
                    />
                  )}
                />
              </Box>

              <Box flex="1" minW="260px">
                <Controller
                  name={`attachments.${index}.file`}
                  control={control}
                  render={({ field: rowField }) => (
                    <FileUpload
                      label={text.fields.file}
                      file={rowField.value ?? null}
                      onFileSelected={(file) => rowField.onChange(file)}
                      onRemove={() => rowField.onChange(null)}
                      disabled={isDisabled}
                    />
                  )}
                />
              </Box>

              <Flex direction="column" gap="1.5" pt={6}>
                <IconButtonTable
                  aria-label={text.removeButton}
                  mensegerTooltip={text.removeButton}
                  size="sm"
                  color="red.500"
                  variant="ghost"
                  disabled={isDisabled}
                  onClick={() => handleRemove(index)}
                >
                  <Icon as={FiTrash2} />
                </IconButtonTable>
              </Flex>
            </Flex>
          ))}
        </Flex>
      )}

      <Button
        title={text.addButton}
        icon={FiPlus as any}
        variant="outline"
        size="sm"
        onClick={handleAppend}
        disabled={isDisabled}
      />
    </Box>
  );
}
