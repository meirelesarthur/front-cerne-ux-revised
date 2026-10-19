// src/pages/Operacional/FeedlotMapDashboard/dialogs/FeedlotCorralBatchRow.tsx
// Linha repetível de lote do diálogo "Gerenciar Lotes" — TASK-FE-042-209,
// adaptação estrutural de `ProcessingSanitaryItemRow.tsx` (mesmo padrão
// `useFieldArray`, trocando o conteúdo da linha para 1 único
// `SelectAsyncPaginate`-like de lote). Mirror `ModalLotes.js`
// (`handleRemoveBatch`/linha "Lote" + botão remover).

import { Flex, IconButton } from '@chakra-ui/react';
import { Trash2 } from 'lucide-react';
import { Controller, type Control } from 'react-hook-form';

import { Select } from '@/components/Form/Select';

import type { SyncBatchesFormValues } from '@/validations/schemas/FeedlotMap/syncBatches-schema';

import type { Option } from '@/@types/option';

export interface FeedlotCorralBatchRowProps {
  control: Control<SyncBatchesFormValues>;
  index: number;
  options: Option<string>[];
  label: string;
  errorText?: string;
  onRemove: () => void;
  removeLabel: string;
}

export function FeedlotCorralBatchRow({
  control,
  index,
  options,
  label,
  errorText,
  onRemove,
  removeLabel,
}: FeedlotCorralBatchRowProps) {
  return (
    <Flex align="flex-end" gap={2}>
      <IconButton
        aria-label={removeLabel}
        size="sm"
        variant="outline"
        colorPalette="red"
        onClick={onRemove}
      >
        <Trash2 />
      </IconButton>
      <Flex flex="1">
        <Controller
          name={`batches.${index}.batch_uuid`}
          control={control}
          render={({ field: { name, value, onChange } }) => (
            <Select
              label={label}
              name={name}
              value={value}
              onChange={onChange}
              options={options}
              error={errorText}
              isRequired
            />
          )}
        />
      </Flex>
    </Flex>
  );
}
