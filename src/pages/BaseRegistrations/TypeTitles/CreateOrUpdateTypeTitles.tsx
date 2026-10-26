// src/pages/BaseRegistrations/TypeTitles/CreateOrUpdateTypeTitles.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de TIPO DE TÍTULO (TypeTitle) — Cadastros
// Base / Financeiros. Rotas: /cadastros-base/tipos-titulo/novo e
// /cadastros-base/tipos-titulo/:typeTitleId (GUID), registradas em
// src/router/index.tsx, guardadas por `typetitles_view`.
//
// Padrão modular BaseRegistrations (referência:
// CreateOrUpdateDiagnosisPregnancy.tsx) — detalhe via `useCustomFormQueryByGuid`
// inline (sem hook wrapper), `isEditing` por GUID, `fillForm` guardado por
// `!isEmpty(dirtyFields) || resetForce`, mutação via `useRequest` com
// `typesRequest` condicional, `ButtonSaveAndNext` com `dirtyFields`. SEM bloco
// "Código gerado" — `code` não é campo deste formulário (fiel ao legado).
//
// 4 campos, todos obrigatórios em AMBOS os verbos (TypeTitleRequest::rules()
// não distingue store/update — full-resource-replace):
//   - `description` (Input, obrigatório, máx. 100, único)
//   - `type` (Select ESTÁTICO — Pagar/Receber/Ambas)
//   - `factor` (Select ESTÁTICO — Soma/Diminui)
//   - `is_enabled` (Select Ativo/Inativo, NÃO um Switch)
//
// ⚠️ ARMADILHA CENTRAL — `type`/`factor` são ENUMS INT no backend
// (TypeTitleResource devolve `(int) $this->type`/`(int) $this->factor`,
// validados por Rule::in(TypeTitleType::values())/TypeTitleFactor::values()).
// O <Select> do RHF guarda STRING ('1'|'2'|'3'/'1'|'2') — Chakra/Select
// trabalha melhor com string —, convertida para `Number(...)` SÓ no payload
// do submit. NUNCA usar o texto do label como `value` do Select.
//
// ⚠️ `onSubmit`/`fillForm`: `src/utils/isEmpty.ts` é MAL NOMEADA — retorna
// `true` quando o objeto TEM chaves (NÃO vazio) e `false` quando está vazio.
// A guarda de `onSubmit` usa o comportamento REAL: `isEditing &&
// isEmpty(dirtyFields)` → dirtyFields TEM chaves → houve alteração → salva.
//
// Payload de escrita SEMPRE completo (POST e PUT) — `TypeTitleRequest` exige
// description/type/factor/is_enabled também no update, nunca gated por
// `dirtyFields`.
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

import { typeTitlesSchemaResolver } from '@/validations/schemas/BaseRegistrations/typeTitles-schema';

import {
  createTypeTitle,
  getTypeTitleByUuid,
  updateTypeTitle,
} from '@/services/v2/BaseRegistrations/typeTitles-service';

import type { Option } from '@/@types/option';
import type {
  TypeTitleDetail,
  TypeTitleForm as TypeTitleFormType,
  TypeTitlePayload,
} from '@/@types/v2/BaseRegistrations/typeTitles';

export default function CreateOrUpdateTypeTitles() {
  const { typeTitleId } = useParams<{ typeTitleId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  // É edição quando existe um GUID válido na rota ("novo" não é GUID).
  const isEditing = isValidGuid(typeTitleId);

  const text = languageGB.baseRegistrations.typeTitle;

  const canSave = isEditing ? can('typetitles_edit') : can('typetitles_create');

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<TypeTitleFormType>({
    mode: 'onChange',
    resolver: typeTitlesSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      description: '',
      type: '',
      factor: '',
      is_enabled: true,
    },
  });

  // Guarda por `!isEmpty(dirtyFields) || resetForce`. Com a semântica REAL de
  // `isEmpty` (true quando TEM chaves), `!isEmpty(dirtyFields)` é `true` quando
  // `dirtyFields` está VAZIO (nada editado ainda) — reset() só roda quando é
  // seguro (sem edição em andamento) ou quando forçado pela carga inicial
  // (`resetForce=true`). `type`/`factor` (int no backend) convertidos para
  // STRING ao popular o form — Select trabalha com string.
  function fillForm(data: TypeTitleDetail, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        uuid: data.uuid,
        description: data.description,
        type: String(data.type) as TypeTitleFormType['type'],
        factor: String(data.factor) as TypeTitleFormType['factor'],
        is_enabled: !!data.is_enabled,
      });
    }
  }

  const typeTitleQuery = useCustomFormQueryByGuid<TypeTitleDetail>({
    registrationId: isEditing ? typeTitleId : undefined,
    queryKey: queryKey.baseRegistrations.typeTitle,
    asyncFunction: getTypeTitleByUuid,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([typeTitleQuery as any]);

  const typeTitleMutation = useRequest({
    asyncFunction: tryPersistTypeTitle,
    entityName: text.singularLabel,
    queryKey: queryKey.baseRegistrations.typeTitles,
    queryKey2: queryKey.baseRegistrations.typeTitle,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  async function tryPersistTypeTitle(data: TypeTitleFormType) {
    // UPDATE e CREATE enviam o MESMO conjunto completo — `TypeTitleRequest`
    // (api_root) exige description/type/factor/is_enabled também no update
    // (sem bloco condicional por verbo), então NUNCA podem ser gated por
    // `dirtyFields`. `type`/`factor` são ENUMS INT no backend — enviados como
    // Number(...), nunca como label textual.
    const payload: TypeTitlePayload = {
      description: data.description.trim(),
      type: Number(data.type) as TypeTitlePayload['type'],
      factor: Number(data.factor) as TypeTitlePayload['factor'],
      is_enabled: !!data.is_enabled,
    };

    if (isEditing && typeTitleId) {
      return await updateTypeTitle(typeTitleId, payload);
    }

    return await createTypeTitle(payload);
  }

  async function onSubmit(data: TypeTitleFormType) {
    if (isEditing && isEmpty(dirtyFields)) {
      // dirtyFields TEM chaves (isEmpty real === true) → houve alteração → salva.
      await typeTitleMutation.mutateAsync(data);
    } else if (isEditing) {
      // dirtyFields VAZIO (isEmpty real === false) → nada mudou → só volta, sem PUT.
      navigate(-1);
    } else {
      // Criação → sempre salva.
      await typeTitleMutation.mutateAsync(data);
    }
  }

  const isSubmitting = typeTitleMutation.isPending;

  // Reaproveita os textos já existentes da listagem (Ativo/Inativo) — mesmo
  // racional de CreateOrUpdateDiagnosisPregnancy.tsx (evita duplicar chave de
  // i18n para o mesmo par de rótulos).
  const enabledOptions: Option<boolean>[] = [
    { value: true, label: text.list.table.active },
    { value: false, label: text.list.table.inactive },
  ];

  const typeOptions: Option<string>[] = [
    { value: '1', label: text.form.typeOptions.payable },
    { value: '2', label: text.form.typeOptions.receivable },
    { value: '3', label: text.form.typeOptions.both },
  ];

  const factorOptions: Option<string>[] = [
    { value: '1', label: text.form.factorOptions.add },
    { value: '2', label: text.form.factorOptions.subtract },
  ];

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
            {...register('description')}
            error={errors.description?.message}
            isRequired
            loading={isLoading}
            disabled={!canSave}
          />

          <Controller
            name="type"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <Select
                label={text.form.fields.type}
                name={name}
                // ⚠️ ARMADILHA — value NUNCA undefined (necessário para o
                // botão "Limpar" conseguir zerar o campo).
                value={typeOptions.find((option) => option.value === value) ?? null}
                onChange={(opt: Option<string> | null) => onChange(opt?.value ?? '')}
                options={typeOptions}
                error={error?.message}
                isRequired
                noClearable
                isDisabled={!canSave}
                loading={isLoading}
              />
            )}
          />

          <Controller
            name="factor"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <Select
                label={text.form.fields.factor}
                name={name}
                value={factorOptions.find((option) => option.value === value) ?? null}
                onChange={(opt: Option<string> | null) => onChange(opt?.value ?? '')}
                options={factorOptions}
                error={error?.message}
                isRequired
                noClearable
                isDisabled={!canSave}
                loading={isLoading}
              />
            )}
          />

          <Controller
            name="is_enabled"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <Select
                label={text.form.fields.isEnabled}
                name={name}
                value={enabledOptions.find((option) => option.value === value) ?? null}
                onChange={(opt: Option<boolean> | null) => onChange(!!opt?.value)}
                options={enabledOptions}
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
