// src/pages/Administrativo/BaixaEstoque/CreateBaixaEstoque.tsx
// -----------------------------------------------------------------------------
// Formulário de CRIAÇÃO (create-only) de Baixa de Estoque — TASK-FE-3004.
// Rota `/administrativo/baixa-estoque/nova`, guardada por
// `<RequirePermission permission="stock-writeoffs_create">`. A Baixa NUNCA
// teve edição (`apiResource(...)->only([index,store,show,destroy])`,
// contrato de tela §2.1) — sem guard de `dirtyFields`/`isEditing` (mirror
// `CreateWarehouseTransfer.tsx`: tela de criação PURA).
//
// Molde ESTRUTURAL de `CreateWarehouseTransfer.tsx` (`FormContainer`
// footer + `useFieldArray` no PAI + editor de linha em componente próprio)
// — cascata "trocar Armazém reinicia o bloco de itens" (SH-006) via
// `replace([emptyItem()])` (mirror `handleOriginWarehouseChange`, mas SEM
// preservar o length — "reinicia" é literal aqui, contrato de tela §3.1).
//
// PATTERN-GAP (LAC, contrato de tela §4.2) — bloco de itens inline em
// submit único não é canonizado (Model C.4 usa Zustand+bulkCreate); decisão
// registrada no plano de front: `useFieldArray` por linha + submit inline,
// mirror `ServiceOrderProductTab.tsx`/`Appropriations`.
// -----------------------------------------------------------------------------

import { ElementType } from 'react';

import { Box, SimpleGrid, Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { FiPlus } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { CollapsibleSection } from '@/components/Form/CollapsibleSection';
import { Field } from '@/components/Form/Field';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { Textarea } from '@/components/Form/Textarea';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { todayLocalIso } from '@/utils/localDate';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';
import { stockWriteoffTypeOptions } from '@/constants/stockWriteoffs/options/stock-writeoff-type-options';

import { stockWriteoffSchemaResolver } from '@/validations/schemas/StockWriteoffs/stock-writeoff-schema';

import { listCostCenterOptions } from '@/services/v2/CostCenters/cost-center-service';
import {
  createStockWriteoff,
  getStockWriteoffNextCode,
} from '@/services/v2/StockWriteoffs/stock-writeoff-service';
import { listWarehouseOptions } from '@/services/v2/Warehouses/warehouse-service';

import type { Option } from '@/@types/option';
import type { CostCenterRef } from '@/@types/v2/CostCenters';
import type { StockWriteoffData, StockWriteoffForm } from '@/@types/v2/StockWriteoffs';
import type { WarehouseOption } from '@/@types/v2/Warehouses';

import { AttachmentRow } from './AttachmentRow';
import { ItemRow } from './ItemRow';
import { mapStockWriteoffFormToPayload } from './stock-writeoff-form-mapper';

const BAIXA_ESTOQUE_LIST_ROUTE = '/administrativo/baixa-estoque';

const findParamsFromSearch = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
});

function emptyItem(): StockWriteoffForm['items'][number] {
  return { stock: null, quantity: null, value: null };
}

// Mapeia o path do erro 422 (`StockWriteoffRequest::rules()`) para o path
// REAL do RHF — `warehouse_uuid` vira `warehouse`; `items.N.product_uuid`/
// `items.N.lot` viram `items.N.stock` (a linha do RHF guarda a Option de
// ESTOQUE, não `product_uuid`/`lot` soltos — contrato de tela §4.3). Demais
// paths (`date`/`type`/`justification`/`items.N.quantity`/`items.N.value`/
// `attachments.N.name`/`attachments.N.file`) já casam 1:1.
function mapServerFieldPath(field: string): string {
  if (field === 'warehouse_uuid') return 'warehouse';
  const itemRefMatch = field.match(/^items\.(\d+)\.(product_uuid|lot)$/);
  if (itemRefMatch) return `items.${itemRefMatch[1]}.stock`;
  return field;
}

export default function CreateBaixaEstoque() {
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const { user: authUser } = useAuth();
  const text = languageGB.stockWriteoffs.stockWriteoff;
  const formText = text.form;

  const canSave = can('stock-writeoffs_create');

  // ---- "Código" (BAIXA-11, execução 038, homolog R1) — read-only, prévia
  // via `GET /stock-writeoffs/next-code` (endpoint já existente,
  // `getStockWriteoffNextCode` adicionado no service para esta correção,
  // mirror EXATO `getServiceOrderNextCode`/`CreateOrUpdateServiceOrder.tsx`).
  // Esta fatia é create-only (sem `update`/`edit`), então a query roda
  // sempre — não há modo edição para condicionar `enabled`. NUNCA vai ao
  // payload (`StockWriteoffCreatePayload` não tem `code`; o backend gera o
  // código real na Action de criação). ----------------------------------
  const nextCodeQuery = useQuery({
    queryKey: [queryKey.stockWriteoffs.stockWriteoff, 'next-code'],
    queryFn: getStockWriteoffNextCode,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const codeLoading = nextCodeQuery.isLoading;
  const codeValue = nextCodeQuery.data?.data?.code ?? '—';

  // ---- "Usuário" (BAIXA-11) — read-only, usuário autenticado atual
  // (mirror EXATO "Solicitante" de `CreateOrUpdateServiceOrder.tsx`, GAP-OS-01).
  // NUNCA vai ao payload (o backend resolve o usuário responsável pelo
  // contexto de autenticação). ------------------------------------------
  const userName = authUser?.username ?? '—';

  const {
    control,
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    formState: { errors },
  } = useForm<StockWriteoffForm>({
    mode: 'onChange',
    resolver: stockWriteoffSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      date: todayLocalIso(),
      type: null,
      type_note: null,
      warehouse: null,
      justification: '',
      cost_center: null,
      items: [emptyItem()],
      attachments: [],
    },
  });

  const {
    fields: itemFields,
    append: appendItem,
    remove: removeItem,
    replace: replaceItems,
  } = useFieldArray({ control, name: 'items' });

  const {
    fields: attachmentFields,
    append: appendAttachment,
    remove: removeAttachment,
  } = useFieldArray({ control, name: 'attachments' });

  const warehouseOption = watch('warehouse');
  const warehouseUuid = warehouseOption?.value ?? null;
  const watchedAttachments = watch('attachments');

  // Trocar de Armazém REINICIA o bloco de itens (SH-006, contrato de tela
  // §3.1) — diferente de `CreateWarehouseTransfer` (que preserva o length
  // limpando valores): aqui o catálogo de estoques muda por completo, então
  // volta para 1 linha vazia.
  function handleWarehouseChange(option: Option<string> | null) {
    const previousUuid = warehouseUuid;
    setValue('warehouse', option ?? null, { shouldDirty: true });
    if ((option?.value ?? null) === previousUuid) return;
    replaceItems([emptyItem()]);
  }

  function handleAddItem() {
    appendItem(emptyItem());
  }

  function handleAddAttachment() {
    const lastRow = watchedAttachments[watchedAttachments.length - 1];
    if (lastRow && !lastRow.name?.trim() && !lastRow.file) {
      toaster.error({
        title: text.singularLabel,
        description: formText.attachments.fillBeforeAddError,
      });
      return;
    }
    appendAttachment({ name: '', file: null });
  }

  const stockWriteoffMutation = useRequest<StockWriteoffData>({
    asyncFunction: tryPersistStockWriteoff,
    entityName: text.singularLabel,
    queryKey: queryKey.stockWriteoffs.stockWriteoffsList,
    typesRequest: 'create',
    personalizedMessage: formText.createdToast,
    actionSuccess: (data) => {
      navigate(`${BAIXA_ESTOQUE_LIST_ROUTE}/${data.uuid}`);
    },
  });

  async function tryPersistStockWriteoff(data: StockWriteoffForm) {
    const payload = mapStockWriteoffFormToPayload(data, formText.attachments.defaultName);

    try {
      return await createStockWriteoff(payload);
    } catch (error) {
      // 422 do backend mapeado por campo — mesma técnica de
      // `tryPersistFunction`/`tryPersistEvento`, com o path traduzido pelo
      // `mapServerFieldPath` (a linha do RHF guarda `stock`, não
      // `product_uuid`/`lot` soltos).
      if (isAxiosError(error) && error.response?.status === 422) {
        const fieldErrors = error.response.data?.errors as Record<string, string[]> | undefined;
        Object.entries(fieldErrors ?? {}).forEach(([field, messages]) => {
          if (messages?.[0]) {
            setError(mapServerFieldPath(field) as any, { type: 'server', message: messages[0] });
          }
        });
      }
      throw error;
    }
  }

  const isSubmitting = stockWriteoffMutation.isPending;
  const isDisabled = !canSave || isSubmitting;

  async function onSubmit(data: StockWriteoffForm) {
    await stockWriteoffMutation.mutateAsync(data);
  }

  function onInvalid() {
    toaster.error({
      title: formText.title,
      description: formText.errors.invalidFields,
      duration: 6000,
    });
  }

  const typeOptions = stockWriteoffTypeOptions.options(languageGB);
  const itemsArrayError = (errors as any)?.items?.message as string | undefined;

  return (
    <FormContainer
      title={formText.title}
      subtitle={formText.subtitle}
      footer={
        <>
          <Button
            title={formText.footer.cancel}
            variant="secondary"
            type="button"
            onClick={() => navigate(-1)}
            disabled={isSubmitting}
          />
          {canSave && (
            <Button
              title={formText.footer.save}
              type="submit"
              form="create-stock-writeoff-form"
              loading={isSubmitting}
              disabled={isSubmitting}
            />
          )}
        </>
      }
    >
      <Form id="create-stock-writeoff-form" noPadding onSubmit={handleSubmit(onSubmit, onInvalid)}>
        {/* ---- Cabeçalho ---- */}
        <CollapsibleSection title={formText.header.sectionTitle} defaultOpen>
          <SimpleGrid columns={columnsForm.default} gap={6}>
            {/* BAIXA-11 (execução 038, homolog R1) — "Código" e "Usuário"
                NOVOS, sempre travados, mirror EXATO
                `ServiceOrderHeaderFields.tsx` (campos "Código"/"Solicitante"). */}
            <InputReadOnly
              name="code"
              label={formText.header.code}
              value={codeValue}
              loading={codeLoading}
            />

            <InputReadOnly name="user" label={formText.header.user} value={userName} />

            <Controller
              name="date"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <Field label={formText.header.date} errorText={error?.message} isRequired>
                  <DateInput
                    value={field.value ?? null}
                    onChange={(value) => field.onChange(value ?? '')}
                    disabled={isDisabled}
                  />
                </Field>
              )}
            />

            <Controller
              name="type"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <Select
                  name={field.name}
                  label={formText.header.type}
                  placeholder={formText.header.typePlaceholder}
                  options={typeOptions}
                  value={field.value ?? null}
                  onChange={(option) => field.onChange(option ?? null)}
                  error={error?.message}
                  isRequired
                  isDisabled={isDisabled}
                />
              )}
            />

            <Controller
              name="warehouse"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={formText.header.warehouse}
                  placeholder={formText.header.warehousePlaceholder}
                  service={listWarehouseOptions}
                  mapOptions={(item: WarehouseOption) => ({
                    label: `${item.initials} — ${item.description}`,
                    value: item.uuid,
                  })}
                  findParams={(search) => ({ ...findParamsFromSearch(search), type: 'insumos' })}
                  value={field.value ?? null}
                  onChange={(option: any) => handleWarehouseChange(option ?? null)}
                  error={error?.message}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                  isRequired
                  isDisabled={isDisabled}
                />
              )}
            />

            {/* Centro de custo — D3/D-FE-BE-04, UI-ONLY: exibido por
                fidelidade ao legado, NUNCA obrigatório; a API descarta.
                BAIXA-10 (homolog R1) — `gridColumn` span 2 (mirror
                `ProviderFormFields.tsx`/`CreateOrUpdateFuncionario.tsx`):
                placeholder ("Selecione o centro de custo (opcional)") e o
                aviso (`costCenterHint`) vazavam na coluna estreita do grid
                de 4 colunas; com o dobro da largura, ambos cabem sem cortar. */}
            <Box gridColumn={{ base: 'auto', md: 'span 2' }}>
              <Controller
                name="cost_center"
                control={control}
                render={({ field }) => (
                  <SelectAsyncPaginate
                    name={field.name}
                    label={formText.header.costCenter}
                    placeholder={formText.header.costCenterPlaceholder}
                    tooltip={formText.header.costCenterHint}
                    service={listCostCenterOptions}
                    mapOptions={(item: CostCenterRef) => ({
                      label: `${item.code} — ${item.description}`,
                      value: item.uuid,
                    })}
                    findParams={(search) => ({
                      ...findParamsFromSearch(search),
                      only_analytic: true,
                      is_enabled: 'true' as const,
                    })}
                    value={field.value ?? null}
                    onChange={(option: any) => field.onChange(option ?? null)}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                    isDisabled={isDisabled}
                  />
                )}
              />
            </Box>

            {/* BAIXA-07 (homolog R1) — (a) label renomeado "Observação do
                tipo"→"Observação" (i18n, `formText.header.typeNote`); (b)
                campo maior (`rows=4`, full width via `gridColumn`) — mais
                linhas visíveis, sem apertar o texto digitado. */}
            <Box gridColumn="1 / -1">
              <Textarea
                label={formText.header.typeNote}
                placeholder={formText.header.typeNotePlaceholder}
                rows={4}
                {...register('type_note')}
                error={(errors.type_note?.message as string) || undefined}
                disabled={isDisabled}
              />
            </Box>

            <Textarea
              label={formText.header.justification}
              placeholder={formText.header.justificationPlaceholder}
              maxLength={191}
              isRequired
              {...register('justification')}
              error={errors.justification?.message}
              disabled={isDisabled}
            />
          </SimpleGrid>
        </CollapsibleSection>

        {/* ---- Bloco de itens (`useFieldArray`, contrato de tela §3.1) ---- */}
        <CollapsibleSection title={formText.items.sectionTitle} defaultOpen>
          {itemFields.length === 0 ? (
            <Box py={2}>
              <Text fontSize="sm" color={itemsArrayError ? 'fg.error' : 'fg.muted'}>
                {itemsArrayError || formText.items.emptyRow}
              </Text>
            </Box>
          ) : (
            <Box display="flex" flexDirection="column" gap={4} mb={4}>
              {itemFields.map((field, index) => (
                <ItemRow
                  key={field.id}
                  control={control}
                  index={index}
                  warehouseUuid={warehouseUuid}
                  isDisabled={isDisabled}
                  canRemove={itemFields.length > 1}
                  onRemove={() => removeItem(index)}
                />
              ))}
            </Box>
          )}

          <Button
            type="button"
            title={formText.items.addItem}
            icon={FiPlus as ElementType}
            variant="outline"
            size="sm"
            onClick={handleAddItem}
            disabled={isDisabled || !warehouseUuid}
          />
        </CollapsibleSection>

        {/* ---- Bloco de anexos (`useFieldArray`, contrato de tela §3.3) ---- */}
        <CollapsibleSection title={formText.attachments.sectionTitle} defaultOpen={false}>
          {attachmentFields.length === 0 ? (
            <Box py={2} mb={4}>
              <Text fontSize="sm" color="fg.muted">
                {formText.attachments.emptyLabel}
              </Text>
            </Box>
          ) : (
            <Box display="flex" flexDirection="column" gap={4} mb={4}>
              {attachmentFields.map((field, index) => (
                <AttachmentRow
                  key={field.id}
                  control={control}
                  index={index}
                  isDisabled={isDisabled}
                  onRemove={() => removeAttachment(index)}
                />
              ))}
            </Box>
          )}

          <Button
            type="button"
            title={formText.attachments.addButton}
            icon={FiPlus as ElementType}
            variant="outline"
            size="sm"
            onClick={handleAddAttachment}
            disabled={isDisabled}
          />
        </CollapsibleSection>
      </Form>
    </FormContainer>
  );
}
