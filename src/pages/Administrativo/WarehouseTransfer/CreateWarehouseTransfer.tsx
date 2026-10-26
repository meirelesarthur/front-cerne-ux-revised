// src/pages/Administrativo/WarehouseTransfer/CreateWarehouseTransfer.tsx
// -----------------------------------------------------------------------------
// Formulário de CRIAÇÃO (lote) de Trans. Armazém (WarehouseTransfer —
// Estoque, TASK-WT-FE-03). Rota `/administrativo/transf-armazens/novo`,
// guardada por `<RequirePermission permission="warehouse-transfer_create">`
// (`src/router/index.tsx`, bloco iniciado em TASK-WT-FE-02).
// `POST /warehouse-transfers` em lote (`items[]`, 1 `code` gerado no
// servidor, `DA-WT-06`/`DA-WT-09`).
//
// UX-GAP confirmado (`WarehouseTransfer-contrato.md ## 11`) — nenhuma tela
// `*transfer*`/`*transferencia*` localizada em `GB.Cerne.UX`. Fidelidade
// buscada no Blade legado (`agro365/resources/views/warehouse-transfer/
// _forms.blade.php`+`create.blade.php`, lidos por completo pelo Arquiteto) +
// molde ESTRUTURAL (não literal) de `CreateOrUpdateFoodBeat.tsx`
// (`FormContainer` fullHeight+footer, `useFieldArray` no pai, editor de itens
// como componente próprio, "Responsável" readonly).
//
// DIVERGÊNCIA ESTRUTURAL do molde FoodBeat (achado do Arquiteto, NÃO
// replicada aqui — ver `WarehouseTransferItemsEditor.tsx`): o Armazém de
// ORIGEM é um ÚNICO select no CABEÇALHO, compartilhado por TODAS as linhas da
// tabela dinâmica (`DA-WT-12`) — filtro 100% CLIENT-SIDE, NUNCA vai ao
// payload (o backend deriva a origem de `stock.warehouse_id`). Ao trocar
// esse armazém, o legado (`removeOptions()`, `create.blade.php:199-206`)
// limpa os VALORES de cada linha já adicionada (produto/unidade/estoque/
// quantidade/valor/total) MAS NÃO remove as linhas — replicado abaixo via
// `replace()` preservando o length do array (NUNCA `remove()+append()`, que
// mudaria a identidade das linhas para o usuário).
//
// Riscos/gates já travados (`WarehouseTransfer-contrato.md ## 9`,
// will.lwcyano, 2026-08-14):
//  - `value` (valor unitário) é SEMPRE readonly em criação (Risco 1, autofill
//    de `Stock.average_cost`) — diferente da tela de EDIÇÃO (TASK-WT-FE-04).
//  - `amount` gravado EXATAMENTE como calculado no cliente (`quantity ×
//    value`), sem recálculo no servidor (`## 9` item 2 — confiar no cliente).
//  - Armazém origem = destino PERMITIDO — nenhuma validação nova bloqueando
//    (`## 9` item 3).
//  - Nenhum campo de `insertFinancial`/parcelas/financeiro (`## 9` item 4).
//
// Tela de CRIAÇÃO pura — SEM guard de `dirtyFields` (não há estado anterior a
// comparar); `onSubmit` sempre persiste quando o schema Yup válida
// (`items.min(1)` garante ao menos 1 linha, `warehouse-transfer-create-schema.ts`,
// TASK-WT-FE-01).
//
// Erro de saldo insuficiente (`BusinessRuleException`, 422) chega legível via
// `useRequest`/`extractApiFieldErrorMessage` (não reduzido a `data.message`
// genérico) — sem tratamento adicional necessário nesta tela.
// -----------------------------------------------------------------------------

import { Box, SimpleGrid } from '@chakra-ui/react';
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

import { todayLocalIso } from '@/utils/localDate';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { warehouseTransferCreateSchemaResolver } from '@/validations/schemas/WarehouseTransfers/warehouse-transfer-create-schema';

import { listWarehouses } from '@/services/v2/Warehouses/warehouse-service';
import { createWarehouseTransfer } from '@/services/v2/WarehouseTransfers/warehouse-transfer-service';

import type { Option } from '@/@types/option';
import type { WarehouseListItem } from '@/@types/v2/Warehouses';
import type {
  CreateWarehouseTransferPayload,
  WarehouseTransferCreateForm,
  WarehouseTransferItemForm,
} from '@/@types/v2/WarehouseTransfers';

import { WarehouseTransferItemsEditor } from './WarehouseTransferItemsEditor';

import type { WarehouseTransferItemsFieldValues } from './WarehouseTransferItemsEditor';
import type { UseFieldArrayAppend } from 'react-hook-form';

const findParamsFromSearch = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
});

// Select "Armazém (origem)"/"Armazém Destino" — mirror
// `CreateOrUpdateFoodBeat.tsx::mapWarehouseOption`. Sem filtro de `type`
// (ficha `TASK-WT-FE-03`, `service={listWarehouses}` puro — diferente do
// ramo Estoque de Batida, que restringe a armazéns de PRODUÇÃO).
function mapWarehouseOption(item: WarehouseListItem) {
  return { label: `${item.initials} — ${item.description}`, value: item.uuid };
}

function emptyItem(): WarehouseTransferItemForm {
  return {
    stock_id: null,
    measurement: '',
    stock_quantity: 0,
    quantity: '',
    value: 0,
    amount: 0,
    cost_center_id: null,
  };
}

export default function CreateWarehouseTransfer() {
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const { user: authUser } = useAuth();
  const text = languageGB.warehouseTransfers.warehouseTransfer;
  const header = text.form.fields.header;

  const canSave = can('warehouse-transfer_create');

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<WarehouseTransferCreateForm>({
    mode: 'onChange',
    resolver: warehouseTransferCreateSchemaResolver(languageGB),
    reValidateMode: 'onChange',
    defaultValues: {
      date: todayLocalIso(),
      origin_warehouse_id: null,
      destination_warehouse_id: null,
      items: [],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({ control, name: 'items' });

  const originWarehouseOption = watch('origin_warehouse_id');
  const originWarehouseUuid = originWarehouseOption?.value ?? null;

  // Troca do Armazém (origem) — filtro CLIENT-ONLY compartilhado por TODAS
  // as linhas (`DA-WT-12`). Fiel ao legado (`removeOptions()`,
  // `create.blade.php:199-206`): limpa os VALORES das linhas já adicionadas
  // (produto/unidade/estoque/quantidade/valor/total) SEM remover as linhas —
  // `replace()` preserva o length do array (NUNCA `remove()+append()`, que
  // mudaria a identidade das linhas para o usuário).
  function handleOriginWarehouseChange(option: Option<string> | null) {
    const previousUuid = originWarehouseUuid;
    setValue('origin_warehouse_id', option ?? null, { shouldDirty: true });

    if ((option?.value ?? null) === previousUuid) return;

    const currentItems = watch('items');
    if (currentItems.length > 0) {
      replace(currentItems.map(() => emptyItem()));
    }
  }

  const warehouseTransferMutation = useRequest({
    asyncFunction: tryPersistWarehouseTransfer,
    entityName: text.singularLabel,
    queryKey: queryKey.warehouseTransfers.warehouseTransfer,
    queryKey2: queryKey.warehouseTransfers.warehouseTransfers,
    typesRequest: 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  // Wrapper nomeado (Lei 3, mirror `tryPersistFoodBeat`) — payload de
  // criação em lote. `origin_warehouse_id`/`value`/`stock_quantity`/
  // `measurement` NUNCA entram (client-only, `DA-WT-12`).
  async function tryPersistWarehouseTransfer(data: WarehouseTransferCreateForm) {
    const payload: CreateWarehouseTransferPayload = {
      date: data.date,
      destination_warehouse_uuid: data.destination_warehouse_id!.value,
      items: data.items.map((item) => ({
        stock_uuid: item.stock_id!.value,
        quantity: Number(item.quantity),
        amount: Number(item.amount),
        cost_center_uuid: item.cost_center_id?.value ?? undefined,
      })),
    };
    return await createWarehouseTransfer(payload);
  }

  // Tela de CRIAÇÃO pura — SEM estado anterior a comparar, SEM guard de
  // `dirtyFields` (Checklist item 2 do task-packet — `items.min(1)` do
  // schema já impede submeter lote vazio; NENHUM uso de `isEmpty()`).
  async function onSubmit(data: WarehouseTransferCreateForm) {
    await warehouseTransferMutation.mutateAsync(data);
  }

  const isSubmitting = warehouseTransferMutation.isPending;

  return (
    <FormContainer
      title={text.form.title.create}
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
        {/* Cabeçalho — ORDEM FIEL ao Blade legado (`_forms.blade.php:1-24`):
            code → user (Responsável) → date → type → origin_warehouse_id
            (Armazém origem) → destination_warehouse_id (Armazém Destino). */}
        <SimpleGrid columns={columnsForm.threeColumns} gap={6}>
          {/* `code` — readonly, valor '—' (gerado só no servidor, `DA-WT-09`,
              sem prévia). */}
          <InputReadOnly name="code" label={header.code} value="—" />

          {/* "Responsável" — readonly, fora do payload/schema/`dirtyFields`
              (mirror EXATO `CreateOrUpdateFoodBeat.tsx`). Usuário logado. */}
          <InputReadOnly label={header.user} value={authUser?.username ?? '—'} />

          {/* `date` — obrigatório, default hoje (`defaultValues`). */}
          <Controller
            name="date"
            control={control}
            render={({ field, fieldState }) => (
              <DateInput
                value={field.value ?? null}
                onChange={(v) => field.onChange(v ?? '')}
                label={header.date}
                error={fieldState.error?.message}
                isRequired
                disabled={!canSave}
              />
            )}
          />

          {/* `type` — readonly, valor FIXO (nunca campo RHF, sempre
              `TRANSFER` no backend, `DA-WT-07`). */}
          <InputReadOnly label={header.type} value={header.typeValue} />

          {/* `origin_warehouse_id` (Armazém origem) — CLIENT-ONLY (`DA-WT-12`),
              NUNCA vai ao payload. Compartilhado por TODAS as linhas do
              editor de itens (prop `originWarehouseUuid`). */}
          <Controller
            name="origin_warehouse_id"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={header.originWarehouse}
                tooltip={text.form.hints.originWarehouseHelp}
                service={listWarehouses}
                mapOptions={mapWarehouseOption}
                findParams={findParamsFromSearch}
                value={field.value ?? null}
                onChange={handleOriginWarehouseChange as any}
                error={error?.message}
                menuPortalTarget={document.body}
                menuPosition="fixed"
                isRequired
                isDisabled={!canSave}
              />
            )}
          />

          {/* `destination_warehouse_id` (Armazém Destino) — vira
              `destination_warehouse_uuid` no payload. */}
          <Controller
            name="destination_warehouse_id"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={header.destinationWarehouse}
                service={listWarehouses}
                mapOptions={mapWarehouseOption}
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

        {/* Editor de itens dinâmico — `useFieldArray` vive AQUI (pai),
            mirror `CreateOrUpdateFoodBeat.tsx`. */}
        <Box mt={6}>
          <WarehouseTransferItemsEditor
            control={control}
            fields={fields}
            append={
              append as unknown as UseFieldArrayAppend<WarehouseTransferItemsFieldValues, 'items'>
            }
            remove={remove}
            errors={errors}
            languageGB={languageGB}
            originWarehouseUuid={originWarehouseUuid}
            disabled={!canSave}
          />
        </Box>
      </Form>
    </FormContainer>
  );
}
