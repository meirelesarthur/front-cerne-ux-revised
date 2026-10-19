// src/pages/CadastrosBase/Areas/AreaCard.tsx
// -----------------------------------------------------------------------------
// Card individual do fluxo "Adicionar Múltiplas Áreas" (F-348/UT-000446,
// esteira 067, TASK-FE-421, SURF-05/UX-GAP-02) — Pattern 12
// (`get_pwa_complex_screen_compositions_pattern`, `Card.Root`/`Card.Body` +
// `.map()` no PAI). Cada card é um sub-form INDEPENDENTE (própria instância
// de `useForm<AreaForm>` + `areaSchemaResolver`), reusando EXATAMENTE os
// mesmos campos/widgets/cascatas de `CreateOrUpdateArea.tsx` (TASK-FE-420) e
// o `AreaMapEditor` (TASK-FE-419) — fidelidade funcional total (regra do
// dono F-348: nenhum campo do editor single pode faltar aqui).
//
// Por que NÃO `useFieldArray` (Riscos da Tarefa, item 4): cada item do lote
// precisa da PRÓPRIA validação Yup completa (`AreaBatchRequest::rules()`
// espelha `AreaRequest::rules()` por índice, corrigindo CLM-09) e do PRÓPRIO
// `AreaMapEditor` (que já é uma peça complexa com Leaflet/`getValues`/
// `setValue` de UM `useForm`). Um `useFieldArray` no pai exigiria achatar
// tudo isso num único formulário gigante — inviável e fora do canon. A
// alternativa adotada: N instâncias independentes de `useForm` (uma por
// componente `AreaCard` montado, Regras de Hooks respeitadas — cada
// instância vive em seu PRÓPRIO componente, não num loop dentro do mesmo
// componente) + um **handle imperativo** (`useImperativeHandle`) que o PAI
// (`CreateMultipleAreas.tsx`) usa para orquestrar validação/coleta de
// valores/erro de servidor por índice, sem duplicar estado de formulário no
// Zustand nem no pai.
//
// CLM-09 corrigido: cada card nasce com os PRÓPRIOS valores (`is_enabled`,
// `date`, `recreation_area`, etc. — nunca fixados/replicados entre cards,
// diferente do legado que fixava `is_enabled=1` e replicava ícones).
// -----------------------------------------------------------------------------

import { forwardRef, useEffect, useImperativeHandle } from 'react';

import { Box, Card, Flex, Icon, SimpleGrid, Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';
import { FiTrash2 } from 'react-icons/fi';

import { DateInput } from '@/components/DateInput';
import { Input } from '@/components/Form/Input';
import { KgInput } from '@/components/Form/kgInput';
import { Select } from '@/components/Form/Select';
import { SelectCombobox } from '@/components/Form/SelectCombobox';
import { Textarea } from '@/components/Form/Textarea';
import { IconButtonTable } from '@/components/IconButtonTable';

import { useLanguage } from '@/hooks/useLanguage';

import { AreaColor } from '@/constants/areas/area/areas-status';
import { areaColorOptions, areaTypeOptions } from '@/constants/areas/area/options';
import { columnsForm } from '@/constants/coluns-form';
import { markerType } from '@/constants/Marker/marker-type';

import { areaSchemaResolver } from '@/validations/schemas/Areas/area-schema';

import type { Option } from '@/@types/option';
import type { AreaForm } from '@/@types/v2/BaseRegistrations/areas';

import { AreaMapEditor } from './AreaMapEditor';
import { useActiveMarkersList } from './useAreas';

import { useProprietariesList } from '../ContasBancarias/useAccounts';

// Formulário vazio (mirror EXATO de `emptyAreaForm` de `CreateOrUpdateArea.tsx`)
// — exportado para o PAI (`CreateMultipleAreas.tsx`) compor `defaultValues`
// por card a partir do resultado do `kml-import` (description/coordinates/
// áreas já calculadas, o resto nasce vazio igual ao editor single).
export function emptyAreaForm(): AreaForm {
  return {
    description: '',
    registration: null,
    date: null,
    proprietary: null,
    type: null,
    activity: null,
    recreation_area: false,
    color: null,
    infrastructure: [],
    total_area: 0,
    productive_area: 0,
    unproductive_area: 0,
    is_enabled: true,
    note: null,
    coordinates: null,
    activity_icon_coordinates: null,
    infrastructure_icon_coordinates: null,
  };
}

export interface AreaCardHandle {
  /** Dispara a validação Yup completa do card (`trigger()`) — usado pelo PAI
   *  antes de montar o payload do lote. */
  validate: () => Promise<boolean>;
  /** Valores ATUAIS do card (honra o que o próprio usuário editou — CLM-09). */
  getFormValues: () => AreaForm;
  /** Mapeia 1 erro 422 do backend (`areas.<index>.<campo>`) para o campo
   *  correspondente DESTE card — chamado pelo PAI após parsear a resposta. */
  setFieldError: (field: keyof AreaForm, message: string) => void;
}

export interface AreaCardProps {
  /** Rótulo 1-based exibido no header do card (`"Área 1"`, `"Área 2"`...). */
  cardNumber: number;
  /** Nome do arquivo KML de origem — exibido no header, nunca enviado à API. */
  fileName: string;
  farmUuid: string;
  /** Valores iniciais (já hidratados pelo import do KML — description/
   *  coordinates/total_area/productive_area/unproductive_area). Fixados na
   *  MONTAGEM do card (o card não remonta ao reordenar a lista do pai, `key`
   *  estável por `id`). */
  defaultValues: AreaForm;
  disabled?: boolean;
  onRemove: () => void;
}

export const AreaCard = forwardRef<AreaCardHandle, AreaCardProps>(function AreaCard(
  { cardNumber, fileName, farmUuid, defaultValues, disabled, onRemove }: AreaCardProps,
  ref
) {
  const { languageGB } = useLanguage();
  const text = languageGB.areas.area.form;
  const multipleText = languageGB.areas.area.multiple;

  const {
    control,
    register,
    getValues,
    setValue,
    setError,
    trigger,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<AreaForm>({
    mode: 'onChange',
    resolver: areaSchemaResolver(languageGB),
    reValidateMode: 'onChange',
    // Correção do dono (F-348/UT-000446): cada card nasce com "Cor da Área"
    // Verde (`AreaColor.GREEN`), mirror EXATO de `CreateOrUpdateArea.tsx` —
    // `languageGB` só existe DENTRO do componente (`getOption` exige o
    // idioma), por isso o default é aplicado AQUI, sobrepondo o
    // `color: null` que `defaultValues` (prop, `emptyAreaForm()` no PAI)
    // sempre traz. Continua editável/`isRequired` — o usuário pode trocar.
    defaultValues: {
      ...defaultValues,
      color: defaultValues.color ?? areaColorOptions.getOption(AreaColor.GREEN, languageGB),
    },
  });

  useImperativeHandle(
    ref,
    () => ({
      validate: () => trigger(),
      getFormValues: () => getValues(),
      setFieldError: (field, message) => setError(field, { type: 'server', message }),
    }),
    [trigger, getValues, setError]
  );

  // "Proprietário Gestor" — mirror EXATO de `CreateOrUpdateArea.tsx`. F-348/
  // UT-000446 (esteira 067): `farmUuid` (prop, fazenda da rota do lote —
  // `CreateMultipleAreas.tsx`) filtra pela FAZENDA DA ÁREA via `farm_uuid`,
  // fiel ao legado — nunca lista proprietários de outras fazendas do tenant.
  const proprietariesQuery = useProprietariesList(farmUuid);
  const proprietaryOptions: Option<string>[] = (proprietariesQuery.data ?? []).map((item) => ({
    label: item.label,
    value: item.uuid,
  }));

  // "Atividade"/"Infraestrutura" — correção do dono (F-348/UT-000446), mirror
  // EXATO de `CreateOrUpdateArea.tsx`: `useActiveMarkersList` consome a rota
  // ABERTA `GET /markers/active?type=N` (SOMENTE `auth:sanctum`, DA-MK-12) —
  // `listMarkers` (`GET /markers`, gated `permission:markers_view`) devolvia
  // 403/toast "Sem permissão" para o usuário comum de Área também no fluxo de
  // múltiplas Áreas.
  const activityMarkersQuery = useActiveMarkersList(markerType.activity);
  const activityOptions: Option<string>[] = (activityMarkersQuery.data ?? []).map((item) => ({
    label: item.description,
    value: item.uuid,
  }));

  const infrastructureMarkersQuery = useActiveMarkersList(markerType.infrastructure);
  const infrastructureOptions: Option<string>[] = (infrastructureMarkersQuery.data ?? []).map(
    (item) => ({
      label: item.description,
      value: item.uuid,
    })
  );

  const yesNoOptions: Option<string>[] = [
    { value: 'true', label: languageGB.defaltStrings.yes },
    { value: 'false', label: languageGB.defaltStrings.no },
  ];

  // Cascata (de-para §4 item 3) — mirror EXATO de `CreateOrUpdateArea.tsx`:
  // `unproductive_area` SEMPRE derivada, só recalcula quando o PRÓPRIO
  // usuário (ou o mapa) suja `total_area`/`productive_area` — nunca na
  // hidratação inicial vinda do KML importado.
  const watchedTotalArea = watch('total_area');
  const watchedProductiveArea = watch('productive_area');

  useEffect(() => {
    if (!dirtyFields.total_area && !dirtyFields.productive_area) return;
    const total = Number(watchedTotalArea) || 0;
    const productive = Number(watchedProductiveArea) || 0;
    const nextUnproductive = Math.round((total - productive) * 100) / 100;
    setValue('unproductive_area', nextUnproductive, { shouldDirty: true, shouldValidate: true });
  }, [
    watchedTotalArea,
    watchedProductiveArea,
    dirtyFields.total_area,
    dirtyFields.productive_area,
  ]);

  const watchedColor = watch('color');
  const watchedActivity = watch('activity');
  const watchedInfrastructure = watch('infrastructure');
  // GAP-FE-261 (mirror EXATO de `CreateOrUpdateArea.tsx`) — `coordinates`
  // PROP REATIVA: no fluxo de múltiplas Áreas o card nasce com
  // `defaultValues.coordinates` já hidratado pelo KML importado
  // (`CreateMultipleAreas.tsx::handleFilesSelected`), mas sem esta prop
  // reativa o `AreaMapEditor` nunca recebia o valor e o efeito de
  // hidratação (`useEffect([coordinates])`) nunca desenhava o polígono nem
  // dava `fitBounds` — o mapa ficava no zoom default (Brasil/América do
  // Sul). Ser `watch()` (não `getValues()` lido uma única vez) também
  // cobre o desenho/reimportação manual DENTRO do próprio card depois da
  // montagem, sem regressão do submit em lote (`getFormValues` continua
  // lendo o form via `getValues()`, inalterado).
  const watchedCoordinates = watch('coordinates');

  return (
    <Card.Root variant="outline" size="sm" mb={5}>
      <Card.Header>
        <Flex justify="space-between" align="center" gap={2}>
          <Box minW={0}>
            <Text fontSize="sm" fontWeight="semibold" lineClamp="1">
              {multipleText.cardLabelPrefix} {cardNumber} — {fileName}
            </Text>
          </Box>
          <IconButtonTable
            aria-label={multipleText.cardRemoveLabel}
            mensegerTooltip={multipleText.cardRemoveLabel}
            size="sm"
            color="red.500"
            variant="ghost"
            disabled={disabled}
            onClick={onRemove}
          >
            <Icon as={FiTrash2} />
          </IconButtonTable>
        </Flex>
      </Card.Header>

      <Card.Body>
        <AreaMapEditor
          getValues={getValues}
          setValue={setValue}
          farmUuid={farmUuid}
          color={watchedColor?.value ?? null}
          coordinates={watchedCoordinates ?? null}
          activityMarker={
            watchedActivity
              ? {
                  key: watchedActivity.value,
                  iconUrl:
                    activityMarkersQuery.data?.find((item) => item.uuid === watchedActivity.value)
                      ?.icon_url ?? null,
                }
              : null
          }
          infrastructureMarkers={(watchedInfrastructure ?? []).map((item) => ({
            key: item.value,
            iconUrl:
              infrastructureMarkersQuery.data?.find((marker) => marker.uuid === item.value)
                ?.icon_url ?? null,
          }))}
          disabled={disabled}
        />

        <SimpleGrid columns={columnsForm.fourColumns} gap={6} mt={6}>
          <Input
            label={text.fields.description}
            placeholder={text.placeholders.description}
            {...register('description')}
            error={errors.description?.message}
            isRequired
            disabled={disabled}
          />

          <Controller
            name="date"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <DateInput
                value={field.value ?? null}
                onChange={(value) => field.onChange(value ?? null)}
                label={text.fields.date}
                error={error?.message}
                isRequired
                disabled={disabled}
              />
            )}
          />

          <Input
            label={text.fields.registration}
            placeholder={text.placeholders.registration}
            {...register('registration')}
            error={errors.registration?.message}
            disabled={disabled}
          />

          <Controller
            name="proprietary"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <SelectCombobox
                name={field.name}
                label={text.fields.proprietary}
                placeholder={text.placeholders.proprietary}
                options={proprietaryOptions}
                loading={proprietariesQuery.isLoading}
                value={field.value ?? null}
                onChange={(option) => field.onChange(option ?? null)}
                error={error?.message}
                disabled={disabled}
              />
            )}
          />
        </SimpleGrid>

        <SimpleGrid columns={columnsForm.fourColumns} gap={6} mt={6}>
          <Controller
            name="type"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <Select
                label={text.fields.type}
                name={field.name}
                value={field.value ?? null}
                onChange={(option: Option<number> | null) => field.onChange(option ?? null)}
                options={areaTypeOptions.options(languageGB)}
                error={error?.message}
                isRequired
                noClearable
                isDisabled={disabled}
              />
            )}
          />

          <Controller
            name="activity"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <SelectCombobox
                name={field.name}
                label={text.fields.activity}
                placeholder={text.placeholders.activity}
                options={activityOptions}
                loading={activityMarkersQuery.isLoading}
                value={field.value ?? null}
                onChange={(option) => field.onChange(option ?? null)}
                error={error?.message}
                disabled={disabled}
              />
            )}
          />

          <Controller
            name="recreation_area"
            control={control}
            render={({ field }) => (
              <Select
                label={text.fields.recreationArea}
                name={field.name}
                value={
                  yesNoOptions.find((o) => o.value === (field.value ? 'true' : 'false')) ?? null
                }
                onChange={(option: Option<string> | null) =>
                  field.onChange(option?.value === 'true')
                }
                options={yesNoOptions}
                noClearable
                isDisabled={disabled}
              />
            )}
          />

          {/* Cor da Área — UX-GAP-01-Cor (herdado de 420): Select + chip. */}
          <Flex gap={2} align="flex-end">
            <Box flex="1">
              <Controller
                name="color"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <Select
                    label={text.fields.color}
                    name={field.name}
                    value={field.value ?? null}
                    onChange={(option: Option<string> | null) => field.onChange(option ?? null)}
                    options={areaColorOptions.options(languageGB)}
                    error={error?.message}
                    isRequired
                    noClearable
                    isDisabled={disabled}
                  />
                )}
              />
            </Box>
            <Box
              aria-hidden="true"
              boxSize="38px"
              borderRadius="md"
              border="1px solid"
              borderColor="border.subtle"
              bg={watchedColor?.value ?? 'transparent'}
              flexShrink={0}
            />
          </Flex>
        </SimpleGrid>

        <SimpleGrid columns={columnsForm.twoColumns} gap={6} mt={6}>
          <Controller
            name="infrastructure"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <Select
                multiple
                name={field.name}
                label={text.fields.infrastructure}
                placeholder={text.placeholders.infrastructure}
                options={infrastructureOptions}
                loading={infrastructureMarkersQuery.isLoading}
                value={field.value ?? []}
                onChange={(options: Option<string>[] | null) => field.onChange(options ?? [])}
                error={error?.message}
                isDisabled={disabled}
              />
            )}
          />

          <Controller
            name="is_enabled"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <Select
                label={text.fields.isEnabled}
                name={field.name}
                value={
                  yesNoOptions.find((o) => o.value === (field.value ? 'true' : 'false')) ?? null
                }
                onChange={(option: Option<string> | null) =>
                  field.onChange(option?.value === 'true')
                }
                options={yesNoOptions}
                error={error?.message}
                isRequired
                noClearable
                isDisabled={disabled}
              />
            )}
          />
        </SimpleGrid>

        <SimpleGrid columns={columnsForm.threeColumns} gap={6} mt={6}>
          <Controller
            name="total_area"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <KgInput
                name={field.name}
                label={text.fields.totalArea}
                value={field.value ?? ''}
                onChange={(_event, _masked, floatValue) => field.onChange(floatValue ?? 0)}
                allowDot
                decimalPlaces={2}
                isRequired
                isReadOnly={disabled}
                error={error?.message}
              />
            )}
          />

          <Controller
            name="productive_area"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <KgInput
                name={field.name}
                label={text.fields.productiveArea}
                value={field.value ?? ''}
                onChange={(_event, _masked, floatValue) => field.onChange(floatValue ?? 0)}
                allowDot
                decimalPlaces={2}
                isRequired
                isReadOnly={disabled}
                error={error?.message}
              />
            )}
          />

          {/* Sempre readonly/derivada (de-para §4 item 2/3), CLM-06b não portado. */}
          <Controller
            name="unproductive_area"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <KgInput
                name={field.name}
                label={text.fields.unproductiveArea}
                value={field.value ?? ''}
                allowDot
                decimalPlaces={2}
                isRequired
                isReadOnly
                error={error?.message}
              />
            )}
          />
        </SimpleGrid>

        <Box mt={6}>
          <Controller
            name="note"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <Textarea
                label={text.fields.note}
                placeholder={text.placeholders.note}
                name={field.name}
                value={field.value ?? ''}
                onChange={(event) => field.onChange(event.target.value)}
                error={error?.message}
                disabled={disabled}
              />
            )}
          />
        </Box>
      </Card.Body>
    </Card.Root>
  );
});

export default AreaCard;
