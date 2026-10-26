// src/pages/Frota/Abastecimentos/CreateOrUpdateAbastecimento.tsx
// -----------------------------------------------------------------------------
// Formulário único de criação/edição de Abastecimento (Supply) — Tarefa 41.
// Casca `FormContainer` com footer OPT-IN (mirror
// `CadastrosBase/CentroCusto/CreateOrUpdateCentroCusto.tsx`), 1 `useForm`
// RAIZ (`SupplyForm`), SEM abas (Abastecimentos é CRUD flat, AD-02 —
// diferente do sibling `CreateOrUpdateAppropriation.tsx`, que tem workflow de
// status e 6 abas).
//
// Cabeçalho: Data (obrigatório), Requisitante (`SelectAsyncPaginate` +
// `listEmployeeOptions`, opcional — `employee_uuid`), Código (readonly, só
// em edição, contrato: nunca no payload) e Usuário (`InputReadOnly`, texto
// informativo — CREATE = usuário logado, EDIT = `user.name` do detalhe,
// mirror `ParameterWeights/CreateOrUpdateParameterWeights.tsx`).
//
// "≥1 item para salvar" — gate client-side simples (mirror
// `CreateOrUpdateAppropriation.tsx` TASK-FE-610/AP-09, versão sem tabs):
// setado só no `onSubmit`, limpo reativamente assim que `items` ganha 1
// linha preenchida.
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Box, SimpleGrid } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { Field } from '@/components/Form/Field';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { listEmployeeOptions } from '@/services/v2/CadastrosBase/Employee/employee-service';
import { listStockAvailability } from '@/services/v2/Stocks/stock-service';
import { createSupply, updateSupply } from '@/services/v2/Supplies/supply-service';

import type { Option } from '@/@types/option';
import type { EmployeeOption } from '@/@types/v2/CadastrosBase/employee';
import type {
  SupplyDetail,
  SupplyForm as SupplyFormType,
  SupplyPayload,
} from '@/@types/v2/Supplies';

import { SupplyItemsFieldArray } from './SupplyItemsFieldArray';
import { useSupplyDetailQuery } from './useAbastecimentos';

const ABASTECIMENTOS_LIST_ROUTE = '/frota/abastecimentos';

const defaultValues: SupplyFormType = {
  date: null,
  employee_uuid: null,
  items: [
    {
      equipment_uuid: null,
      hour_meter: null,
      mileage: null,
      warehouse_uuid: null,
      stock_uuid: null,
      measurement_uuid: null,
      quantity: null,
      responsible_uuid: null,
      note: null,
    },
  ],
};

export default function CreateOrUpdateAbastecimento() {
  const { supplyId } = useParams<{ supplyId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const { user: authUser } = useAuth();

  // Rota `/frota/abastecimentos/novo` é declarada ANTES de
  // `/frota/abastecimentos/:supplyId` no router (mirror
  // `CreateOrUpdateAppropriation.tsx`) — nela `supplyId` vem `undefined`
  // (sem esse param na rota literal), então `isEditing` já nasce `false` sem
  // precisar comparar a string `'novo'`.
  const isEditing = isValidGuid(supplyId);

  const text = languageGB.supplies.supply;
  const formText = text.form;

  const canSave = isEditing
    ? can('appropriation-supplies_edit')
    : can('appropriation-supplies_create');

  // Guard de navegação (`get_pwa_form_query_pattern` §"Guard de navegação")
  // — `supplyId` malformado (não-UUID, só possível na rota `:supplyId`)
  // redireciona ANTES de renderizar o form.
  useEffect(() => {
    if (supplyId && !isValidGuid(supplyId)) {
      navigate(ABASTECIMENTOS_LIST_ROUTE, { replace: true });
    }
  }, [supplyId, navigate]);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors, dirtyFields, isSubmitting },
  } = useForm<SupplyFormType>({
    mode: 'onChange',
    defaultValues,
  });

  const [detail, setDetail] = useState<SupplyDetail | null>(null);
  const [itemsError, setItemsError] = useState<string | null>(null);

  // LEI 2 — `fillForm` nomeada com guarda `isEmpty(dirtyFields)`
  // (`get_pwa_form_query_pattern` §"A Lei mais violada"), `resetForce=true`
  // na carga inicial (`useCustomFormQueryByGuid` chama sempre com
  // `resetForce=true` — mirror `useAppropriationForm`).
  function fillSupplyForm(data: SupplyDetail, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      setDetail(data);
      reset({
        date: data.date,
        employee_uuid: data.employee
          ? { value: data.employee.uuid, label: data.employee.name }
          : null,
        items: data.items.map((item) => ({
          equipment_uuid: { value: item.equipment.uuid, label: item.equipment.description },
          hour_meter: item.hour_meter,
          mileage: item.mileage,
          warehouse_uuid: item.warehouse
            ? { value: item.warehouse.uuid, label: item.warehouse.description }
            : null,
          // `stock_uuid` REAL não vem no `GET /supplies/{uuid}` (o Resource
          // expõe `product`/`warehouse`, não o uuid do registro físico de
          // `Stock`) — hidratado com placeholder (`value: ''`) + `productUuid`
          // transiente para o lookup best-effort abaixo (`stockAvailability
          // Query`/`useEffect`, mirror EXATO `CreateOrUpdateAppropriation.tsx`
          // "Área Total"/"Estoque" — resolvido no MESMO catálogo já usado
          // pelo Select, sem endpoint de detalhe dedicado). Enquanto não
          // resolvido, `value` fica `''` e o payload de update OMITE
          // `stock_uuid` dessa linha (campo `nullable` no contrato) — risco
          // documentado, reportado ao Tester.
          stock_uuid: item.product
            ? ({
                value: '',
                label: item.product.description,
                productUuid: item.product.uuid,
              } as any)
            : null,
          measurement_uuid: { value: item.measurement.uuid, label: item.measurement.name },
          quantity: item.quantity,
          responsible_uuid: item.responsible
            ? { value: item.responsible.uuid, label: item.responsible.name }
            : null,
          note: item.note,
        })),
      });
    }
  }

  useSupplyDetailQuery({
    registrationId: isEditing ? supplyId : undefined,
    fillForm: fillSupplyForm,
  });

  const watchedItems = watch('items');
  useEffect(() => {
    if (itemsError && (watchedItems ?? []).length > 0) {
      setItemsError(null);
    }
  }, [itemsError, watchedItems]);

  // Bug real reportado pelo dono via teste manual (Esteira 017, novo achado
  // pós-fix do guard de dirty): selecionar um Armazém ESPECÍFICO numa linha
  // limpa `stock_uuid`/`measurement_uuid` da MESMA linha (gate de sequência,
  // `SupplyItemRow.tsx` onChange do Armazém) — se o usuário salvar ANTES de
  // re-selecionar Produto/Estoque (ex.: armazém sem estoque disponível para
  // escolher, ou o usuário simplesmente não repete a escolha), o payload
  // builder (`tryPersistSupply`) acessava `item.measurement_uuid!.value` SEM
  // guarda — lançava `TypeError` (client-side, síncrono, ANTES de qualquer
  // `await` de rede). Como não é `AxiosError`, `getBusinessMutationErrorMessage`
  // caía no branch `!isAxiosError(error) || !error.response` e devolvia
  // `networkError` ("Sem resposta do servidor (erro de rede)") — toast
  // enganoso, título = `entityName` ("Abastecimento"), NENHUMA requisição
  // chegou a sair (o throw acontece antes do `updateSupply`/`createSupply`).
  // Corrige com validação client-side ANTES de montar o payload: bloqueia o
  // submit e sinaliza o campo (mirror `rowErrors?.*?.message` já cabeado em
  // `SupplyItemRow.tsx`), em vez de deixar o form crashar disfarçado de erro
  // de rede. Limpa o erro manual assim que o campo é corrigido (RHF não
  // limpa sozinho um erro setado via `setError` quando não há resolver).
  useEffect(() => {
    (watchedItems ?? []).forEach((item, index) => {
      if (item.equipment_uuid && item.measurement_uuid) {
        clearErrors(`items.${index}.measurement_uuid`);
      }
    });
  }, [watchedItems, clearErrors]);

  // Lookup best-effort para resolver o `stock_uuid` REAL das linhas
  // hidratadas em edição (ver comentário em `fillSupplyForm` acima) — agrupa
  // por `warehouse_uuid` DISTINTO (no máximo 1 chamada por armazém, não por
  // item), mirror EXATO `stockAvailabilityQuery` de
  // `CreateOrUpdateAppropriation.tsx`.
  const distinctPendingWarehouseUuids = Array.from(
    new Set(
      (watchedItems ?? [])
        .filter(
          (item) =>
            item.warehouse_uuid?.value &&
            item.stock_uuid &&
            !(item.stock_uuid as Option<string>).value
        )
        .map((item) => item.warehouse_uuid!.value)
    )
  );

  const stockAvailabilityQuery = useQuery({
    queryKey: [
      'supply-stock-availability-hydrate',
      distinctPendingWarehouseUuids.slice().sort().join(','),
    ],
    queryFn: async () => {
      const results = await Promise.all(
        distinctPendingWarehouseUuids.map((warehouseUuid) =>
          listStockAvailability({ warehouse_uuid: warehouseUuid })
        )
      );
      return results.flatMap((result) => result.data.items);
    },
    enabled: isEditing && distinctPendingWarehouseUuids.length > 0,
    staleTime: 60 * 1000,
    retry: false,
  });

  useEffect(() => {
    if (!stockAvailabilityQuery.data) return;

    (watchedItems ?? []).forEach((item, index) => {
      const pendingStockOption = item.stock_uuid as
        (Option<string> & { productUuid?: string }) | null;
      const warehouseUuid = item.warehouse_uuid?.value;
      if (
        !pendingStockOption ||
        pendingStockOption.value ||
        !pendingStockOption.productUuid ||
        !warehouseUuid
      ) {
        return;
      }

      const match = stockAvailabilityQuery.data!.find(
        (candidate) =>
          candidate.product.uuid === pendingStockOption.productUuid &&
          candidate.warehouse_uuid === warehouseUuid
      );
      if (!match) return;

      setValue(`items.${index}.stock_uuid`, {
        value: match.uuid,
        label: pendingStockOption.label,
        quantity: match.quantity,
        measurement: match.measurement
          ? {
              label: match.measurement.description || match.measurement.name,
              value: match.measurement.uuid,
            }
          : null,
        measurementSecond: match.measurement_second
          ? {
              label: match.measurement_second.description || match.measurement_second.name,
              value: match.measurement_second.uuid,
            }
          : null,
        factor: match.factor ?? null,
        factorType: match.factor_type ?? null,
      } as any);
    });
  }, [stockAvailabilityQuery.data]);

  const supplyMutation = useRequest({
    asyncFunction: tryPersistSupply,
    entityName: text.singularLabel,
    queryKey: queryKey.supplies.supply,
    queryKey2: queryKey.supplies.supplies,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(ABASTECIMENTOS_LIST_ROUTE);
    },
  });

  async function tryPersistSupply(data: SupplyFormType) {
    const payload: SupplyPayload = {
      date: data.date!,
      employee_uuid: data.employee_uuid?.value ?? undefined,
      items: data.items
        .filter((item) => item.equipment_uuid)
        .map((item) => ({
          equipment_uuid: item.equipment_uuid!.value,
          hour_meter: item.hour_meter ?? undefined,
          mileage: item.mileage ?? undefined,
          warehouse_uuid: item.warehouse_uuid?.value ?? undefined,
          stock_uuid: item.stock_uuid?.value || undefined,
          measurement_uuid: item.measurement_uuid!.value,
          quantity: Number(item.quantity ?? 0),
          responsible_uuid: item.responsible_uuid?.value ?? undefined,
          note: item.note?.trim() || undefined,
        })),
    };
    if (isEditing && supplyId) {
      return updateSupply(supplyId, payload);
    }
    return createSupply(payload);
  }

  async function onSubmit(data: SupplyFormType) {
    // LEI 2 — em edição, sem campos sujos não há nada a salvar (evita PUT
    // vazio + toast de sucesso indevido, mirror `get_pwa_form_query_pattern`
    // §"Código Ouro"). `isEmpty()` deste projeto retorna `true` quando o
    // objeto TEM alguma chave própria (nome invertido do utilitário,
    // `src/utils/isEmpty.ts`) — o guard precisa da negação `!` (mirror EXATO
    // `CreateOrUpdateEstacaoDeMonta.tsx`/`CreateOrUpdateBullSeedSeason.tsx`/
    // `CreateOrUpdateManutencao.tsx`). Bug real reportado pelo dono
    // (AF_REJECTED 2026-09-01): SEM a negação, `isEmpty(dirtyFields)` era
    // `true` sempre que HAVIA alteração — bloqueando o PUT em toda edição
    // real (ex.: "Quantidade" alterada), silenciosamente.
    if (isEditing && !isEmpty(dirtyFields)) return;
    if (data.items.filter((item) => item.equipment_uuid).length === 0) {
      setItemsError(formText.errors.invalidFields);
      return;
    }

    // Bug real (Esteira 017, teste manual do dono) — `measurement_uuid` é
    // OBRIGATÓRIO no contrato (`SupplyItemPayload.measurement_uuid: string`,
    // `src/@types/v2/Supplies/index.d.ts`), mas o form permite chegar ao
    // submit com essa linha `null` (limpo ao trocar Armazém, sem Produto/
    // Estoque re-selecionado depois). Validar AQUI, antes de montar o
    // payload, em vez de deixar `tryPersistSupply` estourar um `TypeError`
    // client-side disfarçado de "erro de rede" pelo toast genérico.
    const incompleteItemIndex = data.items.findIndex(
      (item) => item.equipment_uuid && !item.measurement_uuid
    );
    if (incompleteItemIndex !== -1) {
      setItemsError(formText.errors.invalidFields);
      setError(`items.${incompleteItemIndex}.measurement_uuid`, {
        type: 'manual',
        message: formText.errors.invalidFields,
      });
      return;
    }

    await supplyMutation.mutateAsync(data);
  }

  if (supplyId && !isValidGuid(supplyId)) {
    return null;
  }

  const userLabel = isEditing ? (detail?.user?.name ?? '—') : (authUser?.username ?? '—');

  return (
    <FormContainer
      title={isEditing ? formText.title.edit : formText.title.create}
      footer={
        <>
          <Button
            title={languageGB.defaltStrings.cancel}
            variant="secondary"
            type="button"
            onClick={() => navigate(ABASTECIMENTOS_LIST_ROUTE)}
          />
          {canSave && (
            <ButtonSaveAndNext
              create={!isEditing}
              dirtyFields={dirtyFields}
              type="button"
              onClick={handleSubmit(onSubmit)}
              languageGB={languageGB}
              loading={isSubmitting || supplyMutation.isPending}
              disabled={isSubmitting || supplyMutation.isPending}
            />
          )}
        </>
      }
    >
      <Form noPadding onSubmit={handleSubmit(onSubmit)}>
        <SimpleGrid columns={columnsForm.default} gap={6}>
          {isEditing && <InputReadOnly label={formText.fields.code} value={detail?.code ?? '—'} />}

          <Controller
            name="date"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field
                label={formText.fields.date}
                isRequired
                errorText={errors.date?.message as string | undefined}
              >
                <DateInput value={value ?? null} onChange={onChange} disabled={!canSave} />
              </Field>
            )}
          />

          <Controller
            name="employee_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={formText.fields.requester}
                service={listEmployeeOptions}
                mapOptions={(item: EmployeeOption) => ({ label: item.name, value: item.uuid })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? undefined}
                onChange={(option: any) => field.onChange(option ?? null)}
                isDisabled={!canSave}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <InputReadOnly label={formText.fields.user} value={userLabel} />
        </SimpleGrid>

        <Box mt={2}>
          <SupplyItemsFieldArray
            control={control}
            errors={errors}
            watch={watch}
            setValue={setValue}
            isDisabled={!canSave || isSubmitting || supplyMutation.isPending}
            itemsError={itemsError}
          />
        </Box>
      </Form>
    </FormContainer>
  );
}
