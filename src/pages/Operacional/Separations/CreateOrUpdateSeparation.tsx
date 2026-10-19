// src/pages/Operacional/Separations/CreateOrUpdateSeparation.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de APARTAÇÃO (Separation — Operacional >
// Pecuária, TASK-APART-FE-02, frontend-contract-apartacao.md §7). Rotas:
// `/operacional/apartacao/novo` e `/operacional/apartacao/:separationUuid/editar`
// (guardadas por `separation_view`; botão Salvar gateado por
// `separation_create`/`separation_edit`, ver `router/index.tsx`).
//
// Molde estrutural: form simples do fork (`FormContainer` + `Form` +
// `useCustomFormQueryByGuid` (mirror `useSeparationDetail`/`useBirthAnimalForm`
// — convenção já estabelecida por `useSeparations.tsx` na fundação desta
// mesma feature) + `useRequest`), mirror `Nascimentos/CreateOrUpdateBirthAnimal.tsx`
// — SEM foto, SEM cascata de espécie, SEM tabela dinâmica linha-a-linha
// (contrato §7, "Leitura do dev" da Tarefa 25).
//
// ⚠️ Checklist obrigatório desta Tarefa (TASK-APART-FE-02):
//
// 1) Guarda de submit `isEditing && !isEmpty(dirtyFields)` — mirror EXATO
//    (cópia literal do padrão, NÃO reimplementado do zero) do fix real já
//    aplicado em `BullSeedSeason/CreateOrUpdateBullSeedSeason.tsx` (linha
//    ~341): `isEmpty()` deste projeto (`src/utils/isEmpty.ts`) tem nome
//    INVERTIDO — retorna `true` quando o objeto TEM alguma chave própria.
//    Logo "nada mudou → só navega" precisa da negação `!`. SEM a negação, o
//    guard navegaria de volta sem chamar a API em QUALQUER edição — bug real
//    já relatado em teste manual na feature irmã, não replicado aqui.
// 2) `fillSeparationForm` nomeada com guarda `!isEmpty(dirtyFields) ||
//    resetForce` (Lei 2) — mesma disciplina, mesmo utilitário.
// 3) Payload SEMPRE full-resource-replace (`{ date, batches: uuids[] }`,
//    contrato §7.2) — nunca delta de `dirtyFields` (`batches` é `sync()`
//    total no servidor).
// 4) `code` só existe em modo EDITAR (contrato §7.1) — em criar o campo nem
//    é renderizado (diferente do precedente Nascimentos, que sempre mostra
//    `InputReadOnly` com hint "gerado ao salvar").
// 5) `finished_processing === true` em `/editar` redireciona para o Detalhe
//    — nunca renderiza form desabilitado (mirror `has_weaning`).
// 6) Aviso de data×lote (`check-date`, contrato §7.4) — múltiplos
//    `batch_uuids[]` simultâneos, resposta `invalid_batches[]`. UM ÚNICO
//    toast por checagem, agregando TODAS as descrições (nunca 1 toast por
//    lote — divergiria do precedente Nascimentos por excesso/spam).
//    Não-bloqueante (`GAP-APART-05`, fechado como "preservar como-is") —
//    falha de rede/servidor é try/catch silencioso, nunca trava o submit.
// 7) `batches` — `SelectAsyncPaginate isMulti` (mirror `CreateOrUpdateBatch/
//    index.tsx`, `category_uuids`) sobre `listBatchOptions`. Em EDITAR,
//    `includeUuids` é a lista ESTÁVEL dos lotes já vinculados NO MOMENTO DA
//    CARGA (não reage à seleção corrente) — garante que lotes não mais
//    `ACTIVE` continuem aparecendo hidratados (mirror `LK-02`).
// -----------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react';

import { SimpleGrid } from '@chakra-ui/react';
import { isAxiosError } from 'axios';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { Field } from '@/components/Form/Field';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatDate from '@/utils/formatDate';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { separationSchemaResolver } from '@/validations/schemas/Separations/separation-schema';

import { listBatchOptions } from '@/services/v2/Batches/batch-service';
import {
  checkSeparationDate,
  createSeparation,
  updateSeparation,
} from '@/services/v2/Separations/separation-service';

import type { BatchOption } from '@/@types/v2/Batches';
import type {
  CreateOrUpdateSeparationRequest,
  SeparationDetail,
  SeparationForm as SeparationFormType,
} from '@/@types/v2/Separations';

import { useSeparationForm } from './useSeparations';

const SEPARATIONS_LIST_ROUTE = '/operacional/apartacao';

// Traduz o nome de campo do SERVIDOR (`date`/`batches`/`batches.N`, contrato
// de API §6, `SeparationRequest::rules()`) para o nome do campo do FORM —
// `batches.N` (erro de UM elemento do array) é roteado para o controle
// agregado `batches` (não há input individual por lote nesta tela, mirror
// da mesma decisão de agregação do aviso §7.4).
function mapServerFieldToFormField(field: string): keyof SeparationFormType | null {
  if (field === 'date') return 'date';
  if (field === 'batches' || /^batches\.\d+$/.test(field)) return 'batches';
  return null;
}

export default function CreateOrUpdateSeparation() {
  const { separationUuid } = useParams<{ separationUuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.separations.separation;
  const formText = text.form;

  const isEditing = isValidGuid(separationUuid);

  // Guard de GUID malformado na rota de edição — redireciona para a
  // listagem ANTES de renderizar o form (mirror `BirthAnimalDetalhe.tsx`/
  // `CreateOrUpdateBullSeedSeason.tsx`).
  useEffect(() => {
    if (separationUuid && !isValidGuid(separationUuid)) {
      navigate(SEPARATIONS_LIST_ROUTE, { replace: true });
    }
  }, [separationUuid, navigate]);

  const canEdit = can('separation_edit');
  const canCreate = can('separation_create');
  const canSave = isEditing ? canEdit : canCreate;

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, dirtyFields },
  } = useForm<SeparationFormType>({
    mode: 'onChange',
    resolver: separationSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      date: '',
      batches: [],
    },
  });

  // `code` — sempre readonly, NÃO é campo RHF; só existe em modo editar
  // (checklist item 4, contrato §7.1) — dado cru do servidor.
  const [codeDisplay, setCodeDisplay] = useState<string | null>(null);

  // Lista ESTÁVEL dos lotes já vinculados no momento da carga (checklist
  // item 7) — usada em `includeUuids` do multi-select em modo editar,
  // independente da seleção corrente do usuário.
  const [linkedBatchUuids, setLinkedBatchUuids] = useState<string[]>([]);

  // Checklist item 2 — função NOMEADA, guarda `!isEmpty(dirtyFields) ||
  // resetForce` (Lei 2).
  function fillSeparationForm(data: SeparationDetail, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) && !resetForce) return;

    reset({
      date: data.date,
      batches: (data.batches ?? []).map((batch) => ({
        label: batch.description,
        value: batch.uuid,
      })),
    });

    setCodeDisplay(data.code);
    setLinkedBatchUuids((data.batches ?? []).map((batch) => batch.uuid));
  }

  const separationQuery = useSeparationForm({
    registrationId: isEditing ? separationUuid : undefined,
    fillForm: fillSeparationForm,
  });

  const isLoading = isEditing && checkLoadingStatus([separationQuery as any]);
  const loadedData = separationQuery.data as SeparationDetail | undefined;

  // Checklist item 5 (contrato §7.3) — `finished_processing === true` em
  // modo editar redireciona para o Detalhe. NUNCA renderiza form desabilitado.
  useEffect(() => {
    if (!isEditing || !loadedData) return;
    if (loadedData.finished_processing) {
      navigate(`${SEPARATIONS_LIST_ROUTE}/${separationUuid}`, { replace: true });
    }
  }, [isEditing, loadedData, separationUuid, navigate]);

  const separationMutation = useRequest({
    asyncFunction: tryPersistSeparation,
    entityName: text.singularLabel,
    queryKey: queryKey.separations.separationsList,
    queryKey2: queryKey.separations.separation,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  // Checklist item 3 — payload SEMPRE full-resource-replace.
  async function tryPersistSeparation(data: SeparationFormType) {
    const payload: CreateOrUpdateSeparationRequest = {
      date: data.date,
      batches: data.batches.map((option) => option.value),
    };

    try {
      return isEditing && separationUuid
        ? await updateSeparation(separationUuid, payload)
        : await createSeparation(payload);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 422) {
        const fieldErrors = error.response.data?.errors as Record<string, string[]> | undefined;
        Object.entries(fieldErrors ?? {}).forEach(([field, messages]) => {
          const mappedField = mapServerFieldToFormField(field);
          if (mappedField && messages?.[0]) {
            setError(mappedField, { type: 'server', message: messages[0] });
          }
        });
      }
      throw error;
    }
  }

  // Checklist item 1 — guarda `isEditing && !isEmpty(dirtyFields)` (Lei 2,
  // mirror EXATO `CreateOrUpdateBullSeedSeason.tsx`, linha ~341). `isEmpty()`
  // deste projeto retorna `true` quando o objeto TEM alguma chave própria
  // (nome invertido do utilitário, `src/utils/isEmpty.ts`), então o guard de
  // "nada mudou → só navega" precisa da negação `!`. SEM ela, o guard
  // navegaria de volta sem chamar a API em QUALQUER edição — bug real já
  // relatado em teste manual na feature irmã Touros/Sêmen/Embrião, não
  // replicado aqui.
  async function onSubmit(data: SeparationFormType) {
    if (isEditing && !isEmpty(dirtyFields)) {
      navigate(-1);
      return;
    }
    await separationMutation.mutateAsync(data);
  }

  const isSubmitting = separationMutation.isPending;

  // ---- Aviso de consistência de data×lote (contrato §7.4, checklist item
  // 6) — NÃO-BLOQUEANTE, debounce de ~600ms disparado por `date`/`batches`
  // (qualquer adição/remoção de lote). Múltiplos `batch_uuids[]`
  // simultâneos — agrega TODAS as descrições num ÚNICO toast. ----
  const watchedDate = useWatch({ control, name: 'date' });
  const watchedBatches = useWatch({ control, name: 'batches' });
  const lastCheckRef = useRef<string>('');

  useEffect(() => {
    const batchUuids = (watchedBatches ?? [])
      .map((option) => option?.value)
      .filter((value): value is string => !!value);

    if (!watchedDate || batchUuids.length === 0) return;

    const checkKey = `${watchedDate}|${[...batchUuids].sort().join(',')}`;
    const timer = setTimeout(async () => {
      if (checkKey === lastCheckRef.current) return;
      lastCheckRef.current = checkKey;

      try {
        const result = await checkSeparationDate({ date: watchedDate, batch_uuids: batchUuids });

        if (!result.valid && result.invalid_batches.length > 0) {
          const list = result.invalid_batches
            .map((invalidBatch) =>
              formText.batchDateWarning.itemTemplate
                .replace('{description}', invalidBatch.description)
                .replace('{date}', formatDate(invalidBatch.date))
            )
            .join(', ');

          toaster.create({
            type: 'warning',
            title: formText.batchDateWarning.title,
            description: formText.batchDateWarning.description.replace('{list}', list),
          });
        }
      } catch {
        // Falha de rede/servidor no aviso não deve travar o preenchimento do
        // formulário — checagem prévia informativa, nunca parte do caminho
        // crítico de submit (contrato §7.4, `GAP-APART-05`).
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [watchedDate, JSON.stringify(watchedBatches?.map((option) => option?.value))]);

  if (separationUuid && !isValidGuid(separationUuid)) {
    return null;
  }

  return (
    <FormContainer
      title={isEditing ? formText.title.edit : formText.title.create}
      footer={
        <>
          <Button
            title={languageGB.defaltStrings?.cancel || 'Cancelar'}
            variant="outline"
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
        <SimpleGrid columns={columnsForm.default} gap={6}>
          {/* Checklist item 4 (contrato §7.1) — `code` só existe em EDITAR;
              em criar o campo nem é renderizado. */}
          {isEditing && (
            <InputReadOnly
              label={formText.fields.code}
              value={codeDisplay ?? ''}
              loading={isLoading}
            />
          )}

          <Controller
            name="date"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field label={formText.fields.date} errorText={errors.date?.message} isRequired>
                <DateInput
                  value={value ?? null}
                  onChange={onChange}
                  disabled={!canSave || !!isLoading}
                />
              </Field>
            )}
          />

          <Controller
            name="batches"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={formText.fields.batches}
                placeholder={formText.placeholders.batches}
                error={errors.batches?.message as string | undefined}
                service={listBatchOptions}
                mapOptions={(item: BatchOption) => ({ label: item.label, value: item.uuid })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                  statuses: ['ACTIVE'],
                  includeUuids: isEditing ? linkedBatchUuids : undefined,
                })}
                cacheUniqs={[isEditing, linkedBatchUuids.join(',')]}
                value={field.value ?? []}
                onChange={(options: any) => field.onChange(options ?? [])}
                isRequired
                isMulti
                isDisabled={!canSave || !!isLoading}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />
        </SimpleGrid>
      </Form>
    </FormContainer>
  );
}
