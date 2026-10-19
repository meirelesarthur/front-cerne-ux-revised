// src/pages/Operacional/FeedlotCorrals/steps/StepDimensoesEstrutura.tsx
// -----------------------------------------------------------------------------
// Etapa 2/3 do wizard de Curral (FeedlotCorral) — Dimensões & Estrutura —
// TASK-043-CUR-T04 (`04-Wizard-Etapa2-Dimensoes.md`, contrato de tela §6
// Etapa 2, FID-G3F SR-R10..17/B18/B19/B22-B25/F06/F07/H06/H18-H25/H30/H35).
//
// Campos FM-008..016: `width`/`length` (NumberInput 2 casas), `total_area`
// (FM-010, READONLY/derivado — `width*length`, IG-003/CV-003 — NUNCA um
// campo RHF, NUNCA submetido, mirror `FeedlotCorralDialog.tsx`), `capacity`
// (integer), `coverage`/`floor`/`shading` (selects LK-003/004/005),
// `trough_uuid`/`drinking_fountain_uuid` (selects LK-008/009 + botão
// "+"/edit → `InlineTroughModal`/`InlineDrinkingFountainModal`, REUSO 100%
// do Mapa — TASK-FE-042-206 — SEM alterar assinatura, não-regressão).
//
// `total_area` é calculado REATIVAMENTE via `useWatch` (recalcula a cada
// alteração de `width`/`length`, não só no blur) — mesmo padrão já em
// produção em `FeedlotCorralDialog.tsx`: é um superconjunto correto do
// gatilho de blur do legado (IG-003 exige "recalcula width*length"; a
// via reativa cobre o blur e cada tecla, sem regredir o resultado).
//
// H35/IG-016/019 (ícone +/edit conforme seleção) — escopo desta Tarefa é
// SÓ a troca de ÍCONE (Plus↔Pencil) ao lado dos selects de cocho/bebedouro
// conforme há ou não valor selecionado. O round-trip GET+PUT de edição
// in-place de um cocho/bebedouro JÁ vinculado (IG-018/020) exigiria estender
// a assinatura de `InlineTroughModal`/`InlineDrinkingFountainModal` (novo
// prop de uuid-alvo + fetch + `updateTrough`/`updateDrinkingFountain`), o
// que a Tarefa proíbe explicitamente (DoD "Inline*Modal reusados sem alterar
// assinatura — não-regressão"). Por isso o botão SEMPRE abre o mesmo
// sub-modal de CRIAÇÃO reusado (mirror exato do Mapa); ao salvar, a nova
// opção substitui a seleção corrente no select pai, sem refetch (SE-011/
// SE-012, comportamento igual em ambos os ícones — a Tarefa não distingue
// os dois casos além do ícone). GAP FRONT NOVO (reportar ao Arquiteto, não
// bloqueia esta Tarefa): edição in-place real de cocho/bebedouro vinculado
// permanece pendente de uma extensão aditiva futura dos Inline*Modal.
//
// IG-017/IG-021 (exclusão mútua área↔pastejo) — DEF-014/PARADA-DEF-B já
// corrigido pela própria migração: `InlineTroughModal`/
// `InlineDrinkingFountainModal` não replicam os campos `area_uuid`/
// `grazing_uuid` do legado (o vínculo com o curral é só via `trough_uuid`/
// `drinking_fountain_uuid` do formulário pai) — o estado já é isolado por
// modal, nada a fazer aqui além de reusar o componente como está.
//
// `code` readonly do legado (GAP-API-04, sem endpoint de next-code) — os
// selects usam `description` (mirror `FeedlotCorralDialog.tsx`), cosmético,
// omitido por decisão do dono (default do contrato).
// -----------------------------------------------------------------------------

import { useEffect, useMemo, useState } from 'react';

import { Box, IconButton, SimpleGrid, Text } from '@chakra-ui/react';
import { Pencil, Plus } from 'lucide-react';
import { Control, Controller, UseFormSetValue, useWatch } from 'react-hook-form';

import { InlineDrinkingFountainModal } from '@/pages/Operacional/FeedlotMapDashboard/dialogs/InlineDrinkingFountainModal';
import { InlineTroughModal } from '@/pages/Operacional/FeedlotMapDashboard/dialogs/InlineTroughModal';

import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';

import { useLanguage } from '@/hooks/useLanguage';

import { FEEDLOT_CORRAL_DIMENSION_MAX } from '@/constants/FeedlotCorrals/feedlot-corral-dimension-max';

import type { Option } from '@/@types/option';
import type {
  FeedlotCorralEnumRef,
  FeedlotCorralResourceRef,
  FeedlotCorralWizardForm,
} from '@/@types/v2/FeedlotCorrals';

const areaFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export interface StepDimensoesEstruturaProps {
  control: Control<FeedlotCorralWizardForm>;
  setValue: UseFormSetValue<FeedlotCorralWizardForm>;
  disabled?: boolean;
  loading?: boolean;
  coverageOptions: FeedlotCorralEnumRef[];
  floorOptions: FeedlotCorralEnumRef[];
  shadingOptions: FeedlotCorralEnumRef[];
  /** Lista inicial (`GET .../options`) — inclui o vínculo atual em editar. */
  troughs: FeedlotCorralResourceRef[];
  /** Lista inicial (`GET .../options`) — inclui o vínculo atual em editar. */
  drinkingFountains: FeedlotCorralResourceRef[];
}

export function StepDimensoesEstrutura({
  control,
  setValue,
  disabled,
  loading,
  coverageOptions,
  floorOptions,
  shadingOptions,
  troughs,
  drinkingFountains,
}: StepDimensoesEstruturaProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.feedlotMap.feedlotMap.corral;

  // Listas mutáveis LOCAIS — SE-011/SE-012: após salvar no Inline*Modal, a
  // option nova entra aqui SEM refetch de `options` (mirror
  // `FeedlotCorralDialog.tsx`).
  const [troughList, setTroughList] = useState<FeedlotCorralResourceRef[]>(troughs);
  const [drinkingFountainList, setDrinkingFountainList] =
    useState<FeedlotCorralResourceRef[]>(drinkingFountains);

  useEffect(() => {
    setTroughList(troughs);
  }, [troughs]);

  useEffect(() => {
    setDrinkingFountainList(drinkingFountains);
  }, [drinkingFountains]);

  const troughOptions: Option<string>[] = useMemo(
    () => troughList.map((item) => ({ label: item.description, value: item.uuid })),
    [troughList]
  );
  const drinkingFountainOptions: Option<string>[] = useMemo(
    () => drinkingFountainList.map((item) => ({ label: item.description, value: item.uuid })),
    [drinkingFountainList]
  );

  const [inlineModal, setInlineModal] = useState<'trough' | 'drinking-fountain' | null>(null);

  // FM-010/IG-003/CV-003 — `total_area` é preview puro, NUNCA um campo RHF
  // (não entra em `stepFields`/schema/payload).
  const watchedWidth = useWatch({ control, name: 'width' });
  const watchedLength = useWatch({ control, name: 'length' });
  const areaPreview = useMemo(() => {
    const w = Number(watchedWidth) || 0;
    const l = Number(watchedLength) || 0;
    return areaFormatter.format(w * l);
  }, [watchedWidth, watchedLength]);

  // H35/IG-016/019 — valor corrente só para decidir o ÍCONE do botão
  // (Plus↔Pencil); não duplica o `Controller` do select.
  const watchedTroughUuid = useWatch({ control, name: 'trough_uuid' });
  const watchedDrinkingFountainUuid = useWatch({ control, name: 'drinking_fountain_uuid' });

  return (
    <Box>
      <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
        {/* FM-008 — `width` */}
        <Controller
          name="width"
          control={control}
          render={({ field, fieldState }) => (
            <NumberInput
              name={field.name}
              label={text.fields.width}
              value={field.value === '' ? null : Number(field.value)}
              onValueChange={(value) => field.onChange(value ?? '')}
              allowDot
              decimalPlaces={2}
              min={0}
              max={FEEDLOT_CORRAL_DIMENSION_MAX}
              error={fieldState.error?.message}
              isRequired
              disabled={disabled}
            />
          )}
        />

        {/* FM-009 — `length` */}
        <Controller
          name="length"
          control={control}
          render={({ field, fieldState }) => (
            <NumberInput
              name={field.name}
              label={text.fields.length}
              value={field.value === '' ? null : Number(field.value)}
              onValueChange={(value) => field.onChange(value ?? '')}
              allowDot
              decimalPlaces={2}
              min={0}
              max={FEEDLOT_CORRAL_DIMENSION_MAX}
              error={fieldState.error?.message}
              isRequired
              disabled={disabled}
            />
          )}
        />

        {/* FM-010 — `total_area` READONLY, calculado, NÃO submetido
            (IG-003/CV-003) */}
        <Box>
          <Text
            fontSize="xs"
            fontWeight="semibold"
            color="fg.muted"
            textTransform="uppercase"
            mb={1}
          >
            {text.fields.area}
          </Text>
          <Text fontSize="md" fontWeight="bold">
            {areaPreview} m²
          </Text>
        </Box>

        {/* FM-011 — `capacity` (integer) */}
        <Controller
          name="capacity"
          control={control}
          render={({ field, fieldState }) => (
            <NumberInput
              name={field.name}
              label={text.fields.capacity}
              value={field.value === '' ? null : Number(field.value)}
              onValueChange={(value) => field.onChange(value ?? '')}
              decimalPlaces={0}
              min={0}
              error={fieldState.error?.message}
              isRequired
              disabled={disabled}
            />
          )}
        />

        {/* FM-012 — `coverage` (LK-003, default AB setado na casca) */}
        <Controller
          name="coverage"
          control={control}
          render={({ field: { name, value, onChange }, fieldState: { error } }) => (
            <Select
              label={text.fields.coverage}
              name={name}
              value={value}
              onChange={onChange}
              options={coverageOptions}
              error={error?.message}
              isRequired
              loading={!!loading}
              isDisabled={disabled}
            />
          )}
        />

        {/* FM-013 — `floor` (LK-004) */}
        <Controller
          name="floor"
          control={control}
          render={({ field: { name, value, onChange }, fieldState: { error } }) => (
            <Select
              label={text.fields.floor}
              name={name}
              value={value}
              onChange={onChange}
              options={floorOptions}
              error={error?.message}
              isRequired
              loading={!!loading}
              isDisabled={disabled}
            />
          )}
        />

        {/* FM-014 — `shading` (LK-005) */}
        <Controller
          name="shading"
          control={control}
          render={({ field: { name, value, onChange }, fieldState: { error } }) => (
            <Select
              label={text.fields.shading}
              name={name}
              value={value}
              onChange={onChange}
              options={shadingOptions}
              error={error?.message}
              isRequired
              loading={!!loading}
              isDisabled={disabled}
            />
          )}
        />

        {/* FM-015 — `trough_uuid` (LK-008 + botão "+"/edit → `InlineTroughModal`,
            H35/IG-016) */}
        <Box>
          <Box display="flex" alignItems="flex-end" gap={2}>
            <Box flex="1">
              <Controller
                name="trough_uuid"
                control={control}
                render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                  <Select
                    label={text.fields.trough}
                    name={name}
                    value={value}
                    onChange={onChange}
                    options={troughOptions}
                    error={error?.message}
                    isRequired
                    loading={!!loading}
                    isDisabled={disabled}
                  />
                )}
              />
            </Box>
            <IconButton
              aria-label={text.addTrough}
              size="sm"
              variant="outline"
              onClick={() => setInlineModal('trough')}
              disabled={disabled}
            >
              {watchedTroughUuid ? <Pencil /> : <Plus />}
            </IconButton>
          </Box>
        </Box>

        {/* FM-016 — `drinking_fountain_uuid` (LK-009 + botão "+"/edit →
            `InlineDrinkingFountainModal`, H35/IG-019) */}
        <Box>
          <Box display="flex" alignItems="flex-end" gap={2}>
            <Box flex="1">
              <Controller
                name="drinking_fountain_uuid"
                control={control}
                render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                  <Select
                    label={text.fields.drinkingFountain}
                    name={name}
                    value={value}
                    onChange={onChange}
                    options={drinkingFountainOptions}
                    error={error?.message}
                    isRequired
                    loading={!!loading}
                    isDisabled={disabled}
                  />
                )}
              />
            </Box>
            <IconButton
              aria-label={text.addDrinkingFountain}
              size="sm"
              variant="outline"
              onClick={() => setInlineModal('drinking-fountain')}
              disabled={disabled}
            >
              {watchedDrinkingFountainUuid ? <Pencil /> : <Plus />}
            </IconButton>
          </Box>
        </Box>
      </SimpleGrid>

      <InlineTroughModal
        isOpen={inlineModal === 'trough'}
        onClose={() => setInlineModal(null)}
        onCreated={(option) => {
          setTroughList((current) => [...current, option]);
          setValue(
            'trough_uuid',
            { label: option.description, value: option.uuid },
            { shouldDirty: true, shouldValidate: true }
          );
        }}
      />
      <InlineDrinkingFountainModal
        isOpen={inlineModal === 'drinking-fountain'}
        onClose={() => setInlineModal(null)}
        onCreated={(option) => {
          setDrinkingFountainList((current) => [...current, option]);
          setValue(
            'drinking_fountain_uuid',
            { label: option.description, value: option.uuid },
            { shouldDirty: true, shouldValidate: true }
          );
        }}
      />
    </Box>
  );
}
