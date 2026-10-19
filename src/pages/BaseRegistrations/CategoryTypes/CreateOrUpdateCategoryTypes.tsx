// src/pages/BaseRegistrations/CategoryTypes/CreateOrUpdateCategoryTypes.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de TIPO DE CATEGORIA — Cadastros Base /
// Financeiros (TASK-CTY-02). Rotas: /cadastros-base/tipos-de-categoria/novo e
// /cadastros-base/tipos-de-categoria/:categoryTypeId (GUID), registradas em
// src/router/index.tsx junto às da TASK-CTY-01, guardadas por
// `categorytypes_view` (autorização real de create/edit é do backend via
// 403 — aqui só evita renderizar o form sem a permissão mínima de leitura,
// mesmo padrão de /cadastros-base/especies/novo e /:specieId).
//
// Referência UX (TASK-CTY-01/02 — UX-GAP confirmado, sem página oficial de
// Tipos de Categoria no `cerne`): MOLDE PRINCIPAL
// `CadastrosBase/Especies/CreateOrUpdateEspecie.tsx` (único módulo do
// catálogo com exatamente `description`+`is_enabled`, sem `code`/hierarquia/
// FK extra — aqui removida também a FK `cost_center_uuid` que Especies tem e
// CategoryType não). `is_enabled` via `Select` (Ativo/Inativo), NÃO Switch.
//
// Payload de update COMPLETO (não delta) — `CategoryTypeRequest::rules()`
// não distingue verbo (description/is_enabled `required` em ambos, store E
// update) — full-resource-replace, mesma regra de Especies/TypeTitle/
// PlanAccount. 422 de `description` duplicada (unicidade ignorando o próprio
// uuid no update) é tratado pelo caminho genérico de 422 do client
// (`useRequest`/`react-hook-form`), sem código extra nesta Tarefa.
//
// Guard de `onSubmit`: escrito de forma EXPLÍCITA com
// `Object.keys(dirtyFields).length === 0` (nunca `isEmpty` bare) — por
// decisão do dono, dado o defeito real já catalogado 3x no projeto
// (`Especies/CreateOrUpdateEspecie.tsx:167`/
// `Cultivation/CreateOrUpdateCultivation.tsx`/`Perfil/CreateOrUpdatePerfil.tsx`)
// onde `src/utils/isEmpty.ts` — nome INVERTIDO da assinatura (retorna `true`
// quando o objeto TEM chaves, `false` quando vazio) — foi usado bare como
// guarda de "nada mudou" e descartava silenciosamente edições reais.
// `Object.keys(dirtyFields).length === 0` não depende dessa semântica
// invertida e deixa a intenção clara para quem lê o código (checklist do
// dono, Tester cobra essa clareza). O `fillForm` abaixo continua usando
// `!isEmpty(dirtyFields) || resetForce` — Lei 2 do padrão do projeto
// (`get_pwa_form_query_pattern`), guarda distinta e já correta em todo o
// catálogo (Especies/MotivosBaixa/CentroCusto/Perfil/Cultivation/Safra/
// Armazem), não o ponto do defeito histórico.
// -----------------------------------------------------------------------------

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

import { categoryTypesSchemaResolver } from '@/validations/schemas/BaseRegistrations/categoryTypes-schema';

import {
  createCategoryType,
  getCategoryType,
  updateCategoryType,
} from '@/services/v2/CategoryTypes/category-type-service';

import type { Option } from '@/@types/option';
import type {
  CategoryTypeData,
  CategoryTypeForm as CategoryTypeFormType,
  CategoryTypePayload,
} from '@/@types/v2/CategoryTypes';

export default function CreateOrUpdateCategoryTypes() {
  const { categoryTypeId } = useParams<{ categoryTypeId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  // É edição quando existe um GUID válido na rota ("novo" não é GUID).
  const isEditing = isValidGuid(categoryTypeId);

  const text = languageGB.baseRegistrations.categoryType;

  const canSave = isEditing ? can('categorytypes_edit') : can('categorytypes_create');

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<CategoryTypeFormType>({
    mode: 'onChange',
    resolver: categoryTypesSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      description: '',
      is_enabled: true,
    },
  });

  // Lei 2 (`get_pwa_form_query_pattern`) — guarda por `!isEmpty(dirtyFields) ||
  // resetForce`. `src/utils/isEmpty.ts` retorna `true` quando o objeto TEM ao
  // menos uma chave própria (NÃO vazio) e `false` quando é `{}` — nome
  // invertido do que a assinatura sugere. Logo `!isEmpty(dirtyFields)` aqui é
  // `true` quando `dirtyFields` está VAZIO (nada editado ainda) — `reset()`
  // só roda quando é seguro (sem edição em andamento) ou quando forçado pela
  // carga inicial do hook (`resetForce=true`). Mesmo padrão idêntico usado em
  // Especies/MotivosBaixa/CentroCusto/Perfil/Cultivation/Safra/Armazem.
  function fillForm(data: CategoryTypeData, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        uuid: data.uuid,
        description: data.description,
        is_enabled: !!data.is_enabled,
      });
    }
  }

  const categoryTypeQuery = useCustomFormQueryByGuid<CategoryTypeData>({
    registrationId: isEditing ? categoryTypeId : undefined,
    queryKey: queryKey.baseRegistrations.categoryType,
    asyncFunction: getCategoryType,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([categoryTypeQuery as any]);

  const categoryTypeMutation = useRequest({
    asyncFunction: tryPersistCategoryType,
    entityName: text.singularLabel,
    queryKey: queryKey.baseRegistrations.categoryTypes,
    queryKey2: queryKey.baseRegistrations.categoryType,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  async function tryPersistCategoryType(data: CategoryTypeFormType) {
    // UPDATE e CREATE enviam o MESMO conjunto completo — `CategoryTypeRequest::
    // rules()` (api_root) trata o PUT como full-resource-replace: `description`
    // e `is_enabled` são `required` tanto no store quanto no update (sem
    // bloco condicional por verbo), então NUNCA podem ser gated por
    // `dirtyFields`, mesmo padrão de Especies/TypeTitle/PlanAccount.
    const payload: CategoryTypePayload = {
      description: data.description.trim(),
      is_enabled: !!data.is_enabled,
    };

    if (isEditing && categoryTypeId) {
      return await updateCategoryType(categoryTypeId, payload);
    }

    return await createCategoryType(payload);
  }

  // Guard de `onSubmit` — escrito de forma EXPLÍCITA (não usa `isEmpty` bare
  // aqui, por decisão do dono, ver cabeçalho do arquivo): em modo edição, só
  // chama a API quando há alteração real (`dirtyFields` não vazio); sem
  // alteração, só navega de volta. No create, sempre salva.
  async function onSubmit(data: CategoryTypeFormType) {
    const hasRealChanges = Object.keys(dirtyFields).length > 0;

    if (isEditing && !hasRealChanges) {
      navigate(-1); // nada mudou -> só volta, sem chamar a API
    } else {
      await categoryTypeMutation.mutateAsync(data); // create -> sempre salva; edição com alteração real -> salva
    }
  }

  const isSubmitting = categoryTypeMutation.isPending;

  // Reaproveita os textos já existentes da listagem (Ativo/Inativo) — mesmo
  // racional de `Especies` reaproveitando `list.table.active/inactive` no
  // form (evita duplicar chave de i18n para o mesmo par de rótulos).
  const statusOptions: Option<boolean>[] = [
    { value: true, label: text.list.table.active },
    { value: false, label: text.list.table.inactive },
  ];

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
            label={text.form.fields.description}
            placeholder={text.form.placeholders.description}
            maxLength={100}
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
      </Form>
    </FormContainer>
  );
}
