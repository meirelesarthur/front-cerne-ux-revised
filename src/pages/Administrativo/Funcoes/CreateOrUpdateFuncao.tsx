// src/pages/Administrativo/Funcoes/CreateOrUpdateFuncao.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de FUNÇÃO — Administrativo / Gestão Pessoal
// (TASK-FN-FE-02). Rotas: /administrativo/funcoes/novo e
// /administrativo/funcoes/:functionId (GUID), registradas em
// src/router/index.tsx (a rota-mãe da listagem foi registrada pela Tarefa
// irmã TASK-FN-FE-01), guardadas por `functions_view`.
//
// Estrutura mecânica adaptada de CadastrosBase/Marcadores/
// CreateOrUpdateMarcador.tsx (isEditing por GUID, mutação via `useRequest`,
// 422 mapeado por campo via `setError`) — mais simples que o molde porque não
// há upload de arquivo (nenhum estado fora do RHF), mas com 3 componentes
// especializados adicionais que Marker não tem: `SelectAsyncPaginate`
// (cbo_uuid), `MoneyInput` (base_salary) e `InputReadOnly` (vl_time_productive).
//
// ⚠️ CHECKLIST OBRIGATÓRIO desta Tarefa (ver 07-Tarefas_Frontend/
// TASK-FN-FE-02-...md):
//
// 1) Guard `onSubmit` — forma EXPLÍCITA `Object.keys(dirtyFields).length === 0`
//    (NUNCA `isEmpty`/`!isEmpty` do utilitário mal-nomeado — mesmo racional já
//    documentado em `CreateOrUpdateMarcador.tsx`).
// 2) Payload de update COMPLETO (full-resource-replace) — `FunctionRequest`
//    exige todos os campos `required` em ambos os verbos; nunca um delta de
//    `dirtyFields`.
// 3) `cbo_uuid` via `SelectAsyncPaginate` (Controller) — `value={field.value
//    ?? null}` NUNCA `?? undefined` (senão o "Limpar" do form não funciona
//    para este campo), portalizado por padrão (`menuPortalTarget=
//    {document.body}`+`menuPosition="fixed"`, NUNCA `position="fixed"` na
//    instância) — mirror exato de `FilterSideFuncoes.tsx` (TASK-FN-FE-01).
// 4) `base_salary` via `MoneyInput` — o componente entrega sempre o número
//    puro (nunca string mascarada); o payload segue número puro em todos os
//    verbos (elimina estruturalmente a ANOMALIA CRÍTICA do legado, DA-FN-07).
// 5) `vl_time_productive` NUNCA é campo RHF, NUNCA entra no payload —
//    calculado no servidor (DA-FN-08). Exibido via `InputReadOnly` como um
//    PREVIEW calculado ao vivo no cliente (`watch` de `base_salary`/
//    `monthly_hours`), espelhando EXATAMENTE a fórmula do servidor
//    (`round(base_salary / monthly_hours, 2)`, ver
//    `CreateFunctionAction::handle`/`UpdateFunctionAtomicAction::handle`) —
//    o servidor continua sendo a fonte de verdade que recalcula no save;
//    vazio/traço enquanto `monthly_hours` não é um inteiro > 0.
// 6) `fillFunctionForm` é função NOMEADA com guarda EXPLÍCITA
//    `Object.keys(dirtyFields).length === 0 || resetForce` — nunca `reset()`
//    inline em `useEffect`.
// -----------------------------------------------------------------------------

import { Box, SimpleGrid, Text } from '@chakra-ui/react';
import { isAxiosError } from 'axios';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { NumberInput } from '@/components/Form/NumberInput';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';
import { Switch } from '@/components/ui/switch';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { functionSchemaResolver } from '@/validations/schemas/Funcoes/function-schema';

import { listCboOptions } from '@/services/v2/Cbo/cbo-service';
import { createFunction, updateFunction } from '@/services/v2/Functions/function-service';

import type { CboOption } from '@/@types/v2/Cbo';
import type { CreateFunctionRequest, FunctionDetail, FunctionForm } from '@/@types/v2/Functions';

import { useFunctionForm } from './useFunctions';
import { formatVlTimeProductive } from './vlTimeProductive';

export default function CreateOrUpdateFuncao() {
  const { functionId } = useParams<{ functionId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  // É edição quando existe um GUID válido na rota ("novo" não é GUID).
  const isEditing = isValidGuid(functionId);

  const text = languageGB.functions.function;

  const canSave = isEditing ? can('functions_edit') : can('functions_create');

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors, dirtyFields },
  } = useForm<FunctionForm>({
    mode: 'onChange',
    resolver: functionSchemaResolver(languageGB),
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      cbo_uuid: null,
      base_salary: 0,
      monthly_hours: null,
      is_enabled: true,
      description: '',
    },
  });

  // `vl_time_productive` NUNCA é campo RHF (checklist item 5/8 da ficha) — o
  // `reset()` abaixo só popula `base_salary`/`monthly_hours` (campos reais do
  // form); o preview ao vivo (abaixo, `vlTimeProductiveValue`) reage a esse
  // `reset()` via `watch`, sem precisar de estado dedicado próprio.
  function fillFunctionForm(data: FunctionDetail, resetForce?: boolean) {
    const hasNoFormChanges = Object.keys(dirtyFields).length === 0;
    if (hasNoFormChanges || resetForce) {
      reset({
        name: data.name,
        cbo_uuid: { label: `${data.cbo.code} — ${data.cbo.description}`, value: data.cbo.uuid },
        base_salary: Number(data.base_salary),
        monthly_hours: data.monthly_hours,
        is_enabled: data.is_enabled,
        description: data.description,
      });
    }
  }

  const functionQuery = useFunctionForm({
    registrationId: isEditing ? functionId : undefined,
    fillForm: fillFunctionForm,
  });

  const isLoading = isEditing && checkLoadingStatus([functionQuery as any]);

  const [watchedBaseSalary, watchedMonthlyHours] = watch(['base_salary', 'monthly_hours']);
  const vlTimeProductiveValue = formatVlTimeProductive(watchedBaseSalary, watchedMonthlyHours);

  const functionMutation = useRequest({
    asyncFunction: tryPersistFunction,
    entityName: text.singularLabel,
    queryKey: queryKey.functions.functionsList,
    queryKey2: queryKey.functions.function,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  async function tryPersistFunction(data: FunctionForm) {
    // Checklist item 2 — payload sempre FULL-RESOURCE (nunca um delta de
    // `dirtyFields`) — `FunctionRequest` exige todos os campos `required` em
    // ambos os verbos. `vl_time_productive` NUNCA entra aqui (checklist item
    // 8 — confirmado por grep, nenhum `register`/`setValue` deste campo
    // existe neste arquivo).
    const payload: CreateFunctionRequest = {
      name: data.name,
      // Schema Yup (`v.option()`/`v.number()`) já garante `cbo_uuid`/
      // `monthly_hours` preenchidos antes de `onSubmit` disparar a mutação —
      // non-null assertion segura aqui (mesmo padrão de `PackageForm.size`).
      cbo_uuid: data.cbo_uuid!.value,
      base_salary: data.base_salary,
      monthly_hours: data.monthly_hours!,
      is_enabled: !!data.is_enabled,
      description: data.description,
    };

    try {
      return isEditing && functionId
        ? await updateFunction(functionId, payload)
        : await createFunction(payload);
    } catch (error) {
      // 422 do backend mapeado por campo — mesma técnica já usada em
      // `Safra/CreateOrUpdateSafra.tsx`/`Marcadores/CreateOrUpdateMarcador.tsx`
      // (o `throw` preserva o toast genérico que `useRequest` já mostra).
      if (isAxiosError(error) && error.response?.status === 422) {
        const fieldErrors = error.response.data?.errors as Record<string, string[]> | undefined;
        Object.entries(fieldErrors ?? {}).forEach(([field, messages]) => {
          if (messages?.[0]) {
            setError(field as keyof FunctionForm, { type: 'server', message: messages[0] });
          }
        });
      }
      throw error;
    }
  }

  // Checklist item 1 — guard `onSubmit`: checagem EXPLÍCITA
  // `Object.keys(dirtyFields).length === 0`, nunca `isEmpty`/`!isEmpty`
  // (mesmo mandato de `CreateOrUpdateMarcador.tsx`).
  async function onSubmit(data: FunctionForm) {
    const hasNoFormChanges = Object.keys(dirtyFields).length === 0;
    if (isEditing && hasNoFormChanges) {
      navigate(-1);
    } else {
      await functionMutation.mutateAsync(data);
    }
  }

  const isSubmitting = functionMutation.isPending;

  return (
    <FormContainer
      title={isEditing ? text.form.title.edit : text.form.title.create}
      footer={
        <>
          <Button
            title={languageGB.defaltStrings?.cancel || 'Cancelar'}
            variant="secondary"
            type="button"
            onClick={() => navigate(-1)}
          />
          {canSave && (
            <ButtonSaveAndNext
              create={!isEditing}
              dirtyFields={dirtyFields}
              type="button"
              onClick={handleSubmit(onSubmit)}
              languageGB={languageGB}
              loading={isSubmitting}
              disabled={isSubmitting || isLoading}
            />
          )}
        </>
      }
    >
      <Form noPadding onSubmit={handleSubmit(onSubmit)}>
        <SimpleGrid columns={columnsForm.default} gap={6}>
          <Input
            label={text.form.fields.name}
            placeholder={text.form.placeholders.name}
            {...register('name')}
            error={errors.name?.message}
            isRequired
            loading={isLoading}
            disabled={!canSave}
          />

          <Controller
            name="cbo_uuid"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.form.fields.cbo}
                placeholder={text.form.placeholders.cbo}
                service={listCboOptions}
                mapOptions={(item: CboOption) => ({
                  label: `${item.code} — ${item.description}`,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                // Checklist item 3 — `?? null`, NUNCA `?? undefined`.
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                error={error?.message}
                isRequired
                isReadOnly={!canSave}
                // Checklist item 4 — portaliza SÓ esta instância no <body>,
                // NUNCA `position="fixed"` na instância.
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="base_salary"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <MoneyInput
                name={field.name}
                label={text.form.fields.baseSalary}
                value={field.value}
                onValueChange={field.onChange}
                error={error?.message}
                isRequired
                disabled={!canSave}
              />
            )}
          />

          <Controller
            name="monthly_hours"
            control={control}
            render={({ field, fieldState: { error } }) => (
              // Mirror exato de `CreateOrUpdateEmbalagem.tsx` (`size`) —
              // `value={field.value ?? null}` + `onValueChange` repassa o
              // valor cru (`number | null`) direto ao RHF, sem coerção local;
              // a validação `integer().min(1, ...)` do schema Yup é quem
              // rejeita `null`/`0` no submit, nunca o componente.
              <NumberInput
                name={field.name}
                label={text.form.fields.monthlyHours}
                value={field.value ?? null}
                onValueChange={(value) => field.onChange(value)}
                error={error?.message}
                isRequired
                allowDot={false}
                decimalPlaces={0}
                min={1}
                disabled={!canSave}
              />
            )}
          />

          <InputReadOnly
            label={text.form.fields.vlTimeProductive}
            value={vlTimeProductiveValue}
            loading={isLoading}
          />

          <Controller
            name="is_enabled"
            control={control}
            render={({ field }) => (
              <Box display="flex" alignItems="center" justifyContent="space-between" h="full">
                <Text fontSize="sm" fontWeight="medium">
                  {text.form.fields.isEnabled}
                </Text>
                {/* @ts-ignore - Chakra UI v3 Switch API */}
                <Switch
                  checked={!!field.value}
                  onCheckedChange={(d: any) => field.onChange(d.checked)}
                  colorPalette="green"
                  disabled={!canSave || isLoading}
                  aria-label={text.form.fields.isEnabled}
                />
              </Box>
            )}
          />

          <Input
            label={text.form.fields.description}
            placeholder={text.form.placeholders.description}
            {...register('description')}
            error={errors.description?.message}
            isRequired
            loading={isLoading}
            disabled={!canSave}
          />
        </SimpleGrid>
      </Form>
    </FormContainer>
  );
}
