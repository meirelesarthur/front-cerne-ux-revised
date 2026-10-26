// src/pages/BaseRegistrations/AccountingGroupers/CreateOrUpdateAccountingGroupers.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de AGRUPADOR CONTÁBIL (AccountingGrouper) —
// Cadastros Base / Financeiros (TASK-ACG-02). Rotas:
// /cadastros-base/agrupadores-contabeis/novo (criar raiz OU descendente, via
// `?parentUuid=` opcional) e /cadastros-base/agrupadores-contabeis/:accountingGrouperUuid
// (editar, GUID). Registradas em src/router/index.tsx, antes do catch-all.
//
// ⚠️ PARTICULARIDADE DE ALTO RISCO — NÃO copiar o combo "Antecessor" de
// `Agrupadores/CreateOrUpdateAgrupador.tsx` (Grouper, estoque) 1:1.
// `Grouper` permite reparenting REAL no update (combo HABILITADO em edição).
// `AccountingGrouper` NÃO suporta isso — evidência dupla:
//   - `AccountingGrouperRequest.php:24`: "parent_uuid só é usado no store; no
//     update é ignorado pelo repositório".
//   - `UpdateAccountingGrouperAction.php:23-28`: nunca toca `parent_id`.
//     Confirmado pelo teste `'does not change code or parent on update'`.
// Se este form copiasse o padrão de `Grouper` (combo habilitado em edição,
// enviando `parent_uuid` no PUT), o resultado seria um BUG SILENCIOSO: o
// backend aceita a chamada (sem erro) e simplesmente ignora o campo — o nó
// continua exatamente onde estava.
//
// Assimetria REAL implementada (3 fluxos):
//   1) Criar RAIZ (`/novo`, sem `?parentUuid=`)      → combo HABILITADO,
//      vazio; payload OMITE `parent_uuid` se nada for escolhido.
//   2) Criar DESCENDENTE (`/novo?parentUuid=<uuid>`) → combo BLOQUEADO,
//      pré-preenchido com o pai fixo; payload SEMPRE inclui `parent_uuid`.
//   3) Editar (`/:accountingGrouperUuid`)            → combo SEMPRE
//      BLOQUEADO/read-only (mostra o pai ATUAL só para contexto — nunca
//      editável); payload de UPDATE NUNCA inclui `parent_uuid`, em NENHUMA
//      circunstância (o backend não processa a chave nesse verbo).
//
// Guard de `onSubmit`/`fillForm` na forma EXPLÍCITA `Object.keys(dirtyFields)
// .length === 0` (checklist do dono) — NÃO `isEmpty` bare (`src/utils/isEmpty.ts`
// tem nome invertido: `isEmpty(obj)` retorna `true` quando `obj` TEM chaves).
//
// `code` — somente leitura, bloco "Código gerado" SEMPRE visível (dica no
// create, valor real mono na edição) — molde quase 1:1 de
// `MotivosBaixa/CreateOrUpdateMotivoBaixa.tsx`. Nunca calculado no cliente,
// nunca faz parte do payload.
// -----------------------------------------------------------------------------

import { useCallback, useEffect, useState } from 'react';

import { Box, Flex, Skeleton, SimpleGrid, Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import {
  createAccountingGrouper,
  listAccountingGroupers,
  updateAccountingGrouper,
} from '@/services/v2/AccountingGroupers/accounting-grouper-service';

import type { Option } from '@/@types/option';
import type { PaginationQueryParams } from '@/@types/pagination';
import type { ResponsePagination } from '@/@types/response-api';
import type {
  AccountingGrouperDetail,
  AccountingGrouperForm as AccountingGrouperFormType,
  AccountingGrouperListItem,
  AccountingGrouperPayload,
} from '@/@types/v2/AccountingGroupers';

import { accountingGrouperSchemaResolver } from '@/validations/schemas/BaseRegistrations/accountingGroupers-schema';

import { useAccountingGrouperForm } from './useAccountingGroupers';

interface ListAccountingGroupersForSelectParams extends PaginationQueryParams {
  search?: string;
}

export default function CreateOrUpdateAccountingGroupers() {
  const { accountingGrouperUuid } = useParams<{ accountingGrouperUuid: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.baseRegistrations.accountingGroupers;

  // É edição quando existe um GUID válido na rota ("novo" não casa com
  // `/:accountingGrouperUuid`). `?parentUuid=` só é relevante no modo
  // criação (rota `/novo`).
  const isEditing = isValidGuid(accountingGrouperUuid);
  const parentUuidParam = searchParams.get('parentUuid') ?? undefined;
  const isCreatingDescendant = !isEditing && isValidGuid(parentUuidParam);

  // Guard de navegação: um `accountingGrouperUuid` presente mas que NÃO é um
  // GUID válido não deve renderizar um form "fantasma" — redireciona para a
  // listagem (mesmo padrão de `Grouper`/`GruposProduto`).
  useEffect(() => {
    if (accountingGrouperUuid && !isValidGuid(accountingGrouperUuid)) {
      navigate('/cadastros-base/agrupadores-contabeis', { replace: true });
    }
  }, [accountingGrouperUuid, navigate]);

  const canSave = isEditing ? can('accounting_groupers_edit') : can('accounting_groupers_create');

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<AccountingGrouperFormType>({
    mode: 'onChange',
    resolver: accountingGrouperSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      is_enabled: 'true',
      order: 1,
      // Criar descendente: já nasce com o pai fixo (bloqueado). Criar
      // raiz/edição: `null` até o servidor preencher (edição).
      parent_uuid: isCreatingDescendant ? (parentUuidParam ?? null) : null,
    },
  });

  // ---- Preview do Antecessor (rótulo `código — nome` para o combo) --------
  // Reaproveita o MESMO hook `useAccountingGrouperForm` para buscar o
  // registro do PAI — tanto no modo "criar descendente" (pai fixo da query
  // string) quanto no modo edição (pai atual do registro). Mesmo racional de
  // `fillParentPreview` em `CreateOrUpdateAgrupador.tsx` (Grouper).
  const [parentPreviewUuid, setParentPreviewUuid] = useState<string | undefined>(
    isCreatingDescendant ? parentUuidParam : undefined
  );
  const [parentOption, setParentOption] = useState<Option<string> | null>(null);

  function fillParentPreview(data: AccountingGrouperDetail) {
    // Guarda: se o usuário já tocou o combo nesta sessão (só possível no modo
    // criar-raiz — único fluxo com o combo habilitado), um preview atrasado
    // (corrida de query) NUNCA sobrescreve a escolha do usuário.
    if (!dirtyFields.parent_uuid) {
      setParentOption({ label: `${data.code} — ${data.name}`, value: data.uuid });
    }
  }

  useAccountingGrouperForm({
    registrationId: parentPreviewUuid,
    fillForm: fillParentPreview,
  });

  // Guard EXPLÍCITA (checklist do dono) — `Object.keys(dirtyFields).length
  // === 0` (nunca `isEmpty` bare, ver nota de cabeçalho do arquivo).
  function fillForm(data: AccountingGrouperDetail, resetForce?: boolean) {
    if (Object.keys(dirtyFields).length === 0 || resetForce) {
      reset({
        name: data.name,
        is_enabled: data.is_enabled ? 'true' : 'false',
        order: data.order,
        parent_uuid: data.parent_uuid,
      });
      // Dispara a busca de preview do Antecessor ATUAL (rótulo) — só define
      // uma vez (idempotente).
      if (data.parent_uuid) {
        setParentPreviewUuid((prev) => prev ?? (data.parent_uuid as string));
      }
    }
  }

  const accountingGrouperQuery = useAccountingGrouperForm({
    registrationId: isEditing ? accountingGrouperUuid : undefined,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([accountingGrouperQuery as any]);
  const accountingGrouperData = accountingGrouperQuery.data;

  // Busca de agrupadores contábeis p/ o combo Antecessor. `listAccountingGroupers`
  // (service) NÃO pagina — devolve o array completo. Este adaptador constrói
  // o shape `ResponsePagination` exigido pelo `service` do `SelectAsyncPaginate`
  // (paginação CLIENT-SIDE sobre o array já carregado — dataset pequeno,
  // catálogo financeiro; não é mock, é o mesmo dado real da API, só
  // paginado no cliente para caber no contrato do componente). Filtro
  // client-side ÓBVIO em edição: exclui o PRÓPRIO nó da lista de opções (não
  // pode ser Antecessor de si mesmo) — validação de ciclo é 100% do backend
  // (que aqui não impõe limite de profundidade, diferente de `Grouper`).
  const listAccountingGroupersForParent = useCallback(
    async (
      params: ListAccountingGroupersForSelectParams
    ): Promise<ResponsePagination<AccountingGrouperListItem[]>> => {
      const all = await listAccountingGroupers({ search: params.search });
      const filtered =
        isEditing && accountingGrouperUuid
          ? all.filter((item) => item.uuid !== accountingGrouperUuid)
          : all;

      const perPage = params.per_page ?? filtered.length ?? 1;
      const page = params.page ?? 1;
      const start = (page - 1) * perPage;
      const pageItems = filtered.slice(start, start + perPage);

      return {
        success: true,
        data: {
          items: pageItems,
          pagination: {
            total: filtered.length,
            count: pageItems.length,
            per_page: perPage,
            current_page: page,
            total_pages: Math.max(1, Math.ceil(filtered.length / perPage)),
          },
        },
      };
    },
    [isEditing, accountingGrouperUuid]
  );

  const accountingGrouperMutation = useRequest({
    asyncFunction: tryPersistAccountingGrouper,
    entityName: text.singularLabel,
    queryKey: queryKey.baseRegistrations.accountingGroupers.list,
    queryKey2: queryKey.baseRegistrations.accountingGroupers.detail,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  // Ver nota de cabeçalho do arquivo — ESTE é o ponto de maior risco de bug
  // da Tarefa: `parent_uuid` NUNCA entra no payload de UPDATE, em NENHUMA
  // circunstância.
  async function tryPersistAccountingGrouper(data: AccountingGrouperFormType) {
    const payload: AccountingGrouperPayload = {
      name: data.name.trim(),
      is_enabled: data.is_enabled === 'true',
      order: Number(data.order),
    };

    if (isEditing && accountingGrouperUuid) {
      // `parent_uuid` NUNCA é atribuído aqui — o backend ignora a chave
      // nesse verbo (`AccountingGrouperRequest.php:24`,
      // `UpdateAccountingGrouperAction.php:23-28`). `code` também nunca
      // entra — somente leitura, gerado pelo servidor.
      return await updateAccountingGrouper(accountingGrouperUuid, payload);
    }

    // CRIAÇÃO: descendente → inclui `parent_uuid` fixo da query string;
    // raiz → chave OMITIDA quando nenhum pai foi escolhido no combo
    // habilitado (não `null` — o `store` aceita ausência = raiz).
    if (data.parent_uuid) {
      payload.parent_uuid = data.parent_uuid;
    }
    return await createAccountingGrouper(payload);
  }

  // Guard de `onSubmit` — forma EXPLÍCITA pedida pelo checklist do dono (ver
  // nota de cabeçalho do arquivo).
  async function onSubmit(data: AccountingGrouperFormType) {
    if (isEditing && Object.keys(dirtyFields).length === 0) {
      navigate(-1); // nada mudou -> só volta, sem chamar a API
      return;
    }
    await accountingGrouperMutation.mutateAsync(data); // create sempre salva; edição com alteração real salva
  }

  const isSubmitting = accountingGrouperMutation.isPending;

  const enabledOptions: Option<string>[] = [
    { value: 'true', label: text.list.table.active },
    { value: 'false', label: text.list.table.inactive },
  ];

  const watchedName = watch('name') ?? '';

  // `code`: real em edição (vindo do backend), dica textual no create —
  // NUNCA um valor calculado no cliente (molde de `MotivosBaixa`).
  const displayCode = isEditing ? accountingGrouperData?.code : text.form.hints.codeGenerated;

  // Antecessor HABILITADO só em criar-raiz; BLOQUEADO em criar-descendente
  // (pré-preenchido) e SEMPRE em edição (mostra o pai atual, só contexto).
  const isParentDisabled = isEditing || isCreatingDescendant || !canSave;
  const isParentReadOnly = isEditing || isCreatingDescendant;

  return (
    <FormContainer
      title={
        isEditing
          ? text.form.title.edit
          : isCreatingDescendant
            ? text.form.title.createChild
            : text.form.title.create
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
        {/* Código gerado — somente leitura, SEMPRE visível (dica no create,
            valor real na edição) — molde quase 1:1 de MotivosBaixa. */}
        <Box
          bg="bg.muted"
          border="1px solid"
          borderColor="border.subtle"
          borderRadius="lg"
          px={4}
          py={3}
          mb={6}
        >
          <Skeleton loading={isLoading} borderRadius="md">
            <Flex align="center" gap={3}>
              <Text
                fontSize="xs"
                fontWeight="semibold"
                color="fg.muted"
                textTransform="uppercase"
                letterSpacing="wide"
              >
                {text.form.fields.code}
              </Text>
              <Text
                fontSize="md"
                fontWeight={isEditing ? 'bold' : 'normal'}
                fontFamily={isEditing ? 'mono' : undefined}
                color={isEditing ? undefined : 'fg.muted'}
              >
                {displayCode}
              </Text>
            </Flex>
          </Skeleton>
        </Box>

        <SimpleGrid columns={columnsForm.default} gap={6}>
          <Input
            label={text.form.fields.name}
            placeholder={text.form.placeholders.name}
            helperText={errors.name?.message ? undefined : `${watchedName.length}/60`}
            {...register('name')}
            error={errors.name?.message}
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
                value={enabledOptions.find((o) => o.value === value) ?? null}
                onChange={(opt: Option<string> | null) =>
                  onChange(opt?.value as AccountingGrouperFormType['is_enabled'])
                }
                options={enabledOptions}
                error={error?.message}
                isRequired
                noClearable
                isDisabled={!canSave}
                loading={isLoading}
              />
            )}
          />

          <Controller
            name="order"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <NumberInput
                name={name}
                label={text.form.fields.order}
                value={value ?? null}
                onValueChange={(val) => onChange(val)}
                min={1}
                allowDot={false}
                error={error?.message}
                isRequired
                disabled={!canSave || isLoading}
              />
            )}
          />
        </SimpleGrid>

        {/* Antecessor (full width) — ver assimetria na nota de cabeçalho do
            arquivo: HABILITADO só em criar-raiz. */}
        <Box mt={6}>
          <Controller
            name="parent_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.form.fields.parent}
                placeholder={text.form.parentPlaceholder.root}
                service={listAccountingGroupersForParent}
                mapOptions={(item: AccountingGrouperListItem) => ({
                  label: `${item.code} — ${item.name}`,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={parentOption}
                onChange={(option: any) => {
                  field.onChange(option?.value ?? null);
                  setParentOption(option ?? null);
                }}
                isDisabled={isParentDisabled}
                isReadOnly={isParentReadOnly}
              />
            )}
          />
        </Box>
      </Form>
    </FormContainer>
  );
}
