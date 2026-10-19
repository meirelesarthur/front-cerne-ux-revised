// src/pages/CadastrosBase/Depreciacao/FilterSideDepreciacao.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de DEPRECIAÇÃO (Depreciation — Cadastros Base /
// Bens-Ativos, execução 027, TASK-FE-844). 1 componente reutilizado pelas 2
// abas (`domain: 'equipment' | 'animal'`) — o campo `equipment_uuid` só
// renderiza quando `domain === 'equipment'`; `year`/`month` sempre presentes.
//
// Mirror ESTRUTURAL 1:1 de `FilterSideFuncoes.tsx` (mesma casca `<FilterSide>`
// + `<Form noPadding formFilter>` → `Form.BodyFilter`/`Form.FooterFilter`,
// mesmo contrato de re-hidratação em `useEffect` com deps `[isOpen]` — nunca
// `[filter]`, guard `if (!isOpen) return`).
//
// `equipment_uuid` segue o padrão EXATO de `cbo_uuid` (SelectAsyncPaginate
// sobre `listEquipmentCatalogOptions`, TASK-FE-840): `value={field.value ??
// null}` (armadilha #10 do checklist — NUNCA `?? undefined`),
// `menuPortalTarget={document.body}` + `menuPosition="fixed"`, companheiro
// display-only `equipment_uuid_label` (nunca vai à API, nunca conta no badge
// "Filtros(N)" — exclusão calculada no `index.tsx`, TASK-FE-845).
//
// `animal_uuid` NÃO existe nesta entrega — `[A CONFIRMAR — depende da frente
// Rebanho]` (contrato de tela §8.2). Nenhum `Controller` é criado para ele.
//
// Nota de adaptação (latitude do Executor, não uma `[DECISÃO DE DESENHO]`):
// o contrato de tela descreve a prop `handleFilterChange` tipada pela UNIÃO
// `DepreciationFilterForm | DepreciationAnimalFilterForm` — mantido aqui tal
// qual (mesma assinatura declarada na Tarefa). Como TypeScript checa
// contravariantemente propriedades de função sob `strict`, os 2 callers em
// `index.tsx` passam um wrapper inline de tipo union que delega ao
// `handleFilterChange` concreto de cada aba (ver comentário lá) — evita
// generics/type-casts adicionais aqui, mantendo esta assinatura 1:1 com a
// Tarefa.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { depreciationMonthOptions } from '@/constants/Depreciations/options/depreciation-month-options';

import { listEquipmentCatalogOptions } from '@/services/v2/Equipments/equipment-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type {
  DepreciationAnimalFilterForm,
  DepreciationFilterForm,
} from '@/@types/v2/Depreciations';
import type { EquipmentOption } from '@/@types/v2/Equipments';

export interface FilterSideDepreciacaoProps extends FilterModalProps<
  DepreciationFilterForm | DepreciationAnimalFilterForm
> {
  domain: 'equipment' | 'animal';
}

// Forma INTERNA do form (só deste componente) — os Selects trabalham com
// `Option`, o submit converte para `DepreciationFilterForm`/
// `DepreciationAnimalFilterForm` conforme `domain`.
interface FilterFormValues {
  equipment_uuid: Option<string> | null;
  year?: string;
  month: Option<number> | null;
}

export function FilterSideDepreciacao({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
  domain,
}: FilterSideDepreciacaoProps) {
  const filterText = languageGB.depreciations.filter;

  const pristineFormValues: FilterFormValues = {
    equipment_uuid: null,
    year: '',
    month: null,
  };

  function toInternalValues(
    rawFilter?: (DepreciationFilterForm | DepreciationAnimalFilterForm) | null
  ): FilterFormValues {
    // `equipment_uuid`/`equipment_uuid_label` só existem em
    // `DepreciationFilterForm` — cast seguro, só lido quando `domain ===
    // 'equipment'` (a única aba que renderiza o campo).
    const equipmentFilter =
      domain === 'equipment' ? (rawFilter as DepreciationFilterForm | null | undefined) : undefined;

    return {
      equipment_uuid: equipmentFilter?.equipment_uuid
        ? {
            value: equipmentFilter.equipment_uuid,
            label: equipmentFilter.equipment_uuid_label ?? equipmentFilter.equipment_uuid,
          }
        : null,
      year: rawFilter?.year ? String(rawFilter.year) : '',
      month:
        rawFilter?.month != null
          ? depreciationMonthOptions.getOption(rawFilter.month, languageGB)
          : null,
    };
  }

  const { control, register, handleSubmit, reset } = useForm<FilterFormValues>({
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter),
    },
  });

  // Ao (re)abrir o drawer, ressincroniza o form com o filtro aplicado.
  // Deps SOMENTE [isOpen] — deliberado: reagir a `filter` clobaria o que o
  // usuário está digitando dentro do drawer aberto.
  useEffect(() => {
    if (!isOpen) return;

    reset({
      ...pristineFormValues,
      ...toInternalValues(filter),
    });
  }, [isOpen]);

  function onSubmit(data: FilterFormValues) {
    const yearNumber = data.year ? Number(data.year) : undefined;
    const monthValue = data.month?.value ?? undefined;

    if (domain === 'equipment') {
      handleFilterChange({
        equipment_uuid: data.equipment_uuid?.value || undefined,
        // Display-only (checklist item 13) — nunca vai à API, só re-hidrata
        // o SelectAsyncPaginate.
        equipment_uuid_label: data.equipment_uuid?.label,
        year: yearNumber,
        month: monthValue,
      } satisfies DepreciationFilterForm);
    } else {
      handleFilterChange({
        year: yearNumber,
        month: monthValue,
      } satisfies DepreciationAnimalFilterForm);
    }

    onClose();
  }

  function handleResetFilters() {
    handleReset();
    reset(pristineFormValues);
  }

  return (
    <FilterSide isOpen={isOpen} onClose={onClose} languageGB={languageGB}>
      <Form noPadding formFilter onSubmit={handleSubmit(onSubmit)}>
        <Form.BodyFilter>
          <Text fontWeight="bold" color="brandColorText">
            {filterText.title}
          </Text>

          {domain === 'equipment' && (
            <Controller
              name="equipment_uuid"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={filterText.equipment}
                  placeholder={filterText.equipmentAll}
                  service={listEquipmentCatalogOptions}
                  mapOptions={(item: EquipmentOption) => ({
                    label: `${item.code} — ${item.description}`,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                  })}
                  // Armadilha #10 do checklist: `?? null` NUNCA `?? undefined`
                  // — `handleResetFilters()` põe `field.value = null`;
                  // caindo em `undefined` o `<AsyncPaginate>` vira
                  // NÃO-CONTROLADO e mantém a última seleção interna.
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  // Portaliza SÓ esta instância no <body>, fora do fluxo do
                  // drawer (Drawer.Body tem overflow auto e recorta o menu
                  // não-portalizado).
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              )}
            />
          )}

          <Input
            label={filterText.year}
            placeholder={filterText.yearPlaceholder}
            type="number"
            {...register('year')}
          />

          <Controller
            name="month"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={filterText.month}
                placeholder={filterText.monthAll}
                name={name}
                value={value}
                onChange={onChange}
                options={depreciationMonthOptions.options(languageGB)}
              />
            )}
          />
        </Form.BodyFilter>
        <Form.FooterFilter>
          <Button
            title={languageGB.defaltStrings.clearAllFilters}
            variant="outline"
            onClick={handleResetFilters}
            type="button"
          />
          <Button title={languageGB.defaltStrings.applyFilters} type="submit" />
        </Form.FooterFilter>
      </Form>
    </FilterSide>
  );
}
