// src/pages/CadastrosBase/CategoriasAnimais/CreateOrUpdateCategoriaAnimal.tsx
// -----------------------------------------------------------------------------
// Tela de CRIAÇÃO e EDIÇÃO de CATEGORIA ANIMAL (mesmo arquivo para os dois
// casos, TASK-FE-542). Rotas: /cadastros-base/categorias-animais/novo (criar)
// e /cadastros-base/categorias-animais/:categoryAnimalId (editar, GUID) —
// registradas em src/router/index.tsx por TASK-FE-544 (CHOKEPOINT, fora do
// escopo desta Tarefa).
//
// SEM `product_uuid` — campo reservado para TASK-FE-543 (dependência cruzada
// da feature Produtos). SEM `descriptive`/`vl_residual` — nunca expostos no
// formulário, fiéis ao legado (backend auto-preenche em
// `prepareForValidation()`, contrato §1).
//
// `is_enabled` — Select Ativa/Inativa via `Controller` + `@/components/Form/
// Select` + fábrica GLOBAL `statusOptions` (NÃO `Switch` — `Racas`/`Kind`
// usam `Switch` por DRIFT catalogado, contrato §6, não replicado aqui; molde
// seguido é `Especies`).
//
// `specie_uuid` — espelha EXATAMENTE o campo homônimo de
// `CreateOrUpdateRaca.tsx` (Controller + SelectAsyncPaginate + `listSpecies`,
// obrigatório, `menuPortalTarget`/`menuPosition="fixed"` pra não recortar no
// container do form).
//
// `gender` — Select via `Controller` + `genderOptions.options` (enum
// M/F/A), default `'A'` na criação (fiel ao `Gender::BOTH` do legado).
//
// `start_month`/`end_month` — `Controller` + `@/components/Form/NumberInput`
// `decimalPlaces={0}` `min={0}`, SEM `max` (pós `TASK-BE-541` — o teto de 12
// foi removido no backend por infidelidade ao legado; replicar aqui
// reintroduziria o mesmo bug pelo lado do cliente). `Controller` obrigatório
// — o componente emite `number | null`, nunca um evento DOM cru (mesmo
// racional de `MoneyInput`/`FamiliaBens`).
//
// `next_category_uuid` — self-referencing: consome o PRÓPRIO
// `listCategoryAnimals` (mesma feature, TASK-FE-540), nullable/opcional.
// ACHADO DE IMPLEMENTAÇÃO (não estava no texto da Tarefa): `CategoryAnimalResource`
// NÃO devolve um `next_category: {uuid, description}` aninhado (diferente de
// `specie`/`parent` de outros módulos self-referencing do fork, ex.
// `CostCenter.parent`/`Cultivation.parent`) — só o uuid cru. Pra não abrir o
// form de edição com o Select "vazio" mesmo com o vínculo salvo (mesma classe
// de bug de PREFILL já registrada na execução 024), `fillForm` faz um GET
// extra ao PRÓPRIO catálogo (`getCategoryAnimalByUuid`, já usado para o
// registro principal) pra resolver o rótulo ANTES do `reset()` — nunca depois
// (evita a corrida reset()+setValue() assíncrono). Se o GET falhar, cai no
// fallback "uuid como label" (mesmo padrão de `FilterSideCategoriasAnimais`
// `specie_label ?? specie_uuid`) — nunca perde o vínculo salvo, só não mostra
// um nome bonito.
//
// `product_uuid` — mesma lógica de preservação: como este formulário NÃO
// renderiza nenhum controle pra esse campo, o valor cru vindo do GET
// (`data.product_uuid`) é ecoado de volta no `reset()` como um `Option` com
// label vazio (nunca exibido) e repassado ao payload sem alteração. Isso
// evita que o payload — que é SEMPRE full-replace (contrato §1, `Request`
// não diferencia por verbo) — apague silenciosamente um `product_uuid` já
// salvo (ex.: registro legado migrado com produto vinculado) até
// `TASK-FE-543` trazer o Select de verdade.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Box, SimpleGrid } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { NumberInput } from '@/components/Form/NumberInput';
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
import { statusOptions } from '@/constants/options/statusOptions';
import { genderOptions } from '@/constants/pecuaria/categoryAnimal/options/gender-options';
import { queryKey } from '@/constants/query-key';

import { categoryAnimalSchemaResolver } from '@/validations/schemas/CadastrosBase/category-animal-schema';

import {
  createCategoryAnimal,
  getCategoryAnimalByUuid,
  listCategoryAnimals,
  updateCategoryAnimal,
} from '@/services/v2/CategoryAnimals/category-animal-service';
import { listSpecies } from '@/services/v2/Species/species-service';

import type { Option } from '@/@types/option';
import type {
  CategoryAnimalData,
  CategoryAnimalForm as CategoryAnimalFormType,
  CategoryAnimalGender,
  CategoryAnimalListItem,
  CategoryAnimalPayload,
} from '@/@types/v2/CategoryAnimals';
import type { SpeciesListItem } from '@/@types/v2/Species/species';

import { useCategoryAnimalForm } from './useCategoryAnimals';

export default function CreateOrUpdateCategoriaAnimal() {
  const { categoryAnimalId } = useParams<{ categoryAnimalId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  // É edição quando existe um GUID válido na rota ("novo" não casa com
  // `/:categoryAnimalId` — é uma rota irmã distinta registrada em
  // router/index.tsx, TASK-FE-544).
  const isEditing = isValidGuid(categoryAnimalId);

  // Guard de navegação: um `categoryAnimalId` presente mas que NÃO é um GUID
  // válido (ex.: URL adulterada manualmente) não deve chegar ao hook de query
  // nem renderizar um form "fantasma" — redireciona para a listagem, mesmo
  // racional de `CreateOrUpdateRaca.tsx`/`CreateOrUpdateKind.tsx`.
  useEffect(() => {
    if (categoryAnimalId && !isValidGuid(categoryAnimalId)) {
      navigate('/cadastros-base/categorias-animais', { replace: true });
    }
  }, [categoryAnimalId, navigate]);

  const text = languageGB.categoryAnimals.categoryAnimal;

  const canSave = isEditing ? can('categoryanimals_edit') : can('categoryanimals_create');

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<CategoryAnimalFormType>({
    mode: 'onChange',
    resolver: categoryAnimalSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      description: '',
      is_enabled: true,
      specie_uuid: null,
      gender: 'A',
      start_month: null,
      end_month: null,
      next_category_uuid: null,
      // Reservado — TASK-FE-543. Nenhum controle renderizado nesta Tarefa;
      // ver nota de cabeçalho sobre preservação do valor na edição.
      product_uuid: null,
    },
  });

  async function fillForm(data: CategoryAnimalData, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      // `CategoryAnimalResource` não devolve `next_category` aninhado — só o
      // uuid cru. Resolve o rótulo com um GET extra ANTES do reset (ver nota
      // de cabeçalho do arquivo), fallback pro próprio uuid se a busca falhar.
      let nextCategoryOption: Option<string> | null = null;
      if (data.next_category_uuid) {
        try {
          const nextCategoryResponse = await getCategoryAnimalByUuid(data.next_category_uuid);
          nextCategoryOption = {
            label: nextCategoryResponse.data.description,
            value: data.next_category_uuid,
          };
        } catch {
          nextCategoryOption = {
            label: data.next_category_uuid,
            value: data.next_category_uuid,
          };
        }
      }

      reset({
        description: data.description,
        is_enabled: !!data.is_enabled,
        specie_uuid: data.specie
          ? { label: data.specie.description, value: data.specie.uuid }
          : null,
        gender: data.gender,
        start_month: data.start_month,
        end_month: data.end_month,
        next_category_uuid: nextCategoryOption,
        // Passthrough cru — ver nota de cabeçalho ("product_uuid").
        product_uuid: data.product_uuid ? { label: '', value: data.product_uuid } : null,
      });
    }
  }

  const categoryAnimalQuery = useCategoryAnimalForm({
    registrationId: isEditing ? categoryAnimalId : undefined,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([categoryAnimalQuery as any]);

  const categoryAnimalMutation = useRequest({
    asyncFunction: tryPersistCategoryAnimal,
    entityName: text.singularLabel,
    queryKey: queryKey.categoryAnimals.categoryAnimalsList,
    queryKey2: queryKey.categoryAnimals.categoryAnimal,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  // Payload SEMPRE completo (create e update) — `CategoryAnimalRequest::rules()`
  // não diferencia por verbo além de `authorize()` (contrato §1/§3.5).
  // `descriptive`/`vl_residual` OMITIDOS por completo (nunca no payload).
  async function tryPersistCategoryAnimal(data: CategoryAnimalFormType) {
    const payload: CategoryAnimalPayload = {
      description: data.description.trim(),
      is_enabled: !!data.is_enabled,
      specie_uuid: data.specie_uuid!.value,
      gender: data.gender as CategoryAnimalGender,
      start_month: data.start_month ?? null,
      end_month: data.end_month ?? null,
      next_category_uuid: data.next_category_uuid?.value ?? null,
      // Reservado — TASK-FE-543. Ecoa o valor original (ver nota de
      // cabeçalho), nunca `undefined`/perdido por omissão de campo.
      product_uuid: data.product_uuid?.value ?? null,
    };

    if (isEditing && categoryAnimalId) {
      return await updateCategoryAnimal(categoryAnimalId, payload);
    }
    return await createCategoryAnimal(payload);
  }

  async function onSubmit(data: CategoryAnimalFormType) {
    if (isEditing && !isEmpty(dirtyFields)) {
      navigate(-1);
    } else {
      await categoryAnimalMutation.mutateAsync(data);
    }
  }

  const isSubmitting = categoryAnimalMutation.isPending;

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
                value={statusOptions.getOption(!!value, languageGB)}
                onChange={(opt: Option<boolean> | null) => onChange(!!opt?.value)}
                options={statusOptions.options(languageGB)}
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
            rules={{ required: true }}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.form.fields.specie}
                placeholder={text.form.placeholders.specie}
                error={errors.specie_uuid?.message as string | undefined}
                service={listSpecies}
                mapOptions={(item: SpeciesListItem) => ({
                  label: item.description,
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
                // menu não-portalizado é recortado pelo container do form.
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />
        </Box>

        <SimpleGrid columns={columnsForm.default} gap={6} mt={6}>
          <Controller
            name="gender"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <Select
                label={text.form.fields.gender}
                name={name}
                value={genderOptions.getOption(value, languageGB)}
                onChange={(opt: Option<CategoryAnimalGender> | null) => onChange(opt?.value ?? 'A')}
                options={genderOptions.options(languageGB)}
                error={error?.message}
                isRequired
                noClearable
                isDisabled={!canSave}
                loading={isLoading}
              />
            )}
          />

          <Controller
            name="start_month"
            control={control}
            render={({ field, fieldState }) => (
              <NumberInput
                name={field.name}
                label={text.form.fields.startMonth}
                value={field.value ?? null}
                onValueChange={(value) => field.onChange(value)}
                min={0}
                decimalPlaces={0}
                error={fieldState.error?.message}
                disabled={!canSave || isLoading}
              />
            )}
          />

          <Controller
            name="end_month"
            control={control}
            render={({ field, fieldState }) => (
              <NumberInput
                name={field.name}
                label={text.form.fields.endMonth}
                value={field.value ?? null}
                onValueChange={(value) => field.onChange(value)}
                min={0}
                decimalPlaces={0}
                error={fieldState.error?.message}
                disabled={!canSave || isLoading}
              />
            )}
          />
        </SimpleGrid>

        <Box mt={6}>
          <Controller
            name="next_category_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.form.fields.nextCategory}
                placeholder={text.form.placeholders.nextCategory}
                service={listCategoryAnimals}
                mapOptions={(item: CategoryAnimalListItem) => ({
                  label: item.description,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                isDisabled={!canSave || isLoading}
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
