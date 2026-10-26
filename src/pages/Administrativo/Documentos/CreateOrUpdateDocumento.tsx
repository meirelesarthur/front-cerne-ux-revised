// src/pages/Administrativo/Documentos/CreateOrUpdateDocumento.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de DOCUMENTO (DocumentManagement) —
// Administrativo / Gestão Documentos, Tarefa 13. Rotas:
// /administrativo/documentos/novo e /administrativo/documentos/:documentUuid
// (editar, GUID). Registradas em src/router/index.tsx, antes do catch-all.
//
// Mirror ESTRUTURAL de `BaseRegistrations/DocumentTypes/CreateOrUpdateDocumentType.tsx`
// (casca single-page: `FormContainer` + bloco "Código gerado" SEMPRE visível
// + `SimpleGrid` de campos), SEM `Tabs.Root` — Documentos tem só 2 seções
// (dados + anexos), cabem numa página só, com a seção de anexos
// (`DocumentoAnexosSection`) ao final, fora de `Tabs.Content` (Equipment usa
// abas porque tem 5 seções; aqui não há necessidade).
//
// Multipart SEMPRE (por causa de `attachments[].file`), mesmo quando só
// campos de texto mudam — mirror `updateEquipment`, method-spoofing
// `POST + _method=PUT` no update (nunca `api.V2.put()` direto com
// `FormData`). Payload SEMPRE completo (`DocumentManagementRequest` não
// distingue create/update).
// -----------------------------------------------------------------------------

import { useCallback, useEffect } from 'react';

import { Box, Flex, Skeleton, SimpleGrid, Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { Field } from '@/components/Form/Field';
import { Input } from '@/components/Form/Input';
import { NumberInput } from '@/components/Form/NumberInput';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { Textarea } from '@/components/Form/Textarea';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import documentManagementSchemaResolver from '@/validations/schemas/Documentos/document-management-schema';

import {
  createDocumentManagement,
  updateDocumentManagement,
} from '@/services/v2/Documentos/document-management-service';
import { listDocumentTypeOptions } from '@/services/v2/DocumentTypes/document-type-service';

import type { Option } from '@/@types/option';
import type { PaginationQueryParams } from '@/@types/pagination';
import type { ResponsePagination } from '@/@types/response-api';
import type {
  DocumentManagementData,
  DocumentManagementForm as DocumentManagementFormType,
  DocumentManagementPayload,
} from '@/@types/v2/Documentos';
import type { DocumentTypeOption } from '@/@types/v2/DocumentTypes';

import { DocumentoAnexosSection } from './DocumentoAnexosSection';
import { useDocumentManagementForm } from './useDocumentManagements';

interface ListDocumentTypeOptionsForFormParams extends PaginationQueryParams {
  search?: string;
}

export default function CreateOrUpdateDocumento() {
  const { documentUuid } = useParams<{ documentUuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const [searchParams] = useSearchParams();

  // `?mode=view` força modo leitura mesmo para quem tem
  // `document-managements_edit` — ação "Visualizar" da listagem (index.tsx)
  // navega com esse param. Sem o param (ou `?mode=edit`), o formulário abre
  // no modo normal (edição, se `canEdit`).
  const isForcedViewMode = searchParams.get('mode') === 'view';

  const text = languageGB.baseRegistrations.documentManagements;

  // É edição quando existe um GUID válido na rota ("novo" não casa com
  // `/:documentUuid`) — mirror `CreateOrUpdateDocumentType`.
  const isEditing = isValidGuid(documentUuid);

  // Guard de navegação: um `documentUuid` presente mas que NÃO é um GUID
  // válido não deve renderizar um form "fantasma" — redireciona para a listagem.
  useEffect(() => {
    if (documentUuid && !isValidGuid(documentUuid)) {
      navigate('/administrativo/documentos', { replace: true });
    }
  }, [documentUuid, navigate]);

  const canSave = isForcedViewMode
    ? false
    : isEditing
      ? can('document-managements_edit')
      : can('document-managements_create');

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<DocumentManagementFormType>({
    mode: 'onChange',
    resolver: documentManagementSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      document_type_uuid: null,
      description: '',
      validity: null,
      alert_days: null,
      observation: null,
      attachments: [],
    },
  });

  // Guard de `dirtyFields` (Lei 2) — mirror `CreateOrUpdateDocumentType.fillForm`.
  function fillForm(data: DocumentManagementData, resetForce?: boolean) {
    if (Object.keys(dirtyFields).length === 0 || resetForce) {
      reset({
        document_type_uuid: data.document_type
          ? { label: data.document_type.name, value: data.document_type.uuid }
          : null,
        description: data.description,
        validity: data.validity,
        alert_days: data.alert_days,
        observation: data.observation,
        attachments: (data.attachments ?? []).map((row) => ({
          uuid: row.uuid,
          name: row.name,
          file: null,
        })),
      });
    }
  }

  const documentManagementQuery = useDocumentManagementForm({
    registrationId: isEditing ? documentUuid : undefined,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([documentManagementQuery as any]);
  const documentManagementData = documentManagementQuery.data;

  // Adaptador para `SelectAsyncPaginate` — mesma técnica de
  // `listDocumentTypeOptionsForSelect` (CreateOrUpdateDocumentType.tsx):
  // endpoint FLAT sem paginação/search reais no backend, paginação e busca
  // aplicadas CLIENT-SIDE. GAP-DOCUMENTOS-FE-02: perfil sem `_create`/`_edit`
  // não deveria chegar aqui com `canSave=true`, mas o adaptador degrada
  // graciosamente (combo vazio) em vez de quebrar a tela em qualquer cenário
  // de 403.
  const listDocumentTypeOptionsForForm = useCallback(
    async (
      params: ListDocumentTypeOptionsForFormParams
    ): Promise<ResponsePagination<DocumentTypeOption[]>> => {
      try {
        const all = await listDocumentTypeOptions({});
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
      } catch {
        return {
          success: true,
          data: {
            items: [],
            pagination: {
              total: 0,
              count: 0,
              per_page: params.per_page ?? 1,
              current_page: 1,
              total_pages: 1,
            },
          },
        };
      }
    },
    []
  );

  const documentManagementMutation = useRequest({
    asyncFunction: tryPersistDocumentManagement,
    entityName: text.singularLabel,
    queryKey: queryKey.baseRegistrations.documentManagements.list,
    queryKey2: queryKey.baseRegistrations.documentManagements.detail,
    typesRequest: isEditing ? 'update' : 'create',
    personalizedMessage: isEditing
      ? text.form.toasts.updateSuccess
      : text.form.toasts.createSuccess,
    actionSuccess: () => {
      navigate(-1);
    },
  });

  // Payload SEMPRE completo (mirror Equipment, não é PATCH parcial —
  // `DocumentManagementRequest` não distingue create/update no shape),
  // multipart sempre (por causa de `attachments[].file`).
  async function tryPersistDocumentManagement(data: DocumentManagementFormType) {
    const payload: DocumentManagementPayload = {
      document_type_uuid: data.document_type_uuid?.value ?? '',
      description: data.description.trim(),
      validity: data.validity || null,
      alert_days:
        data.alert_days !== null && data.alert_days !== undefined ? Number(data.alert_days) : null,
      observation: data.observation?.trim() || null,
      // `name` vazio recebe o default 'Não Informado' no submit — mirror
      // `EquipamentoAnexosTab`/`tryPersistEquipment`, NÃO trava o submit por
      // nome vazio (schema não exige `.required()` em `attachments[].name`).
      attachments: data.attachments.map((row) => ({
        uuid: row.uuid || null,
        name: row.name?.trim() || text.attachmentRow.defaultName,
        file: row.file || null,
      })),
    };

    if (isEditing && documentUuid) {
      return await updateDocumentManagement(documentUuid, payload);
    }
    return await createDocumentManagement(payload);
  }

  async function onSubmit(data: DocumentManagementFormType) {
    if (isEditing && Object.keys(dirtyFields).length === 0) {
      navigate(-1); // nada mudou -> só volta, sem chamar a API
      return;
    }
    await documentManagementMutation.mutateAsync(data);
  }

  const isSubmitting = documentManagementMutation.isPending;

  const watchedDescription = watch('description') ?? '';

  // `code`: real em edição (vindo do backend), dica textual no create — NUNCA
  // um valor calculado no cliente (molde de `CreateOrUpdateDocumentType`).
  const displayCode = isEditing ? documentManagementData?.code : text.form.hints.codeGenerated;

  return (
    <FormContainer
      title={
        isForcedViewMode
          ? text.form.title.view
          : isEditing
            ? text.form.title.edit
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
              disabled={isSubmitting || !!isLoading}
            />
          )}
        </>
      }
    >
      <Form noPadding onSubmit={handleSubmit(onSubmit)}>
        {/* Código gerado — somente leitura, SEMPRE visível (dica no create,
            valor real na edição) — molde 1:1 de CreateOrUpdateDocumentType. */}
        <Box
          bg="bg.muted"
          border="1px solid"
          borderColor="border.subtle"
          borderRadius="lg"
          px={4}
          py={3}
          mb={6}
        >
          <Skeleton loading={!!isLoading} borderRadius="md">
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
          <Controller
            name="document_type_uuid"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.form.fields.documentType}
                placeholder={text.form.placeholders.documentType}
                service={listDocumentTypeOptionsForForm}
                mapOptions={(item: DocumentTypeOption) => ({
                  label: `${item.code} — ${item.name}`,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value as Option<string> | null}
                onChange={(option: any) => field.onChange(option ?? null)}
                error={error?.message}
                isRequired
                isReadOnly={!canSave}
              />
            )}
          />

          <Input
            label={text.form.fields.description}
            helperText={
              errors.description?.message ? undefined : `${watchedDescription.length}/100`
            }
            {...register('description')}
            error={errors.description?.message}
            isRequired
            loading={!!isLoading}
            disabled={!canSave}
          />

          <Controller
            name="validity"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field label={text.form.fields.validity}>
                <DateInput value={value ?? null} onChange={onChange} disabled={!canSave} />
              </Field>
            )}
          />

          <Controller
            name="alert_days"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <NumberInput
                name={name}
                label={text.form.fields.alertDays}
                value={value ?? null}
                onValueChange={(val) => onChange(val)}
                min={0}
                allowDot={false}
                error={error?.message}
                disabled={!canSave || !!isLoading}
              />
            )}
          />
        </SimpleGrid>

        <Box mt={6}>
          <Controller
            name="observation"
            control={control}
            render={({ field, fieldState }) => (
              <Textarea
                label={text.form.fields.observation}
                name={field.name}
                maxLength={200}
                value={field.value ?? ''}
                onChange={(event) => field.onChange(event.target.value)}
                error={fieldState.error?.message}
                loading={!!isLoading}
                disabled={!canSave}
              />
            )}
          />
        </Box>

        <DocumentoAnexosSection
          control={control}
          watch={watch}
          isLoading={!!isLoading}
          canSave={canSave}
          documentManagementData={documentManagementData}
        />
      </Form>
    </FormContainer>
  );
}
