// src/pages/Operacional/Weaning/CreateOrUpdateWeaning.tsx
// -----------------------------------------------------------------------------
// Form único de criar/editar Desmama (`SURFACE-WEANINGS-CREATE`/`-EDIT`/
// `-SHOW` — sem tela de visualização dedicada, abrir em modo editar É a
// visualização, mirror `02-arquitetura-frontend-desmama.md §4.2`).
//
// Cascata `batch_uuid → animal_uuids` (IG-01, `useCascadesWeaning`);
// `type`/`code` imutáveis no editar (`InputReadOnly`, mirror CLM-030 —
// nunca enviados no update, `WeaningRequest` real não os aceita fora do
// POST); gate `finished_processing` desabilita todo o form (GAP-WN-03, a
// API reforça com 422 — a UI só evita a tentativa óbvia).
//
// `animal_uuids` é o uuid do `Animal` MÃE (NÃO o bezerro) — confirmado por
// leitura direta de `WeaningData`/`StoreWeaningAction` reais. Hidratação em
// editar usa `animals[].mother` do `WeaningResource` (nunca `animals[].uuid`,
// que é o uuid do BirthAnimal/bezerro, inútil para re-selecionar a mãe).
//
// Handoff Desmama→Venda (tipo Venda) — TASK-WN-FE-07, Opção B decidida em
// `GAP-WN-FE-01` (decisão do dono, `DEC-070` Addendum/MARCO 105): só na
// CRIAÇÃO de uma Desmama tipo Venda, ao suceder o `createWeaning`, navega
// para `/operacional/venda-animais/novo?model=weaning&model_id=<uuid>` em vez
// da listagem (`actionSuccess` do `weaningMutation`, abaixo). Nenhuma
// `MovementSale` é criada aqui — o pré-vínculo só é persistido quando o
// usuário submete o form de Venda (`CreateOrUpdateMovementSale.tsx`, que lê
// `model`/`model_id` da URL). Edição (`isEditing`) nunca dispara o handoff,
// mesmo com `type===Venda` — o efeito é do CRIAR (mirror
// `SIDE_EFFECT-CREATE-MOVEMENTSALE-DRAFT`), e `type` é imutável no editar.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Box, SimpleGrid } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { Field } from '@/components/Form/Field';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';
import { Tooltip } from '@/components/TooLtip';
import { toaster } from '@/components/ui/toaster';

import { useAuth } from '@/hooks/useAuth';
import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';
import { weaningTypeOptions } from '@/constants/weaning/options/weaning-type-options';
import { weaningType } from '@/constants/weaning/weaning-type';

import { weaningSchemaResolver } from '@/validations/schemas/Weaning/weaning-schema';

import { listBatchOptionsForForm } from '@/services/v2/Batches/batch-service';
import {
  createWeaning,
  getWeaningByUuid,
  lookupAnimalsForWeaning,
  mapWeaningLookupAnimalToOption,
  updateWeaning,
} from '@/services/v2/Weaning/weaning-service';

import type { BatchOption } from '@/@types/v2/Batches';
import type {
  CreateWeaningRequest,
  UpdateWeaningRequest,
  WeaningData,
  WeaningForm as WeaningFormType,
} from '@/@types/v2/Weaning';

import { useCascadesWeaning } from './useCascadesWeaning';

const WEANING_LIST_ROUTE = '/operacional/desmame';
// Rota de criação de Venda (`Operacional/VendaAnimais/CreateOrUpdateMovementSale.tsx`,
// registrada em `src/router/index.tsx`) — destino do handoff (Opção B).
const VENDA_ANIMAIS_NOVO_ROUTE = '/operacional/venda-animais/novo';

const defaultValues: WeaningFormType = {
  date: null,
  type: null,
  batch_uuid: null,
  transfer_batch_uuid: null,
  animal_uuids: [],
};

export default function CreateOrUpdateWeaning() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const { user: authUser } = useAuth();

  const isEditing = isValidGuid(uuid);
  const text = languageGB.weaning.weaning;
  const formText = text.form;

  // Rota "/visualizar" reaproveita o componente, forçada somente-leitura
  // (mirror `CreateOrUpdateFinancialFreeze.tsx`). UT-000794 item 2.
  const isViewOnlyRoute = location.pathname.endsWith('/visualizar');

  const canSave = !isViewOnlyRoute && (isEditing ? can('weaning_edit') : can('weaning_create'));

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<WeaningFormType>({
    mode: 'onChange',
    resolver: weaningSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues,
  });

  const { handleBatchChange } = useCascadesWeaning({ setValue });

  // ✅ Lei 2: função nomeada com guarda de dirtyFields.
  function fillWeaningForm(data: WeaningData, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      const seenMotherUuids = new Set<string>();
      const animalOptions = (data.animals ?? [])
        .map((item) => item.mother)
        .filter((mother): mother is { uuid: string; identification: string } => !!mother)
        .filter((mother) => {
          if (seenMotherUuids.has(mother.uuid)) return false;
          seenMotherUuids.add(mother.uuid);
          return true;
        })
        .map((mother) => ({ label: mother.identification, value: mother.uuid }));

      reset({
        date: data.date,
        type: weaningTypeOptions.getOption(data.type, languageGB),
        batch_uuid: data.batch ? { label: data.batch.description, value: data.batch.uuid } : null,
        transfer_batch_uuid: data.transfer_batch
          ? { label: data.transfer_batch.description, value: data.transfer_batch.uuid }
          : null,
        animal_uuids: animalOptions,
      });
    }
  }

  const weaningQuery = useCustomFormQueryByGuid<WeaningData>({
    registrationId: isEditing ? uuid : undefined,
    queryKey: queryKey.weaning.weaning,
    asyncFunction: getWeaningByUuid,
    fillForm: fillWeaningForm,
  });

  // `useCustomFormQueryByGuid` tipa o retorno como `Response<TData>` (sem
  // `isError`/`isLoading`) embora o objeto real em runtime seja o
  // `UseQueryResult` do TanStack Query — mesma divergência já contornada
  // com `as any` em `checkLoadingStatus` (abaixo) e em outros módulos
  // (`ProdutoDetalhe.tsx`/`MovementSaleDocumentsModal.tsx`: `(query as
  // any).isError`). Não é o hook que expõe `isError` errado — é só a
  // assinatura de tipo do hook que mente sobre o shape real.
  const weaningQueryIsError = (weaningQuery as any).isError as boolean;

  // 404 (outro tenant) / erro de leitura em modo editar → toast + volta à
  // lista (mirror do racional já aplicado nas listagens do domínio; esta
  // camada de form não tinha essa guarda em nenhum sibling lido, mas o
  // contrato de tela (`02-arquitetura-frontend-desmama.md §2`) exige).
  useEffect(() => {
    if (isEditing && weaningQueryIsError) {
      toaster.error({
        title: text.singularLabel,
        description: text.list.error.message,
        duration: 7000,
      });
      navigate(WEANING_LIST_ROUTE);
    }
  }, [isEditing, weaningQueryIsError]);

  const isLoading = isEditing && checkLoadingStatus([weaningQuery as any]);
  const finishedProcessing = isEditing && !!weaningQuery.data?.finished_processing;
  const isDisabled = !canSave || !!isLoading || finishedProcessing;

  const watchedBatch = watch('batch_uuid');

  // D1: somente leitura, fora do schema/payload. Criar = usuário logado; editar = `responsible` da API.
  const responsibleLabel = isEditing
    ? (weaningQuery.data?.responsible?.name ?? '—')
    : (authUser?.username ?? '—');

  // Cascata IG-01 — `lookupAnimalsForWeaning` filtrado pelo `batch_uuid`
  // corrente (closure sobre `watchedBatch`), mirror EXATO de
  // `HeaderFieldsPastagem.tsx` (`listAnimalsByBatch`/`watchedBatch`).
  // `LookupAnimalsForWeaningAction` real não aceita busca textual — só
  // `batch_uuid` — por isso `findParams` do select não tem para onde
  // mandar o texto digitado (SEM MOCK de uma busca que a API não tem).
  function lookupAnimalsByBatch(params: { page?: number; per_page?: number }) {
    return lookupAnimalsForWeaning({ ...params, batch_uuid: watchedBatch?.value });
  }

  // Lote de transferência: exclui o lote de origem selecionado (a API grava
  // null em silêncio se forem iguais). Usa a variante de form (sem "Sem lote").
  async function listTransferBatchOptions(params: Parameters<typeof listBatchOptionsForForm>[0]) {
    const result = await listBatchOptionsForForm(params);
    const originUuid = watchedBatch?.value;
    if (!originUuid) return result;
    const items = result.data.items.filter((item) => item.uuid !== originUuid);
    return {
      ...result,
      data: {
        ...result.data,
        items,
        pagination: { ...result.data.pagination, total: items.length, count: items.length },
      },
    };
  }

  async function tryPersistWeaning(data: WeaningFormType) {
    const basePayload = {
      date: data.date!,
      batch_uuid: data.batch_uuid!.value,
      transfer_batch_uuid: data.transfer_batch_uuid?.value,
      animal_uuids: data.animal_uuids.map((option) => option.value),
    };

    if (isEditing && uuid) {
      const updatePayload: UpdateWeaningRequest = basePayload;
      return updateWeaning(uuid, updatePayload);
    }

    const createPayload: CreateWeaningRequest = {
      ...basePayload,
      type: data.type!.value,
    };
    return createWeaning(createPayload);
  }

  const weaningMutation = useRequest<WeaningData>({
    asyncFunction: tryPersistWeaning,
    entityName: text.singularLabel,
    queryKey: queryKey.weaning.weanings,
    queryKey2: queryKey.weaning.weaning,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: (data) => {
      // Handoff Desmama→Venda (Opção B) — só na CRIAÇÃO de uma Desmama tipo
      // Venda. `data.uuid` vem do envelope real (`WeaningResource`), nunca
      // fabricado; nenhuma `MovementSale` é criada por esta navegação.
      if (!isEditing && data.type === weaningType.venda) {
        navigate(
          `${VENDA_ANIMAIS_NOVO_ROUTE}?${new URLSearchParams({
            model: 'weaning',
            model_id: data.uuid,
          }).toString()}`
        );
        return;
      }
      navigate(WEANING_LIST_ROUTE);
    },
  });

  const isPersisting = weaningMutation.isPending;

  return (
    <FormContainer
      title={
        isViewOnlyRoute
          ? formText.title.view
          : isEditing
            ? formText.title.edit
            : formText.title.create
      }
      footer={
        <>
          <Button
            title={isViewOnlyRoute ? formText.buttons.back : languageGB.defaltStrings.cancel}
            variant="outline"
            onClick={() => (isViewOnlyRoute ? navigate(WEANING_LIST_ROUTE) : navigate(-1))}
            type="button"
            disabled={isPersisting}
          />
          {isViewOnlyRoute && can('weaning_edit') && (
            <Tooltip
              content={formText.finishedProcessingTooltip}
              disabled={!finishedProcessing}
              positioning={{ placement: 'top' }}
            >
              {/* Gatilho no wrapper: botão `disabled` não dispara eventos de ponteiro. */}
              <Box
                as="span"
                display="inline-block"
                tabIndex={finishedProcessing ? 0 : undefined}
                cursor={finishedProcessing ? 'not-allowed' : undefined}
              >
                <Button
                  title={formText.buttons.edit}
                  type="button"
                  onClick={() => navigate(`${WEANING_LIST_ROUTE}/${uuid}`)}
                  disabled={!!isLoading || finishedProcessing}
                />
              </Box>
            </Tooltip>
          )}
          {canSave && (
            <Tooltip
              content={formText.finishedProcessingTooltip}
              disabled={!finishedProcessing}
              positioning={{ placement: 'top' }}
            >
              <Box
                as="span"
                display="inline-block"
                tabIndex={finishedProcessing ? 0 : undefined}
                cursor={finishedProcessing ? 'not-allowed' : undefined}
              >
                <Button
                  title={languageGB.defaltStrings.save}
                  type="submit"
                  form="weaning-form"
                  loading={isPersisting}
                  disabled={isPersisting || !!isLoading || finishedProcessing}
                />
              </Box>
            </Tooltip>
          )}
        </>
      }
    >
      <Form
        id="weaning-form"
        onSubmit={handleSubmit((data) => weaningMutation.mutateAsync(data))}
        noPadding
      >
        <SimpleGrid columns={columnsForm.default} gap={6}>
          {isEditing && (
            <InputReadOnly
              name="code"
              label={formText.fields.code}
              value={weaningQuery.data?.code ?? ''}
            />
          )}

          <InputReadOnly
            name="responsible"
            label={formText.fields.responsible}
            value={responsibleLabel}
          />

          <Controller
            name="date"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field label={formText.fields.date} isRequired errorText={errors.date?.message}>
                <DateInput value={value ?? null} onChange={onChange} disabled={isDisabled} />
              </Field>
            )}
          />

          {isEditing ? (
            <InputReadOnly
              name="type"
              label={formText.fields.type}
              value={
                weaningQuery.data
                  ? weaningTypeOptions.getLabel(weaningQuery.data.type, languageGB)
                  : ''
              }
            />
          ) : (
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select
                  name={field.name}
                  label={formText.fields.type}
                  placeholder={formText.placeholders.type}
                  isRequired
                  isDisabled={isDisabled}
                  error={errors.type?.message as string | undefined}
                  options={weaningTypeOptions.options(languageGB)}
                  value={field.value}
                  onChange={(option) => field.onChange(option ?? null)}
                />
              )}
            />
          )}

          <Controller
            name="batch_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={formText.fields.batch}
                placeholder={formText.placeholders.batch}
                error={errors.batch_uuid?.message as string | undefined}
                isRequired
                isDisabled={isDisabled}
                service={listBatchOptionsForForm}
                mapOptions={(item: BatchOption) => ({ label: item.label, value: item.uuid })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? null}
                onChange={(option: any) => {
                  field.onChange(option ?? null);
                  handleBatchChange();
                  // Origem passou a ser igual à transferência → limpa a transferência.
                  if (option?.value && option.value === watch('transfer_batch_uuid')?.value) {
                    setValue('transfer_batch_uuid', null, { shouldDirty: true });
                  }
                }}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="transfer_batch_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={formText.fields.transferBatch}
                placeholder={formText.placeholders.transferBatch}
                isDisabled={isDisabled}
                service={listTransferBatchOptions}
                mapOptions={(item: BatchOption) => ({ label: item.label, value: item.uuid })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                error={errors.transfer_batch_uuid?.message as string | undefined}
                cacheUniqs={[watchedBatch?.value]}
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="animal_uuids"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                isMulti
                name={field.name}
                label={formText.fields.animals}
                placeholder={formText.placeholders.animals}
                error={errors.animal_uuids?.message as string | undefined}
                helperText={!watchedBatch ? formText.hints.selectBatchFirst : undefined}
                isRequired
                isDisabled={isDisabled || !watchedBatch}
                service={lookupAnimalsByBatch}
                mapOptions={mapWeaningLookupAnimalToOption}
                findParams={() => ({})}
                cacheUniqs={[watchedBatch?.value]}
                value={field.value ?? []}
                onChange={(options: any) => field.onChange(options ?? [])}
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
