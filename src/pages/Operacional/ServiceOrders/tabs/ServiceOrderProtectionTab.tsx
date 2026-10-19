// src/pages/Operacional/ServiceOrders/tabs/ServiceOrderProtectionTab.tsx
// -----------------------------------------------------------------------------
// Aba "Proteções/EPIs" — TASK-FE-2005. `useFieldArray` de `protections`,
// contrato mais enxuto dos 5 blocos (`protections[]{product_uuid,note,
// is_checked}`).
//
// Execução 086 (FE-02): o catálogo de EPI vem de `GET /products/options?
// purpose=epi` (grupo 3 + categoria EPI + `is_enabled`, decidido pela API por
// enum de id — o antigo "grupo por label 'Proteção / Saúde Animal'" não
// existia e caía em "sem filtro"). Lista vazia é estado honesto ("Nenhum EPI
// cadastrado"), NUNCA cai para o catálogo inteiro.
//
// exec-038 HOMOLOG R2 (R2-07, achado E2E do dono) — "Confirmado"
// (`is_checked`) REMOVIDO do form (backend mantém a coluna com default);
// Produto/EPI + Observação PRESERVADOS.
// -----------------------------------------------------------------------------

import { useMemo } from 'react';
import type { ElementType } from 'react';

import { Box, Flex, Icon, SimpleGrid, Text } from '@chakra-ui/react';
import { Controller, useFieldArray } from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { components as selectComponents } from 'react-select';

import { Button } from '@/components/Button';
import { Input } from '@/components/Form/Input';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { IconButtonTable } from '@/components/IconButtonTable';

import { useLanguage } from '@/hooks/useLanguage';

import { columnsForm } from '@/constants/coluns-form';

import {
  listProductOptions,
  type ProductOptionsPurpose,
} from '@/services/v2/Products/product-service';

import type { ProductOption } from '@/@types/v2/Products';
import type { ServiceOrderForm } from '@/@types/v2/ServiceOrders';

import type { Control, FieldErrors } from 'react-hook-form';

const PROTECTION_OPTIONS_PURPOSE: ProductOptionsPurpose = 'epi';

export interface ServiceOrderProtectionTabProps {
  control: Control<ServiceOrderForm>;
  errors: FieldErrors<ServiceOrderForm>;
  isLoading: boolean;
  canSave: boolean;
}

export function ServiceOrderProtectionTab({
  control,
  errors,
  isLoading,
  canSave,
}: ServiceOrderProtectionTabProps) {
  const { languageGB } = useLanguage();
  const formText = languageGB.serviceOrders.serviceOrder.form;

  const { fields, append, remove } = useFieldArray({ control, name: 'protections' });

  // "Nenhum EPI cadastrado" no lugar do "Sem opções" genérico do wrapper.
  const emptyOptionsMessage = formText.protections.emptyOptions;
  const NoEpiMessage = useMemo(
    () =>
      function NoEpiMessage(props: any) {
        return (
          <selectComponents.NoOptionsMessage {...props}>
            {emptyOptionsMessage}
          </selectComponents.NoOptionsMessage>
        );
      },
    [emptyOptionsMessage]
  );

  const isDisabled = !canSave || isLoading;

  function handleAdd() {
    append({ product_uuid: null, note: null, is_checked: false });
  }

  return (
    <Box pt={4}>
      {fields.length === 0 ? (
        <Box py={2}>
          <Text fontSize="sm" color="fg.muted">
            {formText.emptyRow}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={4} mb={4}>
          {fields.map((field, index) => {
            const rowErrors = errors.protections?.[index];

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
                    name={`protections.${index}.product_uuid`}
                    control={control}
                    render={({ field: rowField }) => (
                      <SelectAsyncPaginate
                        name={rowField.name}
                        label={formText.protections.fields.product}
                        placeholder={formText.protections.placeholders.product}
                        error={rowErrors?.product_uuid?.message as string | undefined}
                        service={listProductOptions}
                        mapOptions={(item: ProductOption) => ({
                          label: item.code
                            ? `${item.code} — ${item.description}`
                            : item.description,
                          value: item.uuid,
                        })}
                        findParams={(search: string | { search: string }) => ({
                          search: typeof search === 'string' ? search : search.search,
                          purpose: PROTECTION_OPTIONS_PURPOSE,
                        })}
                        components={{ NoOptionsMessage: NoEpiMessage }}
                        value={rowField.value ?? undefined}
                        onChange={(option: any) => rowField.onChange(option ?? null)}
                        isRequired
                        isDisabled={isDisabled}
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                      />
                    )}
                  />

                  <Controller
                    name={`protections.${index}.note`}
                    control={control}
                    render={({ field: rowField }) => (
                      <Input
                        label={formText.protections.fields.note}
                        name={rowField.name}
                        value={rowField.value ?? ''}
                        onChange={(event) => rowField.onChange(event.target.value)}
                        disabled={isDisabled}
                      />
                    )}
                  />
                </SimpleGrid>

                <Flex justify="flex-end" align="center" mt={3}>
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
              </Box>
            );
          })}
        </Flex>
      )}

      <Button
        title={formText.addItem}
        icon={FiPlus as ElementType}
        variant="outline"
        size="sm"
        onClick={handleAdd}
        disabled={isDisabled}
      />
    </Box>
  );
}
