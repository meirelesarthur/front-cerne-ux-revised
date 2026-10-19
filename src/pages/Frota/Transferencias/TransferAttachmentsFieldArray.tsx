// src/pages/Frota/Transferencias/TransferAttachmentsFieldArray.tsx
// -----------------------------------------------------------------------------
// `useFieldArray` de `attachments` do formulário de criação/recebimento —
// TASK-ETR-FE-03 (reutilizada, sem alteração, pela tela de Recebimento —
// TASK-ETR-FE-04).
//
// Começa com 0 LINHAS — anexo é opcional (`attachments` é `sometimes` na
// API). SEM mínimo (`CL-28` NAO_APLICAVEL — reproduzir o mínimo de 1 linha
// do legado forçaria uma linha vazia permanente, e `attachments.*.file` é
// `required` na API: geraria 422 em toda criação sem anexo — fid-g3f §3.3,
// `DEC-FE-ETR-03`). Linhas sem `file` são descartadas no service ANTES do
// `FormData` (cinto e suspensório).
// -----------------------------------------------------------------------------

import type { ElementType } from 'react';

import { Box, Flex, Text } from '@chakra-ui/react';
import { useFieldArray } from 'react-hook-form';
import { FiPlus } from 'react-icons/fi';

import { Button } from '@/components/Button';

import { useLanguage } from '@/hooks/useLanguage';

import type { EquipmentTransferForm } from '@/@types/v2/EquipmentTransfers';

import { TransferAttachmentRow } from './TransferAttachmentRow';

import type { Control, FieldErrors } from 'react-hook-form';

export interface TransferAttachmentsFieldArrayProps {
  control: Control<EquipmentTransferForm>;
  errors: FieldErrors<EquipmentTransferForm>;
  isDisabled: boolean;
}

export function TransferAttachmentsFieldArray({
  control,
  errors,
  isDisabled,
}: TransferAttachmentsFieldArrayProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.equipmentTransfers.equipmentTransfer.form.attachments;

  const { fields, append, remove } = useFieldArray({ control, name: 'attachments' });

  function handleAdd() {
    append({ name: '', file: null });
  }

  return (
    <Box pt={4}>
      <Text fontSize="md" fontWeight="semibold" color="fg.default" mb={3}>
        {text.sectionTitle}
      </Text>

      {fields.length > 0 && (
        <Flex direction="column" gap={4} mb={4}>
          {fields.map((field, index) => (
            <TransferAttachmentRow
              key={field.id}
              index={index}
              control={control}
              errors={errors}
              isDisabled={isDisabled}
              onRemove={() => remove(index)}
            />
          ))}
        </Flex>
      )}

      <Button
        title={text.addItem}
        icon={FiPlus as ElementType}
        variant="outline"
        size="sm"
        onClick={handleAdd}
        disabled={isDisabled}
      />
    </Box>
  );
}
