// src/pages/CadastrosBase/Fornecedores/CreateOrUpdateFornecedor.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de FORNECEDOR (Provider — Cadastros Base).
// Rotas: /cadastros-base/fornecedores/novo (criar, guardada por
// `providers_create`) e /cadastros-base/fornecedores/:providerUuid (editar,
// GUID, guardada por `providers_edit`) — TASK-PR-FE-03.
//
// CASCA de abas (`Tabs.Root`, molde `Perfil/CreateOrUpdatePerfil.tsx`) com
// deep-link por URL (`useCustomSearch`, `?tab=0..3`):
//   0 "Dados"      → TASK-PR-FE-03 (campos raiz Person + bloco Provider root)
//   1 "Conta"      → TASK-PR-FE-04 (bloco bancário)
//   2 "Filiais"    → TASK-PR-FE-05 (+ receitaws.com.br)
//   3 "Vendedores" → TASK-PR-FE-06 (array dinâmico simples)
//
// -----------------------------------------------------------------------------
// TASK-PR-FE-10 (correção ESTRUTURAL de ERRO-02/ERRO-03) — este arquivo tem
// DOIS componentes:
//   - `CreateOrUpdateFornecedor` (wrapper, export default) — só resolve
//     `providerUuid`/permissões e dispara `providerQuery` (via
//     `useProviderForm`, SEM `fillForm`). Em modo EDIÇÃO, enquanto o detalhe
//     não chega, renderiza um Skeleton (nunca um form vazio momentâneo). Em
//     modo CRIAÇÃO, monta `ProviderFormBody` IMEDIATAMENTE (nada a esperar).
//   - `ProviderFormBody` (interno) — só monta quando os dados já estão
//     prontos (`initialData` resolvido, ou `undefined` em criação).
// -----------------------------------------------------------------------------
// TASK-MV-FE-12 (2026-08-10) — EXTRAÇÃO. Toda a orquestração de
// estado/submit (`useForm`/`useFieldArray`/autofill NIF+CEP+ReceitaWS/
// mutação/submit) migrou LITERALMENTE (recorte-e-cola, nenhuma linha de
// lógica reescrita) para `useProviderFormController.ts`; todo o JSX das 4
// abas migrou para `ProviderFormFields.tsx`. Esta página ficou reduzida ao
// wrapper de rota/permissão (INTOCADO) + `ProviderFormBody`, que agora só
// resolve `text`/`navigate`/`tabIndex` locais para a casca (`FormContainer`)
// + a ação "Desativar" (TASK-PR-FE-07, NÃO migra — ver ficha da Tarefa,
// "Fronteira da extração": é ação exclusiva da página completa, sem
// equivalente no futuro modal) e delega o resto aos dois módulos extraídos —
// pré-requisito de TASK-MV-FE-13 (`ProviderFormModal`, reuso destes mesmos
// módulos dentro do form de Movement). Comportamento da tela: ZERO mudança
// (mesmas 4 abas/ordem, mesmos 2 arrays, mesmo autofill, mesma ação
// Desativar, mesmo submit create/update).
// -----------------------------------------------------------------------------

import { type ElementType } from 'react';

import { Box, SimpleGrid, Skeleton, useDisclosure } from '@chakra-ui/react';
import { FiUserCheck, FiUserX } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { Form } from '@/components/Form';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useCustomSearch } from '@/hooks/useCustomSearch';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import {
  activateProvider,
  deactivateProvider,
} from '@/services/v2/CadastrosBase/Provider/provider-service';

import type { ProviderDetail } from '@/@types/v2/CadastrosBase/provider';

import { ProviderFormFields } from './ProviderFormFields';
import { useProviderFormController } from './useProviderFormController';
import { useProviderForm } from './useProviders';

// ---- Wrapper (export default) — TASK-PR-FE-10 ------------------------------
// Só resolve `providerUuid`/permissões e dispara `providerQuery` (busca do
// detalhe, SEM `fillForm` — ver `useProviders.tsx`). Gateia o mount do form:
// em EDIÇÃO, aguarda o detalhe carregar (Skeleton enquanto isso); em
// CRIAÇÃO, monta `ProviderFormBody` IMEDIATAMENTE (nada a esperar).
export default function CreateOrUpdateFornecedor() {
  const { providerUuid } = useParams<{ providerUuid: string }>();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.providers.provider;

  // É edição quando existe um GUID válido na rota ("novo" não é GUID).
  const isEditing = isValidGuid(providerUuid);

  const canSave = isEditing ? can('providers_edit') : can('providers_create');
  // Ações "Desativar"/"Ativar" no cabeçalho do form — só em modo edição,
  // guardadas por `providers_edit` (095; a API passou de `providers_delete`
  // para `providers_edit` nessas duas rotas).
  const canToggleStatus = isEditing && can('providers_edit');

  const providerQuery = useProviderForm({ registrationId: isEditing ? providerUuid : undefined });

  // UT-000773 — gateia também por `isFetching`: o hook do detalhe usa
  // `networkMode: 'offlineFirst'` e o form só lê `initialData` no 1º mount
  // (gated-mount); com cache velho, `isLoading=false` durante o refetch pós-
  // invalidação e o form montaria stale (Ativo/centro de custo antigos).
  const isLoading =
    isEditing &&
    (checkLoadingStatus([providerQuery as any]) || !!(providerQuery as any).isFetching);

  if (isLoading) {
    return (
      <FormContainer title={isEditing ? text.form.title.edit : text.form.title.create} showDivider>
        <Box pt={4}>
          <SimpleGrid columns={columnsForm.default} gap={6}>
            <Skeleton height="40px" borderRadius="md" />
            <Skeleton height="40px" borderRadius="md" />
            <Skeleton height="40px" borderRadius="md" />
          </SimpleGrid>
          <SimpleGrid columns={columnsForm.default} gap={6} mt={6}>
            <Skeleton height="40px" borderRadius="md" />
            <Skeleton height="40px" borderRadius="md" />
            <Skeleton height="40px" borderRadius="md" />
          </SimpleGrid>
          <SimpleGrid columns={columnsForm.default} gap={6} mt={6}>
            <Skeleton height="40px" borderRadius="md" />
            <Skeleton height="40px" borderRadius="md" />
          </SimpleGrid>
          <SimpleGrid columns={columnsForm.default} gap={6} mt={6}>
            <Skeleton height="40px" borderRadius="md" />
            <Skeleton height="40px" borderRadius="md" />
          </SimpleGrid>
        </Box>
      </FormContainer>
    );
  }

  return (
    <ProviderFormBody
      // `key` garante remount limpo se o usuário navegar entre edições
      // diferentes sem passar pela listagem — evita misturar `defaultValues`
      // de um Fornecedor A com o form de um Fornecedor B.
      key={providerUuid ?? 'new'}
      initialData={providerQuery.data as ProviderDetail | undefined}
      isEditing={isEditing}
      providerUuid={providerUuid}
      canSave={canSave}
      canToggleStatus={canToggleStatus}
    />
  );
}

interface ProviderFormBodyProps {
  initialData?: ProviderDetail;
  isEditing: boolean;
  providerUuid?: string;
  canSave: boolean;
  canToggleStatus: boolean;
}

// ---- Corpo interno (TASK-MV-FE-12 — reduzido ao wrapper) ------------------
// Só monta quando os dados já estão prontos (`initialData` resolvido, ou
// `undefined` em criação). Toda a orquestração de estado/submit
// (`useForm`/`useFieldArray`/autofill/mutação) mora em
// `useProviderFormController`; todo o JSX das 4 abas mora em
// `ProviderFormFields`. `onPersisted` é OMITIDO de propósito na chamada do
// controller abaixo — preserva o `navigate(-1)` original ao concluir
// create/update (comportamento intocado da página cheia). A ação "Desativar"
// (TASK-PR-FE-07) fica AQUI — ação exclusiva da página completa, sem
// equivalente no futuro modal (ver cabeçalho do arquivo).
function ProviderFormBody({
  initialData,
  isEditing,
  providerUuid,
  canSave,
  canToggleStatus,
}: ProviderFormBodyProps) {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { tabIndex, handleTabsChange } = useCustomSearch();
  const text = languageGB.providers.provider;

  const controller = useProviderFormController({ initialData, isEditing, providerUuid, canSave });

  // ---- Ações "Desativar"/"Ativar" (095) -----------------------------------
  // Equivalentes às ações de linha da listagem (`Fornecedores/index.tsx`),
  // disparadas aqui a partir do cabeçalho do form em modo edição; o botão
  // alterna por `initialData.is_enabled`. Mesmas chaves de tradução da lista
  // (`text.list.actions.*`/`deactivateDialog`/`activateDialog`/toasts). NÃO
  // migra para o controller — ação exclusiva da página completa. Excluir fica
  // só na listagem.
  const {
    open: isOpenDeactivateDialog,
    onOpen: onOpenDeactivateDialog,
    onClose: onCloseDeactivateDialog,
  } = useDisclosure();

  const deactivateMutation = useRequest({
    asyncFunction: async () => {
      if (!providerUuid) return undefined;
      return await deactivateProvider(providerUuid);
    },
    queryKey: queryKey.cadastrosBase.providers,
    queryKey2: queryKey.cadastrosBase.provider,
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deactivatedToast,
    actionSuccess: () => {
      onCloseDeactivateDialog();
      // Disparado do detalhe — volta para a listagem, mesmo comportamento de
      // "Cancelar"/save-and-back.
      navigate(-1);
    },
  });

  const isDeactivating = deactivateMutation.isPending;

  function handleConfirmDeactivate() {
    deactivateMutation.mutate(undefined);
  }

  const {
    open: isOpenActivateDialog,
    onOpen: onOpenActivateDialog,
    onClose: onCloseActivateDialog,
  } = useDisclosure();

  const activateMutation = useRequest({
    asyncFunction: async () => {
      if (!providerUuid) return undefined;
      return await activateProvider(providerUuid);
    },
    queryKey: queryKey.cadastrosBase.providers,
    queryKey2: queryKey.cadastrosBase.provider,
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.activatedToast,
    actionSuccess: () => {
      onCloseActivateDialog();
      navigate(-1);
    },
  });

  const isActivating = activateMutation.isPending;

  function handleConfirmActivate() {
    activateMutation.mutate(undefined);
  }

  const isProviderEnabled = initialData?.is_enabled ?? true;

  return (
    <FormContainer
      title={isEditing ? text.form.title.edit : text.form.title.create}
      headerActions={
        canToggleStatus ? (
          isProviderEnabled ? (
            <Button
              title={text.list.actions.deactivate}
              icon={FiUserX as ElementType}
              variant="outline"
              size="sm"
              disabled={isDeactivating || controller.isSubmitting}
              onClick={onOpenDeactivateDialog}
            />
          ) : (
            <Button
              title={text.list.actions.activate}
              icon={FiUserCheck as ElementType}
              variant="outline"
              size="sm"
              disabled={isActivating || controller.isSubmitting}
              onClick={onOpenActivateDialog}
            />
          )
        ) : undefined
      }
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
              dirtyFields={controller.dirtyFields}
              type="button"
              onClick={controller.handleSubmit(controller.onSubmit)}
              languageGB={languageGB}
              loading={controller.isSubmitting}
              disabled={controller.isSubmitting}
            />
          )}
        </>
      }
    >
      <Form noPadding onSubmit={controller.handleSubmit(controller.onSubmit)}>
        <ProviderFormFields
          {...controller}
          canSave={canSave}
          tabIndex={tabIndex}
          onTabsChange={handleTabsChange}
        />
      </Form>

      <DeleteConfirmDialog
        isOpen={isOpenDeactivateDialog}
        onClose={onCloseDeactivateDialog}
        onConfirm={handleConfirmDeactivate}
        isLoading={isDeactivating}
        itemName={controller.watch('name')}
        title={text.list.deactivateDialog.title}
        description={text.list.deactivateDialog.description}
        warningText={text.list.deactivateDialog.warning}
        confirmButtonText={text.list.deactivateDialog.confirm}
        colorPalette="orange"
        tone="warning"
      />

      <DeleteConfirmDialog
        isOpen={isOpenActivateDialog}
        onClose={onCloseActivateDialog}
        onConfirm={handleConfirmActivate}
        isLoading={isActivating}
        itemName={controller.watch('name')}
        title={text.list.activateDialog.title}
        description={text.list.activateDialog.description}
        warningText={text.list.activateDialog.warning}
        confirmButtonText={text.list.activateDialog.confirm}
        colorPalette="green"
        tone="info"
      />
    </FormContainer>
  );
}
