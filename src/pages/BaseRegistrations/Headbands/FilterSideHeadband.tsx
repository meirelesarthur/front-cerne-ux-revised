// src/pages/BaseRegistrations/Headbands/FilterSideHeadband.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Testeiras (TASK-HB-FE-03) — mesma casca de
// `BaseRegistrations/DiagnosisPregnancy/FilterSideDiagnosisPregnancy.tsx`
// (`<Form formFilter>`, `Form.BodyFilter`/`Form.FooterFilter`, RE-HIDRATA via
// `useEffect([isOpen])` — NUNCA `<VStack as="form">` cru).
//
// Contrato de tela (ficha §"Filtro"): `type` (Select estático, fábrica
// `headbandTypeOptions`) + `partner_uuid` (`SelectAsyncPaginate` SINGLE,
// nunca `isMulti`, sobre `listPartners` — filtro ADMINISTRATIVO opcional que
// filtra pela PIVOT `partners`, Headband-contrato.md §11; distinto do
// vínculo único de escrita do formulário, mesmo nome de campo).
//
// Sem `search` — o contrato desta listagem (§11) não expõe busca textual por
// `description`; adicionar um campo sem endpoint por trás violaria "SEM
// MOCK".
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { headbandTypeOptions } from '@/constants/BaseRegistrations/options/headband-type-options';

import { listPartners } from '@/services/v2/Afiliados/partner-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { PartnerListItem } from '@/@types/v2/Afiliados';
import type { HeadbandsFilterForm, HeadbandTypeSlug } from '@/@types/v2/BaseRegistrations/headband';

// Forma INTERNA do form (só deste componente) — os Selects trabalham com
// `Option`, o submit converte para `HeadbandsFilterForm` (strings cruas).
interface FilterFormValues {
  type: Option<HeadbandTypeSlug> | null;
  partner_uuid: Option<string> | null;
}

const pristineFormValues: FilterFormValues = {
  type: null,
  partner_uuid: null,
};

export function FilterSideHeadband({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<HeadbandsFilterForm>) {
  const typeOptions = headbandTypeOptions.options(languageGB);

  // `HeadbandsFilterForm` não guarda um `partner_label` companion (diferente
  // de `OpeningBalanceFilterForm.product_label`) — ao re-hidratar só com o
  // uuid persistido, o label provisório é o próprio uuid até o
  // `SelectAsyncPaginate` recarregar as opções (mesmo efeito colateral,
  // documentado, de qualquer Select assíncrono sem companion de label).
  function toInternalValues(rawFilter?: HeadbandsFilterForm | null): FilterFormValues {
    return {
      type: rawFilter?.type
        ? (typeOptions.find((option) => option.value === rawFilter.type) ?? null)
        : null,
      partner_uuid: rawFilter?.partner_uuid
        ? { value: rawFilter.partner_uuid, label: rawFilter.partner_uuid }
        : null,
    };
  }

  const { control, handleSubmit, reset } = useForm<FilterFormValues>({
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter),
    },
  });

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      type: (data.type?.value as HeadbandsFilterForm['type']) || undefined,
      partner_uuid: data.partner_uuid?.value || undefined,
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

  // Ao (re)abrir o drawer, ressincroniza o form com o filtro aplicado. Deps
  // SOMENTE [isOpen] — deliberado: reagir a `filter` clobaria o que o
  // usuário está digitando dentro do drawer aberto.
  useEffect(() => {
    reset({
      ...pristineFormValues,
      ...toInternalValues(filter),
    });
  }, [isOpen]);

  return (
    <FilterSide isOpen={isOpen} onClose={onClose} languageGB={languageGB}>
      <Form noPadding formFilter onSubmit={handleSubmit(onSubmit)}>
        <Form.BodyFilter>
          <Text fontWeight="bold" color="brandColorText">
            {languageGB.baseRegistrations.headband.filter.title}
          </Text>

          <Controller
            name="type"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={languageGB.baseRegistrations.headband.filter.type}
                placeholder={languageGB.baseRegistrations.headband.filter.typeAll}
                name={name}
                value={value}
                onChange={onChange}
                options={typeOptions}
              />
            )}
          />

          <Controller
            name="partner_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={languageGB.baseRegistrations.headband.filter.partner}
                placeholder={languageGB.baseRegistrations.headband.filter.partnerPlaceholder}
                service={listPartners}
                mapOptions={(item: PartnerListItem) => ({
                  label: item.person.name,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
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
