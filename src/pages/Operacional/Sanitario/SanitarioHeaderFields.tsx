// src/pages/Operacional/Sanitario/SanitarioHeaderFields.tsx
// -----------------------------------------------------------------------------
// Cabeçalho do formulário de Sanitário — `san-form-main` (F-062,
// TASK-SAN-FE-03, contrato-tela-lane-c-sanitario-frontend.md §6.3). 6 campos:
// `code`/`responsible_name` SEMPRE `InputReadOnly` (Regras 1/2 da Tarefa —
// nunca no payload, nunca editáveis, nunca campos do `useForm`, só props de
// display resolvidas pelo componente pai), `date` (`InputDate`, obrigatório),
// `batch_uuid` (`SelectAsyncPaginate`, obrigatório, travado em edição — Regra
// 6), `time_control` (`Switch`, controla a visibilidade de
// `SanitaryLaborSection` — bloco reservado, implementado só na TASK-SAN-FE-29,
// Regra 4 desta Tarefa), `animal_uuids` (`SelectAsyncPaginate isMulti` +
// "Marcar/Desmarcar todos", obrigatório mín. 1 — Regra 5, validado pelo
// schema já entregue na TASK-SAN-FE-01, não reimplementado aqui).
//
// Cascata IG-01 (repovoamento): `batch_uuid` muda → o componente PAI
// (`CreateOrUpdateSanitario.tsx`) limpa `animal_uuids` via `onBatchChange`
// (prop) e o `SelectAsyncPaginate` de animais refaz a busca pelo novo
// `batch_uuid` (fechamento sobre `watch('batch_uuid')`, `cacheUniqs` reseta o
// cache interno de paginação do react-select-async-paginate). O aviso
// `check-date` (IG-01, segunda metade) fica fora deste incremento —
// `GAP-FE-SAN-02`, contrato-tela §11 (default aceito, sem endpoint aprovado
// equivalente).
//
// "Marcar todos" (AC-07, mirror `NaturalSection` da lane B —
// `Reproducao/Acasalamento/sections/NaturalSection.tsx`) busca TODAS as
// páginas de `GET /animals/options?batch_uuid=` (LK-01, `listAnimalOptions`
// já existente e reusado — nenhum endpoint novo criado aqui) para o lote
// corrente, não só a página já carregada no Select assíncrono. Trava
// defensiva de 100 páginas (10.000 animais, `per_page` máx. da API) evita
// loop infinito caso a paginação nunca convirja — NÃO é um limite de
// negócio, nenhum lote real deste domínio chega perto disso.
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, Flex, SimpleGrid, Skeleton, Text } from '@chakra-ui/react';
import { Controller } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { Switch } from '@/components/ui/switch';

import { columnsForm } from '@/constants/coluns-form';

import { listAnimalOptions } from '@/services/v2/Animals/animal-service';
import { listBatchOptionsForForm } from '@/services/v2/Batches/batch-service';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { AnimalOptionListItem } from '@/@types/v2/Animals';
import type { BatchOption } from '@/@types/v2/Batches';
import type { SanitaryFormValues } from '@/@types/v2/Sanitaries';

import type { Control, UseFormSetValue, UseFormWatch } from 'react-hook-form';

function mapAnimalOptionToOption(item: AnimalOptionListItem): Option<string> {
  return { label: item.label, value: item.uuid };
}

function mapBatchOptionToOption(item: BatchOption): Option<string> {
  return { label: item.label, value: item.uuid };
}

/**
 * Agrega TODAS as páginas de `GET /animals/options?batch_uuid=` para o lote
 * informado (AC-07 "Marcar todos"). Trava defensiva de `MAX_PAGES` — ver
 * nota de cabeçalho do arquivo.
 * @param {string} batchUuid - uuid do lote corrente (`batch_uuid`).
 * @return {Promise<Option<string>[]>} Todas as opções de animal do lote.
 */
async function fetchAllAnimalOptionsForBatch(batchUuid: string): Promise<Option<string>[]> {
  const collected: Option<string>[] = [];
  const MAX_PAGES = 100;
  let page = 1;

  for (page = 1; page <= MAX_PAGES; page += 1) {
    // eslint-disable-next-line no-await-in-loop
    const response = await listAnimalOptions({ batch_uuid: batchUuid, page, per_page: 100 });
    collected.push(...response.data.items.map(mapAnimalOptionToOption));
    if (page >= response.data.pagination.total_pages) break;
  }

  return collected;
}

export interface SanitarioHeaderFieldsProps {
  control: Control<SanitaryFormValues>;
  watch: UseFormWatch<SanitaryFormValues>;
  setValue: UseFormSetValue<SanitaryFormValues>;
  languageGB: LanguageDate;
  canSave: boolean;
  isEditing: boolean;
  isLoading: boolean;
  /** `code` sempre `InputReadOnly` (Regra 1) — hint "Gerado ao salvar" em criação, código real em edição. */
  codeDisplay: string;
  /** `responsible_name` sempre `InputReadOnly` (Regra 2) — nunca um campo do `useForm`, nunca no payload. */
  responsibleName: string;
}

export function SanitarioHeaderFields({
  control,
  watch,
  setValue,
  languageGB,
  canSave,
  isEditing,
  isLoading,
  codeDisplay,
  responsibleName,
}: SanitarioHeaderFieldsProps) {
  const text = languageGB.sanitary.sanitary.form;
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const disabledBase = !canSave || isLoading;
  const watchedBatch = watch('batch_uuid');
  const animalUuids = watch('animal_uuids') ?? [];

  // LK-01 — fechamento sobre `watchedBatch` corrente, mirror
  // `lookupAnimalsByBatch` de `Weaning/CreateOrUpdateWeaning.tsx`.
  function lookupAnimalsByBatch(params: { page?: number; per_page?: number; search?: string }) {
    return listAnimalOptions({ ...params, batch_uuid: watchedBatch?.value });
  }

  // IG-01 (repovoamento) — troca de Lote limpa a seleção anterior de
  // animais; o Select assíncrono acima refaz a busca (fechamento sobre
  // `watchedBatch`) na próxima abertura, `cacheUniqs` descarta o cache
  // antigo (ver Controller de `animal_uuids` abaixo).
  function handleBatchChange() {
    setValue('animal_uuids', [], { shouldDirty: true, shouldValidate: true });
  }

  async function handleMarkAll() {
    if (!watchedBatch?.value) return;
    setIsMarkingAll(true);
    try {
      const allOptions = await fetchAllAnimalOptionsForBatch(watchedBatch.value);
      setValue('animal_uuids', allOptions, { shouldDirty: true, shouldValidate: true });
    } finally {
      setIsMarkingAll(false);
    }
  }

  function handleUnmarkAll() {
    setValue('animal_uuids', [], { shouldDirty: true, shouldValidate: true });
  }

  return (
    <>
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
          <InputReadOnly
            name="responsible_name"
            label={text.fields.responsible}
            value={responsibleName}
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
                isRequired
                // Regra 6 da Tarefa — travado quando `isEditing` (mirror
                // `Weaning`/`LoteReproducao`, o lote nunca muda no update).
                isDisabled={disabledBase || isEditing}
                service={listBatchOptionsForForm}
                mapOptions={mapBatchOptionToOption}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? null}
                onChange={(option: any) => {
                  field.onChange(option ?? null);
                  handleBatchChange();
                }}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />
        </Skeleton>

        <Skeleton loading={isLoading} borderRadius="md">
          <Controller
            name="time_control"
            control={control}
            render={({ field }) => (
              <Flex align="center" justify="space-between" h="full">
                <Text fontSize="sm" fontWeight="medium">
                  {text.fields.timeControl}
                </Text>
                {/* @ts-ignore - Chakra UI v3 Switch API */}
                <Switch
                  checked={!!field.value}
                  onCheckedChange={(details: { checked: boolean }) =>
                    field.onChange(details.checked)
                  }
                  colorPalette="green"
                  disabled={disabledBase}
                  aria-label={text.fields.timeControl}
                />
              </Flex>
            )}
          />
        </Skeleton>
      </SimpleGrid>

      {/* `animal_uuids` fora do grid principal — linha própria com as ações
          em massa abaixo, mirror `NaturalSection` (AC-07). */}
      <Box mt={6}>
        <Controller
          name="animal_uuids"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <SelectAsyncPaginate
              isMulti
              name={field.name}
              label={text.fields.animals}
              placeholder={text.placeholders.animals}
              error={error?.message}
              helperText={!watchedBatch ? text.hints.selectBatchFirst : undefined}
              isRequired
              isDisabled={disabledBase || !watchedBatch}
              service={lookupAnimalsByBatch}
              mapOptions={mapAnimalOptionToOption}
              findParams={(search: string | { search: string }) => ({
                search: typeof search === 'string' ? search : search.search,
              })}
              cacheUniqs={[watchedBatch?.value]}
              value={field.value ?? []}
              onChange={(options: any) => field.onChange(options ?? [])}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          )}
        />
        <Flex gap={2} mt={2}>
          <Button
            type="button"
            title={text.markAllButton}
            variant="outline"
            size="sm"
            onClick={handleMarkAll}
            loading={isMarkingAll}
            disabled={disabledBase || !watchedBatch}
          />
          <Button
            type="button"
            title={text.unmarkAllButton}
            variant="outline"
            size="sm"
            onClick={handleUnmarkAll}
            disabled={disabledBase || animalUuids.length === 0}
          />
        </Flex>
      </Box>
    </>
  );
}

export default SanitarioHeaderFields;
