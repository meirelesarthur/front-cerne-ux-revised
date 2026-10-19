// src/pages/CadastrosBase/Atividades/CreateOrUpdateAtividade.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de ATIVIDADE (Activity) — Cadastros Base /
// Agrícolas (TASK-FE-027). Rotas: /cadastros-base/atividades/novo e
// /cadastros-base/atividades/:activityId (GUID), registradas em
// src/router/index.tsx (TASK-FE-028), guardadas por `activities_view`.
//
// Referência UX: mesmo UX-GAP de TASK-FE-026 (sem página oficial de
// Atividade no `cerne`) — precedente INTERNO
// CadastrosBase/TiposTitulo/CreateOrUpdateTipoTitulo.tsx (estrutura mecânica
// idêntica: `isEditing` por GUID, `fillForm` guardado por
// `!isEmpty(dirtyFields) || resetForce`, mutação via `useRequest` com
// `typesRequest` condicional, `ButtonSaveAndNext` com `dirtyFields`).
//
// Campos, na ordem do legado (`../agro365/resources/views/activities/_forms.blade.php`):
//   - `name` (Input, obrigatório, máx. 30, único por tenant)
//   - `description` (Input, opcional, máx. 50)
//   - `vl_hectare` (MoneyInput — máscara monetária R$ + milhar + 2 casas,
//     achado E2E do dev, execução 016; obrigatório — payload envia número
//     puro, NUNCA a string mascarada, ver `MoneyInput.tsx`)
//   - `type` (Select estático — Custeio/Investimento/Á Definir; default
//     "Á Definir" no create, fiel ao default físico da coluna)
//   - `use` (Select estático — Ambos/Agricultura/Fruticultura/Pecuária de
//     Corte; default "Ambos" no create; OBRIGATÓRIO — correção D5 do
//     contrato, fecha a inconsistência UI×backend do legado)
//   - `is_enabled` (Select Ativo/Inativo — mesmo padrão do projeto, NÃO um
//     Switch; default `true` no create)
//
// `operations` (TASK-FE-035, revisado na rodada visual 2 pós-E2E): `GET
// /api/v1/operations` (TASK-BE-054) alimenta um `CheckboxListField` — lista
// de checkboxes inline com busca, "marcar/desmarcar todos" e contador
// "Nº de registros selecionados" (padrão do `cerne`, ver
// `GB.Cerne.UX/src/components/ui/CheckboxListField.tsx` — achado do Maestro;
// substitui o `SelectAsyncPaginate isMulti` original da TASK-FE-035, cujo
// dropdown flutuante vazava do card/overflow em telas menores, evidência do
// dev). O valor GRAVADO no RHF continua `number[]` (payload inalterado,
// `operations[]` de id numérico — D3 do `Operation-contrato`, o backend de
// Activity já sincroniza por `id`, TASK-BE-048); a lista de opções vem de
// `useOperationsChecklist` (busca SERVER-SIDE, `per_page` no teto de 100 —
// ver comentário do hook), e um estado local `selectedOperations`
// (`ActivityOperationRef[]`) cacheia os RÓTULOS das operações já vinculadas
// para que apareçam corretas mesmo se caírem fora do lote/busca atual
// (edição).
//
// ⚠️ `onSubmit`/`fillForm`: `src/utils/isEmpty.ts` é MAL NOMEADA — retorna
// `true` quando o objeto TEM chaves (NÃO vazio) e `false` quando está vazio
// (landmine documentada, `ERRO-FE-001`). Guarda usada abaixo — LITERAL do
// task-packet, mesmo padrão já corrigido de
// CreateOrUpdateEspecie.tsx/CreateOrUpdateTecnicaDiagnostico.tsx:
// `!isEmpty(dirtyFields)` é `true` quando `dirtyFields` está VAZIO (nada
// editado) — usado tanto no guard do `fillForm` (reset seguro) quanto no
// `onSubmit` (edição sem alteração real → só navega, sem PUT).
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, SimpleGrid } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { Form } from '@/components/Form';
import { CheckboxListField, type CheckboxListItem } from '@/components/Form/CheckboxListField';
import { Input } from '@/components/Form/Input';
import { MaskedInput } from '@/components/Form/MaskedInput';
import { Select } from '@/components/Form/Select';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { createActivity, updateActivity } from '@/services/v2/Activities/activity-service';

import type { Option } from '@/@types/option';
import type {
  ActivityData,
  ActivityForm as ActivityFormType,
  ActivityOperationRef,
  ActivityPayload,
  ActivityTypeSlug,
  ActivityUseSlug,
} from '@/@types/v2/Activities';

import { activitySchemaResolver } from './activity-schema';
import { useActivityForm, useOperationsChecklist } from './useActivities';

export default function CreateOrUpdateAtividade() {
  const { activityId } = useParams<{ activityId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  // É edição quando existe um GUID válido na rota ("novo" não é GUID).
  const isEditing = isValidGuid(activityId);

  const text = languageGB.activities.activity;

  const canSave = isEditing ? can('activities_edit') : can('activities_create');

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<ActivityFormType>({
    mode: 'onChange',
    resolver: activitySchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      description: '',
      is_enabled: true,
      vl_hectare: 0,
      type: 'a_definir',
      use: 'ambos',
      operations: [],
    },
  });

  // Cache LOCAL de rótulos das operações já vinculadas — garante que o
  // `CheckboxListField` exiba o NOME certo de uma operação selecionada mesmo
  // que ela caia fora do lote atual carregado por `useOperationsChecklist`
  // (per_page 100 ou busca ativa que não bate com ela). Populado no
  // `fillForm`, a partir de `data.operations` (já vem `{id, name}` da API —
  // nenhuma chamada extra necessária), e mantido em sincronia a cada
  // alteração de seleção (ver `Controller` do campo `operations` abaixo). O
  // valor GRAVADO no RHF (`operations`) continua `number[]` puro (payload
  // inalterado, D3 do Operation-contrato) — este estado é só de EXIBIÇÃO.
  const [selectedOperations, setSelectedOperations] = useState<ActivityOperationRef[]>([]);

  // Busca SERVER-SIDE do checklist de Operações — controlada aqui (não
  // dentro do `CheckboxListField`, que é genérico e não decide de onde vêm
  // os itens). Ver `useOperationsChecklist` (per_page no teto de 100).
  const [operationsSearch, setOperationsSearch] = useState('');
  const operationsQuery = useOperationsChecklist({ search: operationsSearch });

  // Lei 2 (`get_pwa_form_query_pattern`) — guarda por `!isEmpty(dirtyFields) ||
  // resetForce`.
  function fillForm(data: ActivityData, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        uuid: data.uuid,
        name: data.name,
        description: data.description ?? '',
        is_enabled: !!data.is_enabled,
        vl_hectare: data.vl_hectare,
        type: data.type,
        use: data.use,
        operations: data.operations.map((o) => o.id),
      });
      setSelectedOperations(data.operations);
    }
  }

  const activityQuery = useActivityForm({
    registrationId: isEditing ? activityId : undefined,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([activityQuery as any]);

  const activityMutation = useRequest({
    asyncFunction: tryPersistActivity,
    entityName: text.singularLabel,
    queryKey: queryKey.activities.list,
    queryKey2: queryKey.activities.detail,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  async function tryPersistActivity(data: ActivityFormType) {
    const payload: ActivityPayload = {
      name: data.name.trim(),
      description: data.description?.trim() || null,
      is_enabled: !!data.is_enabled,
      vl_hectare: Number(data.vl_hectare),
      type: data.type as ActivityTypeSlug,
      use: data.use as ActivityUseSlug,
      operations: data.operations,
    };

    if (isEditing && activityId) {
      return await updateActivity(activityId, payload);
    }

    return await createActivity(payload);
  }

  async function onSubmit(data: ActivityFormType) {
    if (isEditing && !isEmpty(dirtyFields)) {
      // dirtyFields VAZIO (isEmpty real === false) → nada mudou → só volta, sem PUT.
      navigate(-1);
    } else {
      // Criação, ou edição com alteração real → salva.
      await activityMutation.mutateAsync(data);
    }
  }

  const isSubmitting = activityMutation.isPending;

  const enabledOptions: Option<boolean>[] = [
    { value: true, label: text.list.table.active },
    { value: false, label: text.list.table.inactive },
  ];

  const typeOptions: Option<ActivityTypeSlug>[] = [
    { value: 'custeio', label: text.form.typeOptions.costing },
    { value: 'investimento', label: text.form.typeOptions.investment },
    { value: 'a_definir', label: text.form.typeOptions.undefined },
  ];

  const useOptions: Option<ActivityUseSlug>[] = [
    { value: 'ambos', label: text.form.useOptions.both },
    { value: 'agricultura', label: text.form.useOptions.agriculture },
    { value: 'fruticultura', label: text.form.useOptions.fruitculture },
    { value: 'pecuaria_corte', label: text.form.useOptions.beefCattle },
  ];

  return (
    <FormContainer
      title={isEditing ? text.form.title.edit : text.form.title.create}
      showDivider
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
            {...register('name')}
            error={errors.name?.message}
            isRequired
            loading={isLoading}
            disabled={!canSave}
          />

          <Input
            label={text.form.fields.description}
            placeholder={text.form.placeholders.description}
            {...register('description')}
            error={errors.description?.message}
            loading={isLoading}
            disabled={!canSave}
          />

          <Controller
            name="vl_hectare"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              // Máscara monetária (R$ + milhar + 2 casas), achado E2E do dev —
              // exibição/digitação mascarada, payload SEMPRE número puro
              // (`onValueChange` já entrega `number`, nunca a string
              // formatada). Migrado para `MaskedInput kind="currency"` na
              // 97-Esteiras/001 (Wave 0) — algoritmo idêntico ao `MoneyInput`
              // anterior, zero mudança de comportamento/payload.
              <MaskedInput
                kind="currency"
                name={name}
                label={text.form.fields.vlHectare}
                value={value}
                onValueChange={onChange}
                error={error?.message}
                isRequired
                disabled={!canSave}
              />
            )}
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
                onChange={(opt: Option<ActivityTypeSlug> | null) => onChange(opt?.value ?? '')}
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
            name="use"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <Select
                label={text.form.fields.use}
                name={name}
                value={useOptions.find((option) => option.value === value) ?? null}
                onChange={(opt: Option<ActivityUseSlug> | null) => onChange(opt?.value ?? '')}
                options={useOptions}
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

        {/* TASK-FE-035, revisado na rodada visual 2 (pós-E2E) — checklist
            "Operações", consumindo `GET /api/v1/operations` (TASK-BE-054) via
            `useOperationsChecklist` (busca server-side, per_page no teto de
            100). Fora do `SimpleGrid` de colunas curtas (célula própria de
            largura total) — a lista de checkboxes precisa de espaço
            horizontal para o rótulo + busca, diferente dos demais campos de
            1 linha. Payload GRAVADO no RHF continua `number[]` puro (D3 do
            Operation-contrato); `selectedOperations` só cacheia rótulos para
            exibição (ver comentário do `useState` acima). */}
        <Box mt={6}>
          <Controller
            name="operations"
            control={control}
            render={({ field: { value, onChange } }) => {
              const fetchedItems = operationsQuery.data?.data.items ?? [];
              const fetchedIds = new Set(fetchedItems.map((operation) => operation.id));
              // Operações já vinculadas (edição) que caíram fora do lote/
              // busca atual — mantidas visíveis e marcadas, com o rótulo do
              // cache local (nunca "invisíveis mas selecionadas").
              const extraSelected = selectedOperations.filter(
                (operation) => value.includes(operation.id) && !fetchedIds.has(operation.id)
              );
              const checklistItems: CheckboxListItem<number>[] = [
                ...extraSelected,
                ...fetchedItems,
              ].map((operation) => ({ value: operation.id, label: operation.name }));

              return (
                <CheckboxListField<number>
                  label={text.form.fields.operations}
                  items={checklistItems}
                  selectedValues={value}
                  onChange={(values) => {
                    onChange(values);
                    // Sincroniza o cache de rótulos: soma o que já se
                    // conhecia (`selectedOperations` + lote atual) e mantém
                    // só o que segue selecionado.
                    setSelectedOperations((previous) => {
                      const known = new Map(
                        [...previous, ...fetchedItems].map(
                          (operation) => [operation.id, operation] as const
                        )
                      );
                      return values
                        .map((id) => known.get(id))
                        .filter((operation): operation is ActivityOperationRef => !!operation);
                    });
                  }}
                  searchValue={operationsSearch}
                  onSearchChange={setOperationsSearch}
                  searchPlaceholder={text.form.operationsField.searchPlaceholder}
                  selectAllLabel={text.form.operationsField.selectAllLabel}
                  deselectAllLabel={text.form.operationsField.deselectAllLabel}
                  selectedCountLabel={text.form.operationsField.selectedCountLabel}
                  emptyLabel={text.form.operationsField.emptyLabel}
                  errorLabel={text.form.operationsField.errorLabel}
                  retryLabel={text.form.operationsField.retryLabel}
                  isLoading={operationsQuery.isLoading || isLoading}
                  isError={operationsQuery.isError}
                  onRetry={() => operationsQuery.refetch()}
                  isDisabled={!canSave}
                />
              );
            }}
          />
        </Box>
      </Form>
    </FormContainer>
  );
}
