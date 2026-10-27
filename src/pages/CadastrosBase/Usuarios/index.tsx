// src/pages/CadastrosBase/Usuarios/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de USUÁRIOS — TASK-FE-805, Execução 027, lote 2.
// Substitui o placeholder temporário do lote de fundação (TASK-FE-800..804).
//
// Rota: /cadastros-base/usuarios (registrada em TASK-FE-803 — este arquivo
// não mexe em rota/menu).
//
// Molde MECÂNICO obrigatório (instrução explícita do dev — PR #103/Vladimir):
// `Administrativo/Funcoes/index.tsx` (primário) + `CadastrosBase/Marcadores
// /index.tsx` (desempate) — grid paginado REAL de servidor (TableProvider +
// Table), HeaderTable + FilterSideUsuario (drawer com re-hidratação, Contrato
// B canônico), estados loading/empty(2 variantes)/error com retry.
//
// Contrato real da API (User-Frontend-Contrato.md §3.3 — NÃO a Doc Bruta
// legada 1:1): `GET /api/v1/users` devolve `uuid, name, email, photo,
// is_active, last_activity, roles: string[]` — SEM `online`, SEM
// `created_at`, SEM `phone`. As 3 colunas correspondentes da Doc Bruta legada
// (indicador online/offline, telefone/WhatsApp, data de criação) NÃO são
// reproduzidas aqui — bounded context/dado ausente, decisão já fechada no
// contrato, não reaberta nesta Tarefa.
//
// Paginação: `perPage ?? 10` (default do próprio `userPaginatedQuery` quando
// omitido, aqui explicitado). O backend responde 422 se `per_page > 100` —
// tratado na UI SEM passar `pageSizeOptions` customizado a `<Table>`: o
// default de `SelectPagination` já é `[5,10,25,50,100]` (teto 100, ver
// `Table.tsx`/`SelectPagination.tsx`), então o usuário nunca consegue montar
// uma requisição que estoure o limite do backend.
//
// Ações de linha (coluna "Ações", 5 itens): Visualizar (nova, F-206 — abre
// `UserViewDialog.tsx`, modal READ-ONLY, SEMPRE disponível, sem gate extra
// por item — a própria rota de listagem já exige `users_view`, mesmo padrão
// de `CentroCusto/index.tsx`/`Produtos/Catalogo/index.tsx`), Editar
// (`users_edit`), Ativar/Desativar (`users_edit`, handler de TASK-FE-808 —
// toggle `is_active`, SEPARADO de Excluir, NÃO tocado por esta rodada),
// Redefinir Senha (`users_change_password`, handler de TASK-FE-809, OCULTA na
// própria linha do usuário logado) e Excluir (`users_delete`, handler de
// TASK-FE-810, OCULTA na própria linha do usuário logado).
//
// ⚠️ F-206 (2026-09-01, PLANO-FIDELIDADE-VISUALIZAR-EXCLUIR, gate_humano
// APROVADO) — "Desativar conta" virou "Excluir": `DELETE /users/{uuid}`
// deixou de ser desativação segura e passou a ser HARD-DELETE FÍSICO REAL no
// backend (`DeleteUserAction` reescrita, decisão do dono, risco de FK/
// auditoria aceito após alerta de 80 constraints RESTRICT — ver §1 do plano).
// Mesmo endpoint/verbo, ZERO mudança de contrato de rota — só o rótulo, o
// copy do `DeleteConfirmDialog` (agora fala em exclusão PERMANENTE,
// "não pode ser desfeita") e o tratamento do novo 422 `UserInUseException`
// (usuário com vínculo operacional — a mensagem pública já vem pronta no
// envelope da API, exibida via `resolveMutationErrorMessage`, SEM
// mapeamento de campo/dialog dedicado — o plano §3.3 confirma que não há
// shape estruturado `errors.in_use` aqui, diferente de `FunctionInUseDialog`/
// `MarkerInUseDialog`).
//
// Self-row: comparação contra `useAuth().user?.uuid` — campo adicionado ao
// `AuthContext`/`User` nesta mesma entrega (ver `contexts/AuthContext
// /index.tsx`), pois o backend já devolvia `uuid` em `/auth/me` mas nenhum
// tipo de front o capturava (achado durante esta Tarefa; SEM MOCK impede
// inventar o dado, então a extensão do contexto foi o caminho honesto).
//
// Handlers de Ativar/Desativar/Redefinir Senha/Excluir — TASK-FE-808/809/810
// (lote 3b) + F-206 (renomeação/hard-delete). Os 3 usam `useMutation`
// DEDICADO (mesma razão documentada em `Funcoes/index.tsx`: o `onError`
// genérico do `useRequest` só lê `message`, nunca `errors`/erro de domínio) e
// compartilham 1 único `DeleteConfirmDialog` (estado `pendingAction`), cada
// um com tom/copy/rótulo próprios resolvidos por `resolveConfirmDialogConfig`:
//   - Ativar/Desativar (808): `PATCH /users/{uuid}/status`, tom `info`/verde
//     ao ativar, `warning`/laranja ao desativar. Gate: `users_edit`, SEM
//     exclusão de self-row (contrato não bloqueia auto-toggle). INALTERADO
//     por F-206 — continua uma ação DISTINTA de Excluir, convivem na mesma
//     linha.
//   - Redefinir Senha (809): `POST /users/{uuid}/reset-password`, sem corpo.
//     A senha NUNCA volta na resposta (`data: null`) — o toast de sucesso é
//     texto fixo i18n, nunca interpolando dado da resposta. Gate:
//     `users_change_password` E oculto na própria linha do usuário logado
//     (auto-reset é bloqueado com 403 no backend; o front espelha em defesa
//     de profundidade).
//   - Excluir (810, renomeado F-206): `DELETE /users/{uuid}` — HARD-DELETE
//     físico real (farms/roles/tokens/housekeeping limpos e a linha de
//     `users` apagada de verdade, dentro de transação no backend). Copy de
//     confirmação fala em exclusão PERMANENTE, "não pode ser desfeita" —
//     NUNCA mais "desativação". 422 `UserInUseException` (vínculo em tabela
//     RESTRICT de negócio) cai no `onError` genérico da mutation — mensagem
//     pública já apresentável, nada é alterado no backend (rollback). Gate:
//     `users_delete` E oculto na própria linha do usuário logado (guard de
//     front — o controller não confirma o mesmo 403 de auto-alvo documentado
//     para `status()`/`resetPassword()`, então esta é a única defesa até uma
//     rodada futura confirmar/corrigir o backend).
// -----------------------------------------------------------------------------

import { ElementType, useMemo, useState } from 'react';

import {
  Avatar,
  Badge,
  Box,
  Flex,
  HStack,
  Icon,
  Text,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { isAxiosError } from 'axios';
import { formatDistanceToNow, isValid, parseISO } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import { es } from 'date-fns/locale/es';
import { ptBR } from 'date-fns/locale/pt-BR';
import { FiEdit, FiEye, FiKey, FiTrash2, FiUserCheck, FiUserX, FiUsers } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';
import { toaster } from '@/components/ui/toaster';

import { TableProvider } from '@/contexts/TableContext';

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import { languageContextTypes } from '@/constants/languages';
import { queryKey } from '@/constants/query-key';

import { deleteUser, resetUserPassword, toggleUserActive } from '@/services/v2/Users/user-service';

import type { LanguageDate } from '@/@types/language';
import type { UserFilterForm, UserListItem } from '@/@types/v2/Users';

import { FilterSideUsuario } from './FilterSideUsuario';
import { HeaderTable } from './HeaderTable';
import { UserViewDialog } from './UserViewDialog';
import { useUsersList } from './useUsuario';

import { PageHeader } from '@/components/ui/PageHeader';

import { ListToolbar } from '@/components/ui/ListToolbar';
import { useListSearch } from '@/hooks/useListSearch';

// Companheiro display-only do `SelectAsyncPaginate` de `role_uuid` — nunca
// conta como filtro real na badge "Filtros(N)" (mesmo padrão de
// `cbo_uuid_label` em FilterSideFuncoes.tsx).
const DISPLAY_ONLY_FILTER_KEYS = ['role_uuid_label'];

// Mesmo fallback de mensagem de erro do `deleteMutation.onError` de
// `Funcoes/index.tsx` — extraído aqui para ser reaproveitado pelas 3
// mutations dedicadas desta tela (toggle/reset-password/deactivate).
function resolveMutationErrorMessage(error: unknown, languageGB: LanguageDate): string {
  let errorMessage = languageGB.common.errorLog.unknownError;
  if (isAxiosError(error)) {
    const statusCode = error.response?.status ?? null;
    const resData = error.response?.data as any;
    if (resData?.message) {
      const msg =
        typeof resData.message === 'string' ? resData.message : JSON.stringify(resData.message);
      errorMessage = `${statusCode} — ${msg}`;
    } else if (error.message) {
      errorMessage = error.message;
    }
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }
  return errorMessage;
}

// Estado da ação de linha pendente de confirmação — 1 único
// `DeleteConfirmDialog` reaproveitado pelas 3 ações (TASK-FE-808/809/810).
// `'delete-user'` — renomeado de `'deactivate-account'` (F-206): mesmo
// `DELETE /users/{uuid}`, semântica agora é hard-delete real.
type PendingUserAction =
  | { kind: 'toggle-active'; item: UserListItem }
  | { kind: 'reset-password'; item: UserListItem }
  | { kind: 'delete-user'; item: UserListItem };

// Locale do date-fns conforme idioma ativo — mesmo mapeamento de
// `languageContextTypes` (US/BR/ES), consumido pela coluna "Última
// atividade" (relativa) abaixo.
const dateFnsLocaleByLanguage = {
  [languageContextTypes.BR]: ptBR,
  [languageContextTypes.US]: enUS,
  [languageContextTypes.ES]: es,
};

export default function UsuariosList() {
  const { languageGB, languageInUse } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const { user: currentUser } = useAuth();
  const text = languageGB.users.user;

  const dateFnsLocale = dateFnsLocaleByLanguage[languageInUse ?? languageContextTypes.BR] ?? ptBR;

  const canCreate = can('users_create');
  const canEdit = can('users_edit');
  const canChangePassword = can('users_change_password');
  const canDelete = can('users_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: 'CadastrosBaseUsuarios' + queryKey.users.usersList,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<UserFilterForm>(defaultQueryOptions);
  const listSearch = useListSearch(paginatedQuery.filter, handleFilterChange);

  const queryClient = useQueryClient();

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.entries(paginatedQuery.filter ?? {}).filter(
        ([key, v]) =>
          !DISPLAY_ONLY_FILTER_KEYS.includes(key) && v !== undefined && v !== null && v !== ''
      ).length,
    [paginatedQuery.filter]
  );

  const usersList = useUsersList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  // ---- Ação "Visualizar" (F-206, modal READ-ONLY) --------------------------
  // Guarda só o `uuid` da linha escolhida — `UserViewDialog` resolve os dados
  // via `getUser` (mesma queryKey do formulário de edição, cache
  // compartilhado). SEM gate de permissão por item: a rota já exige
  // `users_view` (mesmo padrão de `CentroCusto/index.tsx`).
  const { open: isViewOpen, onOpen: onOpenView, onClose: onCloseView } = useDisclosure();
  const [viewUserUuid, setViewUserUuid] = useState<string | null>(null);

  function handleOpenView(userItem: UserListItem) {
    setViewUserUuid(userItem.uuid);
    onOpenView();
  }

  function handleCloseView() {
    onCloseView();
    setViewUserUuid(null);
  }

  // ---- Ações de linha (TASK-FE-808/809/810) --------------------------------
  // 1 único diálogo de confirmação reaproveitado pelas 3 ações — estado
  // `pendingAction` guarda QUAL ação + em QUAL linha; `resolveConfirmDialogConfig`
  // (abaixo) resolve tom/copy/rótulo conforme `pendingAction.kind`.
  const [pendingAction, setPendingAction] = useState<PendingUserAction | null>(null);
  const { open: isConfirmOpen, onOpen: onOpenConfirm, onClose: onCloseConfirm } = useDisclosure();

  const handleCloseConfirm = () => {
    onCloseConfirm();
    setPendingAction(null);
  };

  // ⚠️ NÃO usa `useRequest` aqui — mesma razão documentada em
  // `Funcoes/index.tsx`: o `onError` genérico só lê `message`, nunca
  // `errors`/erro de domínio.
  const toggleActiveMutation = useMutation({
    mutationFn: ({ uuid, nextIsActive }: { uuid: string; nextIsActive: boolean }) =>
      toggleUserActive(uuid, nextIsActive),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [queryKey.users.usersList] });
      toaster.success({
        title: text.singularLabel,
        description: variables.nextIsActive
          ? text.actions.activateSuccess
          : text.actions.deactivateSuccess,
        duration: 7000,
      });
      handleCloseConfirm();
    },
    onError: (error) => {
      console.error('User toggle-active - error:', error);
      toaster.error({
        title: text.singularLabel,
        description: resolveMutationErrorMessage(error, languageGB),
        duration: 7000,
      });
    },
  });

  // Sem corpo de resposta relevante (`data: null`, contrato §1.4) — a senha
  // NUNCA volta aqui. Nenhuma invalidação de listagem: a ação não muda
  // nenhum campo exibido na grid.
  const resetPasswordMutation = useMutation({
    mutationFn: (uuid: string) => resetUserPassword(uuid),
    onSuccess: () => {
      toaster.success({
        title: text.singularLabel,
        description: text.actions.resetPasswordSuccess,
        duration: 7000,
      });
      handleCloseConfirm();
    },
    onError: (error) => {
      console.error('User reset-password - error:', error);
      toaster.error({
        title: text.singularLabel,
        description: resolveMutationErrorMessage(error, languageGB),
        duration: 7000,
      });
    },
  });

  // `DELETE /users/{uuid}` = HARD-DELETE físico real (F-206 — ver nota de
  // cabeçalho do arquivo). 422 `UserInUseException` (usuário com vínculo
  // operacional) cai no `onError` genérico abaixo — `resolveMutationErrorMessage`
  // já extrai a mensagem pública do envelope, apresentável sem tratamento
  // adicional (plano §3.3: shape simples, sem `errors.in_use` estruturado).
  const deleteUserMutation = useMutation({
    mutationFn: (uuid: string) => deleteUser(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey.users.usersList] });
      toaster.success({
        title: text.singularLabel,
        description: text.actions.deleteUserSuccess,
        duration: 7000,
      });
      handleCloseConfirm();
    },
    onError: (error) => {
      console.error('User delete - error:', error);
      toaster.error({
        title: text.singularLabel,
        description: resolveMutationErrorMessage(error, languageGB),
        duration: 7000,
      });
    },
  });

  const isConfirmLoading =
    toggleActiveMutation.isPending ||
    resetPasswordMutation.isPending ||
    deleteUserMutation.isPending;

  function handleToggleActive(userItem: UserListItem) {
    setPendingAction({ kind: 'toggle-active', item: userItem });
    onOpenConfirm();
  }

  function handleResetPassword(userItem: UserListItem) {
    setPendingAction({ kind: 'reset-password', item: userItem });
    onOpenConfirm();
  }

  function handleDeleteUser(userItem: UserListItem) {
    setPendingAction({ kind: 'delete-user', item: userItem });
    onOpenConfirm();
  }

  // Resolve tom/copy/rótulo/ação do `DeleteConfirmDialog` conforme a ação
  // pendente — cada `kind` usa os textos JÁ fechados no contrato
  // (`languageUsers.ts` §actions), nenhum texto novo inventado aqui.
  const confirmDialogConfig = useMemo(() => {
    if (!pendingAction) return null;

    switch (pendingAction.kind) {
      case 'toggle-active': {
        const willActivate = !pendingAction.item.is_active;
        return {
          tone: willActivate ? ('info' as const) : ('warning' as const),
          colorPalette: willActivate ? 'green' : 'orange',
          title: willActivate
            ? text.actions.activateConfirmTitle
            : text.actions.deactivateConfirmTitle,
          description: willActivate
            ? text.actions.activateConfirmDescription
            : text.actions.deactivateConfirmDescription,
          confirmButtonText: willActivate ? text.actions.activate : text.actions.deactivate,
          onConfirm: () =>
            toggleActiveMutation.mutate({
              uuid: pendingAction.item.uuid,
              nextIsActive: willActivate,
            }),
        };
      }
      case 'reset-password':
        return {
          tone: 'warning' as const,
          colorPalette: 'orange',
          title: text.actions.resetPasswordConfirmTitle,
          description: text.actions.resetPasswordConfirmDescription,
          confirmButtonText: text.actions.resetPassword,
          onConfirm: () => resetPasswordMutation.mutate(pendingAction.item.uuid),
        };
      case 'delete-user':
        return {
          tone: 'danger' as const,
          colorPalette: 'red',
          title: text.actions.deleteUserConfirmTitle,
          description: text.actions.deleteUserConfirmDescription,
          confirmButtonText: text.actions.deleteUser,
          onConfirm: () => deleteUserMutation.mutate(pendingAction.item.uuid),
        };
      default:
        return null;
    }
  }, [pendingAction, text, toggleActiveMutation, resetPasswordMutation, deleteUserMutation]);

  const columnHelper = createColumnHelper<UserListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: text.list.table.name,
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.name}
          </Text>
        ),
      }),
      columnHelper.accessor('email', {
        header: text.list.table.email,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.email}
          </Text>
        ),
      }),
      columnHelper.display({
        id: 'role',
        header: text.list.table.role,
        cell: ({ row }) => {
          const roles = row.original.roles ?? [];
          const primaryRole = roles[0] ?? null;
          const extraCount = roles.length > 1 ? roles.length - 1 : 0;

          return (
            <HStack gap={2}>
              <Text fontSize="sm" lineClamp="1">
                {primaryRole ?? '-'}
              </Text>
              {extraCount > 0 && (
                <Badge colorPalette="gray" variant="subtle">
                  {text.list.table.roleMore.replace('{count}', String(extraCount))}
                </Badge>
              )}
            </HStack>
          );
        },
      }),
      columnHelper.accessor('is_active', {
        header: text.list.table.status,
        cell: ({ row }) => (
          <Badge
            colorPalette={row.original.is_active ? 'green' : 'gray'}
            variant="subtle"
            py={1}
            px={3}
          >
            {row.original.is_active ? text.list.table.statusActive : text.list.table.statusInactive}
          </Badge>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.display({
        id: 'last_activity',
        header: text.list.table.lastActivity,
        cell: ({ row }) => {
          const lastActivity = row.original.last_activity;
          if (!lastActivity) {
            return (
              <Text fontSize="sm" color="fg.muted">
                -
              </Text>
            );
          }

          const parsedDate = parseISO(lastActivity);
          if (!isValid(parsedDate)) {
            return (
              <Text fontSize="sm" color="fg.muted">
                -
              </Text>
            );
          }

          return (
            <VStack align="flex-start" gap={0}>
              <Text fontSize="sm" lineClamp="1">
                {formatDistanceToNow(parsedDate, { addSuffix: true, locale: dateFnsLocale })}
              </Text>
              <Text fontSize="xs" color="fg.muted">
                {formatDate(parsedDate, 'dd/MM/yyyy HH:mm')}
              </Text>
            </VStack>
          );
        },
        meta: styleColumTable.date,
      }),
      columnHelper.display({
        id: 'photo',
        header: text.list.table.photo,
        cell: ({ row }) => (
          <Avatar.Root size="sm">
            <Avatar.Fallback name={row.original.name} />
            {row.original.photo_url && <Avatar.Image src={row.original.photo_url} />}
          </Avatar.Root>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        cell: ({ row }) => {
          const isSelf = !!currentUser?.uuid && currentUser.uuid === row.original.uuid;

          return (
            <Flex justify="flex-end">
              <Actions size="sm">
                {/* F-206 — "Visualizar" nova, SEMPRE disponível (sem gate por
                    item, mesmo padrão de `CentroCusto/index.tsx`), 1º item. */}
                <Actions.Item
                  icon={<Icon as={FiEye} />}
                  onClick={() => handleOpenView(row.original)}
                >
                  {text.list.actions.view}
                </Actions.Item>
                {canEdit && (
                  <Actions.Item
                    icon={<Icon as={FiEdit} />}
                    onClick={() => navigate(`/cadastros-base/usuarios/${row.original.uuid}`)}
                  >
                    {text.list.actions.edit}
                  </Actions.Item>
                )}
                {canEdit && (
                  <Actions.Item
                    icon={<Icon as={row.original.is_active ? FiUserX : FiUserCheck} />}
                    onClick={() => handleToggleActive(row.original)}
                    disabled={toggleActiveMutation.isPending}
                  >
                    {row.original.is_active ? text.actions.deactivate : text.actions.activate}
                  </Actions.Item>
                )}
                {canChangePassword && !isSelf && (
                  <Actions.Item
                    icon={<Icon as={FiKey} />}
                    onClick={() => handleResetPassword(row.original)}
                    disabled={resetPasswordMutation.isPending}
                  >
                    {text.actions.resetPassword}
                  </Actions.Item>
                )}
                {canDelete && !isSelf && (
                  <>
                    <Actions.Separator />
                    {/* F-206 — renomeado de "Desativar conta": hard-delete
                        real, `tone="danger"` (token semântico
                        `feedBack.errorMain`, NUNCA `color="red.400"`
                        hardcoded — ver `get_pwa_ui_components_pattern`,
                        `Action.tsx::ActionsItemProps.tone`). */}
                    <Actions.Item
                      icon={<Icon as={FiTrash2} />}
                      onClick={() => handleDeleteUser(row.original)}
                      tone="danger"
                      disabled={deleteUserMutation.isPending}
                    >
                      {text.actions.deleteUser}
                    </Actions.Item>
                  </>
                )}
              </Actions>
            </Flex>
          );
        },
        meta: styleColumTable.sm,
      }),
    ],
    [
      navigate,
      text,
      canEdit,
      canChangePassword,
      canDelete,
      currentUser?.uuid,
      dateFnsLocale,
      toggleActiveMutation.isPending,
      resetPasswordMutation.isPending,
      deleteUserMutation.isPending,
    ]
  );

  const isLoading = checkLoadingStatus([usersList]);
  const items = usersList.data?.data?.items;
  const isEmpty = !isLoading && (items?.length ?? 0) === 0;

  return (
    <ContainerGrid>
      <TableProvider
        data={items}
        columns={defaultColumns}
        pagination={paginatedQuery}
        setPagination={handlePaginatedQuery}
        enableMultiRowSelection={false}
      >
        <HeaderGrid
          header={
            <HeaderTable
              onOpenFilter={onOpenFilter}
              filtersApplied={filtersApplied}
              languageGB={languageGB}
            />
          }
        >
          <PageHeader title={text.list.pageTitle} description={text.list.pageSubtitle} />
        </HeaderGrid>

        <ListToolbar
          search={listSearch.value}
          onSearch={listSearch.onChange}
          searchPlaceholder={languageGB.defaltStrings.searchList}
          onOpenFilter={onOpenFilter}
          filtersApplied={filtersApplied - (paginatedQuery.filter?.search ? 1 : 0)}
        />

        <Box>
          <Table
            isLoading={isLoading}
            isError={usersList.isError}
            error={usersList.error}
            isEmpty={isEmpty}
            onRetry={() => usersList.refetch()}
            isRetrying={usersList.isFetching}
            retryLabel={text.list.error.retry}
            emptyIcon={FiUsers as ElementType}
            emptyTitle={
              filtersApplied > 0
                ? text.list.emptyState.titleFiltered
                : text.list.emptyState.titleEmpty
            }
            emptyDescription={
              filtersApplied > 0
                ? text.list.emptyState.descriptionFiltered
                : text.list.emptyState.descriptionEmpty
            }
            canCreate={filtersApplied === 0 && canCreate}
            createLabel={text.list.emptyState.cta}
            onCreate={() => navigate('/cadastros-base/usuarios/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideUsuario
        isOpen={isFilterOpen}
        onClose={onCloseFilter}
        handleFilterChange={handleFilterChange}
        handleReset={handleResetFilter}
        filter={paginatedQuery.filter}
        languageGB={languageGB}
      />

      {/* F-206 — modal READ-ONLY "Visualizar", reusa `GET /users/{uuid}`. */}
      <UserViewDialog
        isOpen={isViewOpen}
        onClose={handleCloseView}
        uuid={viewUserUuid}
        languageGB={languageGB}
      />

      {/* Diálogo único reaproveitado pelas 3 ações de linha (TASK-FE-808/
          809/810) — copy/tom/rótulo resolvidos por `confirmDialogConfig`
          conforme `pendingAction.kind`. */}
      <DeleteConfirmDialog
        isOpen={isConfirmOpen}
        onClose={handleCloseConfirm}
        onConfirm={() => confirmDialogConfig?.onConfirm()}
        isLoading={isConfirmLoading}
        title={confirmDialogConfig?.title}
        description={confirmDialogConfig?.description}
        confirmButtonText={confirmDialogConfig?.confirmButtonText}
        colorPalette={confirmDialogConfig?.colorPalette}
        tone={confirmDialogConfig?.tone}
        hideQuestionMark
      />
    </ContainerGrid>
  );
}
