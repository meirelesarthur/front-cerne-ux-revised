// src/pages/Operacional/BatchTransfers/CreateBatchTransfer/index.tsx
// -----------------------------------------------------------------------------
// Tela de CRIAÇÃO da Transferência Animais/Lote (BatchTransfer, `426be835`,
// TASK-LOTE-FE-02, contrato §6). Mirror ESTRUTURAL direto de
// `CadastrosBase/Batches/CreateOrUpdateBatch/index.tsx` — mesmos cards por
// categoria, mesmo `CheckboxListField`, mesmo bloco de totais somado no
// cliente, mesmo endpoint `candidate-animals` (serviço reaproveitado, nunca
// duplicado).
//
// Rota `/operacional/transferencia-animais-lote/novo` (guard `allOf`
// `transference_animal_batch`+`batch_view`, default `GAP-LOTE-FE-05`,
// registrada em `src/router/index.tsx`). **Modo create apenas** — não há
// edição (a rota web legada é `->only(['index','create','store'])`).
//
// 🔴 Só 3 campos vão para a API: `date`, `batch_id` (destino) e `animals[]`.
// `code`/`user_id`/`farm_id`/`employee_id` NUNCA são enviados (contrato §6.1).
//
// 🔴 GAP-LOTE-FE-03 (validação de data do lote de ORIGEM) NÃO implementado —
// sem endpoint migrado, sem substituto, sem silenciamento (bloqueio
// deliberado, ver Tarefa 27 "Leitura do dev"). `check-date-batch` (data do
// lote de DESTINO) também NÃO implementado — defeito preservado AS-IS
// (`GAP-LOTE-05`, DEC-027).
//
// 🔴 Gate de pesagem: SEM pré-checagem client-side (`check-weighing` não
// existe no fork) — a UI só exibe o 422 do servidor via o `onError`
// automático do `useRequest` (contrato §6.7). NÃO bloqueia o submit.
//
// 🟡 Aviso ANTECIPADO de pesagem (melhoria de UX aprovada pelo dono,
// DEC-027 preservada — a regra em si não muda): abaixo do picker de
// animais, um `Alert` `warning` não-bloqueante avisa que algum animal
// selecionado PODE não ter pesagem para a data escolhida. GENÉRICO de
// propósito — `candidate-animals` (`CandidateAnimalResource`) não expõe
// `grazing`/`control_productivity` nem última pesagem por animal
// (confirmado direto em `AnimalRepository::listCandidatesForBatch()`, que
// só seleciona `id/uuid/weight/quantity/category_id`); sem esse dado não
// há como apontar QUAIS animais faltam pesagem, nem contá-los — reproduzir
// a checagem individual no cliente exigiria um endpoint que não existe
// (mesma família de `GAP-LOTE-FE-04`). Registrado como achado objetivo,
// não inventado.
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Alert, Box, Flex, Skeleton, SimpleGrid, Text } from '@chakra-ui/react';
import { format } from 'date-fns';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { CheckboxListField } from '@/components/Form/CheckboxListField';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { Select } from '@/components/Form/Select';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useRequest } from '@/hooks/useRequest';

import customToast from '@/utils/custom-toast';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { batchTransferSchemaResolver } from '@/validations/schemas/BatchTransfers/batch-transfer-schema';

import { createBatchTransfer } from '@/services/v2/BatchTransfers/batch-transfer-service';

import type { Option } from '@/@types/option';
import type { Response } from '@/@types/response-api';
import type { BatchCategoryRef } from '@/@types/v2/Batches';
import type { BatchTransferResult, CreateBatchTransferRequest } from '@/@types/v2/BatchTransfers';

import { useBatchTransferCreateOptions, useEligibleCandidateAnimals } from '../useBatchTransfers';

// Forma INTERNA do form — `batch_filter_uuid`/`category_uuids` são filtros
// do PICKER (nunca enviados no payload); `new_batch_uuid` é o Lote de
// DESTINO real (`batch_id`); `animal_uuids` é a union PLANA de uuids
// marcados em TODOS os cards.
interface BatchTransferFormValues {
  date: string | null;
  batch_filter_uuid: Option<string> | null;
  category_uuids: Option<string>[];
  new_batch_uuid: Option<string> | null;
  animal_uuids: string[];
}

const emptyFormValues: BatchTransferFormValues = {
  date: format(new Date(), 'yyyy-MM-dd'),
  batch_filter_uuid: null,
  category_uuids: [],
  new_batch_uuid: null,
  animal_uuids: [],
};

export default function CreateBatchTransfer() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const text = languageGB.batchTransfers.batchTransfer;

  const {
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { dirtyFields },
  } = useForm<BatchTransferFormValues>({
    mode: 'onChange',
    resolver: batchTransferSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: emptyFormValues,
  });

  const createOptionsQuery = useBatchTransferCreateOptions();
  const isLoadingOptions = createOptionsQuery.isLoading;
  const batchOptions: Option<string>[] = (createOptionsQuery.data?.batches ?? []).map((batch) => ({
    label: batch.description,
    value: batch.uuid,
  }));
  const categoryOptions: Option<string>[] = (createOptionsQuery.data?.categories ?? []).map(
    (category) => ({ label: category.description, value: category.uuid })
  );

  // "Responsável" — usuário autenticado da sessão (`useAuth()`), NUNCA de
  // `create-options` (que não devolve `user`, ver §4.2/§6.2 do contrato).
  const responsibleName = user?.username ?? '';

  const watchedBatchFilter = useWatch({ control, name: 'batch_filter_uuid' });
  const watchedCategories = useWatch({ control, name: 'category_uuids' }) ?? [];
  const selectedCategoryUuids = watchedCategories.map((category) => category.value);
  const watchedAnimalUuids = useWatch({ control, name: 'animal_uuids' }) ?? [];

  // Faixa de peso — filtro CLIENT-SIDE puro (`GAP-LOTE-FE-02`, default), o
  // endpoint `candidate-animals` não aceita `min_weight`/`max_weight`.
  const [minWeight, setMinWeight] = useState<number | null>(null);
  const [maxWeight, setMaxWeight] = useState<number | null>(null);

  // `onValueChange` do `MoneyInput` dispara a CADA dígito digitado (entrega o
  // número puro em todo `onChange` do input nativo) — por isso a validação
  // cruzada min<max NÃO pode rodar aqui: validar a cada tecla reseta o campo
  // para `null` no meio da digitação (ex.: o "5" de "500" fica
  // momentaneamente menor que o mínimo já setado). Aqui só atualiza o estado
  // local; a validação cruzada roda no `onBlur` (ver
  // `handleMinWeightBlur`/`handleMaxWeightBlur`).
  function handleMinWeightChange(value: number) {
    setMinWeight(value > 0 ? value : null);
  }

  function handleMaxWeightChange(value: number) {
    setMaxWeight(value > 0 ? value : null);
  }

  // Validação cruzada (min não pode ser > max e vice-versa) — só ao SAIR do
  // campo, preservando o comportamento de negócio original sem interromper
  // a digitação.
  function handleMinWeightBlur() {
    if (minWeight !== null && maxWeight !== null && minWeight > maxWeight) {
      toaster.create(
        customToast({ status: 'warning', description: text.form.warnings.minWeightGreaterThanMax })
      );
      setMinWeight(null);
    }
  }

  function handleMaxWeightBlur() {
    if (maxWeight !== null && minWeight !== null && maxWeight < minWeight) {
      toaster.create(
        customToast({ status: 'warning', description: text.form.warnings.maxWeightLessThanMin })
      );
      setMaxWeight(null);
    }
  }

  // Busca dentro de CADA card — client-side puro, mirror `CreateOrUpdateBatch`.
  const [cardSearch, setCardSearch] = useState<Record<string, string>>({});

  // Fonte ÚNICA dos candidatos (contrato §6.3) — 🔴 `batch_uuid` OU
  // `category_uuids`, NUNCA `without_batch` (ver `useEligibleCandidateAnimals`,
  // que reaproveita o SERVIÇO `listBatchCandidateAnimals`, não o hook de
  // Lote). Ativa só quando Lote OU Categoria(s) foram escolhidos.
  const candidatesQuery = useEligibleCandidateAnimals({
    batchUuid: watchedBatchFilter?.value,
    categoryUuids: selectedCategoryUuids,
  });
  const candidates = candidatesQuery.data ?? [];
  const hasActiveFilter = !!watchedBatchFilter || selectedCategoryUuids.length > 0;

  // Cards derivados dos candidatos JÁ carregados (nunca das opções do
  // Select) — cobre os dois modos (Lote OU Categoria) com a MESMA lógica:
  // agrupar por `category.uuid` (contrato §6.3, achado 1).
  const cardCategories: BatchCategoryRef[] = [];
  const seenCategoryUuids = new Set<string>();
  candidates.forEach((candidate) => {
    if (!seenCategoryUuids.has(candidate.category.uuid)) {
      seenCategoryUuids.add(candidate.category.uuid);
      cardCategories.push(candidate.category);
    }
  });
  cardCategories.sort((a, b) => a.description.localeCompare(b.description));

  // Rodapé — 5 índices (contrato §6.4), 100% CLIENT-SIDE sobre os candidatos
  // SELECIONADOS (nunca sobre a lista filtrada por peso — a seleção
  // persiste mesmo se um item selecionado saísse da faixa de peso visível).
  // `SUM(ua)` cru, NUNCA `/450` — `ua` já vem pronto por animal do backend.
  const selectedCandidates = candidates.filter((candidate) =>
    watchedAnimalUuids.includes(candidate.uuid)
  );
  const totalAnimals = selectedCandidates.reduce((sum, candidate) => sum + candidate.quantity, 0);
  const totalWeight = selectedCandidates.reduce((sum, candidate) => sum + candidate.weight, 0);
  const totalUa = selectedCandidates.reduce((sum, candidate) => sum + candidate.ua, 0);
  const averageWeight = totalAnimals > 0 ? totalWeight / totalAnimals : 0;
  const averageUa = totalAnimals > 0 ? totalUa / totalAnimals : 0;

  const batchTransferMutation = useRequest({
    asyncFunction: tryPersistBatchTransfer,
    entityName: text.singularLabel,
    queryKey: queryKey.batchTransfers.eligibleAnimals,
    queryKey2: queryKey.batchTransfers.createOptions,
    typesRequest: 'create',
    personalizedMessage: text.form.toasts.success,
    actionSuccess: () => {
      navigate('/operacional/transferencia-animais-lote');
    },
  });

  // Payload REAL — só `date`/`batch_id`/`animals[]` (contrato §6.1). 422 do
  // servidor (inclusive o gate de pesagem, §6.7) é exibido pelo `onError`
  // automático do `useRequest` — SEM pré-checagem client-side aqui.
  async function tryPersistBatchTransfer(
    data: BatchTransferFormValues
  ): Promise<Response<BatchTransferResult>> {
    const payload: CreateBatchTransferRequest = {
      date: data.date as string,
      batch_id: data.new_batch_uuid!.value,
      animals: data.animal_uuids,
    };

    try {
      return await createBatchTransfer(payload);
    } catch (error: any) {
      // 422 mapeado por campo (contrato §6.6, mirror `CreateOrUpdateBatch`)
      // — traduz os nomes REAIS de `AnimalBatchTransferRequest::rules()`
      // (`date`/`batch_id`) para os campos internos do form. O gate de
      // pesagem (§6.7) não é erro de campo — chega só como `message`, que o
      // `onError` automático do `useRequest` já exibe via toast.
      if (error?.response?.status === 422) {
        const fieldErrors = error.response.data?.errors as Record<string, string[]> | undefined;
        const backendToFormField: Record<string, keyof BatchTransferFormValues> = {
          date: 'date',
          batch_id: 'new_batch_uuid',
        };
        Object.entries(fieldErrors ?? {}).forEach(([field, messages]) => {
          const formField = backendToFormField[field];
          if (formField && messages?.[0]) {
            setError(formField, { type: 'server', message: messages[0] });
          }
        });
      }
      throw error;
    }
  }

  // Validação client-side mínima e fiel (contrato §6.6) — "pelo menos 1
  // animal" é checada AQUI (fora do schema Yup) porque precisa bloquear
  // ANTES de qualquer request, com a mensagem exata do legado.
  async function onSubmit(data: BatchTransferFormValues) {
    if ((data.animal_uuids?.length ?? 0) === 0) {
      toaster.create(
        customToast({ status: 'warning', description: text.form.validation.atLeastOneAnimal })
      );
      return;
    }
    await batchTransferMutation.mutateAsync(data);
  }

  const isSubmitting = batchTransferMutation.isPending;

  return (
    <FormContainer
      title={text.form.title.create}
      subtitle={text.form.subtitle.create}
      footer={
        <>
          <Button
            title={languageGB.defaltStrings?.cancel || 'Cancelar'}
            variant="outline"
            type="button"
            onClick={() => navigate(-1)}
          />
          <ButtonSaveAndNext
            create
            dirtyFields={dirtyFields}
            type="button"
            onClick={handleSubmit(onSubmit)}
            languageGB={languageGB}
            loading={isSubmitting}
            disabled={isSubmitting}
          />
        </>
      }
    >
      <Form noPadding onSubmit={handleSubmit(onSubmit)}>
        <SimpleGrid columns={columnsForm.default} gap={6}>
          <Skeleton loading={isLoadingOptions} borderRadius="md">
            <InputReadOnly
              label={text.form.fields.code}
              value={createOptionsQuery.data?.next_code ?? ''}
            />
          </Skeleton>

          <Skeleton loading={isLoadingOptions} borderRadius="md">
            <Controller
              name="date"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <DateInput
                  label={text.form.fields.date}
                  value={field.value}
                  onChange={(value) => field.onChange(value)}
                  isRequired
                  error={error?.message}
                />
              )}
            />
          </Skeleton>

          <Skeleton loading={isLoadingOptions} borderRadius="md">
            <InputReadOnly label={text.form.fields.user} value={responsibleName} />
          </Skeleton>

          <Skeleton loading={isLoadingOptions} borderRadius="md">
            <Controller
              name="batch_filter_uuid"
              control={control}
              render={({ field }) => (
                <Select
                  name={field.name}
                  label={text.form.fields.batchFilter}
                  placeholder={text.form.placeholders.batchFilter}
                  options={batchOptions}
                  value={field.value}
                  isDisabled={selectedCategoryUuids.length > 0}
                  onChange={(option: Option<string> | null) => {
                    field.onChange(option ?? null);
                    if (option) {
                      setValue('category_uuids', [], { shouldDirty: true });
                    }
                    setValue('animal_uuids', [], { shouldDirty: true });
                  }}
                  loading={isLoadingOptions}
                />
              )}
            />
          </Skeleton>

          <Skeleton loading={isLoadingOptions} borderRadius="md">
            <Controller
              name="category_uuids"
              control={control}
              render={({ field }) => (
                <Select
                  name={field.name}
                  label={text.form.fields.category}
                  placeholder={text.form.placeholders.category}
                  options={categoryOptions}
                  value={field.value}
                  multiple
                  isDisabled={!!watchedBatchFilter}
                  onChange={(options: Option<string>[] | null) => {
                    const newOptions = options ?? [];
                    field.onChange(newOptions);
                    if (newOptions.length > 0) {
                      setValue('batch_filter_uuid', null, { shouldDirty: true });
                    }
                    setValue('animal_uuids', [], { shouldDirty: true });
                  }}
                  loading={isLoadingOptions}
                />
              )}
            />
          </Skeleton>

          <Skeleton loading={isLoadingOptions} borderRadius="md">
            <MoneyInput
              name="min_weight"
              label={text.form.fields.minWeight}
              placeholder={text.form.placeholders.minWeight}
              value={minWeight}
              onValueChange={handleMinWeightChange}
              onBlur={handleMinWeightBlur}
            />
          </Skeleton>

          <Skeleton loading={isLoadingOptions} borderRadius="md">
            <MoneyInput
              name="max_weight"
              label={text.form.fields.maxWeight}
              placeholder={text.form.placeholders.maxWeight}
              value={maxWeight}
              onValueChange={handleMaxWeightChange}
              onBlur={handleMaxWeightBlur}
            />
          </Skeleton>

          <Skeleton loading={isLoadingOptions} borderRadius="md">
            <Controller
              name="new_batch_uuid"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <Select
                  name={field.name}
                  label={text.form.fields.newBatch}
                  placeholder={text.form.placeholders.newBatch}
                  options={batchOptions}
                  value={field.value}
                  onChange={(option: Option<string> | null) => field.onChange(option ?? null)}
                  error={error?.message}
                  isRequired
                  loading={isLoadingOptions}
                />
              )}
            />
          </Skeleton>

          {/* Picker de animais por categoria (contrato §6.3) — 1 card por
              categoria presente nos candidatos JÁ carregados. */}
          {hasActiveFilter && cardCategories.length > 0 && (
            <Controller
              name="animal_uuids"
              control={control}
              render={({ field }) => (
                <Flex direction="column" gap={4} gridColumn="1 / -1">
                  {cardCategories.map((category) => {
                    // Universo COMPLETO da categoria (sem filtro de peso) —
                    // usado para a seleção/merge entre cards, mirror
                    // `CreateOrUpdateBatch` (a busca por card também não
                    // reduz este universo, só os `visibleItems`).
                    const categoryCandidates = candidates.filter(
                      (candidate) => candidate.category.uuid === category.uuid
                    );
                    const categoryCandidateUuids = categoryCandidates.map(
                      (candidate) => candidate.uuid
                    );
                    const cardSelectedValues = (field.value ?? []).filter((uuid) =>
                      categoryCandidateUuids.includes(uuid)
                    );

                    const searchText = (cardSearch[category.uuid] ?? '').toLowerCase();
                    const visibleItems = categoryCandidates
                      .filter((candidate) => {
                        if (minWeight !== null && candidate.weight < minWeight) return false;
                        if (maxWeight !== null && candidate.weight > maxWeight) return false;
                        return candidate.identification.toLowerCase().includes(searchText);
                      })
                      .map((candidate) => ({
                        value: candidate.uuid,
                        label: candidate.identification,
                      }));

                    // "Total Animais: N" = SUM(quantity) dos SELECIONADOS
                    // deste card — nunca a contagem de linhas.
                    const totalAnimalsCard = categoryCandidates
                      .filter((candidate) => cardSelectedValues.includes(candidate.uuid))
                      .reduce((sum, candidate) => sum + candidate.quantity, 0);

                    return (
                      <Box key={category.uuid}>
                        <CheckboxListField
                          label={category.description}
                          items={visibleItems}
                          selectedValues={cardSelectedValues}
                          onChange={(newCardValues) => {
                            const otherCardsSelection = (field.value ?? []).filter(
                              (uuid) => !categoryCandidateUuids.includes(uuid)
                            );
                            field.onChange([...otherCardsSelection, ...newCardValues]);
                          }}
                          searchValue={cardSearch[category.uuid] ?? ''}
                          onSearchChange={(value) =>
                            setCardSearch((previous) => ({ ...previous, [category.uuid]: value }))
                          }
                          searchPlaceholder={text.form.candidateAnimals.searchPlaceholder}
                          selectAllLabel={`${text.form.candidateAnimals.selectAllLabel} — ${category.description}`}
                          deselectAllLabel={`${text.form.candidateAnimals.deselectAllLabel} — ${category.description}`}
                          selectedCountLabel={text.form.candidateAnimals.totalAnimalsLabel}
                          selectedCountOverride={totalAnimalsCard}
                          emptyLabel={text.form.candidateAnimals.emptyLabelCategory}
                          isLoading={candidatesQuery.isLoading}
                          isError={candidatesQuery.isError}
                          errorLabel={text.form.candidateAnimals.errorLabel}
                          onRetry={() => candidatesQuery.refetch()}
                          retryLabel={text.form.candidateAnimals.retryLabel}
                        />
                      </Box>
                    );
                  })}
                </Flex>
              )}
            />
          )}

          {/* Estado de ERRO distinto do estado vazio — a query falhar
              (403/422/rede) NÃO pode cair no mesmo texto de "nenhum animal
              encontrado" (mascararia o erro real do dono, achado objetivo).
              Mirror do bloco `isError` da listagem (`BatchTransfers/index.tsx`),
              reaproveitando os labels já existentes de `candidateAnimals`
              (mesmos usados no `CheckboxListField` acima, que nunca chegam a
              renderizar aqui porque sem candidatos não há card algum). */}
          {hasActiveFilter && candidatesQuery.isError && (
            <Alert.Root status="error" borderRadius="md" gridColumn="1 / -1">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>{text.form.candidateAnimals.errorLabel}</Alert.Title>
              </Alert.Content>
              <Button
                variant="outline"
                title={text.form.candidateAnimals.retryLabel}
                onClick={() => candidatesQuery.refetch()}
              />
            </Alert.Root>
          )}

          {hasActiveFilter && candidatesQuery.isLoading && cardCategories.length === 0 && (
            <Skeleton height="140px" borderRadius="md" gridColumn="1 / -1" />
          )}

          {hasActiveFilter &&
            !candidatesQuery.isLoading &&
            !candidatesQuery.isError &&
            cardCategories.length === 0 && (
              <Text gridColumn="1 / -1" fontSize="sm" color="fg.muted">
                {watchedBatchFilter
                  ? text.form.candidateAnimals.emptyLabelBatch
                  : text.form.candidateAnimals.emptyLabelCategory}
              </Text>
            )}

          {/* Bloco dos 5 totais (contrato §6.4) — SOMENTE quando há filtro
              ativo (senão não há candidato carregado nenhum) e a query não
              falhou (senão exibiria "0" como se fosse dado real, mascarando
              o erro do mesmo jeito). */}
          {hasActiveFilter && !candidatesQuery.isError && (
            <SimpleGrid
              columns={{ base: 1, sm: 2, lg: 5 }}
              gap={4}
              gridColumn="1 / -1"
              paddingTop={2}
              borderTop="1px solid"
              borderColor="borderGrid"
            >
              <InputReadOnly
                label={text.form.footer.total}
                value={String(totalAnimals)}
                loading={candidatesQuery.isLoading}
              />
              <InputReadOnly
                label={text.form.footer.weight}
                value={totalWeight.toFixed(2)}
                loading={candidatesQuery.isLoading}
              />
              <InputReadOnly
                label={text.form.footer.averageWeight}
                value={averageWeight.toFixed(2)}
                loading={candidatesQuery.isLoading}
              />
              <InputReadOnly
                label={text.form.footer.totalUa}
                value={totalUa.toFixed(2)}
                loading={candidatesQuery.isLoading}
              />
              <InputReadOnly
                label={text.form.footer.averageUa}
                value={averageUa.toFixed(2)}
                loading={candidatesQuery.isLoading}
              />
            </SimpleGrid>
          )}

          {/* Aviso ANTECIPADO de pesagem — não-bloqueante, abaixo da
              seleção de animais e acima do botão de salvar (footer do
              `FormContainer`). Só quando há animal selecionado; genérico
              de propósito, ver nota de cabeçalho ("Aviso ANTECIPADO de
              pesagem"). A validação real permanece o 422 do servidor. */}
          {hasActiveFilter && !candidatesQuery.isError && watchedAnimalUuids.length > 0 && (
            <Alert.Root status="warning" borderRadius="md" gridColumn="1 / -1">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>{text.form.warnings.weighingWarning}</Alert.Title>
              </Alert.Content>
            </Alert.Root>
          )}
        </SimpleGrid>
      </Form>
    </FormContainer>
  );
}
