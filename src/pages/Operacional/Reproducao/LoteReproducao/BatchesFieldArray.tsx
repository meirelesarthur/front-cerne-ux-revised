// src/pages/Operacional/Reproducao/LoteReproducao/BatchesFieldArray.tsx
// -----------------------------------------------------------------------------
// Subcadastro dinâmico "Lotes" do formulário de Lotes/Reprodução — Operacional
// / Reprodução (97-Esteiras/048, Tarefa 06, contrato de tela §5.1). Estrutural
// mirror DIRETO de `BullSeedSeason/AnimalsFieldArray.tsx` (`useFieldArray` vive
// no formulário PAI — `control`/`fields`/`append`/`remove` chegam por prop,
// `batchOptions` é 1 única chamada compartilhada resolvida no PAI e nunca
// refeita por linha).
//
// Este componente SÓ RENDERIZA linhas — a decisão de negócio (dedupe +
// `check-date` + cascata do cabeçalho, IG-01..IG-04) vive no formulário PAI
// (`CreateOrUpdateLoteReproducao.tsx`, hook dedicado) e chega aqui como o
// callback `onRowChange`, disparado no `onChange` de cada linha (mirror do
// papel de `RequisitionItemsEditor.tsx`/`otherRowsStockUuids`, mas com a
// decisão de bloqueio delegada ao pai, conforme contrato de tela §5.1).
//
// Filtro de dropdown (client-side, NUNCA nova chamada de rede por linha): as
// opções já usadas nas OUTRAS linhas são removidas da lista de CADA linha —
// mirror `RequisitionItemsEditor.tsx::otherRowsStockUuids`, computado aqui via
// `useWatch` (puramente de RENDERIZAÇÃO; a decisão de bloquear/limpar/mostrar
// erro quando o usuário efetivamente seleciona uma duplicata é do pai).
//
// `.min(1)` (achado #3 do backend, schema Yup da Tarefa 04) — erro do ARRAY
// inteiro exibido como texto abaixo do título/antes das linhas quando
// `fields.length === 0`, mirror EXATO `RequisitionItemsEditor.tsx::arrayError`
// (nunca por linha) — diferente de `AnimalsFieldArray`/`ProductsFieldArray`
// (`GAP-BSS-06`, sem `.min(1)`, NÃO É PRECEDENTE aqui).
// -----------------------------------------------------------------------------

import { ElementType } from 'react';

import { Box, Flex, Icon, Text } from '@chakra-ui/react';
import {
  Control,
  Controller,
  FieldArrayWithId,
  FieldErrors,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
  useWatch,
} from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { Select } from '@/components/Form/Select';
import { IconButtonTable } from '@/components/IconButtonTable';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { BreedingBatchBatchFieldValue, BreedingBatchForm } from '@/@types/v2/BreedingBatch';

export interface BatchesFieldValues {
  batches: BreedingBatchBatchFieldValue[];
}

export interface BatchesFieldArrayProps {
  /** `control` do `useForm` do formulário PAI (`BreedingBatchForm`). */
  control: Control<BreedingBatchForm>;
  /** `fields` do `useFieldArray({ control, name: 'batches' })` do PAI. */
  fields: FieldArrayWithId<BatchesFieldValues, 'batches', 'id'>[];
  /** `append` do mesmo `useFieldArray` do PAI. */
  append: UseFieldArrayAppend<BatchesFieldValues, 'batches'>;
  /** `remove` do mesmo `useFieldArray` do PAI. */
  remove: UseFieldArrayRemove;
  /** `formState.errors` do formulário PAI — só para o erro do ARRAY (`.min(1)`). */
  errors: FieldErrors<BreedingBatchForm>;
  /** Opções de `batch-options` — 1 única chamada compartilhada (resolvida no PAI). */
  batchOptions: Option<string>[];
  batchOptionsLoading: boolean;
  /**
   * Disparado no `onChange` de CADA linha — decide dedupe/`check-date`/
   * cascata no formulário PAI (contrato de tela §5.1). Este componente NUNCA
   * decide bloqueio/limpeza/erro por conta própria.
   */
  onRowChange: (index: number, option: Option<string> | null) => void;
  languageGB: LanguageDate;
  disabled?: boolean;
}

export function BatchesFieldArray({
  control,
  fields,
  append,
  remove,
  errors,
  batchOptions,
  batchOptionsLoading,
  onRowChange,
  languageGB,
  disabled = false,
}: BatchesFieldArrayProps) {
  const text = languageGB.breedingBatches.breedingBatch.form;

  const genericControl = control as unknown as Control<BatchesFieldValues>;

  // Snapshot reativo das linhas — usado SÓ para o filtro de dropdown
  // (renderização), nunca para decisão de bloqueio (isso é do pai).
  const watchedBatches = useWatch({ control: genericControl, name: 'batches' }) ?? [];

  // Erro do ARRAY inteiro (`.min(1)`, achado #3) — mirror
  // `RequisitionItemsEditor.tsx::arrayError`.
  const arrayError = (errors as any)?.batches?.message as string | undefined;

  function handleAdd() {
    append({ batch: null });
  }

  return (
    <Box bg="bg.muted" border="1px solid" borderColor="border.subtle" borderRadius="lg" p={4}>
      <Text fontSize="sm" fontWeight="semibold" mb={4}>
        {text.fields.batches}
      </Text>

      {arrayError && fields.length > 0 && (
        <Box mb={4}>
          <Text fontSize="sm" color="fg.error">
            {arrayError}
          </Text>
        </Box>
      )}

      {fields.length === 0 ? (
        <Box py={2}>
          <Text fontSize="sm" color={arrayError ? 'fg.error' : 'fg.muted'}>
            {arrayError || text.fields.batches}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={3} mb={4}>
          {fields.map((field, index) => {
            // Filtro client-side (contrato §5.1 item 3): remove da lista
            // DESTA linha as opções já escolhidas nas OUTRAS — nunca refaz a
            // chamada de rede de `batch-options`.
            const otherRowsBatchUuids = watchedBatches
              .filter((_, otherIndex) => otherIndex !== index)
              .map((row) => row?.batch?.value)
              .filter((value): value is string => !!value);

            const rowOptions = batchOptions.filter(
              (option) => !otherRowsBatchUuids.includes(option.value)
            );

            return (
              <Flex key={field.id} gap={3} align="flex-start">
                <Box flex="1" minW="220px">
                  <Controller
                    name={`batches.${index}.batch`}
                    control={genericControl}
                    render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                      <Select
                        name={name}
                        label={text.fields.batches}
                        options={rowOptions}
                        value={value ?? null}
                        onChange={(option: Option<string> | null) => {
                          onChange(option ?? null);
                          onRowChange(index, option ?? null);
                        }}
                        error={error?.message}
                        loading={batchOptionsLoading}
                        isRequired
                        isDisabled={disabled}
                      />
                    )}
                  />
                </Box>

                <Flex direction="column" gap="1.5">
                  <Flex alignItems="center" fontSize="14px" visibility="hidden">
                    {text.fields.removeBatchButton}
                  </Flex>
                  <IconButtonTable
                    type="button"
                    aria-label={text.fields.removeBatchButton}
                    mensegerTooltip={text.fields.removeBatchButton}
                    size="sm"
                    color="red.500"
                    variant="ghost"
                    disabled={disabled}
                    onClick={() => remove(index)}
                  >
                    <Icon as={FiTrash2} />
                  </IconButtonTable>
                </Flex>
              </Flex>
            );
          })}
        </Flex>
      )}

      <Button
        type="button"
        title={text.fields.addBatchButton}
        icon={FiPlus as ElementType}
        variant="outline"
        size="sm"
        onClick={handleAdd}
        disabled={disabled}
      />
    </Box>
  );
}

export default BatchesFieldArray;
