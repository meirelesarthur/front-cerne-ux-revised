// src/components/WriteOff/WriteOffBatchModal.tsx
// -----------------------------------------------------------------------------
// Modal COMPARTILHADO de criação de 1 LOTE de Baixas Manuais (`POST
// /writeoffs/batch`) — TASK-FE-036-334/335, corrigido por `TASK-FE-036-343`
// v2.0 (`GAP-036-114`, Achado A da correção pós-E2E rodada 1) e por
// `TASK-036-GB-09` (cascata Fornecedor/Cliente→Título). Genérico por
// `segment`, reusável por Contas a Receber e Contas a Pagar. NÃO DUPLICAR —
// nenhum import de `@/services/v2/Incomes/**`/`@/services/v2/Financeiro/Expenses/**`
// (a cascata da Baixa Cruzada usa `listAdvanceParties`/`listAdvanceTitles`,
// sub-recurso dedicado de `writeoffs`, não a listagem genérica do
// segmento); a única dependência de domínio própria é o
// `writeoff-service.ts` compartilhado.
//
// Recebe do CONSUMIDOR a lista de títulos JÁ SELECIONADOS e JÁ FILTRADOS por
// elegibilidade (`rows` prop) — este componente NÃO decide quem é elegível.
//
// CORREÇÃO `GAP-036-114` (Achado A1+A2+A3, `TASK-FE-036-343` v2.0) — mirror
// fiel do legado (`MAPA-baixa-legado.md` §2):
//   - REMOVIDO: select "Motivo da Baixa" (`reason_uuid`, inventado — o
//     legado NUNCA envia motivo no modal de lote, resolvido no servidor) e o
//     bloco "Rateio da Baixa" por título (rateio contábil NÃO existe no
//     modal de lote legado, derivado no servidor a partir do rateio já
//     existente do título).
//   - ADICIONADO: **Tipo de Baixa** (`banking_movement`, select estático 2
//     opções) + **Tipo Movimento** (`writeoff_type`, select estático 2
//     opções, só quando `banking_movement===true`) + campos condicionais por
//     modo (Título Relacionado na Baixa Cruzada; Multa/Juros/Acréscimo
//     agregados no Único) + Histórico (`note`) + Documentos
//     (`description`+`file`, nível do LOTE).
//
// `TASK-036-GB-09` (HANDSHAKE-front-baixa-lote-cascata-fornecedor-cliente.md)
// — a seleção PLANA de "Título Relacionado" (`listRelatedTitles`, todos os
// títulos do segmento via `listIncomes`/`listExpenses`) vira uma CASCATA de
// 2 níveis: Fornecedor/Cliente c/ Saldo (`GET /writeoffs/advance-parties`) →
// Título de Adiantamento daquela pessoa (`GET /writeoffs/advance-titles`) →
// Saldo do Título (readonly, client-side). O payload de escrita NÃO muda
// (`related_title_uuid` continua o mesmo campo) — só COMO o usuário chega
// até o uuid. Guarda de saldo (§3): `balance` do título < TOTAL AGREGADO do
// lote (`batchTotal`, NUNCA linha a linha) bloqueia a seleção (toast + reset)
// e o submit (`.test` no Yup).
//
// 3 MODOS do lote:
//   - Movimento Bancário Separado (`banking_movement=true`,
//     `writeoff_type='M'`): Conta Bancária obrigatória, 1 `WriteOff`/
//     `Movement` por título.
//   - Movimento Bancário Único (`banking_movement=true`,
//     `writeoff_type='U'`): idem + Multa/Juros/Acréscimo AGREGADOS do lote
//     (distribuídos proporcionalmente no servidor), 1 `Movement` único.
//   - Baixa Cruzada (`banking_movement=false`): Conta Bancária SOME, Título
//     Relacionado (adiantamento do MESMO segmento) aparece e é obrigatório,
//     sem `Movement` bancário.
//
// Adaptação deliberada vs. o legado (registrada, não é fidelidade quebrada):
// o legado tinha 1 campo de "valor total do lote" que redistribuía
// sequencialmente entre as linhas. A API migrada não tem esse conceito
// (`rows[].amount` já vem resolvido POR LINHA no payload) — cada linha tem
// seu próprio campo "Valor" editável, pré-preenchido com o saldo do título.
// SEM campo de "total com distribuição automática" (decisão de escopo).
//
// Guarda de idempotência (CRÍTICA): o backend NÃO protege contra reenvio
// duplicado do lote inteiro (`BatchWriteOffAction` corta idempotência do
// escopo desta entrega). O botão de submit fica `disabled` enquanto
// `mutation.isPending` — ÚNICA proteção existente, não remover.
//
// Erro atômico (rollback do lote inteiro): 422 do `POST /writeoffs/batch`
// exibe a mensagem literal da API (já cita o título específico) + a
// ressalva `text.batch.atomicRollbackSuffix` ("nada foi salvo").
//
// Fórmula de líquido por linha — `calculateBatchWriteOffRowNetValue`
// (SEM penalty/interest/increase por linha — esses 3 encargos são AGREGADOS
// do lote, só no modo Único), NUNCA `calculateWriteOffNetValue` (baixa
// individual).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Badge, Box, Flex, SimpleGrid, Text } from '@chakra-ui/react';
import { useMutation } from '@tanstack/react-query';
import { Control, Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';

import { Button } from '@/components/Button';
import { CustomDialog } from '@/components/CustomDialog';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { Field } from '@/components/Form/Field';
import { FileUpload } from '@/components/Form/FileUpload';
import { Input } from '@/components/Form/Input';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { Textarea } from '@/components/Form/Textarea';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';
import formatDate from '@/utils/formatDate';
import { todayLocalIso } from '@/utils/localDate';

import { columnsForm } from '@/constants/coluns-form';

import {
  calculateBatchWriteOffRowNetValue,
  writeOffBatchSchemaResolver,
} from '@/validations/schemas/WriteOff/writeoff-schema';

import { listAccounts } from '@/services/v2/CadastrosBase/Account/account-service';
import {
  createBatchWriteOff,
  listAdvanceParties,
  listAdvanceTitles,
  mapWriteOffAdvanceTitleOptionWithBalance,
} from '@/services/v2/WriteOff/writeoff-service';

import type { LanguageDate } from '@/@types/language';
import type { PaginationQueryParams } from '@/@types/pagination';
import type { AccountListItem } from '@/@types/v2/CadastrosBase/account';
import type {
  WriteOffAdvancePartyOption,
  WriteOffBatchForm,
  WriteOffBatchRowPayload,
  WriteOffSegment,
} from '@/@types/v2/WriteOff';

// -----------------------------------------------------------------------------
// Props públicas
// -----------------------------------------------------------------------------

export interface WriteOffBatchModalRowInput {
  titleUuid: string;
  titleNumber: string;
  titleBalance: number;
}

export interface WriteOffBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  segment: WriteOffSegment;
  /** Títulos JÁ SELECIONADOS e JÁ FILTRADOS por elegibilidade pelo CONSUMIDOR. */
  rows: WriteOffBatchModalRowInput[];
  /** Disparado após criar o lote com sucesso — o CONSUMIDOR decide o que invalidar. */
  onSuccess?: () => void;
  /**
   * TASK-MES-FE-06 (execução 044, Meses Conciliados) — extensão ADITIVA e
   * OPCIONAL: quando `true`, o `Movement` gerado pela baixa nasce com
   * `is_reconciled=true` (contexto de conciliação OFX). `undefined`/ausente
   * preserva 100% do comportamento atual (`ContasAPagar`/`Incomes` não
   * passam esta prop).
   */
  forceIsReconciled?: boolean;
}

export function WriteOffBatchModal({
  isOpen,
  onClose,
  segment,
  rows,
  onSuccess,
  forceIsReconciled,
}: WriteOffBatchModalProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.writeOff.form;

  if (!isOpen) return null;

  return (
    <WriteOffBatchModalBody
      isOpen={isOpen}
      title={text.batch.createTitle}
      segment={segment}
      rows={rows}
      onClose={onClose}
      onSuccess={onSuccess}
      forceIsReconciled={forceIsReconciled}
    />
  );
}

interface WriteOffBatchModalBodyProps {
  isOpen: boolean;
  title: string;
  segment: WriteOffSegment;
  rows: WriteOffBatchModalRowInput[];
  onClose: () => void;
  onSuccess?: () => void;
  forceIsReconciled?: boolean;
}

// Tem o `useForm`/mutação — renderiza o próprio `CustomDialog` para que o
// footer (Cancelar/Confirmar, que dependem de `isSubmitting`/`handleSubmit`)
// vá para o SLOT `footer` real do dialog — header/footer fixos, só o body
// rola, SEM footer-in-body sticky (que deixava faixa morta abaixo do
// footer).
function WriteOffBatchModalBody({
  isOpen,
  title,
  segment,
  rows,
  onClose,
  onSuccess,
  forceIsReconciled,
}: WriteOffBatchModalBodyProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.writeOff.form;

  const {
    control,
    handleSubmit,
    setValue,
    formState: { isSubmitting: isValidating },
  } = useForm<WriteOffBatchForm>({
    resolver: writeOffBatchSchemaResolver(languageGB),
    defaultValues: {
      // Default mirror do legado (img02) — "Movimento Bancário" pré-selecionado.
      banking_movement: true,
      account_uuid: null,
      // 1º nível da cascata (`TASK-036-GB-09`) — 100% client-side.
      advance_party_uuid: null,
      related_title_uuid: null,
      writeoff_type: null,
      // Mirror `WriteOffCreateModal` — sugere HOJE, o usuário pode trocar.
      movement_date: todayLocalIso(),
      penalty: 0,
      interest: 0,
      increase: 0,
      note: '',
      description: '',
      file: null,
      // Cada linha pré-preenchida com o saldo do título (prop recebida do
      // consumidor) — ajustável pelo usuário linha a linha (adaptação
      // deliberada vs. o legado, ver cabeçalho do arquivo).
      rows: rows.map((row) => ({
        title_uuid: row.titleUuid,
        title_number: row.titleNumber,
        title_balance: row.titleBalance,
        amount: row.titleBalance > 0 ? row.titleBalance : null,
        discount: 0,
      })),
    },
  });

  // `fields` só para chaves estáveis de renderização (`field.id`) — o
  // conjunto de linhas é FIXO (vem da seleção do consumidor), sem
  // append/remove de linha aqui.
  const { fields } = useFieldArray({ control, name: 'rows' });

  const watchedRows = useWatch({ control, name: 'rows' }) ?? [];
  const batchTotal = watchedRows.reduce(
    (sum, row) =>
      sum + calculateBatchWriteOffRowNetValue({ amount: row?.amount, discount: row?.discount }),
    0
  );

  // ---- Campos condicionais por modo (RE-ESCOPO A3) — puramente locais
  // (`useWatch`), sem chamada de rede nova. ----
  const watchedBankingMovement = useWatch({ control, name: 'banking_movement' });
  const watchedWriteoffType = useWatch({ control, name: 'writeoff_type' });
  const isBankingMovement = watchedBankingMovement !== false;
  const isUniqueMovement = isBankingMovement && watchedWriteoffType === 'U';

  // ---- Cascata da Baixa Cruzada (`TASK-036-GB-09`) — 1º nível (Fornecedor/
  // Cliente c/ Saldo) → 2º nível (Título de Adiantamento, já existente no
  // payload). `watchedAdvancePartyUuid` também goveta a disponibilidade do
  // 2º nível (`isDisabled` enquanto vazio). ----
  const watchedAdvancePartyUuid = useWatch({ control, name: 'advance_party_uuid' });
  const watchedRelatedTitle = useWatch({ control, name: 'related_title_uuid' });

  // ---- Guarda de saldo (handshake §3) — `balance` do TÍTULO selecionado
  // (cacheado na própria option, `WriteOffCounterpartOption`) < TOTAL
  // AGREGADO do lote (`batchTotal`, NUNCA linha a linha). Roda: (1) quando o
  // usuário troca de título (`watchedRelatedTitle` muda) — mirror legado
  // "a guarda roda no change do título"; (2) quando `batchTotal` muda DEPOIS
  // com um título já selecionado (usuário edita `rows[].amount`). Só se
  // aplica no modo Baixa Cruzada (`!isBankingMovement`) — mirror
  // `BatchWriteOffRequest`, saldo bancário não tem essa noção. ----
  useEffect(() => {
    if (isBankingMovement) return;
    if (!watchedRelatedTitle) return;

    const balance = watchedRelatedTitle.balance ?? 0;
    if (balance < batchTotal) {
      toaster.error({
        title: text.batch.createTitle,
        description: text.batch.errors.relatedTitleBalanceExceeded.replace(
          '{balance}',
          balance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        ),
      });
      // Reset (mirror legado `$('.title').val('').trigger('change.select2')` +
      // `title_balance.val('')`) — o readonly de saldo limpa junto, pois deriva
      // direto de `watchedRelatedTitle?.balance`.
      setValue('related_title_uuid', null, { shouldValidate: true });
    }
  }, [batchTotal, watchedRelatedTitle, isBankingMovement]);

  const bankingMovementOptions = [
    { value: true, label: text.batch.fields.bankingMovementOption },
    { value: false, label: text.batch.fields.crossedWriteOffOption },
  ];
  const writeoffTypeOptions: Array<{ value: 'M' | 'U'; label: string }> = [
    { value: 'M', label: text.batch.fields.writeoffTypeSeparateOption },
    { value: 'U', label: text.batch.fields.writeoffTypeUniqueOption },
  ];

  // ---- Submit — `POST /writeoffs/batch` ----
  // `useMutation` DIRETO (NÃO `useRequest`): o componente compartilhado não
  // conhece `queryKey` de Income/Expense — quem invalida é o CONSUMIDOR via
  // `onSuccess`.
  const mutation = useMutation({
    mutationFn: async (data: WriteOffBatchForm) => {
      const batchRows: WriteOffBatchRowPayload[] = data.rows.map((row) => ({
        title_uuid: row.title_uuid,
        amount: Number(row.amount) || 0,
        discount: Number(row.discount) || 0,
      }));

      return createBatchWriteOff({
        segment,
        banking_movement: data.banking_movement,
        movement_date: data.movement_date as string,
        rows: batchRows,
        // Condicionais por modo — mirror `BatchWriteOffRequest::rules()`.
        account_uuid: data.banking_movement ? (data.account_uuid?.value ?? undefined) : undefined,
        related_title_uuid: !data.banking_movement
          ? (data.related_title_uuid?.value ?? undefined)
          : undefined,
        writeoff_type: data.banking_movement ? (data.writeoff_type ?? undefined) : undefined,
        // Encargos AGREGADOS do lote — só no modo Único.
        penalty:
          data.banking_movement && data.writeoff_type === 'U'
            ? Number(data.penalty) || 0
            : undefined,
        interest:
          data.banking_movement && data.writeoff_type === 'U'
            ? Number(data.interest) || 0
            : undefined,
        increase:
          data.banking_movement && data.writeoff_type === 'U'
            ? Number(data.increase) || 0
            : undefined,
        note: data.note || undefined,
        description: data.description || undefined,
        file: data.file ?? undefined,
        // TASK-MES-FE-06 — repassa só quando o consumidor pediu (ver nota da
        // prop `forceIsReconciled` acima); `undefined` preserva o
        // comportamento atual dos demais consumidores.
        is_reconciled: forceIsReconciled,
      });
    },
    onSuccess: () => {
      toaster.success({
        title: text.batch.createTitle,
        description: text.batch.createdToast,
        duration: 7000,
      });
      onClose();
      onSuccess?.();
    },
    onError: (error) => {
      // Mensagem literal da API (422 já cita o título específico dentro do
      // texto, `errors` do envelope vem `null`) + ressalva de que o LOTE
      // INTEIRO foi revertido (rollback atômico, `BatchWriteOffAction`) —
      // NUNCA só a linha citada.
      const message = extractApiErrorMessage(error) ?? languageGB.common.errorLog.unknownError;
      toaster.error({
        title: text.batch.createTitle,
        description: `${message} ${text.batch.atomicRollbackSuffix}`,
        duration: 9000,
      });
    },
  });

  function onSubmit(data: WriteOffBatchForm) {
    mutation.mutate(data);
  }

  // Guarda de idempotência (CRÍTICA) — `isSubmitting` cobre também a
  // mutação em voo, não só a validação síncrona do resolver.
  const isSubmitting = mutation.isPending || isValidating;

  return (
    <CustomDialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      // `size="xl"` (item A3.1, REVERTIDO na 2ª rodada de feedback,
      // Execução 065) — o dono classificou `size="full"` como REGRESSÃO: o
      // modal não deve ocupar a viewport inteira. Voltou ao `xl` bounded
      // original; a largura dos CAMPOS é resolvida no grid (`SimpleGrid`
      // mode-aware logo abaixo), não expandindo o dialog. Size nativa
      // suportada pelo `CustomDialog` (`src/components/CustomDialog.tsx`),
      // sem `maxW` hard-coded por modal.
      size="xl"
      maxH="85vh"
      footer={
        <>
          <Button
            title={text.cancelButton}
            variant="outline"
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
          />
          {/* Guarda de idempotência (CRÍTICA, ver cabeçalho do arquivo) — o
              backend NÃO protege contra reenvio duplicado do lote inteiro.
              `disabled` durante `isPending`/validação é a ÚNICA proteção
              existente contra duplo-clique/retry — NUNCA remover/otimizar
              para permitir reenvio rápido. */}
          <Button
            title={text.batch.submitButton}
            type="button"
            onClick={handleSubmit(onSubmit)}
            loading={isSubmitting}
            disabled={isSubmitting}
          />
        </>
      }
    >
      <Form noPadding onSubmit={handleSubmit(onSubmit)}>
        {/* Grid do topo mode-aware (2ª rodada de feedback, Execução 065) —
            `size="xl"` bounded (revertido acima) precisa que os CAMPOS
            preencham a largura, não o dialog. Modo bancário tem 4 campos
            (Tipo de Baixa, Conta Bancária, Data do Movimento, Tipo
            Movimento) → `fourColumns`; Baixa Cruzada (`!isBankingMovement`)
            só tem 3 (Tipo de Baixa, Fornecedor/Cliente c/ Saldo, Data do
            Movimento) → `threeColumns`, senão sobra 1 coluna vazia e os 3
            campos ficam estreitos. */}
        <SimpleGrid
          columns={isBankingMovement ? columnsForm.fourColumns : columnsForm.threeColumns}
          gap={4}
        >
          <Controller
            name="banking_movement"
            control={control}
            render={({ field: { value, onChange }, fieldState }) => (
              <Select
                name="banking_movement"
                label={text.batch.fields.bankingMovementType}
                value={bankingMovementOptions.find((option) => option.value === value) ?? null}
                onChange={(option: { value: boolean } | null) => onChange(!!option?.value)}
                options={bankingMovementOptions}
                error={fieldState.error?.message}
                isRequired
                isDisabled={isSubmitting}
                noClearable
                disablePortal
              />
            )}
          />

          {isBankingMovement ? (
            // `key` distinta do ramo cruzado (item A1, Execução 065) —
            // FORÇA o React a desmontar/remontar ao alternar `banking_movement`
            // em vez de reconciliar o MESMO fiber (`Controller` nos dois
            // ramos, mesma posição JSX). Sem a `key`, o `SelectAsyncPaginate`
            // interno preserva o cache de opções carregado (contas
            // bancárias) ao trocar para Baixa Cruzada — bug de reconciliação,
            // não de service/endpoint (ambos já corretos).
            <Controller
              key="wo-account"
              name="account_uuid"
              control={control}
              render={({ field, fieldState }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.account}
                  placeholder={text.placeholders.account}
                  service={listAccounts}
                  mapOptions={(item: AccountListItem) => ({
                    label: `${item.code} — ${item.description}`,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                    is_enabled: 'true',
                  })}
                  value={field.value ?? undefined}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  error={fieldState.error?.message}
                  isRequired
                  isDisabled={isSubmitting}
                  disablePortal
                />
              )}
            />
          ) : (
            // 1º nível da cascata (`TASK-036-GB-09`) — rótulo por segmento
            // (reforço explícito do dono): "Fornecedor c/ Saldo" em `expenses`
            // (CaP), "Cliente c/ Saldo" em `incomes` (CaR) — nunca invertido.
            // `key` distinta do ramo bancário (item A1, ver comentário acima)
            // — mesmo motivo, espelhado no outro ramo do ternário.
            <Controller
              key="wo-advance-party"
              name="advance_party_uuid"
              control={control}
              render={({ field, fieldState }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={
                    segment === 'incomes'
                      ? text.batch.fields.advancePartyClient
                      : text.batch.fields.advancePartyProvider
                  }
                  placeholder={text.batch.placeholders.advanceParty}
                  service={(params: PaginationQueryParams & { search?: string }) =>
                    listAdvanceParties(segment, { search: params.search })
                  }
                  mapOptions={(item: WriteOffAdvancePartyOption) => ({
                    label: item.label,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => {
                    const term = typeof search === 'string' ? search : search.search;
                    return term ? { search: term } : undefined;
                  }}
                  value={field.value ?? undefined}
                  onChange={(option: any) => {
                    // Trocar de fornecedor/cliente reseta o título já
                    // escolhido (mirror legado) — o readonly de saldo limpa
                    // junto, pois deriva direto da option de título.
                    field.onChange(option ?? null);
                    setValue('related_title_uuid', null);
                  }}
                  error={fieldState.error?.message}
                  isRequired
                  isDisabled={isSubmitting}
                  disablePortal
                />
              )}
            />
          )}

          <Controller
            name="movement_date"
            control={control}
            render={({ field, fieldState }) => (
              <Field
                label={text.fields.movementDate}
                errorText={fieldState.error?.message}
                isRequired
              >
                <DateInput value={field.value} onChange={field.onChange} disabled={isSubmitting} />
              </Field>
            )}
          />

          {isBankingMovement && (
            <Controller
              name="writeoff_type"
              control={control}
              render={({ field: { value, onChange }, fieldState }) => (
                <Select
                  name="writeoff_type"
                  label={text.batch.fields.writeoffType}
                  value={writeoffTypeOptions.find((option) => option.value === value) ?? null}
                  onChange={(option: { value: 'M' | 'U' } | null) =>
                    onChange(option?.value ?? null)
                  }
                  options={writeoffTypeOptions}
                  error={fieldState.error?.message}
                  isRequired
                  isDisabled={isSubmitting}
                  noClearable
                  disablePortal
                />
              )}
            />
          )}
        </SimpleGrid>

        {/* 2º nível da cascata (`TASK-036-GB-09`) — Título de Adiantamento da
          pessoa escolhida no 1º nível + Saldo do Título (readonly,
          client-side, deriva de `watchedRelatedTitle?.balance`). Linha
          própria (fora do grid de 4 colunas acima) porque o nível 1 já
          ocupa 1 dos 4 slots — mirror do espaçamento das demais seções
          condicionais deste modal (`mt={4}`). */}
        {!isBankingMovement && (
          <SimpleGrid columns={columnsForm.threeColumns} gap={4} mt={4}>
            {/* razão 2:1 Título:Saldo (item A3.2, Execução 065) — wrapper
                `gridColumn` span 2 (mirror `ApuracaoCusto/index.tsx:455`,
                `get_pwa_ui_components_pattern` §4): em `lg` (3 colunas de
                `columnsForm.threeColumns`) o Título ocupa 2/3 da linha e o
                Saldo (sem wrapper, span 1 default) fecha a 3ª coluna, sem
                sobra vazia. Em `md` (2 colunas) o Título toma a linha inteira
                e o Saldo desce sozinho; em `base` ambos empilham (1 coluna) —
                comportamento aceitável mobile, decisão do dono. */}
            <Box gridColumn={{ base: '1', md: 'span 2' }}>
              <Controller
                name="related_title_uuid"
                control={control}
                render={({ field, fieldState }) => (
                  <SelectAsyncPaginate
                    name={field.name}
                    label={text.batch.fields.relatedTitle}
                    placeholder={text.batch.placeholders.relatedTitle}
                    service={() => listAdvanceTitles(segment, watchedAdvancePartyUuid?.value)}
                    // mapper DEDICADO do lote (item A2, Execução 065) — NÃO
                    // `mapWriteOffCounterpartOption` (compartilhado com
                    // `WriteOffCreateModal`, baixa individual — mudar o label
                    // ali regrediria o mapper original). Label = `{código —
                    // descrição} — {saldo BRL}`; `balance` continua na option
                    // (alimenta `title_balance` abaixo + a guarda de saldo).
                    mapOptions={mapWriteOffAdvanceTitleOptionWithBalance}
                    value={field.value ?? undefined}
                    onChange={(option: any) => field.onChange(option ?? null)}
                    error={fieldState.error?.message}
                    isRequired
                    isDisabled={isSubmitting || !watchedAdvancePartyUuid}
                    cacheUniqs={[watchedAdvancePartyUuid?.value]}
                    disablePortal
                  />
                )}
              />
            </Box>

            <InputReadOnly
              label={text.batch.fields.relatedTitleBalance}
              value={(watchedRelatedTitle?.balance ?? 0).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            />
          </SimpleGrid>
        )}

        {isUniqueMovement && (
          <SimpleGrid columns={columnsForm.threeColumns} gap={4} mt={4}>
            <Controller
              name="penalty"
              control={control}
              render={({ field, fieldState }) => (
                <MoneyInput
                  name={field.name}
                  label={text.fields.penalty}
                  value={field.value}
                  onValueChange={field.onChange}
                  error={fieldState.error?.message}
                  disabled={isSubmitting}
                />
              )}
            />

            <Controller
              name="interest"
              control={control}
              render={({ field, fieldState }) => (
                <MoneyInput
                  name={field.name}
                  label={text.fields.interest}
                  value={field.value}
                  onValueChange={field.onChange}
                  error={fieldState.error?.message}
                  disabled={isSubmitting}
                />
              )}
            />

            <Controller
              name="increase"
              control={control}
              render={({ field, fieldState }) => (
                <MoneyInput
                  name={field.name}
                  label={text.fields.increase}
                  value={field.value}
                  onValueChange={field.onChange}
                  error={fieldState.error?.message}
                  disabled={isSubmitting}
                />
              )}
            />
          </SimpleGrid>
        )}

        <Box mt={4}>
          <Controller
            name="note"
            control={control}
            render={({ field, fieldState }) => (
              <Textarea
                name={field.name}
                label={text.fields.note}
                placeholder={text.placeholders.note}
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error?.message}
                maxLength={150}
                disabled={isSubmitting}
              />
            )}
          />
        </Box>

        <Box mt={4} border="1px solid" borderColor="border.subtle" borderRadius="lg" p={4}>
          <Text fontSize="sm" fontWeight="semibold" mb={3}>
            {text.batch.fields.documentSectionTitle}
          </Text>

          <SimpleGrid columns={columnsForm.threeColumns} gap={4} alignItems="start">
            <Controller
              name="description"
              control={control}
              render={({ field, fieldState }) => (
                <Input
                  name={field.name}
                  label={text.batch.fields.documentDescription}
                  placeholder={text.batch.placeholders.documentDescription}
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                  maxLength={50}
                  disabled={isSubmitting}
                />
              )}
            />

            <Controller
              name="file"
              control={control}
              render={({ field, fieldState }) => (
                <FileUpload
                  label={text.batch.fileUpload.label}
                  hint={text.batch.fileUpload.hint}
                  accept=".pdf,.jpg,.jpeg,.png"
                  maxSizeMb={2}
                  file={field.value}
                  onFileSelected={(selectedFile) => field.onChange(selectedFile)}
                  onRemove={() => field.onChange(null)}
                  disabled={isSubmitting}
                  error={fieldState.error?.message}
                  dropzoneTitle={text.batch.fileUpload.dropzoneTitle}
                  dropzoneDraggingTitle={text.batch.fileUpload.dropzoneDraggingTitle}
                  changeLabel={text.batch.fileUpload.changeLabel}
                  removeLabel={text.batch.fileUpload.removeLabel}
                  errorTypeMessage={text.batch.fileUpload.errorTypeMessage}
                  errorSizeMessage={text.batch.fileUpload.errorSizeMessage}
                />
              )}
            />

            <InputReadOnly
              label={text.batch.fields.documentDateFile}
              value={formatDate(new Date(), 'dd/MM/yyyy')}
            />
          </SimpleGrid>
        </Box>

        <Box mt={6}>
          <Flex justify="space-between" align="center" wrap="wrap" gap={3} mb={3}>
            <Text fontSize="sm" fontWeight="semibold">
              {text.batch.createTitle}
            </Text>
            <Text fontSize="sm" color="fg.muted">
              {text.batch.footerTotalLabel}:{' '}
              {batchTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </Text>
          </Flex>

          <Flex direction="column" gap={4}>
            {fields.map((field, index) => (
              <WriteOffBatchModalRow
                key={field.id}
                control={control}
                rowIndex={index}
                languageGB={languageGB}
                disabled={isSubmitting}
              />
            ))}
          </Flex>
        </Box>
      </Form>
    </CustomDialog>
  );
}

// -----------------------------------------------------------------------------
// Linha do lote — 1 título selecionado. `GAP-036-114` (Achado A1) removeu o
// rateio contábil por linha (`useFieldArray` de `categories` + os 4 Selects
// de categoria/centro/conta contábil/valor) — agora só exibe
// Valor/Desconto/Líquido, mirror do que resta do legado no modal de lote.
// -----------------------------------------------------------------------------

interface WriteOffBatchModalRowProps {
  control: Control<WriteOffBatchForm>;
  rowIndex: number;
  languageGB: LanguageDate;
  disabled: boolean;
}

function WriteOffBatchModalRow({
  control,
  rowIndex,
  languageGB,
  disabled,
}: WriteOffBatchModalRowProps) {
  const text = languageGB.writeOff.form;

  const rowValues = useWatch({ control, name: `rows.${rowIndex}` });

  const netValue = calculateBatchWriteOffRowNetValue({
    amount: rowValues?.amount,
    discount: rowValues?.discount,
  });

  return (
    <Box border="1px solid" borderColor="border.subtle" borderRadius="lg" p={4}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={3} mb={3}>
        <Flex align="center" gap={3} wrap="wrap">
          <Badge colorPalette="gray" variant="outline">
            {text.batch.tableColumns.titleNumber}: {rowValues?.title_number}
          </Badge>
          <Text fontSize="sm" color="fg.muted">
            {text.batch.tableColumns.titleBalance}:{' '}
            {Number(rowValues?.title_balance ?? 0).toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
          </Text>
        </Flex>
        <Text fontSize="sm" color="fg.muted">
          {text.batch.tableColumns.netValue}:{' '}
          {netValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </Text>
      </Flex>

      <SimpleGrid columns={columnsForm.threeColumns} gap={4}>
        <Controller
          name={`rows.${rowIndex}.amount`}
          control={control}
          render={({ field, fieldState }) => (
            <MoneyInput
              name={field.name}
              label={text.batch.tableColumns.amount}
              value={field.value}
              onValueChange={field.onChange}
              error={fieldState.error?.message}
              isRequired
              disabled={disabled}
            />
          )}
        />

        <Controller
          name={`rows.${rowIndex}.discount`}
          control={control}
          render={({ field, fieldState }) => (
            <MoneyInput
              name={field.name}
              label={text.batch.tableColumns.discount}
              value={field.value}
              onValueChange={field.onChange}
              error={fieldState.error?.message}
              disabled={disabled}
            />
          )}
        />

        <InputReadOnly
          label={text.batch.tableColumns.netValue}
          value={netValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        />
      </SimpleGrid>
    </Box>
  );
}
