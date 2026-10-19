// src/pages/Operacional/FeedingPhase/CreateOrUpdateFeedingPhase.tsx
// -----------------------------------------------------------------------------
// Formulário ÚNICO de criação/edição/visualização de Fase de Alimentação
// (FeedingPhase — Operacional/Pecuária/Confinamento, F-034, TASK-FP-FE-03).
// Rotas `/operacional/fases-alimentacao/novo` (criar) e
// `/operacional/fases-alimentacao/:feedingPhaseId` (editar) — conectadas em
// TASK-FP-FE-04, fora do escopo deste arquivo. Modo VIEW por flag
// (`!canSave` desabilita todos os campos, mirror EXATO
// `CreateOrUpdateDiet.tsx` — sem rota dedicada de "show", contrato de tela
// §2 nota SURF-SHOW).
//
// ORDEM dos campos de cabeçalho (contrato de tela §4.1): `code` (readonly)
// → `user`/"Funcionário Responsável" (readonly, NÃO é campo RHF) → `date` →
// `name` ("Nome da Fase", maxLength 120) → `observation` (Textarea, maxLength
// 1500).
//
// `useFieldArray({ name: 'items' })` vive AQUI (formulário pai) —
// `FeedingPhaseItemsEditor` recebe `fields`/`append`/`remove` via props.
//
// PUT sempre envia o payload COMPLETO (replace-all, mirror `DA-FOOD-06`/
// `Diet`) — confirmado por leitura direta: `ItemFeedingPhaseData` não
// transporta `sequence`/`item_id`, a composição inteira é substituída em
// cada `PUT`. `code`/`user_id`/`sequence`/`item_id` NUNCA no wire.
// -----------------------------------------------------------------------------

import { Box, SimpleGrid } from '@chakra-ui/react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { Textarea } from '@/components/Form/Textarea';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';
import { feedingPhaseChangeRuleOptions } from '@/constants/feeding-phase/options';
import { queryKey } from '@/constants/query-key';

import { feedingPhaseSchemaResolver } from '@/validations/schemas/FeedingPhase/feeding-phase-schema';

import {
  createFeedingPhase,
  updateFeedingPhase,
} from '@/services/v2/FeedingPhases/feeding-phase-service';

import type {
  FeedingPhaseDetail,
  FeedingPhaseForm as FeedingPhaseFormType,
  FeedingPhaseItemPayload,
  FeedingPhasePayload,
} from '@/@types/v2/FeedingPhases';

import { FeedingPhaseItemsEditor } from './FeedingPhaseItemsEditor';
import { useFeedingPhaseForm } from './useFeedingPhaseForm';

import type { FeedingPhaseItemsFieldValues } from './FeedingPhaseItemRow';
import type { UseFieldArrayAppend } from 'react-hook-form';

export default function CreateOrUpdateFeedingPhase() {
  const { feedingPhaseId } = useParams<{ feedingPhaseId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const { user: authUser } = useAuth();
  const text = languageGB.feedingPhases.feedingPhase;

  // É edição quando existe um GUID válido na rota ("novo" não é GUID) —
  // mirror `CreateOrUpdateDiet`.
  const isEditing = isValidGuid(feedingPhaseId);

  const canSave = isEditing ? can('feeding-phases_edit') : can('feeding-phases_create');

  const {
    control,
    register,
    handleSubmit,
    reset,
    getValues,
    setError,
    clearErrors,
    formState: { errors, dirtyFields },
  } = useForm<FeedingPhaseFormType>({
    mode: 'onChange',
    resolver: feedingPhaseSchemaResolver(languageGB),
    reValidateMode: 'onChange',
    defaultValues: {
      date: '',
      name: '',
      observation: '',
      // Mirror `CreateOrUpdateDiet` — o create nasce com 1 item vazio
      // pronto para editar; a EDIÇÃO sobrescreve este default via `reset()`
      // dentro de `fillForm` com os itens reais.
      items: isEditing
        ? []
        : [
            {
              diet_id: null,
              change_rule: feedingPhaseChangeRuleOptions.getOption('PD', languageGB),
              minimum_start: '',
              maximum_end: '',
            },
          ],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  // Lei 2 — função NOMEADA com guarda de `dirtyFields` (nunca `reset` inline
  // em `useEffect`).
  function fillForm(data: FeedingPhaseDetail, resetForce?: boolean) {
    if (Object.keys(dirtyFields).length > 0 && !resetForce) return;

    reset({
      date: data.date ? data.date.slice(0, 10) : '',
      name: data.name,
      observation: data.observation ?? '',
      items: (data.items ?? []).map((item) => ({
        diet_id: item.diet
          ? {
              label: item.diet.description
                ? `${item.diet.code} — ${item.diet.description}`
                : item.diet.code,
              value: item.diet.uuid,
            }
          : null,
        change_rule: feedingPhaseChangeRuleOptions.getOption(item.change_rule.value, languageGB),
        minimum_start: item.minimum_start,
        maximum_end: item.maximum_end,
      })),
    });
  }

  const feedingPhaseQuery = useFeedingPhaseForm({
    registrationId: isEditing ? feedingPhaseId : undefined,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([feedingPhaseQuery as any]);
  const feedingPhaseDetail = (feedingPhaseQuery as any)?.data as FeedingPhaseDetail | undefined;

  const feedingPhaseMutation = useRequest({
    asyncFunction: tryPersistFeedingPhase,
    entityName: text.singularLabel,
    queryKey: queryKey.feedingPhases.feedingPhases,
    queryKey2: queryKey.feedingPhases.feedingPhase,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  async function tryPersistFeedingPhase(data: FeedingPhaseFormType) {
    const itemsPayload: FeedingPhaseItemPayload[] = data.items.map((item) => ({
      diet_uuid: item.diet_id!.value,
      change_rule: item.change_rule!.value,
      minimum_start: Number(item.minimum_start),
      maximum_end: Number(item.maximum_end),
    }));

    // PUT sempre envia o payload COMPLETO (replace-all, mirror `Diet`) — sem
    // branch de update parcial por `dirtyFields`. SEM `code`/`user_id`/
    // `sequence`/`item_id`.
    const payload: FeedingPhasePayload = {
      date: data.date,
      name: data.name,
      observation: data.observation || null,
      items: itemsPayload,
    };

    if (isEditing && feedingPhaseId) {
      return await updateFeedingPhase(feedingPhaseId, payload);
    }
    return await createFeedingPhase(payload);
  }

  // Guard EXPLÍCITO (`Object.keys(dirtyFields).length === 0`), mirror
  // `CreateOrUpdateDiet`.
  async function onSubmit(data: FeedingPhaseFormType) {
    if (isEditing && Object.keys(dirtyFields).length === 0) {
      navigate(-1);
      return;
    }
    await feedingPhaseMutation.mutateAsync(data);
  }

  const isSubmitting = feedingPhaseMutation.isPending;

  return (
    <FormContainer
      title={isEditing ? text.form.title.edit : text.form.title.create}
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
              disabled={isSubmitting || isLoading}
            />
          )}
        </>
      }
    >
      <Form noPadding onSubmit={handleSubmit(onSubmit)}>
        {/* Cabeçalho, ORDEM FIEL ao contrato de tela §4.1: code → user
            (Funcionário Responsável) → date → name → observation. */}
        <SimpleGrid columns={columnsForm.fourColumns} gap={6}>
          <InputReadOnly
            name="code"
            label={text.form.fields.code}
            value={isEditing ? (feedingPhaseDetail?.code ?? '—') : '—'}
            loading={isLoading}
          />

          <InputReadOnly
            label={text.form.fields.responsible}
            value={
              isEditing ? (feedingPhaseDetail?.user?.name ?? '—') : (authUser?.username ?? '—')
            }
            loading={isLoading}
          />

          <Controller
            name="date"
            control={control}
            render={({ field }) => (
              <DateInput
                value={field.value ?? null}
                onChange={(value) => field.onChange(value ?? '')}
                label={text.form.fields.date}
                error={errors.date?.message}
                isRequired
                disabled={!canSave}
              />
            )}
          />

          <Input
            label={text.form.fields.name}
            maxLength={120}
            {...register('name')}
            error={errors.name?.message}
            isRequired
            loading={isLoading}
            disabled={!canSave}
          />
        </SimpleGrid>

        <Box mt={6}>
          <Textarea
            label={text.form.fields.observation}
            maxLength={1500}
            {...register('observation')}
            error={errors.observation?.message}
            disabled={!canSave}
          />
        </Box>

        {/* Composição (itens) — `FeedingPhaseItemsEditor`. `useFieldArray`
            vive AQUI (pai). */}
        <Box mt={6}>
          <FeedingPhaseItemsEditor
            control={control}
            fields={fields}
            // Cast pragmático — mesmo racional de `CreateOrUpdateDiet`.
            append={append as unknown as UseFieldArrayAppend<FeedingPhaseItemsFieldValues, 'items'>}
            remove={remove}
            errors={errors}
            getValues={getValues}
            setError={setError}
            clearErrors={clearErrors}
            languageGB={languageGB}
            disabled={!canSave}
          />
        </Box>
      </Form>
    </FormContainer>
  );
}
