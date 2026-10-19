// src/pages/Operacional/Rastreabilidade/Traceability/FilterSideTraceability.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Produtos (Rastreabilidade) — Contrato B
// canônico (`FilterModalProps<T>`, `get_pwa_grid_query_pattern`), mirror
// `Operacional/Carregamento/FilterSideCharge.tsx`. TASK-TR-FE-05.
//
// 3 filtros reais (`filter_manifest` FM-01..03, `## 4.1` do contrato de
// tela, ORDEM MANDATÓRIA): Data de colheita (`DateInput`), Produto
// (`SelectAsyncPaginate`, RISCO documentado abaixo) e Código de rastreio
// (texto, `contém`).
//
// ⚠️ RISCO + SOLUÇÃO (ficha da Tarefa, "Risco + solução"): o filtro
// `product_uuid` só deve oferecer produtos do grupo "Produção" — o backend
// (`GET /products/options?group_uuid[]=<uuid>`) exige o UUID do grupo, que
// NÃO é conhecido estaticamente (nunca hardcode — Lei "SEM MOCK"). Este
// componente resolve o `group_uuid` em 2 passos, documentados no hook
// `useProductionGroupUuid` abaixo:
//   1. `listProductGroupOptions({ search: 'Produção' })` — lookup ENXUTO já
//      existente (`product-group-service.ts`, sem paginação real, `meta:
//      null`), reaproveitado (Lei "não duplicar rota cross-module").
//   2. Resolve o item cujo `label` bate com "Produção" (case/trim-insensitive
//      — o servidor já filtrou por busca textual, então o 1º item retornado
//      é o alvo esperado; o `find` exato é só uma defesa extra caso a busca
//      textual devolva mais de 1 resultado aproximado).
// Enquanto o `group_uuid` não resolve, o `service` do `SelectAsyncPaginate`
// devolve uma página VAZIA real (não é mock — é o estado honesto de "ainda
// resolvendo o grupo", `get_spa_ux_fidelity_pattern`), nunca chama
// `listProductOptions` sem o filtro (evita vazar produtos fora do grupo
// "Produção").
// -----------------------------------------------------------------------------

import { useEffect, useMemo } from 'react';

import { Input, Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Field } from '@/components/Form/Field';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { listProductGroupOptions } from '@/services/v2/ProductGroups/product-group-service';
import { listProductOptions } from '@/services/v2/Products/product-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { ResponsePagination } from '@/@types/response-api';
import type { ProductOption } from '@/@types/v2/Products';
import type { TraceabilityFilterForm } from '@/@types/v2/Rastreabilidade/traceability';

// Nome EXATO do grupo esperado no cadastro de Grupos de Produto — usado só
// para resolver o `group_uuid` real via lookup (nunca hardcode do próprio
// uuid, `## 6.7` do contrato de destino).
const PRODUCTION_GROUP_NAME = 'Produção';

// -----------------------------------------------------------------------------
// Passo 1+2 do RISCO documentado acima — hook AUXILIAR local (não vira
// arquivo próprio: a ficha da Tarefa pede a resolução documentada "no
// próprio hook do filtro", não uma fundação nova).
// -----------------------------------------------------------------------------
function useProductionGroupUuid() {
  const query = useQuery({
    queryKey: ['rastreabilidade-traceability-filter-production-group'],
    queryFn: () => listProductGroupOptions({ search: PRODUCTION_GROUP_NAME }),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const productionGroupUuid = useMemo(() => {
    const items = query.data?.data.items ?? [];
    const exactMatch = items.find(
      (group) => group.label.trim().toLowerCase() === PRODUCTION_GROUP_NAME.toLowerCase()
    );
    return (exactMatch ?? items[0])?.uuid;
  }, [query.data]);

  return { productionGroupUuid, isResolving: query.isLoading };
}

interface FilterFormValues {
  harvested_in: string | null;
  product_uuid: Option<string> | null;
  tracking_code: string | null;
}

const pristineFormValues: FilterFormValues = {
  harvested_in: null,
  product_uuid: null,
  tracking_code: null,
};

function toInternalValues(rawFilter?: TraceabilityFilterForm | null): FilterFormValues {
  return {
    harvested_in: rawFilter?.harvested_in ?? null,
    product_uuid: rawFilter?.product_uuid
      ? {
          value: rawFilter.product_uuid,
          label: rawFilter.product_label ?? rawFilter.product_uuid,
        }
      : null,
    tracking_code: rawFilter?.tracking_code ?? null,
  };
}

export function FilterSideTraceability({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<TraceabilityFilterForm>) {
  const filterText = languageGB.rastreabilidade.traceability.list.filter;
  const { productionGroupUuid, isResolving } = useProductionGroupUuid();

  // `service` do `SelectAsyncPaginate` — só consulta `products/options` DEPOIS
  // do `group_uuid` de "Produção" resolvido (Risco documentado no topo do
  // arquivo). Sem `group_uuid` ainda resolvido, devolve página vazia REAL
  // (não mock — estado honesto de "resolvendo").
  function listProductionProducts(params: {
    page?: number;
    per_page?: number;
    search?: string;
  }): Promise<ResponsePagination<ProductOption[]>> {
    if (!productionGroupUuid) {
      return Promise.resolve({
        success: true,
        message: '',
        data: {
          items: [],
          pagination: { total: 0, count: 0, per_page: 0, current_page: 1, total_pages: 1 },
        },
      });
    }

    return listProductOptions({ ...params, group_uuid: [productionGroupUuid] });
  }

  const { control, handleSubmit, reset } = useForm<FilterFormValues>({
    defaultValues: { ...pristineFormValues, ...toInternalValues(filter) },
  });

  // Re-hidratação obrigatória — deps SOMENTE [isOpen] (Contrato B canônico).
  useEffect(() => {
    if (!isOpen) return;
    reset({ ...pristineFormValues, ...toInternalValues(filter) });
  }, [isOpen]);

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      harvested_in: data.harvested_in || undefined,
      product_uuid: data.product_uuid?.value || undefined,
      product_label: data.product_uuid?.label,
      tracking_code: data.tracking_code?.trim() || undefined,
    });
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

          <Controller
            name="harvested_in"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field label={filterText.harvestedIn}>
                <DateInput value={value ?? null} onChange={onChange} />
              </Field>
            )}
          />

          <Controller
            name="product_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={filterText.product}
                service={listProductionProducts}
                mapOptions={(item: ProductOption) => ({
                  label: `${item.code} — ${item.description}`,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                isDisabled={isResolving}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="tracking_code"
            control={control}
            render={({ field }) => (
              <Field label={filterText.trackingCode}>
                <Input
                  value={field.value ?? ''}
                  onChange={(event) => field.onChange(event.target.value)}
                />
              </Field>
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
