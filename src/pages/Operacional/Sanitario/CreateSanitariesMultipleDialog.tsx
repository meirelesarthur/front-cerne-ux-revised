// src/pages/Operacional/Sanitario/CreateSanitariesMultipleDialog.tsx
// -----------------------------------------------------------------------------
// Diálogo de criação múltipla de Sanitário — `san-action-create-multiple`
// (F-062, TASK-SAN-FE-07, contrato-tela-lane-c-sanitario-frontend.md §2.2/
// §6.7, ADR-FE-SAN-01). Unifica os 2 entry points legados de `storeMultiple`
// (`EP-SAN-06`) num único diálogo dentro do próprio módulo Sanitário — NÃO
// embutido em `AnimalFazenda` nem no Mapa de Confinamento (ADR-FE-SAN-01,
// já resolvidos/fora de escopo). Aberto pelo botão "Criar em Lote" do
// `HeaderTable` (TASK-SAN-FE-02 reservou o botão com um TODO explícito).
//
// Fluxo (Contrato B4 completo — mirror `NewBatchModal.tsx`/
// `FeedlotCorralSanitaryDialog.tsx`, `<form id>` no `Dialog.Body` + `<Button
// type="submit" form>` no `Dialog.Footer`, mesmo mecanismo do form de
// página, não reinventado):
//   1. `Lotes` (`SelectAsyncPaginate isMulti`, `listBatchOptionsForForm`) —
//      Regra 2 da Tarefa: seleção é a UNIÃO de 1+ lotes, nunca travada a 1 só.
//   2. Agregação client-side de animais elegíveis — 1 chamada de `GET
//      /animals/options?batch_uuid=` (LK-01, `listAnimalOptions`) POR lote
//      selecionado (a API só aceita 1 `batch_uuid` por vez), com paginação
//      completa por lote (mirror `fetchAllAnimalOptionsForBatch` de
//      `SanitarioHeaderFields.tsx`) e deduplicação por `uuid` (`Map`) — "sem
//      duplicar" (DoD da Tarefa, TC-FE-SAN-16). Exibida em `Select`
//      `isReadOnly` (contrato-tela §6.7: "lista agregada... readonly").
//   3. `SanitaryItemsSection`/`SanitaryItemRow` (TASK-SAN-FE-04) REUSADOS 1:1
//      — nenhuma lógica duplicada (Regra 3 da Tarefa). O reuso é possível
//      sem tocar aqueles 2 arquivos porque este diálogo usa o MESMO tipo
//      `SanitaryFormValues` do form principal (`@/@types/v2/Sanitaries`,
//      campo `batch_uuids` adicionado como OPCIONAL só para este diálogo,
//      TASK-SAN-FE-07) — `control: Control<SanitaryFormValues>` continua
//      idêntico para os 2 componentes reusados.
//   4. Submit → `POST EP-SAN-06` (`createSanitariesMultiple`), payload
//      montado AQUI (não em `sanitario-form-mapper.ts`, que é do form
//      principal) — `cost_center_uuid` de cada item é DELIBERADAMENTE
//      omitido do payload (Regra 1 da Tarefa: mirror legado `storeMultiple`,
//      que não recebe esse campo, mesmo que `SanitaryItemRow` exiba o
//      Select de Centro de Custo na UI). Sem bloco de mão de obra —
//      `time_control` vai sempre `false` no payload (CHAVE obrigatória no
//      Form Request real, só o VALOR é fixo — ver nota de correção em
//      `@/@types/v2/Sanitaries`, `SaveMultipleSanitariesRequest`).
//   5. Sucesso → `queryKey.sanitary.sanitaries` invalidado (via `useRequest`)
//      e diálogo fecha — a listagem (TASK-SAN-FE-02) reflete os novos
//      registros no próprio refetch.
//
// `date` — campo NÃO antecipado pelo contrato-tela §6.7 nem pela fundação
// (TASK-SAN-FE-01): leitura direta de `SanitaryMultipleRequest::rules()`
// (worktree irmão da API, exigida pelo task-packet desta Tarefa) confirma
// `'date' => ['required', 'date']` no Form Request real de `EP-SAN-06` — o
// diálogo PRECISA de um campo de Data (reusa o rótulo/mensagem já existentes
// do form principal, `languageGB.sanitary.sanitary.form.fields.date`/
// `validation.dateRequired` — nenhuma chave nova de i18n necessária).
// -----------------------------------------------------------------------------

import { useEffect, useMemo } from 'react';

import { Box, Dialog, Flex, Portal, Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { useLanguage } from '@/hooks/useLanguage';
import { useRequest } from '@/hooks/useRequest';

import { queryKey } from '@/constants/query-key';

import { sanitariesMultipleSchemaResolver } from '@/validations/schemas/Sanitaries/sanitaries-multiple-schema';

import { listAnimalOptions } from '@/services/v2/Animals/animal-service';
import { listBatchOptionsForForm } from '@/services/v2/Batches/batch-service';
import { createSanitariesMultiple } from '@/services/v2/Sanitaries/sanitaries-service';

import type { Option } from '@/@types/option';
import type { AnimalOptionListItem } from '@/@types/v2/Animals';
import type { BatchOption } from '@/@types/v2/Batches';
import type {
  SanitaryDetail,
  SanitaryFormValues,
  SaveMultipleSanitariesRequest,
} from '@/@types/v2/Sanitaries';

import { SanitaryItemsSection } from './SanitaryItemsSection';

const emptyValues: SanitaryFormValues = {
  date: null,
  batch_uuid: null,
  time_control: false,
  animal_uuids: [],
  items: [],
  labor: [],
  batch_uuids: [],
};

const findParamsFromSearch = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
});

function mapBatchOptionToOption(item: BatchOption): Option<string> {
  return { label: item.label, value: item.uuid };
}

function mapAnimalOptionToOption(item: AnimalOptionListItem): Option<string> {
  return { label: item.label, value: item.uuid };
}

// Agrega TODAS as páginas de `GET /animals/options?batch_uuid=` de CADA lote
// selecionado (a API só aceita 1 `batch_uuid` por chamada) e deduplica por
// `uuid` — mirror `fetchAllAnimalOptionsForBatch` de
// `SanitarioHeaderFields.tsx` (mesma trava defensiva `MAX_PAGES`), estendido
// para N lotes (Regra 2 da Tarefa: união, não trava a 1 lote só).
async function fetchAllAnimalOptionsForBatches(batchUuids: string[]): Promise<Option<string>[]> {
  const collected = new Map<string, Option<string>>();
  const MAX_PAGES = 100;

  for (const batchUuid of batchUuids) {
    let page = 1;
    for (page = 1; page <= MAX_PAGES; page += 1) {
      // eslint-disable-next-line no-await-in-loop
      const response = await listAnimalOptions({ batch_uuid: batchUuid, page, per_page: 100 });
      response.data.items.map(mapAnimalOptionToOption).forEach((option) => {
        collected.set(option.value, option);
      });
      if (page >= response.data.pagination.total_pages) break;
    }
  }

  return Array.from(collected.values());
}

export interface CreateSanitariesMultipleDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateSanitariesMultipleDialog({
  isOpen,
  onClose,
}: CreateSanitariesMultipleDialogProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.sanitary.sanitary.createMultipleDialog;
  const formText = languageGB.sanitary.sanitary.form;

  const { control, handleSubmit, reset, watch } = useForm<SanitaryFormValues>({
    mode: 'onChange',
    resolver: sanitariesMultipleSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (isOpen) reset(emptyValues);
  }, [isOpen, reset]);

  const watchedBatches = watch('batch_uuids') ?? [];
  const batchUuids = useMemo(
    () => watchedBatches.map((option) => option.value).sort(),
    [watchedBatches]
  );

  // Agregação client-side (contrato-tela §6.7) — habilitada só quando há
  // 1+ lote selecionado; `queryKey` ordenado garante a mesma chave
  // independente da ordem de seleção dos lotes no `SelectAsyncPaginate`.
  const animalsQuery = useQuery({
    queryKey: [queryKey.sanitary.sanitary, 'create-multiple-animals', batchUuids],
    queryFn: () => fetchAllAnimalOptionsForBatches(batchUuids),
    enabled: batchUuids.length > 0,
  });

  const aggregatedAnimals = batchUuids.length > 0 ? (animalsQuery.data ?? []) : [];

  const mutation = useRequest<SanitaryDetail[]>({
    asyncFunction: (payload: SaveMultipleSanitariesRequest) => createSanitariesMultiple(payload),
    entityName: text.title,
    personalizedMessage: text.successToast,
    queryKey: queryKey.sanitary.sanitaries,
    typesRequest: 'create',
    actionSuccess: () => {
      onClose();
    },
  });

  const isSubmitting = mutation.isPending;

  function onSubmit(data: SanitaryFormValues) {
    const payload: SaveMultipleSanitariesRequest = {
      date: data.date!,
      // Sempre `false` — sem bloco de mão de obra neste fluxo (contrato-tela
      // §6.7); a CHAVE é obrigatória no Form Request real (ver nota de
      // cabeçalho), nunca omitida.
      time_control: false,
      animal_uuids: aggregatedAnimals.map((option) => option.value),
      items: data.items.map((item) => ({
        warehouse_uuid: item.warehouse_uuid!.value,
        product_uuid: item.product!.product_uuid,
        stock_uuid: item.product!.value,
        measurement_uuid: item.measurement_uuid!.value,
        quantity: Number(item.quantity),
        ...(item.note ? { note: item.note } : {}),
        // `cost_center_uuid` DELIBERADAMENTE omitido — Regra 1 da Tarefa
        // (mirror legado `storeMultiple`), mesmo que `SanitaryItemRow`
        // (reusado 1:1) exiba o campo de Centro de Custo na UI.
      })),
    };
    mutation.mutate(payload);
  }

  const canSubmit = aggregatedAnimals.length > 0;

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(details: { open: boolean }) => {
        if (!details.open && !isSubmitting) onClose();
      }}
      size="xl"
      lazyMount
      unmountOnExit
    >
      <Portal>
        <Dialog.Backdrop />
        {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
        <Dialog.Positioner>
          {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
          <Dialog.Content>
            <Dialog.Header>
              {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
              <Dialog.Title>{text.title}</Dialog.Title>
            </Dialog.Header>

            <form id="create-sanitaries-multiple-form" onSubmit={handleSubmit(onSubmit)}>
              <Dialog.Body maxH="70vh" overflowY="auto">
                <Flex direction="column" gap={4} mb={6}>
                  <Controller
                    name="date"
                    control={control}
                    render={({ field, fieldState: { error } }) => (
                      <DateInput
                        label={formText.fields.date}
                        value={field.value ?? null}
                        onChange={(value) => field.onChange(value ?? '')}
                        isRequired
                        disabled={isSubmitting}
                        error={error?.message}
                        disablePortal
                      />
                    )}
                  />

                  <Controller
                    name="batch_uuids"
                    control={control}
                    render={({ field, fieldState: { error } }) => (
                      <SelectAsyncPaginate
                        isMulti
                        name={field.name}
                        label={text.fields.batches}
                        placeholder={text.placeholders.batches}
                        error={error?.message}
                        isRequired
                        isDisabled={isSubmitting}
                        service={listBatchOptionsForForm}
                        mapOptions={mapBatchOptionToOption}
                        findParams={findParamsFromSearch}
                        value={field.value ?? []}
                        onChange={(options: any) => field.onChange(options ?? [])}
                        disablePortal
                      />
                    )}
                  />

                  <Box>
                    <Select
                      name="animal_uuids_preview"
                      label={text.fields.animals}
                      options={aggregatedAnimals}
                      value={aggregatedAnimals}
                      onChange={() => {}}
                      multiple
                      isReadOnly
                      loading={animalsQuery.isFetching}
                      disablePortal
                    />
                    {batchUuids.length > 0 &&
                      aggregatedAnimals.length === 0 &&
                      !animalsQuery.isFetching && (
                        <Text fontSize="sm" color="fg.muted" mt={1}>
                          {languageGB.defaltStrings.emptyData}
                        </Text>
                      )}
                  </Box>
                </Flex>

                <SanitaryItemsSection
                  control={control}
                  languageGB={languageGB}
                  animalsCount={aggregatedAnimals.length}
                  isDisabled={isSubmitting}
                />
              </Dialog.Body>
            </form>

            <Dialog.Footer>
              <Button
                title={text.cancelButton}
                variant="secondary"
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
              />
              <Button
                title={text.submitButton}
                type="submit"
                form="create-sanitaries-multiple-form"
                loading={isSubmitting}
                disabled={!canSubmit}
              />
            </Dialog.Footer>
            {/* @ts-ignore ChakraUI v3 headless dialog */}
            <Dialog.CloseTrigger />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

export default CreateSanitariesMultipleDialog;
