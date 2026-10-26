// src/pages/Integracoes/Compartilhamento/CreateOrUpdateCompartilhamento.tsx
// -----------------------------------------------------------------------------
// Formulário ÚNICO de criação/edição de Compartilhamento (Sharing —
// Integrações, F-122, 97-Esteiras/070, TASK-CP-FE-02). MESMO componente para
// os dois casos (`isEditing = isValidGuid(sharingUuid)`, mirror
// `CreateOrUpdateContrato.tsx`). Rotas `/integracoes/compartilhamento/novo`
// (create) e `/integracoes/compartilhamento/:sharingUuid/editar` (edit) —
// wiring de rota é `src/router/index.tsx` (não tocado aqui).
//
// 4 campos NESTA ORDEM EXATA (`CL-024`, não reordenar):
//   1) `date` (`DateInput`, required, default hoje no create)
//   2) "Responsável" — campo READ-ONLY PURO (`InputReadOnly`, mirror `code`/
//      `amount` de `CreateOrUpdateContrato.tsx`): NÃO é um `Field` do
//      `useForm` — nunca entra em `dirtyFields`/payload. Create: nome do
//      usuário logado (`useAuth().user.username`). Edit: `data.user.name`
//      vindo do `GET /sharings/{uuid}` hidratado (`BR-01`/`CL-016`).
//   3) `tenant_uuid` "Contratante" (`SelectAsyncPaginate` → `listTenantDirectory`,
//      endpoint NOVO `/tenants/directory`, DISTINTO de `/tenants/options`
//      — `SURF-010`/reuso rejeitado no contrato de API)
//   4) `items[]` (`ui/Checkbox` ÚNICO, `value="markings"`, label "Marcação")
//
// Corrige `DIV-02` do legado (nunca exibia erro de validação nem repopulava
// o form) — os 422 aparecem por campo automaticamente pelo padrão do projeto
// (`get_spa_api_client_pattern`).
//
// Update ENVIA PAYLOAD COMPLETO (`SharingRequest` da API exige `date`/
// `tenant_uuid`/`items` como `required` também no update, sem `sometimes`;
// PATCH parcial por `dirtyFields` gerava 422 — mirror do fix de
// Pátios/Setores). `BR-02`: `farm_id`/`user_id` nunca reenviados — nem
// sequer existem como campos do form.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Box, SimpleGrid } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';
import { Checkbox } from '@/components/ui/checkbox';

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';
import { todayLocalIso } from '@/utils/localDate';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { sharingSchemaResolver } from '@/validations/schemas/Sharings/sharing-schema';

import { createSharing, updateSharing } from '@/services/v2/Sharings/sharing-service';
import { listTenantDirectory } from '@/services/v2/Tenants/tenant-directory-service';

import type {
  SharingDetail,
  SharingForm as SharingFormType,
  SharingPayload,
} from '@/@types/v2/Sharings';
import type { TenantDirectoryOptionItem } from '@/@types/v2/Tenants/directory';

import { useSharingForm } from './useSharings';

const SHARINGS_LIST_ROUTE = '/integracoes/compartilhamento';

export default function CreateOrUpdateCompartilhamento() {
  const { sharingUuid } = useParams<{ sharingUuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const { user } = useAuth();

  const isEditing = isValidGuid(sharingUuid);

  // Guard de navegação: `sharingUuid` presente mas NÃO é um GUID válido (URL
  // adulterada) — redireciona para a listagem (mirror
  // `CreateOrUpdateContrato.tsx`/`CreateOrUpdateAcasalamento.tsx`).
  useEffect(() => {
    if (sharingUuid && !isValidGuid(sharingUuid)) {
      navigate(SHARINGS_LIST_ROUTE, { replace: true });
    }
  }, [sharingUuid, navigate]);

  const text = languageGB.sharings;

  const canCreate = can('sharings_create');
  const canEdit = can('sharings_edit');
  const canSave = isEditing ? canEdit : canCreate;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<SharingFormType>({
    mode: 'onChange',
    resolver: sharingSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      date: todayLocalIso(),
      tenant_uuid: null,
      items: [],
    },
  });

  // Lei 2: função nomeada com guarda `!isEmpty(dirtyFields) || resetForce`.
  // "Responsável" NUNCA popula o form — não existe no `SharingForm`, só é
  // exibido fora do `<Form>` (via `sharingData?.user.name`, ver abaixo).
  function fillSharingForm(data: SharingDetail, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        date: data.date,
        tenant_uuid: { label: data.tenant.label, value: data.tenant.uuid },
        items: data.items ?? [],
      });
    }
  }

  const sharingQuery = useSharingForm(isEditing ? sharingUuid : undefined, fillSharingForm);

  const isLoading = isEditing && checkLoadingStatus([sharingQuery as any]);
  const sharingData = (sharingQuery as any)?.data as SharingDetail | undefined;

  // "Responsável": Create → usuário logado; Edit → dono original do registro
  // (`sharingData?.user.name`, pode ser diferente do usuário logado).
  const responsibleName = isEditing ? (sharingData?.user.name ?? '') : (user?.username ?? '');

  async function tryPersistSharing(data: SharingFormType) {
    const payload: SharingPayload = {
      date: data.date,
      tenant_uuid: data.tenant_uuid!.value,
      items: data.items,
    };

    if (isEditing && sharingUuid) {
      // Update COMPLETO — `SharingRequest` (API) exige `date`/`tenant_uuid`/
      // `items` como `required` também no update (sem `sometimes`); PATCH
      // parcial por `dirtyFields` causava 422 nos campos não alterados
      // (mirror do fix de Pátios/Setores). `farm_id`/`user_id` continuam
      // fora do payload — nem sequer são campos do form (`BR-02`).
      return updateSharing(sharingUuid, payload);
    }
    return createSharing(payload);
  }

  const sharingMutation = useRequest({
    asyncFunction: tryPersistSharing,
    entityName: text.singularLabel,
    queryKey: queryKey.sharings.detail,
    queryKey2: queryKey.sharings.list,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(SHARINGS_LIST_ROUTE);
    },
  });

  async function onSubmit(data: SharingFormType) {
    if (isEditing && Object.keys(dirtyFields).length === 0) {
      navigate(SHARINGS_LIST_ROUTE);
    } else {
      await sharingMutation.mutateAsync(data);
    }
  }

  const isSubmitting = sharingMutation.isPending;

  return (
    <FormContainer
      title={isEditing ? text.form.editTitle : text.form.createTitle}
      footer={
        <>
          <Button
            title={languageGB.defaltStrings.cancel}
            variant="secondary"
            type="button"
            onClick={() => navigate(SHARINGS_LIST_ROUTE)}
            disabled={isSubmitting}
          />
          {canSave && (
            <Button
              title={text.form.save}
              type="submit"
              form="sharing-form"
              loading={isSubmitting}
              disabled={isSubmitting || !!isLoading}
            />
          )}
        </>
      }
    >
      <Form id="sharing-form" onSubmit={handleSubmit(onSubmit)} noPadding>
        <SimpleGrid columns={columnsForm.default} gap={6}>
          {/* 1) date */}
          <Box>
            <Box mb={1} fontSize="sm" fontWeight="medium">
              {text.form.fields.date}
              <Box as="span" color="fg.error">
                {' '}
                *
              </Box>
            </Box>
            <Controller
              name="date"
              control={control}
              render={({ field: { value, onChange } }) => (
                <DateInput
                  value={value ?? null}
                  onChange={onChange}
                  disabled={!canSave || !!isLoading}
                />
              )}
            />
            {errors.date?.message && (
              <Box color="fg.error" fontSize="xs" mt={1}>
                {errors.date.message as string}
              </Box>
            )}
          </Box>

          {/* 2) Responsável — read-only puro, fora do useForm/payload */}
          <InputReadOnly
            label={text.form.fields.responsible}
            value={responsibleName}
            loading={!!isLoading}
          />

          {/* 3) tenant_uuid ("Contratante") — SelectAsyncPaginate → /tenants/directory */}
          <Controller
            name="tenant_uuid"
            control={control}
            render={({ field, fieldState }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.form.fields.tenant}
                placeholder={text.form.placeholders.tenant}
                error={fieldState.error?.message as string | undefined}
                service={listTenantDirectory}
                mapOptions={(item: TenantDirectoryOptionItem) => ({
                  label: item.label,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? undefined}
                onChange={(option: any) => field.onChange(option ?? null)}
                isRequired
                isDisabled={!canSave || !!isLoading}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          {/* 4) items[] — checkbox ÚNICO, value fixo "markings" */}
          <Box>
            <Box mb={1} fontSize="sm" fontWeight="medium">
              {text.form.fields.items}
              <Box as="span" color="fg.error">
                {' '}
                *
              </Box>
            </Box>
            <Controller
              name="items"
              control={control}
              render={({ field }) => (
                <Checkbox
                  checked={field.value?.includes('markings') ?? false}
                  disabled={!canSave || !!isLoading}
                  onCheckedChange={(details: { checked: boolean | 'indeterminate' }) =>
                    field.onChange(details.checked === true ? ['markings'] : [])
                  }
                >
                  {text.form.itemsLabel}
                </Checkbox>
              )}
            />
            {errors.items?.message && (
              <Box color="fg.error" fontSize="xs" mt={1}>
                {errors.items.message as string}
              </Box>
            )}
          </Box>
        </SimpleGrid>
      </Form>
    </FormContainer>
  );
}
