// src/pages/Operacional/Reproducao/Acasalamento/AcasalamentoProximaEtapa.tsx
// -----------------------------------------------------------------------------
// Tela de página inteira `bm-flow-iatf-next-step` / `bm-action-iatf-store`
// (BreedingMating, F-016, 97-Esteiras/001, TASK-BM-FE-06, contrato de tela
// §6.5). Rotas `/operacional/acasalamento/:breedingMatingUuid/proxima-etapa`
// (+ `?modo=individual`), gate `breeding-matings_edit` (wiring da rota é da
// TASK-BM-FE-09 — este arquivo só declara os nomes de param/query esperados).
//
// `?modo=individual` (PT-BR, nome da rota) → `mode=individual` na REQUEST
// (tradução já feita por `getBreedingMatingNextStepContext`, TASK-BM-FE-04) —
// esta tela só lê `searchParams.get('modo')` e repassa o boolean; o SERVIDOR
// decide o que muda no contexto retornado (`EP-BM-09`) — o front não infere
// diferença própria entre os dois modos (contrato de tela §6.5/regra 12).
//
// Casca `FormContainer` com `footer` (`Cancelar` + `Salvar`), `<Form
// id="proxima-etapa-form">` + `<Button type="submit"
// form="proxima-etapa-form">` no rodapé (regra 7 da Tarefa,
// get_pwa_form_query_pattern). `Código`/`Data`/`Funcionário Responsável`/
// `Estação de Monta`/`Tipo de Reprodução`/`Lote de Reprodução` são só
// LEITURA (`DisplayFieldGroup`, nunca `Input isReadOnly`) — todos vêm de
// `EP-BM-02` (`detail`, TASK-BM-FE-16/GAP-FE-BM-12, mirror
// `_forms_next_step.blade.php:1-27`); `Estação de Monta`/`Lote de
// Reprodução` renderizam vazios até `GAP-FE-BM-11` corrigir a chave do
// backend (mesmo estado hoje de `AcasalamentoDetalhe.tsx`). `Touro/Sêmen/
// Embrião` e `Protocolo` (nome) ficam de fora — sem fonte no backend hoje
// (`GAP-FE-BM-04`, ampliado). A identificação/data da etapa
// (`nextStepContext.identification`/`.identification_date`, `EP-BM-09`) NÃO
// é mais campo de cabeçalho — é o TÍTULO da seção de linhas (mirror
// `_card_protocol_identification.blade.php:4-8`, GAP-FE-BM-12). **Sem**
// seção Natural e **sem** Simplificado — só as linhas de Protocolo, reusando
// `ProtocolRow` (Tarefa 05) + `ProtocolTotalizer` (Tarefa 05), alimentados por
// `protocol_items`/`bull_seed_season.products` (UT-000705).
//
// GAP-FE-BM-10 (`04-Gaps_Frontend_UI/`, corrigido pela TASK-BM-FE-15):
// `EP-BM-09` nunca devolveu `animals` (linhas já hidratadas) — o shape real é
// `{mode, identification, identification_date, eligible_animals, products,
// bull_seed_season, transfer_batches}`. `protocol_animals` é SEMEADO a partir
// de `eligible_animals` (matéria-prima, 1 linha nova por animal elegível da
// identificação atual, Animal pré-selecionado, demais campos em
// branco/padrão, mirror `_card_animals_protocol.blade.php`). O botão "+
// Adicionar" (mirror `ProtocolSection.handleAdd`, `buildDefaultProtocolAnimalRow`)
// é paridade RECUPERADA com o legado (`_card_protocol_identification.blade.php:38-42`,
// renderizado incondicionalmente) — a antiga ASSUNÇÃO DOCUMENTADA que omitia
// o botão se confirmou divergente e foi removida.
//
// GAP-FE-BM-17/TASK-BM-FE-22 (`GAP-BM-19`/`TASK-BM-19` no backend): até aqui,
// `mode=individual` não ramificava NADA — a tela renderizava as mesmas N
// linhas pré-semeadas do modo normal, 100% idêntico ao legado que na
// verdade renderiza exatamente 1 linha EM BRANCO (`matingAnimal=null`,
// `_card_protocol_identification.blade.php:13,23-25`) para seleção manual
// de 1 animal, sem afetar o resto do lote. Corrigido cross-layer: o
// servidor agora devolve `eligible_animals: []` em modo individual (sinal
// explícito de "não semear") + campo NOVO `protocol_animal_options`
// (pool completo do histórico de `matingProtocolAnimals`, sem recorte de
// elegibilidade/identificação atual, mirror `_card_animals_protocol.blade.php:9-15`,
// preenchido nos DOIS modos). `fillNextStepForm` ramifica por
// `data.eligible_animals` vazio + `data.mode === 'individual'` (nunca por
// inferência própria do front — regra já escrita acima) e o `<select>` de
// Animal da linha passa a consumir `protocol_animal_options` em vez de
// `eligibleAnimals` (`useBreedingBatchAnimalsCascade`) quando em modo
// individual. Modo normal intocado.
//
// ⚠️ Mapper LOCAL `mapRowFormValueToPayload` duplica DELIBERADAMENTE, em
// escopo mínimo, a lógica da função privada homônima de
// `acasalamento-form-mapper.ts` (`mapProtocolAnimalFormValueToPayload`, não
// exportada). A Tarefa 06 lista `useAcasalamentos.tsx` como o único arquivo
// ALTERADO desta fatia — exportar a função privada do mapper expandiria esse
// escopo declarado; a duplicação abaixo é mínima (1 função pura) e
// documentada aqui para qualquer ajuste futuro nesse mapper ser replicado
// neste arquivo também.
// -----------------------------------------------------------------------------

import { ElementType, useEffect, useMemo, useState } from 'react';

import { Box, EmptyState, Flex, Icon, Text, VStack } from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useFieldArray, useForm } from 'react-hook-form';
import { FiAlertTriangle, FiArrowLeft, FiPlus, FiRefreshCw } from 'react-icons/fi';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { DisplayFieldGroup } from '@/components/DisplayFieldGroup';
import { Form } from '@/components/Form';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';
import formatDate from '@/utils/formatDate';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { queryKey } from '@/constants/query-key';

import {
  getBreedingMatingEditContext,
  storeBreedingMatingNextStep,
} from '@/services/v2/BreedingMating/breeding-mating-service';

import type { Option } from '@/@types/option';
import type {
  AnimalOptionRef,
  BreedingMatingForm as BreedingMatingFormType,
  BreedingMatingNextStepContext,
  BreedingMatingProtocolAnimalFormValue,
  CreateOrUpdateBreedingMatingProtocolAnimalPayload,
  EntityOptionRef,
  StoreBreedingMatingNextStepRequest,
} from '@/@types/v2/BreedingMating';

import {
  buildDefaultAcasalamentoFormValues,
  buildDefaultProtocolAnimalRow,
} from './acasalamento-form-mapper';
import {
  buildProtocolProductOptions,
  buildSeedProductOptions,
  selectProtocolItemsForIdentification,
} from './acasalamento-protocol-products';
import {
  BatchTransferDialog,
  useTransferBatchOptions,
  type BatchTransferAnimalRef,
} from './BatchTransferDialog';
import { ProtocolRow } from './sections/ProtocolRow';
import { ProtocolTotalizer } from './sections/ProtocolTotalizer';
import {
  useAcasalamentoDetalhe,
  useAcasalamentoProximaEtapa,
  useBreedingBatchAnimalsCascade,
} from './useAcasalamentos';

const ACASALAMENTO_LIST_ROUTE = '/operacional/acasalamento';

function mapEntityOptionRefToOption(ref: EntityOptionRef): Option<string> {
  return { label: ref.label, value: ref.uuid };
}

// GAP-FE-BM-17/TASK-BM-FE-22 — adapta `protocol_animal_options` (`EntityOptionRef`,
// campo `label`) para o shape exigido pela prop `eligibleAnimals` de `ProtocolRow`
// (`AnimalOptionRef[]`, campo `code` — mesmo semântico de "identificação do animal" em
// outra camada). `ProtocolRow.tsx` é proibido de tocar nesta Tarefa; a adaptação vive
// aqui, sem lógica nova além do reshape de campo.
function mapProtocolAnimalOptionToAnimalOptionRef(ref: EntityOptionRef): AnimalOptionRef {
  return { uuid: ref.uuid, code: ref.label };
}

function currentTimeHHmm(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

// Mirror `_card_protocol_identification.blade.php` (branch sem linhas salvas para a
// identificação de destino — único caminho que `EP-BM-09` implementa hoje): 1 linha nova por
// animal elegível da identificação ATUAL. Animal pré-selecionado; `eligible=true` e demais
// campos em branco vêm de `buildDefaultProtocolAnimalRow` (mirror do `+ Adicionar`, Passo 2c);
// `time` é sobrescrito para a hora de carga (`today()->format('H:i')` no legado — SEM uuid,
// linha nova, round-trip §6.3.4).
function buildProtocolRowFromEligibleAnimal(
  animal: EntityOptionRef,
  protocolProducts: Option<string>[]
): BreedingMatingProtocolAnimalFormValue {
  return {
    ...buildDefaultProtocolAnimalRow(undefined, protocolProducts),
    animal: mapEntityOptionRefToOption(animal),
    time: currentTimeHHmm(),
  };
}

// Mirror LOCAL de `mapProtocolAnimalFormValueToPayload` (ver nota de cabeçalho).
function mapRowFormValueToPayload(
  row: BreedingMatingProtocolAnimalFormValue
): CreateOrUpdateBreedingMatingProtocolAnimalPayload {
  return {
    uuid: row.uuid,
    animal_uuid: row.animal!.value,
    time: row.time,
    body_score_uuid: row.body_score?.value ?? null,
    ink: row.ink?.value ?? null,
    eligible: row.eligible,
    provider_uuid: row.provider?.value ?? null,
    product_uuids: row.products.map((product) => product.value),
    seed_uuid: row.semen_or_embryo?.value ?? null,
    batch_uuid: row.batch?.value ?? null,
  };
}

// 422 flat por campo (get_pwa_form_query_pattern — MANDATORY), mirror do
// mapeamento de `protocol_animals.N.*` de `CreateOrUpdateAcasalamento.tsx`.
function mapServerFieldToFormField(field: string): string | null {
  const match = field.match(/^protocol_animals\.(\d+)\.(\w+)$/);
  return match ? `protocol_animals.${match[1]}.${match[2]}` : null;
}

export default function AcasalamentoProximaEtapa() {
  const { breedingMatingUuid } = useParams<{ breedingMatingUuid: string }>();
  const [searchParams] = useSearchParams();
  const individual = searchParams.get('modo') === 'individual';

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.breedingMatings.breedingMating;
  const nextStepText = text.nextStep;
  const detailText = text.detail;

  // Guarda de uuid ANTES de renderizar (regra 10 da Tarefa).
  const hasValidUuid = isValidGuid(breedingMatingUuid ?? null);

  useEffect(() => {
    if (!hasValidUuid) {
      navigate(ACASALAMENTO_LIST_ROUTE, { replace: true });
    }
  }, [hasValidUuid, navigate]);

  const canSave = can('breeding-matings_edit');

  // `EP-BM-02` — só para os campos de cabeçalho travados `Código`/`Tipo de
  // Reprodução` e para o `breeding_batch_uuid` da cascata de animais/lotes
  // de transferência (mesmas fontes já usadas no formulário de criação/edição).
  const detailQuery = useAcasalamentoDetalhe(hasValidUuid ? breedingMatingUuid : undefined);
  const detail = detailQuery.data;

  // `EP-BM-09` — próxima identificação + data (já prontas do servidor) e as
  // linhas de animais a avançar.
  const nextStepQuery = useAcasalamentoProximaEtapa(
    hasValidUuid ? breedingMatingUuid : undefined,
    individual
  );
  const nextStepContext = nextStepQuery.data;

  // `EP-BM-04` (reuso do contexto de edição) — SÓ para os lookups
  // `body_scores`/`providers` que `ProtocolRow` precisa para os selects
  // "Score Corporal"/"Funcionário-Inseminador". Não bloqueia a tela em caso
  // de falha (lookup de apoio, não conteúdo essencial da Próxima Etapa).
  const lookupsQuery = useQuery({
    queryKey: [
      queryKey.breedingMatings.breedingMating,
      'form-context-lookups',
      breedingMatingUuid ?? null,
    ],
    queryFn: async () => {
      const response = await getBreedingMatingEditContext(breedingMatingUuid!);
      return response.data;
    },
    enabled: hasValidUuid,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const lookups = lookupsQuery.data?.lookups;

  // "carregando": `isPending && isFetching` (V5) — carga inicial dos dois
  // fios essenciais (contrato de tela §6.7).
  const isLoading =
    (detailQuery.isPending && detailQuery.isFetching) ||
    (nextStepQuery.isPending && nextStepQuery.isFetching);

  const isNotFound =
    (detailQuery.isError &&
      isAxiosError(detailQuery.error) &&
      detailQuery.error.response?.status === 404) ||
    (nextStepQuery.isError &&
      isAxiosError(nextStepQuery.error) &&
      nextStepQuery.error.response?.status === 404);
  const isGenericError = (detailQuery.isError || nextStepQuery.isError) && !isNotFound;

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    setError,
    formState: { dirtyFields },
  } = useForm<BreedingMatingFormType>({
    defaultValues: buildDefaultAcasalamentoFormValues(),
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'protocol_animals' });

  // Lei 2 (fillForm nomeada + guarda de dirtyFields, get_pwa_form_query_pattern) aplicada em
  // escopo mínimo: só `protocol_animals` é populado, semeado de `eligible_animals` — matéria-
  // prima para a PRÓXIMA identificação (GAP-FE-BM-10), nunca linhas já hidratadas.
  // `resetForce=true` no gatilho de carga inicial (isSuccess && !isRefetching), mirror
  // `useCustomFormQueryById` — ignora a guarda só na carga inicial, nunca em refetches
  // subsequentes com edição em andamento.
  //
  // GAP-FE-BM-17/TASK-BM-FE-22 — modo individual (`data.mode === 'individual'`, sinalizado
  // pelo servidor com `eligible_animals: []`) semeia exatamente 1 linha EM BRANCO
  // (`buildDefaultProtocolAnimalRow()` puro, sem `animal`) em vez de mapear `eligible_animals`
  // para N linhas pré-preenchidas — mirror `matingAnimal=null` do legado. Checagem por
  // `data.mode` (não pelo `individual` local) para nunca depender de inferência própria do
  // front: é o SERVIDOR que decide (regra já escrita no cabeçalho deste arquivo). Modo normal
  // (`data.mode === 'normal'`) mantém o mapeamento atual, byte a byte — inclusive quando
  // `eligible_animals` vier vazio (identificação sem elegíveis), caso em que `fields.length
  // === 0` continua exibindo o estado vazio (`emptyAnimals`), sem regressão.
  function fillNextStepForm(data: BreedingMatingNextStepContext, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) && !resetForce) {
      return;
    }
    const seedBlankIndividualRow = data.mode === 'individual' && data.eligible_animals.length === 0;
    const protocolProducts = buildProtocolProductOptions(
      selectProtocolItemsForIdentification(data.protocol_items, data.identification)
    );
    reset({
      ...buildDefaultAcasalamentoFormValues(),
      protocol_animals: seedBlankIndividualRow
        ? [buildDefaultProtocolAnimalRow(undefined, protocolProducts)]
        : data.eligible_animals.map((animal) =>
            buildProtocolRowFromEligibleAnimal(animal, protocolProducts)
          ),
    });
  }

  useEffect(() => {
    if (nextStepQuery.isSuccess && !nextStepQuery.isRefetching && nextStepQuery.data) {
      fillNextStepForm(nextStepQuery.data, true);
    }
  }, [nextStepQuery.isSuccess, nextStepQuery.isRefetching]);

  const breedingBatchUuid = detail?.breeding_batch?.uuid;
  const eligibleAnimalsQuery = useBreedingBatchAnimalsCascade(breedingBatchUuid);
  const eligibleAnimals = eligibleAnimalsQuery.data ?? [];

  // GAP-FE-BM-17/TASK-BM-FE-22 — em modo individual, o pool do `<select>` de Animal da linha
  // vem de `protocol_animal_options` (histórico completo de `matingProtocolAnimals`, sem
  // recorte de elegibilidade/identificação atual), não de `eligibleAnimals`
  // (`useBreedingBatchAnimalsCascade`, que continua servindo só o modo normal/criação/edição,
  // sem mudança).
  const protocolAnimalOptions = (nextStepContext?.protocol_animal_options ?? []).map(
    mapProtocolAnimalOptionToAnimalOptionRef
  );
  const animalSelectOptions = individual ? protocolAnimalOptions : eligibleAnimals;
  const isLoadingAnimalSelectOptions = individual
    ? nextStepQuery.isFetching
    : eligibleAnimalsQuery.isFetching;

  const transferBatchOptionsQuery = useTransferBatchOptions(breedingBatchUuid);
  const transferBatchOptions = transferBatchOptionsQuery.data ?? [];

  const protocolItems = useMemo(
    () =>
      selectProtocolItemsForIdentification(
        nextStepContext?.protocol_items,
        nextStepContext?.identification
      ),
    [nextStepContext]
  );
  const seedProducts = useMemo(
    () => nextStepContext?.bull_seed_season?.products ?? [],
    [nextStepContext]
  );
  const protocolProductOptions = useMemo(
    () => buildProtocolProductOptions(protocolItems),
    [protocolItems]
  );
  const seedProductOptions = useMemo(() => buildSeedProductOptions(seedProducts), [seedProducts]);

  // `BatchTransferDialog` — só o fluxo 2 nesta tela (botão `+` de
  // `ProtocolRow`, linha isolada, sem aviso pré-submit — mirror
  // `CreateOrUpdateAcasalamento.tsx`; `GAP-FE-BM-03` §3/CLM-023: NUNCA
  // autoatribui o lote escolhido ao campo da linha).
  const [isBatchTransferOpen, setIsBatchTransferOpen] = useState(false);
  const [batchTransferAnimals, setBatchTransferAnimals] = useState<BatchTransferAnimalRef[]>([]);

  function handleRequestRowBatchTransfer(_index: number, animal: Option<string>) {
    setBatchTransferAnimals([{ uuid: animal.value, code: animal.label }]);
    setIsBatchTransferOpen(true);
  }

  // "+ Adicionar" — RECUPERAÇÃO de paridade com o legado (GAP-FE-BM-10):
  // `_card_protocol_identification.blade.php:38-42` renderiza o botão
  // incondicionalmente, também no fluxo Próxima Etapa. Mirror EXATO de
  // `ProtocolSection.handleAdd` — mesmo builder (`buildDefaultProtocolAnimalRow`), zero
  // lógica nova. Linha nasce SEM Animal pré-selecionado, copiando `provider`/
  // `semen_or_embryo` da última linha existente (C11).
  function handleAddProtocolRow() {
    const previousRow = fields[fields.length - 1];
    append(buildDefaultProtocolAnimalRow(previousRow, protocolProductOptions));
  }

  // `useMutation` direto (não `useRequest`) — o toast de sucesso usa a
  // `message` do PRÓPRIO envelope (regra 9 da Tarefa), mirror
  // `index.tsx` (TASK-BM-FE-03, `deleteMutation`/`finishMutation`) desta
  // mesma feature — `useRequest` não expõe `message` dinâmica do envelope
  // (só `personalizedMessage` estático); sibling real já entregue nesta
  // feature tem precedência sobre a instrução literal "useRequest" da
  // Tarefa (divergência documentada no relatório final desta execução).
  const nextStepMutation = useMutation({
    mutationFn: async (data: BreedingMatingFormType) => {
      // Mirror do hidden input `protocol_identification` do legado — sempre reenviado, mesmo
      // valor já exibido como título da seção de linhas (GAP-FE-BM-13). O botão Salvar só fica
      // habilitado quando `nextStepContext?.identification` existe (guarda abaixo), então a
      // asserção não-nula aqui é segura.
      const payload: StoreBreedingMatingNextStepRequest = {
        protocol_identification: nextStepContext!.identification as string,
        protocol_animals: data.protocol_animals.map(mapRowFormValueToPayload),
      };
      return storeBreedingMatingNextStep(breedingMatingUuid as string, payload);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: [queryKey.breedingMatings.breedingMatingsList] });
      queryClient.invalidateQueries({ queryKey: [queryKey.breedingMatings.breedingMating] });

      toaster.success({
        title: text.singularLabel,
        description: response?.message ?? text.singularLabel,
        duration: 7000,
      });

      navigate(ACASALAMENTO_LIST_ROUTE);
    },
    onError: (error) => {
      if (isAxiosError(error) && error.response?.status === 422) {
        const fieldErrors = error.response.data?.errors as Record<string, string[]> | undefined;
        Object.entries(fieldErrors ?? {}).forEach(([field, messages]) => {
          const mappedField = mapServerFieldToFormField(field);
          if (mappedField && messages?.[0]) {
            setError(mappedField as any, { type: 'server', message: messages[0] });
          }
        });
      }

      toaster.error({
        title: text.singularLabel,
        description: extractApiErrorMessage(error) ?? languageGB.common.errorLog.unknownError,
        duration: 7000,
      });
    },
  });

  function handleValidSubmit(data: BreedingMatingFormType) {
    void nextStepMutation.mutateAsync(data);
  }

  const isSubmitting = nextStepMutation.isPending;
  const rowsDisabled = !canSave || isLoading || isSubmitting;

  if (!hasValidUuid) {
    return null;
  }

  if (isNotFound) {
    return (
      <FormContainer title={nextStepText.title}>
        <Flex direction="column" align="center" justify="center" py={16} px={4}>
          <EmptyState.Root>
            <EmptyState.Content>
              <EmptyState.Indicator>
                <Icon as={FiAlertTriangle} boxSize={8} color="fg.muted" />
              </EmptyState.Indicator>
              <VStack textAlign="center" gap={1}>
                <EmptyState.Title>{detailText.notFound.title}</EmptyState.Title>
                <EmptyState.Description>{detailText.notFound.description}</EmptyState.Description>
              </VStack>
              <Button
                title={nextStepText.backButton}
                icon={FiArrowLeft as ElementType}
                variant="outline"
                size="sm"
                onClick={() => navigate(ACASALAMENTO_LIST_ROUTE)}
              />
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  if (isGenericError) {
    return (
      <FormContainer title={nextStepText.title}>
        <Flex direction="column" align="center" justify="center" py={16} px={4}>
          <EmptyState.Root>
            <EmptyState.Content>
              <EmptyState.Indicator>
                <Icon as={FiAlertTriangle} boxSize={8} color="fg.muted" />
              </EmptyState.Indicator>
              <VStack textAlign="center" gap={1}>
                <EmptyState.Title>{detailText.error.message}</EmptyState.Title>
              </VStack>
              <Flex gap={3}>
                <Button
                  title={detailText.error.retry}
                  icon={FiRefreshCw as ElementType}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    void detailQuery.refetch();
                    void nextStepQuery.refetch();
                  }}
                />
                <Button
                  title={nextStepText.backButton}
                  icon={FiArrowLeft as ElementType}
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(ACASALAMENTO_LIST_ROUTE)}
                />
              </Flex>
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  return (
    <>
      <FormContainer
        title={nextStepText.title}
        footer={
          <>
            <Button
              title={languageGB.defaltStrings.cancel}
              variant="outline"
              type="button"
              onClick={() => navigate(-1)}
              disabled={isSubmitting}
            />
            {canSave && (
              <Button
                type="submit"
                form="proxima-etapa-form"
                title={nextStepText.saveButton}
                loading={isSubmitting}
                disabled={isSubmitting || isLoading || !nextStepContext?.identification}
              />
            )}
          </>
        }
      >
        <Form id="proxima-etapa-form" onSubmit={handleSubmit(handleValidSubmit)} noPadding>
          <Box px={{ base: 4, md: 10 }} pb={8}>
            {/* Código/Data/Funcionário Responsável/Estação de Monta/Tipo de
                Reprodução/Lote de Reprodução — travados, mirror
                `_forms_next_step.blade.php:1-27` (GAP-FE-BM-12). `Data` =
                `detail?.date` (data de CADASTRO do Acasalamento) — NUNCA
                `nextStepContext?.identification_date` (esse valor agora é o
                título da seção de linhas, abaixo). `Estação de Monta`/`Lote
                de Reprodução` leem `.label` e renderizam vazios até
                `GAP-FE-BM-11` corrigir o backend — comportamento esperado,
                não é bug desta Tarefa (mesmo estado de
                `AcasalamentoDetalhe.tsx` hoje). `Touro/Sêmen/Embrião` e
                `Protocolo` (nome) ficam de fora — sem fonte no backend hoje
                (`GAP-FE-BM-04`, ampliado). */}
            <DisplayFieldGroup
              loading={isLoading}
              displayFields={[
                { label: nextStepText.fields.code, value: detail?.code ?? '' },
                {
                  label: nextStepText.fields.date,
                  value: detail?.date ? formatDate(detail.date) : '',
                },
                {
                  label: nextStepText.fields.responsibleName,
                  value: detail?.responsible_name ?? '',
                },
                {
                  label: nextStepText.fields.breedingSeason,
                  value: detail?.breeding_season?.label ?? '',
                },
                { label: nextStepText.fields.type, value: detail?.type.label ?? '' },
                {
                  label: nextStepText.fields.breedingBatch,
                  value: detail?.breeding_batch?.label ?? '',
                },
              ]}
            />

            {/* Só linhas de Protocolo — SEM seção Natural, SEM Simplificado
                (regra 7 da Tarefa). Reusa `ProtocolRow` (TASK-BM-FE-05) em
                modo execução: linhas pré-semeadas por animal elegível da
                identificação atual (`eligible_animals`, GAP-FE-BM-10) + botão
                "+ Adicionar" (mirror `ProtocolSection.handleAdd`, paridade
                com o legado, `_card_protocol_identification.blade.php:38-42`,
                renderizado incondicionalmente). */}
            <Box mt={6}>
              {/* Título de identificação/data da etapa — mirror
                  `_card_protocol_identification.blade.php:4-8`
                  (GAP-FE-BM-12); só renderiza quando ambos existem. */}
              {nextStepContext?.identification && nextStepContext?.identification_date && (
                <Text fontSize="md" fontWeight="semibold" mb={4}>
                  {`${nextStepContext.identification} - ${formatDate(nextStepContext.identification_date)}`}
                </Text>
              )}

              {fields.length === 0 ? (
                <Text fontSize="sm" color="fg.muted" py={4}>
                  {nextStepText.emptyAnimals}
                </Text>
              ) : (
                <Flex direction="column" gap={4}>
                  {fields.map((field, index) => (
                    <ProtocolRow
                      key={field.id}
                      index={index}
                      control={control}
                      setValue={setValue}
                      languageGB={languageGB}
                      disabled={rowsDisabled}
                      breedingMatingType={detail?.type.value}
                      eligibleAnimals={animalSelectOptions}
                      isLoadingAnimals={isLoadingAnimalSelectOptions}
                      bodyScoreOptions={lookups?.body_scores ?? []}
                      providerOptions={lookups?.providers ?? []}
                      batchOptions={transferBatchOptions.map((batch) => ({
                        label: batch.label,
                        value: batch.uuid,
                      }))}
                      isLoadingBatchOptions={transferBatchOptionsQuery.isFetching}
                      protocolProductOptions={protocolProductOptions}
                      seedProductOptions={seedProductOptions}
                      onRequestBatchTransfer={(animal) =>
                        handleRequestRowBatchTransfer(index, animal)
                      }
                      onRemove={() => remove(index)}
                    />
                  ))}
                </Flex>
              )}

              <Box mt={4}>
                <Button
                  type="button"
                  title={languageGB.defaltStrings.add}
                  icon={FiPlus as ElementType}
                  variant="outline"
                  size="sm"
                  onClick={handleAddProtocolRow}
                  disabled={rowsDisabled}
                />
              </Box>

              {/* Totalizador Protocolo/Sêmen-Embrião (TASK-BM-FE-05) com os itens
                  da identificação seguinte (`protocol_items`, UT-000705). */}
              <ProtocolTotalizer
                control={control}
                languageGB={languageGB}
                protocolItems={protocolItems}
                seedProducts={seedProducts}
              />
            </Box>
          </Box>
        </Form>
      </FormContainer>

      <BatchTransferDialog
        isOpen={isBatchTransferOpen}
        onClose={() => setIsBatchTransferOpen(false)}
        animals={batchTransferAnimals}
        batchOptions={transferBatchOptions}
        isLoadingBatchOptions={transferBatchOptionsQuery.isFetching}
        languageGB={languageGB}
        onSuccess={() => {
          // Fluxo 2 (botão `+` por linha) — sem reenvio de formulário
          // pendente (mirror `handleBatchTransferSuccess` de
          // CreateOrUpdateAcasalamento.tsx, fluxo 2). O diálogo já invalida
          // o lookup de lotes de transferência internamente.
        }}
      />
    </>
  );
}
