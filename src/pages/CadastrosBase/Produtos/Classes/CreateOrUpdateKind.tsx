// src/pages/CadastrosBase/Produtos/Classes/CreateOrUpdateKind.tsx
// -----------------------------------------------------------------------------
// Tela de CRIAÇÃO e EDIÇÃO de CLASSE DE PRODUTO (Kind — mesmo arquivo para os
// dois casos, mirror direto de Racas/CreateOrUpdateRaca.tsx). Rotas:
// /cadastros-base/produtos/classes/novo (criar) e
// /cadastros-base/produtos/classes/:kindId (editar, GUID) — ambas registradas
// em src/router/index.tsx (TASK-FE-463), guardadas por `kinds_view`
// (autorização real de create/edit é 403 do backend + gate fino via `can()`).
//
// Cadastro simples de 3 campos, sem wizard (UX-GAP resolvido no contrato §2 —
// segue o padrão single-page consolidado do fork, não o wizard de 3 steps de
// ProdutoForm.tsx).
//
// `category_uuid` (Select assíncrono) — espelhava EXATAMENTE o campo
// `specie_uuid` de Racas/CreateOrUpdateRaca.tsx (Controller + SelectAsyncPaginate
// + `listActiveCategoryProducts`, TASK-FE-460), obrigatório.
//
// REPONTAMENTO (TASK-FE-945, correção pós-E2E): `listActiveCategoryProducts`
// (`GET /category-products/active`, gateado por `category-products_view` —
// causa do toast "Sem permissão" no E2E do dev) migrou para
// `listCategoryProductOptions` (`GET /category-products/options`,
// TASK-FE-942/TASK-BE-600) — lookup FLAT, SEM gate de permissão.
// `category_uuid` aqui é o TOPO da cascata deste submódulo (Classe não tem
// Grupo acima) — sem parâmetro de pai, repontamento mecânico.
// `listActiveCategoryProducts` continua existindo em
// `category-product-service.ts` para outros consumidores.
//
// Payload SEMPRE completo em create E update — `KindRequest::rules()` NÃO
// diferencia store/update por método (mesma nota de `BreedRequest`,
// Kind-Frontend-Contrato.md §1): `name`, `is_enabled` e `category_uuid` são
// `required` em AMBOS os verbos. `dirtyFields` é usado só para decidir se há
// algo a salvar (`isEmpty(dirtyFields)`) e para o rótulo do botão
// (`ButtonSaveAndNext`) — nunca para montar um PATCH parcial.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Box, Flex, SimpleGrid, Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';
import { Switch } from '@/components/ui/switch';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { listCategoryProductOptions } from '@/services/v2/CategoryProducts/category-product-service';
import { createKind, updateKind } from '@/services/v2/Kinds/kind-service';

import type { CategoryProductOption } from '@/@types/v2/CategoryProducts';
import type { KindData, KindForm as KindFormType, KindPayload } from '@/@types/v2/Kinds';

import { kindSchemaResolver } from './kind-schema';
import { useKindForm } from './useKinds';

export default function CreateOrUpdateKind() {
  const { kindId } = useParams<{ kindId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  // É edição quando existe um GUID válido na rota ("novo" não casa com
  // `/:kindId` — é uma rota irmã distinta registrada em router/index.tsx).
  const isEditing = isValidGuid(kindId);

  // Guard de navegação: um `kindId` presente mas que NÃO é um GUID válido
  // (ex.: URL adulterada manualmente) não deve chegar ao hook de query nem
  // renderizar um form "fantasma" — redireciona para a listagem, mesmo
  // racional do guard de `get_pwa_form_query_pattern` (CreateOrUpdateRaca.tsx).
  useEffect(() => {
    if (kindId && !isValidGuid(kindId)) {
      navigate('/cadastros-base/produtos/classes', { replace: true });
    }
  }, [kindId, navigate]);

  const text = languageGB.kinds.kind;

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<KindFormType>({
    mode: 'onChange',
    resolver: kindSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      is_enabled: true,
      category_uuid: null,
    },
  });

  function fillForm(data: KindData, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        name: data.name,
        is_enabled: !!data.is_enabled,
        category_uuid: data.category
          ? { label: data.category.description, value: data.category.uuid }
          : null,
      });
    }
  }

  const kindQuery = useKindForm({
    registrationId: isEditing ? kindId : undefined,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([kindQuery as any]);

  // Sem flags de autorização por item no `KindResource` — permissão GLOBAL
  // basta. Permissões REAIS do backend (kinds_*, confirmadas contra o banco
  // em TASK-FE-916 — `product_kinds_*` era nome fantasma).
  const canSave = isEditing ? can('kinds_edit') : can('kinds_create');

  const kindMutation = useRequest({
    asyncFunction: tryPersistKind,
    entityName: text.singularLabel,
    queryKey: queryKey.kinds.list,
    queryKey2: queryKey.kinds.detail,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  // Ver nota de cabeçalho do arquivo: payload SEMPRE completo (create e
  // update) — `KindRequest::rules()` exige `name`/`is_enabled`/
  // `category_uuid` em ambos os verbos, sem suporte a PATCH parcial.
  async function tryPersistKind(data: KindFormType) {
    const payload: KindPayload = {
      name: data.name.trim(),
      is_enabled: !!data.is_enabled,
      category_uuid: data.category_uuid!.value,
    };

    if (isEditing && kindId) {
      return await updateKind(kindId, payload);
    }
    return await createKind(payload);
  }

  async function onSubmit(data: KindFormType) {
    if (isEditing && !isEmpty(dirtyFields)) {
      navigate(-1);
    } else {
      await kindMutation.mutateAsync(data);
    }
  }

  const isSubmitting = kindMutation.isPending;

  const watchedName = watch('name');
  const nameLength = (watchedName ?? '').length;

  return (
    <FormContainer
      title={isEditing ? text.form.title.edit : text.form.title.create}
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
            label={text.form.fields.name}
            placeholder={text.form.placeholders.name}
            helperText={errors.name?.message ? undefined : `${nameLength}/100`}
            {...register('name')}
            error={errors.name?.message}
            isRequired
            loading={isLoading}
            disabled={!canSave}
          />

          <Controller
            name="is_enabled"
            control={control}
            render={({ field }) => (
              <Flex align="center" justify="space-between" h="full">
                <Text fontSize="sm" fontWeight="medium">
                  {text.form.fields.isEnabled}
                </Text>
                {/* @ts-ignore - Chakra UI v3 Switch API */}
                <Switch
                  checked={!!field.value}
                  onCheckedChange={(d: any) => field.onChange(d.checked)}
                  colorPalette="green"
                  disabled={!canSave || isLoading}
                  aria-label={text.form.fields.isEnabled}
                />
              </Flex>
            )}
          />
        </SimpleGrid>

        <Box mt={6}>
          <Controller
            name="category_uuid"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.form.fields.category}
                placeholder={text.form.placeholders.category}
                error={errors.category_uuid?.message as string | undefined}
                service={listCategoryProductOptions}
                mapOptions={(item: CategoryProductOption) => ({
                  label: item.label,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? undefined}
                onChange={(option: any) => field.onChange(option ?? null)}
                isRequired
                isDisabled={!canSave}
                // Mesmo fix de FilterSideRacas.tsx/CreateOrUpdateRaca.tsx: o
                // menu não-portalizado é recortado pelo container do form
                // (último campo antes do FormFooter). Portaliza no <body>,
                // SEM `position="fixed"` (essa prop é injetada no style do
                // menu INTERNO via SelectComponent.ts e forçaria o menu pra
                // fora da tela em modo portal — deixa no default "absolute").
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />
        </Box>
      </Form>
    </FormContainer>
  );
}
