// src/pages/Fiscal/Cte/ComponentesFieldArray.tsx
// -----------------------------------------------------------------------------
// Subcadastro "Componentes da prestação" (F23-F24, S19C, TASK-CTE-FE-04) —
// mirror ESTRUTURAL de `HarvestProductBoxesFieldArray.tsx`. O cálculo
// SOMACOMPONENTES (IG05, Contrato §2.4) é um `useEffect` no formulário PAI
// (`CreateOrUpdateCte.tsx`, observa `watch('componentes')`) — este componente
// só renderiza linhas via `control`/`fields`/`append`/`remove`/`errors`.
//
// `nome` limitado a 15 caracteres (UI + Yup, F23/`AC14`). `valor`
// (`MoneyInput`, `decimal(10,4)` físico mas exibição 2 casas, F24).
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
import { Input } from '@/components/Form/Input';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { IconButtonTable } from '@/components/IconButtonTable';

import { useLanguage } from '@/hooks/useLanguage';

import type { CteForm } from '@/@types/v2/Fiscal/cte';

export interface ComponentesFieldArrayProps {
  control: Control<CteForm>;
  fields: FieldArrayWithId<CteForm, 'componentes', 'id'>[];
  append: UseFieldArrayAppend<CteForm, 'componentes'>;
  remove: UseFieldArrayRemove;
  errors: FieldErrors<CteForm>;
  disabled?: boolean;
}

export function ComponentesFieldArray({
  control,
  fields,
  append,
  remove,
  errors,
  disabled = false,
}: ComponentesFieldArrayProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.ctes.cte.form.componentes;

  const arrayError = (errors.componentes as any)?.message as string | undefined;

  function handleAdd() {
    append({ nome: '', valor: null });
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
            const rowErrors = (errors.componentes as any)?.[index];

            return (
              <SimpleGrid key={field.id} columns={{ base: 1, md: 3 }} gap={4} alignItems="flex-end">
                <Controller
                  name={`componentes.${index}.nome`}
                  control={control}
                  render={({ field: controllerField }) => (
                    <Input
                      label={text.nome}
                      maxLength={15}
                      {...controllerField}
                      error={rowErrors?.nome?.message}
                      isRequired
                      disabled={disabled}
                    />
                  )}
                />
                <Controller
                  name={`componentes.${index}.valor`}
                  control={control}
                  render={({ field: controllerField }) => (
                    <MoneyInput
                      name={controllerField.name}
                      label={text.valor}
                      value={controllerField.value}
                      onValueChange={controllerField.onChange}
                      error={rowErrors?.valor?.message}
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

export default ComponentesFieldArray;
