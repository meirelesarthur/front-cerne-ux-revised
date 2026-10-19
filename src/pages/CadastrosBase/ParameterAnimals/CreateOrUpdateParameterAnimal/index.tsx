// src/pages/CadastrosBase/ParameterAnimals/CreateOrUpdateParameterAnimal/index.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de PARÂMETRO ANIMAL — Cadastros Base /
// Pecuária (TASK-FE-1079, regeneração). Rotas: /parameter-animals/novo e
// /parameter-animals/:parameterAnimalId (GUID), registradas em
// src/router/index.tsx (a rota-mãe da listagem foi registrada pela Tarefa
// irmã TASK-FE-1078), guardadas por `parameter-animals_view`.
//
// Mirror estrutural EXATO de `Administrativo/Funcoes/CreateOrUpdateFuncao.tsx`
// (referência viva indicada pela Tarefa): guarda de `dirtyFields` EXPLÍCITA
// (NUNCA `isEmpty()`/`!isEmpty()` do utilitário — está INVERTIDO, ver
// `utils/isEmpty`), payload full-resource, `SelectAsyncPaginate` para as 2 FK
// obrigatórias, 422 mapeado por campo via `setError`.
//
// ⚠️ CHECKLIST desta Tarefa:
// 1) Guard `onSubmit`/`fillParameterAnimalForm` — forma EXPLÍCITA
//    `Object.keys(dirtyFields).length === 0` (NUNCA `isEmpty`/`!isEmpty`).
// 2) Payload SEMPRE full-resource — `AnimalParameterRequest` (v1.1 §3) exige
//    os 6 campos de negócio `required` em ambos os verbos (M4/GAP-475).
// 3) `employee_uuid`/`category_uuid` via `SelectAsyncPaginate` (Controller) —
//    `value={field.value ?? null}` NUNCA `?? undefined`, portalizado por
//    padrão (`menuPortalTarget={document.body}`+`menuPosition="fixed"`).
// 4) `code` NUNCA é campo RHF/payload (RN-1, auto-gerado pelo servidor) —
//    exibido via `InputReadOnly` SÓ em modo edição (não existe ainda em
//    criação).
// 5) Os 4 campos numéricos (`feeding_area`/`water_consumption`/
//    `ms_consumption`/`average_weight`) ACEITAM ZERO — backend
//    `required|numeric` sem `gt:0` (contrato v1.1 §3) — nenhum `min`/`max`
//    client-side inventado além do que o schema (`TASK-FE-1076`) já define.
// 6) O tipo de negócio `ParameterAnimalForm` (fundação,
//    `@/@types/v2/ParameterAnimals/parameter-animal.d.ts`) tipa
//    `employee_uuid`/`category_uuid` como `string | null` — é o shape do
//    PAYLOAD, não o shape do RHF. Mirror exato de `FunctionForm` vs.
//    `CreateFunctionRequest` (Functions/index.d.ts): este arquivo define seu
//    próprio `ParameterAnimalFormValues` (RHF-only, `Option<string> | null`
//    nas 2 FK) e converte para `ParameterAnimalForm` só no submit.
// 7) TASK-FE-1088 — campo Espécie, ANTES da Categoria (ordem do legado,
//    `_forms.blade.php:28`): `required` no form, NUNCA no payload
//    (`parameter_animals` sem coluna de espécie); filtra a Categoria via
//    `GET /category-animals/options?specie_uuid=`; trocar a Espécie com uma
//    Categoria já selecionada avisa o usuário (toast) ANTES de zerar a
//    seleção (NUNCA silencioso, ao contrário do legado); na edição, deriva
//    de `category_animal.specie` (TASK-BE-969, nullable); read-only quando
//    só existe 1 Espécie habilitada (`readonly($species->count() == 1)`).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { SimpleGrid } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import customToast from '@/utils/custom-toast';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { parameterAnimalSchemaResolver } from '@/validations/schemas/CadastrosBase/parameter-animal-schema';

import { listEmployees } from '@/services/v2/CadastrosBase/Employee/employee-service';
import { listCategoryAnimalOptions } from '@/services/v2/CategoryAnimals/category-animal-service';
import {
  createParameterAnimal,
  updateParameterAnimal,
} from '@/services/v2/ParameterAnimals/parameter-animal-service';
import { listSpecieOptions } from '@/services/v2/Species/species-service';

import type { Option } from '@/@types/option';
import type { EmployeeListItem } from '@/@types/v2/CadastrosBase/employee';
import type { CategoryAnimalOptionItem } from '@/@types/v2/CategoryAnimals';
import type {
  ParameterAnimalData,
  ParameterAnimalForm,
} from '@/@types/v2/ParameterAnimals/parameter-animal';
import type { SpecieOptionItem } from '@/@types/v2/Species/species';

import { useParameterAnimalForm } from '../useParameterAnimals';

// Shape RHF-only — as 2 FK obrigatórias guardam o `Option` completo
// (`SelectAsyncPaginate`); o submit converte para `ParameterAnimalForm`
// (strings cruas, shape do payload da API).
//
// TASK-FE-1088 — `specie_uuid` é campo RHF-ONLY: `required` no form (Doc
// Bruta `_forms.blade.php:28`) só para FILTRAR a Categoria, mas
// `parameter_animals` NÃO tem coluna de espécie — NUNCA existe em
// `ParameterAnimalForm` (payload) nem é montado em `tryPersistParameterAnimal`.
interface ParameterAnimalFormValues {
  description: string;
  employee_uuid: Option<string> | null;
  specie_uuid: Option<string> | null;
  category_uuid: Option<string> | null;
  feeding_area: number | null;
  water_consumption: number | null;
  ms_consumption: number | null;
  average_weight: number | null;
}

export default function CreateOrUpdateParameterAnimal() {
  const { parameterAnimalId } = useParams<{ parameterAnimalId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  // É edição quando existe um GUID válido na rota ("novo" não é GUID).
  const isEditing = isValidGuid(parameterAnimalId);

  const text = languageGB.parameterAnimals.parameterAnimal;

  const canSave = isEditing ? can('parameter-animals_edit') : can('parameter-animals_create');

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    getValues,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<ParameterAnimalFormValues>({
    mode: 'onChange',
    resolver: parameterAnimalSchemaResolver(languageGB),
    reValidateMode: 'onChange',
    defaultValues: {
      description: '',
      employee_uuid: null,
      specie_uuid: null,
      category_uuid: null,
      feeding_area: null,
      water_consumption: null,
      ms_consumption: null,
      average_weight: null,
    },
  });

  // TASK-FE-1088 — lookup de Espécie EAGER (`useQuery` direto, NÃO
  // `SelectAsyncPaginate`): `listSpecieOptions` não pagina de verdade (mesmo
  // truque estrutural de `listSpecies`/`listFarms` em `StepProprietario.tsx`
  // — devolve a lista INTEIRA numa única resposta), então dá pra usar
  // `.length` como a contagem REAL sem custo de paginação extra. É essa
  // contagem que decide o read-only de Espécie única (`readonly($species->
  // count() == 1)` do legado, `_forms.blade.php:28`).
  const specieOptionsQuery = useQuery({
    queryKey: [queryKey.parameterAnimals.specieOptions],
    queryFn: () => listSpecieOptions({}),
  });
  const specieOptions: Option<string>[] = (specieOptionsQuery.data?.data.items ?? []).map(
    (item: SpecieOptionItem) => ({
      label: item.label,
      value: item.uuid,
    })
  );
  const isSpecieReadOnly = specieOptions.length === 1;
  const watchedSpecie = watch('specie_uuid');

  // Fidelidade ao legado — quando existe só 1 Espécie habilitada, o campo é
  // obrigatório-porém-travado (`readonly`), então precisa vir PRÉ-PREENCHIDO
  // com a única opção (senão o form nunca fica válido, já que ninguém pode
  // trocar um Select travado). Roda só uma vez por resolução da query —
  // guarda `!watchedSpecie` evita sobrescrever uma seleção/derivação (edição
  // via `fillParameterAnimalForm`) já feita.
  useEffect(() => {
    if (specieOptionsQuery.data?.data.items.length === 1 && !watchedSpecie) {
      const [onlySpecie] = specieOptionsQuery.data.data.items;
      setValue(
        'specie_uuid',
        { label: onlySpecie.label, value: onlySpecie.uuid },
        { shouldDirty: false }
      );
    }
  }, [specieOptionsQuery.data, watchedSpecie, setValue]);

  // Checklist item 1/6 — guarda EXPLÍCITA `Object.keys(dirtyFields).length
  // === 0`, NUNCA `isEmpty()`/`!isEmpty()` do utilitário (está INVERTIDO —
  // ver `utils/isEmpty`, defeito que esta regeneração elimina).
  function fillParameterAnimalForm(data: ParameterAnimalData, resetForce?: boolean) {
    const hasNoFormChanges = Object.keys(dirtyFields).length === 0;
    if (hasNoFormChanges || resetForce) {
      reset({
        description: data.description,
        employee_uuid: data.employee
          ? { label: data.employee.name, value: data.employee.uuid }
          : null,
        // TASK-FE-1088 (item 5 do escopo) — Espécie NÃO é persistida; na
        // edição ela é DERIVADA de `category_animal.specie` (contrato
        // TASK-BE-969). `specie` é nullable (categoria legada/órfã sem
        // espécie associada) — nesse caso o campo fica vazio e o usuário
        // precisa escolher antes de conseguir salvar de novo (`required`);
        // a categoria já salva é preservada mesmo assim (não é descartada
        // só porque a espécie dela é desconhecida).
        specie_uuid: data.category_animal?.specie
          ? {
              label: data.category_animal.specie.description,
              value: data.category_animal.specie.uuid,
            }
          : null,
        category_uuid: data.category_animal
          ? { label: data.category_animal.description, value: data.category_animal.uuid }
          : null,
        feeding_area: data.feeding_area,
        water_consumption: data.water_consumption,
        ms_consumption: data.ms_consumption,
        average_weight: data.average_weight,
      });
    }
  }

  const parameterAnimalQuery = useParameterAnimalForm({
    registrationId: isEditing ? parameterAnimalId : undefined,
    fillForm: fillParameterAnimalForm,
  });

  const isLoading = isEditing && checkLoadingStatus([parameterAnimalQuery as any]);

  const parameterAnimalMutation = useRequest({
    asyncFunction: tryPersistParameterAnimal,
    entityName: text.singularLabel,
    queryKey: queryKey.parameterAnimals.list,
    queryKey2: queryKey.parameterAnimals.detail,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  async function tryPersistParameterAnimal(data: ParameterAnimalFormValues) {
    // Checklist item 2 — payload sempre FULL-RESOURCE (nunca um delta de
    // `dirtyFields`); os 6 campos de negócio são `required` em ambos os
    // verbos (M4/GAP-475). Schema Yup já garante `employee_uuid`/
    // `category_uuid` preenchidos antes de `onSubmit` disparar a mutação —
    // non-null assertion segura aqui (mesmo padrão de `FunctionForm.cbo_uuid`).
    // TASK-FE-1088 — `specie_uuid` é DELIBERADAMENTE OMITIDO deste objeto
    // literal: `ParameterAnimalForm` (payload) não tem essa chave e o
    // backend não a aceita na escrita (`parameter_animals` sem coluna de
    // espécie) — o campo existe só no RHF para filtrar a Categoria.
    const payload: ParameterAnimalForm = {
      description: data.description,
      employee_uuid: data.employee_uuid!.value,
      category_uuid: data.category_uuid!.value,
      feeding_area: data.feeding_area,
      water_consumption: data.water_consumption,
      ms_consumption: data.ms_consumption,
      average_weight: data.average_weight,
    };

    try {
      return isEditing && parameterAnimalId
        ? await updateParameterAnimal(parameterAnimalId, payload)
        : await createParameterAnimal(payload);
    } catch (error) {
      // 422 do backend mapeado por campo — mesma técnica de
      // `CreateOrUpdateFuncao.tsx`/`CreateOrUpdateAtividade.tsx` (o `throw`
      // preserva o toast genérico que `useRequest` já mostra).
      if (isAxiosError(error) && error.response?.status === 422) {
        const fieldErrors = error.response.data?.errors as Record<string, string[]> | undefined;
        Object.entries(fieldErrors ?? {}).forEach(([field, messages]) => {
          if (messages?.[0]) {
            setError(field as keyof ParameterAnimalFormValues, {
              type: 'server',
              message: messages[0],
            });
          }
        });
      }
      throw error;
    }
  }

  // Checklist item 1 — guard `onSubmit`: checagem EXPLÍCITA
  // `Object.keys(dirtyFields).length === 0`, nunca `isEmpty`/`!isEmpty`.
  async function onSubmit(data: ParameterAnimalFormValues) {
    const hasNoFormChanges = Object.keys(dirtyFields).length === 0;
    if (isEditing && hasNoFormChanges) {
      navigate(-1);
    } else {
      await parameterAnimalMutation.mutateAsync(data);
    }
  }

  const isSubmitting = parameterAnimalMutation.isPending;

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
          {isEditing && (
            <InputReadOnly
              label={text.form.fields.code}
              value={parameterAnimalQuery.data?.code ?? ''}
              loading={isLoading}
            />
          )}

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
            name="employee_uuid"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.form.fields.employee}
                placeholder={text.form.placeholders.employee}
                service={listEmployees}
                mapOptions={(item: EmployeeListItem) => ({
                  label: item.name,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                // `?? null` NUNCA `?? undefined` — senão o `<AsyncPaginate>`
                // vira NÃO-CONTROLADO e mantém a última seleção interna.
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                error={error?.message}
                isRequired
                isReadOnly={!canSave}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          {/* TASK-FE-1088 — Espécie: ordem do legado (Código → Descrição →
              Responsável → Espécie → Categoria...), `_forms.blade.php:28`.
              NÃO persistida (`parameter_animals` sem coluna de espécie) —
              existe só para filtrar a Categoria abaixo. Lookup EAGER
              (`Select` estático + `useQuery`, não `SelectAsyncPaginate`):
              `listSpecieOptions` já devolve a lista completa numa única
              resposta (não pagina de verdade), então dá pra reaproveitar o
              mesmo fetch tanto para popular as opções quanto para decidir o
              read-only de espécie única. */}
          <Controller
            name="specie_uuid"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <Select
                name={field.name}
                label={text.form.fields.specie}
                placeholder={text.form.placeholders.specie}
                options={specieOptions}
                value={field.value ?? null}
                onChange={(option: Option<string> | null) => {
                  const isSameSpecie = option?.value === field.value?.value;
                  field.onChange(option ?? null);
                  if (!isSameSpecie) {
                    // Checklist item 4 do Task-Packet — trocar a Espécie com
                    // uma Categoria já selecionada pode invalidar essa
                    // Categoria (ela pode não pertencer mais à nova
                    // Espécie). O legado (`changeSpecie()`,
                    // `_forms.blade.php:78`) zera `#category` EM SILÊNCIO —
                    // aqui avisamos o usuário ANTES de limpar. Perder
                    // seleção sem aviso é defeito, não fidelidade.
                    const previousCategory = getValues('category_uuid');
                    if (previousCategory) {
                      toaster.create(
                        customToast({
                          status: 'warning',
                          description: text.form.warnings.categoryClearedBySpecieChange,
                        })
                      );
                    }
                    setValue('category_uuid', null, { shouldDirty: true });
                  }
                }}
                error={error?.message}
                isRequired
                loading={isLoading || specieOptionsQuery.isLoading}
                // Fidelidade ao legado — `readonly($species->count() == 1)`:
                // com só 1 Espécie habilitada, o campo fica travado (já
                // pré-preenchido pelo `useEffect` acima).
                isReadOnly={!canSave || isSpecieReadOnly}
              />
            )}
          />

          <Controller
            name="category_uuid"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.form.fields.category}
                placeholder={
                  watchedSpecie ? text.form.placeholders.category : text.form.hints.specieRequired
                }
                service={listCategoryAnimalOptions}
                mapOptions={(item: CategoryAnimalOptionItem) => ({
                  label: item.label,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                  // Contrato §1 (TASK-FE-1088) — `GET /category-animals/
                  // options?specie_uuid=` já existe e o parâmetro é
                  // OPCIONAL: sem Espécie selecionada, `watchedSpecie?.value`
                  // é `undefined` e o comportamento antigo (lista completa)
                  // é preservado — mas a Categoria fica DESABILITADA nesse
                  // meio-tempo (ver `isReadOnly` abaixo), então essa lista
                  // completa nunca chega a ser exibida a esse usuário.
                  specie_uuid: watchedSpecie?.value,
                })}
                cacheUniqs={[watchedSpecie?.value]}
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                error={error?.message}
                isRequired
                // Decisão declarada (escopo item 3 do Task-Packet): o legado
                // (`_forms.blade.php`) NÃO desabilita a Categoria sem
                // Espécie — só a deixa com a lista vazia (`changeSpecie()`
                // só faz o `$.get` `if (specie_id)`). Aqui optamos por
                // DESABILITAR, mirror do cascade Espécie→Categoria já
                // estabelecido neste mesmo fork para Animal
                // (`CreateOrUpdateAnimal.tsx`, `isDisabled={!watchedSpecie
                // || ...}`) — precedente vivo da SPA prevalece sobre a
                // mecânica jQuery de 2015 do monólito.
                isReadOnly={!watchedSpecie || !canSave}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="feeding_area"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <NumberInput
                name={field.name}
                label={text.form.fields.feedingArea}
                placeholder={text.form.placeholders.feedingArea}
                value={field.value ?? null}
                onValueChange={(value) => field.onChange(value)}
                error={error?.message}
                isRequired
                decimalPlaces={2}
                disabled={!canSave}
              />
            )}
          />

          <Controller
            name="water_consumption"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <NumberInput
                name={field.name}
                label={text.form.fields.waterConsumption}
                placeholder={text.form.placeholders.waterConsumption}
                value={field.value ?? null}
                onValueChange={(value) => field.onChange(value)}
                error={error?.message}
                isRequired
                decimalPlaces={2}
                disabled={!canSave}
              />
            )}
          />

          <Controller
            name="ms_consumption"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <NumberInput
                name={field.name}
                label={text.form.fields.msConsumption}
                placeholder={text.form.placeholders.msConsumption}
                value={field.value ?? null}
                onValueChange={(value) => field.onChange(value)}
                error={error?.message}
                isRequired
                decimalPlaces={2}
                disabled={!canSave}
              />
            )}
          />

          <Controller
            name="average_weight"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <NumberInput
                name={field.name}
                label={text.form.fields.averageWeight}
                placeholder={text.form.placeholders.averageWeight}
                value={field.value ?? null}
                onValueChange={(value) => field.onChange(value)}
                error={error?.message}
                isRequired
                decimalPlaces={2}
                disabled={!canSave}
              />
            )}
          />
        </SimpleGrid>
      </Form>
    </FormContainer>
  );
}
