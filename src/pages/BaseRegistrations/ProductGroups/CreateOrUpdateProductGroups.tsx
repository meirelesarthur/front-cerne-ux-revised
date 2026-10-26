// src/pages/BaseRegistrations/ProductGroups/CreateOrUpdateProductGroups.tsx
// -----------------------------------------------------------------------------
// Tela de CRIAÇÃO e EDIÇÃO de GRUPO DE PRODUTO (mesmo arquivo para os dois
// casos, TASK-GRP-02). Rotas: /cadastros-base/produtos/grupos/novo (criar) e
// /cadastros-base/produtos/grupos/:groupProductId (editar, GUID) — ambas
// registradas em src/router/index.tsx, guardadas por `groupproducts_view`.
//
// Estrutura mecânica idêntica a CadastrosBase/Racas/CreateOrUpdateRaca.tsx
// (precedente mais simples do projeto — grid flat, sem hierarquia),
// simplificada ainda mais: 2 campos, sem NENHUM Select de FK (Grupos de
// Produto não tem Espécie nem Antecessor). `is_enabled` usa `Select`
// (Ativo/Inativo — seção "Componentes" da Tarefa), não `Switch`.
//
// ACHADO/DECISÃO DE IMPLEMENTAÇÃO — payload SEMPRE completo (TASK-GRP-02,
// seção "Guard vs. Payload"): `GroupProductRequest::rules()` exige
// `description` E `is_enabled` como `required` em AMBOS os verbos (POST e
// PUT) — confirmado por leitura direta de
// `api_root/app/Http/Requests/Api/V1/GroupProductRequest.php`. Por isso
// `tryPersistProductGroup` abaixo monta o payload INTEIRO em ambos os modos
// (create/update) — nunca um delta parcial de `dirtyFields`. `dirtyFields`
// continua usado apenas para decidir SE há algo a salvar
// (`isEmpty(dirtyFields)`) e para o rótulo do `ButtonSaveAndNext` — nunca
// para montar um PATCH parcial (mesmo padrão de CreateOrUpdateRaca.tsx/
// CreateOrUpdateCentroCusto.tsx, que também nunca enviam PATCH
// verdadeiramente parcial).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { SimpleGrid } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';
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

import { productGroupsSchemaResolver } from '@/validations/schemas/BaseRegistrations/productGroups-schema';

import {
  createProductGroup,
  getProductGroup,
  updateProductGroup,
} from '@/services/v2/ProductGroups/product-group-service';

import type { Option } from '@/@types/option';
import type {
  ProductGroupDetail,
  ProductGroupForm as ProductGroupFormType,
  ProductGroupPayload,
} from '@/@types/v2/ProductGroups/product-group';

export default function CreateOrUpdateProductGroups() {
  const { groupProductId } = useParams<{ groupProductId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  // É edição quando existe um GUID válido na rota ("novo" não casa com
  // `/:groupProductId` — é uma rota irmã distinta registrada em
  // router/index.tsx).
  const isEditing = isValidGuid(groupProductId);

  // Guard de navegação: um `groupProductId` presente mas que NÃO é um GUID
  // válido (ex.: URL adulterada manualmente) não deve chegar ao hook de
  // query nem renderizar um form "fantasma" — redireciona para a listagem,
  // mesmo racional do guard de CreateOrUpdateRaca.tsx/
  // CreateOrUpdateCentroCusto.tsx.
  useEffect(() => {
    if (groupProductId && !isValidGuid(groupProductId)) {
      navigate('/cadastros-base/produtos/grupos', { replace: true });
    }
  }, [groupProductId, navigate]);

  const text = languageGB.productGroups.productGroup;

  const enabledOptions: Option<string>[] = [
    { value: 'true', label: text.form.isEnabledOptions.active },
    { value: 'false', label: text.form.isEnabledOptions.inactive },
  ];

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<ProductGroupFormType>({
    mode: 'onChange',
    resolver: productGroupsSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      description: '',
      is_enabled: 'true',
    },
  });

  function fillForm(data: ProductGroupDetail, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        description: data.description,
        is_enabled: data.is_enabled ? 'true' : 'false',
      });
    }
  }

  const productGroupQuery = useCustomFormQueryByGuid<ProductGroupDetail>({
    registrationId: isEditing ? groupProductId : undefined,
    queryKey: queryKey.productGroups.detail,
    asyncFunction: getProductGroup,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([productGroupQuery as any]);

  // Sem flags de autorização por item no `GroupProductResource` — permissão
  // GLOBAL basta (mesmo padrão de Perfil/Racas/CreateOrUpdate*.tsx).
  const canSave = isEditing ? can('groupproducts_edit') : can('groupproducts_create');

  const productGroupMutation = useRequest({
    asyncFunction: tryPersistProductGroup,
    entityName: text.singularLabel,
    queryKey: queryKey.productGroups.list,
    queryKey2: queryKey.productGroups.detail,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  // Ver nota de cabeçalho do arquivo: payload SEMPRE completo (create e
  // update) — `GroupProductRequest::rules()` exige `description`/
  // `is_enabled` em ambos os verbos, sem suporte a PATCH parcial.
  async function tryPersistProductGroup(data: ProductGroupFormType) {
    const payload: ProductGroupPayload = {
      description: data.description.trim(),
      is_enabled: data.is_enabled === 'true',
    };

    if (isEditing && groupProductId) {
      return await updateProductGroup(groupProductId, payload);
    }
    return await createProductGroup(payload);
  }

  // Guard do submit: só dispara a chamada de update quando HÁ mudança real
  // (`isEmpty(dirtyFields)` — `isEmpty` é MAL NOMEADA: retorna `true` quando
  // o objeto TEM chaves, ou seja, quando NÃO está vazio; ver
  // src/utils/isEmpty.ts). Em modo criação, sempre dispara. Em edição sem
  // nenhum campo tocado (`dirtyFields` vazio → `isEmpty` retorna `false`),
  // evita um PUT desnecessário — apenas volta.
  async function onSubmit(data: ProductGroupFormType) {
    if (isEditing && isEmpty(dirtyFields)) {
      await productGroupMutation.mutateAsync(data);
      return;
    }

    if (isEditing) {
      navigate(-1);
      return;
    }

    await productGroupMutation.mutateAsync(data);
  }

  const isSubmitting = productGroupMutation.isPending;

  const watchedDescription = watch('description');
  const descriptionLength = (watchedDescription ?? '').length;

  return (
    <FormContainer
      title={isEditing ? text.form.title.edit : text.form.title.create}
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
      <Form noPadding onSubmit={handleSubmit(onSubmit)}>
        <SimpleGrid columns={columnsForm.default} gap={6}>
          <Input
            label={text.form.fields.description}
            placeholder={text.form.placeholders.description}
            helperText={errors.description?.message ? undefined : `${descriptionLength}/100`}
            {...register('description')}
            error={errors.description?.message}
            isRequired
            loading={isLoading}
            disabled={!canSave}
          />

          <Controller
            name="is_enabled"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <Select
                label={text.form.fields.isEnabled}
                name={name}
                value={enabledOptions.find((o) => o.value === value) ?? null}
                onChange={(opt: Option<string> | null) =>
                  onChange(opt?.value as ProductGroupFormType['is_enabled'])
                }
                options={enabledOptions}
                error={error?.message}
                isRequired
                isDisabled={!canSave}
                loading={isLoading}
              />
            )}
          />
        </SimpleGrid>
      </Form>
    </FormContainer>
  );
}
