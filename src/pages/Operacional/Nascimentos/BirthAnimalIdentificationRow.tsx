// src/pages/Operacional/Nascimentos/BirthAnimalIdentificationRow.tsx
// -----------------------------------------------------------------------------
// Linha individual da tabela dinâmica de Identificação do bezerro
// (TASK-NASC-FE-02, frontend-contract-nascimentos.md §7.2/§7.3). Componente
// PRÓPRIO (não inline no `.map()`) para poder usar `useWatch` com ordem de
// hooks ESTÁVEL por instância — mirror EXATO de `IdentificationRow` em
// `CadastrosBase/Rebanho/CreateOrUpdateAnimal.tsx:1804-1939`.
//
// Regra "S/ID" (checklist item 1 da Tarefa, confirmado por consulta real ao
// catálogo físico `id_animals`, mesma tabela usada pelo domínio Animal):
// quando o Tipo de Identificação selecionado NA MESMA LINHA tem rótulo EXATO
// "Sem Identificação" (`NO_IDENTIFICATION_TYPE_LABEL`), o campo Identificação
// da MESMA linha é auto-preenchido com "S/ID" e travado (`readOnly`).
//
// Debounce de duplicidade (contrato §7.3, IG3) — `onBlur` → `verify-
// identification` — aviso NÃO-BLOQUEANTE (toast), nunca `setError`/
// `clearErrors`.
// -----------------------------------------------------------------------------

import { useRef } from 'react';

import { Box, Flex, Icon } from '@chakra-ui/react';
import {
  Control,
  Controller,
  UseFieldArrayRemove,
  UseFormSetValue,
  useWatch,
} from 'react-hook-form';
import { FiTrash2 } from 'react-icons/fi';

import { Input } from '@/components/Form/Input';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { IconButtonTable } from '@/components/IconButtonTable';
import { toaster } from '@/components/ui/toaster';

import { listIdentificationTypeOptions } from '@/services/v2/BaseRegistrations/identificationTypes-service';
import { verifyBirthIdentification } from '@/services/v2/BirthAnimals/birth-animal-service';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { IdentificationTypeOptionItem } from '@/@types/v2/BaseRegistrations/identificationTypes';
import type { BirthAnimalForm } from '@/@types/v2/BirthAnimals';

// Mirror EXATO de `NO_IDENTIFICATION_TYPE_LABEL` de `CreateOrUpdateAnimal.tsx`
// — confirmado por consulta real ao catálogo físico `id_animals` (checklist
// obrigatório item 1 da Tarefa 19): `id=6`, `description='Sem Identificação'`
// — grafia EXATA, mesma tabela compartilhada entre Animal e BirthAnimal (não
// há divergência de catálogo entre os dois domínios).
export const NO_IDENTIFICATION_TYPE_LABEL = 'Sem Identificação';

interface BirthAnimalIdentificationRowProps {
  index: number;
  control: Control<BirthAnimalForm>;
  setValue: UseFormSetValue<BirthAnimalForm>;
  isDisabled: boolean;
  onRemove: UseFieldArrayRemove;
  /** `false` quando esta é a ÚLTIMA linha restante — mínimo 1 linha SEMPRE (contrato §7.2). */
  canRemove: boolean;
  text: LanguageDate['birthAnimals']['birthAnimal']['form'];
  isEditing: boolean;
  excludeUuid?: string;
}

export function BirthAnimalIdentificationRow({
  index,
  control,
  setValue,
  isDisabled,
  onRemove,
  canRemove,
  text,
  isEditing,
  excludeUuid,
}: BirthAnimalIdentificationRowProps) {
  const identificationsText = text.identifications;

  const watchedRowType = useWatch({ control, name: `identifications.${index}.id_animal_uuid` });
  const isNoIdRow =
    (watchedRowType as Option<string> | null)?.label === NO_IDENTIFICATION_TYPE_LABEL;

  // Guarda "só consulte se o valor MUDOU" — mirror `lastCheckedRef` de
  // `CreateOrUpdateAnimal.tsx` (`IdentificationRow`), evita round-trip
  // repetido quando o usuário só entra e sai do campo sem digitar nada novo.
  const lastCheckedRef = useRef<string>('');

  async function handleIdentificationBlur(rawValue: string) {
    const value = (rawValue ?? '').trim();
    if (!value || value === 'S/ID' || isNoIdRow) return;
    if (value === lastCheckedRef.current) return;
    lastCheckedRef.current = value;

    try {
      const result = await verifyBirthIdentification({
        identification: value,
        exclude_uuid: isEditing ? excludeUuid : undefined,
      });
      if (result.exists) {
        toaster.create({
          type: 'warning',
          title: identificationsText.duplicateWarningTitle,
          description: identificationsText.duplicateWarningDescription.replace(
            '{{identification}}',
            result.identification
          ),
        });
      }
    } catch {
      // Falha de rede/servidor no aviso não deve travar o preenchimento do
      // formulário — é só uma checagem prévia informativa (§7.3), nunca
      // parte do caminho crítico de submit.
    }
  }

  return (
    <Flex gap={3} align="flex-end" wrap="wrap">
      <Box flex="1" minW="240px">
        <Controller
          name={`identifications.${index}.id_animal_uuid`}
          control={control}
          render={({ field: rowField, fieldState }) => (
            <SelectAsyncPaginate
              name={rowField.name}
              label={identificationsText.typeLabel}
              placeholder={identificationsText.typePlaceholder}
              service={listIdentificationTypeOptions}
              mapOptions={(item: IdentificationTypeOptionItem) => ({
                label: item.label,
                value: item.uuid,
              })}
              findParams={(search: string | { search: string }) => ({
                search: typeof search === 'string' ? search : search.search,
              })}
              value={rowField.value ?? null}
              onChange={(option: any) => {
                rowField.onChange(option ?? null);
                // Mirror `CreateOrUpdateAnimal.tsx`: zera SEMPRE o campo
                // Identificação desta linha e, se o novo tipo for "Sem
                // Identificação", auto-preenche "S/ID" (o Input ao lado
                // trava via `isNoIdRow`).
                const isNewNoIdRow = (option?.label ?? null) === NO_IDENTIFICATION_TYPE_LABEL;
                setValue(`identifications.${index}.identification`, isNewNoIdRow ? 'S/ID' : '', {
                  shouldDirty: true,
                });
              }}
              error={fieldState.error?.message}
              isRequired
              isDisabled={isDisabled}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          )}
        />
      </Box>

      <Box flex="1" minW="200px">
        <Controller
          name={`identifications.${index}.identification`}
          control={control}
          render={({ field: rowField, fieldState }) => (
            <Input
              name={rowField.name}
              label={identificationsText.valueLabel}
              placeholder={identificationsText.valuePlaceholder}
              value={rowField.value ?? ''}
              onChange={rowField.onChange}
              onBlur={() => {
                rowField.onBlur();
                handleIdentificationBlur(rowField.value ?? '');
              }}
              error={fieldState.error?.message}
              isRequired
              disabled={isDisabled || isNoIdRow}
            />
          )}
        />
      </Box>

      <IconButtonTable
        aria-label={identificationsText.removeRowLabel}
        mensegerTooltip={identificationsText.removeRowLabel}
        size="sm"
        color="red.500"
        variant="ghost"
        disabled={isDisabled || !canRemove}
        onClick={() => canRemove && onRemove(index)}
      >
        <Icon as={FiTrash2} />
      </IconButtonTable>
    </Flex>
  );
}
