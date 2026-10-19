// src/pages/Fiscal/Cte/MedidasFieldArray.tsx
// -----------------------------------------------------------------------------
// Subcadastro "Medidas de carga" (F20-F22, S19M, TASK-CTE-FE-04) — mirror
// ESTRUTURAL de `HarvestProductBoxesFieldArray.tsx` (execução 040):
// `useFieldArray('medidas')` vive no formulário PAI, este componente recebe
// `control`/`fields`/`append`/`remove`/`errors` via props.
//
// Linha: `codUnidade`/`tipoMedida` (Select, LK10/LK11 estáticos),
// `quantidadeCarga` (`KgInput`, `decimalPlaces={2}` na exibição — precisão
// física do backend é `decimal(10,4)`, mas o legado sempre exibiu/editou com
// 2 casas, F22). Guarda `.min(1)` é responsabilidade do schema Yup
// (Contrato §2.3) — aqui só o `emptyText`/erro de array.
// -----------------------------------------------------------------------------

import { ElementType } from 'react';

import { Box, Flex, Icon, SimpleGrid, Text } from '@chakra-ui/react';
import {
  Control,
  Controller,
  FieldArrayWithId,
  FieldErrors,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
} from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { KgInput } from '@/components/Form/kgInput';
import { Select } from '@/components/Form/Select';
import { IconButtonTable } from '@/components/IconButtonTable';

import { useLanguage } from '@/hooks/useLanguage';

import { cteTipoMedidaOptions } from '@/constants/Fiscal/cte/options/cte-tipo-medida-options';
import { cteUnidadeMedidaOptions } from '@/constants/Fiscal/cte/options/cte-unidade-medida-options';

import type { CteForm } from '@/@types/v2/Fiscal/cte';

export interface MedidasFieldArrayProps {
  control: Control<CteForm>;
  fields: FieldArrayWithId<CteForm, 'medidas', 'id'>[];
  append: UseFieldArrayAppend<CteForm, 'medidas'>;
  remove: UseFieldArrayRemove;
  errors: FieldErrors<CteForm>;
  disabled?: boolean;
}

export function MedidasFieldArray({
  control,
  fields,
  append,
  remove,
  errors,
  disabled = false,
}: MedidasFieldArrayProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.ctes.cte.form.medidas;
  const unidadeOptions = cteUnidadeMedidaOptions.options();
  const tipoOptions = cteTipoMedidaOptions.options();

  const arrayError = (errors.medidas as any)?.message as string | undefined;

  function handleAdd() {
    append({ codUnidade: null, tipoMedida: null, quantidadeCarga: null });
  }

  return (
    <Box bg="bg.muted" border="1px solid" borderColor="border.subtle" borderRadius="lg" p={4}>
      <Text fontSize="sm" fontWeight="semibold" mb={4}>
        {text.sectionTitle}
      </Text>

      {arrayError && (
        <Text fontSize="sm" color="fg.error" mb={2}>
          {arrayError}
        </Text>
      )}

      {fields.length === 0 ? (
        <Text fontSize="sm" color={arrayError ? 'fg.error' : 'fg.muted'} mb={4}>
          {text.emptyText}
        </Text>
      ) : (
        <Flex direction="column" gap={4} mb={4}>
          {fields.map((field, index) => {
            const rowErrors = (errors.medidas as any)?.[index];

            return (
              <SimpleGrid key={field.id} columns={{ base: 1, md: 4 }} gap={4} alignItems="flex-end">
                <Controller
                  name={`medidas.${index}.codUnidade`}
                  control={control}
                  render={({ field: controllerField }) => (
                    <Select
                      label={text.codUnidade}
                      name={controllerField.name}
                      value={controllerField.value}
                      onChange={controllerField.onChange}
                      options={unidadeOptions}
                      error={rowErrors?.codUnidade?.message}
                      isRequired
                      isDisabled={disabled}
                    />
                  )}
                />
                <Controller
                  name={`medidas.${index}.tipoMedida`}
                  control={control}
                  render={({ field: controllerField }) => (
                    <Select
                      label={text.tipoMedida}
                      name={controllerField.name}
                      value={controllerField.value}
                      onChange={controllerField.onChange}
                      options={tipoOptions}
                      error={rowErrors?.tipoMedida?.message}
                      isRequired
                      isDisabled={disabled}
                    />
                  )}
                />
                <Controller
                  name={`medidas.${index}.quantidadeCarga`}
                  control={control}
                  render={({ field: controllerField }) => (
                    <KgInput
                      name={controllerField.name}
                      label={text.quantidadeCarga}
                      value={controllerField.value ?? ''}
                      onChange={(_event, _masked, floatValue) =>
                        controllerField.onChange(floatValue)
                      }
                      allowDot
                      decimalPlaces={2}
                      error={rowErrors?.quantidadeCarga?.message}
                      isRequired
                      disabled={disabled}
                    />
                  )}
                />
                <Flex justify="flex-start">
                  <IconButtonTable
                    aria-label={text.removeButton}
                    mensegerTooltip={text.removeButton}
                    size="sm"
                    color="red.500"
                    variant="ghost"
                    disabled={disabled}
                    onClick={() => remove(index)}
                  >
                    <Icon as={FiTrash2} />
                  </IconButtonTable>
                </Flex>
              </SimpleGrid>
            );
          })}
        </Flex>
      )}

      <Button
        type="button"
        title={text.addButton}
        icon={FiPlus as ElementType}
        variant="outline"
        size="sm"
        onClick={handleAdd}
        disabled={disabled}
      />
    </Box>
  );
}

export default MedidasFieldArray;
