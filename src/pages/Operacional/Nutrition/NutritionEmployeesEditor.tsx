// src/pages/Operacional/Nutrition/NutritionEmployeesEditor.tsx
// -----------------------------------------------------------------------------
// Editor de mão-de-obra "Controle de Horas" (Nutrition — Operacional, F-050,
// esteira 066, TASK-NT-FE-04, SRF-06). `useFieldArray({ name: 'employees' })`
// vive no PAI (`CreateOrUpdateNutrition.tsx`), MESMA decisão arquitetural de
// `items`/`NutritionItemsEditor.tsx` (RHF não tolera bem trocar o shape do
// form por condição). Renderizado condicionalmente pelo pai SÓ quando
// `time_control === true` (guard no JSX do pai, ver `## Objetivo` da ficha —
// sem campos escondidos com `display:none`).
//
// Fidelidade visual (`cerne`, adaptação à stack): sem Referência UX própria
// publicada para esta aba (nota de LACUNA provisória do agente, `get_spa_ux_
// fidelity_pattern`/`get_spa_*` ainda não cobrem esta superfície) — a seção
// é montada com o MESMO idioma visual já em produção no formulário-irmão
// desta MESMA tela (`NutritionItemsEditor.tsx`: `Box bg="bg.muted"` +
// `Text` de `sectionTitle` + linhas em cards bordados), não um `Tabs.Root`
// (Chakra v3) de aba única — o catálogo de composições complexas
// (`get_pwa_complex_screen_compositions_pattern`) só documenta `Tabs.Root`
// para navegação entre 2+ seções irmãs (ex.: Form + Grids do mesmo
// registro); aqui há uma única seção condicional, então o card mirror do
// sibling é a composição fiel — sem inventar uma navegação por abas que não
// existe em nenhum outro ponto deste MESMO formulário.
//
// Cascata `func_type` (FLD-16) → `func_executor_id` (FLD-17, Risco 1 da
// ficha): mudar o tipo troca a FONTE do catálogo do executor E limpa
// IMEDIATAMENTE o executor da mesma linha (nunca deixar um uuid de uma fonte
// diferente sobrando) — mirror ESTRUTURAL de
// `AppropriationLaborTab.tsx::LaborItemRow` (mesma regra de negócio "3 tipos
// de executor mutuamente exclusivos", 3 `SelectAsyncPaginate` condicionais
// por `rowType`, não 1 único componente genérico com `service` trocado em
// runtime — evita cache cruzado do `react-select-async-paginate` entre
// fontes diferentes).
//
// 3 services de executor REUSADOS, ZERO lookup próprio novo (Inspeção
// Obrigatória da ficha — nenhum dos 6 lookups de `nutrition-lookup-service.ts`
// cobre isto, DA-NT-05 documenta explicitamente que Employee/Function/
// Provider ficam de fora dos lookups próprios de Nutrição):
//   - `func_type=1` (Funcionário) → `listEmployeeOptions` (`/employees/options`,
//     SEM gate de `employees_view`, mesmo racional documentado no próprio
//     service — mirror `FilterSideNutrition.tsx`, MESMA pasta desta Tarefa).
//   - `func_type=2` (Função)      → `listFunctionOptions` (`/functions/options`).
//   - `func_type=3` (Fornecedor)  → `listProviderOptions` (`/providers/options`).
//   - `func_um` (FLD-18)          → `listMeasurementOptions` (`/measurements/
//     options`, mesmo catálogo genérico já usado em `NutritionItemsEditor.tsx`
//     não é aqui, mas em `AppropriationLaborTab.tsx` — reuso confirmado).
//
// `.service-quantity`/`.used-area` (`CLM-07`, JS morto do legado) — Risco 2
// da ficha, NÃO reimplementado (achado de dead-code, não requisito).
//
// Obrigatoriedade condicional (`DA-NT-08`, fecha `CLM-05`) — já fechada
// 100% em `nutrition-schema.ts` (`TASK-NT-FE-01`): os 4 campos desta linha
// são `required` via `.when('time_control', ...)` — nenhuma validação nova
// necessária nesta Tarefa, só a UI que os popula.
// -----------------------------------------------------------------------------

import type { ElementType } from 'react';

import { Box, Flex, Icon, SimpleGrid, Text } from '@chakra-ui/react';
import {
  Control,
  FieldArrayWithId,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
  useController,
} from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { IconButtonTable } from '@/components/IconButtonTable';

import { columnsForm } from '@/constants/coluns-form';
import { funcTypeOptions } from '@/constants/operational/nutrition/options/func-type-options';

import { listEmployeeOptions } from '@/services/v2/CadastrosBase/Employee/employee-service';
import { listProviderOptions } from '@/services/v2/CadastrosBase/Provider/provider-service';
import type { ProviderOptionItem } from '@/services/v2/CadastrosBase/Provider/provider-service';
import { listFunctionOptions } from '@/services/v2/Functions/function-service';
import { listMeasurementOptions } from '@/services/v2/Measurements/measurement-service';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { EmployeeOption } from '@/@types/v2/CadastrosBase/employee';
import type { FunctionOption } from '@/@types/v2/Functions';
import type { MeasurementOption } from '@/@types/v2/Measurements';
import type { FuncType, NutritionEmployeeForm, NutritionForm } from '@/@types/v2/Nutritions';

// `FuncTypeEnum` (`DA-NT-07`) — mirror local dos valores 1/2/3, mesma
// convenção de `LABOR_TYPE_EMPLOYEE/FUNCTION/PROVIDER` de
// `AppropriationLaborTab.tsx`.
const FUNC_TYPE_EMPLOYEE: FuncType = 1;
const FUNC_TYPE_FUNCTION: FuncType = 2;
const FUNC_TYPE_PROVIDER: FuncType = 3;

const findParamsFromSearch = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
});

export interface NutritionEmployeesFieldValues {
  employees: NutritionEmployeeForm[];
}

export interface NutritionEmployeesEditorProps {
  /** `control` do `useForm` do formulário PAI (`NutritionForm`) — mirror
   *  EXATO de `NutritionItemsEditorProps.control` (cast local para
   *  `Control<NutritionEmployeesFieldValues>` dentro do componente, nunca na
   *  fronteira pública). */
  control: Control<NutritionForm>;
  /** `fields` do `useFieldArray({ control, name: 'employees' })` do PAI. */
  fields: FieldArrayWithId<NutritionEmployeesFieldValues, 'employees', 'id'>[];
  append: UseFieldArrayAppend<NutritionEmployeesFieldValues, 'employees'>;
  remove: UseFieldArrayRemove;
  languageGB: LanguageDate;
  disabled?: boolean;
}

interface NutritionEmployeeRowProps {
  control: Control<NutritionEmployeesFieldValues>;
  index: number;
  remove: UseFieldArrayRemove;
  languageGB: LanguageDate;
  disabled: boolean;
}

function NutritionEmployeeRow({
  control,
  index,
  remove,
  languageGB,
  disabled,
}: NutritionEmployeeRowProps) {
  const text = languageGB.nutritions.nutrition.form.fields.employee;

  const { field: funcTypeField, fieldState: funcTypeFieldState } = useController({
    control,
    name: `employees.${index}.func_type`,
  });
  const { field: funcExecutorField, fieldState: funcExecutorFieldState } = useController({
    control,
    name: `employees.${index}.func_executor_id`,
  });
  const { field: funcUmField, fieldState: funcUmFieldState } = useController({
    control,
    name: `employees.${index}.func_um`,
  });
  const { field: funcTotalField, fieldState: funcTotalFieldState } = useController({
    control,
    name: `employees.${index}.func_total_quantity`,
  });

  const funcTypeValue = funcTypeField.value?.value ?? null;

  // Guard de campo condicional (Risco 1 da ficha) — trocar `func_type` LIMPA
  // `func_executor_id` da MESMA linha, nunca deixando um `uuid` de uma fonte
  // (employees|functions|providers) diferente sobrando.
  function handleFuncTypeChange(option: Option<FuncType> | null) {
    funcTypeField.onChange(option ?? null);
    funcExecutorField.onChange(null);
  }

  return (
    <Box p={4} border="1px solid" borderColor="border.subtle" borderRadius="lg">
      <SimpleGrid columns={columnsForm.fourColumns} gap={4}>
        {/* `func_type` (FLD-16) — options factory `func-type-options.ts`
            (`TASK-NT-FE-01`). */}
        <Select
          name={funcTypeField.name}
          label={text.funcType}
          options={funcTypeOptions.options(languageGB)}
          value={funcTypeField.value ?? null}
          onChange={handleFuncTypeChange}
          error={funcTypeFieldState.error?.message}
          isRequired
          isDisabled={disabled}
        />

        {/* `func_executor_id` (FLD-17) — cascata: catálogo trocado por
            `func_type`, 1 `SelectAsyncPaginate` condicional por tipo (mirror
            `AppropriationLaborTab.tsx::LaborItemRow`, evita cache cruzado do
            `react-select-async-paginate` entre fontes diferentes). */}
        {funcTypeValue === FUNC_TYPE_EMPLOYEE && (
          <SelectAsyncPaginate
            name={funcExecutorField.name}
            label={text.funcExecutor}
            service={listEmployeeOptions}
            mapOptions={(item: EmployeeOption) => ({ label: item.name, value: item.uuid })}
            findParams={findParamsFromSearch}
            value={funcExecutorField.value ?? undefined}
            onChange={(option: any) => funcExecutorField.onChange(option ?? null)}
            error={funcExecutorFieldState.error?.message}
            isRequired
            isDisabled={disabled}
            menuPortalTarget={document.body}
            menuPosition="fixed"
          />
        )}

        {funcTypeValue === FUNC_TYPE_FUNCTION && (
          <SelectAsyncPaginate
            name={funcExecutorField.name}
            label={text.funcExecutor}
            service={listFunctionOptions}
            mapOptions={(item: FunctionOption) => ({ label: item.name, value: item.uuid })}
            findParams={findParamsFromSearch}
            value={funcExecutorField.value ?? undefined}
            onChange={(option: any) => funcExecutorField.onChange(option ?? null)}
            error={funcExecutorFieldState.error?.message}
            isRequired
            isDisabled={disabled}
            menuPortalTarget={document.body}
            menuPosition="fixed"
          />
        )}

        {funcTypeValue === FUNC_TYPE_PROVIDER && (
          <SelectAsyncPaginate
            name={funcExecutorField.name}
            label={text.funcExecutor}
            service={listProviderOptions}
            mapOptions={(item: ProviderOptionItem) => ({ label: item.label, value: item.uuid })}
            findParams={findParamsFromSearch}
            value={funcExecutorField.value ?? undefined}
            onChange={(option: any) => funcExecutorField.onChange(option ?? null)}
            error={funcExecutorFieldState.error?.message}
            isRequired
            isDisabled={disabled}
            menuPortalTarget={document.body}
            menuPosition="fixed"
          />
        )}

        {/* `func_um` (FLD-18) — catálogo genérico já migrado, SEM lookup
            próprio (Inspeção Obrigatória da ficha). */}
        <SelectAsyncPaginate
          name={funcUmField.name}
          label={text.funcUm}
          service={listMeasurementOptions}
          mapOptions={(item: MeasurementOption) => ({ label: item.description, value: item.uuid })}
          findParams={findParamsFromSearch}
          value={funcUmField.value ?? undefined}
          onChange={(option: any) => funcUmField.onChange(option ?? null)}
          error={funcUmFieldState.error?.message}
          isRequired
          isDisabled={disabled}
          menuPortalTarget={document.body}
          menuPosition="fixed"
        />

        {/* `func_total_quantity` (FLD-19) — `.service-quantity`/`.used-area`
            (Risco 2, `CLM-07`) NÃO reimplementados (JS morto do legado). */}
        <NumberInput
          name={funcTotalField.name}
          label={text.funcTotalQuantity}
          allowDot
          decimalPlaces={2}
          min={0}
          value={Number(funcTotalField.value) || 0}
          onValueChange={(value) => funcTotalField.onChange(value ?? '')}
          error={funcTotalFieldState.error?.message}
          isRequired
          disabled={disabled}
        />
      </SimpleGrid>

      <Flex justify="flex-end" mt={3}>
        <IconButtonTable
          type="button"
          aria-label={text.removeEmployee}
          mensegerTooltip={text.removeEmployee}
          size="sm"
          color="red.500"
          variant="ghost"
          disabled={disabled}
          onClick={() => remove(index)}
        >
          <Icon as={FiTrash2} />
        </IconButtonTable>
      </Flex>
    </Box>
  );
}

export function NutritionEmployeesEditor({
  control,
  fields,
  append,
  remove,
  languageGB,
  disabled = false,
}: NutritionEmployeesEditorProps) {
  const text = languageGB.nutritions.nutrition.form.fields.employee;

  // Cast local (não vaza na API pública) — mesmo racional de
  // `NutritionItemsEditor.tsx::genericControl`.
  const genericControl = control as unknown as Control<NutritionEmployeesFieldValues>;

  function handleAdd() {
    const employee: NutritionEmployeeForm = {
      func_type: null,
      func_executor_id: null,
      func_um: null,
      func_total_quantity: '',
    };
    append(employee);
  }

  return (
    <Box
      bg="bg.muted"
      border="1px solid"
      borderColor="border.subtle"
      borderRadius="lg"
      p={4}
      mt={6}
    >
      <Text fontSize="sm" fontWeight="semibold" mb={4}>
        {text.sectionTitle}
      </Text>

      {fields.length > 0 && (
        <Flex direction="column" gap={4} mb={4}>
          {fields.map((field, index) => (
            <NutritionEmployeeRow
              key={field.id}
              control={genericControl}
              index={index}
              remove={remove}
              languageGB={languageGB}
              disabled={disabled}
            />
          ))}
        </Flex>
      )}

      <Button
        type="button"
        title={text.addEmployee}
        icon={FiPlus as ElementType}
        variant="outline"
        size="sm"
        onClick={handleAdd}
        disabled={disabled}
      />
    </Box>
  );
}

export default NutritionEmployeesEditor;
