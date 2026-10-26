// src/pages/Operacional/FeedlotYards/CreateOrUpdateFeedlotYard.tsx
// -----------------------------------------------------------------------------
// Tela de CRIAÇÃO e EDIÇÃO de PÁTIO (FeedlotYard) — Operacional/Confinamento.
// Rotas: /operacional/patios/novo (criar, TASK-PT-FE-02) e
// /operacional/patios/:feedlotYardUuid (editar, GUID).
//
// Mirror `CadastrosBase/CentroCusto/CreateOrUpdateCentroCusto.tsx` (sibling
// estrutural PRIMÁRIO) SEM hierarquia/`parent_uuid` (FeedlotYard é FLAT) e
// SEM sub-recursos (5 campos simples, sem tabs/field-array).
//
// Pontos de atenção (fiéis ao contrato de tela):
//   - `code` NUNCA é `<Input>`/`register('code')` — bloco read-only fora do
//     `<Form>`, real em edição, hint "gerado automaticamente" no create;
//   - `area` é 100% DERIVADA (`width*length`) via `useWatch` — texto
//     estático, recalculado a cada keystroke, NUNCA entra no payload
//     (`CreateFeedlotYardRequest`/`UpdateFeedlotYardRequest` não a declaram);
//   - `width`/`length` são campos NUMÉRICOS (`NumberInput`, Controller) —
//     sem máscara de milhar/decimal brasileira (só o preview de `area` usa
//     `Intl.NumberFormat` para EXIBIÇÃO);
//   - `observation` tem contador `x/600` inline (sem componente dedicado no
//     `frontend_root`) — a validação Yup `max(600)` já bloqueia o submit;
//   - `fillForm` guarda `dirtyFields` (Lei 2) — sem `reset()` inline em
//     `useEffect`; `dirtyFields` também guarda o guard de "nada mudou" no
//     `onSubmit` (via `Object.keys(dirtyFields).length`, NUNCA `isEmpty`,
//     que tem semântica invertida). O update de edição, porém, envia
//     payload COMPLETO — a API exige `name`/`width`/`length`/`is_active`
//     como `required` no PUT/PATCH (só `observation` é nullable), então
//     PATCH parcial por `dirtyFields` quebraria com 422.
// -----------------------------------------------------------------------------

import { useMemo } from 'react';

import { Box, SimpleGrid, Skeleton, Text } from '@chakra-ui/react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { Textarea } from '@/components/Form/Textarea';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useLanguage } from '@/hooks/useLanguage';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { columnsForm } from '@/constants/coluns-form';
import { feedlotYardStatusOptions } from '@/constants/FeedlotYards/options/feedlot-yard-status-options';
import { queryKey } from '@/constants/query-key';

import { feedlotYardSchemaResolver } from '@/validations/schemas/FeedlotYards/feedlotYard-schema';

import {
  createFeedlotYard,
  updateFeedlotYard,
} from '@/services/v2/FeedlotYards/feedlot-yard-service';

import type { Option } from '@/@types/option';
import type {
  CreateFeedlotYardRequest,
  FeedlotYardDetail,
  FeedlotYardForm as FeedlotYardFormType,
  UpdateFeedlotYardRequest,
} from '@/@types/v2/FeedlotYards';

import { useFeedlotYardForm } from './useFeedlotYards';

// Formatação de "Área (m²)" — mirror listagem/detalhe — 2 casas, SEM símbolo
// monetário (é m², não R$).
const areaFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default function CreateOrUpdateFeedlotYard() {
  const { feedlotYardUuid } = useParams<{ feedlotYardUuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const text = languageGB.feedlotYards.feedlotYard;

  // É edição quando existe um GUID válido na rota ("novo" não é GUID).
  const isEditing = isValidGuid(feedlotYardUuid);

  const {
    control,
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors, dirtyFields },
  } = useForm<FeedlotYardFormType>({
    mode: 'onChange',
    resolver: feedlotYardSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      width: '',
      length: '',
      is_active: feedlotYardStatusOptions.getOption(true, languageGB),
      observation: '',
    },
  });

  function fillForm(data: FeedlotYardDetail, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        name: data.name,
        width: data.width ?? '',
        length: data.length ?? '',
        is_active: feedlotYardStatusOptions.getOption(!!data.is_active, languageGB),
        observation: data.observation ?? '',
      });
    }
  }

  const feedlotYardQuery = useFeedlotYardForm({
    registrationId: isEditing ? feedlotYardUuid : undefined,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([feedlotYardQuery as any]);
  const feedlotYardData = feedlotYardQuery.data as FeedlotYardDetail | undefined;

  const feedlotYardMutation = useRequest({
    asyncFunction: tryPersistFeedlotYard,
    entityName: text.singularLabel,
    queryKey: queryKey.feedlotYards.feedlotYards,
    queryKey2: queryKey.feedlotYards.feedlotYard,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  async function tryPersistFeedlotYard(data: FeedlotYardFormType) {
    if (isEditing && feedlotYardUuid) {
      // Update COMPLETO — a API (`FeedlotYardRequest`) exige `name`/`width`/
      // `length`/`is_active` como `required` no PUT/PATCH (só `observation`
      // é nullable). PATCH parcial (Lei 2) quebraria com 422 nos campos
      // ausentes sempre que só 1 campo estivesse `dirty`. `area`/`code`/
      // `priority` NUNCA entram aqui.
      const payload: UpdateFeedlotYardRequest = {
        name: data.name,
        width: Number(data.width),
        length: Number(data.length),
        is_active: data.is_active.value,
        observation: data.observation || undefined,
      };
      return updateFeedlotYard(feedlotYardUuid, payload);
    }

    const payload: CreateFeedlotYardRequest = {
      name: data.name,
      width: Number(data.width),
      length: Number(data.length),
      is_active: data.is_active.value,
      observation: data.observation || undefined,
    };
    return createFeedlotYard(payload);
  }

  async function onSubmit(data: FeedlotYardFormType) {
    // `isEmpty` (src/utils/isEmpty.ts) tem semântica invertida: retorna
    // `true` quando o objeto TEM chaves. O guard correto de "nada mudou"
    // é checar o tamanho de `dirtyFields` diretamente.
    if (isEditing && Object.keys(dirtyFields).length === 0) {
      navigate(-1);
      return;
    }
    await feedlotYardMutation.mutateAsync(data);
  }

  const isSubmitting = feedlotYardMutation.isPending;

  const statusOptions: Option<boolean>[] = useMemo(
    () => feedlotYardStatusOptions.options(languageGB),
    [languageGB]
  );

  const displayCode = isEditing ? feedlotYardData?.code : text.form.hints.codeGenerated;

  // `area` — 100% DERIVADA no cliente (`width*length`), feedback visual ao
  // vivo (`useWatch`), NUNCA entra no payload (Lei "Riscos" da Tarefa).
  const watchedWidth = useWatch({ control, name: 'width' });
  const watchedLength = useWatch({ control, name: 'length' });
  const areaPreview = useMemo(() => {
    const w = Number(watchedWidth) || 0;
    const l = Number(watchedLength) || 0;
    return areaFormatter.format(w * l);
  }, [watchedWidth, watchedLength]);

  // `useWatch` não reflete de forma confiável o valor populado por `reset()`
  // (via `fillForm`) no primeiro render pós-load da edição — o texto aparece
  // no textarea (ref imperativo do `register`), mas o valor "observado"
  // permanece vazio. Fallback em `getValues()` cobre esse instante: o
  // componente já re-renderiza após `reset()` (consome `errors`/`dirtyFields`
  // de `formState`), então o fallback lê o valor real assim que disponível,
  // sem introduzir estado local paralelo.
  const watchedObservation = useWatch({ control, name: 'observation' });
  const observationLength = (watchedObservation || getValues('observation') || '').length;

  return (
    <FormContainer
      title={isEditing ? text.form.title.edit : text.form.title.create}
      footer={
        <>
          <Button
            title={languageGB.defaltStrings.cancel}
            variant="secondary"
            type="button"
            onClick={() => navigate(-1)}
          />
          <ButtonSaveAndNext
            create={!isEditing}
            dirtyFields={dirtyFields}
            type="button"
            onClick={handleSubmit(onSubmit)}
            languageGB={languageGB}
            loading={isSubmitting}
            disabled={isSubmitting || isLoading}
          />
        </>
      }
    >
      <Form id="feedlotYard-form" noPadding onSubmit={handleSubmit(onSubmit)}>
        {/* Código gerado — SEMPRE texto estático (nunca `Input`/`register`), real em edição. */}
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
            <Box>
              <Text
                fontSize="xs"
                fontWeight="semibold"
                color="fg.muted"
                textTransform="uppercase"
                letterSpacing="wide"
              >
                {text.form.fields.code}
              </Text>
              <Text fontSize="md" fontWeight="bold" fontFamily="mono">
                {displayCode}
              </Text>
            </Box>
          </Skeleton>
        </Box>

        <SimpleGrid columns={columnsForm.default} gap={6}>
          <Input
            label={text.form.fields.name}
            placeholder={text.form.placeholders.name}
            {...register('name')}
            error={errors.name?.message}
            isRequired
            loading={!!isLoading}
          />

          <Controller
            name="is_active"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <Select
                label={text.form.fields.isActive}
                name={name}
                value={value}
                onChange={onChange}
                options={statusOptions}
                error={error?.message}
                isRequired
                loading={!!isLoading}
              />
            )}
          />

          <Controller
            name="width"
            control={control}
            render={({ field, fieldState }) => (
              <NumberInput
                name={field.name}
                label={text.form.fields.width}
                placeholder={text.form.placeholders.width}
                value={field.value === '' ? null : Number(field.value)}
                onValueChange={(value) => field.onChange(value ?? '')}
                allowDot
                decimalPlaces={2}
                min={0}
                error={fieldState.error?.message}
                isRequired
                disabled={!!isLoading}
              />
            )}
          />

          <Controller
            name="length"
            control={control}
            render={({ field, fieldState }) => (
              <NumberInput
                name={field.name}
                label={text.form.fields.length}
                placeholder={text.form.placeholders.length}
                value={field.value === '' ? null : Number(field.value)}
                onValueChange={(value) => field.onChange(value ?? '')}
                allowDot
                decimalPlaces={2}
                min={0}
                error={fieldState.error?.message}
                isRequired
                disabled={!!isLoading}
              />
            )}
          />

          {/* Preview de "Área (m²)" — texto estático, NUNCA um `Input`/
              `Controller` ligado ao payload. Recalculado a cada keystroke de
              width/length via `useWatch`. */}
          <Box>
            <Text
              fontSize="xs"
              fontWeight="semibold"
              color="fg.muted"
              textTransform="uppercase"
              letterSpacing="wide"
              mb={1}
            >
              {text.form.fields.area}
            </Text>
            <Text fontSize="md" fontWeight="bold">
              {areaPreview} m²
            </Text>
          </Box>
        </SimpleGrid>

        <Box mt={6}>
          <Textarea
            label={text.form.fields.observation}
            helperText={errors.observation?.message ? undefined : `${observationLength}/600`}
            {...register('observation')}
            error={errors.observation?.message}
            loading={!!isLoading}
            disabled={!!isLoading}
            minH="120px"
          />
        </Box>
      </Form>
    </FormContainer>
  );
}
