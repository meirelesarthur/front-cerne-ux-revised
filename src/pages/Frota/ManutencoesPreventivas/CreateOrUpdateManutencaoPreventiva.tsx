// src/pages/Frota/ManutencoesPreventivas/CreateOrUpdateManutencaoPreventiva.tsx
// -----------------------------------------------------------------------------
// Formulário único de criação/edição de Manutenção Preventiva
// (MaintenancePreventive) — Tarefa 44. Casca `FormContainer` com footer
// OPT-IN (mirror `CreateOrUpdateAbastecimento.tsx`), 1 `useForm` RAIZ
// (`MaintenancePreventiveForm`), SEM abas e SEM nenhuma cascata de rede —
// diferente do sibling `Abastecimentos`, esta feature não toca
// Stock/Warehouse/Product/UM (D7 supera o único comportamento "dinâmico" do
// legado, `INT-01`).
//
// Cabeçalho: Data (obrigatório, `DateInput`), Requisitante
// (`SelectAsyncPaginate` + `listEmployeeOptions`, opcional —
// `employee_uuid`), Código (readonly, só em edição, nunca no payload) e
// Usuário (`InputReadOnly`, texto informativo).
//
// "≥1 item para salvar" — gate client-side simples (mirror
// `CreateOrUpdateAbastecimento.tsx`): setado só no `onSubmit`, limpo
// reativamente assim que `items` ganha 1 linha preenchida.
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Box, SimpleGrid } from '@chakra-ui/react';
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
import {
  createMaintenancePreventive,
  updateMaintenancePreventive,
} from '@/services/v2/MaintenancePreventives/maintenance-preventive-service';

import type { EmployeeOption } from '@/@types/v2/CadastrosBase/employee';
import type {
  MaintenancePreventiveDetail,
  MaintenancePreventiveForm as MaintenancePreventiveFormType,
  MaintenancePreventivePayload,
} from '@/@types/v2/MaintenancePreventives';

import { MaintenancePreventiveItemsFieldArray } from './MaintenancePreventiveItemsFieldArray';
import { useMaintenancePreventiveDetailQuery } from './useManutencoesPreventivas';

const MANUTENCOES_PREVENTIVAS_LIST_ROUTE = '/frota/preventivas';

const defaultValues: MaintenancePreventiveFormType = {
  date: null,
  employee_uuid: null,
  items: [
    {
      equipment_uuid: null,
      message: '',
      date: null,
      note: null,
      hour_meter_km: null,
    },
  ],
};

export default function CreateOrUpdateManutencaoPreventiva() {
  const { maintenancePreventiveId } = useParams<{ maintenancePreventiveId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const { user: authUser } = useAuth();

  // Rota `/frota/preventivas/novo` é declarada ANTES de
  // `/frota/preventivas/:maintenancePreventiveId` no router (mirror
  // `CreateOrUpdateAbastecimento.tsx`) — nela `maintenancePreventiveId` vem
  // `undefined`, então `isEditing` já nasce `false`.
  const isEditing = isValidGuid(maintenancePreventiveId);

  const text = languageGB.maintenancePreventives.maintenancePreventive;
  const formText = text.form;

  const canSave = isEditing
    ? can('maintenance-preventives_edit')
    : can('maintenance-preventives_create');

  // Guard de navegação (`get_pwa_form_query_pattern` §"Guard de navegação")
  // — `maintenancePreventiveId` malformado (não-UUID, só possível na rota
  // `:maintenancePreventiveId`) redireciona ANTES de renderizar o form.
  useEffect(() => {
    if (maintenancePreventiveId && !isValidGuid(maintenancePreventiveId)) {
      navigate(MANUTENCOES_PREVENTIVAS_LIST_ROUTE, { replace: true });
    }
  }, [maintenancePreventiveId, navigate]);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, dirtyFields, isSubmitting },
  } = useForm<MaintenancePreventiveFormType>({
    mode: 'onChange',
    defaultValues,
  });

  const [detail, setDetail] = useState<MaintenancePreventiveDetail | null>(null);
  const [itemsError, setItemsError] = useState<string | null>(null);

  // LEI 2 — `fillForm` nomeada com guarda `isEmpty(dirtyFields)`
  // (`get_pwa_form_query_pattern` §"A Lei mais violada"), `resetForce=true`
  // na carga inicial (`useCustomFormQueryByGuid` chama sempre com
  // `resetForce=true` — mirror `useAbastecimentos`/`fillSupplyForm`).
  function fillMaintenancePreventiveForm(data: MaintenancePreventiveDetail, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      setDetail(data);
      reset({
        date: data.date,
        employee_uuid: data.employee
          ? { value: data.employee.uuid, label: data.employee.name }
          : null,
        items: data.items.map((item) => ({
          equipment_uuid: { value: item.equipment.uuid, label: item.equipment.description },
          message: item.message,
          date: item.date,
          note: item.note,
          hour_meter_km: item.hour_meter_km,
        })),
      });
    }
  }

  useMaintenancePreventiveDetailQuery({
    registrationId: isEditing ? maintenancePreventiveId : undefined,
    fillForm: fillMaintenancePreventiveForm,
  });

  const watchedItems = watch('items');
  useEffect(() => {
    if (itemsError && (watchedItems ?? []).length > 0) {
      setItemsError(null);
    }
  }, [itemsError, watchedItems]);

  const maintenancePreventiveMutation = useRequest({
    asyncFunction: tryPersistMaintenancePreventive,
    entityName: text.singularLabel,
    queryKey: queryKey.maintenancePreventives.maintenancePreventive,
    queryKey2: queryKey.maintenancePreventives.maintenancePreventives,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(MANUTENCOES_PREVENTIVAS_LIST_ROUTE);
    },
  });

  // Full-replace de `items[]` (contrato Tarefa 40: "detach total + reattach
  // do payload submetido") — o Front envia o array COMPLETO de linhas
  // atuais, sem diff/patch por linha.
  async function tryPersistMaintenancePreventive(data: MaintenancePreventiveFormType) {
    const payload: MaintenancePreventivePayload = {
      date: data.date!,
      employee_uuid: data.employee_uuid?.value ?? undefined,
      items: data.items
        .filter((item) => item.equipment_uuid)
        .map((item) => ({
          equipment_uuid: item.equipment_uuid!.value,
          message: item.message,
          date: item.date ?? undefined,
          note: item.note?.trim() || undefined,
          hour_meter_km: item.hour_meter_km ?? undefined,
        })),
    };
    if (isEditing && maintenancePreventiveId) {
      return updateMaintenancePreventive(maintenancePreventiveId, payload);
    }
    return createMaintenancePreventive(payload);
  }

  async function onSubmit(data: MaintenancePreventiveFormType) {
    // LEI 2 — em edição, sem campos sujos não há nada a salvar. `isEmpty`
    // (`src/utils/isEmpty.ts`) tem semântica INVERTIDA (ERRO-FE-001 —
    // retorna `true` quando o objeto TEM chaves) — guard correto exige a
    // negação `!isEmpty(dirtyFields)` para checar "nada sujo" (ERRO-01,
    // 11-Erros_Frontend_UI; mesma classe já corrigida em
    // `CreateOrUpdatePlanning.tsx`/`CreateOrUpdateBullSeedSeason.tsx`).
    if (isEditing && !isEmpty(dirtyFields)) return;
    if (data.items.filter((item) => item.equipment_uuid).length === 0) {
      setItemsError(formText.errors.invalidFields);
      return;
    }
    await maintenancePreventiveMutation.mutateAsync(data);
  }

  if (maintenancePreventiveId && !isValidGuid(maintenancePreventiveId)) {
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
            onClick={() => navigate(MANUTENCOES_PREVENTIVAS_LIST_ROUTE)}
          />
          {canSave && (
            <ButtonSaveAndNext
              create={!isEditing}
              dirtyFields={dirtyFields}
              type="button"
              onClick={handleSubmit(onSubmit)}
              languageGB={languageGB}
              loading={isSubmitting || maintenancePreventiveMutation.isPending}
              disabled={isSubmitting || maintenancePreventiveMutation.isPending}
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
            rules={{ required: true }}
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
          <MaintenancePreventiveItemsFieldArray
            control={control}
            errors={errors}
            isDisabled={!canSave || isSubmitting || maintenancePreventiveMutation.isPending}
            itemsError={itemsError}
          />
        </Box>
      </Form>
    </FormContainer>
  );
}
