// src/pages/Operacional/Nutrition/ViewNutrition.tsx
// -----------------------------------------------------------------------------
// Tela de VISUALIZAÇÃO (read-only) de uma Nutrição (Nutrition — Operacional,
// F-050, esteira 066, TASK-NT-FE-05, SRF-07). Rota
// `/operacional/nutricao/:id/visualizar` — guardada por
// `<RequirePermission permission="nutrition_view">` (`router/index.tsx`,
// consolidada junto às demais rotas do módulo, TASK-NT-FE-02/03/05).
//
// ⚠️ Ajuste de rota vs. o texto literal da Tarefa (`/operational/nutritions/
// :id/view`, em inglês): mesma divergência de fidelidade JÁ DECLARADA em
// `CreateOrUpdateNutrition.tsx` — a rota REAL segue o padrão PT-BR do módulo
// (`/operacional/nutricao/novo`, `/operacional/nutricao/:id`), aqui
// `/operacional/nutricao/:id/visualizar` (sufixo mirror `DetalheFeedlotSector
// .tsx`/`.../detalhe`, adaptado a `visualizar` por ser o termo já usado no
// próprio i18n do módulo — `text.list.actions.view` = "Ver").
//
// ⚠️ Ajuste vs. o texto literal da Tarefa quanto ao roteador
// (`ProtectedModuleRoute moduleName="Nutrition"`/`useSuspenseLoader: true`
// por entrada): este router NÃO usa o componente `ProtectedModuleRoute`
// (`get_pwa_security_and_tier_guards_pattern` descreve um padrão abstrato de
// projeto mais novo) — a convenção REAL, já usada por TODAS as rotas
// Sanitário/Pesagem/Planos/etc. deste fork, é `<RequirePermission
// permission="...">` por rota (guard de AÇÃO), com o guard de MÓDULO feito
// implicitamente pelo catch-all `/operacional/*` (`RoutePlaceholder`) +
// `navigationTree.ts`/`navigationPermissions.ts` (`ope-pec-man-nut` →
// `nutrition_view`, já cadastrado em `TASK-NT-FE-02`). `useSuspenseLoader` já
// é o comportamento PADRÃO (sempre ativo) do helper `lazyRoute()` deste
// router — nada a acrescentar por rota. Seguido aqui o padrão REAL do
// roteador (mirror EXATO das 3 rotas irmãs já commitadas), não o literal do
// template da ficha — divergência de fidelidade declarada, não silenciosa
// (mesmo racional já registrado em `CreateOrUpdateNutrition.tsx`).
//
// Composição: reaproveita a MESMA composição visual de `CreateOrUpdateNutrition
// .tsx` (cabeçalho + `NutritionItemsEditor`/`NutritionEmployeesEditor`) em modo
// leitura — decisão da própria ficha ("reaproveitar os componentes de
// TASK-NT-FE-03/04 em modo readOnly é preferível a duplicar JSX"). TODOS os
// campos do cabeçalho são `InputReadOnly`/`disabled`; os 2 editores recebem
// `disabled` (desabilita every input + os botões Adicionar/Remover, mirror
// exato do prop já suportado por ambos desde TASK-NT-FE-03/04 — nenhuma
// mudança nesses 2 arquivos). Reaproveitar o editor de itens também herda de
// graça a resolução ao vivo de `qnt_stock`/`product_um` (`DA-NT-04`, LK-05) —
// a Tarefa pede "estoque" na visualização e o componente já resolve isso
// sozinho via cascata interna, mesmo com os campos desabilitados.
//
// Mão-de-obra (SRF-06) — mesma regra condicional de `CreateOrUpdateNutrition
// .tsx`/`TASK-NT-FE-04`: seção só monta se `time_control === true` (guard no
// JSX, sem `display:none`).
//
// "Responsável" (FLD-03) — fonte de verdade: `employee_or_user_name` devolvido
// pelo `show` (`GET /nutritions/{uuid}`, COALESCE funcionário > usuário).
// Fallback por melhor esforço: `location.state` repassado pela ação "Ver" da
// listagem (`index.tsx`), usado só se o campo vier vazio. Senão "—" (nenhum
// valor inventado, SEM MOCK).
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { SimpleGrid } from '@chakra-ui/react';
import { useFieldArray, useForm } from 'react-hook-form';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { FormContainer } from '@/components/Layout/FormContainer';
import { Switch } from '@/components/ui/switch';

import { useCustomFormQueryById } from '@/hooks/useCustomFormQueryById';
import { useLanguage } from '@/hooks/useLanguage';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';

import { funcTypeOptions } from '@/constants/operational/nutrition/options/func-type-options';
import { queryKey } from '@/constants/query-key';

import { listMeasurementOptions } from '@/services/v2/Measurements/measurement-service';
import { getNutrition } from '@/services/v2/Nutritions/nutrition-service';

import type {
  NutritionData,
  NutritionEmployeeData,
  NutritionForm as NutritionFormType,
} from '@/@types/v2/Nutritions';

import { mapNutritionItemToForm } from './nutrition-item-form-mapper';
import { NutritionEmployeesEditor } from './NutritionEmployeesEditor';
import { NutritionItemsEditor } from './NutritionItemsEditor';

import type { NutritionEmployeesFieldValues } from './NutritionEmployeesEditor';
import type { NutritionItemsFieldValues } from './NutritionItemsEditor';
import type { UseFieldArrayAppend } from 'react-hook-form';

const NUTRITION_LIST_ROUTE = '/operacional/nutricao';

export default function ViewNutrition() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { languageGB } = useLanguage();
  const text = languageGB.nutritions.nutrition;
  const header = text.form.fields.header;

  // Fallback (ver docblock) — nome da LISTAGEM, ecoado via `state` pela ação
  // "Ver" (`index.tsx`); só vale se o `show` não trouxer o campo.
  const stateEmployeeOrUserName =
    (location.state as { employeeOrUserName?: string } | null)?.employeeOrUserName ?? null;
  const [showEmployeeOrUserName, setShowEmployeeOrUserName] = useState<string | null>(null);
  const employeeOrUserName = showEmployeeOrUserName || stateEmployeeOrUserName || null;

  // Guard de navegação — `id` mal formado (não-GUID) não tem estado válido
  // nenhum (mirror `CreateOrUpdateNutrition.tsx`/`UpdateWarehouseTransfer.tsx`).
  // `useEffect` (não early-return antes dos hooks) — mesma ordem de hooks em
  // TODO render, `return null` só depois de todos declarados (Rules of Hooks).
  const isValidRouteId = isValidGuid(id);

  useEffect(() => {
    if (!isValidRouteId) {
      navigate(NUTRITION_LIST_ROUTE, { replace: true });
    }
  }, [isValidRouteId, navigate]);

  const { control, setValue, watch, reset, formState } = useForm<NutritionFormType>({
    mode: 'onChange',
    defaultValues: {
      code: '',
      date: '',
      user_name: '',
      time_control: false,
      items: [],
      employees: [],
    },
  });
  const { errors } = formState;

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const {
    fields: employeeFields,
    append: appendEmployee,
    remove: removeEmployee,
  } = useFieldArray({ control, name: 'employees' });

  const timeControlValue = watch('time_control');

  // Melhor esforço IDÊNTICO a `CreateOrUpdateNutrition.tsx` — `func_um`
  // (`GET /nutritions/{uuid}`) só traz a DESCRIÇÃO, sem `uuid`; casa por
  // descrição EXATA contra `listMeasurementOptions`. Ambíguo/não encontrado
  // fica honestamente vazio.
  async function resolveEmployeesFuncUm(employees: NutritionEmployeeData[]) {
    if (employees.length === 0) return;
    try {
      const measurementOptions = await listMeasurementOptions({});
      const measurements = measurementOptions.data.items;
      employees.forEach((employee, index) => {
        if (!employee.func_um) return;
        const matches = measurements.filter((item) => item.description === employee.func_um);
        if (matches.length !== 1) return;
        setValue(
          `employees.${index}.func_um`,
          { label: matches[0].description, value: matches[0].uuid },
          { shouldDirty: false, shouldValidate: false }
        );
      });
    } catch {
      // Silencioso — estado honesto mantido, sem toast bloqueante.
    }
  }

  // `fillForm` — sempre chamado com `resetForce=true` por
  // `useCustomFormQueryById` (tela 100% leitura, nunca há `dirtyFields` para
  // proteger).
  function fillForm(data: NutritionData) {
    setShowEmployeeOrUserName(data.employee_or_user_name ?? null);
    reset({
      code: data.code,
      date: data.date ? data.date.slice(0, 10) : '',
      user_name: data.employee_or_user_name || stateEmployeeOrUserName || '',
      time_control: !!data.time_control,
      items: data.items.map(mapNutritionItemToForm),
      employees: data.employees.map((employee) => ({
        uuid: employee.uuid,
        func_type: funcTypeOptions.getOption(employee.func_type, languageGB),
        func_executor_id: {
          label: employee.func_executor.name,
          value: employee.func_executor.uuid,
        },
        func_um: null,
        func_total_quantity: Number(employee.func_total_quantity) || 0,
      })),
    });

    void resolveEmployeesFuncUm(data.employees);
  }

  const nutritionQuery = useCustomFormQueryById<NutritionData>({
    registrationId: id ?? '',
    queryKey: queryKey.nutritions.nutrition,
    asyncFunction: getNutrition,
    fillForm,
  });

  const isLoading = checkLoadingStatus([nutritionQuery as any]);
  const nutritionDetail = (nutritionQuery as any)?.data as NutritionData | undefined;

  if (!isValidRouteId) return null;

  return (
    <FormContainer
      title={text.form.title.view}
      footer={
        <Button
          title={text.detail.back}
          variant="outline"
          type="button"
          onClick={() => navigate(-1)}
        />
      }
    >
      <Form noPadding>
        {/* Cabeçalho — mesma ORDEM de `CreateOrUpdateNutrition.tsx`, 100%
            read-only (nenhum campo editável). */}
        <SimpleGrid columns={4} gap={6}>
          <InputReadOnly
            name="code"
            label={header.code}
            value={nutritionDetail?.code ?? '—'}
            loading={!!isLoading}
          />

          <DateInput
            value={nutritionDetail?.date ? nutritionDetail.date.slice(0, 10) : null}
            onChange={() => {}}
            label={header.date}
            disabled
          />

          <InputReadOnly label={header.user} value={employeeOrUserName ?? '—'} />

          <Switch checked={!!timeControlValue} disabled aria-label={header.timeControl}>
            {header.timeControl}
          </Switch>
        </SimpleGrid>

        {/* Cards de item — reuso 100% read-only (`disabled`), herda de graça
            a resolução ao vivo de estoque/unidade (`DA-NT-04`). */}
        <SimpleGrid columns={1} mt={6}>
          <NutritionItemsEditor
            control={control}
            setValue={setValue}
            fields={fields}
            append={append as unknown as UseFieldArrayAppend<NutritionItemsFieldValues, 'items'>}
            remove={remove}
            errors={errors}
            languageGB={languageGB}
            isEditing
            disabled
            savedBatches={nutritionDetail?.items?.flatMap((item) => item.batches ?? [])}
          />
        </SimpleGrid>

        {/* Mão-de-obra (SRF-06) — só monta se `time_control === true`, mesma
            regra condicional de `CreateOrUpdateNutrition.tsx`/`TASK-NT-FE-04`. */}
        {timeControlValue && (
          <SimpleGrid columns={1} mt={0}>
            <NutritionEmployeesEditor
              control={control}
              fields={employeeFields}
              append={
                appendEmployee as unknown as UseFieldArrayAppend<
                  NutritionEmployeesFieldValues,
                  'employees'
                >
              }
              remove={removeEmployee}
              languageGB={languageGB}
              disabled
            />
          </SimpleGrid>
        )}
      </Form>
    </FormContainer>
  );
}
