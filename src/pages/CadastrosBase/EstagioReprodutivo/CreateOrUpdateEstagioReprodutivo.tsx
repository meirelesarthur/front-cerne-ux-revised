// src/pages/CadastrosBase/EstagioReprodutivo/CreateOrUpdateEstagioReprodutivo.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de ESTÁGIO REPRODUTIVO (CategoryMatrix) —
// Cadastros Base > Pecuária (TASK-CATYMT-02).
// Rotas: /cadastros-base/estagio-reprodutivo/novo e
// /cadastros-base/estagio-reprodutivo/:categoryMatrixId (GUID), registradas
// em src/router/index.tsx, guardadas por `catymt_view`.
//
// Referência UX: mesma de TASK-CATYMT-01 — precedente INTERNO
// CadastrosBase/Especies/CreateOrUpdateEspecie.tsx (estrutura mecânica
// idêntica: `isEditing` por GUID, `fillForm` guardado por
// `!isEmpty(dirtyFields) || resetForce`, mutação via `useRequest` com
// `typesRequest` condicional, `ButtonSaveAndNext` com `dirtyFields`).
//
// 3 campos: `description` (Input, obrigatório, máx. 100, único por Espécie —
// DA-05, validado no backend), `is_enabled` (Select Ativo/Inativo — mesmo
// padrão do campo de status em CreateOrUpdateEspecie.tsx, NÃO um Switch) e
// Espécie (`Controller` + `SelectAsyncPaginate`, OBRIGATÓRIO — diferente do
// Centro de Custo em Espécies, que é opcional/nullable).
//
// Select de Espécie — reaproveita 100% o ecossistema real (import direto de
// `listSpecies`, sem cópia), mesmo precedente exato do campo `cost_center_uuid`
// de CreateOrUpdateEspecie.tsx, adaptado de opcional para OBRIGATÓRIO.
//
// Payload de escrita SEMPRE completo (POST e PUT) — `CategoryMatrixRequest`
// exige description/specie_uuid/is_enabled também no update (sem bloco
// condicional por verbo), nunca gated por `dirtyFields`.
//
// ⚠️ `onSubmit`/`fillForm`: `src/utils/isEmpty.ts` é MAL NOMEADA — retorna
// `true` quando o objeto TEM chaves (NÃO vazio) e `false` quando está vazio.
// A condição correta é `isEditing && !isEmpty(dirtyFields) → navigate(-1)`
// (mirror literal de CreateOrUpdateEspecie.tsx, conferido linha a linha
// contra o arquivo real `isEmpty.ts` — NÃO contra o exemplo genérico da tool
// `get_pwa_form_query_pattern`, que tem semântica invertida da real).
// -----------------------------------------------------------------------------

import { Box, SimpleGrid } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import {
  createCategoryMatrix,
  updateCategoryMatrix,
} from '@/services/v2/CategoryMatrices/category-matrix-service';
import { listSpecies } from '@/services/v2/Species/species-service';

import type { Option } from '@/@types/option';
import type {
  CategoryMatrixData,
  CategoryMatrixForm as CategoryMatrixFormType,
  CategoryMatrixPayload,
} from '@/@types/v2/CategoryMatrices/category-matrix';
import type { SpeciesListItem } from '@/@types/v2/Species/species';

import { estagioReprodutivoSchemaResolver } from './estagio-reprodutivo-schema';
import { useCategoryMatrixForm } from './useCategoryMatrices';

export default function CreateOrUpdateEstagioReprodutivo() {
  const { categoryMatrixId } = useParams<{ categoryMatrixId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  // É edição quando existe um GUID válido na rota ("novo" não é GUID).
  const isEditing = isValidGuid(categoryMatrixId);

  const text = languageGB.categoryMatrix.categoryMatrix;

  const canSave = isEditing ? can('catymt_edit') : can('catymt_create');

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<CategoryMatrixFormType>({
    mode: 'onChange',
    resolver: estagioReprodutivoSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      description: '',
      is_enabled: true,
      specie_uuid: null,
    },
  });

  function fillForm(data: CategoryMatrixData, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        uuid: data.uuid,
        description: data.description,
        is_enabled: !!data.is_enabled,
        specie_uuid: data.specie
          ? { label: data.specie.description, value: data.specie.uuid }
          : null,
      });
    }
  }

  const categoryMatrixQuery = useCategoryMatrixForm({
    registrationId: isEditing ? categoryMatrixId : undefined,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([categoryMatrixQuery as any]);

  const categoryMatrixMutation = useRequest({
    asyncFunction: tryPersistCategoryMatrix,
    entityName: text.singularLabel,
    queryKey: queryKey.categoryMatrices.list,
    queryKey2: queryKey.categoryMatrices.detail,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  async function tryPersistCategoryMatrix(data: CategoryMatrixFormType) {
    // UPDATE e CREATE enviam o MESMO conjunto completo — o
    // `CategoryMatrixRequest` (api_root) exige `description`/`is_enabled`/
    // `specie_uuid` também no update (sem bloco condicional por verbo), então
    // NUNCA podem ser gated por `dirtyFields` (mesma recorrência exata de
    // TASK-ESP-FIX-PAYLOAD/Cultivation). `specie_uuid` é obrigatório — o
    // schema yup já garante presença antes do submit.
    const payload: CategoryMatrixPayload = {
      description: data.description.trim(),
      is_enabled: !!data.is_enabled,
      specie_uuid: data.specie_uuid!.value,
    };

    if (isEditing && categoryMatrixId) {
      return await updateCategoryMatrix(categoryMatrixId, payload);
    }

    return await createCategoryMatrix(payload);
  }

  async function onSubmit(data: CategoryMatrixFormType) {
    if (isEditing && !isEmpty(dirtyFields)) {
      // isEditing && SEM alterações (isEmpty real === false → !false === true) → só volta, não salva.
      navigate(-1);
    } else {
      // isEditing && COM alterações, OU modo criação → salva.
      await categoryMatrixMutation.mutateAsync(data);
    }
  }

  const isSubmitting = categoryMatrixMutation.isPending;

  // Reaproveita os textos já existentes da listagem (Ativo/Inativo) — mesmo
  // racional de CreateOrUpdateEspecie.tsx (evita duplicar chave de i18n para
  // o mesmo par de rótulos).
  const statusOptions: Option<boolean>[] = [
    { value: true, label: text.list.table.active },
    { value: false, label: text.list.table.inactive },
  ];

  return (
    <FormContainer
      title={isEditing ? text.form.title.edit : text.form.title.create}
      showDivider
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
                value={statusOptions.find((option) => option.value === value) ?? null}
                onChange={(opt: Option<boolean> | null) => onChange(!!opt?.value)}
                options={statusOptions}
                error={error?.message}
                isRequired
                noClearable
                isDisabled={!canSave}
                loading={isLoading}
              />
            )}
          />
        </SimpleGrid>

        <Box mt={6}>
          <Controller
            name="specie_uuid"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.form.fields.specie}
                placeholder={text.form.placeholders.specie}
                service={listSpecies}
                mapOptions={(item: SpeciesListItem) => ({
                  label: item.description,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                  is_enabled: 'true',
                })}
                value={field.value ?? null} // ⚠️ ARMADILHA #3 — NUNCA ?? undefined
                onChange={(option: any) => field.onChange(option ?? null)}
                isRequired
                error={error?.message}
                isDisabled={!canSave || isLoading}
                menuPortalTarget={document.body} // ⚠️ ARMADILHA #2 — obrigatório
                menuPosition="fixed"
              />
            )}
          />
        </Box>
      </Form>
    </FormContainer>
  );
}
