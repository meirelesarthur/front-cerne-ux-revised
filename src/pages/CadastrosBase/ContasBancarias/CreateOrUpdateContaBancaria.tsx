// src/pages/CadastrosBase/ContasBancarias/CreateOrUpdateContaBancaria.tsx
// -----------------------------------------------------------------------------
// Tela de CRIAÇÃO e EDIÇÃO de CONTA BANCÁRIA (Account — Cadastros Base /
// Financeiros, execução 025). MESMO componente para os dois casos (mirror
// PlanAccount/CostCenter — `isValidGuid(accountId)` decide o modo), rotas
// `/cadastros-base/contas-bancarias/novo` e `/cadastros-base/contas-bancarias/:accountId`
// (wiring real de rota em TASK-FE-563, NÃO tocado por esta Tarefa).
//
// TASK-FE-565 cobre a seção "Informações Gerais" completa
// (banco/agência/conta/tipo/código/descrição/limite/saldo-somente-leitura/
// ativo/livro-caixa/fornecedor/conta-investimento-vinculada), guardada por
// `canSave` (`accounts_create`/`accounts_edit`).
//
// TASK-FE-566 (esta Tarefa) acrescenta "Emissão de Boleto" (is_ticket +
// bank_contract/bank_agreement/type_cnab condicionais + CheckboxListField de
// Proprietários) e "Fazendas Vinculadas" (CheckboxListField de farm_uuids).
//
// ✅ GAP-FE-155 RESOLVIDO (TASK-FE-567): `GET /proprietaries/options`
// (`TASK-BE-568`, validado pelo Tester de API com prova de ciclo fechado —
// o `uuid` devolvido é aceito por `POST /accounts` com `is_ticket=true` →
// 201) alimenta o `CheckboxListField` de Proprietários com dado REAL,
// mirror EXATO de "Fazendas Vinculadas" (`useProprietariesList`/
// `proprietariesQuery`, análogo a `useFarmsList`/`farmsQuery`). Lista
// vazia/curta para um tenant é um estado de UI honesto (proprietário órfão
// do pivô `proprietary_tenant` — achado do Tester de API, 49% da tabela
// `proprietaries`, pendência de backfill fora do escopo desta Tarefa), NÃO
// um erro — resolvido pelo `emptyLabel` do próprio `CheckboxListField`;
// falha real de rede/permissão usa `errorLabel`/`onRetry`.
//
// ⚠️ CORREÇÃO (presence-aware de array, achado real desta Tarefa): RHF
// 7.51.2 NÃO marca `dirtyFields.<campo-array>` como um boolean simples para
// um `string[]` puro (não-`useFieldArray`) — `getDirtyFieldsFromDefaultValues`
// (react-hook-form/dist/index.esm.mjs) RECURSA para dentro do array e
// devolve um ARRAY de booleans por índice (`[false,false]`/`[true,true]`),
// nunca `undefined`/`true`/`false` no nível do campo. Um array (mesmo
// `[false,false]` ou `[]`) é sempre um objeto TRUTHY em JS — `!!dirtyFields.
// farm_uuids` seria `true` SEMPRE que o array-default não for vazio, mesmo
// sem o usuário tocar no campo (mesma classe de armadilha já resolvida por
// CostCenter ao decidir "sempre enviar `category_uuids`", mas aqui o
// contrato exige presence-aware de verdade — sempre enviar quebraria D8).
// Fix mínimo (mirror `numbersDirty`/`farmsDirty` de `CreateOrUpdateEmissor.tsx`
// — flag própria fora do `dirtyFields`, setada no `onChange` do
// `CheckboxListField`, resetada no MESMO guard de `fillForm`): 2 `useState`
// locais (`proprietaryUuidsTouched`/`farmUuidsTouched`) substituem
// `!!dirtyFields.proprietary_uuids`/`!!dirtyFields.farm_uuids` no `onSubmit`.
// `account-service.ts`/`account-schema.ts`/`@types` NÃO foram alterados —
// só este arquivo (a chamada de `tryPersistAccount` já aceitava um boolean
// arbitrário em `dirtyProprietaryUuids`/`dirtyFarmUuids`, vindo de QUALQUER
// fonte que prove "o usuário mexeu", não necessariamente `dirtyFields`).
//
// Referência UX: `GB.Cerne.UX@305e10e —
// src/pages/cadastros/contas-bancarias/ContaBancariaCadastro.tsx`, COM
// correção de fidelidade nos 3 pontos em que o mock diverge do schema real
// (Account-FrontEnd-contrato.md §8):
//   - `banco` — SelectAsyncPaginate real sobre `GET /banks` (valor = NOME,
//     tolera fora do catálogo em edição), NÃO o código FEBRABAN estático;
//   - `contaInvestimentoVinculadaId` — restrito a `type=I` (Aplicação
//     Financeira) apenas, NÃO `{aplicacao, caixa}` como o mock;
//   - `provider_uuid` (Fornecedor) — campo NOVO, sem precedente no mock,
//     adaptação com a linguagem visual já estabelecida neste arquivo (mesmo
//     racional já usado por CostCenter para a seção de Rateio).
//
// Campos mascarados/numéricos SEMPRE via `Controller` (nunca `register()`
// puro) — ARMADILHA conhecida do domínio (mordeu Fazendas/Pessoas na
// execução 024): aqui isso vale só para `limit` (`MaskedInput kind="currency"`,
// migrado de `MoneyInput` na esteira 001/Wave 2 — algoritmo idêntico). `agency`/
// `account`/`code` NÃO têm máscara nesta versão (Account-FrontEnd-contrato.md
// "Riscos" #4 — nenhuma fonte real de regex/máscara, YAGNI confirmado pelo
// dev) — `Input` comum via `register()`, decisão JÁ registrada em
// `validations/schemas/CadastrosBase/account-schema.ts`, não uma omissão.
//
// `balance` — NUNCA em `useForm`/payload (D5 do contrato de API): só `Text`
// estático lido de `accountData.balance`, mirror exato do mock
// (`ContaBancariaCadastro.tsx:254-266`). `limit`/`balance` chegam como
// STRING do backend (decimal cast sem `(float)` no Resource) — `Number(...)`
// sempre antes de formatar/comparar.
//
// Guard de fazenda ativa (Account-contrato.md §4/D2, `farm.context`
// ESTRITO): mesmo padrão de `Embalagens/CreateOrUpdateEmbalagem.tsx` — a
// query de DETALHE (edição) só dispara com `hasFarm` verdadeiro; sem fazenda
// ativa E em edição, EmptyState informativo no lugar do form. CRIAÇÃO
// continua renderizando o form normalmente (403 do backend no submit é
// aceitável, mesmo racional de outros formulários farm-scoped).
//
// Guard de dirty-fields no `fillForm` — mirror `!isEmpty(dirtyFields) ||
// resetForce` de CostCenter/Package, para não sobrescrever edição do usuário
// em refetch/refocus. `isEmpty()` retorna `true` quando HÁ chaves (armadilha
// ERRO-FE-001, 5+ recorrências) — o `!` é OBRIGATÓRIO nesta fórmula.
// -----------------------------------------------------------------------------

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Box, EmptyState, Flex, Icon, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';
import { FiCreditCard } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { Form } from '@/components/Form';
import { CheckboxListField } from '@/components/Form/CheckboxListField';
import { Input } from '@/components/Form/Input';
import { MaskedInput } from '@/components/Form/MaskedInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import {
  accountCnabOptions,
  accountTypeOptions,
} from '@/constants/cadastrosBase/account/account-status';
import { columnsForm } from '@/constants/coluns-form';
import { statusOptions } from '@/constants/options/statusOptions';
import { queryKey } from '@/constants/query-key';

import { accountSchemaResolver } from '@/validations/schemas/CadastrosBase/account-schema';

import { listBankOptions } from '@/services/v2/Banks/bank-service';
import {
  listAccounts,
  tryPersistAccount,
} from '@/services/v2/CadastrosBase/Account/account-service';
import type { ListAccountsParams } from '@/services/v2/CadastrosBase/Account/account-service';
import { listProviders } from '@/services/v2/CadastrosBase/Provider/provider-service';

import type { Option } from '@/@types/option';
import type { ResponsePagination } from '@/@types/response-api';
import type { BankOptionItem } from '@/@types/v2/Banks';
import type {
  AccountDetail,
  AccountForm as AccountFormType,
  AccountListItem,
  AccountTypeCode,
} from '@/@types/v2/CadastrosBase/account';
import type { ProviderListItem } from '@/@types/v2/CadastrosBase/provider';

import { useAccountForm, useFarmsList, useProprietariesByFarms } from './useAccounts';

// Formatação monetária pt-BR — mesma resolução em poucas linhas já usada em
// `index.tsx` (nenhum util global de currency existe no fork, Regra F) —
// `value` sempre a STRING crua do backend (`decimal:2` sem `(float)` cast).
function formatCurrencyBRL(value: string): string {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function CreateOrUpdateContaBancaria() {
  const { accountId } = useParams<{ accountId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can, hasFarm } = usePermissions();

  // É edição quando existe um GUID válido na rota ("novo" não casa com
  // `/:accountId` — rota irmã distinta, wiring real em TASK-FE-563).
  const isEditing = isValidGuid(accountId);

  // Guard de navegação: `accountId` presente mas NÃO é um GUID válido (URL
  // adulterada) não deve renderizar um form "fantasma" — redireciona para a
  // listagem (mesmo racional de CreateOrUpdateKind.tsx/CreateOrUpdateEmbalagem.tsx).
  useEffect(() => {
    if (accountId && !isValidGuid(accountId)) {
      navigate('/cadastros-base/contas-bancarias', { replace: true });
    }
  }, [accountId, navigate]);

  const text = languageGB.accounts.account;

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<AccountFormType>({
    mode: 'onChange',
    resolver: accountSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      bank: null,
      agency: '',
      account: '',
      type: '',
      code: '',
      description: '',
      limit: null,
      is_enabled: true,
      use_cash_book: true,
      provider_uuid: null,
      investment_account_uuid: null,
      // Emissão de Boleto/Vínculos (TASK-FE-566) — defaults fiéis à
      // semântica do backend: `is_ticket=false` (nada de boleto exigido),
      // demais campos nulos/vazios.
      is_ticket: false,
      bank_contract: null,
      bank_agreement: null,
      type_cnab: null,
      proprietary_uuids: [],
      farm_uuids: [],
    },
  });

  // ---- Estado auxiliar dos 2 CheckboxListField (TASK-FE-566) --------------
  // Busca CLIENT-SIDE (conjuntos pequenos por tenant, sem paginação real
  // necessária — mirror Atividades/Operações/Emissores) + flag de "usuário
  // mexeu NESTA sessão" que substitui `dirtyFields` para os 2 campos-array
  // (ver ⚠️ CORREÇÃO no cabeçalho do arquivo — landmine de RHF 7.51.2).
  const [farmSearchValue, setFarmSearchValue] = useState('');
  const [proprietarySearchValue, setProprietarySearchValue] = useState('');
  const [farmUuidsTouched, setFarmUuidsTouched] = useState(false);
  const [proprietaryUuidsTouched, setProprietaryUuidsTouched] = useState(false);

  function fillForm(data: AccountDetail, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      // Reidratação de sessão (novo registro carregado/refetch) — reseta as
      // flags de "usuário mexeu" junto com o resto do form, mesmo guard.
      setFarmUuidsTouched(false);
      setProprietaryUuidsTouched(false);
      reset({
        // Banco tolerante a fora-do-catálogo (Riscos #1): Option montado
        // DIRETO de `data.bank` (nome cru), sem validar contra nenhuma
        // lista carregada — o SelectAsyncPaginate só exibe o que recebe.
        bank: data.bank ? { label: data.bank, value: data.bank } : null,
        agency: data.agency,
        account: data.account,
        type: data.type.value,
        code: data.code,
        description: data.description,
        // `limit` chega como STRING (decimal cast) — `Number(...)` antes de
        // guardar no form (`MaskedInput kind="currency"` trabalha com número puro).
        limit: Number(data.limit),
        is_enabled: !!data.is_enabled,
        use_cash_book: !!data.use_cash_book,
        // PREFILL sem GET extra — `provider`/`investment_account` já vêm
        // aninhados no `AccountDetail` (Resource carrega ambos no show()).
        provider_uuid: data.provider
          ? { label: data.provider.name, value: data.provider.uuid }
          : null,
        investment_account_uuid: data.investment_account
          ? { label: data.investment_account.description, value: data.investment_account.uuid }
          : null,
        is_ticket: !!data.is_ticket,
        bank_contract: data.bank_contract ?? null,
        bank_agreement: data.bank_agreement ?? null,
        type_cnab: data.type_cnab?.value ?? null,
        proprietary_uuids: (data.proprietaries ?? []).map((item) => item.uuid),
        farm_uuids: (data.farms ?? []).map((item) => item.uuid),
      });
    }
  }

  // Guard hasFarm (Account-contrato.md §4/D2) — a query de detalhe só
  // dispara com fazenda ativa selecionada (ver useAccounts.tsx/useAccountForm).
  const accountQuery = useAccountForm({
    registrationId: isEditing ? accountId : undefined,
    fillForm,
    enabled: hasFarm,
  });

  const isLoading = isEditing && hasFarm && checkLoadingStatus([accountQuery as any]);
  const accountData = accountQuery.data;

  // "Emite Boleto" — governa obrigatoriedade/disabled dos 3 campos internos
  // (§5.2 do contrato de tela); Proprietários NÃO fica desabilitado por
  // `is_ticket` (a tabela §5.2 só marca "disabled se !is_ticket" nos outros
  // 3 campos, fidelidade estrita ao texto do contrato).
  const watchedIsTicket = watch('is_ticket');

  // "Fazendas Vinculadas" — dado REAL via `listFarms()` (useFarmsList,
  // mirror Emissores). Busca CLIENT-SIDE sobre a lista carregada.
  const farmsQuery = useFarmsList();
  const farmItems = useMemo(() => {
    const all = farmsQuery.data ?? [];
    const filtered = farmSearchValue
      ? all.filter((farm) => farm.description.toLowerCase().includes(farmSearchValue.toLowerCase()))
      : all;
    return filtered.map((farm) => ({ value: farm.uuid, label: farm.description }));
  }, [farmsQuery.data, farmSearchValue]);

  // "Proprietários" (TASK-FE-567, fecha GAP-FE-155) — dado REAL via
  // `GET /proprietaries/options` (useProprietariesList, mirror EXATO do
  // bloco de Fazendas acima). Busca CLIENT-SIDE sobre a lista carregada;
  // lista vazia/curta (proprietário órfão do pivô `proprietary_tenant`) é um
  // estado de UI honesto, tratado via `emptyLabel` no CheckboxListField, não
  // um erro.
  // UT-000723 — opções = união dos proprietários das FAZENDAS MARCADAS no
  // próprio form (`farm_uuids`). Seleções já feitas (salvas ou de fazenda
  // depois desmarcada) NUNCA somem: continuam na lista enquanto selecionadas.
  const watchedFarmUuids = watch('farm_uuids');
  const selectedFarmUuids = useMemo(() => watchedFarmUuids ?? [], [watchedFarmUuids]);
  const watchedProprietaryUuids = watch('proprietary_uuids');
  const proprietariesQuery = useProprietariesByFarms(selectedFarmUuids);
  const proprietaryLabelCache = useRef(new Map<string, string>());
  const proprietaryItems = useMemo(() => {
    const cache = proprietaryLabelCache.current;
    (accountQuery.data?.proprietaries ?? []).forEach((item) => cache.set(item.uuid, item.name));
    proprietariesQuery.data.forEach((item) => cache.set(item.uuid, item.label));
    const merged = new Map<string, string>();
    proprietariesQuery.data.forEach((item) => merged.set(item.uuid, item.label));
    (watchedProprietaryUuids ?? []).forEach((uuid) => {
      if (!merged.has(uuid)) merged.set(uuid, cache.get(uuid) ?? uuid);
    });
    const all = Array.from(merged, ([value, label]) => ({ value, label }));
    return proprietarySearchValue
      ? all.filter((item) =>
          item.label.toLowerCase().includes(proprietarySearchValue.toLowerCase())
        )
      : all;
  }, [proprietariesQuery.data, watchedProprietaryUuids, accountQuery.data, proprietarySearchValue]);

  // Permissões REAIS do backend (accounts_*, já cadastradas em
  // PermissionTree.php:530-540 — Account-contrato.md D10/§13). Sem flag de
  // autorização por item no `AccountResource` — permissão GLOBAL basta
  // (mesmo padrão de GruposProduto/Vacinas/Embalagens).
  const canSave = isEditing ? can('accounts_edit') : can('accounts_create');

  // Conta Investimento Vinculada — `SelectAsyncPaginate` sobre `listAccounts`
  // com `type` FIXO em 'I' (Riscos #2 da Tarefa), excluindo o próprio uuid em
  // edição via filtro CLIENT-SIDE pós-fetch (mirror
  // `listCostCentersForApportionment` — o endpoint não tem parâmetro de
  // exclusão para confiar).
  const listInvestmentAccounts = useCallback(
    async (params: ListAccountsParams): Promise<ResponsePagination<AccountListItem[]>> => {
      const response = await listAccounts({ ...params, type: 'I' });
      if (!isEditing || !accountId) return response;
      return {
        ...response,
        data: {
          ...response.data,
          items: response.data.items.filter((item) => item.uuid !== accountId),
        },
      };
    },
    [isEditing, accountId]
  );

  const accountMutation = useRequest({
    asyncFunction: tryPersistAccount,
    entityName: text.singularLabel,
    queryKey: queryKey.cadastrosBase.accounts,
    queryKey2: queryKey.cadastrosBase.account,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  // Guard `onSubmit` — fórmula VERIFICADA (`!isEmpty(dirtyFields)`, NUNCA sem
  // o `!`: `utils/isEmpty()` retorna `true` quando HÁ chaves — armadilha
  // ERRO-FE-001, 5+ recorrências). `hasArrayChange` entra como fator extra
  // (mirror `!hasArrayChange` de `CreateOrUpdateEmissor.tsx`) — os 2 campos-
  // array usam a flag própria (`*Touched`), não `dirtyFields` (ver ⚠️
  // CORREÇÃO no cabeçalho do arquivo), então uma edição SÓ neles não pode
  // ser descartada pelo guard de `isEmpty(dirtyFields)`.
  const hasArrayChange = farmUuidsTouched || proprietaryUuidsTouched;

  async function onSubmit(data: AccountFormType) {
    if (isEditing && !isEmpty(dirtyFields) && !hasArrayChange) {
      navigate(-1);
    } else {
      await accountMutation.mutateAsync({
        data,
        isEditing,
        accountUuid: accountId,
        // Presence-aware (D8/§6) — `dirtyProprietaryUuids`/`dirtyFarmUuids`
        // vêm das flags locais `*Touched` (setadas no `onChange` do
        // `CheckboxListField`), NÃO de `dirtyFields.proprietary_uuids`/
        // `dirtyFields.farm_uuids` (RHF marca array-fields com um ARRAY de
        // booleans por índice, sempre truthy como objeto — ver ⚠️ CORREÇÃO
        // no cabeçalho do arquivo).
        dirtyProprietaryUuids: proprietaryUuidsTouched,
        dirtyFarmUuids: farmUuidsTouched,
      });
    }
  }

  const isSubmitting = accountMutation.isPending;

  // Sim/Não (Usa no Livro Caixa) — reaproveita `defaltStrings.yes/no`
  // (genérico, já usado por Badges na listagem), Option<boolean> resolvido
  // em poucas linhas (Regra F — sem factory nova para um único campo).
  const yesNoOptions: Option<boolean>[] = [
    { value: true, label: languageGB.defaltStrings.yes },
    { value: false, label: languageGB.defaltStrings.no },
  ];

  // Sem fazenda ativa E em edição: não há como buscar o registro a editar —
  // EmptyState informativo em vez do form (mesmo racional de
  // `Embalagens/CreateOrUpdateEmbalagem.tsx`). CRIAÇÃO continua renderizando
  // o form normalmente.
  if (isEditing && !hasFarm) {
    return (
      <FormContainer title={text.form.title.edit}>
        <EmptyState.Root>
          <EmptyState.Content>
            <EmptyState.Indicator>
              <Icon as={FiCreditCard} boxSize={8} color="fg.muted" />
            </EmptyState.Indicator>
            <VStack textAlign="center" gap={1}>
              <EmptyState.Title>{text.list.noFarmSelected.title}</EmptyState.Title>
              <EmptyState.Description>
                {text.list.noFarmSelected.description}
              </EmptyState.Description>
            </VStack>
          </EmptyState.Content>
        </EmptyState.Root>
      </FormContainer>
    );
  }

  return (
    <FormContainer
      title={isEditing ? text.form.title.edit : text.form.title.create}
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
              create={!isEditing}
              dirtyFields={dirtyFields}
              type="button"
              onClick={handleSubmit(onSubmit)}
              languageGB={languageGB}
              loading={isSubmitting}
              disabled={isSubmitting || isLoading}
            />
          )}
        </>
      }
    >
      <Form noPadding onSubmit={handleSubmit(onSubmit)}>
        <Text
          fontSize="xs"
          fontWeight="semibold"
          color="fg.muted"
          textTransform="uppercase"
          letterSpacing="wide"
          mb={4}
        >
          {text.form.sections.general}
        </Text>

        {/* Linha 1: Banco | Agência | Conta */}
        <SimpleGrid columns={columnsForm.default} gap={6}>
          <Controller
            name="bank"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.form.fields.bank}
                placeholder={text.form.placeholders.bank}
                // Riscos #1: `mapOptions` guarda o NOME como valor (D4 do
                // contrato de API), NUNCA uuid/code — mirror exato do
                // catálogo `GET /banks/options` (endpoint SEM gate de
                // `banks_view`; `BankOptionItem` também tem `name`, então a
                // troca preserva o contrato D4 sem perda de dado).
                service={listBankOptions}
                mapOptions={(item: BankOptionItem) => ({ label: item.name, value: item.name })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? undefined}
                onChange={(option: any) => field.onChange(option ?? null)}
                error={errors.bank?.message as string | undefined}
                isRequired
                isDisabled={!canSave || isLoading}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Input
            label={text.form.fields.agency}
            placeholder={text.form.placeholders.agency}
            maxLength={6}
            {...register('agency')}
            error={errors.agency?.message}
            isRequired
            loading={isLoading}
            disabled={!canSave}
          />

          <Input
            label={text.form.fields.account}
            placeholder={text.form.placeholders.account}
            maxLength={20}
            {...register('account')}
            error={errors.account?.message}
            isRequired
            loading={isLoading}
            disabled={!canSave}
          />
        </SimpleGrid>

        {/* Linha 2: Tipo | Código | Usa no Livro Caixa | Ativo */}
        <SimpleGrid columns={columnsForm.default} gap={6} mt={6}>
          <Controller
            name="type"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <Select
                label={text.form.fields.type}
                placeholder={text.form.placeholders.type}
                name={name}
                value={
                  accountTypeOptions.options(languageGB).find((o) => o.value === value) ?? null
                }
                onChange={(opt: Option<AccountTypeCode> | null) => onChange(opt?.value ?? '')}
                options={accountTypeOptions.options(languageGB)}
                error={error?.message}
                isRequired
                isDisabled={!canSave}
                loading={isLoading}
                noClearable
              />
            )}
          />

          <Input
            label={text.form.fields.code}
            placeholder={text.form.placeholders.code}
            maxLength={4}
            {...register('code')}
            error={errors.code?.message}
            isRequired
            loading={isLoading}
            disabled={!canSave}
          />

          <Controller
            name="use_cash_book"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.form.fields.useCashBook}
                name={name}
                value={yesNoOptions.find((o) => o.value === value) ?? null}
                onChange={(opt: Option<boolean> | null) => onChange(!!opt?.value)}
                options={yesNoOptions}
                isRequired
                isDisabled={!canSave}
                loading={isLoading}
                noClearable
              />
            )}
          />

          <Controller
            name="is_enabled"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.form.fields.isEnabled}
                name={name}
                value={statusOptions.options(languageGB).find((o) => o.value === value) ?? null}
                onChange={(opt: Option<boolean> | null) => onChange(!!opt?.value)}
                options={statusOptions.options(languageGB)}
                isRequired
                isDisabled={!canSave}
                loading={isLoading}
                noClearable
              />
            )}
          />
        </SimpleGrid>

        {/* Linha 3: Descrição (full width) */}
        <SimpleGrid columns={columnsForm.default} gap={6} mt={6}>
          <Input
            label={text.form.fields.description}
            placeholder={text.form.placeholders.description}
            maxLength={40}
            {...register('description')}
            error={errors.description?.message}
            isRequired
            loading={isLoading}
            disabled={!canSave}
          />
        </SimpleGrid>

        {/* Linha 4: Limite | Saldo (somente-leitura, só em edição) */}
        <SimpleGrid columns={columnsForm.twoColumns} gap={6} mt={6}>
          <Controller
            name="limit"
            control={control}
            render={({ field, fieldState }) => (
              <MaskedInput
                kind="currency"
                name={field.name}
                label={text.form.fields.limit}
                value={field.value ?? null}
                onValueChange={(value) => field.onChange(value)}
                error={fieldState.error?.message}
                isRequired
                disabled={!canSave || isLoading}
              />
            )}
          />

          {/* Saldo — D5 do contrato de API: NUNCA em `useForm`/payload, só
              texto informativo lido direto de `accountData.balance` (STRING
              crua — `Number(...)` antes de formatar). Mirror exato do mock
              (`ContaBancariaCadastro.tsx:254-266`). */}
          {isEditing && accountData && (
            <Flex direction="column" justify="center" gap={0.5}>
              <Text fontSize="sm" fontWeight="semibold">
                {text.form.fields.balance}: {formatCurrencyBRL(accountData.balance)}
              </Text>
              <Text fontSize="xs" color="fg.muted">
                {text.form.hints.balanceReadOnly}
              </Text>
            </Flex>
          )}
        </SimpleGrid>

        {/* Linha 5: Conta Investimento Vinculada | Fornecedor — Riscos #2/#5
            da Tarefa: 2 SelectAsyncPaginate opcionais, sem precedente visual
            direto no mock (Fornecedor é campo novo; Conta Investimento
            restrita a `type=I`, não `{aplicacao, caixa}`). Agrupados na
            mesma linha por afinidade conceitual (2 vínculos opcionais de
            "Investimento"/"Fornecedor"). */}
        <SimpleGrid columns={columnsForm.twoColumns} gap={6} mt={6}>
          <Controller
            name="investment_account_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.form.fields.investmentAccount}
                placeholder={text.form.placeholders.investmentAccount}
                tooltip={text.form.hints.investmentAccountFilter}
                service={listInvestmentAccounts}
                mapOptions={(item: AccountListItem) => ({
                  label: `${item.code} — ${item.description}`,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? undefined}
                onChange={(option: any) => field.onChange(option ?? null)}
                isDisabled={!canSave || isLoading}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="provider_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.form.fields.provider}
                placeholder={text.form.placeholders.provider}
                service={listProviders}
                mapOptions={(item: ProviderListItem) => ({ label: item.name, value: item.uuid })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? undefined}
                onChange={(option: any) => field.onChange(option ?? null)}
                isDisabled={!canSave || isLoading}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />
        </SimpleGrid>

        {/* ---- Seção: Emissão de Boleto (§5.2, sempre VISÍVEL — só os
            campos internos ficam disabled/não-obrigatórios quando
            !is_ticket, mirror exato do mock) ------------------------------ */}
        <Text
          fontSize="xs"
          fontWeight="semibold"
          color="fg.muted"
          textTransform="uppercase"
          letterSpacing="wide"
          mt={8}
          mb={4}
        >
          {text.form.sections.ticket}
        </Text>
        <SimpleGrid columns={columnsForm.default} gap={6}>
          <Controller
            name="is_ticket"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.form.fields.isTicket}
                name={name}
                value={yesNoOptions.find((o) => o.value === value) ?? null}
                onChange={(opt: Option<boolean> | null) => onChange(!!opt?.value)}
                options={yesNoOptions}
                isRequired
                isDisabled={!canSave}
                loading={isLoading}
                noClearable
              />
            )}
          />

          <Input
            label={text.form.fields.bankContract}
            placeholder={text.form.placeholders.bankContract}
            maxLength={8}
            {...register('bank_contract')}
            error={errors.bank_contract?.message}
            isRequired={watchedIsTicket}
            loading={isLoading}
            disabled={!canSave || !watchedIsTicket}
          />

          <Input
            label={text.form.fields.bankAgreement}
            placeholder={text.form.placeholders.bankAgreement}
            maxLength={8}
            {...register('bank_agreement')}
            error={errors.bank_agreement?.message}
            isRequired={watchedIsTicket}
            loading={isLoading}
            disabled={!canSave || !watchedIsTicket}
          />

          <Controller
            name="type_cnab"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <Select
                label={text.form.fields.typeCnab}
                placeholder={text.form.placeholders.typeCnab}
                name={name}
                value={
                  accountCnabOptions.options(languageGB).find((o) => o.value === value) ?? null
                }
                onChange={(opt: Option<1 | 2> | null) => onChange(opt?.value ?? null)}
                options={accountCnabOptions.options(languageGB)}
                error={error?.message}
                isRequired={watchedIsTicket}
                isDisabled={!canSave || !watchedIsTicket}
                loading={isLoading}
              />
            )}
          />
        </SimpleGrid>

        {/* ---- Seção: Fazendas Vinculadas (§5.3, `farm_uuids`, opcional,
            presence-aware nos 2 verbos) — dado REAL via `useFarmsList` --- */}
        <Text
          fontSize="xs"
          fontWeight="semibold"
          color="fg.muted"
          textTransform="uppercase"
          letterSpacing="wide"
          mt={8}
          mb={4}
        >
          {text.form.sections.farms}
        </Text>
        <Controller
          name="farm_uuids"
          control={control}
          render={({ field }) => (
            <CheckboxListField
              label={text.form.fields.farms}
              items={farmItems}
              selectedValues={field.value ?? []}
              onChange={(values) => {
                field.onChange(values);
                setFarmUuidsTouched(true);
              }}
              searchValue={farmSearchValue}
              onSearchChange={setFarmSearchValue}
              searchPlaceholder={text.form.farms.searchPlaceholder}
              selectAllLabel={text.form.farms.selectAllLabel}
              deselectAllLabel={text.form.farms.deselectAllLabel}
              selectedCountLabel={text.form.farms.selectedCountLabel}
              emptyLabel={text.form.farms.emptyLabel}
              isLoading={farmsQuery.isLoading}
              isError={farmsQuery.isError}
              errorLabel={text.form.farms.errorLabel}
              onRetry={() => farmsQuery.refetch()}
              retryLabel={text.form.farms.retryLabel}
              isDisabled={!canSave}
            />
          )}
        />

        {/* Proprietários (`proprietary_uuids`) — `min(1)` obrigatório
            quando `is_ticket=true` (schema já aplica). TASK-FE-567 fecha
            GAP-FE-155: `GET /proprietaries/options` real (TASK-BE-568) —
            CheckboxListField consome dado real, mirror linha a linha do
            bloco de Fazendas Vinculadas logo abaixo. Lista vazia/curta é um
            estado de UI honesto (proprietário órfão do pivô
            `proprietary_tenant`, achado do Tester de API — NÃO é erro),
            resolvido pelo `emptyLabel` do próprio CheckboxListField; erro
            real de rede/permissão usa `errorLabel`/`onRetry`. */}
        <Box mt={6}>
          <Controller
            name="proprietary_uuids"
            control={control}
            render={({ field }) => (
              <CheckboxListField
                label={text.form.fields.proprietaries}
                items={proprietaryItems}
                selectedValues={field.value ?? []}
                onChange={(values) => {
                  field.onChange(values);
                  setProprietaryUuidsTouched(true);
                }}
                searchValue={proprietarySearchValue}
                onSearchChange={setProprietarySearchValue}
                searchPlaceholder={text.form.proprietaries.searchPlaceholder}
                selectAllLabel={text.form.proprietaries.selectAllLabel}
                deselectAllLabel={text.form.proprietaries.deselectAllLabel}
                selectedCountLabel={text.form.proprietaries.selectedCountLabel}
                emptyLabel={
                  selectedFarmUuids.length === 0
                    ? text.form.proprietaries.emptyNoFarmsLabel
                    : text.form.proprietaries.emptyLabel
                }
                isLoading={selectedFarmUuids.length > 0 && proprietariesQuery.isLoading}
                isError={proprietariesQuery.isError}
                errorLabel={text.form.proprietaries.errorLabel}
                onRetry={() => proprietariesQuery.refetch()}
                retryLabel={text.form.proprietaries.retryLabel}
                isDisabled={!canSave}
              />
            )}
          />
          {errors.proprietary_uuids && (
            <Text fontSize="xs" color="red.500" mt={1}>
              {errors.proprietary_uuids.message as string}
            </Text>
          )}
        </Box>
      </Form>
    </FormContainer>
  );
}
