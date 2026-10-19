// src/pages/Administrativo/Recebimentos/RequestReceiptItemsFieldArray.tsx
// -----------------------------------------------------------------------------
// Subregistro "Itens" da tela Confirmar Recebimento (RequestReceipt —
// Administrativo / Suprimentos, esteira 97-Esteiras/040, TASK-RCB-FE-02).
// `useFieldArray` de `{ uuid, status(Select), delivery_date(DateInput) }` —
// linhas pré-populadas pelo `fillForm` (itens autorizados da solicitação),
// SEM add/remove (o conjunto de itens é fixo, definido na Solicitação/
// Autorização — Recebimentos só confirma status/data por item).
//
// Payload chaveado por `uuid` do item, NUNCA índice/posição (CLM-13
// corrigido) — `field.id` do RHF é só a key React da linha; o `uuid` real
// do item vem do próprio `field.uuid` (readonly, hidratado do servidor).
// -----------------------------------------------------------------------------

import { Box, Flex, Text } from '@chakra-ui/react';
import { Control, Controller, useFieldArray } from 'react-hook-form';

import { DateInput } from '@/components/DateInput';
import { Field } from '@/components/Form/Field';
import { Select } from '@/components/Form/Select';

import { useLanguage } from '@/hooks/useLanguage';

import { requestItemStatusOptions } from '@/constants/RequestPurchases/options/request-item-status-options';

import type { ConfirmReceiptForm } from '@/@types/v2/RequestReceipts';

export interface RequestReceiptItemsFieldArrayProps {
  control: Control<ConfirmReceiptForm>;
  isDisabled: boolean;
}

export function RequestReceiptItemsFieldArray({
  control,
  isDisabled,
}: RequestReceiptItemsFieldArrayProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.requestReceipts.requestReceipt.confirm.items;

  const { fields } = useFieldArray({ control, name: 'items' });
  const statusOptions = requestItemStatusOptions.options(languageGB);

  return (
    <Box>
      <Text fontWeight="bold" color="brandColorText" mb={4}>
        {text.title}
      </Text>

      {fields.length === 0 ? (
        <Box py={2} mb={4}>
          <Text fontSize="sm" color="fg.muted">
            {text.empty}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={4}>
          {fields.map((field, index) => (
            <Flex key={field.id} gap={3} align="flex-end" wrap="wrap">
              <Box flex="2" minW="220px">
                <Field label={text.columns.description}>
                  <Text fontSize="sm">{field.description ?? '—'}</Text>
                </Field>
              </Box>

              <Box minW="100px">
                <Field label={text.columns.quantity}>
                  <Text fontSize="sm">{field.quantity ?? '—'}</Text>
                </Field>
              </Box>

              <Box minW="180px">
                <Controller
                  name={`items.${index}.status`}
                  control={control}
                  render={({ field: rowField }) => (
                    <Select
                      name={rowField.name}
                      label={text.columns.status}
                      value={rowField.value}
                      onChange={rowField.onChange}
                      options={statusOptions}
                      isDisabled={isDisabled}
                      noClearable
                    />
                  )}
                />
              </Box>

              <Box minW="180px">
                <Controller
                  name={`items.${index}.delivery_date`}
                  control={control}
                  render={({ field: rowField }) => (
                    <Field label={text.columns.deliveryDate}>
                      <DateInput
                        value={rowField.value ?? null}
                        onChange={rowField.onChange}
                        disabled={isDisabled}
                      />
                    </Field>
                  )}
                />
              </Box>
            </Flex>
          ))}
        </Flex>
      )}
    </Box>
  );
}
