// src/pages/Operacional/Sanitario/SanitaryLaborRow.tsx
// -----------------------------------------------------------------------------
// Linha do repeater de mão de obra do formulário de Sanitário — FS-01..04
// (F-062, TASK-SAN-FE-05, contrato-tela-lane-c-sanitario-frontend.md §6.5).
// Mirror EXATO do domínio de `ServiceOrders/tabs/ServiceOrderLaborTab.tsx`
// (Tipo 1=Funcionário/2=Função/3=Fornecedor, trocar o tipo limpa os 3 uuids,
// exatamente 1 executor preenchido por linha — Regra 1 da Tarefa) + o
// precedente de `Appropriations/tabs/AppropriationLaborTab.tsx` para o par
// Un.Medida/Quantidade Total (`listMeasurementOptions`, catálogo GENÉRICO
// sem filtro de produto — mesmo racional: esta linha não tem produto
// associado, "não restringir" é a fidelidade correta).
//
// ÚNICA diferença deste domínio para `ServiceOrderLaborTab`: +2 campos
// (`measurement_uuid`/`total_quantity`, FS-03/FS-04) e NENHUM campo
// `amount`/"Valor" — nem aqui, nem lá (Regra 2 da Tarefa; CTR-SAN §4.1, o
// servidor calcula sozinho a partir do cadastro do executor, nunca exposto
// no form de criação/edição).
//
// Decomposição em componente PRÓPRIO por linha (1 componente por linha) —
// mirror estrutural de `SanitaryItemRow.tsx`, o sibling real desta mesma
// tela (Section+Row via `useController` por campo), não o padrão inline-no-
// `.map()` de `ServiceOrderLaborTab`/`AppropriationLaborTab` (que resolvem
// tudo dentro da própria aba) — paridade de arquitetura com o resto do
// módulo Sanitário prevalece sobre paridade literal de forma com o mirror
// de domínio, que é preservado no comportamento (não na decomposição).
// -----------------------------------------------------------------------------

import { Box, Flex, Icon } from '@chakra-ui/react';
import { Control, useController } from 'react-hook-form';
import { FiTrash2 } from 'react-icons/fi';

import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { IconButtonTable } from '@/components/IconButtonTable';

import { listEmployees } from '@/services/v2/CadastrosBase/Employee/employee-service';
import { listProviders } from '@/services/v2/CadastrosBase/Provider/provider-service';
import { listFunctionOptions } from '@/services/v2/Functions/function-service';
import { listMeasurementOptions } from '@/services/v2/Measurements/measurement-service';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { EmployeeListItem } from '@/@types/v2/CadastrosBase/employee';
import type { ProviderListItem } from '@/@types/v2/CadastrosBase/provider';
import type { FunctionOption } from '@/@types/v2/Functions';
import type { MeasurementOption } from '@/@types/v2/Measurements';
import type { SanitaryFormValues, SanitaryLaborFuncTypeValue } from '@/@types/v2/Sanitaries';

const LABOR_TYPE_EMPLOYEE = 1;
const LABOR_TYPE_FUNCTION = 2;
const LABOR_TYPE_PROVIDER = 3;

const findParamsFromSearch = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
});

export interface SanitaryLaborRowProps {
  control: Control<SanitaryFormValues>;
  index: number;
  onRemove: () => void;
  languageGB: LanguageDate;
  isDisabled?: boolean;
}

export function SanitaryLaborRow({
  control,
  index,
  onRemove,
  languageGB,
  isDisabled,
}: SanitaryLaborRowProps) {
  const text = languageGB.sanitary.sanitary.form;

  const { field: funcTypeField, fieldState: funcTypeFieldState } = useController({
    control,
    name: `labor.${index}.func_type`,
  });
  const { field: employeeField, fieldState: employeeFieldState } = useController({
    control,
    name: `labor.${index}.employee_uuid`,
  });
  const { field: functionField, fieldState: functionFieldState } = useController({
    control,
    name: `labor.${index}.function_uuid`,
  });
  const { field: providerField, fieldState: providerFieldState } = useController({
    control,
    name: `labor.${index}.provider_uuid`,
  });
  const { field: measurementField, fieldState: measurementFieldState } = useController({
    control,
    name: `labor.${index}.measurement_uuid`,
  });
  const { field: totalQuantityField, fieldState: totalQuantityFieldState } = useController({
    control,
    name: `labor.${index}.total_quantity`,
  });

  const typeOptions: Option<SanitaryLaborFuncTypeValue>[] = [
    { value: LABOR_TYPE_EMPLOYEE, label: text.funcTypeOptions.employee },
    { value: LABOR_TYPE_FUNCTION, label: text.funcTypeOptions.function },
    { value: LABOR_TYPE_PROVIDER, label: text.funcTypeOptions.provider },
  ];

  const rowType = funcTypeField.value?.value;

  // Trocar `func_type` limpa os 3 uuids — exatamente 1 executor preenchido
  // por linha (mirror `ServiceOrderLaborTab`, Regra 1 da Tarefa).
  function handleFuncTypeChange(option: Option<SanitaryLaborFuncTypeValue> | null) {
    funcTypeField.onChange(option ?? null);
    employeeField.onChange(null);
    functionField.onChange(null);
    providerField.onChange(null);
  }

  return (
    <Box p={4} border="1px solid" borderColor="border.subtle" borderRadius="lg">
      <Flex gap={3} align="flex-start" wrap="wrap">
        <Box flex="1" minW="180px">
          <Select
            name={funcTypeField.name}
            label={text.fields.funcType}
            placeholder={text.placeholders.funcType}
            value={funcTypeField.value ?? null}
            onChange={handleFuncTypeChange}
            options={typeOptions}
            error={funcTypeFieldState.error?.message}
            isRequired
            isDisabled={isDisabled}
          />
        </Box>

        {rowType === LABOR_TYPE_EMPLOYEE && (
          <Box flex="2" minW="220px">
            <SelectAsyncPaginate
              name={employeeField.name}
              label={text.fields.executor}
              placeholder={text.placeholders.executor}
              service={listEmployees}
              mapOptions={(item: EmployeeListItem) => ({ label: item.name, value: item.uuid })}
              findParams={findParamsFromSearch}
              value={employeeField.value ?? null}
              onChange={(option: unknown) =>
                employeeField.onChange((option as Option<string>) ?? null)
              }
              error={employeeFieldState.error?.message}
              isRequired
              isDisabled={isDisabled}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          </Box>
        )}

        {rowType === LABOR_TYPE_FUNCTION && (
          <Box flex="2" minW="220px">
            <SelectAsyncPaginate
              name={functionField.name}
              label={text.fields.executor}
              placeholder={text.placeholders.executor}
              service={listFunctionOptions}
              mapOptions={(item: FunctionOption) => ({ label: item.name, value: item.uuid })}
              findParams={findParamsFromSearch}
              value={functionField.value ?? null}
              onChange={(option: unknown) =>
                functionField.onChange((option as Option<string>) ?? null)
              }
              error={functionFieldState.error?.message}
              isRequired
              isDisabled={isDisabled}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          </Box>
        )}

        {rowType === LABOR_TYPE_PROVIDER && (
          <Box flex="2" minW="220px">
            <SelectAsyncPaginate
              name={providerField.name}
              label={text.fields.executor}
              placeholder={text.placeholders.executor}
              service={listProviders}
              mapOptions={(item: ProviderListItem) => ({ label: item.name, value: item.uuid })}
              findParams={findParamsFromSearch}
              value={providerField.value ?? null}
              onChange={(option: unknown) =>
                providerField.onChange((option as Option<string>) ?? null)
              }
              error={providerFieldState.error?.message}
              isRequired
              isDisabled={isDisabled}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          </Box>
        )}

        <Box flex="1" minW="180px">
          <SelectAsyncPaginate
            name={measurementField.name}
            label={text.fields.measurement}
            placeholder={text.placeholders.measurement}
            service={listMeasurementOptions}
            mapOptions={(item: MeasurementOption) => ({
              label: item.description || item.name,
              value: item.uuid,
            })}
            findParams={findParamsFromSearch}
            value={measurementField.value ?? null}
            onChange={(option: unknown) =>
              measurementField.onChange((option as Option<string>) ?? null)
            }
            error={measurementFieldState.error?.message}
            isRequired
            isDisabled={isDisabled}
            menuPortalTarget={document.body}
            menuPosition="fixed"
          />
        </Box>

        <Box w={{ base: 'full', sm: '160px' }}>
          <NumberInput
            name={totalQuantityField.name}
            label={text.fields.totalQuantity}
            allowDot
            decimalPlaces={2}
            min={0}
            value={totalQuantityField.value === '' ? null : Number(totalQuantityField.value)}
            onValueChange={(value) => totalQuantityField.onChange(value ?? '')}
            error={totalQuantityFieldState.error?.message}
            isRequired
            disabled={isDisabled}
          />
        </Box>

        <Flex direction="column" gap="1.5">
          <Flex alignItems="center" fontSize="14px" visibility="hidden">
            {text.removeLabor}
          </Flex>
          <IconButtonTable
            type="button"
            aria-label={text.removeLabor}
            mensegerTooltip={text.removeLabor}
            size="sm"
            color="red.500"
            variant="ghost"
            disabled={isDisabled}
            onClick={onRemove}
          >
            <Icon as={FiTrash2} />
          </IconButtonTable>
        </Flex>
      </Flex>
    </Box>
  );
}

export default SanitaryLaborRow;
