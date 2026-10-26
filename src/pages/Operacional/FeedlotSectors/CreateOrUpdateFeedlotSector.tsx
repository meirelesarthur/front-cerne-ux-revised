// src/pages/Operacional/FeedlotSectors/CreateOrUpdateFeedlotSector.tsx
// -----------------------------------------------------------------------------
// Tela de CRIAÇÃO e EDIÇÃO de SETOR (FeedlotSector) — Operacional/
// Confinamento. Rotas: /operacional/setores/novo (criar) e
// /operacional/setores/:feedlotSectorUuid (editar, GUID).
//
// Mirror `FeedlotYards/CreateOrUpdateFeedlotYard.tsx` (referência estrutural
// PRIMÁRIA) — ADAPTADO, não copiado 1:1 (contrato de tela §"Pontos de
// atenção"):
//   - ORDEM DE CAMPOS fiel ao legado, requisito EXPLÍCITO do dono:
//     code → name → feedlot_yard_uuid → width → length → total_area →
//     is_active → observation (`FLD-01..FLD-08`) — NÃO a reordenação livre
//     que `FeedlotYard` aplicou (lá: name/is_active/width/length/area);
//   - `feedlot_yard_uuid` (SelectAsyncPaginate) é um campo NOVO — ativo e
//     paginado em criação (`service: listFeedlotYards`, reaproveitado de
//     `FeedlotYards/feedlot-yard-service.ts`), DESABILITADO em edição
//     (`isReadOnly`+`isDisabled`, dupla defesa), valor fixo vindo do próprio
//     Resource (`data.feedlot_yard.{uuid,name}`) — nunca refeito via rede
//     nesse modo (`DA-FS-06`);
//   - `total_area` fica na POSIÇÃO EXATA entre `length` e `is_active`
//     (`FLD-06`), texto estático recalculado via `useWatch`, NUNCA no
//     payload;
//   - `code` NUNCA é `<Input>`/`register('code')` — bloco read-only fora do
//     `<Form>`, real em edição, hint "gerado automaticamente" no create;
//   - `observation` tem contador `x/600` inline — a validação Yup `max(600)`
//     já bloqueia o submit;
//   - `fillForm` guarda `dirtyFields` (Lei 2) — sem `reset()` inline em
//     `useEffect`; PATCH de edição envia só campos `dirtyFields`,
//     `feedlot_yard_uuid` NUNCA entra no payload de update (imutável).
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
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { Textarea } from '@/components/Form/Textarea';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useLanguage } from '@/hooks/useLanguage';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { columnsForm } from '@/constants/coluns-form';
import { feedlotSectorStatusOptions } from '@/constants/FeedlotSectors/options/feedlot-sector-status-options';
import { queryKey } from '@/constants/query-key';

import { feedlotSectorSchemaResolver } from '@/validations/schemas/FeedlotSectors/feedlotSector-schema';

import {
  createFeedlotSector,
  updateFeedlotSector,
} from '@/services/v2/FeedlotSectors/feedlot-sector-service';
import { listFeedlotYards } from '@/services/v2/FeedlotYards/feedlot-yard-service';

import type { Option } from '@/@types/option';
import type {
  CreateFeedlotSectorRequest,
  FeedlotSectorDetail,
  FeedlotSectorForm as FeedlotSectorFormType,
  UpdateFeedlotSectorRequest,
} from '@/@types/v2/FeedlotSectors';
import type { FeedlotYardListItem } from '@/@types/v2/FeedlotYards';

import { useFeedlotSectorForm } from './useFeedlotSectors';

// Formatação de "Área Total (m²)" — mirror listagem/detalhe — 2 casas, SEM
// símbolo monetário (é m², não R$).
const areaFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default function CreateOrUpdateFeedlotSector() {
  const { feedlotSectorUuid } = useParams<{ feedlotSectorUuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const text = languageGB.feedlotSectors.feedlotSector;

  // É edição quando existe um GUID válido na rota ("novo" não é GUID).
  const isEditing = isValidGuid(feedlotSectorUuid);

  const {
    control,
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors, dirtyFields },
  } = useForm<FeedlotSectorFormType>({
    mode: 'onChange',
    resolver: feedlotSectorSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      feedlot_yard_uuid: null,
      width: '',
      length: '',
      is_active: feedlotSectorStatusOptions.getOption(true, languageGB),
      observation: '',
    },
  });

  function fillForm(data: FeedlotSectorDetail, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        name: data.name,
        // Pátio IMUTÁVEL em edição — valor fixo vindo do próprio Resource
        // (`feedlot_yard.{uuid,name}`), nunca refeito via rede (`DA-FS-06`).
        feedlot_yard_uuid: { label: data.feedlot_yard.name, value: data.feedlot_yard.uuid },
        width: data.width ?? '',
        length: data.length ?? '',
        is_active: feedlotSectorStatusOptions.getOption(!!data.is_active, languageGB),
        observation: data.observation ?? '',
      });
    }
  }

  const feedlotSectorQuery = useFeedlotSectorForm({
    registrationId: isEditing ? feedlotSectorUuid : undefined,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([feedlotSectorQuery as any]);
  const feedlotSectorData = feedlotSectorQuery.data as FeedlotSectorDetail | undefined;

  const feedlotSectorMutation = useRequest({
    asyncFunction: tryPersistFeedlotSector,
    entityName: text.singularLabel,
    queryKey: queryKey.feedlotSectors.feedlotSectors,
    queryKey2: queryKey.feedlotSectors.feedlotSector,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  async function tryPersistFeedlotSector(data: FeedlotSectorFormType) {
    if (isEditing && feedlotSectorUuid) {
      // Update COMPLETO — NÃO um PATCH parcial por `dirtyFields`. Diferente
      // de outras telas do módulo, `FeedlotSectorRequest` (API) declara
      // `name`/`width`/`length`/`is_active` como `required` no update (não
      // `sometimes`) — só `feedlot_yard_uuid` é `prohibited` (imutável,
      // DA-FS-06, dupla defesa com o campo desabilitado no UI). Enviar só os
      // campos `dirtyFields` (padrão antigo) omite os demais obrigatórios e
      // a API responde 422 ("O campo is active é obrigatório.") sempre que
      // o usuário salva sem tocar em TODOS os campos. Por isso o front
      // envia sempre o payload inteiro; `total_area`/`code`/`priority`
      // continuam nunca entrando (derivados/imutáveis, fora do contrato).
      const payload: UpdateFeedlotSectorRequest = {
        name: data.name,
        width: Number(data.width),
        length: Number(data.length),
        is_active: data.is_active.value,
        observation: data.observation || undefined,
      };
      return updateFeedlotSector(feedlotSectorUuid, payload);
    }

    const payload: CreateFeedlotSectorRequest = {
      name: data.name,
      feedlot_yard_uuid: data.feedlot_yard_uuid!.value,
      width: Number(data.width),
      length: Number(data.length),
      is_active: data.is_active.value,
      observation: data.observation || undefined,
    };
    return createFeedlotSector(payload);
  }

  async function onSubmit(data: FeedlotSectorFormType) {
    if (isEditing && !isEmpty(dirtyFields)) {
      navigate(-1);
      return;
    }
    await feedlotSectorMutation.mutateAsync(data);
  }

  const isSubmitting = feedlotSectorMutation.isPending;

  const statusOptions: Option<boolean>[] = useMemo(
    () => feedlotSectorStatusOptions.options(languageGB),
    [languageGB]
  );

  const displayCode = isEditing ? feedlotSectorData?.code : text.form.hints.codeGenerated;

  // `total_area` — 100% DERIVADA no cliente (`width*length`), feedback
  // visual ao vivo (`useWatch`), NUNCA entra no payload (contrato de tela §6.5).
  const watchedWidth = useWatch({ control, name: 'width' });
  const watchedLength = useWatch({ control, name: 'length' });
  const totalAreaPreview = useMemo(() => {
    const w = Number(watchedWidth) || 0;
    const l = Number(watchedLength) || 0;
    return areaFormatter.format(w * l);
  }, [watchedWidth, watchedLength]);

  // `useWatch` não reflete de forma confiável o valor populado por `reset()`
  // (via `fillForm`) no primeiro render pós-load da edição — mesmo fallback
  // já documentado em `CreateOrUpdateFeedlotYard.tsx`.
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
      <Form id="feedlotSector-form" noPadding onSubmit={handleSubmit(onSubmit)}>
        {/* 1. Código gerado — SEMPRE texto estático (nunca `Input`/`register`), real em edição. */}
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
          {/* 2. Nome */}
          <Input
            label={text.form.fields.name}
            {...register('name')}
            error={errors.name?.message}
            isRequired
            loading={!!isLoading}
          />

          {/* 3. Pátio — ativo/paginado em criação, DESABILITADO em edição
              (dupla defesa: `isReadOnly` + `isDisabled`), valor fixo vindo
              do próprio Resource, nunca refeito via rede nesse modo. */}
          <Controller
            name="feedlot_yard_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.form.fields.feedlotYard}
                placeholder={text.form.placeholders.feedlotYard}
                error={(errors.feedlot_yard_uuid as any)?.message}
                service={listFeedlotYards}
                mapOptions={(item: FeedlotYardListItem) => ({ label: item.name, value: item.uuid })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                  is_active: true,
                })}
                value={field.value ?? undefined}
                onChange={(option: any) => field.onChange(option ?? null)}
                isRequired
                isReadOnly={isEditing}
                isDisabled={isEditing || !!isLoading}
              />
            )}
          />

          {/* 4. Largura (m) — "máscara money" sem `R$` (metros, não dinheiro). */}
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

          {/* 5. Comprimento (m) — mesmo componente/config de width. */}
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

          {/* 6. Área Total (m²) — POSIÇÃO EXATA entre length e is_active
              (`FLD-06`), texto estático, NUNCA um `Input`/`Controller`
              ligado ao payload. Recalculado a cada keystroke via `useWatch`. */}
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
              {totalAreaPreview} m²
            </Text>
          </Box>

          {/* 7. Status */}
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
        </SimpleGrid>

        {/* 8. Observação — contador x/600 inline, sem `swal` (Yup `max(600)`
            já bloqueia o submit). */}
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
