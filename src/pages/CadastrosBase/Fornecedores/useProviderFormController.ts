// src/pages/CadastrosBase/Fornecedores/useProviderFormController.ts
// -----------------------------------------------------------------------------
// TASK-MV-FE-12 — extraído de `CreateOrUpdateFornecedor.tsx` (`ProviderFormBody`,
// linhas 279-427 + 522-1023 originais), SEM reescrever nenhuma linha de
// lógica — recorte-e-cola literal, reconectado por retorno de hook. Mesma
// receita de `TASK-MV-FE-10` (Cliente, `useClientFormController.ts`,
// pré-requisito de `ClientFormModal`/TASK-MV-FE-11). Pré-requisito de
// TASK-MV-FE-13 (`ProviderFormModal`, reuso deste hook dentro do form de
// Movement). Página cheia (`CreateOrUpdateFornecedor.tsx`) e o futuro modal
// consomem este hook — toda a orquestração de estado/submit do formulário de
// Fornecedor (exceto a ação "Desativar", ver Fronteira da extração abaixo)
// mora aqui.
//
// Fronteira da extração (decisão técnica registrada na ficha da Tarefa) —
// `deactivateMutation`/`isOpenDeactivateDialog`/`onOpenDeactivateDialog`/
// `onCloseDeactivateDialog`/`handleConfirmDeactivate`/`isDeactivating`
// (`TASK-PR-FE-07`) NÃO migram para este controller — ficam em
// `ProviderFormBody` (página): é uma ação exclusiva da página completa (botão
// no cabeçalho do `FormContainer` + `DeleteConfirmDialog`), sem equivalente no
// modal.
//
// ARQUITETURA DE HIDRATAÇÃO (gated-mount, `TASK-PR-FE-10`, INTACTA) —
// `buildProviderFormDefaultValues` computa `defaultValues` SINCRONAMENTE a
// partir do detalhe real (`initialData`), usado como `defaultValues` de
// PRIMEIRO mount do `useForm`/`useFieldArray` abaixo — nunca como argumento de
// um `reset()`/`.replace()` posterior. `branches`/`sellers` (arrays
// dinâmicos) nascem JÁ populados a partir de `defaultValues`.
// -----------------------------------------------------------------------------

import { type FocusEvent, useEffect, useRef, useState } from 'react';

import { isAxiosError } from 'axios';
import { useFieldArray, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { toaster } from '@/components/ui/toaster';

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useRequest } from '@/hooks/useRequest';

import cleanMask from '@/utils/clean-mask';
import { isValidCpfCnpj, normalizeDocument } from '@/utils/cpfCnpj';
import { formatDocument } from '@/utils/format-document';

import { accountTypeOptions } from '@/constants/cadastrosBase/provider/options/account-type-options';
import { enabledOptions } from '@/constants/cadastrosBase/provider/options/enabled-options';
import { pixTypeOptions } from '@/constants/cadastrosBase/provider/options/pix-type-options';
import { providerTypeOptions } from '@/constants/cadastrosBase/provider/options/provider-type-options';
import { providerType } from '@/constants/cadastrosBase/provider/provider-type';
import { queryKey } from '@/constants/query-key';

import { providerSchemaResolver } from '@/validations/schemas/CadastrosBase/provider-schema';

import {
  createProvider,
  updateProvider,
} from '@/services/v2/CadastrosBase/Provider/provider-service';
import { fetchCnpjDataFromReceitaWs } from '@/services/v2/CadastrosBase/Provider/receitaws-service';
import { getCityByIso, listCityOptions } from '@/services/v2/Cities/city-service';
// TASK-PR-FE-12 (correção `ERRO-05`) — reuso INTEGRAL do endpoint/service já
// em produção em Clientes/Funcionários. Zero endpoint/service novo criado
// para o prefill do NIF raiz desta tela.
import { getPersonByNif } from '@/services/v2/People/person-service';
import { getAddressByCep } from '@/services/viacep';

import type { LanguageDate } from '@/@types/language';
import type {
  CreateProviderRequest,
  ProviderBranchForm,
  ProviderDetail,
  ProviderForm as ProviderFormType,
  ProviderSellerForm,
  UpdateProviderRequest,
} from '@/@types/v2/CadastrosBase/provider';

// `defaultValues` estáticos vazios (modo CRIAÇÃO, `initialData === undefined`)
// — mesmo shape que antes vivia inline no `useForm()` do componente único.
const EMPTY_PROVIDER_FORM_DEFAULTS: ProviderFormType = {
  nif: '',
  nickname: '',
  name: '',
  email: null,
  phone: null,
  zip_code: null,
  address: '',
  number: '',
  district: '',
  city: null,
  type: null,
  commission: null,
  hour_value: null,
  state_registration: null,
  city_registration: null,
  contact: null,
  contact_phone: null,
  cellphone: null,
  default_cost_center: null,
  // `is_enabled` (default Sim) é resolvido em `buildProviderFormDefaultValues`
  // (precisa de `languageGB` p/ o label — nunca `label: ''`).
  is_enabled: null,
  // Aba Conta — schema/tipo já existem (FE-01); UI chega em TASK-PR-FE-04.
  bank: null,
  account_type: null,
  agency: null,
  account: null,
  pix_type: null,
  pix: null,
  // Abas Filiais/Vendedores — UI chega em TASK-PR-FE-05/06.
  branches: [],
  sellers: [],
};

// buildProviderFormDefaultValues (TASK-PR-FE-10) — computa `defaultValues`
// SINCRONAMENTE a partir do detalhe real (`data`), reaproveitando EXATAMENTE
// o mesmo mapeamento que antes vivia em `fillForm`/`reset()` (ver Histórico
// de ERRO-02/ERRO-03) — usado agora como `defaultValues` de PRIMEIRO mount
// do `useForm`/`useFieldArray`, NUNCA como argumento de um `reset()`/
// `.replace()` posterior. `data === undefined` (modo criação) devolve os
// defaults estáticos vazios.
function buildProviderFormDefaultValues(
  data: ProviderDetail | undefined,
  languageGB: LanguageDate
): ProviderFormType {
  if (!data) {
    return {
      ...EMPTY_PROVIDER_FORM_DEFAULTS,
      is_enabled: enabledOptions.getOption(true, languageGB),
    };
  }

  // Aba Filiais (TASK-PR-FE-05) — `ProviderBranchDetail` vem TOTALMENTE
  // denormalizado pela fachada dedicada `/providers/{uuid}`, servido por um
  // Resource DEDICADO (`ProviderBranchDetailResource`,
  // `nif`/`name`/`state_registration`/`zip_code`/`city_uuid`/`city`
  // aninhado/`address` reais — GAP-PR-09/TASK-PR-08, `[RESOLVIDO]`).
  // `nif` chega em dígitos crus; `InputMask` aplica a máscara CNPJ na
  // exibição sozinha (diferente do `nif` raiz, que precisa de
  // `formatDocument` manual).
  const mappedBranches: ProviderBranchForm[] = data.branches.map((branch) => ({
    uuid: branch.uuid,
    nif: branch.nif,
    name: branch.name ?? null,
    state_registration: branch.state_registration ?? null,
    zip_code: branch.zip_code ?? null,
    city: branch.city
      ? {
          label: `${branch.city.name}${branch.city.state ? ` — ${branch.city.state.uf}` : ''}`,
          value: branch.city.uuid,
        }
      : null,
    address: branch.address,
  }));

  // Aba Vendedores (TASK-PR-FE-06) — hidrata com os itens REAIS de
  // `data.sellers` na edição — NUNCA `[]` hardcoded, que zeraria
  // visualmente os Vendedores já salvos ao abrir a tela de edição.
  const mappedSellers: ProviderSellerForm[] = data.sellers.map((seller) => ({
    uuid: seller.uuid,
    name: seller.name,
    email: seller.email ?? null,
    phone: seller.phone ?? null,
  }));

  return {
    uuid: data.uuid,
    nif: formatDocument(data.nif ?? ''),
    nickname: data.nickname,
    name: data.name,
    email: data.email ?? null,
    phone: data.phone ?? null,
    zip_code: data.zip_code ?? null,
    address: data.address,
    number: data.number,
    district: data.district,
    city: data.city
      ? {
          label: `${data.city.name}${data.city.state ? ` — ${data.city.state.uf}` : ''}`,
          value: data.city.uuid,
        }
      : null,
    type: providerTypeOptions.getOption(data.type, languageGB),
    commission: data.commission ?? null,
    hour_value: data.hour_value ?? null,
    state_registration: data.state_registration ?? null,
    city_registration: data.city_registration ?? null,
    contact: data.contact ?? null,
    contact_phone: data.contact_phone ?? null,
    cellphone: data.cellphone ?? null,
    // UT-000773 — tolerante a `null`/ausente (centro invisível ao usuário volta
    // `null` da API); label real `code — description`, nunca `''`.
    default_cost_center: data.default_cost_center
      ? {
          value: data.default_cost_center.uuid,
          label: `${data.default_cost_center.code} — ${data.default_cost_center.description}`,
        }
      : null,
    is_enabled: enabledOptions.getOption(data.is_enabled ?? true, languageGB),
    // Aba Conta (TASK-PR-FE-04) — `_label` companheiro via `bank.code`/
    // `bank.name` (armadilha #8 do checklist); `account_type`/`pix_type`
    // resolvidos pelas fábricas (`accountTypeOptions`/`pixTypeOptions`,
    // rótulo real — NUNCA `label: ''`).
    bank: data.bank
      ? { label: `${data.bank.code}-${data.bank.name}`, value: data.bank.uuid }
      : null,
    account_type: accountTypeOptions.getOption(data.account_type, languageGB),
    agency: data.agency ?? null,
    account: data.account ?? null,
    pix_type: pixTypeOptions.getOption(data.pix_type, languageGB),
    pix: data.pix ?? null,
    branches: mappedBranches,
    sellers: mappedSellers,
  };
}

export interface UseProviderFormControllerProps {
  initialData?: ProviderDetail;
  isEditing: boolean;
  providerUuid?: string;
  canSave: boolean;
  /** NOVO (TASK-MV-FE-12) — só o modal (TASK-MV-FE-13) usa. Página cheia
   *  continua `navigate(-1)` (comportamento intocado, `onPersisted`
   *  OMITIDO na chamada do hook). */
  onPersisted?: (provider: ProviderDetail) => void;
}

// ---- Controller ------------------------------------------------------------
// Só monta quando os dados já estão prontos (`initialData` resolvido, ou
// `undefined` em criação — decisão do CALLER, mantida em
// `CreateOrUpdateFornecedor.tsx`). `defaultValues` do `useForm()` computados
// SINCRONAMENTE via `buildProviderFormDefaultValues` — nasce JÁ populado,
// nenhum `reset()`/`.replace()` necessário.
export function useProviderFormController({
  initialData,
  isEditing,
  providerUuid,
  onPersisted,
}: UseProviderFormControllerProps) {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const text = languageGB.providers.provider;
  const { activeFarmUuid } = useAuth();

  const {
    control,
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<ProviderFormType>({
    mode: 'onChange',
    resolver: providerSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: buildProviderFormDefaultValues(initialData, languageGB),
  });

  // UT-000773 — centro de custo é farm-scoped: ao trocar de fazenda a seleção
  // anterior deixa de valer (senão 422/isolamento). Não dispara no 1º mount.
  const previousFarmUuidRef = useRef(activeFarmUuid);
  useEffect(() => {
    if (previousFarmUuidRef.current === activeFarmUuid) return;
    previousFarmUuidRef.current = activeFarmUuid;
    setValue('default_cost_center', null, { shouldDirty: true, shouldValidate: true });
  }, [activeFarmUuid, setValue]);

  // TASK-PR-FE-12 (correção `ERRO-05`) — baseline do NIF raiz carregado da
  // API em DÍGITOS CRUS (`onlyDigits`), mirror `CreateOrUpdateCliente.tsx`
  // (hoje `useClientFormController.ts`). Guard 2 de `handleNifBlur` abaixo:
  // em edição, o prefill só dispara quando o documento REALMENTE MUDOU em
  // relação a este valor (comparação por dígitos, não pela string mascarada).
  // `useRef` (não `dirtyFields.nif`) para sobreviver a `setValue('nif', ...)`
  // de outro fluxo sem se mover — só o mount define este valor.
  const originalNifDigitsRef = useRef(normalizeDocument(initialData?.nif ?? ''));

  // Arrays dinâmicos (TASK-PR-FE-05/06) — nascem JÁ populados a partir de
  // `defaultValues` (TASK-PR-FE-10): nenhum `.replace()` necessário, o
  // `useFieldArray` inicializa `fields` a partir do próprio `defaultValues`
  // do `useForm` no primeiro (e único) mount deste hook.
  const branchesArray = useFieldArray({ control, name: 'branches' });
  const sellersArray = useFieldArray({ control, name: 'sellers' });

  // Indicador LOCAL (não bloqueia a tela inteira) de qual linha de Filial
  // está com a busca `receitaws` em andamento — só a linha em questão exibe
  // o spinner, nunca um loading global (spec da Tarefa).
  const [autofillingBranchIndex, setAutofillingBranchIndex] = useState<number | null>(null);

  const providerMutation = useRequest({
    asyncFunction: tryPersistProvider,
    entityName: text.singularLabel,
    queryKey: queryKey.cadastrosBase.providers,
    queryKey2: queryKey.cadastrosBase.provider,
    typesRequest: isEditing ? 'update' : 'create',
    // TASK-MV-FE-12 — único ponto novo de orquestração: página cheia NÃO
    // passa `onPersisted` (preserva `navigate(-1)` 1:1); o futuro modal
    // (TASK-MV-FE-13) passa `onPersisted` e fecha o modal + devolve
    // uuid/label ao pai em vez de navegar.
    actionSuccess: (data) => {
      if (onPersisted) {
        onPersisted(data);
      } else {
        navigate(-1);
      }
    },
  });

  async function tryPersistProvider(data: ProviderFormType) {
    // Payload raiz SEMPRE completo (contrato `## 6.3`) — `nif`/`name`/
    // `nickname`/`address`/`number`/`district`/`city_uuid` são `required` em
    // AMBOS os verbos; `email`/`phone`/`zip_code` também sempre enviados
    // (nenhum é `sometimes` no `ProviderRequest`).
    const payload: CreateProviderRequest = {
      nif: normalizeDocument(data.nif),
      nickname: data.nickname.trim(),
      name: data.name.trim(),
      email: data.email?.trim() || null,
      phone: data.phone || null,
      zip_code: data.zip_code || null,
      address: data.address.trim(),
      number: data.number.trim(),
      district: data.district.trim(),
      city_uuid: data.city?.value ?? '',
      provider: {
        // `type` é enum int-backed — escrita SEMPRE em INT (armadilha #12).
        type: data.type!.value,
        commission:
          data.type?.value === providerType.comissionado ? (data.commission ?? null) : null,
        hour_value:
          data.type?.value === providerType.terceirizado ? (data.hour_value ?? null) : null,
        state_registration: data.state_registration || null,
        city_registration: data.city_registration || null,
        contact: data.contact || null,
        contact_phone: data.contact_phone || null,
      },
    };

    // UT-000773 — CRIAR envia sempre; EDITAR só o que foi tocado (ausente =
    // preserva na API, `null` = limpa). `option.value`, nunca o objeto Option.
    if (!isEditing) {
      payload.provider.is_enabled = data.is_enabled!.value;
      payload.provider.cellphone = data.cellphone || null;
      payload.provider.default_cost_center_uuid = data.default_cost_center?.value ?? null;
    }

    // Aba Filiais (TASK-PR-FE-05) — `provider.branches` é `sometimes|array`
    // no `ProviderRequest` (RN-08, delete-then-recreate SEMPRE que a chave
    // está presente, via `SyncProviderBranchesAction`). Sempre completo
    // (ERRO-01/TASK-PR-FE-08, INALTERADO por esta Tarefa — gate por
    // dirtyFields era estruturalmente incapaz de detectar linhas
    // recém-adicionadas via useFieldArray.append(), porque o recompute de
    // dirtyFields do react-hook-form itera sobre as chaves de
    // `defaultValues`, nunca visitando índices além do tamanho original).
    // Seguro: o form já nasce hidratado com a lista real do servidor na
    // edição (TASK-PR-FE-10), e no create o form só contém o que o usuário
    // adicionou — "sempre enviar o estado atual" é equivalente a
    // "existentes + mudanças desta sessão".
    payload.provider.branches = data.branches.map((branch) => ({
      nif: normalizeDocument(branch.nif),
      name: branch.name?.trim() || null,
      state_registration: branch.state_registration?.trim() || null,
      zip_code: branch.zip_code || null,
      city_uuid: branch.city?.value ?? '',
      address: branch.address.trim(),
    }));

    // Aba Vendedores (TASK-PR-FE-06) — `provider.sellers` é `sometimes|array`
    // no `ProviderRequest` (RN-08, delete-then-recreate SEMPRE que a chave
    // está presente, via `SyncProviderSellersAction`). Sempre completo
    // (ERRO-01/TASK-PR-FE-08, mesmo racional de branches acima, INALTERADO).
    payload.provider.sellers = data.sellers.map((seller) => ({
      name: seller.name.trim(),
      email: seller.email?.trim() || null,
      phone: seller.phone || null,
    }));

    // Aba Conta (TASK-PR-FE-04) — `bank_uuid`/`account_type`/`agency`/
    // `account`/`pix_type`/`pix` são `sometimes|nullable` no `ProviderRequest`
    // hardcoded para OS DOIS VERBOS (não é `$required` condicional por
    // `isUpdate` como os campos raiz) — por isso o mesmo gate por campo
    // (`dirtyFields`) é usado em UPDATE (só entra a chave que o usuário
    // tocou nesta sessão, nunca zera o que não foi tocado); em CREATE o
    // bloco é enviado por completo (não há valor salvo a preservar num
    // registro que ainda não existe).
    if (isEditing && providerUuid) {
      if (dirtyFields.cellphone) payload.provider.cellphone = data.cellphone || null;
      if (dirtyFields.default_cost_center) {
        payload.provider.default_cost_center_uuid = data.default_cost_center?.value ?? null;
      }
      if (dirtyFields.is_enabled) payload.provider.is_enabled = data.is_enabled!.value;
      if (dirtyFields.bank) payload.provider.bank_uuid = data.bank?.value ?? null;
      if (dirtyFields.account_type) {
        payload.provider.account_type = data.account_type?.value ?? null;
      }
      if (dirtyFields.agency) payload.provider.agency = data.agency || null;
      if (dirtyFields.account) payload.provider.account = data.account || null;
      if (dirtyFields.pix_type) payload.provider.pix_type = data.pix_type?.value ?? null;
      if (dirtyFields.pix) payload.provider.pix = data.pix || null;

      return await updateProvider(providerUuid, payload as UpdateProviderRequest);
    }

    payload.provider.bank_uuid = data.bank?.value ?? null;
    payload.provider.account_type = data.account_type?.value ?? null;
    payload.provider.agency = data.agency || null;
    payload.provider.account = data.account || null;
    payload.provider.pix_type = data.pix_type?.value ?? null;
    payload.provider.pix = data.pix || null;

    return await createProvider(payload);
  }

  async function onSubmit(data: ProviderFormType) {
    // Guard EXPLÍCITO — nada mudou numa edição: só navega, sem PUT vazio.
    if (isEditing && Object.keys(dirtyFields).length === 0) {
      navigate(-1);
      return;
    }
    try {
      await providerMutation.mutateAsync(data);
    } catch (error) {
      // UT-000773 — `useRequest` só mostra toast; o 422 da API vem com chave
      // com ponto (`provider.default_cost_center_uuid`) que não casa com o
      // nome do campo do form. Mapeia ao Select de centro de custo; demais
      // erros seguem propagando como antes.
      const apiErrors =
        isAxiosError(error) && error.response?.status === 422
          ? (error.response.data?.errors as Record<string, string[]> | undefined)
          : undefined;
      const costCenterMessage = apiErrors?.['provider.default_cost_center_uuid']?.[0];
      if (!costCenterMessage) throw error;
      setError('default_cost_center', { type: 'server', message: costCenterMessage });
    }
  }

  const isSubmitting = providerMutation.isPending;

  // TASK-PR-FE-12 (correção `ERRO-05`) — coordenação entre o prefill de NIF
  // raiz (abaixo) e o autofill de CEP raiz JÁ EXISTENTE (`handleCepBlur`) —
  // ambos são handlers `onBlur` assíncronos e competem pelos MESMOS campos
  // raiz (`address`/`district`/`city`). Sem coordenação, um blur rápido no
  // campo seguinte enquanto o primeiro fetch ainda está em voo poderia
  // intercalar as 2 escritas em ordem imprevisível. Mirror EXATO de
  // `CreateOrUpdateCliente.tsx` (hoje `useClientFormController.ts`).
  //
  // NÃO ENVOLVE o autofill ReceitaWS da aba "Filiais" (`handleBranchCnpjBlur`,
  // abaixo) — esse autofill escreve exclusivamente via
  // `setValue(\`branches.${index}.address/zip_code/name/city\`, ...)`, campos
  // de LINHA, nunca os campos RAIZ (`address`/`district`/`city` do form
  // inteiro). Não há concorrência de escrita entre ele e os 2 autofills raiz
  // serializados aqui — permanece com seu próprio indicador local
  // (`autofillingBranchIndex`), intocado, fora da fila.
  //
  // `autofillChainRef` serializa a execução: cada handler enfileira seu
  // trabalho encadeado no anterior (`.then`), nunca roda em paralelo com o
  // outro — quem o usuário acionou por ÚLTIMO (blur mais recente) sempre
  // escreve por último, resultado determinístico. `autofillBusyCount`
  // (contador, não boolean — os 2 podem se enfileirar) vira `isAutofillBusy`,
  // usado para desabilitar os campos raiz que os 2 handlers podem
  // sobrescrever enquanto qualquer um está em voo.
  const autofillChainRef = useRef<Promise<void>>(Promise.resolve());
  const [autofillBusyCount, setAutofillBusyCount] = useState(0);
  const isAutofillBusy = autofillBusyCount > 0;

  function runSequencedAutofill(task: () => Promise<void>): Promise<void> {
    setAutofillBusyCount((count) => count + 1);
    const run = async () => {
      try {
        await task();
      } finally {
        setAutofillBusyCount((count) => count - 1);
      }
    };
    const chained = autofillChainRef.current.then(run, run);
    autofillChainRef.current = chained;
    return chained;
  }

  // Prefill de CPF/CNPJ do NIF RAIZ (TASK-PR-FE-12, correção de `ERRO-05`) —
  // mirror `CreateOrUpdateCliente.tsx::handleNifBlur` (hoje
  // `useClientFormController.ts`), reusando o MESMO service
  // (`getPersonByNif`, ZERO service/endpoint novo), adaptado aos campos raiz
  // de `Person` presentes nesta tela. Campos do bloco raiz de Provider que
  // NÃO são de `Person` (`state_registration`/`city_registration`/`type`/
  // comissão/hora, bloco bancário da aba "Conta", filiais, vendedores) NÃO
  // são preenchidos — fidelidade ao legado (`main.js:514-523`), que também
  // só preenchia raiz de `Person`.
  //
  // Guard 1 — só dispara com CPF/CNPJ VÁLIDO por DÍGITO VERIFICADOR
  // (`isValidCpfCnpj`), nunca por contagem de dígitos.
  // Guard 2 — em edição, só dispara quando o documento MUDOU de fato em
  // relação ao valor carregado da API (`originalNifDigitsRef`, comparação
  // por dígitos, não pela string mascarada).
  //
  // Tratamento 403×404 (Decisão do dono, `ERRO-05`, gate humano conduzido
  // pelo Maestro, 2026-08-02 — DIVERGE deliberadamente de Clientes, que
  // silencia os dois; Clientes NÃO é tocada por esta correção):
  //   - 404 (Pessoa não encontrada) segue SILENCIOSO — `getPersonByNif`
  //     (`person-service.ts`, INTOCADO por esta Tarefa) já converte 404 em
  //     `null`; é o caso normal do fluxo (NIF novo), aviso ali seria ruído.
  //   - 403 (usuário sem `people_view`) dispara aviso DISCRETO e EXPLÍCITO
  //     via `nifPermissionDeniedWarning` (i18n, 3 idiomas) — nunca string
  //     literal, nunca a string crua do backend. `person-service.ts` já
  //     REPROPAGA qualquer status != 404 (`throw error`); a diferenciação é
  //     feita aqui.
  //   - Qualquer outro erro (network/5xx) é ignorado silenciosamente — mesmo
  //     padrão do autofill de CEP abaixo: é um atalho, nunca pode travar o
  //     formulário.
  //
  // NÃO replica o fallback ReceitaWS do legado (`main.js:456-500`) neste
  // campo raiz — decisão explícita da ficha original: o ReceitaWS de linhas
  // de Filial já cobre CNPJ de forma dedicada e homologada; duplicar aqui
  // criaria 2 fontes concorrentes de preenchimento de CNPJ na mesma tela.
  async function handleNifBlur() {
    const current = watch('nif');
    if (!isValidCpfCnpj(current)) return;

    const currentDigits = normalizeDocument(current);
    if (isEditing && currentDigits === originalNifDigitsRef.current) return;

    await runSequencedAutofill(async () => {
      let found: Awaited<ReturnType<typeof getPersonByNif>>;

      try {
        found = await getPersonByNif(currentDigits);
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 403) {
          toaster.create({
            type: 'warning',
            title: text.singularLabel,
            description: text.form.nifPermissionDeniedWarning,
          });
        }
        // 403 tratado acima; qualquer outro erro (network/5xx) segue o
        // padrão genérico do autofill — nunca trava o formulário, form
        // permanece intocado.
        return;
      }

      // 404 (Pessoa não encontrada) já virou `null` pelo service — form
      // segue em branco, sem toast, NUNCA é limpo.
      if (!found) return;

      setValue('name', found.name, { shouldDirty: true, shouldValidate: true });
      setValue('nickname', found.nickname, { shouldDirty: true, shouldValidate: true });
      setValue('email', found.email ?? null, { shouldDirty: true, shouldValidate: true });
      setValue('phone', found.phone ?? null, { shouldDirty: true, shouldValidate: true });
      setValue('address', found.address ?? '', { shouldDirty: true, shouldValidate: true });
      setValue('number', found.number ?? '', { shouldDirty: true, shouldValidate: true });
      setValue('district', found.district ?? '', { shouldDirty: true, shouldValidate: true });
      setValue('zip_code', found.zip_code ?? null, { shouldDirty: true, shouldValidate: true });
      setValue(
        'city',
        found.city
          ? {
              value: found.city.uuid,
              label: `${found.city.name}${found.city.state ? ` — ${found.city.state.uf}` : ''}`,
            }
          : null,
        { shouldDirty: true, shouldValidate: true }
      );

      // Toast diferenciado criação × edição (item 8 da ficha) — em edição, o
      // usuário precisa entender que os dados de OUTRA Pessoa acabaram de
      // substituir o que estava no formulário.
      toaster.create({
        type: 'warning',
        title: text.singularLabel,
        description: isEditing ? text.form.nifFoundWarningEditing : text.form.nifFoundWarning,
      });
    });
  }

  // Autofill de CEP (molde `Contador/CreateOrUpdateContador.tsx::handleCepBlur`)
  // — dispara no `onBlur` do campo `zip_code`, só com 8 dígitos limpos.
  // Nenhuma falha trava o formulário — só toast, preenchimento manual segue
  // disponível.
  //
  // TASK-PR-FE-12 — corpo INTOCADO (só envolvido pelo wrapper
  // `runSequencedAutofill`, ver comentário acima): serializa contra o
  // prefill de NIF raiz, que escreve nos mesmos campos `address`/`district`/
  // `city`. Nunca roda intercalado com ele — quem o usuário blurou por
  // último sempre vence, determinístico.
  async function handleCepBlur(event: FocusEvent<HTMLInputElement>) {
    const digits = cleanMask(event.target.value ?? '');
    if (digits.length !== 8) return;

    await runSequencedAutofill(async () => {
      try {
        const viaCep = await getAddressByCep(digits);

        if (!viaCep) {
          toaster.create({
            type: 'warning',
            title: text.form.cepAutofill.notFound.title,
            description: text.form.cepAutofill.notFound.description,
          });
          return;
        }

        setValue('address', viaCep.logradouro, { shouldDirty: true, shouldValidate: true });
        setValue('district', viaCep.bairro, { shouldDirty: true, shouldValidate: true });

        const city = await getCityByIso(Number(viaCep.ibge));

        if (city) {
          setValue(
            'city',
            { label: `${city.title} — ${city.state?.letter ?? ''}`, value: city.uuid },
            { shouldDirty: true, shouldValidate: true }
          );
        } else {
          toaster.create({
            type: 'warning',
            title: text.form.cepAutofill.cityNotResolved.title,
            description: text.form.cepAutofill.cityNotResolved.description,
          });
        }
      } catch {
        // Rede fora do ar (ViaCEP OU /cities) — nunca propaga exceção não
        // tratada; o autofill é um atalho, nunca pode impedir o
        // preenchimento manual do formulário.
        toaster.create({
          type: 'error',
          title: text.form.cepAutofill.networkError.title,
          description: text.form.cepAutofill.networkError.description,
        });
      }
    });
  }

  // Resolve `city_uuid` de uma Filial a partir do NOME do município + UF
  // devolvidos pelo `receitaws` — diferente do autofill ViaCEP (que resolve
  // por código IBGE via `getCityByIso`), a API pública `receitaws` não
  // devolve ibge/iso, só nome+UF. Busca por nome (`listCityOptions`,
  // endpoint ungated `/cities/options`) e desempata por UF quando há mais de
  // uma cidade homônima em estados diferentes; se a UF não bater com nenhum
  // resultado, cai no primeiro. Nunca lança — falha de rede/parsing aqui
  // também vira `null`, tratada pelo chamador como "cidade não resolvida
  // automaticamente".
  async function resolveBranchCityOption(cityName: string, stateUf: string) {
    try {
      const result = await listCityOptions({ search: cityName, per_page: 20 });
      const items = result.data.items;
      const match =
        items.find((item) => item.state?.letter?.toUpperCase() === stateUf.toUpperCase()) ??
        items[0] ??
        null;

      if (!match) return null;

      return { label: `${match.title} — ${match.state?.letter ?? ''}`, value: match.uuid };
    } catch {
      return null;
    }
  }

  // Autofill `receitaws.com.br` (TASK-PR-FE-05, decisão do dono —
  // `GAP-UX-PR-01`) — dispara no `onBlur` do `nif` de uma linha de Filial,
  // só quando o valor limpo tiver EXATAMENTE 14 dígitos (mesmo gatilho do
  // legado, `_forms.blade.php:233`). Usa o cliente HTTP ISOLADO
  // (`receitaws-service.ts`, nunca `api.V2`) — qualquer falha já chega aqui
  // como `null` (tratamento gracioso já resolvido no service); este handler
  // só decide o que fazer com o resultado: preencher os campos da MESMA
  // linha (`address`/`zip_code`/`city`), sem sobrescrever `nif` (já digitado)
  // nem `name` se o usuário já tiver editado manualmente
  // (`dirtyFields.branches[index].name`). NENHUMA falha trava o formulário
  // nem bloqueia o submit — só um toast discreto; o indicador de loading é
  // LOCAL à linha (`autofillingBranchIndex`), nunca global.
  async function handleBranchCnpjBlur(index: number, event: FocusEvent<HTMLInputElement>) {
    const digits = cleanMask(event.target.value ?? '');
    if (digits.length !== 14) return;

    setAutofillingBranchIndex(index);

    try {
      const cnpjData = await fetchCnpjDataFromReceitaWs(digits);

      if (!cnpjData) {
        toaster.create({
          type: 'warning',
          title: text.form.branches.cnpjAutofill.notFound.title,
          description: text.form.branches.cnpjAutofill.notFound.description,
        });
        return;
      }

      setValue(`branches.${index}.address`, cnpjData.address, {
        shouldDirty: true,
        shouldValidate: true,
      });

      if (cnpjData.zipCode) {
        setValue(`branches.${index}.zip_code`, cnpjData.zipCode, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }

      // Não sobrescreve `name` se o usuário já digitou manualmente nesta
      // linha nesta sessão (spec da Tarefa — checagem de `dirtyFields` da
      // PRÓPRIA linha, não do form inteiro).
      const branchDirtyFields = dirtyFields.branches as Array<{ name?: boolean }> | undefined;
      const nameAlreadyEditedByUser = Boolean(branchDirtyFields?.[index]?.name);
      if (!nameAlreadyEditedByUser && cnpjData.name) {
        setValue(`branches.${index}.name`, cnpjData.name, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }

      if (cnpjData.cityName) {
        const cityOption = await resolveBranchCityOption(cnpjData.cityName, cnpjData.stateUf);

        if (cityOption) {
          setValue(`branches.${index}.city`, cityOption, {
            shouldDirty: true,
            shouldValidate: true,
          });
        } else {
          toaster.create({
            type: 'warning',
            title: text.form.branches.cnpjAutofill.cityNotResolved.title,
            description: text.form.branches.cnpjAutofill.cityNotResolved.description,
          });
        }
      }
    } catch {
      // Defesa em profundidade além do `catch` interno de
      // `fetchCnpjDataFromReceitaWs`/`resolveBranchCityOption` (que já
      // devolvem `null` em qualquer falha) — cobre também uma eventual falha
      // síncrona neste próprio handler. NUNCA deixa a Promise rejeitar sem
      // tratamento; o usuário só vê o mesmo aviso discreto e segue
      // preenchendo manualmente.
      toaster.create({
        type: 'warning',
        title: text.form.branches.cnpjAutofill.notFound.title,
        description: text.form.branches.cnpjAutofill.notFound.description,
      });
    } finally {
      // SEMPRE limpa o indicador local, mesmo em falha — nenhum estado de
      // loading pode ficar "preso" numa linha.
      setAutofillingBranchIndex(null);
    }
  }

  return {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    errors,
    dirtyFields,
    activeFarmUuid,
    branchesArray,
    sellersArray,
    autofillingBranchIndex,
    handleNifBlur,
    handleCepBlur,
    handleBranchCnpjBlur,
    isAutofillBusy,
    onSubmit,
    isSubmitting,
  };
}
