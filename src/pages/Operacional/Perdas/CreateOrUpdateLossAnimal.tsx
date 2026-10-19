// src/pages/Operacional/Perdas/CreateOrUpdateLossAnimal.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de PERDA (LossAnimal — Operacional /
// Pecuária). Feature F-043, execução 040 (TASK-FE-2774). Rotas:
// `/operacional/perdas/nova` (criar) e `/operacional/perdas/:lossAnimalUuid/
// editar` (editar) — ambas registradas em `src/router/index.tsx`, guardadas
// por `loss_animals_view` (a autorização granular create/edit é checada
// DENTRO da página via `usePermissions().can(...)`, contrato de tela §7.5.4).
//
// 8 campos server-side do form (contrato §7.3, linhas 10-17) — mandato de
// paridade EXATA com o `field_manifest`: Código (readonly, sem preview no
// create — §7.7.5), Data, Responsável (readonly, `user_uuid`/`user_name`
// NUNCA no payload — servidor deriva de `auth()->id()`), Lote (opcional,
// nullable — CORRIGIDO vs. `required` client-side do legado, DIV-005),
// Animal (obrigatório), Causa (obrigatório), Observação (opcional).
//
// ⚠️ TASK-FE-2780 (FID-043-02/03, homologação 040) — REVERTE DEC-LA-02:
// selecionar o Lote volta a restringir o autocomplete de Animal aos animais
// daquele lote (`GET /animals/options?batch_uuid=`, TASK-BE-1077) — o dono
// confirmou fidelidade ao legado (`resources/js/main.js:930-947`). Contrato
// de tela §7.7.1/SURF-036 recebeu nota de reversão. Restaura também a
// checagem de coerência temporal (`GET /loss-animals/check-date`,
// TASK-BE-1078) nos 3 gatilhos do legado (Animal/Lote/Data→Lote,
// `_forms.blade.php:47-93`) — mirror `CreateOrUpdateLoteReproducao.tsx::
// runCheckDateForRow`.
//
// Mirror estrutural: `CadastrosBase/CausaMortePerda/CreateOrUpdateCausaMortePerda.tsx`
// (casca `FormContainer` com `footer` como PROP — NÃO existe `<Form.Footer>`
// para telas de create/edit neste repo) + `Operacional/Nascimentos/
// CreateOrUpdateBirthAnimal.tsx` (campo `batch_uuid` nullable + autocomplete
// de animal via `SelectAsyncPaginate`, módulo farm-scoped real).
//
// ⚠️ UPDATE envia o payload COMPLETO (full-resource-replace, contrato
// §7.5.2/API §3.6) — NUNCA um PATCH parcial calculado por `dirtyFields`.
// `dirtyFields` serve SÓ para a guarda de `fillLossAnimalForm` (Lei 2) e para
// habilitar/desabilitar o botão de salvar.
// -----------------------------------------------------------------------------

import { useEffect, useRef } from 'react';

import { Box, SimpleGrid } from '@chakra-ui/react';
import { isAxiosError } from 'axios';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { Textarea } from '@/components/Form/Textarea';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';
import { todayLocalIso } from '@/utils/localDate';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { lossAnimalSchemaResolver } from '@/validations/schemas/LossAnimal/lossAnimal-schema';

import { listAnimalOptions } from '@/services/v2/Animals/animal-service';
import { listBatchOptionsForForm } from '@/services/v2/Batches/batch-service';
import { listDeathLossOptions } from '@/services/v2/DeathLosses/death-loss-service';
import {
  checkLossAnimalDate,
  createLossAnimal,
  updateLossAnimal,
} from '@/services/v2/Operacional/Pecuaria/lossAnimal-service';

import type { AnimalOptionListItem } from '@/@types/v2/Animals';
import type { BatchOption } from '@/@types/v2/Batches';
import type { DeathLossOptionRef } from '@/@types/v2/DeathLosses';
import type {
  CreateOrUpdateLossAnimalRequest,
  LossAnimalData,
  LossAnimalForm as LossAnimalFormType,
} from '@/@types/v2/Operacional/Pecuaria/lossAnimal';

import { useLossAnimalForm } from './useLossAnimals';

const LOSS_ANIMALS_LIST_ROUTE = '/operacional/perdas';

export default function CreateOrUpdateLossAnimal() {
  const { lossAnimalUuid } = useParams<{ lossAnimalUuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const { user } = useAuth();

  const text = languageGB.lossAnimals.lossAnimal;
  const formText = text.form;

  const isEditing = isValidGuid(lossAnimalUuid);

  // Guard de navegação: `lossAnimalUuid` presente mas malformado não deve
  // chegar ao hook de query nem renderizar um form "fantasma" (mirror
  // `CreateOrUpdateCausaMortePerda.tsx`/`CreateOrUpdateBirthAnimal.tsx`).
  useEffect(() => {
    if (lossAnimalUuid && !isValidGuid(lossAnimalUuid)) {
      navigate(LOSS_ANIMALS_LIST_ROUTE, { replace: true });
    }
  }, [lossAnimalUuid, navigate]);

  const canEdit = can('loss_animals_edit');
  const canCreate = can('loss_animals_create');
  const canSave = isEditing ? canEdit : canCreate;

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    clearErrors,
    watch,
    getValues,
    formState: { errors, dirtyFields, isSubmitting },
  } = useForm<LossAnimalFormType>({
    mode: 'onChange',
    resolver: lossAnimalSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      code: '',
      date: todayLocalIso(),
      user_uuid: '',
      user_name: '',
      batch_uuid: null,
      animal_uuid: null,
      cause_uuid: null,
      note: '',
    },
  });

  // Responsável (create) — deriva do usuário autenticado. NUNCA um `Select`
  // editável (contrato §7.3 linha 12/13) — `setValue` com `shouldDirty:
  // false` para não marcar o form como sujo por causa de estado interno.
  useEffect(() => {
    if (!isEditing && user) {
      setValue('user_uuid', user.uuid, { shouldDirty: false });
      setValue('user_name', user.username ?? '', { shouldDirty: false });
    }
  }, [isEditing, user, setValue]);

  const checkDateText = formText.validation.checkDate;

  // TASK-FE-2780 (§2, check-date) — mirror `CreateOrUpdateLoteReproducao.tsx::
  // runCheckDateForRow`. `checkLossAnimalDate` já traduz o 422 em
  // `{valid:false, message}`; erro de rede/500 é RELANÇADO pelo service e
  // cai no `catch` abaixo SEM limpar o campo (spec §2 — só 422 é "inválido").
  async function runAnimalCheckDate(animalUuid: string, date: string) {
    if (!date) return;
    try {
      const result = await checkLossAnimalDate({ date, animal_uuid: animalUuid });
      if (!result.valid) {
        setValue('animal_uuid', null, { shouldDirty: true });
        setError('animal_uuid', {
          type: 'server',
          message: result.message || checkDateText.animalEntryAfterLossDate,
        });
        return;
      }
      clearErrors('animal_uuid');
    } catch {
      // Falha de rede/inesperada — não bloqueia nem limpa a seleção do
      // usuário; o submit real ainda passa pelo 422 do servidor (defesa em
      // camadas, `LossAnimalRequest`).
    }
  }

  async function runBatchCheckDate(batchUuid: string, date: string) {
    if (!date) return;
    try {
      const result = await checkLossAnimalDate({ date, batch_uuid: batchUuid });
      if (!result.valid) {
        setValue('batch_uuid', null, { shouldDirty: true });
        setError('batch_uuid', {
          type: 'server',
          message: result.message || checkDateText.batchCreationAfterMovementDate,
        });
        return;
      }
      clearErrors('batch_uuid');
    } catch {
      // Idem — rede/500 não limpa a seleção.
    }
  }

  // Cascata "mudar a Data re-checa o Lote" (`_forms.blade.php:68-70`, mirror
  // `CreateOrUpdateLoteReproducao.tsx` — cascata IG-03/IG-04). Guard por
  // `ref`: só dispara quando `date` MUDOU de verdade — evita loop na
  // hidratação inicial via `fillLossAnimalForm`. Mudar a Data NÃO re-checa o
  // Animal no legado — reproduzido como está (decisão de produto à parte).
  const watchedDate = watch('date');
  const previousDateRef = useRef(watchedDate);

  useEffect(() => {
    if (previousDateRef.current === watchedDate) return;
    previousDateRef.current = watchedDate;

    const currentBatch = getValues('batch_uuid');
    if (currentBatch?.value) {
      void runBatchCheckDate(currentBatch.value, watchedDate);
    }
  }, [watchedDate]);

  // Lei 2 — função NOMEADA com guarda `!isEmpty(dirtyFields) || resetForce`
  // (mirror `CausaMortePerda`/`Weaning` — `isEmpty()` real do projeto RETORNA
  // `true` quando o objeto TEM chaves, então `!isEmpty(dirtyFields)` é `true`
  // quando o form está LIMPO — a guarda abaixo está com a polaridade CORRETA
  // para a implementação real, ERRO-FE-001 conferido).
  function fillLossAnimalForm(data: LossAnimalData, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        code: data.code,
        date: data.date,
        // Null-safe (TASK-FE-2777) — registros legados migrados podem trazer
        // `user: null` (responsável só via `employee`). Precedência do
        // legado (`$item->employee->people->name ?? $item->user->people->name`,
        // agro365 `loss-animals/show.blade.php:51`): EMPLOYEE primeiro, mirror
        // `LossAnimalDetalhe.tsx`. `user_uuid` só existe no form para não
        // perder o valor no round-trip — NUNCA vai no payload (§ payload
        // completo acima).
        user_uuid: data.user?.uuid ?? '',
        user_name: data.employee?.name ?? data.user?.name ?? '—',
        batch_uuid: data.batch ? { value: data.batch.uuid, label: data.batch.description } : null,
        animal_uuid: data.animal
          ? { value: data.animal.uuid, label: data.animal.identification }
          : null,
        cause_uuid: { value: data.cause.uuid, label: data.cause.description },
        note: data.note ?? '',
      });
    }
  }

  const lossAnimalQuery = useLossAnimalForm({
    registrationId: isEditing ? lossAnimalUuid : undefined,
    fillForm: fillLossAnimalForm,
  });

  const isLoading = isEditing && checkLoadingStatus([lossAnimalQuery as any]);

  const lossAnimalMutation = useRequest({
    asyncFunction: tryPersistLossAnimal,
    entityName: text.singularLabel,
    queryKey: queryKey.lossAnimals.lossAnimals,
    queryKey2: queryKey.lossAnimals.lossAnimal,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  // Payload SEMPRE completo (create E update) — mirror contrato §7.5.2/API
  // §3.6. `user_uuid`/`farm_id`/`code`/`employee_id` NUNCA aqui (servidor-
  // derivados — §7.3 linhas 9/10/12).
  //
  // 422 mapeado POR CAMPO (`animal_uuid`/`cause_uuid`/`batch_uuid`/`date`,
  // `LossAnimalRequest::rules()` — contrato API §3.3) via `setError`, mirror
  // `CreateOrUpdateBirthAnimal.tsx` — nenhum nome de campo diverge entre
  // servidor e form nesta tela (diferente de Nascimentos), então nenhum
  // `mapServerFieldToFormField` é necessário. Rethrow preserva o toast
  // genérico de `useRequest` como fallback (TASK-FE-2776).
  async function tryPersistLossAnimal(data: LossAnimalFormType) {
    const payload: CreateOrUpdateLossAnimalRequest = {
      animal_uuid: data.animal_uuid!.value,
      cause_uuid: data.cause_uuid!.value,
      batch_uuid: data.batch_uuid?.value ?? null,
      date: data.date,
      note: data.note || null,
    };

    try {
      return isEditing && lossAnimalUuid
        ? await updateLossAnimal(lossAnimalUuid, payload)
        : await createLossAnimal(payload);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 422) {
        const fieldErrors = error.response.data?.errors as Record<string, string[]> | undefined;
        Object.entries(fieldErrors ?? {}).forEach(([field, messages]) => {
          if (messages?.[0]) {
            setError(field as keyof LossAnimalFormType, {
              type: 'server',
              message: messages[0],
            });
          }
        });
      }
      throw error;
    }
  }

  async function onSubmit(data: LossAnimalFormType) {
    if (isEditing && !isEmpty(dirtyFields)) {
      navigate(-1);
    } else {
      await lossAnimalMutation.mutateAsync(data);
    }
  }

  const isSaving = isSubmitting || lossAnimalMutation.isPending;

  const watchedCode = watch('code');
  const watchedUserName = watch('user_name');
  const watchedNote = watch('note');
  const noteLength = (watchedNote ?? '').length;
  // TASK-FE-2780 (§1) — alimenta `findParams`/`cacheUniqs` do Animal.
  const batchOption = watch('batch_uuid');

  if (lossAnimalUuid && !isValidGuid(lossAnimalUuid)) {
    return null;
  }

  return (
    <FormContainer
      title={isEditing ? formText.title.edit : formText.title.create}
      showDivider
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
              loading={isSaving}
              disabled={isSaving || isLoading}
            />
          )}
        </>
      }
    >
      <Form noPadding onSubmit={handleSubmit(onSubmit)}>
        <SimpleGrid columns={columnsForm.default} gap={6}>
          <InputReadOnly
            label={formText.fields.code}
            value={isEditing ? (watchedCode ?? '') : formText.fields.codePlaceholder}
            loading={isLoading}
          />

          <Controller
            name="date"
            control={control}
            render={({ field }) => (
              <DateInput
                value={field.value ?? null}
                onChange={(v) => field.onChange(v ?? '')}
                label={formText.fields.date}
                error={errors.date?.message as string | undefined}
                isRequired
                disabled={!canSave || isLoading}
              />
            )}
          />

          <InputReadOnly
            label={formText.fields.responsible}
            value={watchedUserName ?? ''}
            loading={isLoading}
          />

          <Controller
            name="batch_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={formText.fields.batch}
                placeholder={formText.placeholders.batch}
                error={errors.batch_uuid?.message as string | undefined}
                // Nullable de verdade no servidor (FID-LA-011, DIV-005) — SEM
                // `isRequired` (nem asterisco visual), diferente do legado.
                service={listBatchOptionsForForm}
                mapOptions={(item: BatchOption) => ({
                  label: item.label,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? null}
                onChange={(option: any) => {
                  field.onChange(option ?? null);
                  // TASK-FE-2780 (§1) — trocar o Lote invalida a seleção
                  // anterior de Animal (cascata Lote→Animal, `cacheUniqs`
                  // recarrega a lista) e re-roda o check-date do próprio Lote.
                  setValue('animal_uuid', null, { shouldDirty: true });
                  if (option?.value) {
                    void runBatchCheckDate(option.value, getValues('date'));
                  } else {
                    clearErrors('batch_uuid');
                  }
                }}
                // FID-G5 (execução 040) — legado trava Lote na EDIÇÃO
                // (`_forms.blade.php`); o Cerne deixava editável e o UPDATE
                // não ajusta `Animal.status`, gerando risco de inconsistência
                // (perda reatribuída sem realocar o animal no lote). Só
                // desabilita por `isEditing` além do gate normal — CRIAÇÃO
                // permanece inalterada.
                isDisabled={!canSave || isLoading || isEditing}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="animal_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={formText.fields.animal}
                placeholder={formText.placeholders.animal}
                error={errors.animal_uuid?.message as string | undefined}
                // TASK-FE-2780 (§1) — REVERTE DEC-LA-02: `batch_uuid` do Lote
                // selecionado entra no `findParams` e no `cacheUniqs` — sem
                // lote, o parâmetro fica `undefined` (todos os animais da
                // fazenda, comportamento anterior preservado).
                service={listAnimalOptions}
                mapOptions={(item: AnimalOptionListItem) => ({
                  label: item.label,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                  batch_uuid: batchOption?.value,
                })}
                cacheUniqs={[batchOption?.value]}
                value={field.value ?? null}
                onChange={(option: any) => {
                  field.onChange(option ?? null);
                  if (option?.value) {
                    void runAnimalCheckDate(option.value, getValues('date'));
                  } else {
                    clearErrors('animal_uuid');
                  }
                }}
                isRequired
                // FID-G5 (execução 040) — mesma trava do Lote acima: o
                // legado não permite reatribuir o Animal na EDIÇÃO (o
                // UPDATE não reajusta `Animal.status`).
                isDisabled={!canSave || isLoading || isEditing}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="cause_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={formText.fields.cause}
                placeholder={formText.placeholders.cause}
                error={errors.cause_uuid?.message as string | undefined}
                service={listDeathLossOptions}
                mapOptions={(item: DeathLossOptionRef) => ({
                  label: item.description,
                  value: item.uuid,
                })}
                findParams={() => ({ cause: 'P' })}
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                isRequired
                isDisabled={!canSave || isLoading}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />
        </SimpleGrid>

        <Box mt={6}>
          <Textarea
            label={formText.fields.note}
            placeholder={formText.placeholders.note}
            maxLength={1000}
            helperText={errors.note?.message ? undefined : `${noteLength}/1000`}
            {...register('note')}
            error={errors.note?.message as string | undefined}
            loading={isLoading}
            disabled={!canSave}
          />
        </Box>
      </Form>
    </FormContainer>
  );
}
