// src/pages/Operacional/Pastagem/HeaderFieldsPastagem.tsx
// -----------------------------------------------------------------------------
// Aba "Geral" do form de Pastagem — TASK-PAST-FE-03. Campos principais +
// cascatas (IG-01..06, ver `useCascadesPastagem.ts`). Mirror
// `AppropriationHeaderFields.tsx` (feature irmã).
//
// TASK-PAST-FIX-FE-03b (fidelidade de layout ao legado, decisão do dono) —
// "Armazém de Insumos" (`inputs_warehouse_uuid`) e "Armazém de Produção"
// (`productions_warehouse_uuid`) foram RELOCADOS deste cabeçalho para o
// TOPO de suas respectivas abas (`ProductsFieldArray.tsx`/
// `ProductionFieldArray.tsx`) — mirror exato do legado
// (`_product.blade.php`/`_production.blade.php`: cada Armazém fica na
// própria aba, travando o Select de Produto até ser escolhido ali). O nome
// do campo RHF NÃO mudou (mesmo `control` raiz) — só o COMPONENTE que
// renderiza o Controller mudou de arquivo.
// -----------------------------------------------------------------------------

import { SimpleGrid } from '@chakra-ui/react';
import { Controller } from 'react-hook-form';

import { DateInput } from '@/components/DateInput';
import { Field } from '@/components/Form/Field';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';

import { columnsForm } from '@/constants/coluns-form';

import { listActivities } from '@/services/v2/Activities/activity-service';
import { listAnimals } from '@/services/v2/Animals/animal-service';
import { listAreas } from '@/services/v2/BaseRegistrations/areas-service';
import { listGrazings } from '@/services/v2/BaseRegistrations/grazings-service';
import { listBatchOptionsForForm } from '@/services/v2/Batches/batch-service';
import { listOperations } from '@/services/v2/Operations/operation-service';

import type { ActivityListItem } from '@/@types/v2/Activities';
import type { AnimalListItem } from '@/@types/v2/Animals';
import type { AreaListItem } from '@/@types/v2/BaseRegistrations/areas';
import type { GrazingListItem } from '@/@types/v2/BaseRegistrations/grazings';
import type { BatchOption } from '@/@types/v2/Batches';
import type { OperationListItem } from '@/@types/v2/Operations';
import type { PastureForm } from '@/@types/v2/Pastures';

import { useCascadesPastagem } from './useCascadesPastagem';

import type { Control, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';

export interface HeaderFieldsPastagemProps {
  control: Control<PastureForm>;
  errors: FieldErrors<PastureForm>;
  watch: UseFormWatch<PastureForm>;
  setValue: UseFormSetValue<PastureForm>;
  canSave: boolean;
  isLoading: boolean;
  /** TASK-PAST-FIX-FE-01 — label do "Responsável" já resolvido pelo
   *  componente pai (`CreateOrUpdatePastagem.tsx`): `data.requester` na
   *  edição, usuário logado (`useAuth`) na criação. Mantém este componente
   *  "burro" (sem acoplar a `useAuth`/`isEditing` diretamente). */
  requesterLabel: string;
}

export function HeaderFieldsPastagem({
  control,
  errors,
  watch,
  setValue,
  canSave,
  isLoading,
  requesterLabel,
}: HeaderFieldsPastagemProps) {
  const { languageGB } = useLanguage();
  const { activeFarmUuid } = useAuth();
  const text = languageGB.pastures.pasture.form;
  const isDisabled = !canSave || isLoading;

  const { handleOperationChange, handleAreaChange, handleGrazingChange, handleBatchChange } =
    useCascadesPastagem({ watch, setValue });

  function listAreasForActiveFarm(params: { search?: string; page?: number; per_page?: number }) {
    return listAreas({ ...params, farm_uuid: activeFarmUuid ?? '' });
  }

  const watchedBatch = watch('batch_uuid');

  function listAnimalsByBatch(params: { search?: string; page?: number; per_page?: number }) {
    return listAnimals({ ...params, batch: watchedBatch?.value });
  }

  return (
    <SimpleGrid columns={columnsForm.default} gap={6} pt={4}>
      <Controller
        name="date"
        control={control}
        render={({ field: { value, onChange } }) => (
          <Field
            label={text.fields.date}
            isRequired
            errorText={errors.date?.message as string | undefined}
          >
            <DateInput value={value ?? null} onChange={onChange} disabled={isDisabled} />
          </Field>
        )}
      />

      {/* TASK-PAST-FIX-FE-01 — "Responsável" volta a ser o usuário logado
          (readonly), fiel ao legado (`_forms.blade.php:14-15`): NUNCA um
          Select editável de Funcionário. Na edição, `data.requester`
          (calculado no Resource, fallback `employee?.name ?? user?.name`);
          na criação, o usuário da sessão atual. `employee_uuid` não é mais
          conceito do cabeçalho (removido de `PastureForm`/schema/payload). */}
      <InputReadOnly label={text.fields.requester} value={requesterLabel} />

      <Controller
        name="operation_uuid"
        control={control}
        render={({ field }) => (
          <SelectAsyncPaginate
            name={field.name}
            label={text.fields.operation}
            placeholder={text.placeholders.operation}
            error={errors.operation_uuid?.message as string | undefined}
            service={listOperations}
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
              handleOperationChange();
            }}
            isRequired
            isDisabled={isDisabled}
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
            label={text.fields.activity}
            placeholder={text.placeholders.activity}
            error={errors.activity_uuid?.message as string | undefined}
            service={listActivities}
            mapOptions={(item: ActivityListItem) => ({ label: item.name, value: item.uuid })}
            findParams={(search: string | { search: string }) => ({
              search: typeof search === 'string' ? search : search.search,
              operation_id: (watch('operation_uuid') as any)?.id,
            })}
            cacheUniqs={[(watch('operation_uuid') as any)?.id]}
            value={field.value ?? null}
            onChange={(option: any) => field.onChange(option ?? null)}
            isRequired
            isDisabled={isDisabled || !watch('operation_uuid')}
            menuPortalTarget={document.body}
            menuPosition="fixed"
          />
        )}
      />

      <Controller
        name="area_uuid"
        control={control}
        render={({ field }) => (
          <SelectAsyncPaginate
            name={field.name}
            label={text.fields.area}
            placeholder={text.placeholders.area}
            error={errors.area_uuid?.message as string | undefined}
            service={listAreasForActiveFarm}
            mapOptions={(item: AreaListItem) => ({ label: item.description, value: item.uuid })}
            findParams={(search: string | { search: string }) => ({
              search: typeof search === 'string' ? search : search.search,
            })}
            value={field.value ?? undefined}
            onChange={(option: any) => {
              field.onChange(option ?? null);
              if (option) handleAreaChange();
            }}
            isDisabled={isDisabled || !!watch('grazing_uuid')}
            menuPortalTarget={document.body}
            menuPosition="fixed"
          />
        )}
      />

      <Controller
        name="grazing_uuid"
        control={control}
        render={({ field }) => (
          <SelectAsyncPaginate
            name={field.name}
            label={text.fields.grazing}
            placeholder={text.placeholders.grazing}
            error={errors.grazing_uuid?.message as string | undefined}
            service={listGrazings}
            mapOptions={(item: GrazingListItem) => ({
              label: `${item.code} — ${item.description}`,
              value: item.uuid,
            })}
            findParams={() => ({})}
            value={field.value ?? undefined}
            onChange={(option: any) => {
              field.onChange(option ?? null);
              if (option) handleGrazingChange();
            }}
            isDisabled={isDisabled || !!watch('area_uuid')}
            menuPortalTarget={document.body}
            menuPosition="fixed"
          />
        )}
      />

      <Controller
        name="batch_uuid"
        control={control}
        render={({ field }) => (
          <SelectAsyncPaginate
            name={field.name}
            label={text.fields.batch}
            placeholder={text.placeholders.batch}
            // R4-FE-02 (P1) — `batch_uuid` de formulário, sem "Sem lote".
            service={listBatchOptionsForForm}
            mapOptions={(item: BatchOption) => ({ label: item.label, value: item.uuid })}
            findParams={(search: string | { search: string }) => ({
              search: typeof search === 'string' ? search : search.search,
            })}
            value={field.value ?? undefined}
            onChange={(option: any) => {
              field.onChange(option ?? null);
              handleBatchChange();
            }}
            isDisabled={isDisabled}
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
            label={text.fields.animal}
            placeholder={text.placeholders.animal}
            service={listAnimalsByBatch}
            mapOptions={(item: AnimalListItem) => ({
              label: item.identification,
              value: item.uuid,
            })}
            findParams={(search: string | { search: string }) => ({
              search: typeof search === 'string' ? search : search.search,
            })}
            cacheUniqs={[watchedBatch?.value]}
            value={field.value ?? undefined}
            onChange={(option: any) => field.onChange(option ?? null)}
            isDisabled={isDisabled || !watchedBatch}
            menuPortalTarget={document.body}
            menuPosition="fixed"
          />
        )}
      />
    </SimpleGrid>
  );
}
