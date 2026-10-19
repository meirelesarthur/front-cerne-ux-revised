// src/pages/Operacional/Reproducao/GerenciamentoAvancado/FilterSideGerenciamentoAvancado.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem "Gerenciamento Avançado" (AdvancedReproductive
// — Operacional / Reprodução, F-011, 97-Esteiras/056, TASK-AR-FE-02).
// Contrato B canônico (`FilterModalProps<T>`, seis props exatas,
// `<Form formFilter>`), 6 campos na ORDEM EXATA do contrato de tela
// (roteiro-cirurgico-frontend-advanced-reproductive.md §2/§5):
//   search · reproductive_status · breeding_batch_id · breeding_season_id ·
//   protocol_id · bull_seed_season_id
//
// - `search`: texto livre.
// - `reproductive_status`: Select ESTÁTICO via fábrica
//   `reproductiveStatusOptions` (enum fechado, 1=Prenha/2=Vazia/3=Parida).
// - `breeding_batch_id` / `breeding_season_id` / `bull_seed_season_id`:
//   `SelectAsyncPaginate` apontando DIRETO para os 3 CRUDs paginados JÁ
//   existentes (`listBreedingBatches`/`listBreedingSeasons`/
//   `listBullSeedSeasons`) — não há endpoint `-options` dedicado para essas 3
//   entidades no contrato fechado (achado do Arquiteto, roteiro §6.3). Mirror
//   `FilterSideBudget.product`/`.client`.
// - `protocol_id`: endpoint dedicado é PLANO (sem paginação/`meta`) — `Select`
//   + `useQuery` DIRETO, mirror EXATO `FilterSideEstacaoDeMonta.user_uuid`.
//   NUNCA `SelectAsyncPaginate` aqui (armadilha documentada, roteiro §6.4).
//
// Re-hidratação (`toInternalValues`) — `AdvancedReproductiveFilterForm`
// (FE-01, não editado aqui) guarda só o `uuid` cru dos 3 campos catálogo
// (sem par uuid+label), então não há como resolver o label exato de um
// catálogo PAGINADO sem uma 2ª chamada de detalhe (que o contrato de API não
// expõe). Aplica-se a MESMA técnica tolerante já usada em
// `FilterSideEstacaoDeMonta.toInternalValues` para o caso estruturalmente
// idêntico: mostra o próprio uuid como label até o usuário reabrir o select e
// escolher de novo — nunca quebra a re-hidratação, nunca inventa um endpoint
// de detalhe que não existe. `protocol_id` resolve o label EXATO (fonte finita
// já carregada) e `reproductive_status` resolve o label EXATO (enum fechado).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { reproductiveStatusOptions } from '@/constants/AdvancedReproductive/options';
import { queryKey } from '@/constants/query-key';

import { listProtocolSeasonOptions } from '@/services/v2/AdvancedReproductive/advanced-reproductive-service';
import { listBreedingBatches } from '@/services/v2/BreedingBatch/breeding-batch-service';
import { listBreedingSeasons } from '@/services/v2/BreedingSeasons/breeding-season-service';
import { listBullSeedSeasons } from '@/services/v2/BullSeedSeason/bull-seed-season-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type {
  AdvancedReproductiveFilterForm,
  ReproductiveStatus,
} from '@/@types/v2/AdvancedReproductive';
import type { BreedingBatchListItem } from '@/@types/v2/BreedingBatch';
import type { BreedingSeasonListItem } from '@/@types/v2/BreedingSeasons';
import type { BullSeedSeasonListItem } from '@/@types/v2/BullSeedSeason';

interface FilterFormValues {
  search: string;
  reproductive_status: Option<ReproductiveStatus> | null;
  breeding_batch_id: Option<string> | null;
  breeding_season_id: Option<string> | null;
  protocol_id: Option<string> | null;
  bull_seed_season_id: Option<string> | null;
}

const pristineFormValues: FilterFormValues = {
  search: '',
  reproductive_status: null,
  breeding_batch_id: null,
  breeding_season_id: null,
  protocol_id: null,
  bull_seed_season_id: null,
};

function mapBreedingBatchOption(item: BreedingBatchListItem): Option<string> {
  return { label: `${item.code} — ${item.description}`, value: item.uuid };
}

function mapBreedingSeasonOption(item: BreedingSeasonListItem): Option<string> {
  return { label: `${item.code} — ${item.description}`, value: item.uuid };
}

function mapBullSeedSeasonOption(item: BullSeedSeasonListItem): Option<string> {
  return { label: `${item.code} — ${item.description}`, value: item.uuid };
}

// Fallback tolerante (mesma técnica de `FilterSideEstacaoDeMonta`) — sem
// endpoint de detalhe avulso, mostra o próprio uuid como label até o usuário
// reabrir o select e escolher de novo.
function toRawUuidOption(uuid?: string): Option<string> | null {
  return uuid ? { value: uuid, label: uuid } : null;
}

export function FilterSideGerenciamentoAvancado({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<AdvancedReproductiveFilterForm>) {
  const text = languageGB.advancedReproductive.advancedReproductive.list.filter;

  // `protocol-season-options` é PLANO (sem `meta`/paginação) — `useQuery`
  // direto, NUNCA `SelectAsyncPaginate` (o endpoint não pagina, roteiro §6.4).
  const protocolOptionsQuery = useQuery({
    queryKey: [queryKey.advancedReproductive.protocolSeasonOptions],
    queryFn: listProtocolSeasonOptions,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const protocolOptions: Option<string>[] = (protocolOptionsQuery.data ?? []).map((item) => ({
    label: item.description,
    value: item.uuid,
  }));

  function toInternalValues(rawFilter?: AdvancedReproductiveFilterForm | null): FilterFormValues {
    const matchedProtocol = rawFilter?.protocol_id
      ? protocolOptions.find((option) => option.value === rawFilter.protocol_id)
      : undefined;

    return {
      search: rawFilter?.search ?? '',
      reproductive_status:
        rawFilter?.reproductive_status != null
          ? reproductiveStatusOptions.getOption(rawFilter.reproductive_status, languageGB)
          : null,
      breeding_batch_id: toRawUuidOption(rawFilter?.breeding_batch_id),
      breeding_season_id: toRawUuidOption(rawFilter?.breeding_season_id),
      protocol_id: matchedProtocol ?? toRawUuidOption(rawFilter?.protocol_id),
      bull_seed_season_id: toRawUuidOption(rawFilter?.bull_seed_season_id),
    };
  }

  const { control, register, handleSubmit, reset } = useForm<FilterFormValues>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: { ...pristineFormValues, ...toInternalValues(filter) },
  });

  // Re-hidratação ao (re)abrir o drawer — deps SOMENTE [isOpen] (nunca
  // [filter]), mesma disciplina de todos os FilterSide do projeto.
  useEffect(() => {
    reset({ ...pristineFormValues, ...toInternalValues(filter) });
  }, [isOpen]);

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      search: data.search.trim() || undefined,
      reproductive_status: data.reproductive_status?.value ?? undefined,
      breeding_batch_id: data.breeding_batch_id?.value || undefined,
      breeding_season_id: data.breeding_season_id?.value || undefined,
      protocol_id: data.protocol_id?.value || undefined,
      bull_seed_season_id: data.bull_seed_season_id?.value || undefined,
    });
    onClose();
  }

  function handleResetFilters() {
    handleReset();
    reset(pristineFormValues);
  }

  function handleResetFiltersOnClose() {
    reset({ ...pristineFormValues, ...toInternalValues(filter) });
    onClose();
  }

  return (
    <FilterSide isOpen={isOpen} onClose={onClose} languageGB={languageGB}>
      <Form noPadding formFilter onSubmit={handleSubmit(onSubmit)}>
        <Form.BodyFilter>
          <Text fontWeight="bold" color="brandColorText">
            {text.title}
          </Text>

          <Input label={text.search} {...register('search')} />

          <Controller
            name="reproductive_status"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                name={name}
                label={text.reproductiveStatus}
                options={reproductiveStatusOptions.options(languageGB)}
                value={value ?? null}
                onChange={(option: any) => onChange(option ?? null)}
              />
            )}
          />

          <Controller
            name="breeding_batch_id"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <SelectAsyncPaginate
                name={name}
                label={text.breedingBatch}
                service={listBreedingBatches}
                mapOptions={mapBreedingBatchOption}
                value={value ?? null}
                onChange={(option: any) => onChange(option ?? null)}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="breeding_season_id"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <SelectAsyncPaginate
                name={name}
                label={text.breedingSeason}
                service={listBreedingSeasons}
                mapOptions={mapBreedingSeasonOption}
                value={value ?? null}
                onChange={(option: any) => onChange(option ?? null)}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="protocol_id"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                name={name}
                label={text.protocol}
                options={protocolOptions}
                value={value ?? null}
                onChange={(option: any) => onChange(option ?? null)}
                loading={protocolOptionsQuery.isLoading}
              />
            )}
          />

          <Controller
            name="bull_seed_season_id"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <SelectAsyncPaginate
                name={name}
                label={text.bullSeedSeason}
                service={listBullSeedSeasons}
                mapOptions={mapBullSeedSeasonOption}
                value={value ?? null}
                onChange={(option: any) => onChange(option ?? null)}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />
        </Form.BodyFilter>
        <Form.FooterFilter>
          <Button
            title={languageGB.defaltStrings.clearAllFilters}
            variant="ghost"
            p="0"
            color="semanticNeutral.900"
            height="4"
            marginTop="4"
            onClick={handleResetFilters}
            type="button"
          />
          <Button
            title={languageGB.defaltStrings.cancel}
            variant="outline"
            onClick={handleResetFiltersOnClose}
            type="button"
          />
          <Button title={languageGB.defaltStrings.applyFilters} type="submit" />
        </Form.FooterFilter>
      </Form>
    </FilterSide>
  );
}

export default FilterSideGerenciamentoAvancado;
