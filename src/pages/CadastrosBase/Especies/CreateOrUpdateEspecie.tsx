// src/pages/CadastrosBase/Especies/CreateOrUpdateEspecie.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de ESPÉCIE — Cadastros Base (TASK-ESP-02).
// Rotas: /cadastros-base/especies/novo e /cadastros-base/especies/:specieId
// (GUID), registradas em src/router/index.tsx (substituem os placeholders
// deixados por TASK-ESP-01), guardadas por `specie_view`.
//
// Referência UX (Decisão do Desenvolvedor, TASK-ESP-01/ESP-02): não existe
// tela oficial de Espécie no design system `cerne` — precedente INTERNO
// CadastrosBase/CentroCusto + CadastrosBase/Perfil (estrutura mecânica
// idêntica a CreateOrUpdatePerfil.tsx: `isEditing` por GUID, `fillForm`
// guardado por `!isEmpty(dirtyFields) || resetForce`, mutação via `useRequest`
// com `typesRequest` condicional, `ButtonSaveAndNext` com `dirtyFields`).
//
// 3 campos: `description` (Input, obrigatório, máx. 100), `is_enabled`
// (Select com options Ativa/Inativa — mesmo padrão do campo de status em
// `Cultivation/CreateOrUpdateCultivation.tsx`, reaproveitando os textos já
// existentes de `list.table.active/inactive` — NÃO um Switch, ao contrário de
// CentroCusto/Perfil) e Centro de Custo (`Controller` + `SelectAsyncPaginate`,
// opcional/nullable).
//
// Select de Centro de Custo — reaproveita 100% o ecossistema real (import
// direto de `listCostCenters`, sem cópia): mesmo precedente exato de
// `CreateOrUpdateCentroCusto.tsx:648-679` (campo `parent_uuid`). Confirmado
// nesta rodada de execução (leitura de código, TASK-ESP-API-01 já entregue):
//   - `SpecieAnimalResource` (api_root) expõe `cost_center: {uuid,code,
//     description} | null` tanto no `index()` quanto no `show()`;
//   - `SpecieAnimalRequest` aceita `cost_center_uuid` (nullable, `Rule::exists
//     ('cost_centers','uuid')`).
// O campo RHF guarda o Option INTEIRO (`{label,value}|null`); no submit
// converte para `cost_center_uuid: string | null`.
//
// `onSubmit`: "editar sem alterar nada = Cancelar" (só volta sem salvar
// quando NADA mudou). CORREÇÃO (TASK-ESP-FIX-3, FIX 1): a util
// `src/utils/isEmpty.ts` é MAL NOMEADA — retorna `true` quando o objeto NÃO
// está vazio (tem alguma chave própria) e `false` quando está vazio. A
// condição correta é, portanto, `isEditing && !isEmpty(dirtyFields) →
// navigate(-1)` (mesma semântica já usada em `fillForm` acima, linha do
// `!isEmpty(dirtyFields) || resetForce`). A versão sem o `!` (`isEditing &&
// isEmpty(dirtyFields) → navigate(-1)`) — que este arquivo chegou a usar —
// tinha o efeito inverso: toda edição REAL (com `dirtyFields` preenchido)
// caía no `navigate(-1)` e a mutation nunca era chamada.
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

import { listCostCenterOptions } from '@/services/v2/CostCenters/cost-center-service';
import { createSpecie, updateSpecie } from '@/services/v2/Species/species-service';

import type { Option } from '@/@types/option';
import type { CostCenterRef } from '@/@types/v2/CostCenters';
import type { SpecieData, SpecieForm as SpecieFormType, SpeciePayload } from '@/@types/v2/Species/species';

import { especieSchemaResolver } from './especie-schema';
import { useSpecieForm } from './useSpecies';

export default function CreateOrUpdateEspecie() {
  const { specieId } = useParams<{ specieId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  // É edição quando existe um GUID válido na rota ("novo" não é GUID).
  const isEditing = isValidGuid(specieId);

  const text = languageGB.species.specie;

  const canSave = isEditing ? can('specie_edit') : can('specie_create');

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<SpecieFormType>({
    mode: 'onChange',
    resolver: especieSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      description: '',
      is_enabled: true,
      cost_center_uuid: null,
    },
  });

  function fillForm(data: SpecieData, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        uuid: data.uuid,
        description: data.description,
        is_enabled: !!data.is_enabled,
        cost_center_uuid: data.cost_center
          ? {
              label: `${data.cost_center.code} — ${data.cost_center.description}`,
              value: data.cost_center.uuid,
            }
          : null,
      });
    }
  }

  const specieQuery = useSpecieForm({
    registrationId: isEditing ? specieId : undefined,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([specieQuery as any]);

  const specieMutation = useRequest({
    asyncFunction: tryPersistSpecie,
    entityName: text.singularLabel,
    queryKey: queryKey.species.list,
    queryKey2: queryKey.species.detail,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  async function tryPersistSpecie(data: SpecieFormType) {
    // UPDATE e CREATE enviam o MESMO conjunto completo — o
    // `SpecieAnimalRequest` (api_root) trata o PUT como full-resource-replace:
    // `description` e `is_enabled` são `required` tanto no store quanto no
    // update (confirmado em SpecieAnimalRequest::rules(), sem bloco
    // condicional por verbo), então NUNCA podem ser gated por `dirtyFields`
    // (TASK-ESP-FIX-PAYLOAD — recorrência exata de TASK-CV-FIX-PAYLOAD/
    // Cultivation). `cost_center_uuid` é `nullable` no contrato — vai sempre
    // o valor atual do form (`null` quando não selecionado), mesmo padrão de
    // CreateOrUpdateCentroCusto/PlanAccount/Cultivation.
    const payload: SpeciePayload = {
      description: data.description.trim(),
      is_enabled: !!data.is_enabled,
      cost_center_uuid: data.cost_center_uuid?.value ?? null,
    };

    if (isEditing && specieId) {
      return await updateSpecie(specieId, payload);
    }

    return await createSpecie(payload);
  }

  async function onSubmit(data: SpecieFormType) {
    if (isEditing && !isEmpty(dirtyFields)) {
      navigate(-1);
    } else {
      await specieMutation.mutateAsync(data);
    }
  }

  const isSubmitting = specieMutation.isPending;

  // Reaproveita os textos já existentes da listagem (Ativa/Inativa) — mesmo
  // racional de `Cultivation/CreateOrUpdateCultivation.tsx` (evita duplicar
  // chave de i18n para o mesmo par de rótulos).
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
            name="cost_center_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.form.fields.costCenter}
                placeholder={text.form.placeholders.costCenter}
                tooltip={text.form.hints.costCenterOptional}
                // TASK-FE-978 (GAP-FE-180 resolvido por TASK-BE-611) —
                // repontado de `listCostCenters` (CRUD, gateado por
                // `costcenters_view`) para `listCostCenterOptions`
                // (`/cost-centers/options`, SEM gate), que passou a aceitar
                // `only_global_top_level` (mirror de `only_analytic`). MESMO
                // `findParams` de antes — o filtro de negócio (Sintéticos
                // globais de nível raiz) é preservado, só a rota muda.
                service={listCostCenterOptions}
                mapOptions={(item: CostCenterRef) => ({
                  label: `${item.code} — ${item.description}`,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                  only_global_top_level: true,
                  is_enabled: 'true',
                })}
                value={field.value ?? undefined}
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
