// src/pages/BaseRegistrations/Addressing/CreateOrUpdateAddressing.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de Endereçamento (Addressing) — Cadastros
// Base. Rotas: /cadastros-base/enderecos/novo e
// /cadastros-base/enderecos/:addressingId (GUID).
//
// PONTO DE MODELAGEM DE UI (TASK-AD-03b — decisão tomada por fidelidade
// literal ao legado, `../agro365/resources/views/addressings/_forms.blade.php`,
// SEM ambiguidade de negócio): o pai (`parent_uuid`) NUNCA foi um `Select`
// livre editável pelo usuário, nem na criação nem na edição — é SEMPRE
// pré-preenchido por contexto (querystring `?parentUuid=` na criação a
// partir da ação "Adicionar {nível}" de uma linha da árvore, TASK-AD-03a) ou
// por leitura (`data.parent` aninhado no GET de detalhe, na edição), e
// exibido só como informação, TRAVADA. **Não existe nenhum `Select`/
// `SelectAsyncPaginate` de pai neste formulário** (grep negativo do
// checklist é N/A, declarado e justificado, não omitido por descuido).
//
// Casos de criação:
//   1. Botão genérico "Novo Endereçamento" (header da listagem, sem
//      `?parentUuid=`) → cria sempre um Setor (raiz, `parent_uuid: null`),
//      sem exibir nenhum bloco de informação de pai.
//   2. Ação "Adicionar {próximo nível}" de uma linha da árvore
//      (`?parentUuid=<uuid>`) → busca o pai só para EXIBIR (nome + nível,
//      somente leitura — `useAddressingParentPreview`) e envia o
//      `parent_uuid` FIXO no payload de criação.
//
// Edição: `description` é o ÚNICO campo editável do `react-hook-form`. O pai
// (se houver) vem ANINHADO em `data.parent` (GET de detalhe) e é exibido
// como informação read-only — SEM reparentar via UI nesta rodada (mesma
// fidelidade do `edit.blade.php`, select `readonly`). `UpdateAddressingRequest`
// desta Tarefa NUNCA inclui `parent_uuid` (confirmado em
// `UpdateAddressingAction::attributesFromData`, backend TASK-AD-02: omitir a
// chave preserva o pai atual — `Optional`).
//
// Guard de `dirtyFields` EXPLÍCITO — `Object.keys(dirtyFields).length === 0`
// — NUNCA `isEmpty(dirtyFields)` (desvio DELIBERADO do molde `Cultivation`/
// `CreateOrUpdateCultivation.tsx`, que usa `isEmpty`; item do checklist de
// 16/17 armadilhas injetado nesta Tarefa — não repetir esse padrão aqui).
//
// Título do formulário deriva o nível DINAMICAMENTE via
// `languageGB.baseRegistrations.addressing.levels[...]` — NUNCA `type_label` do backend
// (PT-BR fixo, quebraria i18n EN/ES): criação sem contexto → nível 1
// (Setor); criação contextual → nível do pai + 1; edição → nível do próprio
// registro.
// -----------------------------------------------------------------------------

import { Box, SimpleGrid, Skeleton, Text, VStack } from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import type {
  AddressingData,
  AddressingForm as AddressingFormType,
  CreateAddressingRequest,
  UpdateAddressingRequest,
} from "@/@types/v2/Addressing/addressing";
import { Button } from "@/components/Button";
import { ButtonSaveAndNext } from "@/components/ButtonSaveAndNext";
import { Form } from "@/components/Form";
import { Input } from "@/components/Form/Input";
import { FormContainer } from "@/components/Layout/FormContainer";
import { columnsForm } from "@/constants/coluns-form";
import { queryKey } from "@/constants/query-key";
import { useLanguage } from "@/hooks/useLanguage";
import { useRequest } from "@/hooks/useRequest";
import {
  createAddressing,
  updateAddressing,
} from "@/services/v2/Addressing/addressing-service";
import { checkLoadingStatus } from "@/utils/checkLoadingStatus";
import { isValidGuid } from "@/utils/guid";

import { addressingSchemaResolver } from "@/validations/schemas/BaseRegistrations/addressing-schema";
import {
  useAddressingForm,
  useAddressingParentPreview,
} from "./useAddressing";

export default function CreateOrUpdateAddressing() {
  const { addressingId } = useParams<{ addressingId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();

  // É edição quando existe um GUID válido na rota ("novo" não é GUID).
  const isEditing = isValidGuid(addressingId);

  // Pré-seleção de pai vinda da ação "Adicionar {nível}" da árvore
  // (index.tsx, handleAddChild: `navigate(".../novo?parentUuid=" + uuid)`).
  // "" (ausente) = criação de Setor-raiz, sem contexto de pai.
  const preselectedParentUuid = searchParams.get("parentUuid") ?? "";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<AddressingFormType>({
    mode: "onChange",
    resolver: addressingSchemaResolver(languageGB) as any,
    reValidateMode: "onChange",
    defaultValues: {
      description: "",
    },
  });

  // ✅ Guard EXPLÍCITO — `Object.keys(dirtyFields).length === 0` — NUNCA
  // `isEmpty(dirtyFields)` (ver nota de topo do arquivo).
  function fillForm(data: AddressingData, resetForce?: boolean) {
    if (Object.keys(dirtyFields).length === 0 || resetForce) {
      reset({ description: data.description });
    }
  }

  const addressingQuery = useAddressingForm({
    registrationId: isEditing ? addressingId : undefined,
    fillForm,
  });

  // Leitura pontual de apoio à UI — só para EXIBIR o pai (descrição+nível)
  // no fluxo de criação contextual. Nunca ativa em edição (o pai da edição
  // vem de `addressingQuery.data.parent`, já aninhado).
  const parentPreview = useAddressingParentPreview(
    preselectedParentUuid || undefined,
    isEditing
  );

  const isLoading = isEditing
    ? checkLoadingStatus([addressingQuery as any])
    : false;

  const isLoadingParentPreview =
    !isEditing && !!preselectedParentUuid && parentPreview.isLoading;

  // ---- Bloco de informação do pai (SEM Select — ver nota de topo) --------
  // Edição: `data.parent` aninhado (uuid/description/type/type_label).
  // Criação contextual: `parentPreview.data` (o próprio registro do pai,
  // buscado só para exibição).
  const editingParent = isEditing ? addressingQuery.data?.parent ?? null : null;
  const parentToDisplay = isEditing ? editingParent : parentPreview.data ?? null;

  // ---- Nível do formulário (título dinâmico) ------------------------------
  // Edição: nível do próprio registro. Criação contextual: nível do pai + 1.
  // Criação sem contexto: nível 1 (Setor).
  const formLevelType: 1 | 2 | 3 | 4 = isEditing
    ? addressingQuery.data?.type ?? 1
    : preselectedParentUuid
      ? (((parentPreview.data?.type ?? 0) + 1) as 1 | 2 | 3 | 4)
      : 1;
  const formLevelLabel = languageGB.baseRegistrations.addressing.levels[formLevelType];

  const addressingMutation = useRequest({
    asyncFunction: tryPersistAddressing,
    entityName: languageGB.baseRegistrations.addressing.pageTitle,
    queryKey: queryKey.baseRegistrations.addressing.tree,
    queryKey2: queryKey.baseRegistrations.addressing.detail,
    typesRequest: isEditing ? "update" : "create",
    actionSuccess: () => {
      navigate(-1);
    },
  });

  async function tryPersistAddressing(data: AddressingFormType) {
    if (isEditing && addressingId) {
      // `parent_uuid` NUNCA incluído no payload de update (decisão desta
      // Tarefa — reparentar fora de escopo; ver nota de topo do arquivo).
      const patch: UpdateAddressingRequest = {
        description: data.description,
      };

      // Verbo `PUT` (Addressing-contrato.md Seção 3), confirmado no service.
      return await updateAddressing(addressingId, patch);
    }

    const payload: CreateAddressingRequest = {
      description: data.description,
      // "" (sem contexto de pai) → `null` no payload = Setor-raiz.
      parent_uuid: preselectedParentUuid ? preselectedParentUuid : null,
    };
    return await createAddressing(payload);
  }

  // ✅ Guard EXPLÍCITO — `Object.keys(dirtyFields).length === 0` — NUNCA
  // `isEmpty(dirtyFields)` (ver nota de topo do arquivo).
  async function onSubmit(data: AddressingFormType) {
    if (isEditing && Object.keys(dirtyFields).length === 0) {
      navigate(-1);
      return;
    }
    await addressingMutation.mutateAsync(data);
  }

  const isSubmitting = addressingMutation.isPending;

  return (
    <FormContainer
      title={languageGB.baseRegistrations.addressing.form.title[isEditing ? "edit" : "create"].replace(
        "{level}",
        formLevelLabel
      )}
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
        <Box>
          <SimpleGrid columns={columnsForm.default} gap={6}>
            <Input
              label={languageGB.baseRegistrations.addressing.form.fields.description}
              placeholder={languageGB.baseRegistrations.addressing.form.placeholders.description}
              {...register("description")}
              error={errors.description?.message}
              isRequired
              loading={isLoading}
            />
          </SimpleGrid>

          <Box mt={6}>
            <Text fontSize="sm" fontWeight="medium" color="fg.muted" mb={2}>
              {languageGB.baseRegistrations.addressing.form.fields.parentInfo}
            </Text>

            {isLoadingParentPreview ? (
              <Skeleton height="40px" borderRadius="md" />
            ) : parentToDisplay ? (
              <VStack
                align="flex-start"
                gap={0}
                p={3}
                borderRadius="md"
                borderWidth="1px"
                borderColor="border.subtle"
                bg="bg.muted"
              >
                <Text fontWeight="semibold">{parentToDisplay.description}</Text>
                <Text fontSize="sm" color="fg.muted">
                  {languageGB.baseRegistrations.addressing.levels[parentToDisplay.type]}
                </Text>
              </VStack>
            ) : (
              <Text fontSize="sm" color="fg.muted">
                {languageGB.baseRegistrations.addressing.form.parentInfo.noParent}
              </Text>
            )}
          </Box>
        </Box>
      </Form>
    </FormContainer>
  );
}
