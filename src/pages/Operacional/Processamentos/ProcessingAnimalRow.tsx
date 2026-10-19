// src/pages/Operacional/Processamentos/ProcessingAnimalRow.tsx
// -----------------------------------------------------------------------------
// Linha individual do repeater `animals[]` (TASK-FE-039-PROC-03) — componente
// PRÓPRIO (nunca inline no `.map()`), mirror `TransferAbcAnimalRow`
// (`Operacional/TransferAbcBatch/TransferAbcAnimalsEditor.tsx`).
//
// SEM pré-preenchimento da origem (FD3, front-plan-proc.md §7) — cada linha
// nasce vazia, o usuário monta o array do zero.
//
// REWORK (039, round-3, PROC-R3-03/04) — campo "Espécie" REMOVIDO do card
// (ALVO A/API deriva `specie_id` da Categoria no `finish`); a Categoria
// vem TRAVADA (`category_locked` do `prepare`, não mais condicionada a uma
// Espécie selecionada nesta tela).
//
// round-5 (correção do dono) — campo "Status Reprodutivo"
// (`reproductive_status`) REMOVIDO por completo do card. "Estágio
// Reprodutivo" (`category_matrice_uuid`) passa a ser OBRIGATÓRIO quando a
// categoria é FÊMEA (`is_reproductive===true`, opção da Categoria/
// `prepare.category`). O flag mora no RHF (`animals.${index}.is_reproductive`,
// campo de UI, NUNCA no payload — `buildFinishProcessingPayload` monta o
// item chave por chave, não faz spread), lido via `useWatch` — não
// `useState` local: com `category_locked` o select fica `isDisabled` e o
// `onChange` nunca dispara, então o flag PRECISA sobreviver às hidratações
// programáticas (`prepare` E rascunho do `localStorage`), que só `reset`/
// `fieldArray.replace()` no RHF garantem.
//
// REWORK (039, PROCFID-02) — 4 campos novos do legado (`_card_animal.
// blade.php`): "Último Peso" (somente leitura, prop `lastWeighing`, NUNCA
// RHF/payload — mesmo tratamento de `categoryLocked`), "Data de nascimento"
// (editável), "Ultrassom" (Select boolean, libera AOL/EGS/MARM/Classe —
// mesmo padrão de visibilidade condicional). O preview
// `price_kilo_alive`/`price_arroba_alive`/
// `value_unitary`/`unity_animal_ua` foi REMOVIDO (clutter sem análogo no
// legado, que só grava esses valores em `<input type="hidden">`).
// -----------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react';

import { Box, Flex, Icon, IconButton, SimpleGrid, Text, useDisclosure } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import {
  Control,
  Controller,
  FieldErrors,
  UseFormGetValues,
  UseFormSetValue,
  useWatch,
} from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { ChangeBatchModuleAreaModal } from '@/pages/Operacional/LoteFazenda/TransferBatchFarms/ChangeBatchModuleAreaModal';
import { NewBatchModal } from '@/pages/Operacional/LoteFazenda/TransferBatchFarms/NewBatchModal';

import { DateInput } from '@/components/DateInput';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { Field } from '@/components/Form/Field';
import { Input } from '@/components/Form/Input';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { IconButtonTable } from '@/components/IconButtonTable';

import { useCurrentFarm } from '@/hooks/useCurrentFarm';

import { listBatchOptionsForForm } from '@/services/v2/Batches/batch-service';
import { listBreedOptions } from '@/services/v2/Breeds/breed-service';
import { listCategoryAnimalOptions } from '@/services/v2/CategoryAnimals/category-animal-service';
import { listActiveCategoryMatrices } from '@/services/v2/CategoryMatrices/category-matrix-service';
import { getBatch } from '@/services/v2/LoteFazenda/transferBatchFarm-service';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { BatchOption } from '@/@types/v2/Batches';
import type { BreedOptionItem } from '@/@types/v2/Breeds/breed';
import type { CategoryAnimalOptionItem } from '@/@types/v2/CategoryAnimals';
import type { CategoryMatrixOptionItem } from '@/@types/v2/CategoryMatrices/category-matrix';
import type { BatchDetail } from '@/@types/v2/LoteFazenda/transferBatchFarm';
import type { FinishProcessingForm } from '@/@types/v2/Processamentos/processing';

import { ProcessingAnimalIdentificationsSection } from './ProcessingAnimalIdentificationsSection';
import { propagateToEmptyRows } from './propagateToEmptyRows';

// 97-Esteiras/041, TASK-FE-041-LF-03 — 2 diálogos ADITIVOS chamados de
// dentro deste card (ACT-27/ACT-30, `plano-front-lote-fazenda.md §4
// DLG-BATCH/DLG-AREA`). Import LOCAL (não barrel) — extensão aditiva de
// outra feature em produção (Processamentos, Exec 039), sem tocar o resto
// do arquivo além dos 2 pontos de entrada documentados abaixo.

interface CategoryAnimalOptionWithFlag {
  label: string;
  value: string;
  is_reproductive: boolean;
}

export interface ProcessingAnimalRowProps {
  control: Control<FinishProcessingForm>;
  setValue: UseFormSetValue<FinishProcessingForm>;
  getValues: UseFormGetValues<FinishProcessingForm>;
  errors: FieldErrors<FinishProcessingForm>;
  index: number;
  /** Total de animais no array — usado pela propagação (PROC-08), NÃO só os montados (o wizard só monta o passo atual). */
  fieldsLength: number;
  onRemove: (index: number) => void;
  /** `false` quando esta é a ÚLTIMA linha restante — mínimo 1 animal (mirror `MovementSaleItemsSection`). */
  canRemove: boolean;
  disabled: boolean;
  languageGB: LanguageDate;
  /** PROC-04 — informativo (badge), hidratado pelo `prepare`; NUNCA bloqueia o select de categoria. */
  categoryLocked?: boolean;
  /** PROCFID-02 (§3.5) — "Último Peso" somente leitura, hidratado pelo `prepare`. NUNCA RHF/payload. */
  lastWeighing?: { weight: number | null; date: string | null };
  /** PROC-08 — FQCN do morph da origem (`App\Models\X`; linhas legadas `App\X`), normalizado por `isMovementPurchaseOrigin`; habilita a propagação de identificação só para Compra. */
  originType?: string;
}

function formatLastWeight(weight: number | null): string {
  if (weight == null) return '—';
  return weight.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function ProcessingAnimalRow({
  control,
  setValue,
  getValues,
  errors,
  index,
  fieldsLength,
  onRemove,
  canRemove,
  disabled,
  languageGB,
  categoryLocked = false,
  lastWeighing,
  originType,
}: ProcessingAnimalRowProps) {
  const animalText = languageGB.processamentos.processing.form.fields.animal;
  // TASK-063-PROC-QA3-07 — texto do aviso "Atenção" (Lote sem área/módulo).
  const batchWithoutAreaWarningText =
    languageGB.processamentos.processing.form.batchWithoutAreaOrGrazingWarning;
  const booleanOptions: Option<boolean>[] = [
    { label: languageGB.defaltStrings.yes, value: true },
    { label: languageGB.defaltStrings.no, value: false },
  ];

  // round-5 (correção do dono) — flag reativo do RHF, sobrevive a `prepare`
  // E a rascunho restaurado (nenhum dos dois passa por `onChange` manual).
  const categoryIsReproductive = useWatch({
    control,
    name: `animals.${index}.is_reproductive`,
  });
  const watchedHasUltrasound = useWatch({ control, name: `animals.${index}.has_ultrasound` });

  const identificationsArrayError = (errors as any)?.animals?.[index]?.identifications?.message as
    string | undefined;

  // 97-Esteiras/041, TASK-FE-041-LF-03 — 2 pontos de entrada ADITIVOS
  // (ACT-27/ACT-30). `batchOptionsRefreshToken` força o `SelectAsyncPaginate`
  // de Lote (abaixo) a descartar seu cache interno após "Novo Lote" criar um
  // registro (INT-36) — só 1 card do wizard fica montado por vez
  // (`ProcessingAnimalsSection.tsx`), então o estado LOCAL basta (sem
  // invalidação cross-componente).
  const loteFazendaText = languageGB.loteFazenda;
  const { data: currentFarm } = useCurrentFarm();
  const watchedBatch = useWatch({ control, name: `animals.${index}.batch_uuid` });
  const watchedBatchUuid = (watchedBatch as Option<string> | null)?.value ?? null;
  const [batchOptionsRefreshToken, setBatchOptionsRefreshToken] = useState(0);

  const {
    open: isNewBatchOpen,
    onOpen: onOpenNewBatch,
    onClose: onCloseNewBatch,
  } = useDisclosure();
  const {
    open: isModuleAreaOpen,
    onOpen: onOpenModuleArea,
    onClose: onCloseModuleArea,
  } = useDisclosure();
  // TASK-063-PROC-QA3-07 — aviso "Atenção" exibido ANTES de abrir a
  // transferência (mirror `_card_animal.blade.php:179-246`, o legado
  // `swal()` PRIMEIRO, modal só no `.then()`).
  const {
    open: isBatchWithoutAreaWarningOpen,
    onOpen: onOpenBatchWithoutAreaWarning,
    onClose: onCloseBatchWithoutAreaWarning,
  } = useDisclosure();

  // TASK-063-PROC-QA3-07 — captura o CONTEXTO do Lote (uuid/label/total) ANTES
  // de `setValue(batch_uuid, null)` desselecionar o campo: `ChangeBatchModuleAreaModal`
  // exige `batchUuid` não-nulo para submeter (`onSubmit` retorna cedo sem
  // ele), então não pode depender mais de `watchedBatchUuid` depois da
  // desseleção — precisa de um snapshot próprio.
  const [batchWithoutAreaContext, setBatchWithoutAreaContext] = useState<{
    uuid: string;
    label: string;
    totalAnimals: number;
  } | null>(null);

  // correção 097-v2 — Lote recém-vinculado via "Vincular agora": o useEffect
  // de detecção NUNCA re-desseleciona este uuid (desacopla da query de
  // verificação, que com staleTime:0+refetchOnMount refazia o GET e desfazia
  // a re-seleção). Determinístico: não depende do que a query retorna.
  const justLinkedBatchUuidRef = useRef<string | null>(null);

  function handleBatchCreated(batch: BatchDetail) {
    setBatchOptionsRefreshToken((token) => token + 1);
    setValue(
      `animals.${index}.batch_uuid`,
      { label: batch.description, value: batch.uuid } as any,
      {
        shouldDirty: true,
      }
    );
  }

  // ACT-30/INT-25 — quando o Lote selecionado no card não tem área NEM
  // módulo, abre `ChangeBatchModuleAreaModal` automaticamente (LKP-35 já é
  // hidratado dentro do próprio modal). Nunca dispara para o valor "0"
  // sentinela (`listBatchOptionsForForm` já filtra "Sem lote", mas defensivo
  // aqui também).
  const batchDetailForModuleAreaQuery = useQuery({
    queryKey: ['lote-fazenda-batch-module-area-check', watchedBatchUuid],
    queryFn: () => getBatch(watchedBatchUuid as string),
    enabled: !!watchedBatchUuid && watchedBatchUuid !== '0',
  });

  useEffect(() => {
    const batchDetail = batchDetailForModuleAreaQuery.data?.data;
    if (!batchDetail) return;
    // 097-v2 — pulo determinístico: este Lote já recebeu área/módulo agora.
    if (justLinkedBatchUuidRef.current === batchDetail.uuid) return;
    const hasArea = (batchDetail.areas?.length ?? 0) > 0;
    const hasGrazing = (batchDetail.grazings?.length ?? 0) > 0;
    if (!hasArea && !hasGrazing) {
      // TASK-063-PROC-QA3-07 — mirror `_card_animal.blade.php:179-246`,
      // `handleBatch()`: (1) captura o CONTEXTO do Lote (a transferência
      // ainda precisa do uuid depois da desseleção abaixo); (2) DESSELECIONA
      // o Lote (`$(this).val("")`) ANTES de qualquer diálogo — nunca deixa
      // o card com um Lote sem área/módulo selecionado; (3) mostra o aviso
      // "Atenção..."; a transferência (`ChangeBatchModuleAreaModal`) só
      // abre no confirm do aviso (`handleConfirmBatchWithoutAreaWarning`),
      // mirror do `.then()` do legado. `enabled: !!watchedBatchUuid` da
      // própria query garante que o `setValue(null)` abaixo não reentra
      // este efeito (a próxima chave de query fica desabilitada, sem
      // `data`).
      setBatchWithoutAreaContext({
        uuid: batchDetail.uuid,
        label: batchDetail.description,
        totalAnimals: batchDetail.total_animals ?? 0,
      });
      setValue(`animals.${index}.batch_uuid`, null, { shouldDirty: true });
      onOpenBatchWithoutAreaWarning();
    }
  }, [batchDetailForModuleAreaQuery.data, index, onOpenBatchWithoutAreaWarning, setValue]);

  function handleConfirmBatchWithoutAreaWarning() {
    onCloseBatchWithoutAreaWarning();
    onOpenModuleArea();
  }

  // correção 097-v2 (plano-correcao.md, "Correção v2" §3) — o v1 (seed do
  // cache do TanStack) foi descartado: provado em tela que não resolvia, pois
  // `batchDetailForModuleAreaQuery` usa staleTime:0+refetchOnMount (defaults)
  // e refaz o GET ao re-selecionar, substituindo o seed antes do efeito de
  // detecção reavaliar. Fix determinístico: marcar `justLinkedBatchUuidRef`
  // ANTES do `setValue` — quando a detecção reavaliar este uuid (seed OU
  // refetch do GET), o guard no topo do `useEffect` acima já o ignora,
  // independente do que a query retorne ou da ordem de commits.
  function handleModuleAreaChanged(updatedBatch: BatchDetail) {
    onCloseModuleArea();
    justLinkedBatchUuidRef.current = updatedBatch.uuid;
    setValue(
      `animals.${index}.batch_uuid`,
      { label: updatedBatch.description, value: updatedBatch.uuid } as Option<string>,
      { shouldDirty: true, shouldValidate: true }
    );
    setBatchWithoutAreaContext(null);
  }

  return (
    <Box bg="bg.muted" border="1px solid" borderColor="border.subtle" borderRadius="lg" p={4}>
      <Flex justify="space-between" align="center" mb={3}>
        <Text fontSize="sm" fontWeight="semibold">
          {animalText.sectionTitle} #{index + 1}
        </Text>
        <IconButtonTable
          type="button"
          aria-label={animalText.removeAnimal}
          mensegerTooltip={animalText.removeAnimal}
          size="sm"
          color="red.500"
          variant="ghost"
          disabled={disabled || !canRemove}
          onClick={() => canRemove && onRemove(index)}
        >
          <Icon as={FiTrash2} />
        </IconButtonTable>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
        <Box>
          <Controller
            name={`animals.${index}.category_uuid`}
            control={control}
            render={({ field, fieldState }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={animalText.category}
                // PROC-R3-03 — `category_locked` (do `prepare`) TRAVA o
                // select (mirror `category_locked: true` em todas as
                // origens da API). R4-FE-01 — badge informativo removido a
                // pedido do dono; o `isDisabled` continua sendo a ÚNICA
                // função real da prop.
                isDisabled={disabled || categoryLocked}
                service={listCategoryAnimalOptions}
                mapOptions={(item: CategoryAnimalOptionItem): CategoryAnimalOptionWithFlag => ({
                  label: item.label,
                  value: item.uuid,
                  is_reproductive: item.is_reproductive,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? null}
                onChange={(option: CategoryAnimalOptionWithFlag | null | any) => {
                  field.onChange(option ?? null);
                  // round-5 — captura `is_reproductive` DIRETO da opção
                  // selecionada e grava no RHF (troca manual — caso
                  // destravado).
                  const isReproductive = option?.is_reproductive ?? false;
                  setValue(`animals.${index}.is_reproductive`, isReproductive, {
                    shouldDirty: true,
                  });
                }}
                error={fieldState.error?.message}
                isRequired
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />
        </Box>

        <Controller
          name={`animals.${index}.breed_uuid`}
          control={control}
          render={({ field, fieldState }) => (
            <SelectAsyncPaginate
              name={field.name}
              label={animalText.breed}
              isDisabled={disabled}
              service={listBreedOptions}
              mapOptions={(item: BreedOptionItem) => ({ label: item.label, value: item.uuid })}
              findParams={(search: string | { search: string }) => ({
                search: typeof search === 'string' ? search : search.search,
              })}
              value={field.value ?? null}
              onChange={(option: any) => {
                field.onChange(option ?? null);
                // PROC-08 — propaga para as linhas SEGUINTES ainda vazias
                // (mirror `_card_animal.blade.php:179-263`, `handleBreed`).
                propagateToEmptyRows(
                  getValues,
                  setValue,
                  fieldsLength,
                  index,
                  'breed_uuid',
                  option ?? null
                );
              }}
              error={fieldState.error?.message}
              isRequired
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          )}
        />

        <Controller
          name={`animals.${index}.batch_uuid`}
          control={control}
          render={({ field, fieldState }) => (
            <SelectAsyncPaginate
              name={field.name}
              label={animalText.batch}
              isDisabled={disabled}
              // R4-FE-02 — `batch_uuid` é `required|uuid|exists`: variante
              // de FORMULÁRIO (sem "Sem lote").
              service={listBatchOptionsForForm}
              mapOptions={(item: BatchOption) => ({ label: item.label, value: item.uuid })}
              findParams={(search: string | { search: string }) => ({
                search: typeof search === 'string' ? search : search.search,
              })}
              // 97-Esteiras/041, TASK-FE-041-LF-03 (INT-36) — repopula a
              // lista após "Novo Lote" criar um registro.
              cacheUniqs={[batchOptionsRefreshToken]}
              value={field.value ?? null}
              onChange={(option: any) => {
                field.onChange(option ?? null);
                // PROC-08 — propaga para as linhas SEGUINTES ainda vazias
                // (mirror `_card_animal.blade.php:179-263`, `handleBatch`).
                propagateToEmptyRows(
                  getValues,
                  setValue,
                  fieldsLength,
                  index,
                  'batch_uuid',
                  option ?? null
                );
              }}
              error={fieldState.error?.message}
              isRequired
              menuPortalTarget={document.body}
              menuPosition="fixed"
              // 97-Esteiras/041, TASK-FE-041-LF-03 (ACT-27) — ponto de
              // entrada ADITIVO nº1: abre o modal "Novo Lote", migrado do
              // `Button` avulso abaixo do select para o `labelAction`
              // (EST-07), sempre visível (mesma condição do legado).
              // Create-only (sem alternância de ícone editar).
              labelActionTooltip={loteFazendaText.newBatch.openButton}
              labelAction={
                <IconButton
                  aria-label={loteFazendaText.newBatch.openButton}
                  variant="ghost"
                  size="2xs"
                  minH="0"
                  h="20px"
                  w="20px"
                  minW="0"
                  p="0"
                  disabled={disabled}
                  onClick={onOpenNewBatch}
                >
                  <Icon as={FiPlus} boxSize="16px" color="primaryMain" />
                </IconButton>
              }
            />
          )}
        />

        <Controller
          name={`animals.${index}.weight`}
          control={control}
          render={({ field, fieldState }) => (
            <NumberInput
              name={field.name}
              label={animalText.weight}
              allowDot
              decimalPlaces={2}
              min={0}
              value={field.value ?? null}
              onValueChange={(nextValue) => field.onChange(nextValue)}
              error={fieldState.error?.message}
              isRequired
              disabled={disabled}
            />
          )}
        />

        <Controller
          name={`animals.${index}.value`}
          control={control}
          render={({ field, fieldState }) => (
            <MoneyInput
              name={field.name}
              label={animalText.value}
              value={field.value ?? null}
              onValueChange={(nextValue) => field.onChange(nextValue)}
              error={fieldState.error?.message}
              isRequired
              disabled={disabled}
            />
          )}
        />

        {/* PROC-R3-02 (Rota B, ALVO A) — "Estágio Reprodutivo" REAL do
            legado: `category_matrice_id`, lista dinâmica de
            `category_matrices` (Lactação/Multípara/…). Sempre renderizado
            (ALVO A: "sem @if por sexo" no legado); round-5 (correção do
            dono) — OBRIGATÓRIO quando a categoria é FÊMEA
            (`is_reproductive===true`). */}
        <Controller
          name={`animals.${index}.category_matrice_uuid`}
          control={control}
          render={({ field, fieldState }) => (
            <SelectAsyncPaginate
              name={field.name}
              label={animalText.categoryMatrice}
              service={listActiveCategoryMatrices}
              mapOptions={(item: CategoryMatrixOptionItem) => ({
                label: item.label,
                value: item.uuid,
              })}
              findParams={(search: string | { search: string }) => ({
                search: typeof search === 'string' ? search : search.search,
              })}
              value={field.value ?? null}
              onChange={(option: any) => {
                field.onChange(option ?? null);
                // PROC-08 — propaga para as linhas SEGUINTES ainda vazias
                // (mirror `_card_animal.blade.php:179-263`,
                // `handleCategoryMatrice`).
                propagateToEmptyRows(
                  getValues,
                  setValue,
                  fieldsLength,
                  index,
                  'category_matrice_uuid',
                  option ?? null
                );
              }}
              error={fieldState.error?.message}
              isRequired={!!categoryIsReproductive}
              isDisabled={disabled}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          )}
        />

        {/* ---- PROCFID-02 (§3.5) — campos novos do legado ---- */}
        <InputReadOnly
          label={animalText.lastWeight}
          value={formatLastWeight(lastWeighing?.weight ?? null)}
        />

        <Controller
          name={`animals.${index}.birth_date`}
          control={control}
          render={({ field, fieldState }) => (
            <Field label={animalText.birthDate} errorText={fieldState.error?.message}>
              <DateInput
                value={field.value ?? null}
                onChange={field.onChange}
                disabled={disabled}
              />
            </Field>
          )}
        />

        <Controller
          name={`animals.${index}.has_ultrasound`}
          control={control}
          render={({ field }) => (
            <Select
              name={field.name}
              label={animalText.hasUltrasound}
              value={booleanOptions.find((option) => option.value === !!field.value) ?? null}
              onChange={(option: Option<boolean> | null) => {
                const nextValue = !!option?.value;
                field.onChange(nextValue);
                // Ao desligar, limpa AOL/EGS/MARM/Classe — evita dado órfão
                // no payload (mesmo gesto de `arroba_value`/`is_stock`).
                if (!nextValue) {
                  setValue(`animals.${index}.aol`, null, { shouldDirty: true });
                  setValue(`animals.${index}.egs`, null, { shouldDirty: true });
                  setValue(`animals.${index}.marm`, null, { shouldDirty: true });
                  setValue(`animals.${index}.classification`, null, { shouldDirty: true });
                }
              }}
              options={booleanOptions}
              isDisabled={disabled}
              noClearable
            />
          )}
        />

        {watchedHasUltrasound && (
          <>
            <Controller
              name={`animals.${index}.aol`}
              control={control}
              render={({ field, fieldState }) => (
                <NumberInput
                  name={field.name}
                  label={animalText.aol}
                  allowDot
                  decimalPlaces={2}
                  value={field.value ?? null}
                  onValueChange={(nextValue) => field.onChange(nextValue)}
                  error={fieldState.error?.message}
                  isRequired
                  disabled={disabled}
                />
              )}
            />

            <Controller
              name={`animals.${index}.egs`}
              control={control}
              render={({ field, fieldState }) => (
                <NumberInput
                  name={field.name}
                  label={animalText.egs}
                  allowDot
                  decimalPlaces={2}
                  value={field.value ?? null}
                  onValueChange={(nextValue) => field.onChange(nextValue)}
                  error={fieldState.error?.message}
                  isRequired
                  disabled={disabled}
                />
              )}
            />

            <Controller
              name={`animals.${index}.marm`}
              control={control}
              render={({ field, fieldState }) => (
                <NumberInput
                  name={field.name}
                  label={animalText.marm}
                  allowDot
                  decimalPlaces={2}
                  value={field.value ?? null}
                  onValueChange={(nextValue) => field.onChange(nextValue)}
                  error={fieldState.error?.message}
                  isRequired
                  disabled={disabled}
                />
              )}
            />

            <Controller
              name={`animals.${index}.classification`}
              control={control}
              render={({ field, fieldState }) => (
                <Input
                  name={field.name}
                  label={animalText.classification}
                  maxLength={1}
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                  isRequired
                  disabled={disabled}
                />
              )}
            />
          </>
        )}
      </SimpleGrid>

      <ProcessingAnimalIdentificationsSection
        control={control}
        setValue={setValue}
        getValues={getValues}
        animalIndex={index}
        animalsCount={fieldsLength}
        originType={originType}
        disabled={disabled}
        languageGB={languageGB}
        arrayError={identificationsArrayError}
      />

      {/* 97-Esteiras/041, TASK-FE-041-LF-03 — 2 diálogos ADITIVOS, sem rota
          própria (montados no card, mesmo padrão de `DeleteConfirmDialog`
          usado por outras telas do wizard). */}
      <NewBatchModal
        isOpen={isNewBatchOpen}
        onClose={onCloseNewBatch}
        onCreated={handleBatchCreated}
      />
      {/* TASK-063-PROC-QA3-07 — usa o SNAPSHOT capturado antes da
          desseleção (`batchWithoutAreaContext`), NÃO `watchedBatchUuid`
          (já nulo neste ponto — mirror do `.then()` do legado). */}
      <ChangeBatchModuleAreaModal
        isOpen={isModuleAreaOpen}
        onClose={() => {
          onCloseModuleArea();
          setBatchWithoutAreaContext(null);
        }}
        batchUuid={batchWithoutAreaContext?.uuid ?? null}
        batchLabel={batchWithoutAreaContext?.label ?? ''}
        totalAnimals={batchWithoutAreaContext?.totalAnimals ?? 0}
        currentFarmUuid={currentFarm?.uuid}
        onChanged={handleModuleAreaChanged}
      />
      {/* TASK-063-PROC-QA3-07 — aviso "Atenção", exibido ANTES da
          transferência (mirror `swal()` do legado, tone `warning` +
          `hideQuestionMark` = mesma variante informativa de
          `FinishProcessing.tsx:644-655`). */}
      <DeleteConfirmDialog
        isOpen={isBatchWithoutAreaWarningOpen}
        onClose={onCloseBatchWithoutAreaWarning}
        onConfirm={handleConfirmBatchWithoutAreaWarning}
        tone="warning"
        colorPalette="orange"
        title={batchWithoutAreaWarningText.title}
        description={batchWithoutAreaWarningText.description}
        confirmButtonText={batchWithoutAreaWarningText.confirmButton}
        hideQuestionMark
        warningText=""
      />
    </Box>
  );
}
