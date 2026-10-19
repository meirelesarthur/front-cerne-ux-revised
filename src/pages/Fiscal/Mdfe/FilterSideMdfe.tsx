// src/pages/Fiscal/Mdfe/FilterSideMdfe.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de MDFe — Contrato B canônico (6 props exatas:
// isOpen/onClose/handleReset/handleFilterChange/filter/languageGB), mirror
// `FilterSideNfe.tsx`/`FilterSideDfe.tsx` linha a linha. TASK-MDFE-FE-02
// (`CONTRATO-FRONT-MDFE.md §4.2`).
//
// `estado`/`emissor_id`/`veiculo_id` — `Select` ESTÁTICO (carregado 1x), NÃO
// `SelectAsyncPaginate` — mirror `CONTRATO-FRONT-MDFE.md §3` ("o legado nunca
// teve cascata de opções AJAX nestes lookups"). Emissor/Veículo via
// `listIssuers`/`listEquipmentCatalogOptions` já existentes.
//
// ⚠️ GAP-MDFE-FE-05 (P0) — `emissorId`/`veiculoId` guardam o `uuid` do item
// selecionado (única informação exposta pelos 2 endpoints), mas o backend
// filtra por `id` bigint (`MdfeFilterData::emissorId`/`veiculoId`) — o filtro
// não retorna resultado até o Gap ser resolvido. UI 100% funcional, dado de
// FK aguardando o backend.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Select } from '@/components/Form/Select';

import { mdfeEstadoOptions } from '@/constants/Fiscal/mdfe-estado-options';

import { listEquipmentCatalogOptions } from '@/services/v2/Equipments/equipment-service';
import { listIssuers } from '@/services/v2/Issuers/issuer-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { MdfeEstado, MdfeFilterForm } from '@/@types/v2/Fiscal/Mdfe';

interface FilterFormValues {
  estado: Option<MdfeEstado> | null;
  dataInicioViagemDe: string | null;
  dataInicioViagemAte: string | null;
  emissorId: Option<string> | null;
  veiculoId: Option<string> | null;
}

export function FilterSideMdfe({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<MdfeFilterForm>) {
  const filterText = languageGB.mdfes.mdfe.filter;
  const estadoOptions = mdfeEstadoOptions.options(languageGB);

  // Lookups ESTÁTICOS, carregados 1x (CONTRATO-FRONT-MDFE.md §3) — nunca
  // AsyncSearchSelect/SelectAsyncPaginate para estes 2.
  const issuersQuery = useQuery({
    queryKey: ['mdfe-filter-issuer-options'],
    queryFn: () => listIssuers({ page: 1, per_page: 100 }),
    staleTime: 5 * 60 * 1000,
  });
  const issuerOptions: Option<string>[] = (issuersQuery.data?.data.items ?? []).map((issuer) => ({
    label: issuer.razao_social,
    value: issuer.uuid,
  }));

  const equipmentsQuery = useQuery({
    queryKey: ['mdfe-filter-equipment-options'],
    queryFn: () => listEquipmentCatalogOptions({ page: 1, per_page: 100 }),
    staleTime: 5 * 60 * 1000,
  });
  const equipmentOptions: Option<string>[] = (equipmentsQuery.data?.data.items ?? []).map(
    (equipment) => ({
      label: `${equipment.code} — ${equipment.description}`,
      value: equipment.uuid,
    })
  );

  const pristineFormValues: FilterFormValues = {
    estado: null,
    dataInicioViagemDe: null,
    dataInicioViagemAte: null,
    emissorId: null,
    veiculoId: null,
  };

  function toInternalValues(rawFilter?: MdfeFilterForm | null): FilterFormValues {
    return {
      estado: rawFilter?.estado
        ? (estadoOptions.find((option) => option.value === rawFilter.estado) ?? null)
        : null,
      dataInicioViagemDe: rawFilter?.dataInicioViagemDe ?? null,
      dataInicioViagemAte: rawFilter?.dataInicioViagemAte ?? null,
      emissorId: rawFilter?.emissorId
        ? (issuerOptions.find((option) => option.value === rawFilter.emissorId) ?? null)
        : null,
      veiculoId: rawFilter?.veiculoId
        ? (equipmentOptions.find((option) => option.value === rawFilter.veiculoId) ?? null)
        : null,
    };
  }

  const { control, handleSubmit, reset } = useForm<FilterFormValues>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter),
    },
  });

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      estado: data.estado?.value || undefined,
      dataInicioViagemDe: data.dataInicioViagemDe || undefined,
      dataInicioViagemAte: data.dataInicioViagemAte || undefined,
      emissorId: data.emissorId?.value || undefined,
      veiculoId: data.veiculoId?.value || undefined,
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

  useEffect(() => {
    reset({
      ...pristineFormValues,
      ...toInternalValues(filter),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  return (
    <FilterSide isOpen={isOpen} onClose={onClose} languageGB={languageGB}>
      <Form noPadding formFilter onSubmit={handleSubmit(onSubmit)}>
        <Form.BodyFilter>
          <Text fontWeight="bold" color="brandColorText">
            {filterText.title}
          </Text>

          <Controller
            name="estado"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={filterText.estado}
                placeholder={filterText.estadoAll}
                name={name}
                value={value}
                onChange={(option) => onChange(option ?? null)}
                options={estadoOptions}
              />
            )}
          />

          <Text fontSize="sm" fontWeight="medium">
            {filterText.dataInicioViagemDe}
          </Text>
          <Controller
            name="dataInicioViagemDe"
            control={control}
            render={({ field: { value, onChange } }) => (
              <DateInput value={value ?? null} onChange={onChange} />
            )}
          />

          <Text fontSize="sm" fontWeight="medium">
            {filterText.dataInicioViagemAte}
          </Text>
          <Controller
            name="dataInicioViagemAte"
            control={control}
            render={({ field: { value, onChange } }) => (
              <DateInput value={value ?? null} onChange={onChange} />
            )}
          />

          <Controller
            name="emissorId"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={filterText.emissor}
                name={name}
                value={value}
                onChange={(option) => onChange(option ?? null)}
                options={issuerOptions}
                loading={issuersQuery.isLoading}
              />
            )}
          />

          <Controller
            name="veiculoId"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={filterText.veiculo}
                name={name}
                value={value}
                onChange={(option) => onChange(option ?? null)}
                options={equipmentOptions}
                loading={equipmentsQuery.isLoading}
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
