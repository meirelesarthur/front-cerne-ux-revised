// src/pages/Operacional/Pastagem/subcadastros/ServicesFieldArray.tsx
// -----------------------------------------------------------------------------
// Aba "MO/Serviços" (mão de obra "3-em-1": Funcionário/Função/Prestador) —
// TASK-PAST-FE-04. `useFieldArray` de `services`. Mirror
// `Appropriations/tabs/AppropriationLaborTab.tsx`.
//
// "Executor" muda de catálogo conforme `func_type` (discriminante de UI,
// não campo do payload): 1=Funcionário → `listEmployees`; 2=Função →
// `listFunctionOptions`; 3=Prestador → `listProviders`. Trocar `func_type`
// limpa os 3 campos de executor (só um pode ficar preenchido — mirror
// `PastureRequest` XOR).
//
// CALC-05 (`quantity`↔`total_quantity` bidirecional) — a fórmula exata de
// conversão NÃO foi confirmada nesta execução (o contrato de arquitetura
// não detalha o multiplicador, e `Pasture` não tem um campo `used_area`
// equivalente ao de Appropriations para derivar automaticamente). Os 2
// campos ficam editáveis INDEPENDENTEMENTE (ambos vão ao payload) — SEM
// MOCK, nenhuma fórmula foi inventada. Observação registrada para o
// Tester/Arquiteto avaliar se um Gap de fidelidade é necessário.
// -----------------------------------------------------------------------------

import type { ElementType } from 'react';

import { Box, Flex, Icon, SimpleGrid, Text } from '@chakra-ui/react';
import { Controller, useFieldArray } from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { IconButtonTable } from '@/components/IconButtonTable';

import { useLanguage } from '@/hooks/useLanguage';

import { columnsForm } from '@/constants/coluns-form';
import { funcTypeOptions } from '@/constants/pastures/options/func-type-options';

import { listEmployees } from '@/services/v2/CadastrosBase/Employee/employee-service';
import { listProviders } from '@/services/v2/CadastrosBase/Provider/provider-service';
import { listFunctionOptions } from '@/services/v2/Functions/function-service';
import { listMeasurementOptions } from '@/services/v2/Measurements/measurement-service';

import type { EmployeeListItem } from '@/@types/v2/CadastrosBase/employee';
import type { ProviderListItem } from '@/@types/v2/CadastrosBase/provider';
import type { FunctionOption } from '@/@types/v2/Functions';
import type { MeasurementOption } from '@/@types/v2/Measurements';
import type { PastureForm } from '@/@types/v2/Pastures';

import type { Control, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';

export interface ServicesFieldArrayProps {
  control: Control<PastureForm>;
  errors: FieldErrors<PastureForm>;
  watch: UseFormWatch<PastureForm>;
  setValue: UseFormSetValue<PastureForm>;
  isLoading: boolean;
  canSave: boolean;
}

export function ServicesFieldArray({
  control,
  watch,
  setValue,
  isLoading,
  canSave,
}: ServicesFieldArrayProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.pastures.pasture.form;
  const serviceText = text.services;

  const { fields, append, remove } = useFieldArray({ control, name: 'services' });
  const isDisabled = !canSave || isLoading;

  const typeOptions = funcTypeOptions.options(languageGB);

  function handleAdd() {
    append({
      func_type: null,
      employee_uuid: null,
      function_uuid: null,
      provider_uuid: null,
      measurement_uuid: null,
      quantity: null,
      total_quantity: null,
    });
  }

  return (
    <Box pt={4}>
      {fields.length === 0 ? (
        <Box py={2}>
          <Text fontSize="sm" color="fg.muted">
            {text.emptyRow}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={4} mb={4}>
          {fields.map((field, index) => {
            const rowType = watch(`services.${index}.func_type`)?.value;
            const isExistingRow = !!watch(`services.${index}.uuid`);
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
                    name={`services.${index}.func_type`}
                    control={control}
                    render={({ field: rowField }) => (
                      <Select
                        label={serviceText.fields.funcType}
                        placeholder={serviceText.placeholders.funcType}
                        name={rowField.name}
                        value={rowField.value}
                        onChange={(option) => {
                          rowField.onChange(option ?? null);
                          setValue(`services.${index}.employee_uuid`, null);
                          setValue(`services.${index}.function_uuid`, null);
                          setValue(`services.${index}.provider_uuid`, null);
                        }}
                        options={typeOptions}
                        isRequired
                        isDisabled={isDisabled}
                      />
                    )}
                  />

                  {rowType === 1 && (
                    <Controller
                      name={`services.${index}.employee_uuid`}
                      control={control}
                      render={({ field: rowField }) => (
                        <SelectAsyncPaginate
                          name={rowField.name}
                          label={serviceText.fields.executor}
                          placeholder={serviceText.placeholders.executor}
                          service={listEmployees}
                          mapOptions={(item: EmployeeListItem) => ({
                            label: item.name,
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
                      )}
                    />
                  )}

                  {rowType === 2 && (
                    <Controller
                      name={`services.${index}.function_uuid`}
                      control={control}
                      render={({ field: rowField }) => (
                        <SelectAsyncPaginate
                          name={rowField.name}
                          label={serviceText.fields.executor}
                          placeholder={serviceText.placeholders.executor}
                          service={listFunctionOptions}
                          mapOptions={(item: FunctionOption) => ({
                            label: item.name,
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
                      )}
                    />
                  )}

                  {rowType === 3 && (
                    <Controller
                      name={`services.${index}.provider_uuid`}
                      control={control}
                      render={({ field: rowField }) => (
                        <SelectAsyncPaginate
                          name={rowField.name}
                          label={serviceText.fields.executor}
                          placeholder={serviceText.placeholders.executor}
                          service={listProviders}
                          mapOptions={(item: ProviderListItem) => ({
                            label: item.name,
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
                      )}
                    />
                  )}

                  <Controller
                    name={`services.${index}.measurement_uuid`}
                    control={control}
                    render={({ field: rowField }) =>
                      isExistingRow ? (
                        <InputReadOnly
                          label={serviceText.fields.measurement}
                          value={rowField.value?.label ?? '—'}
                        />
                      ) : (
                        <SelectAsyncPaginate
                          name={rowField.name}
                          label={serviceText.fields.measurement}
                          placeholder={serviceText.placeholders.measurement}
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

                  <Controller
                    name={`services.${index}.quantity`}
                    control={control}
                    render={({ field: rowField }) => (
                      <NumberInput
                        name={rowField.name}
                        label={serviceText.fields.quantity}
                        allowDot
                        decimalPlaces={2}
                        value={rowField.value ?? null}
                        onValueChange={(value) => rowField.onChange(value)}
                        disabled={isDisabled}
                      />
                    )}
                  />

                  {/* CALC-05 — editável, ver observação no cabeçalho do arquivo
                      (fórmula bidirecional exata não confirmada, SEM MOCK). */}
                  <Controller
                    name={`services.${index}.total_quantity`}
                    control={control}
                    render={({ field: rowField }) => (
                      <NumberInput
                        name={rowField.name}
                        label={serviceText.fields.totalQuantity}
                        allowDot
                        decimalPlaces={2}
                        value={rowField.value ?? null}
                        onValueChange={(value) => rowField.onChange(value)}
                        disabled={isDisabled}
                      />
                    )}
                  />
                </SimpleGrid>

                <Flex justify="flex-end" mt={3}>
                  <IconButtonTable
                    aria-label={text.removeItem}
                    mensegerTooltip={text.removeItem}
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
        title={text.addItem}
        icon={FiPlus as ElementType}
        variant="outline"
        size="sm"
        onClick={handleAdd}
        disabled={isDisabled}
      />
    </Box>
  );
}
