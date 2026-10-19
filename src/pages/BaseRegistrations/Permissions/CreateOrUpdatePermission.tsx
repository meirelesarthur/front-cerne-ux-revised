// src/pages/BaseRegistrations/Permissions/CreateOrUpdatePermission.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de Permissão — Cadastros Base, execução 032,
// TASK-FE-2402. Rotas `/cadastros-base/permissoes/novo` e
// `/cadastros-base/permissoes/:uuid`.
//
// Molde estrutural: `SystemUpdates/CreateOrUpdateSystemUpdate.tsx`
// (`useCustomFormQueryByGuid` + `useRequest` INLINE, guarda
// `!isEmpty(dirtyFields)`) — mais simples: 2 campos texto curtos, nenhum
// componente especial (nem data, nem rich-text, nem FK).
//
// `guard_name` NÃO entra no formulário — o backend defaulta para 'web'
// (contrato de tela §4): expor esse campo inventaria uma opção que o legado
// nunca teve e que nenhuma tela do sistema hoje precisa trocar.
//
// Guard de UUID malformado: redireciona para a listagem (mesmo padrão de
// `SystemUpdateDetalhe.tsx`).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { SimpleGrid } from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { permissionSchemaResolver } from '@/validations/schemas/BaseRegistrations/permission-schema';

import {
  createPermission,
  getPermission,
  updatePermission,
} from '@/services/v2/BaseRegistrations/permission-service';

import type {
  PermissionDetail,
  PermissionForm as PermissionFormType,
  PermissionPayload,
} from '@/@types/v2/BaseRegistrations/permission';

const PERMISSIONS_LIST_ROUTE = '/cadastros-base/permissoes';

export default function CreateOrUpdatePermission() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const text = languageGB.baseRegistrations.permission;

  // É edição quando existe um GUID válido na rota ("novo" não é GUID).
  const isEditing = isValidGuid(uuid);

  // Guard de navegação — um `:uuid` malformado (nem "novo" nem um GUID real)
  // não deve renderizar o formulário: redireciona para a listagem.
  useEffect(() => {
    if (uuid && uuid !== 'novo' && !isValidGuid(uuid)) {
      navigate(PERMISSIONS_LIST_ROUTE, { replace: true });
    }
  }, [uuid, navigate]);

  const canSave = isEditing ? can('permissions_edit') : can('permissions_create');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<PermissionFormType>({
    mode: 'onChange',
    resolver: permissionSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      description: '',
    },
  });

  // ⚠️ `!isEmpty(dirtyFields)` — `isEmpty(obj)` retorna `true` quando `obj`
  // TEM ao menos uma chave (semântica invertida, `ERRO-FE-001` catalogado em
  // `Warehouses/CreateOrUpdateWarehouses.tsx`). Só sobrescreve o form quando
  // NÃO há edição do usuário em andamento (`dirtyFields` vazio) OU quando
  // forçado (`resetForce`) — Lei 2 obrigatória mesmo em formulário de 2 campos.
  function fillPermissionForm(data: PermissionDetail, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        uuid: data.uuid,
        name: data.name,
        description: data.description,
      });
    }
  }

  const permissionQuery = useCustomFormQueryByGuid<PermissionDetail>({
    registrationId: isEditing ? uuid : undefined,
    queryKey: queryKey.baseRegistrations.permission,
    asyncFunction: getPermission,
    fillForm: fillPermissionForm,
  });

  const isLoading = isEditing && checkLoadingStatus([permissionQuery as any]);

  const permissionMutation = useRequest({
    asyncFunction: tryPersistPermission,
    entityName: text.singularLabel,
    queryKey: queryKey.baseRegistrations.permissions,
    queryKey2: queryKey.baseRegistrations.permission,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  async function tryPersistPermission(data: PermissionFormType) {
    const payload: PermissionPayload = {
      name: data.name,
      description: data.description,
    };

    if (isEditing && uuid) {
      return await updatePermission(uuid, payload);
    }

    return await createPermission(payload);
  }

  // Mesmo atalho de `SystemUpdate`/`Warehouses`: em edição, se NADA mudou, só
  // volta pra lista sem chamar a mutação (evita PUT vazio).
  async function onSubmit(data: PermissionFormType) {
    if (isEditing && !isEmpty(dirtyFields)) {
      navigate(-1);
    } else {
      await permissionMutation.mutateAsync(data);
    }
  }

  const isSubmitting = permissionMutation.isPending;

  if (uuid && uuid !== 'novo' && !isValidGuid(uuid)) {
    return null;
  }

  return (
    <FormContainer
      title={isEditing ? text.form.title.edit : text.form.title.create}
      subtitle={isEditing ? text.form.subtitle.edit : text.form.subtitle.create}
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
              form="permission-form"
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
      <Form id="permission-form" noPadding onSubmit={handleSubmit(onSubmit)}>
        <SimpleGrid columns={columnsForm.default} gap={6}>
          <Input
            {...register('name')}
            label={text.form.fields.name}
            isRequired
            disabled={!canSave || isLoading}
            error={errors.name?.message}
            maxLength={60}
          />

          <Input
            {...register('description')}
            label={text.form.fields.description}
            isRequired
            disabled={!canSave || isLoading}
            error={errors.description?.message}
            maxLength={191}
          />
        </SimpleGrid>
      </Form>
    </FormContainer>
  );
}
