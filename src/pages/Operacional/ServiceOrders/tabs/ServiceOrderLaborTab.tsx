// src/pages/Operacional/ServiceOrders/tabs/ServiceOrderLaborTab.tsx
// -----------------------------------------------------------------------------
// Aba "Mão de Obra" — TASK-FE-2005. `useFieldArray` de `employees`, mirror
// `Appropriations/tabs/AppropriationLaborTab.tsx` (mesmo domínio de tipo —
// 1=Funcionário, 2=Função, 3=Fornecedor, IG-04/05/06 do contrato legado).
//
// Invariante "exatamente 1 executor" (mirror
// `ServiceOrderEmployeeLineExactlyOneRule` do backend, validado em
// `service-order-schema.ts`) — trocar `func_type` limpa os 3 campos
// `employee_uuid`/`function_uuid`/`provider_uuid` (só um pode estar
// preenchido).
//
// H02/H03 (clonagem/remoção com validação de mínimo) — PRESERVE: mínimo 0
// linhas (bloco `sometimes` no backend, sem mínimo de 1 confirmado no
// contrato) — a remoção não tem invariante de "ao menos 1" nesta fatia.
//
// exec-038 HOMOLOG R2 (achado E2E do dono):
//   - R2-02: "Confirmado" (`is_checked`) REMOVIDO do form (backend mantém a
//     coluna com default).
//   - R2-03: "Observação" (`note`) REMOVIDO do form — o legado só tem
//     Tipo + Executor neste bloco na criação (`_card_service.blade.php`
//     não expõe `note` na criação de Mão de obra).
//
// Execução 086 (FE-02): catálogos corretos — Funcionário →
// `/employees/options` (farm + `is_enabled`, sem gate do CRUD), Fornecedor →
// `/providers/options?type=3` (paridade legado); `func_type` vem da fábrica
// `serviceOrderLaborTypeOptions`. O edit hidrata tipo + executor por linha
// (`service-order-form-mapper.ts`).
// -----------------------------------------------------------------------------

import type { ElementType } from 'react';

import { Box, Flex, Icon, SimpleGrid, Text } from '@chakra-ui/react';
import { Controller, useFieldArray } from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { IconButtonTable } from '@/components/IconButtonTable';

import { useLanguage } from '@/hooks/useLanguage';

import { columnsForm } from '@/constants/coluns-form';
import {
  SERVICE_ORDER_LABOR_TYPE,
  serviceOrderLaborTypeOptions,
} from '@/constants/serviceOrders/options/service-order-labor-type-options';

import { listEmployeeOptions } from '@/services/v2/CadastrosBase/Employee/employee-service';
import {
  listProviderOptions,
  type ProviderOptionItem,
} from '@/services/v2/CadastrosBase/Provider/provider-service';
import { listFunctionOptions } from '@/services/v2/Functions/function-service';

import type { Option } from '@/@types/option';
import type { EmployeeOption } from '@/@types/v2/CadastrosBase/employee';
import type { FunctionOption } from '@/@types/v2/Functions';
import type { ServiceOrderForm, ServiceOrderLaborTypeValue } from '@/@types/v2/ServiceOrders';

import type { Control, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';

const LABOR_TYPE_EMPLOYEE = SERVICE_ORDER_LABOR_TYPE.employee;
const LABOR_TYPE_FUNCTION = SERVICE_ORDER_LABOR_TYPE.function;
const LABOR_TYPE_PROVIDER = SERVICE_ORDER_LABOR_TYPE.provider;

// `ProviderTypeEnum` 3 = Fornecedor — mirror do legado
// (`Admin/ServiceOrderController.php:338`, prestadores `type=3` no tenant).
const PROVIDER_TYPE_SUPPLIER = 3;

export interface ServiceOrderLaborTabProps {
  control: Control<ServiceOrderForm>;
  errors: FieldErrors<ServiceOrderForm>;
  watch: UseFormWatch<ServiceOrderForm>;
  setValue: UseFormSetValue<ServiceOrderForm>;
  isLoading: boolean;
  canSave: boolean;
}

export function ServiceOrderLaborTab({
  control,
  watch,
  setValue,
  isLoading,
  canSave,
}: ServiceOrderLaborTabProps) {
  const { languageGB } = useLanguage();
  const formText = languageGB.serviceOrders.serviceOrder.form;

  const { fields, append, remove } = useFieldArray({ control, name: 'employees' });

  const isDisabled = !canSave || isLoading;

  const typeOptions = serviceOrderLaborTypeOptions.options(languageGB);

  function handleAdd() {
    append({
      func_type: null,
      employee_uuid: null,
      function_uuid: null,
      provider_uuid: null,
      note: null,
      is_checked: false,
    });
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
            const rowType = watch(`employees.${index}.func_type`)?.value;

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
                    name={`employees.${index}.func_type`}
                    control={control}
                    render={({ field: rowField }) => (
                      <Select
                        label={formText.labor.fields.funcType}
                        placeholder={formText.labor.placeholders.funcType}
                        name={rowField.name}
                        value={rowField.value}
                        onChange={(option: Option<ServiceOrderLaborTypeValue> | null) => {
                          rowField.onChange(option ?? null);
                          setValue(`employees.${index}.employee_uuid`, null);
                          setValue(`employees.${index}.function_uuid`, null);
                          setValue(`employees.${index}.provider_uuid`, null);
                        }}
                        options={typeOptions}
                        isRequired
                        isDisabled={isDisabled}
                      />
                    )}
                  />

                  {rowType === LABOR_TYPE_EMPLOYEE && (
                    <Controller
                      name={`employees.${index}.employee_uuid`}
                      control={control}
                      render={({ field: rowField }) => (
                        <SelectAsyncPaginate
                          name={rowField.name}
                          label={formText.labor.fields.executor}
                          placeholder={formText.labor.placeholders.executor}
                          service={listEmployeeOptions}
                          mapOptions={(item: EmployeeOption) => ({
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

                  {rowType === LABOR_TYPE_FUNCTION && (
                    <Controller
                      name={`employees.${index}.function_uuid`}
                      control={control}
                      render={({ field: rowField }) => (
                        <SelectAsyncPaginate
                          name={rowField.name}
                          label={formText.labor.fields.executor}
                          placeholder={formText.labor.placeholders.executor}
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

                  {rowType === LABOR_TYPE_PROVIDER && (
                    <Controller
                      name={`employees.${index}.provider_uuid`}
                      control={control}
                      render={({ field: rowField }) => (
                        <SelectAsyncPaginate
                          name={rowField.name}
                          label={formText.labor.fields.executor}
                          placeholder={formText.labor.placeholders.executor}
                          service={listProviderOptions}
                          mapOptions={(item: ProviderOptionItem) => ({
                            label: item.label,
                            value: item.uuid,
                          })}
                          findParams={(search: string | { search: string }) => ({
                            search: typeof search === 'string' ? search : search.search,
                            type: PROVIDER_TYPE_SUPPLIER,
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
