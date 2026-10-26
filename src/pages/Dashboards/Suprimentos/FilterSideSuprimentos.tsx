// src/pages/Dashboards/Suprimentos/FilterSideSuprimentos.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO do Dashboard de Suprimentos (Tarefa 38) — Contrato B
// (`FilterModalProps<SupplyDashboardFilterForm>`), mirror estrutural de
// `src/pages/Invoices/FilterSideInvoice.tsx`. Campos:
//   - Fazendas: `CheckboxListField` + `listFarms()` (mirror
//     `StepUsuario.tsx` — endpoint sem paginação/busca real, filtro
//     client-side).
//   - Safra: `SelectAsyncPaginate` + `listHarvestOptions` (mirror
//     `CreateOrUpdateSolicitacao.tsx`, campo `harvest_uuid`).
//   - Dt. Início / Dt. Fim: `DateInput` (mirror `Relatorios/Suprimentos`).
//
// Cascata Safra→datas (AD-03, FID-G3F §5): trocar a Safra chama
// `useHarvestDetail` (REUSO DIRETO — zero fetch novo) e sobrescreve
// `start_date`/`end_date` DO PRÓPRIO FORM INTERNO via `setValue` — NUNCA
// dispara `handleFilterChange`/fecha o drawer sozinho (o usuário ainda
// precisa clicar "Aplicar filtros", mirror IG-1).
//
// CORREÇÃO PÓS-HOMOLOGAÇÃO (SUP-13/SUP-14, achados locais desta tela — NÃO
// existe hook compartilhado com outros dashboards para período/fazendas,
// cada `Dashboards/*` tem seu próprio filtro local):
//   - SUP-13: antes do primeiro "Aplicar filtros", `appliedFilter` (estado
//     da página) está vazio, então `filter.start_date`/`end_date` chegam
//     `undefined` aqui — mas o cabeçalho já mostra o período DEFAULT
//     calculado pelo backend (`dashboardQuery.data.period`). O drawer agora
//     recebe esse período via prop `defaultPeriod` e o usa como FALLBACK de
//     exibição em `toInternalValues`, só quando `filter.start_date`/
//     `end_date` ainda não foram explicitamente aplicados.
//   - SUP-14: enquanto nenhum filtro de fazenda foi explicitamente aplicado
//     (`filter.farm_ids === undefined`, nunca veio de um "Aplicar filtros"
//     anterior), o efeito de (re)abertura do drawer pré-marca TODAS as
//     fazendas já carregadas (equivalente a "Marcar todos" do
//     `CheckboxListField`) — some assim que o usuário aplica um filtro de
//     fazenda explícito (mesmo que seja "todas", vira uma lista concreta) ou
//     usa "Limpar filtros". É só `setValue`/`reset` no form interno, nunca
//     `handleFilterChange` — sem loop de request.
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';

import { useHarvestDetail } from '@/pages/CadastrosBase/Safra/useHarvests';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { CheckboxListField } from '@/components/Form/CheckboxListField';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { listFarms } from '@/services/v2/Farms/farm-service';
import { listHarvestOptions } from '@/services/v2/Harvests/harvest-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { Harvest } from '@/@types/v2/Harvests';
import type { SupplyDashboardFilterForm } from '@/@types/v2/SupplyDashboard';

// Forma INTERNA do form — Safra trabalha com `Option` (rótulo p/ exibição);
// o submit converte para o shape cru de `SupplyDashboardFilterForm`.
interface FilterFormValues {
  farm_ids: string[];
  harvest_id: Option<string> | null;
  start_date: string | null;
  end_date: string | null;
}

const pristineFormValues: FilterFormValues = {
  farm_ids: [],
  harvest_id: null,
  start_date: null,
  end_date: null,
};

interface FilterSideSuprimentosProps extends FilterModalProps<SupplyDashboardFilterForm> {
  /**
   * SUP-13 — período EFETIVAMENTE aplicado, lido de
   * `dashboardQuery.data.period` na página. Usado só como FALLBACK de
   * exibição quando `filter.start_date`/`end_date` ainda não foram
   * explicitamente aplicados pelo usuário (primeiro carregamento).
   */
  defaultPeriod?: { start_date: string; end_date: string } | null;
}

export function FilterSideSuprimentos({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
  defaultPeriod,
}: FilterSideSuprimentosProps) {
  const text = languageGB.supplyDashboard.filter;

  const [farmSearch, setFarmSearch] = useState('');

  // Fecha sobre `defaultPeriod` (prop) — precisa estar DENTRO do componente
  // para o fallback de SUP-13 funcionar tanto no `defaultValues` inicial
  // quanto no `reset` do efeito de reabertura, abaixo.
  function toInternalValues(rawFilter?: SupplyDashboardFilterForm | null): FilterFormValues {
    return {
      farm_ids: rawFilter?.farm_ids ?? [],
      // Sem Resource de detalhe da Safra aplicada — reabrir o drawer não
      // re-hidrata o RÓTULO da Safra (só o uuid seria necessário para
      // recarregar, e a cascata de datas já não dependeria dele) — mesma
      // tolerância de `parent_uuid` em `CreateOrUpdateSolicitacao.tsx`.
      harvest_id: null,
      start_date: rawFilter?.start_date ?? defaultPeriod?.start_date ?? null,
      end_date: rawFilter?.end_date ?? defaultPeriod?.end_date ?? null,
    };
  }

  const { control, handleSubmit, reset, setValue, watch } = useForm<FilterFormValues>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: { ...pristineFormValues, ...toInternalValues(filter) },
  });

  const {
    data: farms,
    isLoading: farmsLoading,
    isError: farmsError,
    refetch: refetchFarms,
  } = useQuery({
    queryKey: ['supply-dashboard-farms-options'],
    queryFn: listFarms,
    enabled: isOpen,
  });

  const farmItems = (farms ?? [])
    .filter((farm) => farm.description.toLowerCase().includes(farmSearch.toLowerCase()))
    .map((farm) => ({ value: farm.uuid, label: farm.description }));

  // Cascata Safra→datas (AD-03/FID-G3F §5) — REUSO DIRETO, zero fetch novo.
  const harvestValue = watch('harvest_id');
  const harvestDetailQuery = useHarvestDetail({ harvestId: harvestValue?.value });

  useEffect(() => {
    if (!harvestDetailQuery.data) return;
    // Só reescreve as datas DO FORM — não dispara handleFilterChange nem
    // fecha o drawer (o usuário ainda precisa clicar "Aplicar filtros").
    setValue('start_date', harvestDetailQuery.data.start_date ?? null);
    setValue('end_date', harvestDetailQuery.data.end_date ?? null);
  }, [harvestDetailQuery.data, setValue]);

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      farm_ids: data.farm_ids.length ? data.farm_ids : undefined,
      harvest_id: data.harvest_id?.value || undefined,
      start_date: data.start_date || undefined,
      end_date: data.end_date || undefined,
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

  useEffect(() => {
    const baseValues = { ...pristineFormValues, ...toInternalValues(filter) };

    // SUP-14 — nenhum filtro de fazenda foi explicitamente aplicado ainda
    // (`filter.farm_ids === undefined`, nunca veio de um "Aplicar filtros"
    // anterior): pré-marca TODAS as fazendas já carregadas (equivalente a
    // "Marcar todos"). Se a lista ainda não carregou no primeiro tick de
    // abertura, fica vazio até a query de fazendas resolver — este efeito
    // roda de novo (dependência em `farms`) e corrige assim que chegar.
    if (filter?.farm_ids === undefined && farms && farms.length > 0) {
      baseValues.farm_ids = farms.map((farm) => farm.uuid);
    }

    reset(baseValues);
    // Dependências: `isOpen` (reabertura, mirror Contrato B,
    // `get_pwa_grid_query_pattern` §"RE-HIDRATAÇÃO"), `farms` (SUP-14, só
    // populado quando a query de fazendas já resolveu) e `defaultPeriod`
    // (SUP-13, período default do backend, só muda quando a query do
    // dashboard resolve/refaz) — NUNCA `filter` inteiro aqui (resetaria o
    // form a cada keystroke enquanto o usuário ainda digita).
  }, [isOpen, farms, defaultPeriod]);

  return (
    <FilterSide isOpen={isOpen} onClose={onClose} languageGB={languageGB}>
      <Form noPadding formFilter onSubmit={handleSubmit(onSubmit)}>
        <Form.BodyFilter>
          <Text fontWeight="bold" color="brandColorText">
            {text.title}
          </Text>

          <Controller
            name="farm_ids"
            control={control}
            render={({ field }) => (
              <CheckboxListField
                label={text.farms}
                items={farmItems}
                selectedValues={field.value}
                onChange={field.onChange}
                searchValue={farmSearch}
                onSearchChange={setFarmSearch}
                searchPlaceholder={text.farmsSearchPlaceholder}
                selectedCountLabel={text.farmsSelectedCount}
                isLoading={farmsLoading}
                isError={farmsError}
                onRetry={() => refetchFarms()}
              />
            )}
          />

          <Controller
            name="harvest_id"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.harvest}
                placeholder={text.harvestPlaceholder}
                service={listHarvestOptions}
                mapOptions={(item: Harvest) => ({
                  label: item.description,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? undefined}
                onChange={(option: any) => field.onChange(option ?? null)}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Text fontSize="sm" fontWeight="medium" mt="4">
            {text.startDate}
          </Text>
          <Controller
            name="start_date"
            control={control}
            render={({ field: { value, onChange } }) => (
              <DateInput value={value} onChange={onChange} />
            )}
          />

          <Text fontSize="sm" fontWeight="medium" mt="4">
            {text.endDate}
          </Text>
          <Controller
            name="end_date"
            control={control}
            render={({ field: { value, onChange } }) => (
              <DateInput value={value} onChange={onChange} />
            )}
          />
        </Form.BodyFilter>

        <Form.FooterFilter>
          <Button
            title={languageGB.defaltStrings.clearAllFilters}
            variant="ghost"
            type="button"
            onClick={handleResetFilters}
          />
          <Button
            title={languageGB.defaltStrings.cancel}
            variant="secondary"
            type="button"
            onClick={handleResetFiltersOnClose}
          />
          <Button title={languageGB.defaltStrings.applyFilters} type="submit" />
        </Form.FooterFilter>
      </Form>
    </FilterSide>
  );
}
