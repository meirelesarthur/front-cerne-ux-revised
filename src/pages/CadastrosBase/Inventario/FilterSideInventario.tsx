// src/pages/CadastrosBase/Inventario/FilterSideInventario.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Inventário (Equipment) — TASK-FE-1004,
// execução 026. Casca `<FilterSide>` + `<Form formFilter>`/
// `<Form.BodyFilter>`/`<Form.FooterFilter>` (DECISÃO EXPLÍCITA do dev — NUNCA
// `<VStack as="form">` cru, mesmo desvio deliberado já registrado no
// contrato de tela §2/§5 sobre `FilterSideCentroCusto.tsx`, que NÃO é
// seguido aqui). Mirror de composição: `Produtos/Catalogo/FilterSideCatalogo.tsx`
// (precedente mais recente do mecanismo `<Form formFilter>`).
//
// 5 filtros do legado (Equipment-Frontend-Contrato.md §5): `search` (Input,
// LIKE description) + `family_equipment_uuid` (SelectAsyncPaginate) +
// `proprietary_uuid` (Select) + `start_date`/`end_date` (DateInput, sobre
// `created_at`).
//
// ⚠️ ACHADO desta Tarefa (reconciliação contra o backend REAL, não contra o
// task-packet): o task-packet (Diretriz 5) afirma que "os `/options` do
// projeto são paginados e aceitam `search`+`per_page`" para
// `proprietaries/options` — FALSO para este endpoint especificamente.
// `ListProprietaryOptionsAction::handle()` (api_root,
// `app/Actions/Proprietary/ListProprietaryOptionsAction.php:19`) devolve uma
// `Collection` SEM paginação (`repository->listOptionsForCurrentTenant($search)`,
// sem `per_page`/`page`) — `ProprietaryController::options()` nunca chama
// `paginate()`. `SelectAsyncPaginate` (`service: (params) =>
// Promise<ResponsePagination<T>>`) é estruturalmente incompatível com esse
// shape (o adaptador `response.data?.items ?? response.data` do componente
// não resolve um array cru sem chave `data`). O contrato de tela §10 já
// previa esta alternativa ("SelectAsyncPaginate OU Select bulk") — usado
// aqui `Select` BULK (fetch único via `listProprietaryOptions`, já existente
// em `proprietary-service.ts`, sem tocar o arquivo compartilhado).
//
// CORREÇÃO UT-000750 (esteira 114) — `family_equipment_uuid` consumia
// `GET /family-equipments/options` SEM `page`/`per_page`/`search`/`is_enabled`
// via `Select` bulk estático (fetch único, 1ª página do backend = 15
// registros, sem busca) — listava só 15 Famílias. Trocado por
// `SelectAsyncPaginate` (`listFamilyEquipmentOptions`, serviço já existente
// em `familyEquipment-service.ts`, sem alterá-lo), `is_enabled: 'true'`
// (ERRO-04a — mirror `src/pages/Relatorios/Bens/Inventario/index.tsx`, sem o
// filtro o endpoint também devolve Famílias desabilitadas). Diferente do
// Proprietário (endpoint cru sem paginação, permanece `Select` bulk acima),
// `/family-equipments/options` HOJE é paginado de verdade (`listFamilyEquipmentOptions`
// devolve `ResponsePagination`) — o achado original desta Tarefa sobre a rota
// "NOVA, não existe" está DESATUALIZADO (já publicada e em uso pelo
// formulário de criação/edição e pelo relatório de Inventário).
//
// RE-HIDRATAÇÃO (Risco #3 da Tarefa/ERRO conhecido de
// `FilterSideClasses`/`FilterSideCategoriasProduto`): único
// `useEffect([isOpen])`, SEM `filter`/`appliedFilter` nas deps (clobber) —
// preservada; `family_equipment_label` continua vindo de `filter` (salvo no
// submit abaixo), não da página atual do `SelectAsyncPaginate`.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Field } from '@/components/Form/Field';
import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { listFamilyEquipmentOptions } from '@/services/v2/BaseRegistrations/familyEquipment-service';
import { listProprietaryOptions } from '@/services/v2/CadastrosBase/Proprietary/proprietary-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { FamilyEquipmentOption } from '@/@types/v2/BaseRegistrations/familyEquipment';
import type { EquipmentFilterForm } from '@/@types/v2/Equipments';

// Forma INTERNA do form — os 2 Selects trabalham com `Option` (o de Família
// paginado via `SelectAsyncPaginate`, o de Proprietário bulk, carregado 1x ao
// abrir o drawer), o submit converte para `EquipmentFilterForm` (uuid cru +
// `*_label` companion, mesmo padrão de `ProductFilterForm`).
interface FilterFormValues {
  search: string;
  family_equipment_uuid: Option<string> | null;
  proprietary_uuid: Option<string> | null;
  start_date: string | null;
  end_date: string | null;
}

const pristineFormValues: FilterFormValues = {
  search: '',
  family_equipment_uuid: null,
  proprietary_uuid: null,
  start_date: null,
  end_date: null,
};

export function FilterSideInventario({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<EquipmentFilterForm>) {
  const text = languageGB.equipments.equipment.filter;

  const { control, register, handleSubmit, reset } = useForm<FilterFormValues>({
    defaultValues: pristineFormValues,
  });

  // Bulk fetch (1x, só quando o drawer abre) — ver cabeçalho do arquivo sobre
  // por que o Proprietário continua `Select` bulk (endpoint cru, sem
  // paginação). Família de Bens foi migrada para `SelectAsyncPaginate`
  // (CORREÇÃO UT-000750, ver cabeçalho do arquivo).
  const proprietaryOptionsQuery = useQuery({
    queryKey: ['equipments-filter-proprietary-options'],
    queryFn: () => listProprietaryOptions(),
    enabled: isOpen,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const proprietaryOptions: Option<string>[] = (proprietaryOptionsQuery.data ?? []).map((item) => ({
    label: item.label,
    value: item.uuid,
  }));

  // Re-hidratação ao (re)abrir o drawer — reconstrói os 2 pares
  // `{label,value}` a partir de `filter` (`paginatedQuery.filter`), único
  // useEffect, deps SOMENTE `[isOpen]` (reagir a `filter` clobaria o que o
  // usuário está digitando com o drawer aberto — mesma disciplina de
  // `FilterSideClasses.tsx`/`FilterSideCategoriasProduto.tsx`).
  useEffect(() => {
    if (!isOpen) return;
    reset({
      search: filter?.search ?? '',
      family_equipment_uuid: filter?.family_equipment_uuid
        ? {
            value: filter.family_equipment_uuid,
            label: filter.family_equipment_label ?? filter.family_equipment_uuid,
          }
        : null,
      proprietary_uuid: filter?.proprietary_uuid
        ? {
            value: filter.proprietary_uuid,
            label: filter.proprietary_label ?? filter.proprietary_uuid,
          }
        : null,
      start_date: filter?.start_date ?? null,
      end_date: filter?.end_date ?? null,
    });
    // Deps SOMENTE [isOpen] — deliberado, ver comentário acima. (Sem
    // `eslint-disable`: este projeto não carrega a regra
    // `react-hooks/exhaustive-deps` no ESLint config atual — confirmado
    // contra outros precedentes do fork, ex. `FilterSideAfiliados.tsx`.)
  }, [isOpen]);

  function onSubmit(data: FilterFormValues) {
    const applied: EquipmentFilterForm = {
      search: data.search?.trim() || undefined,
      family_equipment_uuid: data.family_equipment_uuid?.value || undefined,
      family_equipment_label: data.family_equipment_uuid?.label,
      proprietary_uuid: data.proprietary_uuid?.value || undefined,
      proprietary_label: data.proprietary_uuid?.label,
      start_date: data.start_date || undefined,
      end_date: data.end_date || undefined,
    };
    handleFilterChange(applied);
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
            {text.title}
          </Text>

          <Input label={text.search} placeholder={text.searchPlaceholder} {...register('search')} />

          <Controller
            name="family_equipment_uuid"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <SelectAsyncPaginate
                name={name}
                label={text.family}
                placeholder={text.familyAll}
                // CORREÇÃO UT-000750 — paginado + busca por digitação,
                // `is_enabled: 'true'` (ERRO-04a, ver cabeçalho do arquivo).
                service={(params) => listFamilyEquipmentOptions({ ...params, is_enabled: 'true' })}
                mapOptions={(item: FamilyEquipmentOption) => ({
                  label: item.description,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                // `?? null` (não `?? undefined`) — mantém o componente
                // CONTROLADO ao limpar (mesma correção de
                // `FilterSideClasses.tsx`/`FilterSideCatalogo.tsx`).
                value={value ?? null}
                onChange={(option: any) => onChange(option ?? null)}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="proprietary_uuid"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.proprietary}
                placeholder={text.proprietaryAll}
                name={name}
                value={value}
                onChange={onChange}
                options={proprietaryOptions}
                loading={proprietaryOptionsQuery.isLoading}
              />
            )}
          />

          <Controller
            name="start_date"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field label={text.startDate}>
                <DateInput value={value ?? null} onChange={onChange} />
              </Field>
            )}
          />

          <Controller
            name="end_date"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field label={text.endDate}>
                <DateInput value={value ?? null} onChange={onChange} />
              </Field>
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
            onClick={onClose}
            type="button"
          />
          <Button title={languageGB.defaltStrings.applyFilters} type="submit" />
        </Form.FooterFilter>
      </Form>
    </FilterSide>
  );
}
