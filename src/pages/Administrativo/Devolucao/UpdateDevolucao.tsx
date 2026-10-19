// src/pages/Administrativo/Devolucao/UpdateDevolucao.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de VISUALIZAÇÃO/EDIÇÃO (linha única, `FID-11`) de Devolução/
// Entrada (Devolution — Estoque, 97-Esteiras/037, Tarefa 09). Rota
// `/administrativo/devolucao/:uuid`, guardada por
// `<RequirePermission permission="devolution_view">`.
//
// Decisão #1 da Leitura do dev: Ver + Editar em UMA tela só (diferente de
// `RequisitionDetalhe.tsx`, que é read-only dedicada PORQUE Requisição não
// tem `update`) — campos imutáveis em `InputReadOnly`, campos editáveis em
// controles reais, desabilitados (não removidos) quando
// `!can('devolution_edit')`, mirror `CreateOrUpdateAdiantamento.tsx`
// (Lei 2, `fillForm` com guarda de `dirtyFields`, PATCH parcial).
//
// GAP DE CONTRATO #2 (Leitura do dev): `DevolutionResource::show()` NÃO
// expõe `stock.uuid` — o campo "Trocar Estoque" (`stock_id`) nasce SEMPRE
// `null` (nunca populado por `fillForm`); só entra no PATCH quando o usuário
// efetivamente seleciona algo (`dirtyFields.stock_id`).
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Box, SimpleGrid } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { Form } from '@/components/Form';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { NumberInput } from '@/components/Form/NumberInput';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useCustomFormQueryById } from '@/hooks/useCustomFormQueryById';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { devolutionUpdateSchemaResolver } from '@/validations/schemas/Devolutions/devolution-update-schema';

import { listEmployeeOptions } from '@/services/v2/CadastrosBase/Employee/employee-service';
import { listCostCenterOptions } from '@/services/v2/CostCenters/cost-center-service';
import {
  deleteDevolution,
  getDevolution,
  updateDevolution,
} from '@/services/v2/Devolutions/devolution-service';
import { listStocks } from '@/services/v2/Stocks/stock-service';

import type { EmployeeOption } from '@/@types/v2/CadastrosBase/employee';
import type { CostCenterRef } from '@/@types/v2/CostCenters';
import type {
  DevolutionDetail,
  DevolutionUpdateForm,
  UpdateDevolutionPayload,
} from '@/@types/v2/Devolutions';
import type { StockListItem } from '@/@types/v2/Stocks';

const DEVOLUTION_LIST_ROUTE = '/administrativo/devolucao';

const findParamsFromSearch = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
});

function mapStockOption(item: StockListItem) {
  return { label: `${item.product.code} — ${item.info}`, value: item.uuid };
}

export default function UpdateDevolucao() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.devolutions.devolution;
  const header = text.form.fields.header;
  const updateFields = text.form.fields.update;

  const canEdit = can('devolution_edit');
  const canDelete = can('devolution_delete');
  const hasValidUuid = isValidGuid(uuid ?? null);

  // Guarda de entrada — `uuid` ausente/mal-formado NUNCA dispara a chamada
  // de rede; redireciona à Listagem com toast (mirror `RequisitionDetalhe.tsx`).
  useEffect(() => {
    if (!hasValidUuid) {
      toaster.create({
        type: 'error',
        title: text.detail.invalidParamsToast.title,
        description: text.detail.invalidParamsToast.description,
      });
      navigate(DEVOLUTION_LIST_ROUTE, { replace: true });
    }
  }, [hasValidUuid]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<DevolutionUpdateForm>({
    mode: 'onChange',
    resolver: devolutionUpdateSchemaResolver(languageGB),
    reValidateMode: 'onChange',
    defaultValues: {
      date: '',
      requester: null,
      cost_center_id: null,
      quantity: '',
      amount: '',
      // GAP de contrato #2 — nasce SEMPRE vazio, nunca pré-populado.
      stock_id: null,
    },
  });

  // Lei 2 — `fillForm` nomeada, guarda `!isEmpty(dirtyFields) || resetForce`.
  // Popula SÓ os campos editáveis; `stock_id` NUNCA é populado (GAP #2).
  function fillDevolucaoForm(data: DevolutionDetail, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        date: data.date,
        // CORRECAO-R1/D1 — `requester` vira `Option<string>` (`label=value=
        // name`, mirror `DevolutionCreateForm`); `DevolutionDetail.requester`
        // continua string simples (nome), sem `employee_uuid`.
        requester: data.requester ? { label: data.requester, value: data.requester } : null,
        cost_center_id: data.cost_center
          ? { label: data.cost_center.description, value: data.cost_center.uuid }
          : null,
        quantity: data.quantity,
        amount: data.amount,
        stock_id: null,
      });
    }
  }

  const devolutionQuery = useCustomFormQueryById<DevolutionDetail>({
    registrationId: hasValidUuid ? (uuid as string) : '',
    asyncFunction: getDevolution,
    queryKey: queryKey.devolutions.devolution,
    fillForm: fillDevolucaoForm,
  });

  const isLoading = checkLoadingStatus([devolutionQuery as any]);
  const item = (devolutionQuery as any)?.data as DevolutionDetail | undefined;
  const notFound = hasValidUuid && !isLoading && (devolutionQuery as any)?.isError;

  const devolutionMutation = useRequest({
    asyncFunction: tryPersistDevolucao,
    entityName: text.singularLabel,
    queryKey: queryKey.devolutions.devolution,
    queryKey2: queryKey.devolutions.devolutions,
    typesRequest: 'update',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  // PATCH parcial — só campos de `dirtyFields` (mirror `UpdateDevolutionData`,
  // TODOS `sometimes`). `stock_uuid` só entra quando o usuário efetivamente
  // trocou (GAP #2).
  async function tryPersistDevolucao(data: DevolutionUpdateForm) {
    const patch: UpdateDevolutionPayload = {};
    if (dirtyFields.date) patch.date = data.date;
    if (dirtyFields.requester && data.requester) patch.requester = data.requester.value;
    if (dirtyFields.cost_center_id && data.cost_center_id) {
      patch.cost_center_uuid = data.cost_center_id.value;
    }
    if (dirtyFields.quantity) patch.quantity = Number(data.quantity);
    if (dirtyFields.amount) patch.amount = Number(data.amount);
    if (dirtyFields.stock_id && data.stock_id) patch.stock_uuid = data.stock_id.value;

    return await updateDevolution(uuid as string, patch);
  }

  async function onSubmit(data: DevolutionUpdateForm) {
    // `isEmpty` tem semântica INVERTIDA no projeto — retorna `true` quando o
    // objeto TEM chaves (mirror `CreateOrUpdateAdiantamento.tsx`). Sem
    // campos sujos, não há o que persistir.
    if (!isEmpty(dirtyFields)) {
      navigate(-1);
      return;
    }
    await devolutionMutation.mutateAsync(data);
  }

  const isSubmitting = devolutionMutation.isPending;

  // ---- Exclusão -------------------------------------------------------------
  const [isOpenDeleteDialog, setIsOpenDeleteDialog] = useState(false);

  const deleteMutation = useRequest({
    asyncFunction: async ({ devolutionUuid }: { devolutionUuid: string }) => {
      await deleteDevolution(devolutionUuid);
      return undefined;
    },
    queryKey: queryKey.devolutions.devolutions,
    typesRequest: 'apply',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      setIsOpenDeleteDialog(false);
      navigate(DEVOLUTION_LIST_ROUTE);
    },
  });

  function handleConfirmDelete() {
    if (uuid) {
      deleteMutation.mutate({ devolutionUuid: uuid });
    }
  }

  if (!hasValidUuid) {
    return null;
  }

  return (
    <FormContainer
      title={text.form.title.edit}
      footer={
        <>
          <Button
            title={languageGB.defaltStrings.cancel}
            variant="outline"
            type="button"
            onClick={() => navigate(-1)}
          />
          {canDelete && (
            <Button
              title={text.detail.deleteButton}
              variant="outline"
              colorPalette="red"
              type="button"
              onClick={() => setIsOpenDeleteDialog(true)}
              disabled={!item || isSubmitting}
            />
          )}
          {canEdit && (
            <Button
              title={updateFields.saveButton}
              type="button"
              onClick={handleSubmit(onSubmit)}
              loading={isSubmitting}
              disabled={isSubmitting || isLoading || notFound}
            />
          )}
        </>
      }
    >
      <Form noPadding onSubmit={handleSubmit(onSubmit)}>
        {/* Campos IMUTÁVEIS — mirror `RequisitionDetalhe.tsx`, fora do RHF. */}
        <SimpleGrid columns={columnsForm.threeColumns} gap={6}>
          <InputReadOnly
            name="code"
            label={header.code}
            value={item?.code ?? '—'}
            loading={isLoading}
          />
          <InputReadOnly label={text.detail.fields.status} value={item?.status?.label ?? '—'} />
          <InputReadOnly label={text.detail.fields.type} value={item?.type ?? '—'} />
          <InputReadOnly
            label={text.detail.fields.classification}
            value={item?.classification ?? '—'}
          />
          <InputReadOnly label={text.detail.fields.area} value={item?.area?.description ?? '—'} />
          <InputReadOnly
            label={updateFields.productCurrent}
            value={item?.product ? `${item.product.code} — ${item.product.description}` : '—'}
          />
          <InputReadOnly
            label={updateFields.warehouseCurrent}
            value={item?.warehouse?.description ?? '—'}
          />
        </SimpleGrid>

        {/* Campos EDITÁVEIS reais — desabilitados (não removidos) quando
            `!can('devolution_edit')` (decisão #1). */}
        <Box mt={6}>
          <SimpleGrid columns={columnsForm.threeColumns} gap={6}>
            <Controller
              name="date"
              control={control}
              render={({ field }) => (
                <DateInput
                  value={field.value ?? null}
                  onChange={(v) => field.onChange(v ?? '')}
                  label={header.date}
                  error={errors.date?.message}
                  disabled={!canEdit || isLoading}
                />
              )}
            />

            {/* CORRECAO-R1/D1 — `SelectAsyncPaginate` de Employee via
                `/employees/options` (paridade de widget com `CreateDevolucao`,
                `label=value=name`, sem gate de `employees_view`). */}
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
                  isDisabled={!canEdit || isLoading}
                />
              )}
            />

            <Controller
              name="cost_center_id"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.form.fields.item.costCenter}
                  service={(params) => listCostCenterOptions({ ...params, only_analytic: true })}
                  mapOptions={(costCenter: CostCenterRef) => ({
                    label: `${costCenter.code} — ${costCenter.description}`,
                    value: costCenter.uuid,
                  })}
                  findParams={findParamsFromSearch}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  error={error?.message}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                  isDisabled={!canEdit || isLoading}
                />
              )}
            />

            <Controller
              name="quantity"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <NumberInput
                  name={field.name}
                  label={text.form.fields.item.quantity}
                  allowDot
                  decimalPlaces={2}
                  min={0}
                  value={Number(field.value) || 0}
                  onValueChange={(nextValue) => field.onChange(nextValue ?? 0)}
                  disabled={!canEdit || isLoading}
                  error={error?.message}
                />
              )}
            />

            <Controller
              name="amount"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <NumberInput
                  name={field.name}
                  label={text.form.fields.item.totalValue}
                  allowDot
                  decimalPlaces={2}
                  min={0}
                  value={Number(field.value) || 0}
                  onValueChange={(nextValue) => field.onChange(nextValue ?? 0)}
                  disabled={!canEdit || isLoading}
                  error={error?.message}
                />
              )}
            />

            {/* "Trocar Estoque" — nasce SEMPRE vazio (GAP de contrato #2),
                opcional, só entra no PATCH se selecionado. */}
            <Controller
              name="stock_id"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={updateFields.changeStock}
                  placeholder={updateFields.changeStockPlaceholder}
                  service={listStocks}
                  mapOptions={mapStockOption}
                  findParams={findParamsFromSearch}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  error={error?.message}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                  isDisabled={!canEdit || isLoading}
                />
              )}
            />
          </SimpleGrid>
        </Box>
      </Form>

      <DeleteConfirmDialog
        isOpen={isOpenDeleteDialog}
        onClose={() => setIsOpenDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        isLoading={deleteMutation.isPending}
        itemName={item?.code}
        tone="danger"
      />
    </FormContainer>
  );
}
