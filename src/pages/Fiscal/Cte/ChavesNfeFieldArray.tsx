// src/pages/Fiscal/Cte/ChavesNfeFieldArray.tsx
// -----------------------------------------------------------------------------
// Subcadastro "Chaves de NFe referenciadas" (F10/F42, S19, TASK-CTE-FE-03) —
// mirror ESTRUTURAL de `HarvestProductBoxesFieldArray.tsx` (execução 040):
// `useFieldArray('chavesNfe')` vive no formulário PAI (`CreateOrUpdateCte.tsx`),
// este componente só renderiza linhas via `control`/`fields`/`append`/
// `remove`/`errors` recebidos por prop.
//
// `handleAdd` valida 44 dígitos + `!includes(valor)` (distinct, IG02) ANTES
// de `append` — mensagem "Chave inválida ou já existente" (Contrato §2.2,
// roteiro da Tarefa). Diferente de Medidas/Componentes, este array NÃO tem
// `.min(1)` (F10 é opcional).
// -----------------------------------------------------------------------------

import { ElementType, useState } from 'react';

import { Box, Flex, Icon, Text } from '@chakra-ui/react';
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
import { IconButtonTable } from '@/components/IconButtonTable';

import { useLanguage } from '@/hooks/useLanguage';

import type { CteForm } from '@/@types/v2/Fiscal/cte';

export interface ChavesNfeFieldArrayProps {
  control: Control<CteForm>;
  fields: FieldArrayWithId<CteForm, 'chavesNfe', 'id'>[];
  append: UseFieldArrayAppend<CteForm, 'chavesNfe'>;
  remove: UseFieldArrayRemove;
  errors: FieldErrors<CteForm>;
  disabled?: boolean;
}

export function ChavesNfeFieldArray({
  control,
  fields,
  append,
  remove,
  errors,
  disabled = false,
}: ChavesNfeFieldArrayProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.ctes.cte.form.chavesNfe;
  const [draft, setDraft] = useState('');
  const [inlineError, setInlineError] = useState<string | undefined>();

  const arrayError = (errors.chavesNfe as any)?.message as string | undefined;

  function handleAdd() {
    const value = draft.trim();

    if (value.length !== 44) {
      setInlineError(text.invalidLength);
      return;
    }

    const alreadyExists = fields.some((field) => (field as any).value === value);
    if (alreadyExists) {
      setInlineError(text.duplicate);
      return;
    }

    append({ value });
    setDraft('');
    setInlineError(undefined);
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
        <Text fontSize="sm" color="fg.muted" mb={4}>
          {text.emptyText}
        </Text>
      ) : (
        <Flex direction="column" gap={2} mb={4}>
          {fields.map((field, index) => (
            <Flex key={field.id} align="center" gap={4}>
              <Box flex="1">
                <Controller
                  name={`chavesNfe.${index}.value`}
                  control={control}
                  render={({ field: controllerField }) => (
                    <Input name={controllerField.name} value={controllerField.value} disabled />
                  )}
                />
              </Box>
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
          ))}
        </Flex>
      )}

      <Flex align="flex-end" gap={4}>
        <Box flex="1" maxW={{ base: 'full', md: '320px' }}>
          <Input
            label={text.chaveLabel}
            maxLength={44}
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value.replace(/\D/g, ''));
              setInlineError(undefined);
            }}
            error={inlineError}
            disabled={disabled}
          />
        </Box>
        <Button
          type="button"
          title={text.addButton}
          icon={FiPlus as ElementType}
          variant="outline"
          size="sm"
          onClick={handleAdd}
          disabled={disabled}
        />
      </Flex>
    </Box>
  );
}

export default ChavesNfeFieldArray;
