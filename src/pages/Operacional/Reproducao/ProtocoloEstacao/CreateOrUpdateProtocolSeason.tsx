// src/pages/Operacional/Reproducao/ProtocoloEstacao/CreateOrUpdateProtocolSeason.tsx
// -----------------------------------------------------------------------------
// Formulário único de criação/edição de Protocolo/Estação — Operacional /
// Reprodução (F-057, execução 040, TASK-FE-1054 — casca + 7 campos de
// cabeçalho — e TASK-FE-1059 — wiring de submit/DoD final). Rotas
// `/operacional/protocolos-estacao/nova` e
// `/operacional/protocolos-estacao/:uuid/editar` (TASK-FE-1052).
//
// Esqueleto geral mirror `LoteReproducao/CreateOrUpdateLoteReproducao.tsx`
// (`isEditing = isValidGuid(uuid)`, guard de navegação para uuid malformado,
// `useCustomFormQueryByGuid`, `fillForm` nomeada com guarda
// `!isEmpty(dirtyFields) || resetForce`, `useUnsavedChangesGuard` +
// `DeleteConfirmDialog` de saída sem salvar, `code`/"Responsável" SEMPRE
// `InputReadOnly`). Guarda de "nada mudou" no `onSubmit` mirror EXATO da
// versão CORRIGIDA do sibling (`!isEmpty(dirtyFields)` — `src/utils/
// isEmpty.ts` tem nome invertido: retorna `true` quando o objeto TEM alguma
// chave própria; ERRO-FE-001, conferido contra a implementação real).
//
// "Responsável" NUNCA tem fallback para o usuário logado em EDIÇÃO — só em
// CRIAÇÃO mostra o usuário autenticado local; em edição, exibe exatamente o
// que vem do servidor (`data.user.name`/`data.user.uuid`).
//
// ⚠️ ACHADO DE RECONCILIAÇÃO (TASK-FE-1059, ver `@/@types/v2/Operacional/
// Reproducao/protocolSeason`): `ProtocolSeasonController::update()` usa o
// MESMO `ProtocolSeasonRequest` do `store()` — `code`/`name`/`date`/
// `breeding_season_uuid`/`user_uuid`/`items` são obrigatórios em AMBOS os
// verbos (confirmado por leitura direta de `app/Data/ProtocolSeason/
// ProtocolSeasonData.php` no `api_root`, sem `|Optional` nesses campos).
// UPDATE envia o cabeçalho SEMPRE COMPLETO (mirror do CREATE) + `items[]`
// sempre integral — NÃO é PATCH parcial (diverge do contrato-frontend §4.2,
// que previa só `dirtyFields` no cabeçalho). O guard "nada mudou" (`isEditing
// && !isEmpty(dirtyFields) → não enviar`) é PRESERVADO — só o SHAPE do
// payload quando há mudança é que passa a ser sempre completo.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Box, SimpleGrid } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { DateInput } from '@/components/DateInput';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { Textarea } from '@/components/Form/Textarea';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useAuth } from '@/hooks/useAuth';
import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { columnsForm } from '@/constants/coluns-form';
import { protocolSeasonServiceOptions } from '@/constants/operacional/reproducao/protocolSeason';
import { queryKey } from '@/constants/query-key';

import { protocolSeasonSchemaResolver } from '@/validations/schemas/ProtocolsSeason/protocolSeason-schema';

import { listBreedingSeasons } from '@/services/v2/BreedingSeasons/breeding-season-service';
import {
  createProtocolSeason,
  getNextProtocolSeasonCode,
  getProtocolSeason,
  updateProtocolSeason,
} from '@/services/v2/Operacional/Reproducao/protocolSeason-service';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { BreedingSeasonListItem } from '@/@types/v2/BreedingSeasons';
import type {
  CreateProtocolItemRequest,
  CreateProtocolSeasonRequest,
  ProtocolItemFieldValue,
  ProtocolSeasonData,
  ProtocolSeasonForm,
} from '@/@types/v2/Operacional/Reproducao/protocolSeason';

import { ProtocolSeasonItemsFieldArray } from './ProtocolSeasonItemsFieldArray';
import { ProtocolSeasonTimelinePreview } from './ProtocolSeasonTimelinePreview';
import { computeProtocolIdentification } from './utils/computeProtocolIdentification';
import { formatStockDisplay } from './utils/formatStockDisplay';

const PROTOCOL_SEASON_LIST_ROUTE = '/operacional/protocolos-estacao';

function todayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function mapBreedingSeasonOption(item: BreedingSeasonListItem): Option<string> {
  return { label: `${item.code} — ${item.description}`, value: item.uuid };
}

// Mirror EXATO de `findParamsFromSearch` (GerarVendaFromOrder.tsx) — normaliza
// o termo digitado no `SelectAsyncPaginate` (chega como `string` puro) para o
// shape `{ search }` esperado pelo service `listBreedingSeasons`.
const findParamsFromSearch = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
});

function emptyItemRow(defaultDate: string): ProtocolItemFieldValue {
  return {
    identification: '',
    date: defaultDate,
    time: null,
    warehouse_uuid: null,
    stock_uuid: null,
    product_uuid: null,
    service: null,
    measurement_uuid: null,
    stock_display: formatStockDisplay(0),
    quantity: null,
    description: '',
  };
}

// Round-trip de leitura (`GET show`) → valores do subcadastro. `stock_display`
// NÃO é persistido (CAL-004, calculado a partir do lookup de disponibilidade
// no MOMENTO da seleção) — na hidratação de edição não há como recuperar o
// saldo disponível sem uma nova consulta, então parte de "0,00" (honesto,
// sem inventar saldo) até o usuário tocar novamente em armazém/produto.
function mapProtocolItemToFieldValue(
  item: ProtocolSeasonData['items'][number],
  languageGB: LanguageDate
): ProtocolItemFieldValue {
  return {
    identification: item.identification ?? '',
    date: item.date,
    // TASK-FE-2779 (§3) — normalização defensiva: `<input type="time">` só
    // aceita `HH:MM`. O servidor já devolve `HH:MM` após TASK-BE-1075, mas um
    // registro em cache do TanStack Query pode chegar com segundos.
    time: item.time ? item.time.slice(0, 5) : null,
    warehouse_uuid: item.warehouse
      ? { value: item.warehouse.uuid, label: item.warehouse.description }
      : null,
    stock_uuid: item.stock_uuid ?? null,
    product_uuid: item.product
      ? { value: item.product.uuid, label: item.product.description }
      : null,
    service:
      item.service !== null
        ? {
            value: item.service,
            label: protocolSeasonServiceOptions.getLabel(item.service as 1 | 2 | 3 | 4, languageGB),
          }
        : null,
    measurement_uuid: item.measurement
      ? { value: item.measurement.uuid, label: item.measurement.description }
      : null,
    stock_display: formatStockDisplay(0),
    quantity: item.quantity,
    description: item.description ?? '',
  };
}

// 422 do servidor mapeado por campo — path do RHF é IDÊNTICO à chave
// snake_case do backend (`breeding_season_uuid`, `items.{i}.product_uuid`,
// ...), mirror da decisão de nomear os campos do form já em snake_case
// (TASK-FE-1050, achado de reconciliação do wire).
function mapServerFieldToFormField(field: string): string {
  return field;
}

export default function CreateOrUpdateProtocolSeason() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const { user: authUser } = useAuth();

  const text = languageGB.protocolSeasons.protocolSeason;
  const formText = text.form;

  // Guard de navegação: `uuid` presente mas NÃO é um GUID válido (URL
  // adulterada) — redireciona para a listagem ANTES de renderizar o form.
  const hasMalformedRouteParam = uuid !== undefined && !isValidGuid(uuid);

  useEffect(() => {
    if (hasMalformedRouteParam) {
      navigate(PROTOCOL_SEASON_LIST_ROUTE, { replace: true });
    }
  }, [hasMalformedRouteParam, navigate]);

  const isEditing = isValidGuid(uuid);
  const canSave = isEditing ? can('protocols-season_edit') : can('protocols-season_create');

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    clearErrors,
    trigger,
    watch,
    formState: { errors, dirtyFields, isSubmitting },
  } = useForm<ProtocolSeasonForm>({
    mode: 'onChange',
    resolver: protocolSeasonSchemaResolver(languageGB),
    reValidateMode: 'onChange',
    defaultValues: {
      code: '',
      date: todayIsoDate(),
      user_uuid: '',
      user_name: '',
      breeding_season_uuid: null,
      name: '',
      description: '',
      items: [emptyItemRow(todayIsoDate())],
    },
  });

  const itemsFieldArray = useFieldArray({ control, name: 'items' });
  const watchedItems = watch('items') ?? [];
  const watchedHeaderDate = watch('date');

  const itemDatesKey = watchedItems.map((item) => item.date).join('|');

  // ---- Guarda de saída sem salvar ----------------------------------------
  const hasUnsavedChanges = !isEmpty(dirtyFields);
  const { isConfirmOpen, confirmNavigation, cancelNavigation, guardedNavigate } =
    useUnsavedChangesGuard(hasUnsavedChanges);

  // ---- Código sugerido (SÓ em modo criação, `GET next-code`) -------------
  const nextCodeQuery = useQuery({
    queryKey: [queryKey.protocolSeasons.protocolSeason, 'next-code'],
    queryFn: getNextProtocolSeasonCode,
    enabled: !isEditing,
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!isEditing && nextCodeQuery.data?.data?.code) {
      setValue('code', nextCodeQuery.data.data.code, { shouldDirty: false });
    }
  }, [isEditing, nextCodeQuery.data]);

  // ---- "Responsável" — SEMPRE read-only. CREATE: usuário autenticado
  // local. EDIT: `data.user` do show, semeado por `fillForm`, SEM fallback
  // para o usuário da sessão atual. ------------------------------------
  useEffect(() => {
    if (!isEditing && authUser) {
      setValue('user_uuid', authUser.uuid ?? '', { shouldDirty: false });
      setValue('user_name', authUser.username ?? '—', { shouldDirty: false });
    }
  }, [isEditing, authUser]);

  // ---- Guarda EXPLÍCITA `!isEmpty(dirtyFields) || resetForce` (Lei 2) ----
  function fillProtocolSeasonForm(data: ProtocolSeasonData, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        code: data.code,
        date: data.date,
        user_uuid: data.user.uuid,
        user_name: data.user.name,
        breeding_season_uuid: {
          value: data.breeding_season.uuid,
          label: data.breeding_season.description,
        },
        name: data.name,
        description: data.description ?? '',
        items:
          data.items.length > 0
            ? data.items.map((item) => mapProtocolItemToFieldValue(item, languageGB))
            : [emptyItemRow(data.date)],
      });
    }
  }

  const protocolSeasonQuery = useCustomFormQueryByGuid<ProtocolSeasonData>({
    registrationId: isEditing ? uuid : undefined,
    queryKey: queryKey.protocolSeasons.protocolSeason,
    asyncFunction: getProtocolSeason,
    fillForm: fillProtocolSeasonForm,
  });

  // ---- CAL-005 — recalcula `identification` (DZERO/Dn) por linha a cada
  // mudança de QUALQUER data do subcadastro. Nunca marca `dirtyFields`
  // (`shouldDirty: false`) — é um valor CALCULADO, mas volta a ser ENVIADO no
  // payload desde TASK-FE-2779 (fidelidade ao legado — achado TASK-FE-1057
  // encerrado). O bloqueio de "data anterior ao DZERO" (SURF-055) vive no
  // schema Yup (`item-date-not-before-dzero`), não aqui — este efeito só
  // atualiza o rótulo de exibição.
  //
  // TASK-FE-2779 (§2, "Alternativa mínima") — dependências acrescidas de
  // `watchedItems.length` + `hydratedUuid` (marcador da hidratação, o `uuid`
  // do registro carregado por `fillProtocolSeasonForm`): torna o disparo
  // insensível à ORDEM de hidratação. Sem isso, quando `itemDatesKey`
  // coincide com o valor anterior ao `reset()` (ex.: 1 item cuja data é hoje,
  // igual ao default de criação), o efeito não refazia o cálculo e a coluna
  // "Identificação" ficava vazia na edição — a causa raiz real era o
  // `identification` nunca ter sido persistido (ponto §1), mas o recálculo
  // precisa ser robusto à hidratação de qualquer forma (defesa em camadas).
  const hydratedUuid = (protocolSeasonQuery as any)?.data?.uuid;
  useEffect(() => {
    const results = computeProtocolIdentification(
      watchedItems.map((item) => ({ date: item.date }))
    );
    results.forEach((result, index) => {
      if (watchedItems[index] && watchedItems[index].identification !== result.identification) {
        setValue(`items.${index}.identification`, result.identification, { shouldDirty: false });
      }

      // SURF-055 — "data anterior à primeira aplicação (DZERO)" é
      // REJEITADA. Imperativo (não `.test()` do Yup — a versão instalada
      // não alcança o array irmão, ver nota do schema) — mirror
      // `CreateOrUpdateLoteReproducao.tsx::runCheckDateForRow`. Só limpa o
      // erro quando ele foi ESTE mesmo teste (`type: 'business'`), nunca um
      // erro `required` do resolver.
      const currentErrorType = (errors.items as any)?.[index]?.date?.type;
      if (result.invalid) {
        setError(`items.${index}.date`, {
          type: 'business',
          message: formText.validation.itemDateBeforeDzero,
        });
      } else if (currentErrorType === 'business') {
        clearErrors(`items.${index}.date`);
      }
    });
  }, [itemDatesKey, watchedItems.length, hydratedUuid]);

  const isLoading = isEditing && checkLoadingStatus([protocolSeasonQuery as any]);
  const matingsCount = (protocolSeasonQuery as any)?.data?.matings_count ?? 0;
  const editBlockedByMatings = isEditing && matingsCount >= 1;

  const protocolSeasonMutation = useRequest({
    asyncFunction: tryPersistProtocolSeason,
    entityName: text.singularLabel,
    queryKey: queryKey.protocolSeasons.protocolSeasonsList,
    queryKey2: queryKey.protocolSeasons.protocolSeason,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(PROTOCOL_SEASON_LIST_ROUTE);
    },
  });

  // Mapeia cada linha do subcadastro para o wire do DTO (DECISÃO 2 herdada —
  // `product_uuid`/`stock_uuid` SEPARADOS, nunca sobrecarregados) — `items[]`
  // SEMPRE integral (o backend substitui tudo, `SyncProtocolItemsAction`).
  function mapItemsToPayload(items: ProtocolItemFieldValue[]): CreateProtocolItemRequest[] {
    return items.map((item) => ({
      product_uuid: item.product_uuid?.value,
      service: item.service?.value,
      warehouse_uuid: item.warehouse_uuid?.value,
      stock_uuid: item.stock_uuid ?? undefined,
      // TASK A complemento (Execução 065) — item SÓ-serviço não tem medida
      // (`measurement_uuid`/`quantity` nulos por default, schema condiciona
      // os dois a `product_uuid`); non-null assertion quebrava em runtime
      // (`.value` de null). Omitir quando ausente = `Optional`, aceito pela
      // API. `0 ?? undefined` preserva quantidade 0 de produto (não omite).
      measurement_uuid: item.measurement_uuid?.value ?? undefined,
      date: item.date,
      time: item.time ?? undefined,
      description: item.description || undefined,
      quantity: item.quantity ?? undefined,
      // TASK-FE-2779 (§1) — volta a ser enviado (fidelidade ao legado,
      // `ProtocolsSeasonController.php:130`/`:316`): o Request já aceita
      // (`items.*.identification => nullable|string|max:5`, DZERO é o teto).
      // Achado antigo TASK-FE-1057 ("não é enviado no payload") encerrado.
      identification: item.identification || undefined,
    }));
  }

  async function tryPersistProtocolSeason(data: ProtocolSeasonForm) {
    // Cabeçalho SEMPRE completo (create E update — achado de reconciliação
    // no cabeçalho do arquivo: `ProtocolSeasonRequest` não diferencia por
    // verbo) + `items[]` sempre integral.
    const payload: CreateProtocolSeasonRequest = {
      code: data.code,
      name: data.name,
      description: data.description || undefined,
      date: data.date,
      breeding_season_uuid: data.breeding_season_uuid!.value!,
      user_uuid: data.user_uuid,
      items: mapItemsToPayload(data.items),
    };

    try {
      return isEditing && uuid
        ? await updateProtocolSeason(uuid, payload)
        : await createProtocolSeason(payload);
    } catch (error) {
      // 422 do backend mapeado por campo — inclusive linhas do subcadastro
      // (`items.{i}.{campo}`, path aninhado do RHF).
      if (isAxiosError(error) && error.response?.status === 422) {
        const fieldErrors = error.response.data?.errors as Record<string, string[]> | undefined;
        Object.entries(fieldErrors ?? {}).forEach(([field, messages]) => {
          const mappedField = mapServerFieldToFormField(field);
          if (mappedField && messages?.[0]) {
            setError(mappedField as any, { type: 'server', message: messages[0] });
          }
        });
      }
      throw error;
    }
  }

  // Guarda `isEditing && !isEmpty(dirtyFields)` — mirror EXATO da versão
  // CORRIGIDA já em produção em `CreateOrUpdateLoteReproducao.tsx` (ver nota
  // de cabeçalho: `isEmpty()` deste projeto tem nome invertido — sem a
  // negação, o Salvar navegaria de volta sem chamar a API em QUALQUER edição).
  async function onSubmit(data: ProtocolSeasonForm) {
    if (isEditing && !isEmpty(dirtyFields)) {
      navigate(-1);
      return;
    }
    await protocolSeasonMutation.mutateAsync(data);
  }

  const isSaving = protocolSeasonMutation.isPending;

  if (hasMalformedRouteParam) {
    return null;
  }

  return (
    <>
      <FormContainer
        title={isEditing ? formText.title.edit : formText.title.create}
        footer={
          <>
            <Button
              title={languageGB.defaltStrings?.cancel || 'Cancelar'}
              variant="outline"
              type="button"
              onClick={() => guardedNavigate(-1)}
            />
            {canSave && !editBlockedByMatings && (
              <ButtonSaveAndNext
                create={!isEditing}
                dirtyFields={dirtyFields}
                type="button"
                onClick={handleSubmit(onSubmit)}
                languageGB={languageGB}
                loading={isSaving || isSubmitting}
                disabled={isSaving || isSubmitting || !!isLoading}
              />
            )}
          </>
        }
      >
        <Form id="protocolSeason-form" noPadding onSubmit={handleSubmit(onSubmit)}>
          <SimpleGrid columns={columnsForm.default} gap={6}>
            <InputReadOnly
              name="code"
              label={formText.fields.code}
              value={watch('code') || '—'}
              loading={!isEditing && nextCodeQuery.isLoading}
            />

            <Controller
              name="date"
              control={control}
              render={({ field }) => (
                <DateInput
                  label={formText.fields.date}
                  value={field.value ?? null}
                  onChange={(value) => field.onChange(value ?? '')}
                  error={errors.date?.message}
                  isRequired
                  disabled={!canSave || !!isLoading}
                />
              )}
            />

            <InputReadOnly
              name="responsible"
              label={formText.fields.responsible}
              value={watch('user_name') || '—'}
              loading={!!isLoading}
            />

            <Controller
              name="breeding_season_uuid"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={formText.fields.breedingSeason}
                  service={listBreedingSeasons}
                  pageSize={200}
                  mapOptions={mapBreedingSeasonOption as any}
                  findParams={findParamsFromSearch}
                  value={field.value ?? undefined}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  error={error?.message}
                  isRequired
                  isDisabled={!canSave}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              )}
            />

            <Input
              label={formText.fields.name}
              {...register('name')}
              maxLength={200}
              error={errors.name?.message}
              isRequired
              loading={!!isLoading}
              disabled={!canSave}
            />

            <Textarea
              label={formText.fields.description}
              {...register('description')}
              maxLength={200}
              error={errors.description?.message}
              loading={!!isLoading}
              disabled={!canSave}
            />
          </SimpleGrid>

          <Box mt={6}>
            <ProtocolSeasonItemsFieldArray
              control={control}
              fields={itemsFieldArray.fields}
              append={itemsFieldArray.append}
              remove={itemsFieldArray.remove}
              errors={errors}
              setValue={setValue}
              trigger={trigger}
              headerDate={watchedHeaderDate}
              disabled={!canSave}
            />
          </Box>

          <Box mt={6}>
            <ProtocolSeasonTimelinePreview items={watchedItems} />
          </Box>
        </Form>
      </FormContainer>

      <DeleteConfirmDialog
        isOpen={isConfirmOpen}
        onClose={cancelNavigation}
        onConfirm={confirmNavigation}
        tone="warning"
        colorPalette="orange"
        title={formText.unsavedChangesDialog.title}
        description={formText.unsavedChangesDialog.description}
        confirmButtonText={formText.unsavedChangesDialog.confirmButton}
        hideQuestionMark
        warningText=""
      />
    </>
  );
}
