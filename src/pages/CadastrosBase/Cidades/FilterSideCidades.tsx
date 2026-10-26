// src/pages/CadastrosBase/Cidades/FilterSideCidades.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Cidades (mesma casca global <FilterSide> de
// FilterSideMotivosBaixa.tsx/FilterSideTecnicasDiagnostico.tsx).
//
// Contrato real (TASK-FE-023, `CityFilterForm`): `search` (Input, busca por
// `title`) + `state_uuid` (cascata Estado→Cidade, via `SelectAsyncPaginate`
// apontando para `listStates`, TASK-FE-021 — NÃO uma lista estática). SEM
// campo de status: `CityFilterForm` deliberadamente não aceita `status`
// nesta Tarefa (ver "Leitura do dev" da Tarefa).
//
// RE-HIDRATAÇÃO — mesmo padrão CORRETO já usado em FilterSideMotivosBaixa.tsx
// (não a omissão de FilterSideCentroCusto.tsx/FilterSideEspecies.tsx
// original): prop `appliedFilter` + `useEffect` com deps `[isOpen]` APENAS,
// reconstruindo o form a partir do filtro REALMENTE aplicado na grid ao
// reabrir o drawer. Diferença: `state_uuid` no filtro aplicado é só o uuid
// cru (`CityFilterForm.state_uuid: string`), sem rótulo — a grid nunca
// carregou o Estado inteiro, só o uuid. Para re-hidratar o LABEL exibido no
// SelectAsyncPaginate (não só o value interno), busca o Estado via
// `getStateByUuid` (state-service.ts, já exportado por TASK-FE-021
// "reservado para uso futuro" — este é o consumidor real), mesmo racional de
// `fillParentPreview` em CreateOrUpdateCentroCusto.tsx (2ª consulta ao
// servidor só para preencher um rótulo que a grid não carrega sozinha).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { getStateByUuid, listStateOptions } from '@/services/v2/States/state-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { CityFilterForm } from '@/@types/v2/Cities';
import type { StateListItem, StateOption } from '@/@types/v2/States';

// Forma INTERNA do form (só deste componente) — `state_uuid` trabalha com
// `Option` (SelectAsyncPaginate); o submit converte para `CityFilterForm`
// (uuid cru).
interface FilterFormValues {
  search?: string;
  state_uuid: Option<string> | null;
}

export function FilterSideCidades({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<CityFilterForm>) {
  const text = languageGB.cities.city.filter;

  const pristineFormValues: FilterFormValues = {
    search: '',
    state_uuid: null,
  };

  // `state_uuid` no filtro aplicado é só o uuid cru (`CityFilterForm.state_uuid:
  // string`), sem rótulo — a grid nunca carregou o Estado inteiro, só o uuid.
  // Aqui só reidrata `search`; o rótulo do Select é buscado à parte (efeito
  // abaixo) via `getStateByUuid`, mesmo racional de `fillParentPreview` em
  // CreateOrUpdateCentroCusto.tsx (2ª consulta ao servidor só para preencher
  // um rótulo que a grid não carrega sozinha).
  function toInternalValues(rawFilter?: CityFilterForm | null): FilterFormValues {
    return {
      search: rawFilter?.search ?? '',
      state_uuid: null,
    };
  }

  const { control, register, handleSubmit, reset, setValue } = useForm<FilterFormValues>({
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter),
    },
  });

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      search: data.search?.trim() || undefined,
      state_uuid: data.state_uuid?.value || undefined,
    });
    onClose();
  }

  function handleResetFilters() {
    handleReset();
    reset(pristineFormValues);
  }

  function handleResetFiltersOnClose() {
    reset({
      ...pristineFormValues,
      ...toInternalValues(filter),
    });
    onClose();
  }

  // Ao (re)abrir o drawer, ressincroniza o form com o filtro aplicado —
  // deps `[isOpen]` APENAS, mesmo racional do padrão original: não reage a
  // mudanças de `filter` enquanto o drawer permanece aberto (evitaria
  // resetar o form no meio de uma edição do usuário). Além do `search`,
  // busca o rótulo do Estado (quando houver `state_uuid` aplicado) via
  // `getStateByUuid`.
  useEffect(() => {
    if (isOpen) {
      reset({
        ...pristineFormValues,
        ...toInternalValues(filter),
      });

      if (filter?.state_uuid) {
        getStateByUuid(filter.state_uuid)
          .then((response) => {
            const state = response.data as StateListItem;
            setValue('state_uuid', {
              label: `${state.title} (${state.letter})`,
              value: state.uuid,
            });
          })
          .catch(() => {
            // Falha ao buscar o rótulo (ex.: uuid não existe mais) — o
            // campo fica vazio no drawer; o filtro CONTINUA aplicado na
            // grid (nenhum handleFilterChange é disparado aqui), só o
            // rótulo do Select não é exibido nesta reabertura.
          });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  return (
    <FilterSide isOpen={isOpen} onClose={onClose} languageGB={languageGB}>
      <Form noPadding formFilter onSubmit={handleSubmit(onSubmit)}>
        <Form.BodyFilter>
          <Text fontWeight="bold" color="brandColorText">
            {text.title}
          </Text>

          <Controller
            name="state_uuid"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <SelectAsyncPaginate
                name={name}
                label={text.state}
                placeholder={text.statePlaceholder}
                // TASK-FE-980 (GAP-FE-182 corrigido: endpoint já existia,
                // bloqueio era 100% frontend) — repontado de `listStates`
                // (CRUD, gateado por `states_view`) para `listStateOptions`
                // (`/states/options`, SEM gate, `TASK-FE-980`) — mirror
                // mecânico de `listCityOptions`. `listStates` continua
                // exportado/usado por `Estados/index.tsx` (fora de escopo
                // aqui).
                service={listStateOptions}
                mapOptions={(item: StateOption) => ({
                  label: `${item.title} (${item.letter})`,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={value ?? undefined}
                onChange={(option: any) => onChange(option ?? null)}
              />
            )}
          />

          <Input
            label={text.search}
            placeholder={text.searchPlaceholder}
            {...register('search')}
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
            variant="secondary"
            onClick={handleResetFiltersOnClose}
            type="button"
          />
          <Button title={languageGB.defaltStrings.applyFilters} type="submit" />
        </Form.FooterFilter>
      </Form>
    </FilterSide>
  );
}
