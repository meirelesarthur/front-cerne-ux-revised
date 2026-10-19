// src/pages/CadastrosBase/Clientes/useClientFormController.ts
// -----------------------------------------------------------------------------
// TASK-MV-FE-10 — extraído de `CreateOrUpdateCliente.tsx` (linhas 381-761
// originais), SEM reescrever nenhuma linha de lógica — recorte-e-cola
// literal, reconectado por retorno de hook. Pré-requisito de
// TASK-MV-FE-11 (`ClientFormModal`, reuso deste hook dentro do form de
// Movement). Página cheia (`CreateOrUpdateCliente.tsx`) e o futuro modal
// consomem este hook — toda a orquestração de estado/submit do formulário
// de Cliente mora aqui.
//
// ⚠️ SCAFFOLD ADIANTADO POR ESPELHAMENTO (herdado de TASK-CL-FE-03) — a
// fachada dedicada `/api/v1/clients` já existe (ver `client-service.ts`),
// mas o histórico de ajustes de homologação abaixo é preservado como
// documentação viva do comportamento — NENHUM deles muda com esta extração.
//
// ARQUITETURA DE HIDRATAÇÃO (gated-mount, mirror `TASK-PR-FE-10`) — resolve
// os 3 footguns de `useFieldArray` explicitamente sinalizados para esta
// Tarefa (repeater `state_registrations`):
//
// 1. `dirtyFields` NÃO marca item recém-`append`ado — o guard de "nada
//    mudou" em `onSubmit` NUNCA confia só em
//    `Object.keys(dirtyFields).length === 0`: compara também o TAMANHO
//    atual de `state_registrations` contra o tamanho ORIGINAL capturado no
//    mount (`baselineArrayLength`, `useRef`).
// 2. `reset()` não sincroniza `fields` de um `useFieldArray` automaticamente
//    — por isso este hook NUNCA chama `reset()`/`.replace()` para hidratar
//    dados assíncronos. Em vez disso, `buildClientFormDefaultValues`
//    computa o objeto completo (raiz + array) SINCRONAMENTE, e esse objeto
//    vira o `defaultValues` do `useForm()` já no PRIMEIRO mount deste hook.
// 3. Inputs não-controlados de item novo só refletem `defaultValues` no
//    mount — por isso cada linha usa `key={field.id}` (em `ClientFormFields`)
//    e é montada só depois que `defaultValues` já contém os dados reais
//    (Skeleton no wrapper de `CreateOrUpdateCliente.tsx` enquanto isso).
// -----------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react';
import type { FocusEvent } from 'react';

import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useFieldArray, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';
import { useRequest } from '@/hooks/useRequest';

import cleanMask from '@/utils/clean-mask';
import { isValidCpfCnpj, normalizeDocument } from '@/utils/cpfCnpj';
import { formatDocument } from '@/utils/format-document';

import { queryKey } from '@/constants/query-key';

import { clientSchemaResolver } from '@/validations/schemas/CadastrosBase/client-schema';

import {
  createClient,
  getClientByNif,
  updateClient,
} from '@/services/v2/CadastrosBase/Client/client-service';
import { getCityByIso } from '@/services/v2/Cities/city-service';
import { listCountryOptions } from '@/services/v2/Countries/country-service';
import { getAddressByCep } from '@/services/viacep';

import type {
  ClientDetail,
  ClientForm as ClientFormType,
  CreateClientRequest,
  UpdateClientRequest,
} from '@/@types/v2/CadastrosBase/client';

// `defaultValues` estáticos vazios (modo CRIAÇÃO, `initialData === undefined`).
// `code_country` nasce `null` — CORREÇÃO CRÍTICA (2026-07-30, ver nota de
// cabeçalho original de `CreateOrUpdateCliente.tsx`): NÃO é mais `'BR'`
// (sigla ISO, causa do 500). O default real "Brasil" é resolvido abaixo por
// busca REAL na API (`defaultCountryQuery`/`useEffect`, mirror
// `CreateOrUpdateFarm.tsx`), nunca hardcoded aqui.
const EMPTY_CLIENT_FORM_DEFAULTS: ClientFormType = {
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
  cellphone: '',
  contact: '',
  contact_phone: '',
  city_registration: '',
  farm_name: '',
  is_enabled: true,
  final_costumer: false,
  taxpayer: true,
  code_country: null,
  id_abroad: '',
  state_registrations: [],
};

// DEFEITO-CLIENTES-02 (2026-07-30) — mapa de 422 por campo, MESMO padrão já
// em produção (`Safra/CreateOrUpdateSafra.tsx::tryPersistHarvest`,
// replicado em Bancos): este projeto não tem mecanismo compartilhado de
// `setError` em `useRequest.tsx`, então o mapeamento é feito LOCALMENTE no
// `catch` de `tryPersistClient` — soma ao toast genérico de `useRequest`
// (não substitui).
//
// Diferença específica deste formulário: o payload tem uma CAMADA aninhada
// (`client.*`, ver `CreateClientRequest`) mas o form (`ClientFormType`) é
// FLAT — os paths de erro do backend vêm como `client.cellphone`,
// `client.code_country` etc. `CLIENT_FIELD_ERROR_ALIASES` normaliza: (1)
// remove o prefixo `client.` (raiz do papel), (2) resolve o único nome que
// diverge entre payload e form (`city_uuid` no payload → `city` no form,
// já que o campo é um `Option`, não o uuid cru). Paths desconhecidos
// (ex.: `state_registrations.0`) são ignorados aqui (o toast genérico ainda
// mostra a mensagem) — sem tela dedicada de erro por linha do repeater
// nesta Tarefa.
const CLIENT_FORM_FIELD_KEYS = new Set<keyof ClientFormType>([
  'nif',
  'nickname',
  'name',
  'email',
  'phone',
  'zip_code',
  'address',
  'number',
  'district',
  'city',
  'cellphone',
  'contact',
  'contact_phone',
  'city_registration',
  'farm_name',
  'is_enabled',
  'final_costumer',
  'taxpayer',
  'code_country',
  'id_abroad',
  'state_registrations',
]);

const CLIENT_FIELD_ERROR_ALIASES: Record<string, keyof ClientFormType> = {
  city_uuid: 'city',
};

function resolveClientFormField(path: string): keyof ClientFormType | null {
  const normalized = path.startsWith('client.') ? path.slice('client.'.length) : path;
  const resolved = CLIENT_FIELD_ERROR_ALIASES[normalized] ?? normalized;
  return CLIENT_FORM_FIELD_KEYS.has(resolved as keyof ClientFormType)
    ? (resolved as keyof ClientFormType)
    : null;
}

// buildClientFormDefaultValues — computa `defaultValues` SINCRONAMENTE a
// partir do detalhe real (`data`), usado como `defaultValues` de PRIMEIRO
// mount do `useForm`/`useFieldArray` abaixo (nunca como argumento de um
// `reset()`/`.replace()` posterior — ver nota de cabeçalho).
function buildClientFormDefaultValues(data: ClientDetail | undefined): ClientFormType {
  if (!data) return EMPTY_CLIENT_FORM_DEFAULTS;

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
    cellphone: data.cellphone ?? '',
    contact: data.contact ?? '',
    contact_phone: data.contact_phone ?? '',
    city_registration: data.city_registration ?? '',
    farm_name: data.farm_name ?? '',
    is_enabled: data.is_enabled ?? true,
    final_costumer: data.final_costumer ?? false,
    taxpayer: data.taxpayer ?? true,
    // DEFEITO-CLIENTES-03 (2026-07-30) — `data.code_country` chega da API
    // como escalar NUMÉRICO (`int`, ex. `1058`), NUNCA string (ver nota de
    // cabeçalho original + `ClientDetail.code_country` em
    // `@types/v2/CadastrosBase/client`). `String(...)` aqui é OBRIGATÓRIO:
    // sem ele, `Option.value` carrega o número cru, o payload de edição
    // reenvia esse número no JSON e a API rejeita com 422
    // `"O campo client.code_country deve ser uma string."` (`ClientRequest`
    // exige `string`+`regex:/^\d+$/`). `!= null` (não truthy) — `codigo`
    // poderia teoricamente ser `0` em algum catálogo futuro.
    // GAP RESIDUAL FECHADO PARCIALMENTE (97-Esteiras/012, item 2) —
    // `ClientDetailResource` agora TAMBÉM devolve `country{uuid,nome,codigo}`
    // (acréscimo não-quebrante, mirror `FarmDetailResource::country`) quando a
    // relação `client.country` vem eager-loaded do backend. Prioriza
    // `data.country.nome` para o rótulo ("Brasil"); mantém o fallback HONESTO
    // anterior (label = o próprio código) para o caso residual de o objeto
    // não vir (relação não carregada) — NUNCA inventamos um `nome` de país
    // fora desses 2 casos.
    code_country:
      data.code_country !== null && data.code_country !== undefined
        ? {
            value: String(data.code_country),
            label: data.country?.nome ?? String(data.code_country),
          }
        : null,
    id_abroad: data.id_abroad ?? '',
    state_registrations: (data.state_registrations ?? []).map((value) => ({ value })),
  };
}

export interface UseClientFormControllerProps {
  initialData?: ClientDetail;
  isEditing: boolean;
  clientUuid?: string;
  canSave: boolean;
  /** NOVO (TASK-MV-FE-10) — só o modal (TASK-MV-FE-11) usa. Página cheia
   *  continua `navigate(-1)` (comportamento intocado, `onPersisted`
   *  OMITIDO na chamada do hook). */
  onPersisted?: (client: ClientDetail) => void;
}

// ---- Controller ----------------------------------------------------------
// Só monta quando os dados já estão prontos (`initialData` resolvido, ou
// `undefined` em criação — decisão do CALLER, mantida em
// `CreateOrUpdateCliente.tsx`). `defaultValues` do `useForm()` computados
// SINCRONAMENTE via `buildClientFormDefaultValues` — nasce JÁ populado,
// nenhum `reset()`/`.replace()` necessário.
export function useClientFormController({
  initialData,
  isEditing,
  clientUuid,
  onPersisted,
}: UseClientFormControllerProps) {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const text = languageGB.clients.client;

  const {
    control,
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<ClientFormType>({
    mode: 'onChange',
    resolver: clientSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: buildClientFormDefaultValues(initialData),
  });

  // Array dinâmico — nasce JÁ populado a partir de `defaultValues`
  // (footguns 2/3): nenhum `.replace()` necessário.
  const registrationsArray = useFieldArray({ control, name: 'state_registrations' });

  // Footgun 1 (`dirtyFields` NÃO marca item recém-`append`ado): captura o
  // TAMANHO original do array no mount — o guard de "nada mudou" em
  // `onSubmit` compara o tamanho ATUAL contra esta baseline.
  const baselineArrayLength = useRef(initialData?.state_registrations?.length ?? 0);

  // AJUSTE DE HOMOLOGAÇÃO (dono, 2026-07-30, `97-Esteiras/012`, TASK-CL-FE-04
  // reaberta) — baseline do NIF carregado da API na abertura do formulário,
  // em DÍGITOS CRUS (`onlyDigits`). Guard 1 de `handleNifBlur`: o prefill em
  // EDIÇÃO só pode disparar quando o documento REALMENTE MUDOU em relação a
  // este valor — comparação por dígitos (não pela string mascarada) para não
  // disparar por causa de uma diferença só de formatação. `useRef` (não
  // `dirtyFields.nif`) porque precisa sobreviver a `setValue('nif', ...)` de
  // OUTRO fluxo sem se mover — só a abertura do formulário (mount) define
  // este valor.
  const originalNifDigitsRef = useRef(normalizeDocument(initialData?.nif ?? ''));

  // ---- Default de País "Brasil" (CORREÇÃO CRÍTICA, ver nota de cabeçalho
  // original de `CreateOrUpdateCliente.tsx`) ----
  // Pré-seleciona "Brasil" em modo CRIAÇÃO via busca REAL no catálogo
  // `/countries/options` (`search: 'Brasil'`, filtro `nome ILIKE` real do
  // backend) — mirror EXATO de `CreateOrUpdateFarm.tsx::defaultCountryQuery`.
  // NUNCA hardcoded (nem o `codigo`, nem o `nome`): se o catálogo mudar, o
  // default acompanha. Não sobrescreve escolha do usuário
  // (`dirtyFields.code_country`) nem o prefill de edição (`isEditing`).
  const defaultCountryQuery = useQuery({
    queryKey: [queryKey.countries.options, 'brasil-default'],
    queryFn: async () => {
      const response = await listCountryOptions({ search: 'Brasil', per_page: 5 });
      return response.data?.items ?? [];
    },
    enabled: !isEditing,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: false,
  });

  useEffect(() => {
    if (isEditing) return;
    if (dirtyFields.code_country) return;
    const brasil = defaultCountryQuery.data?.find((item) => item.nome === 'Brasil');
    if (brasil) {
      setValue(
        'code_country',
        { value: String(brasil.codigo), label: brasil.nome },
        { shouldDirty: false }
      );
    }
    // Deps EXPLÍCITAS (ZERO `eslint-disable` — regra do projeto): `setValue`
    // do RHF é referência estável, incluída por completude do lint;
    // `dirtyFields.code_country` (não o objeto inteiro) é a única fatia de
    // `dirtyFields` que este efeito lê.
  }, [defaultCountryQuery.data, isEditing, dirtyFields.code_country, setValue]);

  const clientMutation = useRequest({
    asyncFunction: tryPersistClient,
    entityName: text.singularLabel,
    queryKey: queryKey.cadastrosBase.clients,
    queryKey2: queryKey.cadastrosBase.client,
    typesRequest: isEditing ? 'update' : 'create',
    // TASK-MV-FE-10 — único ponto novo de orquestração: página cheia NÃO
    // passa `onPersisted` (preserva `navigate(-1)` 1:1); o futuro modal
    // (TASK-MV-FE-11) passa `onPersisted` e fecha o modal + devolve
    // uuid/label ao pai em vez de navegar.
    actionSuccess: (data) => {
      if (onPersisted) {
        onPersisted(data);
      } else {
        navigate(-1);
      }
    },
  });

  async function tryPersistClient(data: ClientFormType) {
    // Payload raiz SEMPRE completo (mesma exigência de `Provider`/
    // `Proprietary`) — `state_registrations[]` SEMPRE enviado por completo
    // (o backend não tem PATCH parcial em arrays, mesma regra do checklist
    // canônico item 3).
    const payload: CreateClientRequest = {
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
      client: {
        cellphone: data.cellphone || null,
        contact: data.contact?.trim() || null,
        contact_phone: data.contact_phone || null,
        city_registration: data.city_registration?.trim() || null,
        farm_name: data.farm_name?.trim() || null,
        is_enabled: data.is_enabled,
        final_costumer: data.final_costumer,
        taxpayer: data.taxpayer,
        // CORREÇÃO CRÍTICA (2026-07-30) — `.value` é o `codigo` numérico
        // (string de dígitos, ex. `"1058"`), NUNCA a sigla ISO. Ver nota de
        // cabeçalho original de `CreateOrUpdateCliente.tsx`. `String(...)` —
        // DEFEITO-CLIENTES-03: garante dígitos-string SEMPRE, mesmo se
        // `.value` chegar como número cru (hidratação de edição, ver
        // `buildClientFormDefaultValues`) — nunca reenviar um JSON number
        // para `client.code_country` (422 "deve ser uma string").
        code_country: data.code_country?.value ? String(data.code_country.value) : '',
        // AJUSTE DE HOMOLOGAÇÃO — `id_abroad` sempre enviado (campo sempre
        // visível/opcional, ver nota de cabeçalho original), nunca mais
        // gated por `code_country`.
        id_abroad: data.id_abroad?.trim() || null,
        state_registrations: data.state_registrations
          .map((r) => r.value.trim())
          .filter((v) => v.length > 0),
      },
    };

    try {
      if (isEditing && clientUuid) {
        return await updateClient(clientUuid, payload as UpdateClientRequest);
      }

      return await createClient(payload);
    } catch (error) {
      // DEFEITO-CLIENTES-02 — 422 do backend mapeado por campo (mesmo
      // padrão de `Safra/CreateOrUpdateSafra.tsx::tryPersistHarvest`, ver
      // nota de `resolveClientFormField` acima). O `throw` ao final
      // preserva o toast genérico que `useRequest` já mostra (soma, não
      // substitui).
      if (isAxiosError(error) && error.response?.status === 422) {
        const fieldErrors = error.response.data?.errors as Record<string, string[]> | undefined;
        Object.entries(fieldErrors ?? {}).forEach(([path, messages]) => {
          const field = resolveClientFormField(path);
          if (field && messages?.[0]) {
            setError(field, { type: 'server', message: messages[0] });
          }
        });
      }
      throw error;
    }
  }

  async function onSubmit(data: ClientFormType) {
    // Guard EXPLÍCITO — `Object.keys(dirtyFields).length === 0` (NUNCA
    // `isEmpty`/`!isEmpty`) + checagem de tamanho do array contra a
    // baseline do mount (footgun 1).
    const arrayUnchanged = data.state_registrations.length === baselineArrayLength.current;

    if (isEditing && Object.keys(dirtyFields).length === 0 && arrayUnchanged) {
      navigate(-1);
      return;
    }
    await clientMutation.mutateAsync(data);
  }

  const isSubmitting = clientMutation.isPending;

  // ---- Coordenação entre o prefill de NIF (TASK-CL-FE-04) e o autofill de
  // CEP (DEFEITO-CLIENTES-01) — ambos são handlers `onBlur` assíncronos e
  // competem pelos MESMOS campos (`address`/`district`/`city`). Sem
  // coordenação, um `blur` rápido no campo seguinte enquanto o primeiro
  // `fetch` ainda está em voo poderia intercalar as 2 escritas em ordem
  // imprevisível (a resposta que chega DEPOIS vence, não necessariamente a
  // que o usuário disparou por último).
  //
  // `autofillChainRef` serializa a execução: cada handler enfileira seu
  // trabalho encadeado no anterior (`.then`), nunca roda em paralelo com o
  // outro — quem o usuário acionou por ÚLTIMO (blur mais recente) sempre
  // escreve por último, resultado determinístico.
  // `autofillBusyCount` (contador, não boolean — os 2 podem se enfileirar)
  // vira `isAutofillBusy`, usado para desabilitar os campos que os 2
  // handlers podem sobrescrever enquanto qualquer um está em voo — o usuário
  // não fica digitando sobre um valor prestes a ser trocado.
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

  // Prefill de CPF/CNPJ (TASK-CL-FE-04, `97-Esteiras/012`; UT-000740,
  // `97-Esteiras/045`) — consulta `GET /clients/by-nif/{nif}`
  // (`getClientByNif`): devolve Pessoa + papel Client no mesmo shape de
  // `ClientDetail`. Campos de Pessoa são sempre preenchidos; os do papel
  // (celular, contato, flags, país, IEs...) só quando `found.uuid` é não-null
  // (Cliente já existe nesta fazenda/tenant). Mesmo padrão `.catch(() => null)`
  // e mesmo toast do wizard de Pessoas. Enfileirado via `runSequencedAutofill`.
  //
  // AJUSTE DE HOMOLOGAÇÃO (dono, 2026-07-30, `97-Esteiras/012`) — pedido
  // literal: "Ao editar um cliente, se alterar o CPF/CNPJ, não é feito a
  // consulta, somente na criação, realize esse ajuste!". Isto REVERTE a
  // decisão anterior (`if (isEditing) return` como 1º statement, validada
  // pelo Tester no packet anterior) — a instrução do dono prevalece.
  // Legado: o form de Cliente (`agro365/resources/views/clients/_forms.blade.php:3`)
  // não tem handler de `blur` próprio no campo `nif`, mas o legado tinha um
  // autofill GLOBAL em `agro365/public/js/main.js:434` que, ao sair do
  // CPF/CNPJ, preenchia apenas campos de `people` (não os do papel Client).
  // Não há precedente de legado sobre "dispara ou não na edição"; por isso o
  // guard abaixo adota a leitura mais conservadora: só dispara quando o
  // documento MUDOU de fato.
  //
  // Guard novo (item 1 da ficha original) — só dispara quando o documento
  // REALMENTE MUDOU em relação ao valor carregado da API
  // (`originalNifDigitsRef`, comparação por DÍGITOS, não pela string
  // formatada — evita falso positivo de uma diferença só de máscara). Focar
  // e sair do campo sem alterar (ou alterar e voltar ao valor original) NÃO
  // dispara requisição nem toca em nenhum campo.
  async function handleNifBlur() {
    const current = watch('nif');
    if (!isValidCpfCnpj(current)) return;

    const currentDigits = normalizeDocument(current);
    if (isEditing && currentDigits === originalNifDigitsRef.current) return;

    await runSequencedAutofill(async () => {
      // DA-CL-21 — NIF enviado em DÍGITOS CRUS (evita qualquer footgun de
      // barra/ponto no path do CNPJ mascarado); `findByNif` normalizado por
      // `TASK-PES-01` já compara dígitos-contra-dígitos dos 2 lados, então
      // esta escolha não muda o resultado do lookup, só evita a codificação
      // de caracteres especiais na URL.
      //
      // 404/403 (Pessoa não encontrada com este documento) já viram `null`
      // por este mesmo `.catch(() => null)` — comportamento PREEXISTENTE,
      // inalterado. Em EDIÇÃO isso é ainda mais importante: "não encontrado"
      // significa apenas "nenhuma outra Pessoa tem este documento" — o form
      // atual permanece intocado, NUNCA é limpo.
      const found = await getClientByNif(currentDigits).catch(() => null);
      if (!found) return;

      setValue('name', found.name, { shouldDirty: true, shouldValidate: true });
      setValue('nickname', found.nickname, { shouldDirty: true, shouldValidate: true });
      setValue('email', found.email ?? null, { shouldDirty: true, shouldValidate: true });
      setValue('phone', found.phone ?? null, { shouldDirty: true, shouldValidate: true });
      setValue('address', found.address ?? '', { shouldDirty: true, shouldValidate: true });
      setValue('number', found.number ?? '', { shouldDirty: true, shouldValidate: true });
      setValue('district', found.district ?? '', { shouldDirty: true, shouldValidate: true });
      setValue('zip_code', found.zip_code ?? null, { shouldDirty: true, shouldValidate: true });
      // Achado (Client-contrato.md ## 13, não-bloqueante) — `city` incluído
      // no prefill: `PersonResource.city`/`PersonCityRef` já expõem `uuid`,
      // mesmo shape de `Option` que `buildClientFormDefaultValues`/o
      // autofill de CEP já montam neste mesmo arquivo.
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

      // UT-000740 — Cliente já existe aqui (`uuid` não-null): preenche também
      // os campos do papel, reaproveitando `buildClientFormDefaultValues`.
      // `uuid` null (Pessoa sem papel Client visível): não toca nos campos do
      // papel — mantém o que o usuário digitou.
      if (found.uuid) {
        const role = buildClientFormDefaultValues({
          ...found,
          uuid: found.uuid,
          city: found.city ?? null,
          is_enabled: found.is_enabled ?? true,
          final_costumer: found.final_costumer ?? false,
          taxpayer: found.taxpayer ?? true,
          code_country: found.code_country as number,
          state_registrations: found.state_registrations ?? [],
        });
        const roleOpts = { shouldDirty: true, shouldValidate: true } as const;
        setValue('cellphone', role.cellphone, roleOpts);
        setValue('contact', role.contact, roleOpts);
        setValue('contact_phone', role.contact_phone, roleOpts);
        setValue('farm_name', role.farm_name, roleOpts);
        setValue('is_enabled', role.is_enabled, roleOpts);
        setValue('final_costumer', role.final_costumer, roleOpts);
        setValue('taxpayer', role.taxpayer, roleOpts);
        // `shouldDirty: true` — o efeito default "Brasil" (criação) não
        // sobrescreve (`dirtyFields.code_country`).
        setValue('code_country', role.code_country, roleOpts);
        setValue('id_abroad', role.id_abroad, roleOpts);
        setValue('city_registration', role.city_registration, roleOpts);
        // `useFieldArray`: `replace` (não `setValue`) — footgun 2 do cabeçalho.
        registrationsArray.replace(role.state_registrations);
      }

      // AJUSTE DE HOMOLOGAÇÃO — toast diferenciado por contexto (item 4 da
      // ficha original): em EDIÇÃO, o usuário precisa entender que os dados
      // de OUTRA Pessoa acabaram de substituir o que estava no formulário
      // (não é o mesmo aviso de criação, que fala em "atualizar o
      // registro").
      toaster.create({
        type: 'warning',
        title: text.singularLabel,
        description: isEditing ? text.form.nifFoundWarningEditing : text.form.nifFoundWarning,
      });
    });
  }

  // Autofill de CEP (molde EXATO `Contador/CreateOrUpdateContador.tsx::handleCepBlur`,
  // já replicado em `Proprietarios/CreateOrUpdateProprietario.tsx`).
  //
  // DEFEITO-CLIENTES-01 (2026-07-30) — causa-raiz REAL confirmada por teste
  // instrumentado (não pela hipótese de "reordenação quebrou a fiação" — a
  // fiação `setValue`/`Controller` já estava correta, provado montando
  // `ClientFormBody` isolado e chamando `setValue('city', ...)` diretamente:
  // o Select reflete a mudança). O bug é que `viaCep.logradouro`/
  // `viaCep.bairro` vêm **STRING VAZIA** (não `undefined`/erro) para CEPs
  // sem numeração de rua — comum em cidades pequenas/rurais (confirmado
  // via ViaCEP real: `GET /ws/77395000/json/` devolve
  // `{logradouro:"", bairro:"", localidade:"Porto Alegre do Tocantins", ...}`).
  // O código ANTERIOR fazia `setValue('address', '')`/`setValue('district', '')`
  // incondicionalmente — os campos ficavam vazios SEM nenhum aviso,
  // indistinguível de "o autofill quebrou" do ponto de vista do usuário.
  // Fix: só preenche quando o ViaCEP realmente devolveu dado; caso
  // contrário deixa o campo para preenchimento manual E avisa via toast
  // (`partialData`) — mesmo tratamento que já existe para
  // `cityNotResolved`.
  async function handleCepBlur(event: FocusEvent<HTMLInputElement>) {
    const digits = cleanMask(event.target.value ?? '');
    if (digits.length !== 8) return;

    // Enfileirado via `runSequencedAutofill` (ver comentário acima) — nunca
    // roda intercalado com o prefill de NIF; ambos escrevem em
    // `address`/`district`/`city`, então quem o usuário blurou por último
    // sempre vence, determinístico. Corpo INTOCADO (só envolvido pelo
    // wrapper) — preserva 1:1 a lógica condicional já corrigida de
    // DEFEITO-CLIENTES-01.
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

        const streetData = viaCep.logradouro?.trim();
        const districtData = viaCep.bairro?.trim();

        if (streetData) {
          setValue('address', streetData, { shouldDirty: true, shouldValidate: true });
        }
        if (districtData) {
          setValue('district', districtData, { shouldDirty: true, shouldValidate: true });
        }
        if (!streetData || !districtData) {
          // ViaCEP não tem granularidade de rua/bairro para este CEP (comum em
          // CEPs de cidade pequena) — avisa em vez de deixar o usuário
          // adivinhar por que o campo não populou.
          toaster.create({
            type: 'warning',
            title: text.form.cepAutofill.partialData.title,
            description: text.form.cepAutofill.partialData.description,
          });
        }

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

  // `state_registrations.${index}.value` — dígitos OU `ISENTO` (D5). A UI
  // renderiza `<MaskedInput kind="digitsOrIsento">` (ClientFormFields), que
  // filtra qualquer outra letra antes de gravar via este `register`.
  function registerStateRegistration(index: number) {
    return register(`state_registrations.${index}.value` as const);
  }

  return {
    control,
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    errors,
    dirtyFields,
    registrationsArray,
    registerStateRegistration,
    handleNifBlur,
    handleCepBlur,
    isAutofillBusy,
    onSubmit,
    isSubmitting,
  };
}
