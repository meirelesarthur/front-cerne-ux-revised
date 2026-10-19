// src/pages/Operacional/Reproducao/Acasalamento/sections/ProtocolRow.tsx
// -----------------------------------------------------------------------------
// Linha de `bm-subform-protocol` (BreedingMating, F-016, 97-Esteiras/001,
// TASK-BM-FE-05, contrato de tela §6.3.2, CLM-005/006/007/016). 9 campos na
// ordem do legado + botão de remover, mais o botão `+` de
// `Transferência/Lote` (`bm-endpoint-batches-to-transfer`, EP-BM-13).
//
// `useFieldArray` vive no PAI (`CreateOrUpdateAcasalamento.tsx`) — mirror
// `ProtocolSeasonItemsFieldArray.tsx`/`BatchesFieldArray.tsx`: `control` chega
// por prop, este componente só RENDERIZA a linha e decide a cascata/trava
// POR LINHA (C8/C9/C11 — C11 vive no `append()` do pai, via
// `buildDefaultProtocolAnimalRow` do mapper).
//
// Produtos = itens do protocolo da identificação corrente; Sêmen/Embrião =
// produtos do Touro/Sêmen selecionado (UT-000705, `_forms.blade.php:401-491`).
// -----------------------------------------------------------------------------

import { ElementType, useMemo } from 'react';

import { Box, Flex, Icon, SimpleGrid } from '@chakra-ui/react';
import { Control, Controller, UseFormSetValue, useWatch } from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';
import { IconButtonTable } from '@/components/IconButtonTable';

import { eligibleOptions } from '@/constants/breedingMating/options/eligible-options';
import { inkOptions } from '@/constants/breedingMating/options/ink-options';
import { columnsForm } from '@/constants/coluns-form';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type {
  AnimalOptionRef,
  BreedingMatingForm,
  BreedingMatingTypeValue,
  EntityOptionRef,
} from '@/@types/v2/BreedingMating';

function mapAnimalOptionRefToOption(ref: AnimalOptionRef): Option<string> {
  return { label: ref.code, value: ref.uuid };
}

function mapEntityOptionRefToOption(ref: EntityOptionRef): Option<string> {
  return { label: ref.label, value: ref.uuid };
}

function mergeSelectedOptions(
  options: Option<string>[],
  selected: Option<string>[]
): Option<string>[] {
  const missing = selected.filter(
    (option) => !options.some((candidate) => candidate.value === option.value)
  );
  return missing.length > 0 ? [...options, ...missing] : options;
}

function currentTimeHHmm(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

export interface ProtocolRowProps {
  index: number;
  control: Control<BreedingMatingForm>;
  setValue: UseFormSetValue<BreedingMatingForm>;
  languageGB: LanguageDate;
  disabled: boolean;
  breedingMatingType: BreedingMatingTypeValue | undefined;
  eligibleAnimals: AnimalOptionRef[];
  isLoadingAnimals?: boolean;
  bodyScoreOptions: EntityOptionRef[];
  providerOptions: EntityOptionRef[];
  batchOptions: Option<string>[];
  isLoadingBatchOptions?: boolean;
  protocolProductOptions: Option<string>[];
  seedProductOptions: Option<string>[];
  onRequestBatchTransfer: (animal: Option<string>) => void;
  onRemove: () => void;
}

export function ProtocolRow({
  index,
  control,
  setValue,
  languageGB,
  disabled,
  breedingMatingType,
  eligibleAnimals,
  isLoadingAnimals = false,
  bodyScoreOptions,
  providerOptions,
  batchOptions,
  isLoadingBatchOptions = false,
  protocolProductOptions,
  seedProductOptions,
  onRequestBatchTransfer,
  onRemove,
}: ProtocolRowProps) {
  const text = languageGB.breedingMatings.breedingMating.form.sections.protocol;

  const isIatf = breedingMatingType === 2;
  const isFiv = breedingMatingType === 3;
  const semenOrEmbryoLabel = isFiv ? text.embryo : text.semen;

  const animalOptions = eligibleAnimals.map(mapAnimalOptionRefToOption);
  const bodyScoreSelectOptions = bodyScoreOptions.map(mapEntityOptionRefToOption);
  const providerSelectOptions = providerOptions.map(mapEntityOptionRefToOption);

  const rowAnimal = useWatch({ control, name: `protocol_animals.${index}.animal` });
  const isEligible = useWatch({ control, name: `protocol_animals.${index}.eligible` }) ?? true;
  const rowProducts = useWatch({ control, name: `protocol_animals.${index}.products` });
  const rowSemen = useWatch({ control, name: `protocol_animals.${index}.semen_or_embryo` });

  const productSelectOptions = useMemo(
    () => mergeSelectedOptions(protocolProductOptions, rowProducts ?? []),
    [protocolProductOptions, rowProducts]
  );
  const semenSelectOptions = useMemo(
    () => mergeSelectedOptions(seedProductOptions, rowSemen ? [rowSemen] : []),
    [seedProductOptions, rowSemen]
  );

  // C9 — `Apta = Sim` trava `Transferência/Lote` (produtos obrigatórios);
  // `Apta = Não` trava `Produtos` (transferência liberada). Ao alternar,
  // limpa o lado que deixou de se aplicar — mirror CLM-007 (selecionar lote
  // dispensa produtos, e vice-versa).
  function handleEligibleChange(option: Option<boolean> | null) {
    const nextEligible = option?.value ?? true;
    setValue(`protocol_animals.${index}.eligible`, nextEligible, { shouldDirty: true });
    if (nextEligible) {
      setValue(`protocol_animals.${index}.batch`, null, { shouldDirty: true });
      setValue(`protocol_animals.${index}.products`, protocolProductOptions, { shouldDirty: true });
    } else {
      setValue(`protocol_animals.${index}.products`, [], { shouldDirty: true });
    }
  }

  function handleBatchChange(option: Option<string> | null) {
    setValue(`protocol_animals.${index}.batch`, option ?? null, { shouldDirty: true });
    // CLM-007 — selecionar o lote de transferência dispensa produtos.
    if (option) {
      setValue(`protocol_animals.${index}.products`, [], { shouldDirty: true });
    }
  }

  return (
    <Box p={4} border="1px solid" borderColor="border.subtle" borderRadius="lg">
      <SimpleGrid columns={columnsForm.default} gap={4}>
        <Controller
          name={`protocol_animals.${index}.animal`}
          control={control}
          render={({ field, fieldState: { error } }) => (
            <Select
              name={field.name}
              label={text.animal}
              options={animalOptions}
              value={field.value}
              loading={isLoadingAnimals}
              onChange={(option: Option<string> | null) => {
                field.onChange(option ?? null);
                // C8 — Horário recebe a hora atual ao selecionar o animal.
                if (option) {
                  setValue(`protocol_animals.${index}.time`, currentTimeHHmm(), {
                    shouldDirty: true,
                  });
                }
              }}
              error={error?.message}
              isDisabled={disabled}
            />
          )}
        />

        <Controller
          name={`protocol_animals.${index}.time`}
          control={control}
          render={({ field }) => (
            <Input
              type="time"
              label={text.time}
              name={field.name}
              value={field.value ?? ''}
              onChange={(e) => field.onChange(e.target.value || null)}
              disabled={disabled}
            />
          )}
        />

        <Controller
          name={`protocol_animals.${index}.body_score`}
          control={control}
          render={({ field }) => (
            <Select
              name={field.name}
              label={text.bodyScore}
              options={bodyScoreSelectOptions}
              value={field.value}
              onChange={(option: Option<string> | null) => field.onChange(option ?? null)}
              isDisabled={disabled}
            />
          )}
        />

        {/* Tintas — só existe/visível quando `type.value === 2` (IATF),
            nunca em FIV (CLM-016). */}
        {isIatf && (
          <Controller
            name={`protocol_animals.${index}.ink`}
            control={control}
            render={({ field }) => (
              <Select
                name={field.name}
                label={text.ink}
                options={inkOptions.options(languageGB)}
                value={field.value}
                onChange={(option: Option<string> | null) => field.onChange(option ?? null)}
                isDisabled={disabled}
              />
            )}
          />
        )}

        <Controller
          name={`protocol_animals.${index}.eligible`}
          control={control}
          render={({ field }) => (
            <Select
              name={field.name}
              label={text.eligible}
              options={eligibleOptions.options(languageGB)}
              value={eligibleOptions.getOption(field.value ?? true, languageGB)}
              onChange={handleEligibleChange}
              noClearable
              isDisabled={disabled}
            />
          )}
        />

        <Controller
          name={`protocol_animals.${index}.provider`}
          control={control}
          render={({ field }) => (
            <Select
              name={field.name}
              label={text.responsible}
              options={providerSelectOptions}
              value={field.value}
              onChange={(option: Option<string> | null) => field.onChange(option ?? null)}
              isDisabled={disabled}
            />
          )}
        />

        <Controller
          name={`protocol_animals.${index}.products`}
          control={control}
          render={({ field }) => (
            <Select
              name={field.name}
              label={text.products}
              options={productSelectOptions}
              value={field.value ?? []}
              onChange={(options: Option<string>[] | null) => field.onChange(options ?? [])}
              multiple
              isDisabled={disabled || !isEligible}
            />
          )}
        />

        <Controller
          name={`protocol_animals.${index}.semen_or_embryo`}
          control={control}
          render={({ field }) => (
            <Select
              name={field.name}
              label={semenOrEmbryoLabel}
              options={semenSelectOptions}
              value={field.value ?? null}
              onChange={(option: Option<string> | null) => field.onChange(option ?? null)}
              isDisabled={disabled}
            />
          )}
        />

        <Flex gap={2} align="flex-end">
          <Box flex="1">
            <Controller
              name={`protocol_animals.${index}.batch`}
              control={control}
              render={({ field }) => (
                <Select
                  name={field.name}
                  label={text.batchTransfer}
                  options={batchOptions}
                  value={field.value}
                  loading={isLoadingBatchOptions}
                  onChange={handleBatchChange}
                  isDisabled={disabled || isEligible}
                />
              )}
            />
          </Box>
          <IconButtonTable
            aria-label={text.batchTransfer}
            mensegerTooltip={text.batchTransfer}
            size="sm"
            variant="outline"
            disabled={disabled || !rowAnimal}
            onClick={() => rowAnimal && onRequestBatchTransfer(rowAnimal)}
          >
            <Icon as={FiPlus as ElementType} />
          </IconButtonTable>
        </Flex>
      </SimpleGrid>

      <Flex justify="flex-end" mt={3}>
        <IconButtonTable
          aria-label={text.removeRowButton}
          mensegerTooltip={text.removeRowButton}
          size="sm"
          color="red.500"
          variant="ghost"
          disabled={disabled}
          onClick={onRemove}
        >
          <Icon as={FiTrash2 as ElementType} />
        </IconButtonTable>
      </Flex>
    </Box>
  );
}

export default ProtocolRow;
