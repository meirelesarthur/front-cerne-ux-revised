// src/pages/CadastrosBase/Proprietarios/CreateOrUpdateProprietario.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de PROPRIETÁRIO (Proprietary — Cadastros
// Base, TASK-PY-FE-03). Rotas:
//   /cadastros-base/proprietarios/novo   (criar)
//   /cadastros-base/proprietarios/:uuid  (editar, GUID)
// registradas em src/router/index.tsx, ANTES do catch-all `/cadastros-base/*`
// — guardadas por `proprietaries_view` (leitura mínima do form, instrução
// explícita da ficha); a autorização REAL de create/edit é aplicada dentro
// do componente (`canSave`, desabilita campos/submit) e, em última
// instância, pelo backend (403 de `proprietaries_create`/`proprietaries_edit`).
//
// Arquivo NOVO e independente — NÃO importa nada de `Pessoas/` (mesma
// independência arquitetural de `ProprietaryRequest`/`proprietary-service.ts`,
// contrato §4.2). Molde estrutural PRIMÁRIO dos 2 repeaters:
// `Pessoas/steps/StepProprietario.tsx` (produção real, mesmo papel, mesmos
// nomes de campo internos — `farms[]`/`state_registration_numbers[]`,
// `listFarms()` estático via `useQuery` 1x). Molde de máscara `nif`/autofill
// CEP: `Fornecedores/CreateOrUpdateFornecedor.tsx` (`format-document.ts`,
// NÃO `InputMask`, para `nif` dinâmico CPF↔CNPJ) e
// `Contador/CreateOrUpdateContador.tsx::handleCepBlur` (ViaCEP + resolução
// de Cidade por IBGE).
//
// `farms[].percentage` usa `NumberInput` (`@/components/Form/NumberInput`,
// mesmo padrão de `RegrasFiscais/CreateOrUpdateRegraFiscal.tsx::perc_icms`) —
// máscara vírgula decimal, 2 casas, faixa `[0, 100]` (participação societária
// não passa de 100%; teto que SUPERA o `999.99` da homologação 2026-07-30).
// Divergência DELIBERADA do molde estrutural (`Pessoas/` permanece intocado —
// regra de independência arquitetural do arquivo, ver acima).
// `state_registration_numbers[].value`
// passou a bloquear qualquer caractere não-dígito na digitação (filtro
// inline no `onChange`, sem componente novo).
//
// Sem `Tabs.Root` (decisão registrada na ficha, "Referência UX" item 4) —
// `Proprietary` não tem os blocos extras (Conta/Filiais/Vendedores) que
// justificam abas em `Fornecedores`; formulário single-page com seções.
//
// `is_enabled` NÃO é campo do form (mirror `Provider`, DA-PY-02) — forçado
// `true` pelo `ProprietaryController::store()`/`update()`; a única forma do
// registro deixar de existir é o hard-delete de `TASK-PY-FE-02`.
//
// -----------------------------------------------------------------------------
// ARQUITETURA DE HIDRATAÇÃO (gated-mount, `TASK-PR-FE-10`) — resolve os 3
// footguns de `useFieldArray` explicitamente sinalizados para esta Tarefa:
//
// 1. `dirtyFields` NÃO marca item recém-`append`ado (o recompute de
//    `dirtyFields` do react-hook-form itera sobre os índices de
//    `defaultValues`, nunca visitando um índice além do tamanho original) —
//    por isso o guard de "nada mudou" em `onSubmit` NUNCA confia só em
//    `Object.keys(dirtyFields).length === 0`: compara também o TAMANHO
//    atual de `farms`/`state_registration_numbers` contra o tamanho
//    ORIGINAL capturado no mount (`baselineArrayLengths`, `useRef`).
// 2. `reset()` não sincroniza `fields` de um `useFieldArray` automaticamente
//    (a lib mantém sua própria lista interna de `fields`, separada do
//    valor puro do form) — por isso este arquivo NUNCA chama `reset()`/
//    `.replace()` para hidratar dados assíncronos. Em vez disso,
//    `buildProprietaryFormDefaultValues` computa o objeto completo
//    (raiz + arrays) SINCRONAMENTE, e esse objeto vira o `defaultValues` do
//    `useForm()` já no PRIMEIRO mount de `ProprietaryFormBody` — quando
//    `useFieldArray({ name: 'farms' })` inicializa, `fields` já nasce
//    correto, sem `.replace()` posterior.
// 3. Inputs não-controlados de item novo (`register()` puro) só refletem
//    `defaultValues` no mount — por isso CADA linha usa `key={field.id}`
//    (o id estável gerado pelo próprio `useFieldArray`, nunca o índice) e é
//    montada só depois que `defaultValues` já contém os dados reais (efeito
//    colateral do gated-mount acima: como o componente inteiro só monta
//    quando os dados já chegaram — Skeleton no wrapper enquanto isso — não
//    existe uma janela em que uma linha é criada vazia e precisa reidratar
//    depois).
//
// Isto é a MESMA arquitetura (wrapper + corpo interno gateado, `key` de
// remount) já usada por `CreateOrUpdateFornecedor.tsx` para corrigir
// `ERRO-02`/`ERRO-03` — divergência DELIBERADA do texto original da ficha
// (que descrevia o padrão genérico `fillForm`+`resetForce`, Lei 2): esse
// padrão mais antigo é justamente o que causou os footguns 2/3 em Provider
// antes da correção estrutural. Não faz sentido reproduzir um bug já
// corrigido no módulo irmão mais recente.
// -----------------------------------------------------------------------------

import { type ChangeEvent, type ElementType, type FocusEvent, useMemo, useRef } from 'react';

import { Box, Flex, Icon, IconButton, SimpleGrid, Skeleton, Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { MaskedInput } from '@/components/Form/MaskedInput';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import cleanMask from '@/utils/clean-mask';
import { isValidCpfCnpj, normalizeDocument } from '@/utils/cpfCnpj';
import { formatDocument } from '@/utils/format-document';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { proprietarySchemaResolver } from '@/validations/schemas/CadastrosBase/proprietary-schema';

import {
  createProprietary,
  listProprietaries,
  updateProprietary,
} from '@/services/v2/CadastrosBase/Proprietary/proprietary-service';
import { getCityByIso, listCityOptions } from '@/services/v2/Cities/city-service';
import { listFarms } from '@/services/v2/Farms/farm-service';
import { getPersonByNif } from '@/services/v2/People/person-service';
import { getAddressByCep } from '@/services/viacep';

import type { Option } from '@/@types/option';
import type {
  CreateProprietaryRequest,
  ProprietaryDetail,
  ProprietaryForm as ProprietaryFormType,
  UpdateProprietaryRequest,
} from '@/@types/v2/CadastrosBase/proprietary';
import type { CityListItem } from '@/@types/v2/Cities';

import { useProprietaryForm } from './useProprietarios';

// `defaultValues` estáticos vazios (modo CRIAÇÃO, `initialData === undefined`)
// — mínimo 1 linha de fazenda já nasce presente (schema exige `.min(1)`, e a
// UX não deveria abrir um form de criação com a seção "vazia" sem nenhuma
// linha para preencher).
const EMPTY_PROPRIETARY_FORM_DEFAULTS: ProprietaryFormType = {
  nif: '',
  nickname: '',
  name: '',
  email: '',
  phone: null,
  zip_code: null,
  address: '',
  number: '',
  district: '',
  city: null,
  farms: [{ farm: null, percentage: null }],
  state_registration_numbers: [],
};

// buildProprietaryFormDefaultValues — computa `defaultValues` SINCRONAMENTE
// a partir do detalhe real (`data`), usado como `defaultValues` de PRIMEIRO
// mount do `useForm`/`useFieldArray` em `ProprietaryFormBody` (nunca como
// argumento de um `reset()`/`.replace()` posterior — ver nota de cabeçalho).
// `data === undefined` (modo criação) devolve os defaults estáticos vazios.
function buildProprietaryFormDefaultValues(
  data: ProprietaryDetail | undefined
): ProprietaryFormType {
  if (!data) return EMPTY_PROPRIETARY_FORM_DEFAULTS;

  return {
    uuid: data.uuid,
    nif: formatDocument(data.nif ?? ''),
    nickname: data.nickname,
    name: data.name,
    email: data.email ?? '',
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
    // `farms[]` — shape PLANO real de `ProprietaryDetailResource`
    // (`{uuid, percentage}`, uuid da FARM — ver divergência registrada em
    // `@types/v2/CadastrosBase/proprietary/index.d.ts`), NÃO
    // `{farm:{uuid,description},percentage}` aninhado. `percentage` é
    // `number | null` no form (PATCH pós-entrega, 2026-07-30) — hidratado
    // DIRETO do detalhe, sem conversão de tipo (o `NumberInput` consome
    // `number | null` nativamente).
    farms: (data.farms ?? []).map((farm) => ({
      farm: { value: farm.uuid, label: '' }, // rótulo resolvido pelo Select estático (farmOptions) na renderização
      percentage: farm.percentage ?? null,
    })),
    state_registration_numbers: (data.state_registration_numbers ?? []).map((value) => ({
      value,
    })),
  };
}

// Campos de Pessoa autopreenchidos por CPF/CNPJ (UT-000774) e seu valor "vazio"
// (default de criação) usado na reversão (D3).
type AutofillField =
  'name' | 'nickname' | 'email' | 'phone' | 'address' | 'number' | 'district' | 'zip_code' | 'city';

const AUTOFILL_EMPTY_VALUES: Record<AutofillField, string | null> = {
  name: '',
  nickname: '',
  email: '',
  phone: null,
  address: '',
  number: '',
  district: '',
  zip_code: null,
  city: null,
};

// ---- Wrapper (export default) ----------------------------------------------
// Só resolve `uuid`/permissões e dispara `proprietaryQuery` (busca do
// detalhe, `fillForm` NO-OP — ver `useProprietarios.tsx`). Gateia o mount do
// form: em EDIÇÃO, aguarda o detalhe carregar (Skeleton enquanto isso); em
// CRIAÇÃO, monta `ProprietaryFormBody` IMEDIATAMENTE.
export default function CreateOrUpdateProprietario() {
  const { uuid } = useParams<{ uuid: string }>();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.proprietaries.proprietary;

  // É edição quando existe um GUID válido na rota ("novo" não é GUID).
  const isEditing = isValidGuid(uuid);

  const canSave = isEditing ? can('proprietaries_edit') : can('proprietaries_create');

  const proprietaryQuery = useProprietaryForm({ registrationId: isEditing ? uuid : undefined });

  // Gate do mount em EDIÇÃO: além de `isLoading` (sem dado em cache), bloqueia
  // enquanto há refetch em andamento (`isFetching`). O detalhe usa
  // `networkMode: 'offlineFirst'` (useCustomFormQueryById) — sem este guard, ao
  // reabrir a edição logo após salvar, o cache STALE é servido no mount e o
  // `defaultValues` nasce com o valor anterior (o `fillForm` é NO-OP por design,
  // então o form não re-hidrata quando o refetch traz o dado novo). Esperar o
  // refetch garante que o form monte com o valor persistido atual (ex.:
  // Participação %). Bug relatado em 2026-09-22.
  const isLoading =
    isEditing &&
    (checkLoadingStatus([proprietaryQuery as any]) ||
      Boolean((proprietaryQuery as any)?.isFetching));

  if (isLoading) {
    return (
      <FormContainer title={isEditing ? text.form.title.edit : text.form.title.create} showDivider>
        <Box pt={4}>
          <SimpleGrid columns={columnsForm.default} gap={6}>
            <Skeleton height="40px" borderRadius="md" />
            <Skeleton height="40px" borderRadius="md" />
            <Skeleton height="40px" borderRadius="md" />
          </SimpleGrid>
          <SimpleGrid columns={columnsForm.default} gap={6} mt={6}>
            <Skeleton height="40px" borderRadius="md" />
            <Skeleton height="40px" borderRadius="md" />
            <Skeleton height="40px" borderRadius="md" />
          </SimpleGrid>
          <Skeleton height="120px" borderRadius="md" mt={6} />
        </Box>
      </FormContainer>
    );
  }

  return (
    <ProprietaryFormBody
      // `key` garante remount limpo se o usuário navegar entre edições
      // diferentes sem passar pela listagem — evita misturar `defaultValues`
      // de um Proprietário A com o form de um Proprietário B.
      key={uuid ?? 'new'}
      initialData={proprietaryQuery.data as ProprietaryDetail | undefined}
      isEditing={isEditing}
      proprietaryUuid={uuid}
      canSave={canSave}
    />
  );
}

interface ProprietaryFormBodyProps {
  initialData?: ProprietaryDetail;
  isEditing: boolean;
  proprietaryUuid?: string;
  canSave: boolean;
}

// ---- Corpo interno -----------------------------------------------------
// Só monta quando os dados já estão prontos (`initialData` resolvido, ou
// `undefined` em criação). `defaultValues` do `useForm()` computados
// SINCRONAMENTE via `buildProprietaryFormDefaultValues` — nasce JÁ populado,
// nenhum `reset()`/`.replace()` necessário (ver nota de cabeçalho do
// arquivo — resolução dos 3 footguns de `useFieldArray`).
function ProprietaryFormBody({
  initialData,
  isEditing,
  proprietaryUuid,
  canSave,
}: ProprietaryFormBodyProps) {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const text = languageGB.proprietaries.proprietary;

  const {
    control,
    register,
    handleSubmit,
    setValue,
    getValues,
    getFieldState,
    trigger,
    clearErrors,
    formState: { errors, dirtyFields },
  } = useForm<ProprietaryFormType>({
    mode: 'onChange',
    resolver: proprietarySchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: buildProprietaryFormDefaultValues(initialData),
  });

  // Arrays dinâmicos — nascem JÁ populados a partir de `defaultValues`
  // (footguns 2/3): nenhum `.replace()` necessário, o `useFieldArray`
  // inicializa `fields` a partir do próprio `defaultValues` do `useForm` no
  // primeiro (e único) mount deste componente.
  const farmsArray = useFieldArray({ control, name: 'farms' });
  const registrationsArray = useFieldArray({ control, name: 'state_registration_numbers' });

  // Footgun 1 (`dirtyFields` NÃO marca item recém-`append`ado): captura o
  // TAMANHO original dos arrays no mount — o guard de "nada mudou" em
  // `onSubmit` compara o tamanho ATUAL contra esta baseline, além de
  // `Object.keys(dirtyFields).length === 0` (que sozinho não detecta
  // append/remove de linhas sem edição de campo interno).
  const baselineArrayLengths = useRef({
    farms: initialData?.farms?.length ?? 1,
    stateRegistrationNumbers: initialData?.state_registration_numbers?.length ?? 0,
  });

  // NIF original em dígitos crus — guard do autopreenchimento em EDIÇÃO: não
  // redispara o lookup se o NIF não mudou em relação ao carregado da API.
  const originalNifDigitsRef = useRef(normalizeDocument(initialData?.nif ?? ''));

  // Select ESTÁTICO de Fazenda (molde `StepProprietario.tsx` — `listFarms()`
  // não pagina/busca, só lista 1x via `useQuery`; NÃO `SelectAsyncPaginate`,
  // NÃO um novo service).
  const { data: farms } = useQuery({ queryKey: ['proprietary-farms-options'], queryFn: listFarms });
  const farmOptions: Option<string>[] = useMemo(
    () => (farms ?? []).map((f) => ({ value: f.uuid, label: f.description })),
    [farms]
  );

  const proprietaryMutation = useRequest({
    asyncFunction: tryPersistProprietary,
    entityName: text.singularLabel,
    queryKey: queryKey.cadastrosBase.proprietaries,
    queryKey2: queryKey.cadastrosBase.proprietary,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate('/cadastros-base/proprietarios');
    },
  });

  async function tryPersistProprietary(data: ProprietaryFormType) {
    // Payload raiz SEMPRE completo (contrato `ProprietaryRequest`, mesma
    // exigência de `Provider`) — `nif`/`name`/`nickname`/`address`/`number`/
    // `district`/`city_uuid` obrigatórios em AMBOS os verbos;
    // `email`/`phone`/`zip_code` também sempre enviados.
    const payload: CreateProprietaryRequest = {
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
      proprietary: {
        // `farms[]`/`state_registration_numbers[]` SEMPRE enviados por
        // completo — o backend não tem PATCH parcial nesses arrays
        // (mesma regra de `Provider.branches`/`.sellers`, ERRO-01/
        // TASK-PR-FE-08: o gate por `dirtyFields` é estruturalmente
        // incapaz de detectar linhas recém-`append`adas).
        farms: data.farms.map((f) => ({
          farm_uuid: f.farm?.value ?? '',
          // `f.percentage` já é `number | null` (contrato do `NumberInput`,
          // PATCH pós-entrega 2026-07-30) — `?? 0` preserva o comportamento
          // ORIGINAL de linha sem percentual preenchido (mesmo default do
          // `transformPercentageToNumber` removido nesta rodada).
          percentage: f.percentage ?? 0,
        })),
        state_registration_numbers: data.state_registration_numbers
          .map((r) => r.value.trim())
          .filter((v) => v.length > 0),
      },
    };

    if (isEditing && proprietaryUuid) {
      return await updateProprietary(proprietaryUuid, payload as UpdateProprietaryRequest);
    }

    return await createProprietary(payload);
  }

  async function onSubmit(data: ProprietaryFormType) {
    // Guard EXPLÍCITO — `Object.keys(dirtyFields).length === 0` (NUNCA
    // `isEmpty`/`!isEmpty`, landmine `ERRO-FE-001`) + checagem de tamanho
    // dos 2 arrays contra a baseline do mount (footgun 1 — dirtyFields
    // sozinho não detecta append/remove de linha sem edição de campo).
    const arraysUnchanged =
      data.farms.length === baselineArrayLengths.current.farms &&
      data.state_registration_numbers.length ===
        baselineArrayLengths.current.stateRegistrationNumbers;

    if (isEditing && Object.keys(dirtyFields).length === 0 && arraysUnchanged) {
      navigate('/cadastros-base/proprietarios');
      return;
    }
    await proprietaryMutation.mutateAsync(data);
  }

  const isSubmitting = proprietaryMutation.isPending;

  // ---- UT-000774 (esteira 120) — Autopreenchimento por NIF -----------------
  // D1: CPF/CNPJ de proprietário JÁ existente na fazenda ativa (CRIAÇÃO) →
  //     toast info + redireciona para /cadastros-base/proprietarios/{uuid}
  //     (mesmo precedente de Funcionários); a edição hidrata Fazendas/IE.
  // D2: Pessoa existente sem papel / proprietário só em outra fazenda →
  //     pré-preenche a Pessoa + aviso; a API soma (merge) ao salvar.
  // D3: ao trocar/apagar o documento, reverte SÓ os campos autopreenchidos que
  //     ainda estão iguais ao valor preenchido (preserva o que o usuário digitou).
  // `autofilledRef` guarda o valor preenchido por campo; `autofillSourceDigitsRef`
  // o documento que originou o preenchimento.
  const autofilledRef = useRef<Partial<Record<AutofillField, unknown>>>({});
  const autofillSourceDigitsRef = useRef<string | null>(null);
  const autofillChainRef = useRef<Promise<void>>(Promise.resolve());

  // Serializa NIF/CEP: nunca rodam intercalados (ambos escrevem endereço/cidade).
  function runSequencedAutofill(task: () => Promise<void>): Promise<void> {
    const run = async () => {
      await task();
    };
    const chained = autofillChainRef.current.then(run, run);
    autofillChainRef.current = chained;
    return chained;
  }

  function sameAutofillValue(current: unknown, filled: unknown): boolean {
    if (current && filled && typeof current === 'object' && typeof filled === 'object') {
      return (current as Option<string>).value === (filled as Option<string>).value;
    }
    return (current ?? null) === (filled ?? null);
  }

  function clearAutofilledFields() {
    const filled = autofilledRef.current;
    (Object.keys(filled) as AutofillField[]).forEach((fieldName) => {
      if (sameAutofillValue(getValues(fieldName), filled[fieldName])) {
        // `shouldDirty: true` — o RHF recomputa o dirty contra o default vazio
        // (criação), então o campo volta a "limpo".
        setValue(fieldName, AUTOFILL_EMPTY_VALUES[fieldName] as never, {
          shouldDirty: true,
          shouldValidate: false,
        });
      }
    });
    autofilledRef.current = {};
    autofillSourceDigitsRef.current = null;
    void trigger().then(() => clearErrors());
  }

  function handleNifChange(nextValue: string) {
    const source = autofillSourceDigitsRef.current;
    if (source && normalizeDocument(nextValue) !== source) clearAutofilledFields();
  }

  function fillAutofillField<K extends AutofillField>(fieldName: K, value: unknown) {
    // Só preenche campo que o usuário NÃO editou (guarda por campo).
    if (getFieldState(fieldName).isDirty) return;
    setValue(fieldName, value as never, { shouldDirty: true, shouldValidate: true });
    autofilledRef.current[fieldName] = value;
  }

  async function handleNifBlur(nifRaw: string) {
    if (!isValidCpfCnpj(nifRaw)) return;

    const currentDigits = normalizeDocument(nifRaw);
    if (isEditing && currentDigits === originalNifDigitsRef.current) return;
    // Mesmo documento já autopreenchido: nada a refazer.
    if (autofillSourceDigitsRef.current === currentDigits) return;

    await runSequencedAutofill(async () => {
      // D1 — somente CRIAÇÃO. Fail-safe: qualquer erro cai no prefill.
      if (!isEditing) {
        try {
          const existing = await listProprietaries({ search: currentDigits, per_page: 10 });
          const match = existing.data.items.find(
            (item) => normalizeDocument(item.nif) === currentDigits
          );
          if (match) {
            toaster.create({
              type: 'info',
              title: text.singularLabel,
              description: text.form.nifAlreadyProprietaryRedirectWarning,
            });
            navigate(`/cadastros-base/proprietarios/${match.uuid}`, { replace: true });
            return;
          }
        } catch {
          // Fail-safe — rede/403: segue para o prefill da Pessoa.
        }
      }

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
        // Qualquer outro erro (rede/5xx): preenchimento manual segue disponível.
        return;
      }

      // 404 (Pessoa não encontrada) = documento novo; nada a preencher.
      if (!found) return;

      autofillSourceDigitsRef.current = currentDigits;
      fillAutofillField('name', found.name ?? '');
      fillAutofillField('nickname', found.nickname ?? '');
      fillAutofillField('email', found.email ?? '');
      fillAutofillField('phone', found.phone ?? null);
      fillAutofillField('address', found.address ?? '');
      fillAutofillField('number', found.number ?? '');
      fillAutofillField('district', found.district ?? '');
      fillAutofillField('zip_code', found.zip_code ?? null);
      fillAutofillField(
        'city',
        found.city
          ? {
              value: found.city.uuid,
              label: `${found.city.name}${found.city.state ? ` — ${found.city.state.uf}` : ''}`,
            }
          : null
      );

      toaster.create({
        type: 'warning',
        title: text.singularLabel,
        description: isEditing ? text.form.nifFoundWarningEditing : text.form.nifFoundWarning,
      });
    });
  }

  // Autofill de CEP (molde EXATO `Contador/CreateOrUpdateContador.tsx::handleCepBlur`)
  // — dispara no `onBlur` do campo `zip_code`, só com 8 dígitos limpos.
  // Nenhuma falha trava o formulário — só toast, preenchimento manual segue
  // disponível.
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
        // tratada; o autofill é um atalho, nunca pode impedir o preenchimento
        // manual do formulário.
        toaster.create({
          type: 'error',
          title: text.form.cepAutofill.networkError.title,
          description: text.form.cepAutofill.networkError.description,
        });
      }
    });
  }

  // `state_registration_numbers.${index}.value` — só dígitos. Mantém o
  // campo 100% uncontrolled (`register()` puro, sem `Controller`): muta o
  // próprio evento ANTES de repassar ao `onChange` original de
  // `register()` (mesmo padrão mutate-event de `PhoneInput.tsx` —
  // `event.target` é o nó DOM real por trás do `ref` que o RHF lê; mutar
  // `.value` aqui é visível para o RHF quando ele processa o evento a
  // seguir). Sem comprimento fixo — nenhuma convenção de tamanho de
  // Inscrição Estadual no projeto.
  function registerStateRegistration(index: number) {
    const field = register(`state_registration_numbers.${index}.value` as const);
    return {
      ...field,
      onChange: (event: ChangeEvent<HTMLInputElement>) => {
        event.target.value = event.target.value.replace(/\D/g, '');
        return field.onChange(event);
      },
    };
  }

  return (
    <FormContainer
      title={isEditing ? text.form.title.edit : text.form.title.create}
      footer={
        <>
          <Button
            title={languageGB.defaltStrings.cancel}
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
              disabled={isSubmitting}
            />
          )}
        </>
      }
    >
      <Form noPadding onSubmit={handleSubmit(onSubmit)}>
        {/* Linha 1: CPF/CNPJ, Apelido, Razão Social/Nome, E-mail (4 colunas) */}
        <SimpleGrid columns={columnsForm.default} gap={6}>
          <Controller
            name="nif"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <MaskedInput
                kind="cpfCnpj"
                label={text.form.fields.nif}
                name={field.name}
                value={field.value ?? ''}
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  field.onChange(event);
                  handleNifChange(event.target.value ?? '');
                }}
                onBlur={() => {
                  field.onBlur();
                  void handleNifBlur(field.value ?? '');
                }}
                error={error?.message}
                isRequired
                // UT-000774 — CPF/CNPJ não editável após salvar (campo-chave do
                // upsert-por-nif; mesmo padrão de Funcionários).
                disabled={!canSave || isEditing}
              />
            )}
          />
          <Input
            label={text.form.fields.nickname}
            {...register('nickname')}
            error={errors.nickname?.message}
            isRequired
            disabled={!canSave}
          />
          <Input
            label={text.form.fields.name}
            {...register('name')}
            error={errors.name?.message}
            isRequired
            disabled={!canSave}
          />
          <Input
            label={text.form.fields.email}
            type="email"
            spellCheck={false}
            {...register('email')}
            error={errors.email?.message}
            isRequired
            disabled={!canSave}
          />
        </SimpleGrid>

        {/* Linha 2: Telefone, CEP, Endereço, Número (4 colunas) */}
        <SimpleGrid columns={columnsForm.default} gap={6} mt={6}>
          <MaskedInput
            kind="phone"
            label={text.form.fields.phone}
            {...register('phone')}
            error={errors.phone?.message}
            disabled={!canSave}
          />
          <Controller
            name="zip_code"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <MaskedInput
                kind="cep"
                label={text.form.fields.zipCode}
                name={field.name}
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={(event: FocusEvent<HTMLInputElement>) => {
                  field.onBlur();
                  handleCepBlur(event);
                }}
                error={error?.message}
                disabled={!canSave}
              />
            )}
          />
          <Input
            label={text.form.fields.address}
            {...register('address')}
            error={errors.address?.message}
            isRequired
            disabled={!canSave}
          />
          <Input
            label={text.form.fields.number}
            {...register('number')}
            error={errors.number?.message}
            isRequired
            disabled={!canSave}
          />
        </SimpleGrid>

        {/* Linha 3: Bairro e Cidade (2 colunas iguais, ocupando toda a largura) */}
        <SimpleGrid columns={columnsForm.twoColumns} gap={6} mt={6}>
          <Input
            label={text.form.fields.district}
            {...register('district')}
            error={errors.district?.message}
            isRequired
            disabled={!canSave}
          />
          <Controller
            name="city"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.form.fields.city}
                service={listCityOptions}
                mapOptions={(item: CityListItem) => ({
                  label: `${item.title} — ${item.state?.letter ?? ''}`,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                // Armadilha #9 — `?? null`, NUNCA `?? undefined`.
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                error={error?.message}
                isRequired
                isDisabled={!canSave}
                // Armadilha #7 — portaliza SÓ esta instância no <body>.
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />
        </SimpleGrid>

        {/* ---- Seção "Fazendas e Participação" (useFieldArray, mínimo 1
            linha, molde direto de StepProprietario.tsx) ---- */}
        <Box mt={8}>
          <Text fontSize="md" fontWeight="bold" color="brandColorText" mb={1}>
            {text.form.farms.fields.farm}
          </Text>
          {farmsArray.fields.length === 0 && (
            <Text fontSize="sm" color="fg.muted" mb={2}>
              {text.form.farms.empty}
            </Text>
          )}
          {typeof errors.farms?.message === 'string' && (
            <Text fontSize="sm" color="fg.error" mb={2}>
              {errors.farms.message}
            </Text>
          )}
          <Flex direction="column" gap={4}>
            {farmsArray.fields.map((field, index) => (
              <Box
                key={field.id}
                border="1px solid"
                borderColor="border.subtle"
                borderRadius="md"
                p={4}
              >
                <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} mb={2}>
                  <Controller
                    name={`farms.${index}.farm`}
                    control={control}
                    render={({ field: { value, onChange }, fieldState: { error } }) => (
                      <Select
                        label={text.form.farms.fields.farm}
                        name={`farm-${index}`}
                        // Armadilha #9 — `?? null`, NUNCA `?? undefined`.
                        value={value ?? null}
                        onChange={onChange}
                        options={farmOptions}
                        isDisabled={!canSave}
                        error={error?.message}
                      />
                    )}
                  />
                  <Controller
                    name={`farms.${index}.percentage`}
                    control={control}
                    render={({
                      field: { name, value, onChange, onBlur },
                      fieldState: { error },
                    }) => (
                      <NumberInput
                        label={text.form.farms.fields.percentage}
                        name={name}
                        value={value ?? null}
                        onValueChange={onChange}
                        onBlur={onBlur}
                        min={0}
                        max={100}
                        allowDot
                        decimalPlaces={2}
                        error={error?.message}
                        disabled={!canSave}
                      />
                    )}
                  />
                </SimpleGrid>
                <Flex justify="flex-end">
                  <IconButton
                    aria-label={text.form.farms.removeAria}
                    variant="ghost_danger"
                    size="sm"
                    disabled={!canSave}
                    onClick={() => farmsArray.remove(index)}
                  >
                    <Icon as={FiTrash2} />
                  </IconButton>
                </Flex>
              </Box>
            ))}
          </Flex>
          <Button
            title={text.form.farms.add}
            icon={FiPlus as ElementType}
            variant="outline"
            size="sm"
            mt={3}
            disabled={!canSave}
            onClick={() => farmsArray.append({ farm: null, percentage: null })}
          />
        </Box>

        {/* ---- Seção "Inscrições Estaduais" (useFieldArray, 0+ linhas,
            molde direto de StepProprietario.tsx) ---- */}
        <Box mt={8}>
          <Text fontSize="md" fontWeight="bold" color="brandColorText" mb={1}>
            {text.form.stateRegistrations.title}
          </Text>
          {registrationsArray.fields.length === 0 && (
            <Text fontSize="sm" color="fg.muted" mb={2}>
              {text.form.stateRegistrations.empty}
            </Text>
          )}
          <Flex direction="column" gap={3}>
            {registrationsArray.fields.map((field, index) => (
              <Flex key={field.id} gap={2} align="flex-end">
                <Box flex={1}>
                  <MaskedInput
                    kind="digits"
                    label={`${text.form.stateRegistrations.fields.value} ${index + 1}`}
                    disabled={!canSave}
                    {...registerStateRegistration(index)}
                  />
                </Box>
                <IconButton
                  aria-label={text.form.stateRegistrations.removeAria}
                  variant="ghost_danger"
                  disabled={!canSave}
                  onClick={() => registrationsArray.remove(index)}
                >
                  <Icon as={FiTrash2} />
                </IconButton>
              </Flex>
            ))}
          </Flex>
          <Button
            title={text.form.stateRegistrations.add}
            icon={FiPlus as ElementType}
            variant="outline"
            size="sm"
            mt={3}
            disabled={!canSave}
            onClick={() => registrationsArray.append({ value: '' })}
          />
        </Box>
      </Form>
    </FormContainer>
  );
}
