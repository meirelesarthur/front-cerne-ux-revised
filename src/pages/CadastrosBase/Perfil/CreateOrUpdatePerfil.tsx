// src/pages/CadastrosBase/Perfil/CreateOrUpdatePerfil.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO **e** EDIÇÃO de PERFIL (Roles RBAC) — Cadastros Base.
// Rotas: /cadastros-base/perfil/novo  e  /cadastros-base/perfil/:roleId (GUID).
//
// Estrutura idêntica à camada de exemplo (CreateOrUpdateRecurso.tsx):
//   - `isEditing` = GUID válido na rota ("novo" não é GUID);
//   - ABAS: 0 "Dados Gerais" (nome*, descrição, visível-ao-usuário) e
//     1 "Permissões" (árvore em accordion — PermissionTreeSelector), ambas
//     visíveis nos dois modos (as permissões são atribuíveis já na criação);
//   - Submit envia o CONJUNTO COMPLETO de `permission_uuids` selecionados
//     (folhas com uuid null nunca entram na seleção);
//   - Salvar respeita `roles_tenant_create` / `roles_tenant_edit` conforme o
//     modo (UX; o enforcement real é o 403 do backend).
// -----------------------------------------------------------------------------

import { useRef, useState } from "react";

import { Box, SimpleGrid, Tabs } from "@chakra-ui/react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";

import type {
  RoleDetail,
  RoleForm as RoleFormType,
  RolePayload,
} from "@/@types/v2/Roles";
import { Button } from "@/components/Button";
import { ButtonSaveAndNext } from "@/components/ButtonSaveAndNext";
import { Form } from "@/components/Form";
import { Input } from "@/components/Form/Input";
import { Textarea } from "@/components/Form/InputTextArea";
import { FormContainer } from "@/components/Layout/FormContainer";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { columnsForm } from "@/constants/coluns-form";
import { queryKey } from "@/constants/query-key";
import { useLanguage } from "@/hooks/useLanguage";
import { usePermissions } from "@/hooks/usePermissions";
import { useRequest } from "@/hooks/useRequest";
import { createRole, updateRole } from "@/services/v2/Roles/role-service";
import { checkLoadingStatus } from "@/utils/checkLoadingStatus";
import { isValidGuid } from "@/utils/guid";
import { isEmpty } from "@/utils/isEmpty";

import { perfilSchemaResolver } from "./perfil-schema";
import { PermissionTreeSelector } from "./PermissionTreeSelector";
import { usePermissionTree, useRoleForm } from "./useRoles";

/** Assinatura estável da seleção, para detectar mudança (dirty). */
function selectionSignature(selected: Set<string>): string {
  return Array.from(selected).sort().join("|");
}

export default function CreateOrUpdatePerfil() {
  const { roleId } = useParams<{ roleId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  // É edição quando existe um GUID válido na rota (a rota "novo" não é GUID).
  const isEditing = isValidGuid(roleId);

  const canSave = isEditing ? can("roles_tenant_edit") : can("roles_tenant_create");

  const [tabIndex, setTabIndex] = useState(0);

  // ---- Seleção de permissões (fora do RHF — árvore própria) ----------------
  const [selectedUuids, setSelectedUuids] = useState<Set<string>>(new Set());
  const initialSelectionRef = useRef<string>("");
  const selectionDirty =
    selectionSignature(selectedUuids) !== initialSelectionRef.current;

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<RoleFormType>({
    mode: "onChange",
    resolver: perfilSchemaResolver(languageGB) as any,
    reValidateMode: "onChange",
    defaultValues: {
      name: "",
      description: "",
      is_user_visible: true,
    },
  });

  function fillForm(data: RoleDetail, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        uuid: data.uuid,
        name: data.name,
        description: data.description || "",
        is_user_visible: !!data.is_user_visible,
      });
      // Pré-marca as permissões ATRIBUÍDAS do role (match por uuid).
      const initial = new Set(data.permissions.map((p) => p.uuid));
      setSelectedUuids(initial);
      initialSelectionRef.current = selectionSignature(initial);
    }
  }

  const roleQuery = useRoleForm({
    registrationId: isEditing ? roleId : undefined,
    fillForm,
  });

  const permissionTree = usePermissionTree();

  const isLoading = isEditing && checkLoadingStatus([roleQuery as any]);

  const roleMutation = useRequest({
    asyncFunction: tryPersistRole,
    entityName: languageGB.roles.role.singularLabel,
    queryKey: queryKey.roles.list,
    queryKey2: queryKey.roles.detail,
    typesRequest: isEditing ? "update" : "create",
    actionSuccess: () => {
      navigate(-1);
    },
  });

  async function tryPersistRole(data: RoleFormType) {
    // Conjunto COMPLETO de permission_uuids selecionados (o backend
    // sincroniza; folhas com uuid null nunca entram no Set).
    const payload: RolePayload = {
      name: data.name,
      description: data.description?.trim() ? data.description : undefined,
      is_user_visible: !!data.is_user_visible,
      permission_uuids: Array.from(selectedUuids),
    };

    if (isEditing && roleId) {
      return await updateRole(roleId, payload);
    }

    return await createRole(payload);
  }

  async function onSubmit(data: RoleFormType) {
    // Em edição, só evita a chamada de API quando NADA mudou (nem campos, nem
    // seleção de permissões). Cálculo direto de "sujo" — `isEmpty` deste projeto
    // é invertido (retorna true quando HÁ chaves), então usá-lo aqui descartaria
    // a edição justamente quando existem campos alterados.
    const hasFieldChanges = Object.keys(dirtyFields).length > 0;
    if (isEditing && !hasFieldChanges && !selectionDirty) {
      navigate(-1);
    } else {
      await roleMutation.mutateAsync(data);
    }
  }

  const isSubmitting = roleMutation.isPending;

  // dirtyFields "aumentado" com a seleção da árvore (para o ButtonSaveAndNext).
  const mergedDirtyFields = selectionDirty
    ? { ...dirtyFields, permission_uuids: true }
    : dirtyFields;

  return (
    <FormContainer
      title={
        isEditing
          ? languageGB.roles.role.form.title.edit
          : languageGB.roles.role.form.title.create
      }
      footer={
        <>
          <Button
            title={languageGB.defaltStrings?.cancel || "Cancelar"}
            variant="secondary"
            type="button"
            onClick={() => navigate(-1)}
          />
          {canSave && (
            <ButtonSaveAndNext
              create={!isEditing}
              dirtyFields={mergedDirtyFields}
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
        {/* @ts-ignore - Chakra UI v3 Tabs API */}
        <Tabs.Root
          value={String(tabIndex)}
          onValueChange={(e: any) => setTabIndex(Number(e.value))}
          variant="outline"
        >
          {/* @ts-ignore - Tab List fixa (sticky) no topo do body: abas sempre
              visíveis; só o conteúdo rola. */}
          <Tabs.List position="sticky" top="0" zIndex={1} bg="formBG">
            {/* @ts-ignore */}
            <Tabs.Trigger value="0">
              {languageGB.roles.role.form.tabs.generalInfo}
            </Tabs.Trigger>
            {/* @ts-ignore */}
            <Tabs.Trigger value="1">
              {languageGB.roles.role.form.tabs.permissions}
            </Tabs.Trigger>
          </Tabs.List>

          {/* ---- ABA 0: Dados Gerais ---- */}
          {/* @ts-ignore */}
          <Tabs.Content value="0">
            <Box pt={4}>
              <SimpleGrid columns={columnsForm.default} gap={6}>
                <Input
                  label={languageGB.roles.role.form.fields.name}
                  placeholder={languageGB.roles.role.form.placeholders.name}
                  {...register("name")}
                  error={errors.name?.message}
                  isRequired
                  loading={isLoading}
                  disabled={!canSave}
                />
              </SimpleGrid>

              <Box mt={6}>
                <Textarea
                  label={languageGB.roles.role.form.fields.description}
                  placeholder={
                    languageGB.roles.role.form.placeholders.description
                  }
                  {...register("description")}
                  loading={isLoading}
                  disabled={!canSave}
                />
              </Box>

              <Box mt={6}>
                <Controller
                  name="is_user_visible"
                  control={control}
                  render={({ field }) => (
                    <ToggleRow
                      label={languageGB.roles.role.form.fields.isUserVisible}
                      hint={languageGB.roles.role.form.hints.isUserVisible}
                      checked={!!field.value}
                      onChange={field.onChange}
                      disabled={!canSave || isLoading}
                    />
                  )}
                />
              </Box>
            </Box>
          </Tabs.Content>

          {/* ---- ABA 1: Permissões (árvore em accordion) ---- */}
          {/* @ts-ignore */}
          <Tabs.Content value="1">
            <Box pt={4}>
              <PermissionTreeSelector
                tree={permissionTree.data}
                isLoading={permissionTree.isLoading || isLoading}
                selected={selectedUuids}
                onChange={setSelectedUuids}
                readOnly={!canSave}
                canAssign={can}
                languageGB={languageGB}
              />
            </Box>
          </Tabs.Content>
        </Tabs.Root>
      </Form>
    </FormContainer>
  );
}
