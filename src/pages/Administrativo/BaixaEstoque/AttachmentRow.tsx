// src/pages/Administrativo/BaixaEstoque/AttachmentRow.tsx
// -----------------------------------------------------------------------------
// Linha do bloco de anexos dinâmico (`useFieldArray name="attachments"`) do
// form de criação de Baixa de Estoque (TASK-FE-3004, contrato de tela §3.3).
// Mirror `RequestReceiptAttachmentsFieldArray.tsx` (linha própria com
// `Input` + `FileUpload`, `attachments.*.file` max 10MB) — extraída em
// componente PRÓPRIO (`ItemRow.tsx`/`AttachmentRow.tsx`, arquivos separados,
// contrato de tela §"Arquivos afetados").
//
// `name` vazio + `file` válido não bloqueia esta linha — o default "Não
// Informado" (FLD-020) é aplicado no MAPPER (`stock-writeoff-form-mapper.ts`),
// não aqui (o campo de exibição fica vazio até o usuário digitar, sem
// hidratar um valor "fantasma" que o usuário precisaria apagar).
// -----------------------------------------------------------------------------

import { Box, Flex, Icon } from '@chakra-ui/react';
import { Control, Controller } from 'react-hook-form';
import { FiTrash2 } from 'react-icons/fi';

import { FileUpload } from '@/components/Form/FileUpload';
import { Input } from '@/components/Form/Input';
import { IconButtonTable } from '@/components/IconButtonTable';

import { useLanguage } from '@/hooks/useLanguage';

import type { StockWriteoffForm } from '@/@types/v2/StockWriteoffs';

export interface AttachmentRowProps {
  control: Control<StockWriteoffForm>;
  index: number;
  isDisabled: boolean;
  onRemove: () => void;
}

export function AttachmentRow({ control, index, isDisabled, onRemove }: AttachmentRowProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.stockWriteoffs.stockWriteoff.form.attachments;

  return (
    <Flex gap={3} align="flex-start" wrap="wrap">
      <Box flex="1" minW="220px">
        <Controller
          name={`attachments.${index}.name`}
          control={control}
          render={({ field }) => (
            <Input
              name={field.name}
              label={text.fields.name}
              placeholder={text.fields.namePlaceholder}
              value={field.value ?? ''}
              onChange={field.onChange}
              disabled={isDisabled}
            />
          )}
        />
      </Box>

      <Box flex="1" minW="260px">
        <Controller
          name={`attachments.${index}.file`}
          control={control}
          render={({ field, fieldState }) => (
            <FileUpload
              label={text.fields.file}
              accept="*"
              file={field.value ?? null}
              onFileSelected={(file) => field.onChange(file)}
              onRemove={() => field.onChange(null)}
              error={fieldState.error?.message}
              disabled={isDisabled}
              dropzoneTitle={text.dropzoneTitle}
              dropzoneDraggingTitle={text.dropzoneDraggingTitle}
              changeLabel={text.changeLabel}
              removeLabel={text.removeLabel}
              errorTypeMessage={text.errorTypeMessage}
              errorSizeMessage={text.errorSizeMessage}
            />
          )}
        />
      </Box>

      <Flex direction="column" gap="1.5" pt={6}>
        <IconButtonTable
          type="button"
          aria-label={text.removeButton}
          mensegerTooltip={text.removeButton}
          size="sm"
          color="red.500"
          variant="ghost"
          disabled={isDisabled}
          onClick={onRemove}
        >
          <Icon as={FiTrash2} />
        </IconButtonTable>
      </Flex>
    </Flex>
  );
}

export default AttachmentRow;
