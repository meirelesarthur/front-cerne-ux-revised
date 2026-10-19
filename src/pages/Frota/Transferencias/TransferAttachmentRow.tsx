// src/pages/Frota/Transferencias/TransferAttachmentRow.tsx
// -----------------------------------------------------------------------------
// Linha de anexo do formulário de criação/recebimento — TASK-ETR-FE-03
// (reutilizada, sem alteração, pela tela de Recebimento — TASK-ETR-FE-04).
//
// `Input` (nome) + `FileUpload` (arquivo). `name` vazio é aceito — a Action
// grava `'Não Informado'` no servidor; NÃO reimplementar o fallback aqui
// (CL-30). `<FileUpload>` SEM `accept`/`maxSizeMb` — fidelidade a `CL-30`
// (o backend não valida mime/tamanho, DEB-05 — `DEC-FE-ETR-03`).
// -----------------------------------------------------------------------------

import { Flex, Icon, SimpleGrid } from '@chakra-ui/react';
import { Controller } from 'react-hook-form';
import { FiTrash2 } from 'react-icons/fi';

import { FileUpload } from '@/components/Form/FileUpload';
import { Input } from '@/components/Form/Input';
import { IconButtonTable } from '@/components/IconButtonTable';

import { useLanguage } from '@/hooks/useLanguage';

import { columnsForm } from '@/constants/coluns-form';

import type { EquipmentTransferForm } from '@/@types/v2/EquipmentTransfers';

import type { Control, FieldErrors } from 'react-hook-form';

export interface TransferAttachmentRowProps {
  index: number;
  control: Control<EquipmentTransferForm>;
  errors: FieldErrors<EquipmentTransferForm>;
  isDisabled: boolean;
  onRemove: () => void;
}

export function TransferAttachmentRow({
  index,
  control,
  errors,
  isDisabled,
  onRemove,
}: TransferAttachmentRowProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.equipmentTransfers.equipmentTransfer.form.attachments;

  const rowErrors = errors.attachments?.[index];

  return (
    <SimpleGrid columns={columnsForm.twoColumns} gap={4} alignItems="end">
      <Controller
        name={`attachments.${index}.name`}
        control={control}
        render={({ field }) => (
          <Input
            name={field.name}
            label={text.name}
            value={field.value ?? ''}
            onChange={(e) => field.onChange(e.target.value)}
            disabled={isDisabled}
          />
        )}
      />

      <Flex gap={2} align="end">
        <Controller
          name={`attachments.${index}.file`}
          control={control}
          render={({ field }) => (
            <FileUpload
              label={text.file}
              accept="*"
              file={field.value ?? null}
              onFileSelected={(file) => field.onChange(file)}
              onRemove={() => field.onChange(null)}
              disabled={isDisabled}
              error={rowErrors?.file?.message as string | undefined}
            />
          )}
        />

        <IconButtonTable
          aria-label={text.removeItem}
          mensegerTooltip={text.removeItem}
          size="sm"
          color="red.500"
          variant="ghost"
          disabled={isDisabled}
          onClick={onRemove}
        >
          <Icon as={FiTrash2} />
        </IconButtonTable>
      </Flex>
    </SimpleGrid>
  );
}
