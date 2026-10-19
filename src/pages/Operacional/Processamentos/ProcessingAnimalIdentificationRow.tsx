// src/pages/Operacional/Processamentos/ProcessingAnimalIdentificationRow.tsx
// -----------------------------------------------------------------------------
// Linha individual do sub-repeater `identifications[]` (TASK-FE-039-PROC-03)
// — mirror EXATO de `Operacional/Nascimentos/BirthAnimalIdentificationRow.tsx`
// (mesmo catálogo físico `id_animals`/`identification-types`, mesma
// convenção "Sem Identificação", FD5 do front-plan-proc.md §7). Componente
// PRÓPRIO (não inline no `.map()`) — `useWatch` com ordem de hooks ESTÁVEL
// por instância.
//
// REWORK (039, PROC-10, FD-R3 desbloqueada): dup-check ao vivo via `onBlur`,
// reusando `GET /api/v1/animals/verify-identification` (`verifyAnimalIdentification`,
// MESMO endpoint compartilhado já usado por Nascimentos — decisão de
// arquitetura da API, `db-api-plan-proc-rework.md §"FD-R3"`: não criar
// endpoint novo, a invariante de identificação duplicada é do `Animal`, não
// do módulo que a edita). Mirror EXATO de
// `BirthAnimalIdentificationRow.handleIdentificationBlur` — `useRef`
// anti-repetição, aviso NÃO-BLOQUEANTE (toast), `catch {}` silencioso.
//
// REWORK (039, PROC-08): propagação Compra-only da 1ª identificação do 1º
// animal para a 1ª identificação dos demais (mirror
// `_card_animal.blade.php:381-390`) — só quando `animalIndex===0 &&
// index===0 && isMovementPurchaseOrigin(originType)`.
// -----------------------------------------------------------------------------

import { useRef } from 'react';

import { Box, Flex, Icon } from '@chakra-ui/react';
import {
  Control,
  Controller,
  UseFieldArrayRemove,
  UseFormGetValues,
  UseFormSetValue,
  useWatch,
} from 'react-hook-form';
import { FiTrash2 } from 'react-icons/fi';

import { Input } from '@/components/Form/Input';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { IconButtonTable } from '@/components/IconButtonTable';
import { toaster } from '@/components/ui/toaster';

import { verifyAnimalIdentification } from '@/services/v2/Animals/animal-service';
import { listIdentificationTypeOptions } from '@/services/v2/BaseRegistrations/identificationTypes-service';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { IdentificationTypeOptionItem } from '@/@types/v2/BaseRegistrations/identificationTypes';
import type { FinishProcessingForm } from '@/@types/v2/Processamentos/processing';

import { isMovementPurchaseOrigin } from './processingOrigin';
import { propagateFirstIdentificationToEmptyRows } from './propagateToEmptyRows';

// Mirror EXATO de `NO_IDENTIFICATION_TYPE_LABEL`
// (`Nascimentos/BirthAnimalIdentificationRow.tsx`/`CreateOrUpdateAnimal.tsx`)
// — mesmo catálogo físico `id_animals`, grafia EXATA confirmada por consulta
// real ao catálogo. NUNCA derivado de `languageGB` (o registro físico é
// sempre PT-BR no banco, independente do locale ativo da UI).
export const NO_IDENTIFICATION_TYPE_LABEL = 'Sem Identificação';

export interface ProcessingAnimalIdentificationRowProps {
  control: Control<FinishProcessingForm>;
  setValue: UseFormSetValue<FinishProcessingForm>;
  getValues: UseFormGetValues<FinishProcessingForm>;
  animalIndex: number;
  index: number;
  /** Total de animais do array (PROC-08) — só usado quando `animalIndex===0 && index===0`. */
  animalsCount: number;
  /** FQCN do morph da origem (`App\Models\X`; linhas legadas `App\X`) — normalizado por `isMovementPurchaseOrigin`; propagação só dispara para Compra (RN mirror do `@if` legado). */
  originType?: string;
  onRemove: UseFieldArrayRemove;
  /** `false` quando esta é a ÚLTIMA linha restante — mínimo 1 identificação por animal. */
  canRemove: boolean;
  disabled: boolean;
  languageGB: LanguageDate;
}

export function ProcessingAnimalIdentificationRow({
  control,
  setValue,
  getValues,
  animalIndex,
  index,
  animalsCount,
  originType,
  onRemove,
  canRemove,
  disabled,
  languageGB,
}: ProcessingAnimalIdentificationRowProps) {
  const identificationText = languageGB.processamentos.processing.form.fields.identification;

  const fieldPathType = `animals.${animalIndex}.identifications.${index}.id_animal_uuid` as const;
  const fieldPathValue = `animals.${animalIndex}.identifications.${index}.identification` as const;

  const watchedType = useWatch({ control, name: fieldPathType });
  const isNoIdRow = (watchedType as Option<string> | null)?.label === NO_IDENTIFICATION_TYPE_LABEL;

  // Guarda "só consulte se o valor MUDOU" — mirror `lastCheckedRef` de
  // `BirthAnimalIdentificationRow.tsx`.
  const lastCheckedRef = useRef<string>('');

  async function handleIdentificationBlur(rawValue: string) {
    const value = (rawValue ?? '').trim();
    if (!value || value === 'S/ID' || isNoIdRow) return;
    if (value === lastCheckedRef.current) return;
    lastCheckedRef.current = value;

    try {
      // Exclui o próprio Animal quando a linha já veio hidratada pelo
      // `prepare` com `animal_uuid` (PROC-04) — a identificação atual dele
      // não deve se autoacusar como duplicata.
      const excludeUuid = getValues(`animals.${animalIndex}.animal_uuid`) ?? undefined;
      const result = await verifyAnimalIdentification({
        identification: value,
        exclude_uuid: excludeUuid,
      });
      if (result.exists) {
        toaster.create({
          type: 'warning',
          title: identificationText.duplicateWarningTitle,
          description: identificationText.duplicateWarningDescription.replace(
            '{{identification}}',
            result.identification
          ),
        });
      }
    } catch {
      // Falha de rede/servidor no aviso não deve travar o preenchimento do
      // formulário — é só uma checagem prévia informativa, nunca parte do
      // caminho crítico de submit (o 422 real do servidor é a autoridade
      // final).
    }
  }

  return (
    <Flex gap={3} align="flex-start" wrap="wrap">
      <Box flex="1" minW="240px">
        <Controller
          name={fieldPathType}
          control={control}
          render={({ field, fieldState }) => (
            <SelectAsyncPaginate
              name={field.name}
              label={identificationText.typeLabel}
              service={listIdentificationTypeOptions}
              mapOptions={(item: IdentificationTypeOptionItem) => ({
                label: item.label,
                value: item.uuid,
              })}
              findParams={(search: string | { search: string }) => ({
                search: typeof search === 'string' ? search : search.search,
              })}
              value={field.value ?? null}
              onChange={(option: any) => {
                field.onChange(option ?? null);
                // Mirror `BirthAnimalIdentificationRow`/`CreateOrUpdateAnimal`:
                // zera SEMPRE o campo Identificação desta linha e, se o novo
                // tipo for "Sem Identificação", auto-preenche "S/ID" (o
                // Input ao lado trava via `isNoIdRow`, derivado de `useWatch`).
                const isNewNoIdRow = (option?.label ?? null) === NO_IDENTIFICATION_TYPE_LABEL;
                setValue(fieldPathValue, isNewNoIdRow ? 'S/ID' : '', { shouldDirty: true });

                // PROC-08 — Compra-only: a 1ª identificação do 1º animal
                // propaga para a 1ª identificação dos demais (mirror
                // `_card_animal.blade.php:381-390`).
                if (animalIndex === 0 && index === 0 && isMovementPurchaseOrigin(originType)) {
                  propagateFirstIdentificationToEmptyRows(
                    getValues,
                    setValue,
                    animalsCount,
                    option ?? null
                  );
                }
              }}
              error={fieldState.error?.message}
              isRequired
              isDisabled={disabled}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          )}
        />
      </Box>

      <Box flex="1" minW="200px">
        <Controller
          name={fieldPathValue}
          control={control}
          render={({ field, fieldState }) => (
            <Input
              name={field.name}
              label={identificationText.valueLabel}
              value={field.value ?? ''}
              onChange={field.onChange}
              onBlur={() => {
                field.onBlur();
                handleIdentificationBlur(field.value ?? '');
              }}
              error={fieldState.error?.message}
              isRequired
              disabled={disabled || isNoIdRow}
            />
          )}
        />
      </Box>

      <Flex direction="column" gap="1.5">
        <Flex alignItems="center" fontSize="14px" visibility="hidden">
          {identificationText.removeRow}
        </Flex>
        <IconButtonTable
          aria-label={identificationText.removeRow}
          mensegerTooltip={identificationText.removeRow}
          size="sm"
          color="red.500"
          variant="ghost"
          disabled={disabled || !canRemove}
          onClick={() => canRemove && onRemove(index)}
        >
          <Icon as={FiTrash2} />
        </IconButtonTable>
      </Flex>
    </Flex>
  );
}
