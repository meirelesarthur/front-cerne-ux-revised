// src/pages/BaseRegistrations/Cultivation/CreateOrUpdateCultivation.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de Cultura/Variedade (Cultivation) —
// Cadastros Base. Rotas: /cadastros-base/cultura/novo e
// /cadastros-base/cultura/:cultivationId (GUID).
//
// Estrutura idêntica ao padrão vivo do módulo (CreateOrUpdatePerfil.tsx /
// _examples/CreateOrUpdateRecurso.tsx):
//   - `isEditing` = GUID válido na rota ("novo" não é GUID);
//   - `parent_uuid` vazio ("") = está criando/editando uma Cultura (raiz);
//     preenchido = é a Cultura-pai de uma Variedade;
//   - Select de Cultura-pai populado por `GET /cultivations/active`,
//     filtrando NO CLIENT só as raízes (`type === "cultura"`) — reflete
//     MAX_DEPTH=2 (Cultivation-contrato.md DA-CV-05.5): uma Variedade nunca
//     pode ser pai. O backend continua sendo a fonte de verdade
//     (`MaxHierarchyDepthRule`) — esta filtragem é defesa em profundidade de
//     UX, não substitui a validação do servidor;
//   - Ao vir da ação "Nova Variedade" da árvore (index.tsx →
//     `handleNewVariety`), a querystring `?parentUuid=<uuid>` pré-seleciona
//     o pai já na criação;
//   - GET de detalhe (`CultivationData`) expõe `parent` ANINHADO
//     (`{uuid,name} | null`), NUNCA um `parent_uuid` plano — só o payload de
//     ESCRITA usa `parent_uuid` escalar (Cultivation-contrato.md Seção 4);
//   - Update envia o RECURSO COMPLETO (`name`/`is_enabled`/`parent_uuid`
//     SEMPRE), nunca um delta de `dirtyFields` — `CultivationRequest` é
//     full-resource-replace (docblock da classe): `name`/`is_enabled` são
//     `required` em todo PUT, então omiti-los quando só o outro campo muda
//     quebra com 422. `parent_uuid` também é sempre enviado (mesmo sem
//     mudar): é `nullable`/editável no update (reparentar é um caso de uso
//     real — DA-CV-05), e `UpdateCultivationAction::resolveParentId()`
//     colapsa a chave OMITIDA (`Optional`) para o mesmo resultado de `null`
//     explícito — omitir zeraria a hierarquia existente sem essa intenção
//     do usuário. Diferente, portanto, do padrão `CentroCusto`/`PlanAccount`
//     (onde `parent_uuid` é `prohibited` no update e por isso nunca é
//     enviado) — aqui o Request não proíbe, então fidelidade ao contrato é
//     sempre mandar o valor atual;
//   - Verbo HTTP de update = `PUT` (contrato desta API — Seção 3), não
//     `PATCH` (padrão de outras entidades do projeto).
// -----------------------------------------------------------------------------

import { useMemo } from "react";

import { Box, SimpleGrid } from "@chakra-ui/react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import type {
  CreateCultivationRequest,
  CultivationData,
  CultivationForm as CultivationFormType,
  UpdateCultivationRequest,
} from "@/@types/v2/Cultivation/cultivation";
import { Button } from "@/components/Button";
import { ButtonSaveAndNext } from "@/components/ButtonSaveAndNext";
import { Form } from "@/components/Form";
import { Input } from "@/components/Form/Input";
import { Select } from "@/components/Form/Select";
import { FormContainer } from "@/components/Layout/FormContainer";
import { columnsForm } from "@/constants/coluns-form";
import { queryKey } from "@/constants/query-key";
import { useLanguage } from "@/hooks/useLanguage";
import { useRequest } from "@/hooks/useRequest";
import {
  createCultivation,
  updateCultivation,
} from "@/services/v2/Cultivation/cultivation-service";
import { checkLoadingStatus } from "@/utils/checkLoadingStatus";
import { isValidGuid } from "@/utils/guid";
import { isEmpty } from "@/utils/isEmpty";

import { cultivationSchemaResolver } from "@/validations/schemas/BaseRegistrations/cultivation-schema";
import { useCultivationActiveOptions, useCultivationForm } from "./useCultivation";

export default function CreateOrUpdateCultivation() {
  const { cultivationId } = useParams<{ cultivationId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();

  // É edição quando existe um GUID válido na rota ("novo" não é GUID).
  const isEditing = isValidGuid(cultivationId);

  // Pré-seleção de pai vinda da ação "Nova Variedade" da árvore (index.tsx,
  // handleNewVariety: `navigate(".../novo?parentUuid=" + parent.uuid)`).
  const preselectedParentUuid = searchParams.get("parentUuid") ?? "";

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<CultivationFormType>({
    mode: "onChange",
    resolver: cultivationSchemaResolver(languageGB) as any,
    reValidateMode: "onChange",
    defaultValues: {
      name: "",
      is_enabled: true,
      parent_uuid: isEditing ? "" : preselectedParentUuid,
    },
  });

  // ✅ LEI 2 (get_pwa_form_query_pattern): função nomeada + guarda de
  // dirtyFields — `useCustomFormQueryByGuid` chama com `resetForce=true` na
  // carga inicial (ver useCultivation.tsx).
  function fillForm(data: CultivationData, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        name: data.name,
        is_enabled: !!data.is_enabled,
        // `parent` vem ANINHADO no Resource de leitura (nunca `parent_uuid`
        // plano) — ver nota de topo do arquivo.
        parent_uuid: data.parent?.uuid ?? "",
      });
    }
  }

  const cultivationQuery = useCultivationForm({
    registrationId: isEditing ? cultivationId : undefined,
    fillForm,
  });

  const activeOptions = useCultivationActiveOptions();

  // Só raízes ("cultura") podem ser pai — MAX_DEPTH=2 (DA-CV-05.5): reflete
  // no client a mesma regra que `MaxHierarchyDepthRule` já impõe no backend.
  // Também exclui o próprio registro em edição (anti-autorreferência,
  // DA-CV-05.3) — só relevante quando se edita uma Cultura-raiz.
  const parentOptions = useMemo(
    () =>
      (activeOptions.data ?? [])
        .filter((node) => node.type === "cultura")
        .filter((node) => !isEditing || node.uuid !== cultivationId)
        .map((node) => ({ value: node.uuid, label: node.name })),
    [activeOptions.data, isEditing, cultivationId]
  );

  const isLoading = isEditing
    ? checkLoadingStatus([cultivationQuery as any])
    : false;

  const cultivationMutation = useRequest({
    asyncFunction: tryPersistCultivation,
    entityName: languageGB.cultivation.pageTitle,
    queryKey: queryKey.cultivation.tree,
    queryKey2: queryKey.cultivation.active,
    queryKey3: queryKey.cultivation.detail,
    typesRequest: isEditing ? "update" : "create",
    actionSuccess: () => {
      navigate(-1);
    },
  });

  async function tryPersistCultivation(data: CultivationFormType) {
    // "" (sem pai selecionado) → `null` no payload = Cultura-raiz.
    const parentUuid = data.parent_uuid ? data.parent_uuid : null;

    if (isEditing && cultivationId) {
      // UPDATE: full-resource-replace — `name`/`is_enabled` são `required`
      // em todo PUT (`CultivationRequest`), então vão SEMPRE no payload
      // (não gated por `dirtyFields`; ver nota de topo do arquivo). Sem
      // isso, editar só o status faz `name` sumir (422) e editar só o nome
      // faz `is_enabled` sumir (422 "obrigatório") — o bug reportado.
      //
      // `parent_uuid` também vai SEMPRE (não é `prohibited` como em
      // `CentroCusto`/`PlanAccount`): a chave omitida é tratada pela Action
      // do backend como equivalente a `null` explícito
      // (`UpdateCultivationAction::resolveParentId`), então omitir zeraria
      // a hierarquia mesmo quando o usuário não mexeu no pai.
      const patch: UpdateCultivationRequest = {
        name: data.name,
        is_enabled: !!data.is_enabled,
        parent_uuid: parentUuid,
      };

      // Verbo `PUT` (Cultivation-contrato.md Seção 3) — divergência
      // intencional do `PATCH` usado por outras entidades do projeto.
      return await updateCultivation(cultivationId, patch);
    }

    const payload: CreateCultivationRequest = {
      name: data.name,
      is_enabled: data.is_enabled,
      parent_uuid: parentUuid,
    };
    return await createCultivation(payload);
  }

  async function onSubmit(data: CultivationFormType) {
    if (isEditing && !isEmpty(dirtyFields)) {
      navigate(-1);
      return;
    }
    await cultivationMutation.mutateAsync(data);
  }

  const isSubmitting = cultivationMutation.isPending;

  // Reaproveita os textos já existentes da listagem (Ativa/Inativa) — evita
  // duplicar chave de i18n para o mesmo par de rótulos.
  const STATUS_OPTIONS = useMemo(
    () => [
      { value: true, label: languageGB.cultivation.table.active },
      { value: false, label: languageGB.cultivation.table.inactive },
    ],
    [languageGB]
  );

  return (
    <FormContainer
      title={
        isEditing
          ? languageGB.cultivation.form.title.edit
          : languageGB.cultivation.form.title.create
      }
      footer={
        <>
          <Button
            title={languageGB.defaltStrings?.cancel || "Cancelar"}
            variant="outline"
            type="button"
            onClick={() => navigate(-1)}
          />
          <ButtonSaveAndNext
            create={!isEditing}
            dirtyFields={dirtyFields}
            type="button"
            onClick={handleSubmit(onSubmit)}
            languageGB={languageGB}
            loading={isSubmitting}
            disabled={isSubmitting || isLoading}
          />
        </>
      }
    >
      <Form noPadding onSubmit={handleSubmit(onSubmit)}>
        <Box pt={4}>
          <SimpleGrid columns={columnsForm.default} gap={6}>
            <Input
              label={languageGB.cultivation.form.fields.name}
              placeholder={languageGB.cultivation.form.placeholders.name}
              {...register("name")}
              error={errors.name?.message}
              isRequired
              loading={isLoading}
            />

            <Controller
              name="is_enabled"
              control={control}
              render={({
                field: { name, value, onChange },
                fieldState: { error },
              }) => (
                <Select
                  label={languageGB.cultivation.form.fields.status}
                  name={name}
                  value={STATUS_OPTIONS.find((option) => option.value === value)}
                  onChange={(val: any) => onChange(!!val?.value)}
                  options={STATUS_OPTIONS}
                  error={error?.message}
                  isRequired
                  noClearable
                  isDisabled={isLoading}
                  loading={isLoading}
                />
              )}
            />
          </SimpleGrid>

          <Box mt={6}>
            <SimpleGrid columns={columnsForm.default} gap={6}>
              <Controller
                name="parent_uuid"
                control={control}
                render={({
                  field: { name, value, onChange },
                  fieldState: { error },
                }) => (
                  <Select
                    label={languageGB.cultivation.form.fields.parent}
                    placeholder={languageGB.cultivation.form.placeholders.parent}
                    name={name}
                    value={
                      parentOptions.find((option) => option.value === value) ??
                      null
                    }
                    onChange={(val: any) => onChange(val?.value ?? "")}
                    options={parentOptions}
                    error={error?.message}
                    isDisabled={isLoading || activeOptions.isLoading}
                    loading={isLoading || activeOptions.isLoading}
                  />
                )}
              />
            </SimpleGrid>
          </Box>
        </Box>
      </Form>
    </FormContainer>
  );
}
