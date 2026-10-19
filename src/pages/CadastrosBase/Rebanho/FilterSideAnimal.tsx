// src/pages/CadastrosBase/Rebanho/FilterSideAnimal.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem do Rebanho — casca `<FilterSide>` +
// `<Form formFilter>`/`<Form.BodyFilter>`/`<Form.FooterFilter>` (NUNCA
// `<VStack as="form">`). Mirror de composição real:
// `FilterSideCategoriasAnimais.tsx` (precedente MAIS PRÓXIMO no domínio
// Pecuários) + `FilterModalProps` canônico.
//
// Contrato real (`Animal-Frontend-Contrato.md` §3.3, 3 campos — fiel ao
// legado `animals/index.blade.php:40-56`): `search` (Input, placeholder
// "Pesquisar Id Animal" — busca por IDENTIFICAÇÃO, não busca genérica) +
// Categoria (`SelectAsyncPaginate` + `listCategoryAnimalOptions`, envia
// `category_id`) + Lote (`SelectAsyncPaginate` + `listBatchOptions`, envia
// `batch`) — nomes de query param CORRIGIDOS em `GAP-FE-203` (2026-08-03):
// `AnimalIndexRequest::rules()` real nunca aceitou `category_uuid`/
// `batch_uuid`, o filtro nunca surtia efeito contra o backend. Os campos
// INTERNOS deste componente (`FilterFormValues`) continuam nomeados
// `category_uuid`/`batch_uuid` — só o WIRE (o que é de fato enviado/lido em
// `AnimalFilterForm`) precisa bater com o nome real.
//
// `GAP-FE-206` (correção pós-E2E, 2026-08-03): o Select de Categoria migrou
// de `listCategoryAnimals` (índice `/category-animals`, GATEADO por
// `categoryanimals_view`) para `listCategoryAnimalOptions`
// (`/category-animals/options`, enxuto, SEM gate de permissão) — o E2E
// revelou 403 "Sem opções" neste drawer para qualquer operador de rebanho
// sem esse privilégio administrativo. Sem impacto na cascata (este filtro
// não depende de Espécie).
//
// Reconciliação do Maestro (2026-08-02): `GET /batches/options` foi
// ENTREGUE pelo backend nesta execução — traz uma entrada SINTÉTICA "Sem
// lote" SEMPRE em primeiro. O front NÃO adiciona nenhuma opção vazia própria
// (duplicaria a entrada sintética do backend) — por isso `placeholder`
// (`batchAll`) é só o texto do campo vazio do `react-select`, nunca uma
// option "Todos" extra na lista.
//
// Re-hidratação ao reabrir — único `useEffect([isOpen])`, guard
// `if (!isOpen) return`.
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

import { animalOriginOptions } from '@/constants/pecuaria/animal/options/animal-origin-options';
import { animalStatusOptions } from '@/constants/pecuaria/animal/options/animal-status-options';
import { reproductiveStatusOptions } from '@/constants/pecuaria/animal/options/reproductive-status-options';

import { listBatchOptions } from '@/services/v2/Batches/batch-service';
import { listCategoryAnimalOptions } from '@/services/v2/CategoryAnimals/category-animal-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type {
  AnimalFilterForm,
  AnimalOrigin,
  AnimalReproductiveStatus,
  AnimalStatusValue,
} from '@/@types/v2/Animals';
import type { BatchOption } from '@/@types/v2/Batches';
import type { CategoryAnimalOptionItem } from '@/@types/v2/CategoryAnimals';

// Forma INTERNA do form — os Selects trabalham com `Option`, o submit
// converte para `AnimalFilterForm` (strings cruas), mesmo padrão de
// `FilterSideCategoriasAnimais.tsx`.
interface FilterFormValues {
  search: string;
  category_uuid: Option<string> | null;
  batch_uuid: Option<string> | null;
  /** Tarefa 26 (FM-04) — default pré-selecionado `'A'` (Ativo), mirror `CLM-05`. */
  status: Option<AnimalStatusValue> | null;
  /** Tarefa 26 (FM-05) — sem default (sem filtro). */
  origin: Option<AnimalOrigin> | null;
  /** Tarefa 26 (FM-06) — sem default (sem filtro). */
  reproductive_status: Option<AnimalReproductiveStatus> | null;
}

// `status` não entra aqui como literal — o default `'A'` (Ativo, `CLM-05`)
// precisa do `Option` com label traduzido (`languageGB`), só disponível
// dentro do componente. Ver `buildPristineFormValues` abaixo.
const pristineFormValuesBase: Omit<FilterFormValues, 'status'> = {
  search: '',
  category_uuid: null,
  batch_uuid: null,
  origin: null,
  reproductive_status: null,
};

// Tarefa 26, §2 — `status` pré-selecionado em "Ativo" (mirror `CLM-05`: o
// backend aplica `status='A'` quando o filtro está ausente; o drawer agora
// TORNA ISSO EXPLÍCITO e reversível). `handleResetFilters` também volta a
// este estado, nunca a "sem filtro" — comportamento do legado.
function buildPristineFormValues(
  languageGB: FilterModalProps<AnimalFilterForm>['languageGB']
): FilterFormValues {
  return {
    ...pristineFormValuesBase,
    status: animalStatusOptions.getOption('A', languageGB),
  };
}

export function FilterSideAnimal({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<AnimalFilterForm>) {
  const text = languageGB.animals.animal.filter;

  const { control, register, handleSubmit, reset } = useForm<FilterFormValues>({
    defaultValues: buildPristineFormValues(languageGB),
  });

  // Re-hidratação ao (re)abrir o drawer — reconstrói a partir de `filter`
  // (`paginatedQuery.filter`), único useEffect, deps `[isOpen]` (nunca
  // `[filter]` — clobaria o que o usuário está digitando com o drawer
  // aberto). `GAP-FE-203` — `filter.category_id`/`filter.batch` (nomes reais
  // de `AnimalIndexRequest::rules()`, não `category_uuid`/`batch_uuid`); os
  // nomes INTERNOS do form (`FilterFormValues`) continuam `category_uuid`/
  // `batch_uuid` — só o WIRE (chave enviada/recebida) precisa bater.
  //
  // Tarefa 26 — `status`/`origin`/`reproductive_status` reconstruídos a
  // partir do options factory (não há chave `*_label` para eles: as 3
  // listas são estáticas, o label é derivado, nunca persistido). `status`
  // ausente no filtro em vigor cai no fallback do pristine (`'A'`).
  useEffect(() => {
    if (!isOpen) return;
    const pristine = buildPristineFormValues(languageGB);
    reset({
      search: filter?.search ?? '',
      category_uuid: filter?.category_id
        ? { value: filter.category_id, label: filter.category_label ?? filter.category_id }
        : null,
      batch_uuid: filter?.batch
        ? { value: filter.batch, label: filter.batch_label ?? filter.batch }
        : null,
      status: filter?.status
        ? animalStatusOptions.getOption(filter.status as AnimalStatusValue, languageGB)
        : pristine.status,
      origin: filter?.origin
        ? animalOriginOptions.getOption(filter.origin as AnimalOrigin, languageGB)
        : null,
      reproductive_status: filter?.reproductive_status
        ? reproductiveStatusOptions.getOption(
            filter.reproductive_status as AnimalReproductiveStatus,
            languageGB
          )
        : null,
    });
  }, [isOpen]);

  function onSubmit(data: FilterFormValues) {
    const applied: AnimalFilterForm = {
      search: data.search?.trim() || undefined,
      // `GAP-FE-203` — `category_id`/`batch` (nomes reais do filtro,
      // `AnimalIndexRequest::rules()`), não `category_uuid`/`batch_uuid`.
      category_id: data.category_uuid?.value || undefined,
      // DISPLAY-ONLY — só para re-hidratar o label no drawer; NUNCA enviado à API.
      category_label: data.category_uuid?.label,
      batch: data.batch_uuid?.value || undefined,
      batch_label: data.batch_uuid?.label,
      // Tarefa 26 (§2/§5) — as 3 listas são estáticas; sem chave `*_label`
      // (o label é derivado do options factory, nunca persistido).
      status: data.status?.value || undefined,
      origin: data.origin?.value || undefined,
      reproductive_status: data.reproductive_status?.value || undefined,
    };
    handleFilterChange(applied);
    onClose();
  }

  // Limpar filtros volta a `status='A'` (Ativo), não a "sem filtro" —
  // comportamento do legado (Tarefa 26, §2).
  function handleResetFilters() {
    handleReset();
    reset(buildPristineFormValues(languageGB));
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
            name="category_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.category}
                placeholder={text.categoryAll}
                service={listCategoryAnimalOptions}
                mapOptions={(item: CategoryAnimalOptionItem) => ({
                  label: item.label,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                  // `tenant_cost_center_scoped` (063-est03-9-reprovacoes,
                  // TASK-FE-063-09) — restringe o catálogo aos centros de
                  // custo do tenant ativo (`X-Farm-Id`); aditivo, `search`
                  // continua funcionando dentro do escopo (correção do
                  // roteiro em `listOptionsForTenantCostCenter`).
                  tenant_cost_center_scoped: true,
                })}
                // `?? null` (não `?? undefined`) — mantém o componente
                // CONTROLADO ao limpar (mesma correção de
                // `FilterSideRacas.tsx`/`FilterSideCategoriasAnimais.tsx`).
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
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
                label={text.batch}
                placeholder={text.batchAll}
                service={listBatchOptions}
                mapOptions={(item: BatchOption) => ({
                  label: item.label,
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

          {/* Tarefa 26 (FM-04/05/06) — 3 `Select` estáticos (não
              `SelectAsyncPaginate`: as listas são fixas). `disablePortal`
              evita z-index dentro do `FilterSide` (contrato de tela §5). */}
          <Controller
            name="status"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.status}
                name={name}
                placeholder={text.statusAll}
                options={animalStatusOptions.options(languageGB)}
                value={value}
                onChange={(opt: Option<AnimalStatusValue> | null) => onChange(opt)}
                disablePortal
              />
            )}
          />

          <Controller
            name="origin"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.origin}
                name={name}
                placeholder={text.originAll}
                options={animalOriginOptions.options(languageGB)}
                value={value}
                onChange={(opt: Option<AnimalOrigin> | null) => onChange(opt)}
                disablePortal
              />
            )}
          />

          <Controller
            name="reproductive_status"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.reproductiveStatus}
                name={name}
                placeholder={text.reproductiveStatusAll}
                options={reproductiveStatusOptions.options(languageGB)}
                value={value}
                onChange={(opt: Option<AnimalReproductiveStatus> | null) => onChange(opt)}
                disablePortal
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
