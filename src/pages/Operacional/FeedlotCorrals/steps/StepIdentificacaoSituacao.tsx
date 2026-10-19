// src/pages/Operacional/FeedlotCorrals/steps/StepIdentificacaoSituacao.tsx
// -----------------------------------------------------------------------------
// Etapa 1/3 do wizard de Curral (FeedlotCorral) — Identificação & Situação —
// TASK-043-CUR-T03 (`03-Wizard-Casca-Etapa1.md`, contrato de tela §6 Etapa 1).
// Campos FM-001..007: `identification` (readonly, texto estático — nunca
// campo RHF, mirror `FeedlotCorralDialog.tsx`), `name`, `feedlot_sector_uuid`
// (`SelectAsyncPaginate`/`listFeedlotSectors`, GAP-API-03), `installation_type`
// (select LK-001), `status` (select LK-002 — editável+obrigatório em criar,
// VISÍVEL porém readonly-attr em editar, PARADA-D — diferente do diálogo do
// Mapa, que ESCONDE o campo em editar), `available_at`/`note` (condicionais
// IG-009, `.when('status')` do schema composto).
//
// IG-009/CV-013 (troca INTERATIVA de status): reagimos somente quando
// `dirtyFields.status` é verdadeiro — nunca na hidratação programática do
// `fillForm`/`reset()` (que NÃO marca dirty). Isso restaura o comportamento
// pretendido pelo legado (auto-default ao TROCAR o status) sem reproduzir o
// defeito DEF-007/RT-005/PARADA-DEF-A (JS sobrescrevia o valor do banco com
// hoje+7 mesmo em carregamento passivo — aqui carregamento passivo nunca
// dispara o efeito).
//
// TASK-063-CUR-02 (execução 063, F-035 Currais) — `FeedlotCorralResource::
// toArray()` (GB.Cerne.Api) já expõe `available_at`/`last_status_note`
// (CUR-04b/PARADA-DEF-A) no `GET /feedlot-corrals/{uuid}`. Em EDITAR, o
// `fillForm()` de `CreateOrUpdateFeedlotCorral.tsx` hidrata esses 2 campos
// com o valor REAL do recurso — a lacuna que este comentário descrevia
// (hidratar vazio/obrigatório por falta do dado na API) já foi fechada; não
// há mais campo "inventado" nem auto-preenchimento indevido do legado aqui.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Box, SimpleGrid, Skeleton, Text } from '@chakra-ui/react';
import {
  Control,
  Controller,
  FieldErrors,
  FieldNamesMarkedBoolean,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from 'react-hook-form';

import { DateInput } from '@/components/DateInput';
import { Field } from '@/components/Form/Field';
import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { Textarea } from '@/components/Form/Textarea';

import { useLanguage } from '@/hooks/useLanguage';

import { requiresStatusDetail } from '@/validations/schemas/FeedlotCorrals/feedlotCorralWizard-schema';

import { listFeedlotSectors } from '@/services/v2/FeedlotSectors/feedlot-sector-service';

import type { FeedlotCorralEnumRef, FeedlotCorralWizardForm } from '@/@types/v2/FeedlotCorrals';
import type { FeedlotSectorListItem } from '@/@types/v2/FeedlotSectors';

export interface StepIdentificacaoSituacaoProps {
  control: Control<FeedlotCorralWizardForm>;
  register: UseFormRegister<FeedlotCorralWizardForm>;
  errors: FieldErrors<FeedlotCorralWizardForm>;
  watch: UseFormWatch<FeedlotCorralWizardForm>;
  setValue: UseFormSetValue<FeedlotCorralWizardForm>;
  dirtyFields: Partial<Readonly<FieldNamesMarkedBoolean<FeedlotCorralWizardForm>>>;
  disabled?: boolean;
  loading?: boolean;
  isEditing: boolean;
  /** Texto de `identification` — valor do item em editar; `undefined` em criar. */
  identification?: string;
  /**
   * Preview do próximo `identification` sequencial em CRIAR (GAP-API-03,
   * `next_identification` de `GET /feedlot-corrals/options`) — mirror do
   * "0026" real do legado (`legado-cur-create.png`). `null`/`undefined`
   * (options ainda carregando ou requisição falhou) cai no hint genérico —
   * nunca inventa um número (Regra 9).
   */
  nextIdentification?: string | null;
  installationTypeOptions: FeedlotCorralEnumRef[];
  statusOptions: FeedlotCorralEnumRef[];
  /** Setor travado por `?sector_uuid=` (criar) ou fixo por edição (PARADA-D/E). */
  sectorLocked: boolean;
}

function addDaysIso(base: Date, days: number): string {
  const result = new Date(base);
  result.setDate(result.getDate() + days);
  return result.toISOString().slice(0, 10);
}

export function StepIdentificacaoSituacao({
  control,
  register,
  errors,
  watch,
  setValue,
  dirtyFields,
  disabled,
  loading,
  isEditing,
  identification,
  nextIdentification,
  installationTypeOptions,
  statusOptions,
  sectorLocked,
}: StepIdentificacaoSituacaoProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.feedlotCorrals.feedlotCorral;
  const corralFieldsText = languageGB.feedlotMap.feedlotMap.corral.fields;
  const statusFieldsText = languageGB.feedlotMap.feedlotMap.status.fields;

  const watchedStatus = watch('status');
  const watchedAvailableAt = watch('available_at');

  // IG-009/CV-013 — só reage a troca INTERATIVA (`dirtyFields.status`), nunca
  // à hidratação programática do `fillForm` (evita PARADA-DEF-A/DEF-007).
  useEffect(() => {
    if (!dirtyFields.status) return;

    if (requiresStatusDetail(watchedStatus)) {
      if (!watchedAvailableAt) {
        setValue('available_at', addDaysIso(new Date(), 7), {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
    } else {
      setValue('available_at', null, { shouldDirty: true, shouldValidate: true });
      setValue('note', '', { shouldDirty: true, shouldValidate: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedStatus, dirtyFields.status]);

  const showStatusDetail = requiresStatusDetail(watchedStatus);

  return (
    <Box>
      {/* FM-001 — `identification`: SEMPRE readonly/texto estático, nunca
          `Input`/campo RHF (mirror `FeedlotCorralDialog.tsx`/
          `CreateOrUpdateFeedlotSector.tsx`). Criar: preview do próximo
          código real (GAP-API-03 RESOLVIDO, `next_identification` de `GET
          /feedlot-corrals/options`, mirror `codeValue` de
          `CreateOrUpdateOrder.tsx`/`CreateOrUpdateBudget.tsx`) — fallback ao
          hint genérico só enquanto as options carregam ou se a API não
          devolver o valor (nunca inventa um número, Regra 9). Editar: valor
          real do item. */}
      <Box
        bg="bg.muted"
        border="1px solid"
        borderColor="border.subtle"
        borderRadius="lg"
        px={4}
        py={3}
        mb={6}
      >
        <Skeleton loading={!!loading} borderRadius="md">
          <Box>
            <Text fontSize="xs" fontWeight="semibold" color="fg.muted" textTransform="uppercase">
              {corralFieldsText.identification}
            </Text>
            <Text fontSize="md" fontWeight="bold" fontFamily="mono">
              {isEditing
                ? identification
                : (nextIdentification ?? text.form.hints.identificationGenerated)}
            </Text>
          </Box>
        </Skeleton>
      </Box>

      <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
        {/* FM-002 — `name` */}
        <Input
          label={corralFieldsText.name}
          {...register('name')}
          error={errors.name?.message}
          isRequired
          loading={!!loading}
          disabled={disabled}
        />

        {/* FM-003 — `feedlot_sector_uuid` (GAP-API-03, ADITIVO só do wizard).
            Editável em criar (salvo `?sector_uuid=`, PARADA-E); fixo/readonly
            em editar (PARADA-D — setor imutável pós-create, mirror
            `feedlot_yard_uuid` de `CreateOrUpdateFeedlotSector.tsx`). */}
        <Controller
          name="feedlot_sector_uuid"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <SelectAsyncPaginate
              name={field.name}
              label={text.form.fields.feedlotSector}
              placeholder={text.form.placeholders.feedlotSector}
              error={error?.message}
              service={listFeedlotSectors}
              mapOptions={(item: FeedlotSectorListItem) => ({ label: item.name, value: item.uuid })}
              findParams={(search: string | { search: string }) => ({
                search: typeof search === 'string' ? search : search.search,
                is_active: true,
              })}
              value={field.value ?? undefined}
              onChange={(option: any) => field.onChange(option ?? null)}
              isRequired
              isReadOnly={sectorLocked}
              isDisabled={sectorLocked || !!disabled}
            />
          )}
        />

        {/* FM-004 — `installation_type` (LK-001) */}
        <Controller
          name="installation_type"
          control={control}
          render={({ field: { name, value, onChange }, fieldState: { error } }) => (
            <Select
              label={corralFieldsText.installationType}
              name={name}
              value={value}
              onChange={onChange}
              options={installationTypeOptions}
              error={error?.message}
              isRequired
              loading={!!loading}
              isDisabled={disabled}
            />
          )}
        />

        {/* FM-005 — `status` (LK-002). Editável+obrigatório em criar;
            VISÍVEL porém readonly-attr em editar (PARADA-D) — diferente do
            diálogo do Mapa (que esconde o campo em editar): aqui a fidelidade
            pede o valor exposto na Etapa 1, só sem permitir alterá-lo (a
            troca de status real é o fluxo próprio de Situação, T08). */}
        <Controller
          name="status"
          control={control}
          render={({ field: { name, value, onChange }, fieldState: { error } }) => (
            <Select
              label={corralFieldsText.status}
              name={name}
              value={value}
              onChange={onChange}
              options={statusOptions}
              error={error?.message}
              isRequired
              loading={!!loading}
              isReadOnly={isEditing}
              isDisabled={isEditing || !!disabled}
            />
          )}
        />

        {/* FM-006/FM-007 — `available_at`/`note`, condicionais IG-009 (status
            ∈ {VS,FE,MA,LI}). Ocultos+limpos nos demais status. */}
        {showStatusDetail && (
          <>
            <Controller
              name="available_at"
              control={control}
              render={({ field, fieldState }) => (
                <Field
                  label={statusFieldsText.availableAt}
                  isRequired
                  errorText={fieldState.error?.message}
                >
                  <DateInput value={field.value} onChange={field.onChange} disabled={disabled} />
                </Field>
              )}
            />

            <Textarea
              label={statusFieldsText.note}
              {...register('note')}
              error={errors.note?.message}
              isRequired
              minH="100px"
              disabled={disabled}
            />
          </>
        )}
      </SimpleGrid>
    </Box>
  );
}
