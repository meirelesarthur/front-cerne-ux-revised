// src/pages/Administrativo/Requisition/CreateRequisition.tsx
// -----------------------------------------------------------------------------
// Formulário de CRIAÇÃO (lote) de Requisição/Saída (Requisition — Estoque,
// 97-Esteiras/002, Tarefa 05). Rota `/administrativo/requisicao/novo`,
// guardada por `<RequirePermission permission="requisitions_create">`
// (`src/router/index.tsx`). `POST /requisitions` em lote (`items[]`, 1
// `code` gerado no servidor, por fazenda+tipo — decisão FINAL de
// `GAP-RS-06`/`GAP-RS-10`, revertida do contador global intermediário).
//
// Mirror ESTRUTURAL DIRETO de `CreateWarehouseTransfer.tsx` +
// `WarehouseTransferItemsEditor.tsx`, com as diferenças desta feature
// (`GAP-REQUISICAO-FE-01`/`GAP-REQUISICAO-FE-04`, já `[AVALIADO]`):
//   - `requester`/`classification`/`area_uuid` são do CABEÇALHO (1 valor
//     para o lote inteiro).
//   - `requester` é `Input` de texto livre simples (`GAP-REQUISICAO-FE-04`,
//     decisão do dono — sem componente "select criável").
//   - `classification` é um `Select` com 3 opções HARDCODED (N/C/O, mirror
//     `StockMovementClassification` do backend) — sem endpoint dedicado.
//
// Armazém/Centro de Custo migraram do CABEÇALHO para DENTRO de cada linha
// de `items[]` (`GAP-RS-11`, achado pós-entrega via screenshot real de
// produção) — ver `RequisitionItemsEditor.tsx`, que agora gerencia sua
// PRÓPRIA cascata Armazém→Estoque por linha, sem depender de nenhum estado
// compartilhado do formulário pai.
//
// ORDEM DO CABEÇALHO fiel ao legado (`_forms.blade.php`): código(readonly)
// → usuário(readonly) → requisitante → classificação → área(opcional).
//
// `code`/usuário NUNCA entram no payload/schema (mirror EXATO
// `InputReadOnly value="—"` do irmão — servidor gera 100%, sem prévia).
//
// `area_id`/`listAreas` exige `farm_uuid` explícito — resolvido via
// `useAuth().activeFarmUuid` (mirror `InvoiceItemsTab.tsx`/
// `Appropriations`), NÃO o header `X-Farm-Id` (endpoint específico exige o
// param na querystring).
//
// Tela de CRIAÇÃO pura — SEM guard de `dirtyFields` (não há estado anterior
// a comparar); `onSubmit` sempre persiste quando o schema Yup válida
// (`items.min(1)` garante ao menos 1 linha).
// -----------------------------------------------------------------------------

import { useMemo } from 'react';

import { Box, SimpleGrid } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import formatDate from '@/utils/formatDate';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { requisitionCreateSchemaResolver } from '@/validations/schemas/Requisitions/requisition-create-schema';

import { listAreas } from '@/services/v2/BaseRegistrations/areas-service';
import {
  createRequisition,
  listRequisitions,
} from '@/services/v2/Requisitions/requisition-service';

import type { Option } from '@/@types/option';
import type { AreaListItem } from '@/@types/v2/BaseRegistrations/areas';
import type { CreateRequisitionPayload, RequisitionCreateForm } from '@/@types/v2/Requisitions';

import { RequisitionItemsEditor, createEmptyRequisitionItem } from './RequisitionItemsEditor';

import type { RequisitionItemsFieldValues } from './RequisitionItemsEditor';
import type { UseFieldArrayAppend } from 'react-hook-form';

const findParamsFromSearch = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
});

function mapAreaOption(item: AreaListItem) {
  return { label: item.description, value: item.uuid };
}

export default function CreateRequisition() {
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const { user: authUser, activeFarmUuid } = useAuth();
  const text = languageGB.requisitions.requisition;
  const header = text.form.fields.header;

  const canSave = can('requisitions_create');

  // Prévia do próximo `code` (simplificação pedida pelo dono, 97-Esteiras/002
  // `GAP-RS-10`): o endpoint dedicado `next-code` foi removido — o Front
  // agora calcula a prévia a partir da própria listagem já paginada (página
  // 1, 1 item, mais recente primeiro, já escopada pela fazenda ATIVA via
  // `X-Farm-Id`), MESMO padrão já correto usado por `store()`
  // (`nextSequentialCodeForRequisition`, decisão FINAL de `GAP-RS-06`/
  // `GAP-RS-10` — por fazenda+tipo, não mais global). Sem histórico →
  // "0001". Falha na consulta → mantém "—" (fallback, não quebra o
  // formulário).
  const nextCodePreviewQuery = useQuery({
    queryKey: [queryKey.requisitions.requisitions, 'next-code-preview'],
    queryFn: () => listRequisitions({ page: 1, per_page: 1 }),
    retry: false,
    refetchOnWindowFocus: false,
  });

  const nextCode = useMemo(() => {
    if (nextCodePreviewQuery.isError) return '—';

    const topCode = nextCodePreviewQuery.data?.data.items[0]?.code;
    if (!topCode) return '0001';

    return String(parseInt(topCode, 10) + 1).padStart(4, '0');
  }, [nextCodePreviewQuery.data, nextCodePreviewQuery.isError]);

  // "Data" — NOVO (achado do dono): campo readonly decorativo mirror do
  // legado (`FH06 "created (display)"` — é o `created_at` do registro, NÃO
  // um campo do payload). Não vive no RHF — não há o que persistir aqui.
  const todayLabel = useMemo(() => formatDate(new Date()), []);

  // 3 opções HARDCODED (N/C/O, mirror `StockMovementClassification` do
  // backend) — sem endpoint dedicado (`GAP-REQUISICAO-FE-01`, achado
  // confirmado por leitura direta do Enum).
  const classificationOptions = useMemo<Option<string>[]>(
    () => [
      { value: 'N', label: text.form.fields.classificationOptions.notClassified },
      { value: 'C', label: text.form.fields.classificationOptions.capex },
      { value: 'O', label: text.form.fields.classificationOptions.opex },
    ],
    [text.form.fields.classificationOptions]
  );

  // `listAreas` exige `farm_uuid` — injetado via closure (mirror
  // `InvoiceItemsTab.tsx::listAreasForActiveFarm`).
  function listAreasForActiveFarm(params: { search?: string; page?: number; per_page?: number }) {
    return listAreas({ ...params, farm_uuid: activeFarmUuid ?? '' });
  }

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, dirtyFields },
  } = useForm<RequisitionCreateForm>({
    mode: 'onChange',
    resolver: requisitionCreateSchemaResolver(languageGB),
    reValidateMode: 'onChange',
    defaultValues: {
      requester: '',
      classification: null,
      area_id: null,
      items: [createEmptyRequisitionItem()],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const requisitionMutation = useRequest({
    asyncFunction: tryPersistRequisition,
    entityName: text.singularLabel,
    queryKey: queryKey.requisitions.requisition,
    queryKey2: queryKey.requisitions.requisitions,
    typesRequest: 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  // Wrapper nomeado (mirror `tryPersistWarehouseTransfer`) — payload de
  // criação em lote. `value`/`stock_quantity`/`measurement` NUNCA entram no
  // payload persistido (client-only). `warehouse_uuid` (`GAP-RS-02`,
  // preservado — nunca persiste em coluna própria) e `cost_center_uuid`
  // (`GAP-RS-08`, preservado — `class=Analítico`) são POR ITEM desde
  // `GAP-RS-11` — cada linha envia os seus próprios.
  async function tryPersistRequisition(data: RequisitionCreateForm) {
    const payload: CreateRequisitionPayload = {
      requester: data.requester,
      classification: data.classification!.value,
      items: data.items.map((item) => ({
        stock_uuid: item.stock_id!.value,
        quantity: Number(item.quantity),
        amount: Number(item.amount),
        warehouse_uuid: item.warehouse_id!.value,
        cost_center_uuid: item.cost_center_id!.value,
      })),
    };

    // `area_uuid` OMITIDO quando vazio (mirror `Optional` de
    // `StoreRequisitionData`).
    if (data.area_id?.value) {
      payload.area_uuid = data.area_id.value;
    }

    return await createRequisition(payload);
  }

  async function onSubmit(data: RequisitionCreateForm) {
    await requisitionMutation.mutateAsync(data);
  }

  const isSubmitting = requisitionMutation.isPending;

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
        {/* Cabeçalho — ORDEM FIEL ao legado: código → usuário → data (NOVO,
            achado do dono) → requisitante → classificação → área (opcional).
            Armazém/Centro de Custo migraram para DENTRO de cada linha de
            itens (`GAP-RS-11`). */}
        <SimpleGrid columns={columnsForm.threeColumns} gap={6}>
          {/* `code` — readonly. Prévia calculada no Front a partir da própria
              listagem (`GAP-RS-10`, endpoint dedicado removido) — falha na
              consulta mantém '—'. */}
          <InputReadOnly
            name="code"
            label={header.code}
            value={nextCode}
            loading={nextCodePreviewQuery.isLoading}
          />

          {/* "Responsável" — readonly, fora do payload/schema/`dirtyFields`
              (mirror EXATO `CreateWarehouseTransfer.tsx`). Usuário logado. */}
          <InputReadOnly label={header.user} value={authUser?.username ?? '—'} />

          {/* "Data" — NOVO (achado do dono): readonly, decorativo, mirror
              `FH06 "created (display)"` do legado — é o `created_at` do
              registro, NUNCA um campo de payload/schema/RHF. */}
          <InputReadOnly label={header.date} value={todayLabel} />

          {/* `requester` — `Input` de texto livre simples
              (`GAP-REQUISICAO-FE-04`, decisão do dono aprovada). */}
          <Input
            label={header.requester}
            {...register('requester')}
            error={errors.requester?.message}
            isRequired
            disabled={!canSave}
          />

          {/* `classification` — 3 opções HARDCODED (N/C/O), sem endpoint. */}
          <Controller
            name="classification"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <Select
                name={field.name}
                label={header.classification}
                options={classificationOptions}
                value={field.value ?? null}
                onChange={(option: Option<string> | null) => field.onChange(option ?? null)}
                error={error?.message}
                isRequired
                isDisabled={!canSave}
              />
            )}
          />

          {/* `area_id` — opcional (`RequisitionRequest::rules()`,
              `area_uuid: sometimes`). */}
          <Controller
            name="area_id"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={header.area}
                service={listAreasForActiveFarm}
                mapOptions={mapAreaOption}
                findParams={findParamsFromSearch}
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                error={error?.message}
                menuPortalTarget={document.body}
                menuPosition="fixed"
                isDisabled={!canSave}
              />
            )}
          />
        </SimpleGrid>

        {/* Editor de itens dinâmico — `useFieldArray` vive AQUI (pai),
            mirror `CreateWarehouseTransfer.tsx`. Armazém/Centro de Custo
            (`GAP-RS-11`) são geridos POR LINHA dentro do próprio editor. */}
        <Box mt={6}>
          <RequisitionItemsEditor
            control={control}
            fields={fields}
            append={append as unknown as UseFieldArrayAppend<RequisitionItemsFieldValues, 'items'>}
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
