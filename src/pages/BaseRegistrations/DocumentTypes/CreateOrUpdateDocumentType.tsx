// src/pages/BaseRegistrations/DocumentTypes/CreateOrUpdateDocumentType.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de TIPO DOCUMENTO (DocumentType) —
// Administrativo / Gestão Documentos (TASK-DT-FE-02). Rotas:
// /administrativo/tipos-documento/novo (criar raiz OU descendente, via
// `?parentUuid=` opcional) e /administrativo/tipos-documento/:documentTypeUuid
// (editar, GUID). Registradas em src/router/index.tsx, antes do catch-all.
//
// ⚠️ DIFERENÇA REAL vs. o sibling `AccountingGroupers/CreateOrUpdateAccountingGroupers.tsx`
// — NÃO copiar o bloqueio do combo "Antecessor" 1:1.
// `AccountingGrouper` BLOQUEIA o combo em edição/criar-descendente (o backend
// ignora `parent_uuid` no update, `AccountingGrouperRequest.php:24`).
// `DocumentType` é DIFERENTE: `DocumentTypeRequest::rules()` aceita
// `parent_uuid` tanto em `store` quanto em `update` — reparentar é uma
// operação VÁLIDA neste módulo (`GAP-DT-02`, decisão do dono: preservar
// fidelidade quanto ao `code` — que NÃO é recalculado ao reparentar — mas o
// campo em si É processado). Evidência: `[[DocumentType-contrato]] §6/§8`.
//
// Implementação exigida (3 fluxos, combo SEMPRE HABILITADO, SEM
// `isDisabled`/`isReadOnly` condicional por fluxo):
//   1) Criar RAIZ (`/novo`, sem `?parentUuid=`)      → combo vazio, habilitado.
//      Payload OMITE `parent_uuid` (não `null`) se nada for escolhido.
//   2) Criar DESCENDENTE (`/novo?parentUuid=<uuid>`) → combo pré-preenchido
//      com o pai fixo, mas AINDA habilitado — o usuário PODE trocar antes de
//      salvar (conveniência de navegação, não trava de negócio).
//   3) Editar (`/:documentTypeUuid`)                 → combo habilitado,
//      mostrando o pai ATUAL — usuário PODE reparentar. Payload de UPDATE
//      inclui `parent_uuid` SOMENTE se `dirtyFields.parent_uuid` (PATCH
//      parcial disciplinado, nunca reenvia o valor atual sem necessidade).
//
// Se este form copiasse o padrão de `AccountingGrouper` (combo sempre
// bloqueado em edição), o resultado seria uma REGRESSÃO DE FUNCIONALIDADE.
//
// Ordem dos campos — fidelidade ESTRITA ao Blade legado: name → order →
// is_enabled → parent (`_forms.blade.php`) — NÃO a ordem visual de
// `AccountingGroupers` (name/is_enabled/order).
//
// Guard de `onSubmit`/`fillForm` na forma EXPLÍCITA `Object.keys(dirtyFields)
// .length === 0` (checklist do dono) — NÃO `isEmpty` bare.
//
// `code` — somente leitura, bloco "Código gerado" SEMPRE visível (dica no
// create, valor real mono na edição) — molde quase 1:1 de
// `MotivosBaixa/CreateOrUpdateMotivoBaixa.tsx` (reproduzido aqui a partir do
// mesmo bloco já materializado em `AccountingGroupers/CreateOrUpdateAccountingGroupers.tsx`,
// que é o precedente estrutural mais próximo em código real hoje no
// repositório). Nunca calculado no cliente, nunca faz parte do payload.
// -----------------------------------------------------------------------------

import { useCallback, useEffect, useMemo } from 'react';

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

import { documentTypesSchemaResolver } from '@/validations/schemas/BaseRegistrations/documentTypes-schema';

import {
  createDocumentType,
  listDocumentTypeOptions,
  updateDocumentType,
} from '@/services/v2/DocumentTypes/document-type-service';

import type { Option } from '@/@types/option';
import type { PaginationQueryParams } from '@/@types/pagination';
import type { ResponsePagination } from '@/@types/response-api';
import type {
  DocumentTypeDetail,
  DocumentTypeForm as DocumentTypeFormType,
  DocumentTypeOption,
  DocumentTypePayload,
} from '@/@types/v2/DocumentTypes';

import {
  useDocumentTypeForm,
  useDocumentTypeOptions,
  useDocumentTypesList,
} from './useDocumentTypes';

interface ListDocumentTypeOptionsForSelectParams extends PaginationQueryParams {
  search?: string;
}

export default function CreateOrUpdateDocumentType() {
  const { documentTypeUuid } = useParams<{ documentTypeUuid: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.baseRegistrations.documentTypes;

  // É edição quando existe um GUID válido na rota ("novo" não casa com
  // `/:documentTypeUuid`). `?parentUuid=` só é relevante no modo criação
  // (rota `/novo`) — mesmo padrão de `AccountingGrouper`.
  const isEditing = isValidGuid(documentTypeUuid);
  const parentUuidParam = searchParams.get('parentUuid') ?? undefined;
  const isCreatingDescendant = !isEditing && isValidGuid(parentUuidParam);

  // Guard de navegação: um `documentTypeUuid` presente mas que NÃO é um GUID
  // válido não deve renderizar um form "fantasma" — redireciona para a
  // listagem (mesmo padrão de `AccountingGrouper`).
  useEffect(() => {
    if (documentTypeUuid && !isValidGuid(documentTypeUuid)) {
      navigate('/administrativo/tipos-documento', { replace: true });
    }
  }, [documentTypeUuid, navigate]);

  const canSave = isEditing ? can('document-types_edit') : can('document-types_create');

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, dirtyFields },
  } = useForm<DocumentTypeFormType>({
    mode: 'onChange',
    resolver: documentTypesSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      is_enabled: 'true',
      order: 1,
      // Criar descendente: já nasce com o pai fixo (ainda editável — ver
      // diferença REAL no cabeçalho do arquivo). Criar raiz/edição: `null`
      // até o servidor preencher (edição).
      parent_uuid: isCreatingDescendant ? (parentUuidParam ?? null) : null,
    },
  });

  // Guard EXPLÍCITA (checklist do dono) — `Object.keys(dirtyFields).length
  // === 0` (nunca `isEmpty` bare, ver nota de cabeçalho do arquivo).
  function fillForm(data: DocumentTypeDetail, resetForce?: boolean) {
    if (Object.keys(dirtyFields).length === 0 || resetForce) {
      reset({
        name: data.name,
        is_enabled: data.is_enabled ? 'true' : 'false',
        order: data.order,
        parent_uuid: data.parent_uuid,
      });
    }
  }

  const documentTypeQuery = useDocumentTypeForm({
    registrationId: isEditing ? documentTypeUuid : undefined,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([documentTypeQuery as any]);
  const documentTypeData = documentTypeQuery.data;

  // ---- Sugestão de `order` (DA-DT-07, `[[DocumentType-contrato-tela]] §6.1`) ----
  // Reaproveita a MESMA query da listagem (`useDocumentTypesList`) — SEM novo
  // fetch dedicado. Mirror do algoritmo legado: `max(order do mesmo nível)+1`,
  // ou `1` se nenhum irmão. Roda SÓ no CREATE e SÓ se o usuário ainda não
  // tiver editado `order` manualmente — nunca sobrescreve em modo edição
  // (fidelidade: legado não recalcula em `update()`).
  const documentTypesList = useDocumentTypesList();
  const watchedParentUuid = watch('parent_uuid');

  useEffect(() => {
    if (isEditing) return;
    if (dirtyFields.order) return;
    const siblings = (documentTypesList.data ?? []).filter(
      (item) => (item.parent_uuid ?? null) === (watchedParentUuid ?? null)
    );
    const nextOrder = siblings.length ? Math.max(...siblings.map((s) => s.order)) + 1 : 1;
    setValue('order', nextOrder, { shouldDirty: false });
  }, [watchedParentUuid, documentTypesList.data, isEditing]);

  // ---- Antecessor: lookup dedicado + rótulo do valor selecionado ----------
  // `exceptUuid` = o próprio nó SÓ em edição — em criação (raiz ou
  // descendente) não há `except`. O servidor já resolve a exclusão de
  // subárvore inteira (`GAP-DT-03`) — SEM filtro client-side de ciclo
  // (diferente de `AccountingGrouper`, que filtra o próprio nó no cliente por
  // falta de endpoint dedicado).
  const exceptUuid = isEditing ? documentTypeUuid : undefined;
  const documentTypeOptionsQuery = useDocumentTypeOptions(exceptUuid);

  // Rótulo (`código — nome`) do Antecessor ATUALMENTE selecionado — derivado
  // da mesma lista de opções já carregada por `useDocumentTypeOptions`
  // (contém o pai atual em edição, já que `except` só exclui a SUBÁRVORE do
  // próprio nó, nunca o seu ancestral). Sem round-trip extra de detalhe.
  const parentOption: Option<string> | null = useMemo(() => {
    if (!watchedParentUuid) return null;
    const found = documentTypeOptionsQuery.data?.find((o) => o.uuid === watchedParentUuid);
    return found ? { label: `${found.code} — ${found.name}`, value: found.uuid } : null;
  }, [watchedParentUuid, documentTypeOptionsQuery.data]);

  // Adaptador para `SelectAsyncPaginate` — mesma técnica de
  // `listPlanAccountOptions`/`listAccountingGroupersForParent`: endpoint
  // FLAT sem paginação/search reais no backend (`?except=` já resolve
  // exclusão de subárvore NO SERVIDOR), paginação e busca aplicadas
  // CLIENT-SIDE sobre o array já filtrado.
  const listDocumentTypeOptionsForSelect = useCallback(
    async (
      params: ListDocumentTypeOptionsForSelectParams
    ): Promise<ResponsePagination<DocumentTypeOption[]>> => {
      const all = await listDocumentTypeOptions({ except: exceptUuid });
      const filtered = params.search
        ? all.filter(
            (o) =>
              o.name.toLowerCase().includes(params.search!.toLowerCase()) ||
              o.code.toLowerCase().includes(params.search!.toLowerCase())
          )
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
    [exceptUuid]
  );

  const documentTypeMutation = useRequest({
    asyncFunction: tryPersistDocumentType,
    entityName: text.singularLabel,
    queryKey: queryKey.baseRegistrations.documentTypes.list,
    queryKey2: queryKey.baseRegistrations.documentTypes.detail,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  // Payload por fluxo — ver diferença REAL no cabeçalho do arquivo:
  // `parent_uuid` É processado em AMBOS create/update (diferente de
  // `AccountingGrouper`).
  async function tryPersistDocumentType(data: DocumentTypeFormType) {
    if (isEditing && documentTypeUuid) {
      const patch: DocumentTypePayload = {};
      if (dirtyFields.name) patch.name = data.name.trim();
      if (dirtyFields.is_enabled) patch.is_enabled = data.is_enabled === 'true';
      if (dirtyFields.order) patch.order = Number(data.order);
      // Reparenting É permitido neste módulo (GAP-DT-02) — só entra no PATCH
      // quando o usuário efetivamente tocou o combo.
      if (dirtyFields.parent_uuid) patch.parent_uuid = data.parent_uuid ?? null;
      return await updateDocumentType(documentTypeUuid, patch);
    }

    const payload: DocumentTypePayload = {
      name: data.name.trim(),
      is_enabled: data.is_enabled === 'true',
      order: Number(data.order),
    };
    // Omitido (não `null`) quando raiz sem pai escolhido — o `store` aceita
    // ausência = raiz.
    if (data.parent_uuid) payload.parent_uuid = data.parent_uuid;
    return await createDocumentType(payload);
  }

  // Guard de `onSubmit` — forma EXPLÍCITA pedida pelo checklist do dono.
  async function onSubmit(data: DocumentTypeFormType) {
    if (isEditing && Object.keys(dirtyFields).length === 0) {
      navigate(-1); // nada mudou -> só volta, sem chamar a API
      return;
    }
    await documentTypeMutation.mutateAsync(data);
  }

  const isSubmitting = documentTypeMutation.isPending;

  const enabledOptions: Option<string>[] = [
    { value: 'true', label: text.list.table.active },
    { value: 'false', label: text.list.table.inactive },
  ];

  const watchedName = watch('name') ?? '';

  // `code`: real em edição (vindo do backend), dica textual no create — NUNCA
  // um valor calculado no cliente (molde de `MotivosBaixa`/`AccountingGrouper`).
  const displayCode = isEditing ? documentTypeData?.code : text.form.hints.codeGenerated;

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
            valor real na edição) — molde quase 1:1 de MotivosBaixa/AccountingGrouper. */}
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

        {/* Ordem EXATA do Blade legado: name → order → is_enabled → parent
            (NÃO a ordem visual de AccountingGroupers). */}
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

          <Controller
            name="is_enabled"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <Select
                label={text.form.fields.isEnabled}
                name={name}
                value={enabledOptions.find((o) => o.value === value) ?? null}
                onChange={(opt: Option<string> | null) =>
                  onChange(opt?.value as DocumentTypeFormType['is_enabled'])
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
        </SimpleGrid>

        {/* Antecessor (full width) — SEMPRE HABILITADO nos 3 fluxos (ver
            diferença REAL no cabeçalho do arquivo): SEM `isDisabled`/
            `isReadOnly` condicional por fluxo. Reparenting é operação válida
            neste módulo, inclusive em edição. */}
        <Box mt={6}>
          <Controller
            name="parent_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.form.fields.parent}
                placeholder={text.form.parentPlaceholder.root}
                service={listDocumentTypeOptionsForSelect}
                mapOptions={(item: DocumentTypeOption) => ({
                  label: `${item.code} — ${item.name}`,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={parentOption}
                onChange={(option: any) => {
                  field.onChange(option?.value ?? null);
                }}
              />
            )}
          />
        </Box>
      </Form>
    </FormContainer>
  );
}
