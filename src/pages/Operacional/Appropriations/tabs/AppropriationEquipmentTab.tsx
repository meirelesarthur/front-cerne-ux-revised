// src/pages/Operacional/Appropriations/tabs/AppropriationEquipmentTab.tsx
// -----------------------------------------------------------------------------
// Aba "Máq/Implementos" (equipamentos) — TASK-FE-2708. `useFieldArray` de
// `equipment_items`, mirror `AppropriationLaborTab.tsx`/
// `EquipamentoRateioCentroCustoTab.tsx`.
//
// Contrato real (`AppropriationEquipmentItemData`, extensão GAP-BE-602/
// TASK-BE-1002, execução 034): `equipment_uuid`, `start_hour_meter`
// (horímetro/km inicial, editável), `note`, `measurement_uuid` (Un. Medida,
// opcional, select LIVRE por linha — não herdado do cadastro do
// Equipamento, mirror `stock_items.measurement_uuid`) e `start_hour_photo`
// (Imagem Horímetro Inicial, upload real, 1 por linha — **diferente** de
// Ocorrências: `null`/omitido aqui APAGA a foto no update, fidelidade
// deliberada ao legado; o Front sempre reenvia a foto existente quando o
// usuário não a troca, ver `CreateOrUpdateAppropriation.tsx`). OBRIGATÓRIA
// por linha (AP-38, TASK-FE-712) — regra é presença (`existingUrl` OU
// `file`), validada em `appropriation-schema.ts`.
//
// TASK-FE-733 (execução 034/035, GAP-BE-655) — máscara da Finalização
// (`FinishAppropriation.tsx`, TASK-FE-737): 2 props novas, opcionais/default
// `false` (mirror EXATO `AppropriationLaborTab.tsx`/TASK-FE-732):
// `lockIdentityFields`/`hideRowActions`. Quando `lockIdentityFields=true`:
//   - `equipment_uuid`/`measurement_uuid` (identidade, `_card_equipment_edit.
//     blade.php:5,8` `->readonly()`) viram `InputReadOnly`.
//   - `start_hour_meter` vira `InputReadOnly` (Horímetro Inicial travado).
//   - `start_hour_photo` (Foto Inicial) vira preview travado — MESMO
//     componente `ImageUpload`, com `disabled` (decisão do Executor
//     registrada no rodapé da Tarefa: reaproveitar o componente com
//     `disabled=true` em vez de um `Image` estático novo — evita duplicar a
//     lógica de preview/placeholder do componente genérico).
//   - `end_hour_meter` MIGROU de `FinishAppropriation.tsx` (TASK-FE-716) para
//     DENTRO deste tab: deixa de ser o `InputReadOnly` condicional
//     (`hasCalculatedData`) e vira `Controller`+`NumberInput` REAL,
//     obrigatório, validado por `finishAppropriationSchemaResolver`
//     (`≥ start_hour_meter`, TASK-FE-730) — SEM `rules` inline do RHF.
//   - `end_hour_photo` (campo NOVO, TASK-FE-730) — `Controller`+`ImageUpload`,
//     MESMO componente da Foto Inicial, OPCIONAL (decisão do dono,
//     2026-08-11 — sem `.test()` de presença), só renderiza quando
//     `lockIdentityFields=true`.
//   - `note` continua editável SEMPRE (fora da máscara, mirror legado).
//   - Os 2 `ImageUpload` (`start_hour_photo`/`end_hour_photo`) passam
//     `maxSizeMb={10}` explícito (decisão do dono — backend aceita até
//     10 MB; default do componente é 2 MB).
// Fora do modo Finalização (`lockIdentityFields=false`, default),
// COMPORTAMENTO 100% IDÊNTICO ao anterior — incluindo o bloco
// `hasCalculatedData` de `end_hour_meter`/`amount` (readonly informativo,
// só quando o registro editado já tem valor real).
// -----------------------------------------------------------------------------

import type { ElementType } from 'react';

import { Box, Flex, Icon, SimpleGrid, Text } from '@chakra-ui/react';
import { Controller, useFieldArray } from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { ImageUpload } from '@/components/Form/ImageUpload';
import { Input } from '@/components/Form/Input';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { NumberInput } from '@/components/Form/NumberInput';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { IconButtonTable } from '@/components/IconButtonTable';

import { useLanguage } from '@/hooks/useLanguage';

import { columnsForm } from '@/constants/coluns-form';

import { listEquipmentCatalogOptions } from '@/services/v2/Equipments/equipment-service';
import { listMeasurementOptions } from '@/services/v2/Measurements/measurement-service';

import type { AppropriationForm } from '@/@types/v2/Appropriations';
import type { EquipmentOption } from '@/@types/v2/Equipments';
import type { MeasurementOption } from '@/@types/v2/Measurements';

import type { Control, FieldErrors, UseFormWatch } from 'react-hook-form';

// GAP-BE-654/TASK-FE-733 (decisão do dono, 2026-08-11) — teto de upload
// alinhado ao backend (10 MB); default do `ImageUpload` é 2 MB.
const EQUIPMENT_PHOTO_MAX_SIZE_MB = 10;

export interface AppropriationEquipmentTabProps {
  control: Control<AppropriationForm>;
  errors: FieldErrors<AppropriationForm>;
  watch: UseFormWatch<AppropriationForm>;
  isLoading: boolean;
  canSave: boolean;
  // TASK-FE-610/AP-09 — banner "≥1 item" agora lido de estado do componente
  // pai (setado só no onSubmit), não mais de `errors.equipment_items?.message`.
  itemsError: string | null;
  /** TASK-FE-733 (GAP-BE-655) — `true` só na Finalização: Equipamento/Un.
   *  Medida/Horímetro Inicial/Foto Inicial travam; Horímetro Final vira
   *  campo real obrigatório; Foto Final (opcional) passa a existir. Default
   *  `false`/`undefined` preserva `CreateOrUpdateAppropriation.tsx` 100%
   *  inalterado. */
  lockIdentityFields?: boolean;
  /** TASK-FE-733 — `true` esconde "+ Adicionar Item" e a lixeira (mirror
   *  `AppropriationLaborTab.tsx`/TASK-FE-732). */
  hideRowActions?: boolean;
}

export function AppropriationEquipmentTab({
  control,
  errors,
  watch,
  isLoading,
  canSave,
  itemsError,
  lockIdentityFields = false,
  hideRowActions = false,
}: AppropriationEquipmentTabProps) {
  const { languageGB } = useLanguage();
  const formText = languageGB.appropriations.appropriation.form;

  const { fields, append, remove } = useFieldArray({ control, name: 'equipment_items' });

  const isDisabled = !canSave || isLoading;

  function handleAdd() {
    append({
      equipment_uuid: null,
      start_hour_meter: null,
      note: null,
      measurement_uuid: null,
      start_hour_photo: null,
    });
  }

  return (
    <Box pt={4}>
      {itemsError && (
        <Text fontSize="xs" color="fg.error" mb={2}>
          {itemsError}
        </Text>
      )}

      {fields.length === 0 ? (
        <Box py={2}>
          <Text fontSize="sm" color="fg.muted">
            {formText.emptyRow}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={4} mb={4}>
          {fields.map((field, index) => {
            const startHourMeter = watch(`equipment_items.${index}.start_hour_meter`);
            const endHourMeter = watch(`equipment_items.${index}.end_hour_meter`);
            const amount = watch(`equipment_items.${index}.amount`);
            // Bloco "calculado na finalização" (create/edit) — INALTERADO,
            // só ativo quando `lockIdentityFields=false` (ver JSX abaixo).
            const hasCalculatedData = (endHourMeter ?? 0) > 0 || (amount ?? 0) > 0;
            const rowErrors = errors.equipment_items?.[index];

            return (
              <Box
                key={field.id}
                p={4}
                border="1px solid"
                borderColor="border.subtle"
                borderRadius="lg"
              >
                <SimpleGrid columns={columnsForm.default} gap={4}>
                  <Controller
                    name={`equipment_items.${index}.equipment_uuid`}
                    control={control}
                    render={({ field: rowField }) =>
                      lockIdentityFields ? (
                        <InputReadOnly
                          label={formText.equipment.fields.equipment}
                          value={rowField.value?.label ?? '—'}
                        />
                      ) : (
                        <SelectAsyncPaginate
                          name={rowField.name}
                          label={formText.equipment.fields.equipment}
                          placeholder={formText.equipment.placeholders.equipment}
                          service={listEquipmentCatalogOptions}
                          mapOptions={(item: EquipmentOption) => ({
                            label: `${item.code} — ${item.description}`,
                            value: item.uuid,
                          })}
                          findParams={(search: string | { search: string }) => ({
                            search: typeof search === 'string' ? search : search.search,
                          })}
                          value={rowField.value ?? undefined}
                          onChange={(option: any) => rowField.onChange(option ?? null)}
                          isRequired
                          isDisabled={isDisabled}
                          menuPortalTarget={document.body}
                          menuPosition="fixed"
                        />
                      )
                    }
                  />

                  {/* Horímetro Inicial — TASK-FE-733: trava como
                      `InputReadOnly` na Finalização (identidade,
                      `_card_equipment_edit.blade.php:8` `->readonly()`). */}
                  {lockIdentityFields ? (
                    <InputReadOnly
                      label={formText.equipment.fields.startHourMeter}
                      value={Number(startHourMeter ?? 0).toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    />
                  ) : (
                    <Controller
                      name={`equipment_items.${index}.start_hour_meter`}
                      control={control}
                      render={({ field: rowField }) => (
                        <NumberInput
                          name={rowField.name}
                          label={formText.equipment.fields.startHourMeter}
                          allowDot
                          decimalPlaces={2}
                          value={rowField.value ?? null}
                          onValueChange={(value) => rowField.onChange(value)}
                          disabled={isDisabled}
                        />
                      )}
                    />
                  )}

                  {/* Observação — continua editável SEMPRE, fora da máscara
                      (mirror legado, `_card_equipment_edit.blade.php:42` sem
                      `readonly`). */}
                  <Controller
                    name={`equipment_items.${index}.note`}
                    control={control}
                    render={({ field: rowField }) => (
                      <Input
                        label={formText.equipment.fields.note}
                        name={rowField.name}
                        value={rowField.value ?? ''}
                        onChange={(e) => rowField.onChange(e.target.value)}
                        disabled={isDisabled}
                      />
                    )}
                  />

                  {/* "Un. Medida" (TASK-FE-603/AP-04) — select LIVRE por
                      linha, mirror `stock_items.measurement_uuid`
                      (AppropriationStockTab.tsx). TASK-FE-733 — trava como
                      `InputReadOnly` na Finalização. */}
                  <Controller
                    name={`equipment_items.${index}.measurement_uuid`}
                    control={control}
                    render={({ field: rowField }) =>
                      lockIdentityFields ? (
                        <InputReadOnly
                          label={formText.equipment.fields.measurement}
                          value={rowField.value?.label ?? '—'}
                        />
                      ) : (
                        <SelectAsyncPaginate
                          name={rowField.name}
                          label={formText.equipment.fields.measurement}
                          placeholder={formText.equipment.placeholders.measurement}
                          service={listMeasurementOptions}
                          mapOptions={(item: MeasurementOption) => ({
                            label: item.description,
                            value: item.uuid,
                          })}
                          findParams={(search: string | { search: string }) => ({
                            search: typeof search === 'string' ? search : search.search,
                          })}
                          value={rowField.value ?? undefined}
                          onChange={(option: any) => rowField.onChange(option ?? null)}
                          isDisabled={isDisabled}
                          menuPortalTarget={document.body}
                          menuPosition="fixed"
                        />
                      )
                    }
                  />

                  {lockIdentityFields ? (
                    // TASK-FE-733/GAP-BE-655 — Horímetro Final MIGROU de
                    // `FinishAppropriation.tsx` (TASK-FE-716) para DENTRO
                    // deste tab: `Controller`+`NumberInput` REAL, obrigatório,
                    // validado por `finishAppropriationSchemaResolver`
                    // (`end_hour_meter ≥ start_hour_meter`, TASK-FE-730) — SEM
                    // `rules` inline do RHF (fonte única de verdade).
                    <Controller
                      name={`equipment_items.${index}.end_hour_meter`}
                      control={control}
                      render={({ field: rowField }) => (
                        <NumberInput
                          name={rowField.name}
                          label={formText.equipment.fields.endHourMeter}
                          allowDot
                          decimalPlaces={2}
                          value={rowField.value ?? null}
                          onValueChange={(value) => rowField.onChange(value)}
                          error={rowErrors?.end_hour_meter?.message as string | undefined}
                          isRequired
                          disabled={isDisabled}
                        />
                      )}
                    />
                  ) : (
                    hasCalculatedData && (
                      <>
                        <InputReadOnly
                          label={formText.equipment.fields.endHourMeter}
                          value={Number(endHourMeter ?? 0).toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                          helperText={formText.equipment.calculatedHint}
                        />
                        <InputReadOnly
                          label={formText.equipment.fields.amount}
                          value={Number(amount ?? 0).toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                          helperText={formText.equipment.calculatedHint}
                        />
                      </>
                    )
                  )}
                </SimpleGrid>

                {/* "Imagem Horímetro Inicial" (TASK-FE-603/AP-04) — upload
                    real, 1 por linha. TASK-FE-733 — na Finalização, vira
                    preview travado (`disabled`, MESMO componente, sem novo
                    componente de `Image` estática); `maxSizeMb=10`
                    explícito (GAP-BE-654, decisão do dono). */}
                <Box mt={4} maxW="sm">
                  <Controller
                    name={`equipment_items.${index}.start_hour_photo`}
                    control={control}
                    render={({ field: rowField }) => (
                      <ImageUpload
                        label={formText.equipment.fields.startHourPhoto}
                        isRequired={!lockIdentityFields}
                        maxSizeMb={EQUIPMENT_PHOTO_MAX_SIZE_MB}
                        error={rowErrors?.start_hour_photo?.message as string | undefined}
                        currentImageUrl={rowField.value?.existingUrl ?? null}
                        file={rowField.value?.file ?? null}
                        onFileSelected={(file) =>
                          rowField.onChange(
                            file ? { file, existingUrl: rowField.value?.existingUrl ?? null } : null
                          )
                        }
                        onRemove={lockIdentityFields ? undefined : () => rowField.onChange(null)}
                        disabled={isDisabled || lockIdentityFields}
                        dropzoneTitle={formText.equipment.photo.dropzoneTitle}
                        dropzoneDraggingTitle={formText.equipment.photo.dropzoneDraggingTitle}
                        changeLabel={formText.occurrences.images.changeButton}
                        removeLabel={formText.occurrences.images.removeButton}
                      />
                    )}
                  />
                </Box>

                {/* "Foto Horímetro Final" — TASK-FE-730/733 (GAP-BE-653/655).
                    Campo NOVO, só existe na Finalização (`lockIdentityFields
                    =true`, mirror legado — `end_hour_photo[]` só existe em
                    `_card_equipment_edit.blade.php`). MESMO componente da
                    Foto Inicial, SEM `isRequired` (decisão do dono — Foto
                    Final é OPCIONAL) e SEM `error` (schema não valida
                    presença, `finishAppropriationSchemaResolver`,
                    TASK-FE-730). `maxSizeMb=10` explícito. */}
                {lockIdentityFields && (
                  <Box mt={4} maxW="sm">
                    <Controller
                      name={`equipment_items.${index}.end_hour_photo`}
                      control={control}
                      render={({ field: rowField }) => (
                        <ImageUpload
                          label={formText.equipment.fields.endHourPhoto}
                          maxSizeMb={EQUIPMENT_PHOTO_MAX_SIZE_MB}
                          currentImageUrl={rowField.value?.existingUrl ?? null}
                          file={rowField.value?.file ?? null}
                          onFileSelected={(file) =>
                            rowField.onChange(
                              file
                                ? { file, existingUrl: rowField.value?.existingUrl ?? null }
                                : null
                            )
                          }
                          onRemove={() => rowField.onChange(null)}
                          disabled={isDisabled}
                          dropzoneTitle={formText.equipment.photo.dropzoneTitle}
                          dropzoneDraggingTitle={formText.equipment.photo.dropzoneDraggingTitle}
                          changeLabel={formText.occurrences.images.changeButton}
                          removeLabel={formText.occurrences.images.removeButton}
                        />
                      )}
                    />
                  </Box>
                )}

                {!hideRowActions && (
                  <Flex justify="flex-end" mt={3}>
                    <IconButtonTable
                      aria-label={formText.removeItem}
                      mensegerTooltip={formText.removeItem}
                      size="sm"
                      color="red.500"
                      variant="ghost"
                      disabled={isDisabled}
                      onClick={() => remove(index)}
                    >
                      <Icon as={FiTrash2} />
                    </IconButtonTable>
                  </Flex>
                )}
              </Box>
            );
          })}
        </Flex>
      )}

      {!hideRowActions && (
        <Button
          title={formText.addItem}
          icon={FiPlus as ElementType}
          variant="outline"
          size="sm"
          onClick={handleAdd}
          disabled={isDisabled}
        />
      )}
    </Box>
  );
}
