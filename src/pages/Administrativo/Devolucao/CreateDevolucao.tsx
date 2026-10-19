// src/pages/Administrativo/Devolucao/CreateDevolucao.tsx
// -----------------------------------------------------------------------------
// Formulário de CRIAÇÃO (lote) de Devolução/Entrada (Devolution — Estoque,
// 97-Esteiras/037, Tarefa 08). Rota `/administrativo/devolucao/novo`,
// guardada por `<RequirePermission permission="devolution_create">`.
// `POST /devolutions` em lote (`items[]`, 1 `code` gerado no servidor).
//
// Mirror ESTRUTURAL DIRETO de `CreateRequisition.tsx` +
// `RequisitionItemsEditor.tsx`, COM as divergências do roteiro:
//   - `date` é campo EDITÁVEL real (`Input type="date"`, `register('date')`,
//     `required`) — NÃO readonly como em `Requisition` (divergência #3).
//   - `requester` é do CABEÇALHO.
//   - Itens NÃO têm armazém persistido — `warehouse_id` por linha é
//     CLIENT-ONLY (ver `DevolucaoItemsEditor.tsx`).
//
// CORRECAO-R1 (homologação, D1): `requester` deixou de ser Input texto
// livre — agora é `SelectAsyncPaginate` de Employee via `listEmployeeOptions`
// (`GET /employees/options`, Onda 2 — SEM gate de `employees_view`, ao
// contrário de `listEmployees`/`GET /employees`), `label=value=name` (o
// payload `requester` continua string com o nome, SEM `employee_uuid`).
// `classification`/`area_id` FORAM REMOVIDOS do form, do payload e do
// schema (D1 — a API deixou de exigir).
//
// ORDEM DO CABEÇALHO: código (readonly, prévia calculada da própria
// listagem, mesma técnica `GAP-RS-10` de `Requisition` — sem endpoint
// dedicado) → usuário (readonly) → data (EDITÁVEL) → responsável devolução
// (select employee).
//
// Tela de CRIAÇÃO pura — SEM guard de `dirtyFields`.
// -----------------------------------------------------------------------------

import { useMemo } from 'react';

import { Box, SimpleGrid } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { devolutionCreateSchemaResolver } from '@/validations/schemas/Devolutions/devolution-create-schema';

import { listEmployeeOptions } from '@/services/v2/CadastrosBase/Employee/employee-service';
import { createDevolution, listDevolutions } from '@/services/v2/Devolutions/devolution-service';

import type { EmployeeOption } from '@/@types/v2/CadastrosBase/employee';
import type { CreateDevolutionPayload, DevolutionCreateForm } from '@/@types/v2/Devolutions';

import { DevolucaoItemsEditor } from './DevolucaoItemsEditor';

import type { DevolutionItemsFieldValues } from './DevolucaoItemsEditor';
import type { UseFieldArrayAppend } from 'react-hook-form';

const findParamsFromSearch = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
});

function todayDateInputValue(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function CreateDevolucao() {
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const { user: authUser } = useAuth();
  const text = languageGB.devolutions.devolution;
  const header = text.form.fields.header;

  const canSave = can('devolution_create');

  // Prévia do próximo `code` — mesma técnica `GAP-RS-10` de `Requisition`
  // (sem endpoint dedicado): calculada a partir da própria listagem já
  // paginada (página 1, 1 item, escopada pela fazenda ATIVA via `X-Farm-Id`).
  const nextCodePreviewQuery = useQuery({
    queryKey: [queryKey.devolutions.devolutions, 'next-code-preview'],
    queryFn: () => listDevolutions({ page: 1, per_page: 1 }),
    retry: false,
    refetchOnWindowFocus: false,
  });

  const nextCode = useMemo(() => {
    if (nextCodePreviewQuery.isError) return '—';

    const topCode = nextCodePreviewQuery.data?.data.items[0]?.code;
    if (!topCode) return '0001';

    return String(parseInt(topCode, 10) + 1).padStart(4, '0');
  }, [nextCodePreviewQuery.data, nextCodePreviewQuery.isError]);

  const {
    control,
    handleSubmit,
    formState: { errors, dirtyFields },
  } = useForm<DevolutionCreateForm>({
    mode: 'onChange',
    resolver: devolutionCreateSchemaResolver(languageGB),
    reValidateMode: 'onChange',
    defaultValues: {
      date: todayDateInputValue(),
      requester: null,
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const devolutionMutation = useRequest({
    asyncFunction: tryPersistDevolucao,
    entityName: text.singularLabel,
    queryKey: queryKey.devolutions.devolution,
    queryKey2: queryKey.devolutions.devolutions,
    typesRequest: 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  // Payload de criação em lote — `value`/`stock_quantity`/`measurement`
  // NUNCA entram no payload (client-only). Itens SEM `warehouse_uuid`
  // (`StoreDevolutionItemData` não tem esse campo, divergência #4).
  async function tryPersistDevolucao(data: DevolutionCreateForm) {
    const payload: CreateDevolutionPayload = {
      date: data.date,
      requester: data.requester!.value,
      items: data.items.map((item) => ({
        stock_uuid: item.stock_id!.value,
        quantity: Number(item.quantity),
        amount: Number(item.amount),
        cost_center_uuid: item.cost_center_id!.value,
      })),
    };

    return await createDevolution(payload);
  }

  async function onSubmit(data: DevolutionCreateForm) {
    await devolutionMutation.mutateAsync(data);
  }

  const isSubmitting = devolutionMutation.isPending;

  return (
    <FormContainer
      title={text.form.title.create}
      footer={
        <>
          <Button
            title={languageGB.defaltStrings?.cancel || 'Cancelar'}
            variant="outline"
            type="button"
            onClick={() => navigate(-1)}
          />
          {canSave && (
            <ButtonSaveAndNext
              create
              dirtyFields={dirtyFields}
              type="button"
              onClick={handleSubmit(onSubmit)}
              languageGB={languageGB}
              loading={isSubmitting}
              disabled={isSubmitting}
            />
          )}
        </>
      }
    >
      <Form noPadding onSubmit={handleSubmit(onSubmit)}>
        {/* Cabeçalho — ORDEM: código (readonly) → usuário (readonly) →
            data (EDITÁVEL, divergência #3) → responsável devolução (select
            employee, CORRECAO-R1/D1). */}
        <SimpleGrid columns={columnsForm.threeColumns} gap={6}>
          <InputReadOnly
            name="code"
            label={header.code}
            value={nextCode}
            loading={nextCodePreviewQuery.isLoading}
          />

          <InputReadOnly label={header.user} value={authUser?.username ?? '—'} />

          {/* `date` — EDITÁVEL real (divergência #3), `required` em ambos os
              verbos, `StoreDevolutionData::date`. */}
          <Controller
            name="date"
            control={control}
            render={({ field }) => (
              <DateInput
                value={field.value ?? null}
                onChange={(v) => field.onChange(v ?? '')}
                label={header.date}
                error={errors.date?.message}
                isRequired
                disabled={!canSave}
              />
            )}
          />

          {/* CORRECAO-R1/D1 — `SelectAsyncPaginate` de Employee via
              `/employees/options` (SEM gate do CRUD `employees_view` —
              roles com `devolution_create` mas sem `employees_view`
              recebiam 403 em `listEmployees`). `label=value=name`: o
              payload `requester` continua string com o nome (sem
              `employee_uuid`). `classification`/`area_id` REMOVIDOS. */}
          <Controller
            name="requester"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={header.requester}
                service={listEmployeeOptions}
                mapOptions={(item: EmployeeOption) => ({ label: item.name, value: item.name })}
                findParams={findParamsFromSearch}
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                error={error?.message}
                menuPortalTarget={document.body}
                menuPosition="fixed"
                isRequired
                isDisabled={!canSave}
              />
            )}
          />
        </SimpleGrid>

        {/* Editor de itens dinâmico — `useFieldArray` vive AQUI (pai). */}
        <Box mt={6}>
          <DevolucaoItemsEditor
            control={control}
            fields={fields}
            append={append as unknown as UseFieldArrayAppend<DevolutionItemsFieldValues, 'items'>}
            remove={remove}
            errors={errors}
            languageGB={languageGB}
            disabled={!canSave}
          />
        </Box>
      </Form>
    </FormContainer>
  );
}
