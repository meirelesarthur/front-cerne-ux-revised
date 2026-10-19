// src/pages/Frota/Manutencoes/CreateOrUpdateManutencao.tsx
// -----------------------------------------------------------------------------
// Formulário único de criação/edição de Manutenção — Tarefa 44. Casca
// `FormContainer` com footer OPT-IN (mirror `CreateOrUpdateAbastecimento.tsx`),
// 1 `useForm` RAIZ (`MaintenanceForm`), SEM abas.
//
// Cabeçalho: Data (obrigatório, default hoje no create), Requisitante
// (`InputReadOnly`, NUNCA editável pelo usuário — decisão do dono, execução
// 010, correção pré-abertura de PR: CREATE = usuário autenticado
// (`useAuth`, mirror `Frota/Abastecimentos/CreateOrUpdateAbastecimento.tsx`
// campo "Usuário"), EDIT = `detail.requester.name` já hidratado pelo
// backend, ver `10-Erros_Backend_Api/ERRO-05-...`) e Código (readonly, só
// em edição, nunca no payload).
//
// CORREÇÃO (Erro Frontend, execução 010, pós-Tester/pré-PR) — o campo
// deixou de ser um `Select` sobre `listUsers` (`GET /users`, permissão
// `users_view`) porque o backend passou a SEMPRE gravar `Auth::id()` no
// create e NUNCA mais aceitar troca de requisitante no update (a Action
// ignora qualquer `requester_user_uuid` enviado no payload). O risco de
// 403 em `listUsers` documentado antes (Tarefa 44) fica sem objeto — esta
// tela não chama mais `GET /users`. `requester_user_uuid` foi removido do
// `MaintenanceForm`/`MaintenancePayload` (ver `@types/v2/Maintenances`) —
// não é mais um campo que o cliente controla nem envia.
//
// "≥1 item para salvar" — gate client-side simples (mirror
// `CreateOrUpdateAbastecimento.tsx`): setado só no `onSubmit`, limpo
// reativamente assim que `items` ganha 1 linha preenchida.
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Box, SimpleGrid } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { Field } from '@/components/Form/Field';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { mapMaintenanceItemToForm } from '@/services/v2/Maintenances/maintenance-mapper';
import {
  createMaintenance,
  updateMaintenance,
} from '@/services/v2/Maintenances/maintenance-service';

import type {
  MaintenanceDetail,
  MaintenanceForm as MaintenanceFormType,
  MaintenancePayload,
} from '@/@types/v2/Maintenances';

import { MaintenanceItemsFieldArray } from './MaintenanceItemsFieldArray';
import { useMaintenanceDetailQuery } from './useManutencoes';

const MANUTENCOES_LIST_ROUTE = '/frota/manutencoes';

const defaultValues: MaintenanceFormType = {
  date: null,
  items: [
    {
      equipment_uuid: null,
      hour_meter: null,
      mileage: null,
      warehouse_uuid: null,
      product_uuid: null,
      measurement_uuid: null,
      quantity: null,
      note: null,
      executor_type: null,
      employee_uuid: null,
      employee_quantity: null,
      provider_uuid: null,
      provider_total: null,
    },
  ],
};

export default function CreateOrUpdateManutencao() {
  const { maintenanceId } = useParams<{ maintenanceId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const { user: authUser } = useAuth();

  // Rota `/frota/manutencoes/novo` é declarada ANTES de
  // `/frota/manutencoes/:maintenanceId` no router (mirror
  // `CreateOrUpdateAbastecimento.tsx`) — nela `maintenanceId` vem
  // `undefined`, então `isEditing` já nasce `false` sem comparar a string
  // `'novo'`.
  const isEditing = isValidGuid(maintenanceId);

  const text = languageGB.maintenances.maintenance;
  const formText = text.form;
  const itemsText = formText.items;

  const canSave = isEditing ? can('maintenances_edit') : can('maintenances_create');

  // Guard de navegação (`get_pwa_form_query_pattern` §"Guard de navegação")
  // — `maintenanceId` malformado redireciona ANTES de renderizar o form.
  useEffect(() => {
    if (maintenanceId && !isValidGuid(maintenanceId)) {
      navigate(MANUTENCOES_LIST_ROUTE, { replace: true });
    }
  }, [maintenanceId, navigate]);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, dirtyFields, isSubmitting },
  } = useForm<MaintenanceFormType>({
    mode: 'onChange',
    defaultValues,
  });

  const [detail, setDetail] = useState<MaintenanceDetail | null>(null);
  const [itemsError, setItemsError] = useState<string | null>(null);

  // LEI 2 — `fillForm` nomeada com guarda `isEmpty(dirtyFields)`
  // (`get_pwa_form_query_pattern` §"A Lei mais violada"), `resetForce=true`
  // na carga inicial (`useCustomFormQueryByGuid` chama sempre com
  // `resetForce=true` — mirror `useAppropriationForm`/`fillSupplyForm`).
  function fillMaintenanceForm(data: MaintenanceDetail, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      setDetail(data);
      reset({
        date: data.date,
        items: data.items.map((item) =>
          mapMaintenanceItemToForm(item, {
            employee: itemsText.executorTypeOptions.employee,
            provider: itemsText.executorTypeOptions.provider,
          })
        ),
      });
    }
  }

  useMaintenanceDetailQuery({
    registrationId: isEditing ? maintenanceId : undefined,
    fillForm: fillMaintenanceForm,
  });

  const watchedItems = watch('items');
  useEffect(() => {
    if (itemsError && (watchedItems ?? []).length > 0) {
      setItemsError(null);
    }
  }, [itemsError, watchedItems]);

  const maintenanceMutation = useRequest({
    asyncFunction: tryPersistMaintenance,
    entityName: text.singularLabel,
    queryKey: queryKey.maintenances.maintenance,
    queryKey2: queryKey.maintenances.maintenances,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(MANUTENCOES_LIST_ROUTE);
    },
  });

  async function tryPersistMaintenance(data: MaintenanceFormType) {
    const payload: MaintenancePayload = {
      date: data.date!,
      items: data.items
        .filter((item) => item.equipment_uuid)
        .map((item) => {
          const executorType = item.executor_type?.value ?? undefined;
          return {
            equipment_uuid: item.equipment_uuid!.value,
            hour_meter: item.hour_meter ?? undefined,
            mileage: item.mileage ?? undefined,
            warehouse_uuid: item.warehouse_uuid?.value ?? undefined,
            product_uuid: item.product_uuid?.value ?? undefined,
            measurement_uuid: item.measurement_uuid?.value ?? undefined,
            quantity: item.quantity ?? undefined,
            note: item.note?.trim() || undefined,
            executor_type: executorType,
            employee_uuid: executorType === 'employee' ? item.employee_uuid?.value : undefined,
            employee_quantity:
              executorType === 'employee' ? (item.employee_quantity ?? undefined) : undefined,
            provider_uuid: executorType === 'provider' ? item.provider_uuid?.value : undefined,
            provider_total:
              executorType === 'provider' ? (item.provider_total ?? undefined) : undefined,
          };
        }),
    };
    if (isEditing && maintenanceId) {
      return updateMaintenance(maintenanceId, payload);
    }
    return createMaintenance(payload);
  }

  async function onSubmit(data: MaintenanceFormType) {
    // LEI 2 — em edição, sem campos sujos não há nada a salvar (evita PUT
    // vazio + toast de sucesso indevido). ATENÇÃO: `src/utils/isEmpty.ts`
    // tem semântica INVERTIDA do nome neste projeto — retorna `true` quando
    // HÁ chaves (dirty) e `false` quando o objeto está realmente vazio. O
    // guard correto para "sem alterações" é `!isEmpty(dirtyFields)`
    // (ERRO-FE-001 — o mesmo guard SEM o `!` foi encontrado como defeito
    // real em `Frota/ManutencoesPreventivas/CreateOrUpdateManutencaoPreventiva.tsx`
    // e também mirrorado, sem `!`, em `Frota/Abastecimentos/
    // CreateOrUpdateAbastecimento.tsx` — este arquivo NÃO reproduz o bug).
    if (isEditing && !isEmpty(dirtyFields)) return;
    if (data.items.filter((item) => item.equipment_uuid).length === 0) {
      setItemsError(formText.errors.invalidFields);
      return;
    }
    await maintenanceMutation.mutateAsync(data);
  }

  if (maintenanceId && !isValidGuid(maintenanceId)) {
    return null;
  }

  // Requisitante NUNCA é editável (decisão do dono, execução 010) — CREATE
  // mostra o usuário autenticado, EDIT mostra `requester.name` já hidratado
  // pelo backend (mirror `CreateOrUpdateAbastecimento.tsx` campo "Usuário").
  const requesterLabel = isEditing ? (detail?.requester?.name ?? '—') : (authUser?.username ?? '—');

  return (
    <FormContainer
      title={isEditing ? formText.title.edit : formText.title.create}
      footer={
        <>
          <Button
            title={languageGB.defaltStrings.cancel}
            variant="outline"
            type="button"
            onClick={() => navigate(MANUTENCOES_LIST_ROUTE)}
          />
          {canSave && (
            <ButtonSaveAndNext
              create={!isEditing}
              dirtyFields={dirtyFields}
              type="button"
              onClick={handleSubmit(onSubmit)}
              languageGB={languageGB}
              loading={isSubmitting || maintenanceMutation.isPending}
              disabled={isSubmitting || maintenanceMutation.isPending}
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

          <InputReadOnly label={formText.fields.requester} value={requesterLabel} />
        </SimpleGrid>

        <Box mt={2}>
          <MaintenanceItemsFieldArray
            control={control}
            errors={errors}
            watch={watch}
            setValue={setValue}
            isDisabled={!canSave || isSubmitting || maintenanceMutation.isPending}
            itemsError={itemsError}
          />
        </Box>
      </Form>
    </FormContainer>
  );
}
