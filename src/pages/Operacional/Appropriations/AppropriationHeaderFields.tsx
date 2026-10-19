// src/pages/Operacional/Appropriations/AppropriationHeaderFields.tsx
// -----------------------------------------------------------------------------
// Bloco Header/Identificação do Apontamento — TASK-FE-731 (execução 034/035,
// refação completa da Finalização). Extraído de `CreateOrUpdateAppropriation.
// tsx` (JSX inline, linhas 727-939 da versão anterior) para ser reaproveitado
// LITERALMENTE por `FinishAppropriation.tsx` (TASK-FE-737) — mirror 1:1 do
// JSX original, sem mudança de comportamento em `CreateOrUpdateAppropriation.
// tsx` (create/edit continuam idênticos, `showCode` default `false`).
//
// Máscara da Finalização (ratificada pelo dono 2026-08-11, `GAP-BE-655`
// `## Decisão do Desenvolvedor`, nota 2): readonly = Código (NOVO, só quando
// `showCode`) + Responsável + Área Total; editável = `date`, `description`,
// `area_uuid`, `operation_uuid`, `activity_uuid`, `used_area`,
// `cultivation_uuid`, `harvest_uuid` — os MESMOS 8 campos já editáveis em
// create/edit, sem nenhuma mudança de comportamento aqui.
// -----------------------------------------------------------------------------

import { Box, SimpleGrid } from '@chakra-ui/react';
import { Controller } from 'react-hook-form';

import { DateInput } from '@/components/DateInput';
import { Field } from '@/components/Form/Field';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { NumberInput } from '@/components/Form/NumberInput';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { SelectCultivation } from '@/components/Form/SelectCultivation';
import { Textarea } from '@/components/Form/Textarea';

import { useLanguage } from '@/hooks/useLanguage';

import { columnsForm } from '@/constants/coluns-form';

import { listActivities } from '@/services/v2/Activities/activity-service';
import { listHarvests } from '@/services/v2/Harvests/harvest-service';
import { listOperations } from '@/services/v2/Operations/operation-service';

import type { ResponsePagination } from '@/@types/response-api';
import type { ActivityListItem } from '@/@types/v2/Activities';
import type { AppropriationForm as AppropriationFormType } from '@/@types/v2/Appropriations';
import type { AreaListItem } from '@/@types/v2/BaseRegistrations/areas';
import type { Harvest } from '@/@types/v2/Harvests';
import type { OperationListItem } from '@/@types/v2/Operations';

import type {
  Control,
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from 'react-hook-form';

export interface AppropriationHeaderFieldsProps {
  control: Control<AppropriationFormType>;
  errors: FieldErrors<AppropriationFormType>;
  watch: UseFormWatch<AppropriationFormType>;
  setValue: UseFormSetValue<AppropriationFormType>;
  register: UseFormRegister<AppropriationFormType>;
  canSave: boolean;
  isLoading: boolean;
  /** Gate de sequência (AP-02) — em CRIAÇÃO, Atividade só habilita após
   *  Operação escolhida; em EDIÇÃO/Finalização, nunca desabilitar (dados
   *  históricos podem ter Atividade sem Operação persistida). Mirror EXATO
   *  do `isEditing` já usado em `CreateOrUpdateAppropriation.tsx`. */
  isEditing: boolean;
  /** "Responsável" — já resolvido pelo caller (CREATE = usuário logado,
   *  EDIT/Finalização = `employee.name`/`user.name` do detalhe). */
  responsibleLabel: string;
  /** Catálogo de Área já escopado pela farm ativa do caller (evita
   *  prop-drilling de `activeFarmUuid`/`useAuth` para este componente). */
  listAreasForActiveFarm: (params: {
    search?: string;
    page?: number;
    per_page?: number;
  }) => Promise<ResponsePagination<AreaListItem[]>>;
  /** TASK-FE-731 — Campo NOVO, exclusivo da Finalização (`FinishAppropriation.
   *  tsx`, `showCode={true}`). Default `false` preserva `CreateOrUpdateAppropriation.
   *  tsx` sem Código visível — fiel ao comportamento atual, que também não
   *  mostra esse campo. */
  showCode?: boolean;
  code?: string | null;
}

export function AppropriationHeaderFields({
  control,
  errors,
  watch,
  setValue,
  register,
  canSave,
  isLoading,
  isEditing,
  responsibleLabel,
  listAreasForActiveFarm,
  showCode = false,
  code,
}: AppropriationHeaderFieldsProps) {
  const { languageGB } = useLanguage();
  const formText = languageGB.appropriations.appropriation.form;

  return (
    <>
      <SimpleGrid columns={columnsForm.default} gap={6} pt={4}>
        {showCode && (
          <InputReadOnly label={formText.fields.code} value={code ?? '—'} loading={isLoading} />
        )}

        <Controller
          name="date"
          control={control}
          render={({ field: { value, onChange } }) => (
            <Field
              label={formText.fields.date}
              isRequired
              errorText={errors.date?.message as string | undefined}
            >
              <DateInput
                value={value ?? null}
                onChange={onChange}
                disabled={!canSave || isLoading}
              />
            </Field>
          )}
        />

        <Controller
          name="area_uuid"
          control={control}
          render={({ field }) => (
            <SelectAsyncPaginate
              name={field.name}
              label={formText.fields.area}
              placeholder={formText.placeholders.area}
              error={errors.area_uuid?.message as string | undefined}
              service={listAreasForActiveFarm}
              mapOptions={(item: AreaListItem) => ({
                label: item.description,
                value: item.uuid,
                productive_area: item.productive_area,
              })}
              findParams={(search: string | { search: string }) => ({
                search: typeof search === 'string' ? search : search.search,
              })}
              value={field.value ?? undefined}
              onChange={(option: any) => {
                field.onChange(option ?? null);
                setValue('area_total', option?.productive_area ?? null);
              }}
              isRequired
              isDisabled={!canSave || isLoading}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          )}
        />

        <InputReadOnly
          label={formText.fields.areaTotal}
          value={
            watch('area_total') !== null
              ? Number(watch('area_total')).toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              : '—'
          }
        />

        <Controller
          name="operation_uuid"
          control={control}
          render={({ field }) => (
            <SelectAsyncPaginate
              name={field.name}
              label={formText.fields.operation}
              placeholder={formText.placeholders.operation}
              service={listOperations}
              // `id` numérico embutido na option (OperationResource expõe
              // id+uuid, Operation-contrato v2.1 D4) — necessário para o
              // filtro `operation_id` (int) de `listActivities`
              // (ActivityFilterData::operationId, TASK-FE-601/AP-02).
              mapOptions={(item: OperationListItem) => ({
                label: item.name,
                value: item.uuid,
                id: item.id,
              })}
              findParams={(search: string | { search: string }) => ({
                search: typeof search === 'string' ? search : search.search,
              })}
              value={field.value ?? undefined}
              onChange={(option: any) => {
                field.onChange(option ?? null);
                // CASCATA (AP-02) — trocar a Operação invalida a Atividade
                // escolhida (pode não pertencer à nova Operação).
                setValue('activity_uuid', null);
              }}
              isDisabled={!canSave || isLoading}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          )}
        />

        <Controller
          name="activity_uuid"
          control={control}
          render={({ field }) => (
            <SelectAsyncPaginate
              name={field.name}
              label={formText.fields.activity}
              placeholder={formText.placeholders.activity}
              error={errors.activity_uuid?.message as string | undefined}
              service={listActivities}
              mapOptions={(item: ActivityListItem) => ({
                label: item.name,
                value: item.uuid,
              })}
              findParams={(search: string | { search: string }) => ({
                search: typeof search === 'string' ? search : search.search,
                // Cascata (AP-02) — Activity-contrato §13/TASK-FE-601: filtro
                // real do backend é `operation_id` (int, id interno de
                // `operations`, NÃO uuid). `id` vem embutido na option de
                // Operação (acima).
                operation_id: (watch('operation_uuid') as any)?.id,
              })}
              // Descarta o cache de opções quando a Operação muda — senão o
              // menu continuaria oferecendo Atividades da Operação anterior.
              cacheUniqs={[(watch('operation_uuid') as any)?.id]}
              value={field.value ?? null}
              onChange={(option: any) => field.onChange(option ?? null)}
              isRequired
              // Gate de sequência (AP-02, mirror AP-05/TASK-FE-604): em
              // CRIAÇÃO, Atividade só habilita após escolher Operação. Em
              // EDIÇÃO/Finalização, nunca desabilitar — dados históricos
              // podem ter Atividade sem Operação persistida.
              isDisabled={!canSave || isLoading || (!isEditing && !watch('operation_uuid'))}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          )}
        />

        <Controller
          name="cultivation_uuid"
          control={control}
          render={({ field }) => (
            <SelectCultivation
              name={field.name}
              label={formText.fields.cultivation}
              placeholder={formText.placeholders.cultivation}
              value={field.value ?? null}
              onChange={(option) => field.onChange(option ?? null)}
              isDisabled={!canSave || isLoading}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          )}
        />

        <Controller
          name="harvest_uuid"
          control={control}
          render={({ field }) => (
            <SelectAsyncPaginate
              name={field.name}
              label={formText.fields.harvest}
              placeholder={formText.placeholders.harvest}
              service={listHarvests}
              mapOptions={(item: Harvest) => ({ label: item.description, value: item.uuid })}
              findParams={(search: string | { search: string }) => ({
                search: typeof search === 'string' ? search : search.search,
              })}
              value={field.value ?? undefined}
              onChange={(option: any) => field.onChange(option ?? null)}
              isDisabled={!canSave || isLoading}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          )}
        />

        <Controller
          name="used_area"
          control={control}
          render={({ field }) => (
            <NumberInput
              name={field.name}
              label={formText.fields.usedArea}
              allowDot
              decimalPlaces={2}
              value={field.value ?? null}
              onValueChange={(value) => field.onChange(value)}
              error={errors.used_area?.message as string | undefined}
              disabled={!canSave || isLoading}
            />
          )}
        />

        <InputReadOnly
          label={formText.fields.responsible}
          value={responsibleLabel}
          loading={isLoading}
        />
      </SimpleGrid>

      <Box mt={6} w="full">
        <Textarea
          label={formText.fields.description}
          {...register('description')}
          disabled={!canSave || isLoading}
        />
      </Box>
    </>
  );
}
