// src/pages/CadastrosBase/Funcionarios/CreateOrUpdateFuncionario.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de FUNCIONÁRIO (Employee — Cadastros Base,
// TASK-EMP-FE-03). Rotas: /cadastros-base/funcionarios/novo (criar,
// `employees_create`) e /cadastros-base/funcionarios/:employeeUuid (editar,
// GUID, `employees_edit`) — já registradas em `router/index.tsx`
// (TASK-EMP-FE-02), substitui os 2 `<RoutePlaceholder />`.
//
// Sem `Tabs.Root` (Employee-FrontEnd-contrato.md `## 2`/`## 6`) — molde
// single-page mais próximo de `Clientes/CreateOrUpdateCliente.tsx` (sem
// filiais/vendedores/abas de Fornecedores). 3 seções: "Dados Pessoais"
// (raiz Person), "Vínculo Empregatício" (bloco `employee.*`) e "Dados
// Bancários / PIX" (reativo por `pix_type`).
//
// ARQUITETURA gated-mount (mirror `CreateOrUpdateFornecedor.tsx`/
// `CreateOrUpdateCliente.tsx`, TASK-PR-FE-10): DOIS componentes.
//   - `CreateOrUpdateFuncionario` (wrapper, export default) — só resolve
//     `employeeUuid`/permissões e dispara `employeeQuery`
//     (`useEmployeeForm`, `fillForm` no-op — TASK-EMP-FE-02). Em EDIÇÃO,
//     enquanto o detalhe não chega, renderiza Skeleton (nunca form vazio
//     momentâneo). Em CRIAÇÃO, monta `EmployeeFormBody` imediatamente.
//   - `EmployeeFormBody` (interno) — só monta quando os dados já existem.
//     `defaultValues` computados SINCRONAMENTE via
//     `buildEmployeeFormDefaultValues` (mesmo mapeamento que viveria num
//     `fillForm`/`reset()`) e inicializa `useForm` já populado — nenhum
//     `reset()` necessário para a hidratação inicial. `key={employeeUuid ??
//     'new'}` no wrapper garante remount limpo entre edições diferentes.
//
// Independência arquitetural (DA-EMP-11) — zero import de
// `Pessoas/StepFuncionario.tsx`/`Pessoas/pessoa-schema.ts`/
// `Pessoas/pessoa.types.ts` (grep confirma). `isValidCpfCnpj`/`onlyDigits`
// são EXTRAÍDOS do util PURO e COMPARTILHADO `@/utils/cpfCnpj` (mesma fonte
// que `Pessoas/nif.ts` re-exporta, mas consumida aqui diretamente — mesmo
// padrão de independência já usado por `CreateOrUpdateFornecedor.tsx`/
// `CreateOrUpdateCliente.tsx`, que também não importam `Pessoas/nif.ts`).
//
// `nif`/`pix` (quando `pix_type===0`): migrados (97-Esteiras/001, Wave 1)
// para `<MaskedInput kind="cpfCnpj">` (`src/components/Form/MaskedInput.tsx`)
// — o componente já infere CPF/CNPJ pela contagem de dígitos crus
// internamente, sem `maskDocType`/`cpfCnpjBeforeMaskedStateChange`/
// `react-input-mask`. `formatDocument` (`@/utils/format-document`, agora
// shim fino para `utils/masks/document.ts`) continua usado só no prefill de
// `fillForm`/`defaultValues` (valor já completo vindo da API).
//
// `zip_code`: `MaskedInput kind="cep"` + autofill ViaCEP no `onBlur` (molde
// EXATO de `CreateOrUpdateFornecedor.tsx::handleCepBlur`) — preenche
// `address`/`district`/`city`; nenhuma falha trava o form (só toast,
// preenchimento manual sempre disponível).
//
// `city`/`function`/`center`/`bank`: `SelectAsyncPaginate` portalizados
// (`menuPortalTarget={document.body}`/`menuPosition="fixed"`, checklist
// item 12) — `value={field.value ?? null}` NUNCA `?? undefined` (checklist
// item 16).
//
// Bloco "Dados Bancários / PIX" (extraído literalmente de
// `Pessoas/steps/StepFuncionario.tsx`, Employee-FrontEnd-contrato.md
// `## 4.1`): `pix` reativo por `pix_type` — `MaskedInput kind="cpfCnpj"`
// quando `0`, `MaskedInput kind="phone"` quando `2`, `Input` (email/texto)
// quando
// `1`/`3`/null. `account_type`: `Select` estático com as 2 opções
// (Corrente/Poupança) traduzidas via i18n (mesmas 2 opções de
// `StepFuncionario.tsx::ACCOUNT_TYPE_OPTIONS`, não importadas de lá —
// reconstruídas com rótulo vindo da tradução do módulo Employee, já
// preparada em `TASK-EMP-FE-01`).
//
// GAP-EMP-FE-02 FECHADO no front (2026-08-02, follow-up CIRÚRGICO de
// `TASK-EMP-FE-03` — correção de API em `TASK-EMP-06`, api_root):
// `EmployeeDetailResource` passou a devolver `bank`/`account_type`/`agency`/
// `account` (lidos do Provider-espelho tipo Funcionário, critério
// determinístico `updated_at DESC, id DESC`, DA-EMP-21). Os 4 campos agora
// hidratam e enviam normalmente em AMBOS os modos, igual a `pix`/`pix_type`
// — nenhum campo nasce desabilitado, nenhuma chave é omitida do payload.
// Caso nulo (Employee sem dado bancário gravado no Provider-espelho ainda):
// a API devolve os 4 campos como `null`, os inputs nascem vazios/sem seleção
// (estado de UI honesto), sem lixo enviado de volta se o usuário não
// preencher. Ver
// `04-Gaps_Frontend_UI/GAP-EMP-FE-02-bloco-bancario-nao-hidrata-em-edicao-employeedetailresource-omite-campos.md`.
//
// Guard `onSubmit` (checklist item 2, forma EXPLÍCITA obrigatória):
// `Object.keys(dirtyFields).length === 0` — NUNCA `isEmpty`/`!isEmpty`
// (`src/utils/isEmpty.ts`, cuja polaridade já causou 9 incidentes
// confirmados no projeto).
//
// Payload de `update`: campos raiz + bloco `employee.*` (incluindo o bloco
// bancário, desde o fechamento do GAP-EMP-FE-02 acima) SEMPRE completos
// (full-resource-replace, checklist item 3) — sem exceção remanescente.
// -----------------------------------------------------------------------------

import { type FocusEvent, useRef, useState } from 'react';

import { Box, Field as ChakraField, SimpleGrid, Skeleton, Text } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { MaskedInput } from '@/components/Form/MaskedInput';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { PercentInput } from '@/components/Form/PercentInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';
import { Switch } from '@/components/ui/switch';
import { toaster } from '@/components/ui/toaster';

import { useCurrentFarm } from '@/hooks/useCurrentFarm';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import cleanMask from '@/utils/clean-mask';
import { isValidCpfCnpj, normalizeDocument } from '@/utils/cpfCnpj';
import { extractApiFieldErrorMessage } from '@/utils/extractApiErrorMessage';
// Extraído do util PURO/compartilhado — NÃO de `Pessoas/nif.ts` (independência
// arquitetural, mesmo padrão de Fornecedores/Clientes). `isValidCpfCnpj`/
// `onlyDigits` — TASK-EMP-FE-05 (correção `ERRO-05`), guarda de dígito
// verificador do prefill de NIF (mesmo módulo já usado nesta tela, NÃO
// `@/utils/validateCpfCnpj.ts`).
import { formatDocument } from '@/utils/format-document';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { employeeSchemaResolver } from '@/validations/schemas/CadastrosBase/employee-schema';

import { listBankOptions } from '@/services/v2/Banks/bank-service';
import {
  createEmployee,
  listEmployees,
  updateEmployee,
} from '@/services/v2/CadastrosBase/Employee/employee-service';
import { getCityByIso, listCityOptions } from '@/services/v2/Cities/city-service';
import { listCostCenterOptions } from '@/services/v2/CostCenters/cost-center-service';
import { listFunctionOptions } from '@/services/v2/Functions/function-service';
// TASK-EMP-FE-05 (correção `ERRO-05`) — reuso do endpoint já migrado
// `GET /api/v1/people/by-nif/{nif}`, ZERO service/endpoint novo.
import { getPersonByNif } from '@/services/v2/People/person-service';
import { listRoles } from '@/services/v2/Roles/role-service';
import { getAddressByCep } from '@/services/viacep';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { BankOptionItem } from '@/@types/v2/Banks';
import type {
  CreateEmployeeRequest,
  EmployeeDetail,
  EmployeeForm as EmployeeFormType,
  UpdateEmployeeRequest,
} from '@/@types/v2/CadastrosBase/employee';
import type { CityListItem } from '@/@types/v2/Cities';
import type { CostCenterRef } from '@/@types/v2/CostCenters';
import type { FunctionOption } from '@/@types/v2/Functions';
import type { RoleListItem } from '@/@types/v2/Roles';

import { useEmployeeForm } from './useFuncionarios';

// `defaultValues` estáticos vazios (modo CRIAÇÃO, `initialData === undefined`).
const EMPTY_EMPLOYEE_FORM_DEFAULTS: EmployeeFormType = {
  nif: '',
  name: '',
  nickname: '',
  email: null,
  phone: null,
  zip_code: null,
  address: '',
  number: '',
  district: '',
  city: null,
  office: null,
  function: null,
  commission: null,
  vl_time_productive: null,
  base_salary: null,
  goal_salary: null,
  center: null,
  birthday: null,
  bank: null,
  account_type: null,
  agency: null,
  account: null,
  pix_type: null,
  pix: null,
  // Bloco opcional "Acesso ao Sistema" (DA-EMP-06, TASK-EMP-FE-04) — só
  // existe na criação, sempre nasce desmarcado/sem perfil.
  create_user: false,
  role: null,
};

function getPixTypeOptions(languageGB: LanguageDate): Option<number>[] {
  const text = languageGB.employees.employee;
  return [
    { value: 0, label: text.pixTypeOptions.cpfCnpj },
    { value: 1, label: text.pixTypeOptions.email },
    { value: 2, label: text.pixTypeOptions.phone },
    { value: 3, label: text.pixTypeOptions.random },
  ];
}

// Reconstruído com rótulo traduzido — NÃO importado de
// `StepFuncionario.tsx::ACCOUNT_TYPE_OPTIONS` (independência arquitetural,
// mesmos 2 valores `C`/`P` aceitos como string livre pelo backend).
function getAccountTypeOptions(languageGB: LanguageDate): Option<string>[] {
  const text = languageGB.employees.employee;
  return [
    { value: 'C', label: text.accountTypeOptions.checking },
    { value: 'P', label: text.accountTypeOptions.savings },
  ];
}

// buildEmployeeFormDefaultValues — computa `defaultValues` SINCRONAMENTE a
// partir do detalhe real (`data`), usado como `defaultValues` de PRIMEIRO
// mount do `useForm` em `EmployeeFormBody` (nunca como argumento de um
// `reset()` posterior). `data === undefined` (modo criação) devolve os
// defaults estáticos vazios.
//
// GAP-EMP-FE-02 FECHADO (follow-up, TASK-EMP-06 api_root) — `bank`/
// `account_type`/`agency`/`account` agora hidratam normalmente em edição,
// igual a `pix`/`pix_type`: `EmployeeDetailResource` passa a devolver os 4
// campos (lidos do Provider-espelho tipo Funcionário). Caso nulo (nenhum
// registro de fornecedor-espelho com dado bancário gravado, ex.: Employee
// criado antes desta correção): `data.bank`/`account_type`/`agency`/
// `account` vêm `null` da API — os 4 campos nascem vazios/sem seleção
// (estado de UI honesto), sem lixo no payload (ver `tryPersistEmployee`).
function buildEmployeeFormDefaultValues(
  data: EmployeeDetail | undefined,
  languageGB: LanguageDate
): EmployeeFormType {
  if (!data) return EMPTY_EMPLOYEE_FORM_DEFAULTS;

  const pixTypeOptions = getPixTypeOptions(languageGB);

  return {
    uuid: data.uuid,
    nif: formatDocument(data.nif ?? ''),
    name: data.name,
    nickname: data.nickname,
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
    office: data.office ?? null,
    function:
      data.function?.uuid != null
        ? { label: data.function.name ?? '', value: data.function.uuid }
        : null,
    commission: data.commission ?? null,
    vl_time_productive: data.vl_time_productive ?? null,
    base_salary: data.base_salary ?? null,
    goal_salary: data.goal_salary ?? null,
    center:
      data.center?.uuid != null
        ? {
            label: `${data.center.code ?? ''} — ${data.center.description ?? ''}`,
            value: data.center.uuid,
          }
        : null,
    birthday: data.birthday ?? null,
    // GAP-EMP-FE-02 FECHADO — hidratado normalmente (ver nota acima). `bank`
    // vira `Option<bankUuid>` quando a API devolve o nested `{uuid,code,name}`;
    // `null` (sem opção selecionada) quando não há dado bancário gravado.
    bank: data.bank
      ? { label: `${data.bank.code}-${data.bank.name}`, value: data.bank.uuid }
      : null,
    // UT-000712 (correção, esteira 100) — `account_type` vem da API como
    // string de coluna `char` legada preenchida com espaços à direita (ex.:
    // `"C"` + ~190 espaços); `trim()` garante que o valor hidratado case
    // com as opções estáticas (`'C'`/`'P'`) do `<Select>` abaixo. O payload
    // de save já reenvia o valor corretamente (`tryPersistEmployee` usa
    // `data.account_type || null`, que não precisa de mudança).
    account_type: data.account_type?.trim() || null,
    agency: data.agency ?? null,
    account: data.account ?? null,
    pix_type: pixTypeOptions.find((option) => option.value === data.pix_type) ?? null,
    pix: data.pix ?? null,
    create_user: false,
    role: null,
  };
}

// ---- Wrapper (export default) ----------------------------------------------
export default function CreateOrUpdateFuncionario() {
  const { employeeUuid } = useParams<{ employeeUuid: string }>();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.employees.employee;

  // É edição quando existe um GUID válido na rota ("novo" não é GUID).
  const isEditing = isValidGuid(employeeUuid);

  const canSave = isEditing ? can('employees_edit') : can('employees_create');

  const employeeQuery = useEmployeeForm({ registrationId: isEditing ? employeeUuid : undefined });

  const isLoading = isEditing && checkLoadingStatus([employeeQuery as any]);

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
    <EmployeeFormBody
      // `key` garante remount limpo se o usuário navegar entre edições
      // diferentes sem passar pela listagem.
      key={employeeUuid ?? 'new'}
      initialData={employeeQuery.data as EmployeeDetail | undefined}
      isEditing={isEditing}
      employeeUuid={employeeUuid}
      canSave={canSave}
    />
  );
}

interface EmployeeFormBodyProps {
  initialData?: EmployeeDetail;
  isEditing: boolean;
  employeeUuid?: string;
  canSave: boolean;
}

// ---- Corpo interno -----------------------------------------------------
function EmployeeFormBody({
  initialData,
  isEditing,
  employeeUuid,
  canSave,
}: EmployeeFormBodyProps) {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const text = languageGB.employees.employee;

  const pixTypeOptions = getPixTypeOptions(languageGB);
  const accountTypeOptions = getAccountTypeOptions(languageGB);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<EmployeeFormType>({
    mode: 'onChange',
    resolver: employeeSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: buildEmployeeFormDefaultValues(initialData, languageGB),
  });

  // Prefill de CPF/CNPJ (TASK-EMP-FE-05, correção de `ERRO-05`) — baseline do
  // NIF carregado da API em DÍGITOS CRUS (`onlyDigits`), mirror
  // `CreateOrUpdateCliente.tsx:418`. Guard 2 de `handleNifBlur`: em edição, o
  // prefill só dispara quando o documento atual difere deste valor —
  // comparação por dígitos (não pela string mascarada), evita falso
  // positivo por diferença só de formatação.
  const originalNifDigitsRef = useRef(normalizeDocument(initialData?.nif ?? ''));

  const queryClient = useQueryClient();

  // ⚠️ NÃO usa `useRequest` aqui — mesma razão documentada em
  // `Administrativo/Funcoes/index.tsx`/`Marker/index.tsx`/`Contador/index.tsx`:
  // o `onError` genérico de `useRequest` só lê `resData.message` (string crua
  // do backend), nunca `errors.*` tipado — esconderia o 422 estruturado
  // `errors.create_user` do limite de usuários (DA-EMP-06,
  // `hasReachedUsersLimits`). `useMutation` direto replica o mesmo
  // sucesso/fallback de `useRequest`, mais a inspeção tipada ANTES do
  // fallback genérico.
  const employeeMutation = useMutation({
    mutationFn: tryPersistEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey.cadastrosBase.employees] });
      queryClient.invalidateQueries({ queryKey: [queryKey.cadastrosBase.employee] });

      toaster.success({
        title: text.singularLabel,
        description: isEditing
          ? languageGB.defaltStrings.updateRegister
          : languageGB.defaltStrings.createRegister,
        duration: 7000,
      });

      navigate(-1);
    },
    onError: (error) => {
      console.error('Employee save - error:', error);

      // Se é 403 de tier, não mostrar toast — o interceptor já tratou via useTierAccessDenied.
      if (isAxiosError(error) && (error as any)._tierHandled) {
        return;
      }

      // 422 tipado do limite de usuários do plano (DA-EMP-06,
      // `hasReachedUsersLimits`/`EmployeeController::store()`) — inspeciona
      // `errors.create_user` ANTES de qualquer fallback genérico (mirror
      // `FunctionInUseDialog`/`ClientInUseDialog`: nunca um toast cru para
      // este caso). Mensagem SEMPRE traduzida (`text.form.user.
      // limitReachedError`), NUNCA a string literal devolvida pelo backend
      // (SEVERIDADE — i18n modular, mesmo em cima de um 422 de negócio).
      if (isAxiosError(error) && error.response?.status === 422) {
        const resData = error.response.data as Partial<{ errors: Record<string, string[]> | null }>;

        if (
          resData?.errors &&
          Object.prototype.hasOwnProperty.call(resData.errors, 'create_user')
        ) {
          setError('create_user', { type: 'server', message: text.form.user.limitReachedError });
          toaster.error({
            title: text.singularLabel,
            description: text.form.user.limitReachedError,
            duration: 9000,
          });
          return;
        }
      }

      // Fallback: qualquer outro erro (401/403/500/422 residual não
      // estruturado) — mesmo formato de `useRequest`.
      let errorMessage = languageGB.common.errorLog.unknownError;
      if (isAxiosError(error)) {
        const statusCode = error.response?.status || null;
        const resData = error.response?.data as any;

        if (resData?.message) {
          const msg =
            extractApiFieldErrorMessage(error) ??
            (typeof resData.message === 'string'
              ? resData.message
              : JSON.stringify(resData.message));
          errorMessage = `${statusCode} — ${msg}`;
        } else if (error.message) {
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toaster.error({
        title: text.singularLabel,
        description: errorMessage,
        duration: 7000,
      });
    },
  });

  async function tryPersistEmployee(data: EmployeeFormType) {
    // Payload raiz SEMPRE completo (full-resource-replace, checklist item 3)
    // — `nif`/`name`/`nickname`/`address`/`number`/`district`/`city_uuid` são
    // `required` em ambos os verbos; `email`/`phone`/`zip_code` também
    // sempre enviados (nenhum é `sometimes` no `EmployeeRequest`).
    const payload: CreateEmployeeRequest = {
      nif: normalizeDocument(data.nif),
      name: data.name.trim(),
      nickname: data.nickname.trim(),
      email: data.email?.trim() || null,
      phone: data.phone || null,
      zip_code: data.zip_code || null,
      address: data.address.trim(),
      number: data.number.trim(),
      district: data.district.trim(),
      city_uuid: data.city?.value ?? '',
      employee: {
        office: data.office?.trim() || null,
        // `function`/`birthday`/`base_salary` SEMPRE obrigatórios (schema já
        // garante, TASK-EMP-FE-01) — fallback só por segurança de tipo.
        function_uuid: data.function?.value ?? '',
        commission: data.commission ?? null,
        vl_time_productive: data.vl_time_productive ?? null,
        base_salary: data.base_salary ?? 0,
        goal_salary: data.goal_salary ?? null,
        center_uuid: data.center?.value ?? null,
        birthday: data.birthday ?? '',
        // Bloco bancário — GAP-EMP-FE-02 FECHADO (TASK-EMP-06, api_root):
        // sempre enviado completo em AMBOS os modos (full-resource-replace,
        // checklist item 3) — `EmployeeDetailResource` já devolve o valor
        // atual em edição, não há mais risco de sobrescrever com vazio um
        // dado que o front não conseguia ler.
        bank_uuid: data.bank?.value ?? null,
        account_type: data.account_type || null,
        agency: data.agency || null,
        account: data.account || null,
        // `pix`/`pix_type` NÃO foram afetados por GAP-EMP-FE-02 (coluna
        // física de `employees`, sempre hidratados) — sempre enviados completos.
        pix_type: data.pix_type?.value ?? null,
        pix: data.pix || null,
      },
    };

    if (!isEditing) {
      // Bloco opcional `create_user`/`role_uuid` (DA-EMP-06) — SÓ na
      // criação (`EmployeeRequest::rules()` nem valida essas chaves no
      // PUT/PATCH, checklist item 18/19). `create_user` SEMPRE enviado
      // (`?? false`, nunca `|| false` — `false` é valor legítimo, não pode
      // ser descartado do payload por acidente). `role_uuid` só entra no
      // payload quando `create_user===true` — `EmployeeRequest.php:177-182`
      // NÃO tem `nullable` para `role_uuid`, então enviar `null` explícito
      // com `create_user=false` quebraria a validação `string|uuid` à toa;
      // `undefined` é removido pelo `JSON.stringify` do axios (chave
      // omitida, não um `null` fingido).
      payload.create_user = data.create_user ?? false;
      payload.role_uuid = data.create_user ? (data.role?.value ?? undefined) : undefined;
    }

    if (isEditing && employeeUuid) {
      return await updateEmployee(employeeUuid, payload as UpdateEmployeeRequest);
    }

    return await createEmployee(payload);
  }

  async function onSubmit(data: EmployeeFormType) {
    // Guard EXPLÍCITO (checklist item 2) — nada mudou numa edição: só
    // navega, sem PUT vazio. NUNCA `isEmpty`/`!isEmpty` (polaridade já
    // causou 9 incidentes confirmados no projeto).
    //
    // Interação com o prefill de NIF (TASK-EMP-FE-05) — `handleNifBlur`
    // preenche campos com `shouldDirty:true`, então `dirtyFields` deixa de
    // estar vazio assim que o lookup encontra uma Pessoa. Comportamento
    // DECLARADO, não um efeito colateral acidental: se o autofill sujou o
    // form, há dado novo a persistir, então o guard corretamente NÃO
    // bloqueia o submit (segue para `employeeMutation.mutateAsync`) — mesmo
    // comportamento já vigente em Clientes (`TASK-CL-FE-04`).
    if (isEditing && Object.keys(dirtyFields).length === 0) {
      navigate(-1);
      return;
    }
    await employeeMutation.mutateAsync(data);
  }

  const isSubmitting = employeeMutation.isPending;

  // ---- Coordenação entre o prefill de NIF (TASK-EMP-FE-05, correção de
  // `ERRO-05`) e o autofill de CEP já existente (`handleCepBlur`) — ambos são
  // handlers `onBlur` assíncronos e competem pelos MESMOS campos
  // (`address`/`district`/`city`). Sem coordenação, um blur rápido no campo
  // seguinte enquanto o primeiro fetch ainda está em voo poderia intercalar
  // as 2 escritas em ordem imprevisível. Mirror EXATO
  // `CreateOrUpdateCliente.tsx:566-582` (TASK-CL-FE-04, já ✅ CONCLUÍDO).
  //
  // `autofillChainRef` serializa a execução: cada handler enfileira seu
  // trabalho encadeado no anterior (`.then`), nunca roda em paralelo com o
  // outro — quem o usuário acionou por ÚLTIMO sempre escreve por último,
  // resultado determinístico. `autofillBusyCount` (contador, não boolean —
  // os 2 podem se enfileirar) vira `isAutofillBusy`, usado para desabilitar
  // os campos raiz que os 2 handlers podem sobrescrever enquanto qualquer um
  // está em voo.
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

  // Prefill de CPF/CNPJ (TASK-EMP-FE-05, correção de `ERRO-05`) — mirror
  // `CreateOrUpdateCliente.tsx::handleNifBlur` (TASK-CL-FE-04, já ✅
  // CONCLUÍDO), reusando o MESMO service (`getPersonByNif`, ZERO
  // service/endpoint novo), adaptado aos campos raiz de `Person` presentes
  // nesta tela. Campos de folha (`office`, `commission`, salários,
  // `birthday`, bloco bancário/`pix`) NÃO são preenchidos — fidelidade ao
  // legado, que também só preenchia raiz de `Person` (`main.js:514-523`).
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
  //     feita aqui, na página, sem tocar o service compartilhado.
  //   - Qualquer outro erro (network/5xx) é ignorado silenciosamente — mesmo
  //     padrão do autofill de CEP abaixo: é um atalho, nunca pode travar o
  //     formulário.
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

      // UT-000712 (correção, esteira 100) — Bug 2: no modo CRIAÇÃO, se o
      // CPF/CNPJ já pertence a um Employee EXISTENTE na fazenda ativa,
      // redireciona para a tela de EDIÇÃO desse Employee em vez de prefill
      // parcial (decisão do dono). Motivo: o prefill parcial só preenche
      // campos raiz de Person; o bloco "Vínculo Empregatício" ficaria em
      // branco, e o POST (upsert-por-nif, full-resource-replace)
      // sobrescreveria com vazio os dados reais do funcionário já gravado.
      // Fail-safe obrigatório: qualquer erro do lookup (403 sem
      // `employees_view`, rede, etc.) cai no comportamento atual de
      // prefill abaixo — o atalho nunca pode impedir o formulário.
      if (!isEditing) {
        try {
          const existingEmployees = await listEmployees({ search: currentDigits });
          const matchingEmployee = existingEmployees.data.items.find(
            (item) => normalizeDocument(item.nif) === currentDigits
          );

          if (matchingEmployee) {
            toaster.create({
              type: 'info',
              title: text.singularLabel,
              description: text.form.employeeAlreadyExistsRedirectWarning,
            });
            navigate(`/cadastros-base/funcionarios/${matchingEmployee.uuid}`);
            return;
          }
        } catch {
          // Fail-safe — rede/403 (sem `employees_view`) etc.: segue para o
          // prefill parcial abaixo, nunca trava o formulário.
        }
      }

      // Bug 3 (F-164, esteira 090): só preenche campo que o usuário AINDA
      // NÃO tocou (`dirtyFields[campo]`) — sem essa guarda, cada blur no NIF
      // sobrescrevia dado já digitado (inclusive no create, em que TODO blur
      // refazia o lookup e reescrevia por cima). Guarda por campo, não pelo
      // form inteiro — preenche o que está vazio, preserva o que o usuário
      // já editou.
      if (!dirtyFields.name) {
        setValue('name', found.name, { shouldDirty: true, shouldValidate: true });
      }
      if (!dirtyFields.nickname) {
        setValue('nickname', found.nickname, { shouldDirty: true, shouldValidate: true });
      }
      if (!dirtyFields.email) {
        setValue('email', found.email ?? null, { shouldDirty: true, shouldValidate: true });
      }
      if (!dirtyFields.phone) {
        setValue('phone', found.phone ?? null, { shouldDirty: true, shouldValidate: true });
      }
      if (!dirtyFields.address) {
        setValue('address', found.address ?? '', { shouldDirty: true, shouldValidate: true });
      }
      if (!dirtyFields.number) {
        setValue('number', found.number ?? '', { shouldDirty: true, shouldValidate: true });
      }
      if (!dirtyFields.district) {
        setValue('district', found.district ?? '', { shouldDirty: true, shouldValidate: true });
      }
      if (!dirtyFields.zip_code) {
        setValue('zip_code', found.zip_code ?? null, { shouldDirty: true, shouldValidate: true });
      }
      if (!dirtyFields.city) {
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
      }

      // Toast diferenciado criação × edição (item 8 da ficha) — SEMPRE
      // dispara quando uma Pessoa é encontrada (fora do `if` de qualquer
      // campo acima, de propósito — consistência do aviso não pode depender
      // de quantos campos a guarda de `dirtyFields` decidiu preencher).
      toaster.create({
        type: 'warning',
        title: text.singularLabel,
        description: isEditing ? text.form.nifFoundWarningEditing : text.form.nifFoundWarning,
      });
    });
  }

  // Autofill de CEP (molde EXATO `CreateOrUpdateFornecedor.tsx::handleCepBlur`)
  // — dispara no `onBlur` de `zip_code`, só com 8 dígitos limpos. Nenhuma
  // falha trava o formulário — só toast, preenchimento manual sempre
  // disponível.
  //
  // Enfileirado via `runSequencedAutofill` (TASK-EMP-FE-05, ver comentário
  // acima) — nunca roda intercalado com o prefill de NIF; ambos escrevem em
  // `address`/`district`/`city`, então quem o usuário blurou por último
  // sempre vence, determinístico. Corpo INTOCADO (só envolvido pelo
  // wrapper), mirror `CreateOrUpdateCliente.tsx:698` em diante.
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

  // Bloco reativo `pix`/`pix_type` (extraído literalmente de
  // `Pessoas/steps/StepFuncionario.tsx`, ver nota de cabeçalho) — CPF/CNPJ
  // dinâmico quando `0`, telefone quando `2`, e-mail/texto quando `1`/`3`/
  // null. Migrado (97-Esteiras/001, Wave 1) para `<MaskedInput
  // kind="cpfCnpj">` — o componente já infere CPF/CNPJ internamente
  // (`utils/masks/document.ts::maskDocTypeOfDigits`), sem depender de
  // `maskDocType`/`cpfCnpjBeforeMaskedStateChange`/`react-input-mask`.
  const pixType = watch('pix_type');

  // Bloco opcional "Acesso ao Sistema" (`create_user`/`role`, DA-EMP-06) —
  // watch dedicado só para reagir na UI (mostrar `role`/destacar `email`).
  const createUser = watch('create_user');

  // Bloqueio (nunca ocultação) por permissão — ERRO-06/TASK-EMP-FE-06.
  // `roles_tenant_view` governa `GET /roles`; sem ela, o switch `create_user`
  // e o select `role` nascem desabilitados com motivo visível, sem jamais
  // disparar a chamada fadada ao 403 (nunca inferir de status HTTP/catch).
  const { can } = usePermissions();
  const canSeeRoles = can('roles_tenant_view');

  // GAP-EMP-01/TASK-EMP-FE-07 — bloqueio preventivo por limite de usuários do
  // plano. `enabled: !isEditing` — o bloco create_user só existe na criação.
  const currentFarmQuery = useCurrentFarm({ enabled: !isEditing });
  // Degradação OBRIGATÓRIA: ausência de dado (backend antigo, isLoading,
  // isError, users_quota null) NUNCA bloqueia — só bloqueia com sinal POSITIVO
  // e explícito do backend (`limit_reached === true`).
  const usersQuotaLimitReached = currentFarmQuery.data?.users_quota?.limit_reached ?? false;

  // Composição das DUAS razões de bloqueio (permissão + limite de plano) —
  // UNIÃO (OR), nunca uma sobrescreve a outra. Cada razão aplicável vira uma
  // linha própria no motivo visível (ver `.map()` mais abaixo).
  const createUserBlockReasons: string[] = [];
  if (!canSeeRoles) createUserBlockReasons.push(text.form.user.rolePermissionDenied);
  if (usersQuotaLimitReached) createUserBlockReasons.push(text.form.user.usersQuotaReached);

  return (
    <FormContainer
      title={isEditing ? text.form.title.edit : text.form.title.create}
      showDivider
      footer={
        <>
          <Button
            title={languageGB.defaltStrings.cancel}
            variant="outline"
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
        {/* ---- Seção "Dados Pessoais" (raiz Person) ----
            Reordenação CIRÚRGICA (esteira 090, pedido do dono) — ordem dos
            10 campos abaixo alterada para as 3 linhas: (1) CPF/CNPJ, Nome,
            Apelido, E-mail; (2) Telefone, CEP, Endereço; (3) Número, Bairro,
            Cidade. NENHUM colSpan/tamanho foi alterado — só a posição no
            JSX. `address`/`city` mantêm `gridColumn={{ base: 'auto', md:
            'span 2' }}` exatamente como antes. */}
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
                onChange={field.onChange}
                onBlur={() => {
                  field.onBlur();
                  handleNifBlur();
                }}
                error={error?.message}
                isRequired
                // UT-000712 (correção, esteira 100) — CPF/CNPJ bloqueado em
                // modo EDIÇÃO (campo-chave do upsert-por-nif, não deve ser
                // alterado após o funcionário já existir); continua editável
                // normalmente no modo CRIAÇÃO.
                disabled={!canSave || isEditing}
              />
            )}
          />
          <Input
            label={text.form.fields.name}
            {...register('name')}
            error={errors.name?.message}
            isRequired
            disabled={!canSave || isAutofillBusy}
          />
          <Input
            label={text.form.fields.nickname}
            {...register('nickname')}
            error={errors.nickname?.message}
            isRequired
            disabled={!canSave || isAutofillBusy}
          />
          <Input
            label={text.form.fields.email}
            type="email"
            spellCheck={false}
            {...register('email')}
            error={errors.email?.message}
            // Destaque visual (checklist da ficha) — `email` só é REALMENTE
            // obrigatório quando `create_user===true` (DA-EMP-06, `.when` do
            // schema); o asterisco só aparece nesse estado, sem alterar
            // nada no modo edição (bloco `create_user` nem existe lá).
            isRequired={!isEditing && !!createUser}
            disabled={!canSave || isAutofillBusy}
          />
        </SimpleGrid>

        <SimpleGrid columns={columnsForm.default} gap={6} mt={6}>
          <MaskedInput
            kind="phone"
            label={text.form.fields.phone}
            {...register('phone')}
            error={errors.phone?.message}
            disabled={!canSave || isAutofillBusy}
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
                disabled={!canSave || isAutofillBusy}
              />
            )}
          />
          <Box gridColumn={{ base: 'auto', md: 'span 2' }}>
            <Input
              label={text.form.fields.address}
              {...register('address')}
              error={errors.address?.message}
              isRequired
              disabled={!canSave || isAutofillBusy}
            />
          </Box>
        </SimpleGrid>

        <SimpleGrid columns={columnsForm.default} gap={6} mt={6}>
          <Input
            label={text.form.fields.number}
            {...register('number')}
            error={errors.number?.message}
            isRequired
            disabled={!canSave || isAutofillBusy}
          />
          <Input
            label={text.form.fields.district}
            {...register('district')}
            error={errors.district?.message}
            isRequired
            disabled={!canSave || isAutofillBusy}
          />
          <Box gridColumn={{ base: 'auto', md: 'span 2' }}>
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
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  error={error?.message}
                  isRequired
                  isDisabled={!canSave || isAutofillBusy}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              )}
            />
          </Box>
        </SimpleGrid>

        {/* ---- Seção "Vínculo Empregatício" (bloco `employee.*`) ---- */}
        <Box mt={8}>
          <Text fontSize="md" fontWeight="bold" color="brandColorText" mb={4}>
            {text.form.employmentSectionTitle}
          </Text>

          <SimpleGrid columns={columnsForm.threeColumns} gap={6} mb={6}>
            <Input
              label={text.form.fields.office}
              {...register('office')}
              error={errors.office?.message}
              disabled={!canSave}
            />
            <Controller
              name="function"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.form.fields.function}
                  service={listFunctionOptions}
                  mapOptions={(item: FunctionOption) => ({ label: item.name, value: item.uuid })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                  })}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  error={error?.message}
                  isRequired
                  isDisabled={!canSave}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              )}
            />
            <ChakraField.Root invalid={!!errors.birthday}>
              <ChakraField.Label>
                {text.form.fields.birthday}
                <Text as="span" color="fg.error">
                  {' *'}
                </Text>
              </ChakraField.Label>
              <Controller
                name="birthday"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <DateInput value={value ?? null} onChange={onChange} disabled={!canSave} />
                )}
              />
              {errors.birthday?.message && (
                <ChakraField.ErrorText>{errors.birthday.message}</ChakraField.ErrorText>
              )}
            </ChakraField.Root>
          </SimpleGrid>

          <SimpleGrid columns={columnsForm.threeColumns} gap={6} mb={6}>
            <Controller
              name="base_salary"
              control={control}
              render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                <MoneyInput
                  name={name}
                  label={text.form.fields.baseSalary}
                  value={value}
                  onValueChange={onChange}
                  error={error?.message}
                  isRequired
                  disabled={!canSave}
                />
              )}
            />
            <Controller
              name="goal_salary"
              control={control}
              render={({ field: { name, value, onChange } }) => (
                <MoneyInput
                  name={name}
                  label={text.form.fields.goalSalary}
                  value={value}
                  onValueChange={onChange}
                  disabled={!canSave}
                />
              )}
            />
            <Controller
              name="vl_time_productive"
              control={control}
              render={({ field: { name, value, onChange } }) => (
                <MoneyInput
                  name={name}
                  label={text.form.fields.vlTimeProductive}
                  value={value}
                  onValueChange={onChange}
                  disabled={!canSave}
                />
              )}
            />
          </SimpleGrid>

          <SimpleGrid columns={columnsForm.threeColumns} gap={6}>
            <Controller
              name="commission"
              control={control}
              render={({ field: { name, value, onChange } }) => (
                <PercentInput
                  name={name}
                  label={text.form.fields.commission}
                  value={value}
                  onValueChange={onChange}
                  maxValue={100}
                  disabled={!canSave}
                />
              )}
            />
            <Controller
              name="center"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.form.fields.centerId}
                  service={listCostCenterOptions}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                    only_analytic: true,
                  })}
                  mapOptions={(item: CostCenterRef) => ({
                    label: `${item.code} — ${item.description}`,
                    value: item.uuid,
                  })}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  error={error?.message}
                  isDisabled={!canSave}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              )}
            />
          </SimpleGrid>
        </Box>

        {/* ---- Seção "Dados Bancários / PIX" ----
            GAP-EMP-FE-02 FECHADO (TASK-EMP-06, api_root) — bank/account_type/
            agency/account 100% funcionais e hidratados em AMBOS os modos. */}
        <Box mt={8}>
          <Text fontSize="md" fontWeight="bold" color="brandColorText" mb={4}>
            {text.form.bank.title}
          </Text>

          <SimpleGrid columns={columnsForm.default} gap={6} mb={6}>
            <Box gridColumn={{ base: 'auto', md: 'span 2' }}>
              <Controller
                name="bank"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <SelectAsyncPaginate
                    name={field.name}
                    label={text.form.bank.bankId}
                    service={listBankOptions}
                    mapOptions={(item: BankOptionItem) => ({
                      label: `${item.code}-${item.name}`,
                      value: item.uuid,
                    })}
                    findParams={(search: string | { search: string }) => ({
                      search: typeof search === 'string' ? search : search.search,
                    })}
                    value={field.value ?? null}
                    onChange={(option: any) => field.onChange(option ?? null)}
                    error={error?.message}
                    isDisabled={!canSave}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                )}
              />
            </Box>
            <Controller
              name="account_type"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Select
                  label={text.form.bank.accountType}
                  name="account_type"
                  value={accountTypeOptions.find((option) => option.value === value) ?? null}
                  onChange={(option: Option<string> | null) => onChange(option?.value ?? null)}
                  options={accountTypeOptions}
                  isDisabled={!canSave}
                />
              )}
            />
          </SimpleGrid>

          <SimpleGrid columns={columnsForm.default} gap={6} mb={6}>
            <Input label={text.form.bank.agency} {...register('agency')} disabled={!canSave} />
            <Input label={text.form.bank.account} {...register('account')} disabled={!canSave} />
            <Controller
              name="pix_type"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Select
                  label={text.form.bank.pixType}
                  name="pix_type"
                  value={pixTypeOptions.find((option) => option.value === value?.value) ?? null}
                  onChange={onChange}
                  options={pixTypeOptions}
                  isDisabled={!canSave}
                />
              )}
            />
            {/* Bloco reativo — pix_type===0 (CPF/CNPJ) → MaskedInput
                kind="cpfCnpj"; pix_type===2 (Telefone) → MaskedInput
                kind="phone"; 1/3/null (E-mail/Aleatória) → Input
                texto/email. Extraído literalmente de `StepFuncionario.tsx`. */}
            {pixType?.value === 0 && (
              <Controller
                name="pix"
                control={control}
                render={({ field }) => (
                  <MaskedInput
                    kind="cpfCnpj"
                    label={text.form.bank.pix}
                    name={field.name}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    disabled={!canSave}
                    spellCheck={false}
                  />
                )}
              />
            )}
            {pixType?.value === 2 && (
              <MaskedInput
                kind="phone"
                label={text.form.bank.pix}
                {...register('pix')}
                disabled={!canSave}
                spellCheck={false}
              />
            )}
            {(pixType?.value === 1 || pixType?.value === 3 || pixType == null) && (
              <Input
                label={text.form.bank.pix}
                {...register('pix')}
                disabled={!canSave}
                spellCheck={false}
                type={pixType?.value === 1 ? 'email' : 'text'}
              />
            )}
          </SimpleGrid>
        </Box>

        {/* ---- Seção opcional "Acesso ao Sistema" (create_user/role, DA-EMP-06) ----
            SÓ existe na CRIAÇÃO — some INTEIRO na edição (mirror
            `StepUsuario.tsx`: o bloco de senha some inteiro, não fica só
            desabilitado; `EmployeeRequest::rules()` nem valida
            `create_user`/`role_uuid` em PUT/PATCH, então não faria sentido
            nenhum aqui em modo edição). */}
        {!isEditing && (
          <Box mt={8}>
            <Text fontSize="md" fontWeight="bold" color="brandColorText" mb={4}>
              {text.form.user.sectionTitle}
            </Text>

            <Controller
              name="create_user"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Box
                  display="flex"
                  alignItems="center"
                  gap={3}
                  px={4}
                  py={3}
                  borderRadius="md"
                  border="1px solid"
                  borderColor="border.subtle"
                  bg="bg.subtle"
                  mb={6}
                >
                  <Switch
                    checked={!!value}
                    onCheckedChange={(details: { checked: boolean }) => {
                      onChange(details.checked);
                      // Desmarcar limpa o perfil selecionado — nunca deixar
                      // `role` "escondido" com valor stale que reapareceria
                      // se o usuário marcar de novo.
                      if (!details.checked) {
                        setValue('role', null, { shouldDirty: true, shouldValidate: true });
                      }
                    }}
                    disabled={!canSave || !canSeeRoles || usersQuotaLimitReached}
                  >
                    {text.form.user.createUser}
                  </Switch>
                </Box>
              )}
            />

            {createUserBlockReasons.length > 0 && (
              <Box mb={6}>
                {createUserBlockReasons.map((reason) => (
                  <Text key={reason} fontSize="sm" color="fg.muted" mb={2}>
                    {reason}
                  </Text>
                ))}
              </Box>
            )}

            <SimpleGrid columns={columnsForm.twoColumns} gap={6}>
              <Controller
                name="role"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <SelectAsyncPaginate
                    name={field.name}
                    label={text.form.user.role}
                    service={listRoles}
                    mapOptions={(item: RoleListItem) => ({ label: item.name, value: item.uuid })}
                    findParams={(search: string | { search: string }) => ({
                      search: typeof search === 'string' ? search : search.search,
                    })}
                    value={field.value ?? null}
                    onChange={(option: any) => field.onChange(option ?? null)}
                    error={error?.message}
                    isRequired
                    isDisabled={!canSave || !createUser || !canSeeRoles || usersQuotaLimitReached}
                    helperText={
                      createUserBlockReasons.length > 0
                        ? createUserBlockReasons.join(' ')
                        : undefined
                    }
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                )}
              />
            </SimpleGrid>
          </Box>
        )}
      </Form>
    </FormContainer>
  );
}
