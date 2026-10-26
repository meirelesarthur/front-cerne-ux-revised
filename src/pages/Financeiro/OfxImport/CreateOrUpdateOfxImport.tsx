// src/pages/Financeiro/OfxImport/CreateOrUpdateOfxImport.tsx
// -----------------------------------------------------------------------------
// Tela de CRIAÇÃO, EDIÇÃO e VISUALIZAÇÃO da Importação OFX (OfxImport —
// Financeiro, F-114, 97-Esteiras/064, TASK-064-OFX-FE-01). Decisão F1
// (arquitetura-ofx-frontend.md §4) — UM ÚNICO componente cobre os 3 modos,
// mirror `CreateOrUpdateExpense.tsx`/`CreateOrUpdateMovimento.tsx`:
// `canSave = isEditing ? can('import_ofx_edit') : can('import_ofx_create')`;
// sem `canSave`, todo campo renderiza `disabled` (somente-leitura), sem tela
// separada. Rotas: `/financeiro/ofx/novo` (criar) e `/financeiro/ofx/:uuid`
// (ver/editar, mesmo componente).
//
// Decisão F2 — `code` NUNCA aparece em modo criação (nada a prever/exibir
// antes do POST responder); em edição/visualização é só um campo de
// EXIBIÇÃO (não pertence a `OfxImportForm`/RHF), populado por
// `loadedOfxImport.code` a partir da resposta do `GET /ofx-imports/{uuid}`.
//
// Anexo (`ofx_file`) — Decisão F2/SE-02: obrigatório só na criação; na
// edição, ausente preserva o anexo atual. O anexo já existente é exibido
// como um link de download separado (`handleDownloadAttachment`, blob
// autenticado — X-Farm-Id/Sanctum não podem viajar num `<a href>` estático,
// mirror `CreateOrUpdateExpense.tsx::handleDownloadXml`); o `FileUpload`
// abaixo dele serve SÓ para escolher um arquivo NOVO (substituição).
//
// GAP-OFX-FE-01 (CORE_WORKSPACE/04-Gaps_Frontend_UI/GAP-OFX-FE-01-*.md): o
// submit de criação/edição envia `account_uuid` (único valor que o SPA
// consegue obter do lookup de contas) — a API atual exige `account_id`
// (PK interna, integer), que nenhum endpoint expõe ao front. Até o Gap ser
// resolvido, o submit responde 422 (estado honesto, sem mock).
// -----------------------------------------------------------------------------

import { ElementType, useMemo, useState } from 'react';

import { Box, SimpleGrid, Text } from '@chakra-ui/react';
import { yupResolver } from '@hookform/resolvers/yup';
import { Controller, useForm } from 'react-hook-form';
import { FiDownload } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { Field } from '@/components/Form/Field';
import { FileUpload } from '@/components/Form/FileUpload';
import { Input } from '@/components/Form/Input';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useCustomFormQueryById } from '@/hooks/useCustomFormQueryById';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { downloadBlob } from '@/utils/downloadBlob';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { ofxImportSchema } from '@/validations/schemas/Financeiro/ofxImport-schema';

import { listAccounts } from '@/services/v2/CadastrosBase/Account/account-service';
import {
  downloadOfxImportAttachment,
  getOfxImport,
  tryPersistOfxImport,
} from '@/services/v2/Financeiro/OfxImports/ofx-import-service';

import type { Option } from '@/@types/option';
import type { AccountListItem, AccountTypeCode } from '@/@types/v2/CadastrosBase/account';
import type { OfxImportDetail, OfxImportForm } from '@/@types/v2/Financeiro/ofxImport';

const ofxImportFormDefaultValues: OfxImportForm = {
  description: '',
  account_uuid: null,
  start_date: '',
  end_date: '',
  ofx_file: null,
};

// Decisão 5/LK-01 (arquitetura-ofx-db-api.md §4) — o select de conta do
// create/edit restringe por `type IN (CURRENT, SAVINGS)`, SÓ como filtro de
// lookup (não é regra de validação server, `OfxImportRequest.account_id` não
// restringe tipo). Decisão F5/6 — `type` array já suportado por
// `listAccounts`/`AccountFilterData` (extensão aditiva aplicada e testada).
function findAccountParams(search: string | { search: string }) {
  const types: AccountTypeCode[] = ['C', 'P'];
  return { search: typeof search === 'string' ? search : search.search, type: types };
}

export default function CreateOrUpdateOfxImport() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const text = languageGB.ofxImports.ofxImport;
  const formText = text.form;

  const isEditing = isValidGuid(uuid);
  const canSave = isEditing ? can('import_ofx_edit') : can('import_ofx_create');

  const [loadedOfxImport, setLoadedOfxImport] = useState<OfxImportDetail | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const schema = useMemo(() => ofxImportSchema(languageGB, isEditing), [languageGB, isEditing]);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields, isSubmitting },
  } = useForm<OfxImportForm>({
    resolver: yupResolver(schema),
    defaultValues: ofxImportFormDefaultValues,
  });

  // [Lei 2] — `fillForm` nomeada, guarda `!isEmpty(dirtyFields) || resetForce`
  // ANTES do `reset()` (mirror `CreateOrUpdateIncome.tsx::fillForm`).
  function fillForm(data: OfxImportDetail, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      setLoadedOfxImport(data);
      reset({
        description: data.description,
        account_uuid: data.account
          ? {
              label: `${data.account.bank} — ${data.account.description}`,
              value: data.account.uuid,
            }
          : null,
        start_date: data.start_date,
        end_date: data.end_date,
        ofx_file: null,
      });
    }
  }

  const ofxImportQuery = useCustomFormQueryById<OfxImportDetail>({
    registrationId: isEditing ? uuid! : '',
    asyncFunction: getOfxImport,
    queryKey: queryKey.financial.ofxImport,
    fillForm,
  });

  const isLoading = isEditing ? checkLoadingStatus([ofxImportQuery as any]) : false;

  // [Lei 3] — wrapper NOMEADO (nunca o service inline) que fecha `isEditing`/
  // `uuid` desta tela sobre a função pura `tryPersistOfxImport` do service.
  async function tryPersistOfxImportWrapper(data: OfxImportForm) {
    return await tryPersistOfxImport({ data, isEditing, ofxImportUuid: uuid });
  }

  const ofxImportMutation = useRequest({
    asyncFunction: tryPersistOfxImportWrapper,
    entityName: text.singularLabel,
    queryKey: queryKey.financial.ofxImports,
    queryKey2: queryKey.financial.ofxImport,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  // [Lei 2] — edição sem NENHUM campo sujo (nem `description`, `account_uuid`,
  // datas, nem `ofx_file` trocado) = nada a salvar, mirror
  // `CreateOrUpdateIncome.tsx::onSubmit`.
  //
  // A condição estava INVERTIDA: `isEmpty` (`src/utils/isEmpty.ts`) retorna
  // `true` quando o objeto TEM chaves (não quando está vazio). Com
  // `isEmpty(dirtyFields)` (sem `!`), QUALQUER edição (ex.: só a descrição)
  // deixava `dirtyFields` não-vazio → `isEmpty` devolvia `true` → caía no
  // `navigate(-1)` e voltava SEM salvar (bug relatado pelo dono em
  // `/financeiro/ofx/:uuid`). `fillForm` acima já usava `!isEmpty(...)`; o
  // `onSubmit` ficou defasado. Correção idêntica à já aplicada em
  // `CreateOrUpdateIncome.tsx`/`CreateOrUpdateExpense.tsx::onSubmit`: com
  // `!isEmpty(dirtyFields)` só volta sem persistir quando NADA mudou.
  async function onSubmit(data: OfxImportForm) {
    if (isEditing && !isEmpty(dirtyFields)) {
      navigate(-1);
      return;
    }
    await ofxImportMutation.mutateAsync(data);
  }

  const currentAttachment = loadedOfxImport?.attachments?.[0] ?? null;

  async function handleDownloadAttachment() {
    if (!loadedOfxImport || !currentAttachment) return;
    setIsDownloading(true);
    try {
      const blob = await downloadOfxImportAttachment(loadedOfxImport.uuid);
      downloadBlob(blob, currentAttachment.name);
    } catch {
      toaster.error({
        title: formText.actions.download,
        description: formText.actions.downloadError,
      });
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <FormContainer
      title={
        isEditing ? (canSave ? formText.title.edit : formText.title.view) : formText.title.create
      }
      subtitle={
        isEditing
          ? canSave
            ? formText.subtitle.edit
            : formText.subtitle.view
          : formText.subtitle.create
      }
      // Mirror `CreateOrUpdateMovimento.tsx`/`CreateOrUpdateHelp.tsx` — o
      // rodapé de ações vai no slot `footer` do `FormContainer` (casca
      // `PageCard fullHeight`, corpo com padding `PAD`/footer com borda +
      // padding próprios), NUNCA dentro do `<Form noPadding>` (esse combo é
      // o que deixava Descrição/Dt. Fim/Arquivo OFX/Cancelar colados na
      // borda — correção visual pura, GAP relatado pelo dono).
      footer={
        <>
          <Button
            title={languageGB.defaltStrings.cancel}
            variant="secondary"
            onClick={() => navigate(-1)}
            type="button"
            disabled={isSubmitting}
          />
          {canSave && (
            <Button
              title={languageGB.defaltStrings.save}
              type="submit"
              form="ofx-import-form"
              loading={isSubmitting}
              disabled={isSubmitting || !!isLoading}
            />
          )}
        </>
      }
    >
      <Form id="ofx-import-form" onSubmit={handleSubmit(onSubmit)} noPadding>
        <SimpleGrid columns={columnsForm.default} gap={6}>
          {/* Decisão F2 — `code` só em modo edição/visualização, NUNCA na
              criação; é exibição pura (não é campo do RHF). */}
          {isEditing && (
            <Input
              label={formText.fields.code}
              value={loadedOfxImport?.code ?? ''}
              readOnly
              disabled
              loading={isLoading}
            />
          )}

          <Input
            label={formText.fields.description}
            {...register('description')}
            error={errors.description?.message}
            isRequired
            disabled={!canSave}
            loading={isLoading}
          />

          <Controller
            name="account_uuid"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={formText.fields.account}
                placeholder={formText.placeholders.account}
                service={listAccounts}
                mapOptions={(item: AccountListItem) => ({
                  label: `${item.bank} — ${item.agency}/${item.account}`,
                  value: item.uuid,
                })}
                findParams={findAccountParams}
                value={field.value as Option<string> | null}
                onChange={(option: any) => field.onChange(option ?? null)}
                error={error?.message}
                isRequired
                isDisabled={!canSave}
              />
            )}
          />

          <Controller
            name="start_date"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field
                label={formText.fields.startDate}
                isRequired
                errorText={errors.start_date?.message}
              >
                <DateInput value={value} onChange={onChange} disabled={!canSave} />
              </Field>
            )}
          />

          <Controller
            name="end_date"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field
                label={formText.fields.endDate}
                isRequired
                errorText={errors.end_date?.message}
              >
                <DateInput value={value} onChange={onChange} disabled={!canSave} />
              </Field>
            )}
          />
        </SimpleGrid>

        <Box mt={6}>
          {isEditing && currentAttachment && (
            <Box mb={3}>
              <Text fontSize="xs" color="fg.muted" mb={1}>
                {formText.fileUpload.existingFileLabel}
              </Text>
              <Button
                title={`${formText.actions.download} — ${currentAttachment.name}`}
                variant="outline"
                size="sm"
                icon={FiDownload as ElementType}
                onClick={handleDownloadAttachment}
                loading={isDownloading}
              />
            </Box>
          )}

          <Controller
            name="ofx_file"
            control={control}
            render={({ field }) => (
              <FileUpload
                label={formText.fields.ofxFile}
                hint={formText.fileUpload.hint}
                accept=".ofx"
                maxSizeMb={10}
                file={field.value}
                onFileSelected={(file) => field.onChange(file)}
                onRemove={() => field.onChange(null)}
                disabled={!canSave}
                error={errors.ofx_file?.message as string | undefined}
                dropzoneTitle={formText.fileUpload.dropzoneTitle}
                dropzoneDraggingTitle={formText.fileUpload.dropzoneDraggingTitle}
                changeLabel={formText.fileUpload.changeLabel}
                removeLabel={formText.fileUpload.removeLabel}
                replaceLabel={formText.fileUpload.replaceLabel}
                existingFileLabel={formText.fileUpload.existingFileLabel}
                errorTypeMessage={formText.fileUpload.errorTypeMessage}
                errorSizeMessage={formText.fileUpload.errorSizeMessage}
              />
            )}
          />
        </Box>
      </Form>
    </FormContainer>
  );
}
