// src/pages/CadastrosBase/SaldoInicial/CreateSaldoInicial.tsx
// -----------------------------------------------------------------------------
// Tela de CRIAÇÃO de SALDO INICIAL (OpenMovement) — Cadastros Base /
// Financeiros, execução 031, TASK-FE-031-37. Rota:
// /cadastros-base/saldo-inicial/novo (guardada por `open-movements_create`,
// wiring real da rota é TASK-FE-031-38). SEM Edição — veredito do legado +
// dono (contrato §2), por isso `CreateSaldoInicial.tsx`, não
// `CreateOrUpdateSaldoInicial.tsx` (2º desvio deliberado do protocolo v2,
// contrato §2).
//
// Bloco RATEIO (`ApportionmentsSection`, componente-irmão NO MESMO ARQUIVO)
// — mirror da decisão estrutural de `CentroCusto/CreateOrUpdateCentroCusto.tsx`
// (`useFieldArray` fica no PAI, a seção recebe `fields/append/remove` via
// props), adaptado de 2 colunas (Centro de Custo + percentual) para 3
// (Categoria + Centro de Custo + Valor) — contrato §6. Badge de TOTAL
// SEMPRE cosmético/client-side, nunca bloqueia submit (contrato §6/§12 — a
// decisão de validação server-side da soma ainda está aberta no contrato de
// API §17.1; o front é resiliente às duas opções por desenho).
//
// 2 riscos deliberados (contrato §"Riscos"/TASK-FE-031-37):
//   1. "Tipo"/"Tp. Categoria" são DISPLAY-ONLY (`Input disabled`, fora do
//      `register()`) — o DTO do backend (`OpenMovementData`) não tem esses
//      campos, são fixados pela Action (contrato de API §6/§9).
//   2. "Proprietário Gestor" usa `SelectCombobox` (busca CLIENT-SIDE sobre
//      `listProprietaryOptions`, endpoint NÃO-paginado), NÃO
//      `SelectAsyncPaginate` — reaproveita `useProprietariesList()`
//      (`ContasBancarias/useAccounts.tsx`), nenhum hook/service novo.
// -----------------------------------------------------------------------------

import { ElementType, useEffect, useMemo } from 'react';

import { Badge, Box, Flex, Icon, SimpleGrid, Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import {
  Control,
  Controller,
  FieldArrayWithId,
  FieldErrors,
  UseFieldArrayRemove,
  useFieldArray,
  useForm,
} from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { NumberInput } from '@/components/Form/NumberInput';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { SelectCombobox } from '@/components/Form/SelectCombobox';
import { IconButtonTable } from '@/components/IconButtonTable';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { openMovementSchemaResolver } from '@/validations/schemas/CadastrosBase/open-movement-schema';

import { listAccounts } from '@/services/v2/CadastrosBase/Account/account-service';
import { listCostCenterOptions } from '@/services/v2/CostCenters/cost-center-service';
import { listFinancialCategoryOptions } from '@/services/v2/FinancialCategories/financial-category-service';
import { createOpenMovement } from '@/services/v2/OpenMovements/open-movement-service';

import type { ModuleOpenMovements } from '@/@types/language/module-open-movements';
import type { Option } from '@/@types/option';
import type { AccountListItem } from '@/@types/v2/CadastrosBase/account';
import type { CostCenterRef } from '@/@types/v2/CostCenters';
import type { FinancialCategoryOption } from '@/@types/v2/FinancialCategories';
import type {
  OpenMovementItemPayload,
  OpenMovementPayload,
  OpenMovementForm as OpenMovementFormType,
} from '@/@types/v2/OpenMovements';

import { useProprietariesList } from '../ContasBancarias/useAccounts';

// F-183 Saldo Inicial: ligação ao opt-in de backend `bank_movement_scoped`
// (78072846f) — expõe as categorias de sistema globais `3.01.001.%`
// (inclui "Saldo Inicial de Conta (Bancos/Caixa)"), normalmente ocultas da
// lista geral de `/financial-categories/options`. Substitui o antigo
// `TODO_TYPE_ID_SALDO_INICIAL` (sempre `undefined`, morto) — o filtro
// correto já não depende de `type_id`.
const BANK_MOVEMENT_SCOPED = 'true' as const;

// CORREÇÃO PÓS-E2E (rodada 1, C1 — correcoes-e2e-dev-rodada-1.md): o Select
// de Categoria do rateio trazia TODAS as categorias analíticas (`class: 2`),
// sem nenhum filtro adicional nem pré-seleção — evidência do dev mostra o
// legado com UMA ÚNICA opção, já selecionada por padrão ("Saldo Inicial de
// Conta (Bancos/Caixa)"). `search` é parâmetro JÁ EXISTENTE do endpoint
// (`GET /financial-categories/options?search=`, `ILIKE` em
// `description`/`code` — `FinancialCategoryApiRepository::listOptions`,
// confirmado por leitura direta do backend), não um filtro novo inventado
// aqui. Combinado com `class: 2`, restringe às categorias analíticas cuja
// descrição contém este texto — mesma regra de negócio 9 da doc bruta.
const SALDO_INICIAL_CATEGORY_SEARCH = 'Saldo Inicial de Conta';

function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Mapeia 422 por campo (contrato §10 — `applyServerFieldErrors`, padrão
// Vladimir) ALÉM do toast genérico já exibido pelo `onError` do `useRequest`.
// Erro de negócio SEM campo específico (ex.: futura checagem de soma do
// rateio, §17.1 do contrato de API) cai no fallback genérico — não mapeado
// aqui, nunca em campo (contrato §10).
function applyServerFieldErrors(
  error: unknown,
  setError: (name: any, error: { type: string; message: string }) => void
) {
  if (!isAxiosError(error) || error.response?.status !== 422) return;
  const backendErrors = (error.response.data as any)?.errors as
    Record<string, string[]> | undefined;
  if (!backendErrors) return;

  const knownRootFields = new Set([
    'account_uuid',
    'date',
    'value',
    'interest',
    'document',
    'note',
    'proprietary_uuid',
  ]);
  const itemFieldPattern = /^items\.(\d+)\.(financial_category_uuid|cost_center_uuid|value)$/;

  Object.entries(backendErrors).forEach(([field, messages]) => {
    const message = messages[0];
    if (!message) return;

    const itemMatch = field.match(itemFieldPattern);
    if (itemMatch) {
      setError(`items.${itemMatch[1]}.${itemMatch[2]}`, { type: 'server', message });
      return;
    }

    if (knownRootFields.has(field)) {
      setError(field, { type: 'server', message });
    }
    // `items` (erro de nível de array, ex.: min:1) e qualquer erro de
    // negócio sem campo específico caem no fallback genérico do toast —
    // nunca mapeados em campo (contrato §10).
  });
}

export default function CreateSaldoInicial() {
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.openMovements.openMovement;
  const canSave = can('open-movements_create');

  const {
    control,
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<OpenMovementFormType>({
    mode: 'onChange',
    resolver: openMovementSchemaResolver(languageGB),
    reValidateMode: 'onChange',
    defaultValues: {
      account_uuid: null,
      proprietary_uuid: null,
      date: '',
      value: null,
      interest: null,
      document: '',
      note: '',
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  // Proprietário Gestor — `SelectCombobox` sobre `listProprietaryOptions`
  // (endpoint NÃO-paginado), reaproveitando `useProprietariesList()` já
  // existente (Risco #2 do cabeçalho — nenhum hook/service novo).
  const proprietariesQuery = useProprietariesList();
  const proprietaryOptions: Option<string>[] = (proprietariesQuery.data ?? []).map((item) => ({
    label: item.label,
    value: item.uuid,
  }));

  // Rateio "Categoria" (correção C1) — busca ÚNICA vez (não por linha) a
  // categoria aplicável a Saldo Inicial. `queryKey` próprio, mirror
  // `useProprietariesList` (`staleTime` curto, `retry: false` — lookup de
  // formulário, não dado crítico de negócio).
  const categoryOptionsQuery = useQuery({
    queryKey: [queryKey.openMovements.apportionmentCategoryOptions],
    queryFn: () =>
      listFinancialCategoryOptions({
        class: 2,
        bank_movement_scoped: BANK_MOVEMENT_SCOPED,
        search: SALDO_INICIAL_CATEGORY_SEARCH,
        per_page: 20,
      }),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  const categoryOptions: Option<string>[] = (categoryOptionsQuery.data?.data?.items ?? []).map(
    (item) => ({
      label: `${item.code} — ${item.description}`,
      value: item.uuid,
    })
  );
  // Exatamente 1 opção → auto-seleciona e trava o campo (contrato da
  // correção C1: "deixe read-only se for a única válida"). 0 ou >1 →
  // permanece pesquisável (Select original), sem inventar critério de
  // desempate — ver nota de `hasCategoryAmbiguity` abaixo.
  const singleCategoryOption = categoryOptions.length === 1 ? categoryOptions[0] : null;
  // `[LACUNA]` — se o endpoint devolver mais de 1 resultado para este
  // filtro, o cadastro de categorias financeiras deste tenant provavelmente
  // tem mais de uma categoria compatível com "Saldo Inicial de Conta
  // (Bancos/Caixa)" (possível filtro incorreto — `type_id` do contrato de
  // API §15 ainda não confirmado). Registrado na entrega, NÃO corrigido
  // silenciosamente aqui (o front não inventa qual das opções é "a certa").
  const hasCategoryAmbiguity = categoryOptions.length > 1;

  useEffect(() => {
    if (hasCategoryAmbiguity) {
      // eslint-disable-next-line no-console
      console.warn(
        '[SaldoInicial/CreateSaldoInicial] listFinancialCategoryOptions devolveu mais de 1 ' +
          'categoria para o filtro "Saldo Inicial de Conta" — possível filtro incorreto ' +
          '(contrato de API §15, C1 da correção pós-E2E rodada 1). Verificar cadastro de ' +
          'categorias financeiras deste tenant.'
      );
    }
  }, [hasCategoryAmbiguity]);

  const openMovementMutation = useRequest({
    asyncFunction: tryPersistOpenMovement,
    entityName: text.singularLabel,
    queryKey: queryKey.openMovements.list,
    queryKey2: queryKey.openMovements.detail,
    typesRequest: 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  async function tryPersistOpenMovement(data: OpenMovementFormType) {
    const items: OpenMovementItemPayload[] = data.items.map((item) => ({
      financial_category_uuid: item.financial_category_uuid!.value,
      cost_center_uuid: item.cost_center_uuid!.value,
      value: Number(item.value),
    }));

    const payload: OpenMovementPayload = {
      account_uuid: data.account_uuid!.value,
      date: data.date,
      value: Number(data.value),
      proprietary_uuid: data.proprietary_uuid!.value,
      items,
    };

    // Opcionais — omitidos do payload quando vazios (backend default `0`/null).
    if (data.interest !== null && data.interest !== undefined) {
      payload.interest = Number(data.interest);
    }
    if (data.document?.trim()) payload.document = data.document.trim();
    if (data.note?.trim()) payload.note = data.note.trim();

    return await createOpenMovement(payload);
  }

  async function onSubmit(data: OpenMovementFormType) {
    try {
      await openMovementMutation.mutateAsync(data);
    } catch (error) {
      applyServerFieldErrors(error, setError as any);
    }
  }

  const isSubmitting = openMovementMutation.isPending;

  // Badge de TOTAL — SEMPRE client-side/cosmético, nunca bloqueia submit
  // (contrato §6/§12 — tolerância de centavo por arredondamento decimal).
  const watchedItems = watch('items');
  const watchedValue = watch('value');
  const totalItems = (watchedItems ?? []).reduce((sum, item) => sum + (item.value ?? 0), 0);
  const isSumComplete = Math.abs(totalItems - (watchedValue ?? 0)) < 0.01;

  return (
    <FormContainer
      title={text.form.title.create}
      subtitle={text.form.subtitle.create}
      footer={
        <>
          <Button
            title={languageGB.defaltStrings?.cancel || 'Cancelar'}
            variant="secondary"
            type="button"
            onClick={() => navigate(-1)}
          />
          {canSave && (
            <ButtonSaveAndNext
              create
              dirtyFields={dirtyFields}
              type="button"
              onClick={handleSubmit(onSubmit)}
              languageGB={languageGB}
              loading={isSubmitting}
              disabled={isSubmitting}
            />
          )}
        </>
      }
    >
      <Form noPadding onSubmit={handleSubmit(onSubmit)}>
        <SimpleGrid columns={columnsForm.fourColumns} gap={6}>
          <Controller
            name="account_uuid"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.form.fields.account}
                placeholder={text.form.placeholders.account}
                service={listAccounts}
                mapOptions={(item: AccountListItem) => ({
                  label: `${item.bank} — ${item.agency}/${item.account}`,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? undefined}
                onChange={(option: any) => field.onChange(option ?? null)}
                error={error?.message}
                isRequired
                isDisabled={!canSave}
              />
            )}
          />

          {/* Display-only — DTO do backend não tem `type`/`type_category`
              (fixados pela Action, contrato de API §6/§9). Fora do
              `register()`/`control`, nunca vai ao payload (Risco #1). */}
          <Input
            label={text.form.fields.type}
            name="type_display"
            value={text.form.fixedValues.type}
            disabled
            readOnly
          />
          <Input
            label={text.form.fields.typeCategory}
            name="type_category_display"
            value={text.form.fixedValues.typeCategory}
            disabled
            readOnly
          />

          <Controller
            name="proprietary_uuid"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <SelectCombobox
                name={field.name}
                label={text.form.fields.proprietary}
                placeholder={text.form.placeholders.proprietary}
                options={proprietaryOptions}
                loading={proprietariesQuery.isLoading}
                value={field.value ?? null}
                onChange={(option) => field.onChange(option ?? null)}
                error={error?.message}
                isRequired
                disabled={!canSave}
              />
            )}
          />
        </SimpleGrid>

        <SimpleGrid columns={columnsForm.threeColumns} gap={6} mt={6}>
          <Controller
            name="date"
            control={control}
            render={({ field }) => (
              <DateInput
                label={text.form.fields.date}
                value={field.value ?? null}
                onChange={(v) => field.onChange(v ?? '')}
                error={errors.date?.message}
                isRequired
                disabled={!canSave}
              />
            )}
          />

          <Controller
            name="value"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <NumberInput
                name={field.name}
                label={text.form.fields.value}
                value={field.value ?? null}
                onValueChange={(value) => field.onChange(value)}
                allowDot
                decimalPlaces={2}
                error={error?.message}
                isRequired
                disabled={!canSave}
              />
            )}
          />

          <Controller
            name="interest"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <NumberInput
                name={field.name}
                label={text.form.fields.interest}
                value={field.value ?? null}
                onValueChange={(value) => field.onChange(value)}
                allowDot
                decimalPlaces={2}
                error={error?.message}
                disabled={!canSave}
              />
            )}
          />
        </SimpleGrid>

        <SimpleGrid columns={columnsForm.twoColumns} gap={6} mt={6}>
          <Input
            label={text.form.fields.document}
            placeholder={text.form.placeholders.document}
            maxLength={100}
            {...register('document')}
            error={errors.document?.message}
            disabled={!canSave}
          />
          <Input
            label={text.form.fields.note}
            placeholder={text.form.placeholders.note}
            maxLength={40}
            {...register('note')}
            error={errors.note?.message}
            disabled={!canSave}
          />
        </SimpleGrid>

        <Box mt={6}>
          <ApportionmentsSection
            fields={fields}
            control={control}
            errors={errors}
            onAdd={() =>
              // Correção C1 — nova linha já nasce com a Categoria
              // pré-selecionada quando há exatamente 1 opção aplicável
              // (`singleCategoryOption`); `null` nos demais casos (0 ou >1
              // opções), preservando o comportamento anterior do Select.
              append({
                financial_category_uuid: singleCategoryOption,
                cost_center_uuid: null,
                value: null,
              })
            }
            onRemove={remove}
            canSave={canSave}
            totalItems={totalItems}
            isSumComplete={isSumComplete}
            text={text}
            categoryOptionsLoading={categoryOptionsQuery.isLoading}
            singleCategoryOption={singleCategoryOption}
          />
        </Box>
      </Form>
    </FormContainer>
  );
}

// -----------------------------------------------------------------------------
// ApportionmentsSection (TASK-FE-031-37) — seção de Rateio, componente-irmão
// NO MESMO ARQUIVO (mirror da decisão estrutural de
// `CentroCusto/CreateOrUpdateCentroCusto.tsx` — `useFieldArray` fica no
// componente PAI, a seção recebe `fields/append/remove` via props).
// Adaptação de 2 colunas (Centro de Custo + percentual) para 3 (Categoria +
// Centro de Custo + Valor) — sem precedente visual direto no design system
// (contrato §1, UX-GAP não-bloqueante), reproduz a MESMA estrutura de `Box`
// com borda já usada pelo rateio de Centro de Custo.
// -----------------------------------------------------------------------------

interface ApportionmentsSectionProps {
  fields: FieldArrayWithId<OpenMovementFormType, 'items', 'id'>[];
  control: Control<OpenMovementFormType>;
  errors: FieldErrors<OpenMovementFormType>;
  onAdd: () => void;
  onRemove: UseFieldArrayRemove;
  canSave: boolean;
  totalItems: number;
  isSumComplete: boolean;
  text: ModuleOpenMovements['openMovement'];
  /** Correção C1 — trava "Adicionar Item" até saber se há categoria única. */
  categoryOptionsLoading: boolean;
  /** Correção C1 — quando não-nulo, a Categoria de cada linha é read-only. */
  singleCategoryOption: Option<string> | null;
}

function ApportionmentsSection({
  fields,
  control,
  errors,
  onAdd,
  onRemove,
  canSave,
  totalItems,
  isSumComplete,
  text,
  categoryOptionsLoading,
  singleCategoryOption,
}: ApportionmentsSectionProps) {
  const apportionmentsText = text.form.apportionments;
  const isDisabled = !canSave;
  // Erro de nível de ARRAY (`.min(1)` — array vazio) — `errors.items` é
  // `Merge<FieldError, ...[]>` no react-hook-form: tem `.message` próprio E
  // é indexável por linha (mirror `ApportionmentsSection` de CentroCusto).
  const arrayError = (errors.items as any)?.message;

  const findParamsFromSearch = useMemo(
    () => (search: string | { search: string }) => ({
      search: typeof search === 'string' ? search : search.search,
    }),
    []
  );

  return (
    <Box bg="bg.muted" border="1px solid" borderColor="border.subtle" borderRadius="lg" p={4}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={3} mb={4}>
        <Box>
          <Text fontSize="sm" fontWeight="semibold">
            {apportionmentsText.sectionTitle}
          </Text>
          <Text fontSize="xs" color="fg.muted" mt={0.5}>
            {apportionmentsText.sectionHint}
          </Text>
        </Box>

        {fields.length > 0 && (
          <Flex align="center" gap={2}>
            <Text fontSize="sm" color="fg.muted">
              {apportionmentsText.sumLabel}:
            </Text>
            <Badge colorPalette={isSumComplete ? 'green' : 'orange'} variant="subtle">
              {formatCurrencyBRL(totalItems)}
            </Badge>
            {!isSumComplete && (
              <Text fontSize="xs" color="fg.muted">
                ({apportionmentsText.sumHint})
              </Text>
            )}
          </Flex>
        )}
      </Flex>

      {fields.length === 0 ? (
        <Box py={2}>
          <Text fontSize="sm" color={arrayError ? 'fg.error' : 'fg.muted'}>
            {arrayError || apportionmentsText.emptyTitle}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={4} mb={4}>
          {fields.map((field, index) => (
            // CORREÇÃO PÓS-E2E (rodada 3, D3 — correcao-e2e-front-rodada-3.md):
            // `align="flex-end"` (base da linha) fazia QUALQUER mensagem de
            // ERRO de validação (não só o helper da rodada 2 — Categoria,
            // Centro de Custo ou Valor) desalinhar a linha, porque a coluna
            // com erro cresce (label + input + `ErrorText` do `Field`) e as
            // demais colunas — mais curtas — eram empurradas para baixo para
            // alinhar a BASE. `align="flex-start"` ancora as colunas pelo
            // TOPO (label/input sempre no mesmo Y, a mensagem de erro só
            // estende a coluna PARA BAIXO, sem mexer nas outras) — estável
            // com 0, 1 ou várias colunas em erro simultaneamente. A lixeira
            // (sem label acima) ganha um spacer invisível do tamanho exato
            // de um label real (abaixo) para ficar alinhada ao INPUT, não ao
            // topo/base da coluna.
            <Flex key={field.id} gap={3} align="flex-start" wrap="wrap">
              <Box flex="1" minW="220px">
                {/* Correção C1 — categoria ÚNICA aplicável: campo read-only,
                    fora da interação do Select (valor já vem pré-preenchido
                    no `append`, mirror do padrão display-only "Tipo"/"Tp.
                    Categoria" deste mesmo arquivo). 0 ou >1 opções: Select
                    original, restrito ao mesmo filtro (`search`), pesquisável. */}
                {singleCategoryOption ? (
                  // CORREÇÃO PÓS-E2E (rodada 2, D2 — correcao-e2e-front-
                  // rodada-2.md): `helperText` aqui acrescentava uma linha
                  // SÓ nesta coluna — com `align="flex-end"` na Flex da
                  // linha (mesmo padrão de `CentroCusto/
                  // CreateOrUpdateCentroCusto.tsx`, que NÃO tem helper e por
                  // isso nunca teve esse desalinho), a coluna Categoria
                  // ficava mais alta que Centro de Custo/Valor, jogando seu
                  // label/input pra cima e "torcendo" a linha. `tooltip`
                  // (ícone inline no label, sem altura extra — mesmo padrão
                  // já usado por `Select`/`Textarea`/`SelectAsyncPaginate`/
                  // `SelectCombobox`, só faltava em `Input`) resolve sem
                  // mexer no `align` das 3 colunas.
                  <Input
                    label={apportionmentsText.fields.category}
                    name={`items.${index}.financial_category_uuid_display`}
                    value={singleCategoryOption.label}
                    tooltip={apportionmentsText.categoryLockedHelper}
                    disabled
                    readOnly
                    isRequired
                  />
                ) : (
                  <Controller
                    name={`items.${index}.financial_category_uuid`}
                    control={control}
                    render={({ field: rowField, fieldState }) => (
                      <SelectAsyncPaginate
                        name={rowField.name}
                        label={apportionmentsText.fields.category}
                        placeholder={apportionmentsText.placeholders.category}
                        service={(params: any) =>
                          listFinancialCategoryOptions({
                            ...params,
                            class: 2,
                            bank_movement_scoped: BANK_MOVEMENT_SCOPED,
                            search: SALDO_INICIAL_CATEGORY_SEARCH,
                          })
                        }
                        mapOptions={(item: FinancialCategoryOption) => ({
                          label: `${item.code} — ${item.description}`,
                          value: item.uuid,
                        })}
                        findParams={findParamsFromSearch}
                        value={rowField.value ?? undefined}
                        onChange={(option: any) => rowField.onChange(option ?? null)}
                        error={fieldState.error?.message}
                        isRequired
                        isDisabled={isDisabled}
                      />
                    )}
                  />
                )}
              </Box>

              <Box flex="1" minW="220px">
                <Controller
                  name={`items.${index}.cost_center_uuid`}
                  control={control}
                  render={({ field: rowField, fieldState }) => (
                    <SelectAsyncPaginate
                      name={rowField.name}
                      label={apportionmentsText.fields.costCenter}
                      placeholder={apportionmentsText.placeholders.costCenter}
                      // Sem auto-sugestão por categoria — o
                      // `/get-cost-centers-by-category` do legado não tem
                      // equivalente no fork (LACUNA registrada no contrato,
                      // §14/§16 — usuário escolhe os dois manualmente).
                      service={(params: any) =>
                        listCostCenterOptions({ ...params, only_analytic: true })
                      }
                      mapOptions={(item: CostCenterRef) => ({
                        label: `${item.code} — ${item.description}`,
                        value: item.uuid,
                      })}
                      findParams={findParamsFromSearch}
                      value={rowField.value ?? undefined}
                      onChange={(option: any) => rowField.onChange(option ?? null)}
                      error={fieldState.error?.message}
                      isRequired
                      isDisabled={isDisabled}
                    />
                  )}
                />
              </Box>

              <Box w={{ base: 'full', sm: '180px' }}>
                <Controller
                  name={`items.${index}.value`}
                  control={control}
                  render={({ field: rowField, fieldState }) => (
                    <NumberInput
                      name={rowField.name}
                      label={apportionmentsText.fields.value}
                      value={rowField.value ?? null}
                      onValueChange={(value) => rowField.onChange(value)}
                      min={0.01}
                      allowDot
                      decimalPlaces={2}
                      error={fieldState.error?.message}
                      isRequired
                      disabled={isDisabled}
                    />
                  )}
                />
              </Box>

              <Flex direction="column" gap="1.5">
                {/* Spacer invisível — mesma marcação do label real do `Field`
                    (`Flex as="label" alignItems="center" fontSize="14px"`,
                    mesmo `gap="1.5"` do `ChakraField.Root`) SÓ para reservar,
                    de forma exata, a mesma altura de linha de label das
                    outras 3 colunas. `visibility="hidden"` remove do fluxo
                    de acessibilidade (não é lido por leitor de tela) — o
                    nome acessível real do botão continua vindo do
                    `aria-label` abaixo. */}
                <Flex alignItems="center" fontSize="14px" visibility="hidden">
                  {apportionmentsText.removeRowLabel}
                </Flex>
                <IconButtonTable
                  aria-label={apportionmentsText.removeRowLabel}
                  mensegerTooltip={apportionmentsText.removeRowLabel}
                  size="sm"
                  color="red.500"
                  variant="ghost"
                  disabled={isDisabled}
                  onClick={() => onRemove(index)}
                >
                  <Icon as={FiTrash2} />
                </IconButtonTable>
              </Flex>
            </Flex>
          ))}
        </Flex>
      )}

      <Button
        title={apportionmentsText.addRowLabel}
        icon={FiPlus as ElementType}
        variant="outline"
        size="sm"
        onClick={onAdd}
        // Correção C1 — trava "Adicionar Item" enquanto a busca da
        // categoria única ainda está em voo, evita a corrida de uma linha
        // nascer com `financial_category_uuid: null` por engano.
        disabled={isDisabled || categoryOptionsLoading}
      />
    </Box>
  );
}
