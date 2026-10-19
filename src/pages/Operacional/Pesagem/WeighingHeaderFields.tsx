// src/pages/Operacional/Pesagem/WeighingHeaderFields.tsx
// -----------------------------------------------------------------------------
// Cabeçalho do formulário de Pesagem — `pes-form-main` (F-071, TASK-PES-FE-04,
// contrato-tela-lane-c-pesagem-frontend.md §6.4). Mirror ESTRUTURAL de
// `Sanitario/SanitarioHeaderFields.tsx` (mesma casca de `Skeleton`+
// `SimpleGrid`+`Controller`), adaptado aos campos próprios de Pesagem:
// `code` (`InputReadOnly`), `date` (`InputDate`), `batch_uuid`/`category_uuid`
// (mutuamente exclusivos, mirror EXATO da cascata já usada em
// `FilterSidePesagem.tsx`, que já resolveu este mesmo par para o filtro),
// `is_stock` (`Switch`) → habilita/exige `arroba_value` (`NumberInput`),
// `sanitary` (`Switch`, regra cruzada CL-024/OQ-P7 abaixo).
//
// ---- Regra cruzada do toggle `sanitary` (Tarefa, "Riscos + solução") -------
// `sanitary=true` só é permitido com `batch_uuid` preenchido — NUNCA com
// `category_uuid` (confirmado por leitura direta de `WeighingRequest::rules()`
// no worktree irmão da API: `Rule::prohibitedIf(fn () =>
// $this->filled('category_uuid'))`). Em edição, o toggle só é
// visível/editável se o registro carregado já tiver bloco `sanitary`
// (`hasSanitaryId` prop, calculado pelo componente pai a partir de
// `!!weighingQuery.data?.sanitary` — `WeighingResource::toArray()` real NÃO
// devolve um `sanitary_id` escalar, devolve o objeto `sanitary` completo
// quando a relação existe e `null` caso contrário; a PRESENÇA do objeto é o
// equivalente ao `sanitary_id != null` do legado, CL-024/OQ-P7). Implementar
// esta trava ANTES de a Tarefa 39 plugar o conteúdo do bloco (que só cuida do
// CONTEÚDO, não desta regra de visibilidade) — errar aqui permitiria anexar
// Sanitário a uma Pesagem que nunca teve um, comportamento AUSENTE do legado.
//
// Desabilitado (com tooltip) quando: (a) nenhum `batch_uuid` preenchido
// (cobre tanto "nada selecionado ainda" quanto "categoria selecionada em vez
// de lote" — a contrato-tela §6.4 descreve a regra positiva "só habilitado
// quando batch_uuid preenchido"; a Tarefa descreve o caso negativo mais comum
// "desabilitado se category_uuid preenchido" — ambas descrevem a MESMA regra,
// implementada aqui pela condição única `!hasBatch`); OU (b) em edição, o
// registro carregado nunca teve bloco sanitário (`!hasSanitaryId`). Cada causa
// tem tooltip PRÓPRIO — `form.hints.sanitaryUnavailableInEdit` para o caso (b)
// (tem prioridade: em edição travada, o motivo é a ausência do registro
// Sanitário, não a seleção de lote) e `form.hints.selectBatchFirst` para o
// caso (a), que NÃO menciona categoria — selecionar Categoria só desabilita o
// Switch como efeito colateral de limpar `batch_uuid` (cascata lote↔categoria
// acima), não é uma causa própria de desabilitação (correção UT-000109).
//
// Defesa adicional (além de só desabilitar o Switch): ao selecionar
// Categoria, ou ao limpar Lote sem Categoria selecionada, `sanitary` é forçado
// para `false` via `setValue` — evita um `true` "preso" atrás de um Switch
// desabilitado se o usuário già tinha ligado o toggle antes de trocar para
// Categoria.
//
// ---- Cascata lote↔categoria (Regra 1 da Tarefa) ----------------------------
// Selecionar um limpa o outro (`setValue`+`shouldValidate`). O EVENTO de troca
// (para o componente PAI eventualmente limpar `animals`, responsabilidade da
// Tarefa 38) é veiculado pelo "contexto de form compartilhado" — não por um
// callback prop dedicado: `control`/`watch`/`setValue` vêm do MESMO
// `useForm()` do `CreateOrUpdateWeighing.tsx`, que já pode observar
// `watch('batch_uuid')`/`watch('category_uuid')` diretamente (mesma técnica
// já usada por `SanitarioHeaderFields`/`CreateOrUpdateSanitario`, onde o pai
// nunca precisou de um callback prop dedicado para reagir à cascata do
// filho). Ver comentário equivalente em `CreateOrUpdateWeighing.tsx`.
// -----------------------------------------------------------------------------

import { Flex, SimpleGrid, Skeleton, Text } from '@chakra-ui/react';
import { Controller } from 'react-hook-form';

import { DateInput } from '@/components/DateInput';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { NumberInput } from '@/components/Form/NumberInput';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { Tooltip } from '@/components/TooLtip';
import { Switch } from '@/components/ui/switch';

import { columnsForm } from '@/constants/coluns-form';

import { listBatchOptionsForForm } from '@/services/v2/Batches/batch-service';
import { listCategoryAnimalOptions } from '@/services/v2/CategoryAnimals/category-animal-service';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { BatchOption } from '@/@types/v2/Batches';
import type { CategoryAnimalOptionItem } from '@/@types/v2/CategoryAnimals';
import type { WeighingFormValues } from '@/@types/v2/Weighing';

import type { Control, UseFormSetValue, UseFormWatch } from 'react-hook-form';

function mapBatchOptionToOption(item: BatchOption): Option<string> {
  return { label: item.label, value: item.uuid };
}

function mapCategoryOptionToOption(item: CategoryAnimalOptionItem): Option<string> {
  return { label: item.label, value: item.uuid };
}

export interface WeighingHeaderFieldsProps {
  control: Control<WeighingFormValues>;
  watch: UseFormWatch<WeighingFormValues>;
  setValue: UseFormSetValue<WeighingFormValues>;
  languageGB: LanguageDate;
  canSave: boolean;
  isEditing: boolean;
  isLoading: boolean;
  /** `code` sempre `InputReadOnly` — hint "Gerado ao salvar" em criação, código real em edição. */
  codeDisplay: string;
  /**
   * `!!weighingQuery.data?.sanitary` calculado pelo pai — presença do bloco
   * `sanitary` no detalhe carregado (CL-024/OQ-P7). Irrelevante em criação
   * (`isEditing=false`).
   */
  hasSanitaryId: boolean;
}

export function WeighingHeaderFields({
  control,
  watch,
  setValue,
  languageGB,
  canSave,
  isEditing,
  isLoading,
  codeDisplay,
  hasSanitaryId,
}: WeighingHeaderFieldsProps) {
  const text = languageGB.weighing.weighing.form;
  const disabledBase = !canSave || isLoading;

  const watchedBatch = watch('batch_uuid');
  const watchedIsStock = watch('is_stock');

  const hasBatch = !!watchedBatch;
  const sanitaryLockedByEdit = isEditing && !hasSanitaryId;
  const sanitaryDisabled = disabledBase || !hasBatch || sanitaryLockedByEdit;
  const sanitaryTooltip = sanitaryLockedByEdit
    ? text.hints.sanitaryUnavailableInEdit
    : !hasBatch
      ? text.hints.selectBatchFirst
      : undefined;

  // check-date (EP-PES-09): a chamada (debounce, animais da lista, conflito por
  // linha) vive em `useWeighingDateConflicts`, usado por `CreateOrUpdateWeighing`.

  function handleBatchChange(option: Option<string> | null) {
    if (option) {
      setValue('category_uuid', null, { shouldDirty: true, shouldValidate: true });
    } else if (watch('sanitary')) {
      // Lote removido sem Categoria selecionada — `sanitary` exige
      // `batch_uuid` presente (regra cruzada, ver nota de cabeçalho).
      setValue('sanitary', false, { shouldDirty: true, shouldValidate: true });
    }
  }

  function handleCategoryChange(option: Option<string> | null) {
    if (option) {
      setValue('batch_uuid', null, { shouldDirty: true, shouldValidate: true });
      // Categoria exclui Sanitário (Regra 2 da Tarefa) — desliga
      // defensivamente mesmo que o Switch já esteja desabilitado.
      setValue('sanitary', false, { shouldDirty: true, shouldValidate: true });
    }
  }

  return (
    <SimpleGrid columns={columnsForm.default} gap={6}>
      <Skeleton loading={isLoading} borderRadius="md">
        <InputReadOnly name="code" label={text.fields.code} value={codeDisplay} />
      </Skeleton>

      <Skeleton loading={isLoading} borderRadius="md">
        <Controller
          name="date"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <DateInput
              label={text.fields.date}
              value={field.value ?? null}
              onChange={(value) => field.onChange(value ?? '')}
              isRequired
              disabled={disabledBase}
              error={error?.message}
            />
          )}
        />
      </Skeleton>

      <Skeleton loading={isLoading} borderRadius="md">
        <Controller
          name="batch_uuid"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <SelectAsyncPaginate
              name={field.name}
              label={text.fields.batch}
              placeholder={text.placeholders.batch}
              error={error?.message}
              // "um dos 2" (batch XOR category) — obrigatoriedade cruzada
              // validada pelo schema (Tarefa 34), não um `isRequired` fixo
              // que marcaria os 2 campos como obrigatórios ao mesmo tempo.
              isDisabled={disabledBase || isEditing}
              service={listBatchOptionsForForm}
              mapOptions={mapBatchOptionToOption}
              findParams={(search: string | { search: string }) => ({
                search: typeof search === 'string' ? search : search.search,
              })}
              value={field.value ?? null}
              onChange={(option: any) => {
                field.onChange(option ?? null);
                handleBatchChange(option ?? null);
              }}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          )}
        />
      </Skeleton>

      <Skeleton loading={isLoading} borderRadius="md">
        <Controller
          name="category_uuid"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <SelectAsyncPaginate
              name={field.name}
              label={text.fields.category}
              placeholder={text.placeholders.category}
              error={error?.message}
              isDisabled={disabledBase || isEditing}
              service={listCategoryAnimalOptions}
              mapOptions={mapCategoryOptionToOption}
              findParams={(search: string | { search: string }) => ({
                search: typeof search === 'string' ? search : search.search,
              })}
              value={field.value ?? null}
              onChange={(option: any) => {
                field.onChange(option ?? null);
                handleCategoryChange(option ?? null);
              }}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          )}
        />
      </Skeleton>

      <Skeleton loading={isLoading} borderRadius="md">
        <Controller
          name="is_stock"
          control={control}
          render={({ field }) => (
            <Flex align="center" justify="space-between" h="full">
              <Text fontSize="sm" fontWeight="medium">
                {text.fields.isStock}
              </Text>
              {/* @ts-ignore - Chakra UI v3 Switch API */}
              <Switch
                checked={!!field.value}
                onCheckedChange={(details: { checked: boolean }) => field.onChange(details.checked)}
                colorPalette="green"
                disabled={disabledBase}
                aria-label={text.fields.isStock}
              />
            </Flex>
          )}
        />
      </Skeleton>

      <Skeleton loading={isLoading} borderRadius="md">
        <Controller
          name="arroba_value"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <NumberInput
              name={field.name}
              label={text.fields.arrobaValue}
              allowDot
              decimalPlaces={2}
              min={0}
              value={field.value === '' ? null : Number(field.value)}
              onValueChange={(value) => field.onChange(value ?? '')}
              error={error?.message}
              isRequired={watchedIsStock}
              disabled={disabledBase || !watchedIsStock}
            />
          )}
        />
      </Skeleton>

      <Skeleton loading={isLoading} borderRadius="md">
        <Controller
          name="sanitary"
          control={control}
          render={({ field }) => (
            <Flex align="center" justify="space-between" h="full">
              <Text fontSize="sm" fontWeight="medium">
                {text.fields.sanitary}
              </Text>
              <Tooltip content={sanitaryTooltip} disabled={!sanitaryTooltip}>
                {/* @ts-ignore - Chakra UI v3 Switch API */}
                <Switch
                  checked={!!field.value}
                  onCheckedChange={(details: { checked: boolean }) =>
                    field.onChange(details.checked)
                  }
                  colorPalette="green"
                  disabled={sanitaryDisabled}
                  aria-label={text.fields.sanitary}
                />
              </Tooltip>
            </Flex>
          )}
        />
      </Skeleton>
    </SimpleGrid>
  );
}

export default WeighingHeaderFields;
