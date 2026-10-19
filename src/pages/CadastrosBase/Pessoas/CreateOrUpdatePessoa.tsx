// src/pages/CadastrosBase/Pessoas/CreateOrUpdatePessoa.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de Pessoa (Person) — wizard multi-etapa
// DINÂMICO (etapas fixas "Dados Básicos"/"Endereço" + uma etapa por papel
// ativado, ordem Proprietário → Funcionário → Fornecedor → Cliente →
// Usuário). Rotas: /cadastros-base/pessoas/novo e
// /cadastros-base/pessoas/:personId (wiring real em TASK-FE-306).
//
// Referência UX: GB.Cerne.UX/.../PessoaForm.tsx (commit f450732) — fluxo
// real seguido: `Steps` no topo, navegação Anterior/Próximo/Salvar, cada
// papel habilitado via `Switch` na etapa "Dados Básicos" adiciona uma etapa
// nova ao stepper em tempo real (`computeSteps()`). Padrão de composição SEM
// precedente real no `GB.Cerne.FrontEnd` (wizards existentes ainda não têm
// etapas DINÂMICAS por toggle) — casca montada com as primitivas reais do
// projeto (`FormContainer`/`FormFooter`/`Button`, `components/ui/steps.tsx`
// de TASK-FE-300) + um único `useForm` (RHF) cobrindo TODA a árvore (raiz +
// 5 blocos de papel), em vez do `useState` manual do protótipo — reaproveita
// validação/`dirtyFields`/`Controller` já usados em todo o projeto real.
//
// Navegação do stepper: `StepsRoot` controlado (`step={idx}`) — clique numa
// etapa só é aceito se ela já estiver em `completed` (mesma regra do
// protótipo, `handleStepClick`); a via PRINCIPAL de navegação é sempre
// Voltar/Próximo/Salvar no rodapé (`FormFooter`), validando por etapa via
// `trigger()`.
//
// GAP-FE-120 FECHADO do lado front (TASK-FE-327, execução 023) — o Select de
// Cidade (`StepEndereco`/`StepFornecedor`) consome `listCityOptions`
// (`/cities/options`, sem gate de `cities_view`, TASK-BE-353) e o payload
// envia `city_uuid`/`provider.branches.*.city_uuid` (não mais `city_id` cast
// de uuid→number) — fecha o contrato que `PersonRequest::rules()` já exige
// desde `TASK-BE-334`. Prefill em edição também corrigido: `city` raiz usa
// `PersonDetailResource.city.uuid` (rótulo completo `Nome — UF`); `city` de
// filial usa fallback rótulo=uuid (`BranchResource` não denormaliza
// nome/UF da cidade da filial).
//
// GAP-FE-120 addendum FECHADO (TASK-FE-332, execução 023, commit
// `8574f3268`) — mesma classe de correção para Centro de Custo/Banco:
// `employee.center`/`employee.bank` consomem `listCostCenterOptions`
// (`/cost-centers/options`, TASK-BE-355)/`listBankOptions`
// (`/banks/options`, TASK-BE-356), sem gate de `costcenters_view`/
// `banks_view`; payload envia `center_uuid`/`bank_uuid` (não mais
// `center_id`/`bank_id`, renomeados por `TASK-BE-335`). Prefill em edição:
// `employee.function`/`employee.center`/`provider.bank` usam os objetos
// denormalizados que `EmployeeResource`/`ProviderResource` agora devolvem
// (`function{uuid,name}`, `center{uuid,code,description}`,
// `bank{uuid,code,name}`, `TASK-BE-357`) — rótulo REAL, não mais uuid cru.
// EXCEÇÃO: `employee.bank` continua best-effort (rótulo=uuid) —
// `EmployeeResource` nunca expôs esse campo na leitura (Employee não tem
// coluna `bank_id` física, achado desta rodada, fora do escopo de
// TASK-FE-332 — ver `@types/v2/People::EmployeeRoleDetail.bank_uuid`).
//
// TASK-FE-326 (execução 023) — o corpo do wizard (`StepsRoot`+`FormFooter`)
// passou a ser envolvido por `<Form onSubmit={(e) => e.preventDefault()}>`
// (mesmo padding de 40px de todos os outros formulários de Cadastros Base,
// `configureSpacing()`) — a navegação/salvamento continua 100% via
// `handleNext` nos botões, nunca via submit nativo (o `preventDefault` é só
// uma guarda contra `Enter` disparando um submit de formulário real, que
// agora existe no DOM).
//
// TASK-FE-337 (achado F, execução 023, decisão do dev) — EXCEÇÃO consciente
// à RN-04 só para `user`: até aqui, desmarcar "Usuário" numa Pessoa que já
// tinha usuário ATIVO e salvar fazia `buildPayload()` OMITIR o bloco inteiro
// (RN-04, "ausência preserva o papel ativo") — no-op no backend, o usuário
// continuava ativo (UI enganosa). Agora `hadUserActiveOriginally` (ref,
// setado em `fillForm` a partir de `data.user.is_active` na carga da
// edição) detecta essa transição no fechamento do wizard (`handleNext`) e:
// (1) abre `userDeactivateGuard` (confirmação explícita antes do PUT); (2)
// `buildPayload()` envia `user: { is_active: false }` — bloco MÍNIMO, sem
// senha/arrays de vínculo — sinal explícito de desativação (backend
// desativa+revoga token, preserva roles/farms/bosses). Demais casos
// inalterados: criação, ou Pessoa que nunca teve usuário com toggle OFF,
// continuam omitindo o bloco (no-op real).
//
// TASK-FE-338 (execução 023, decisão do dev) — GENERALIZAÇÃO do mecanismo
// acima (TASK-FE-337) para os 4 papéis NÃO-usuário (Proprietário/
// Funcionário/Fornecedor/Cliente): mesma técnica — `had{Role}EnabledOriginally`
// (um `useRef` por papel, setado em `fillForm` a partir de
// `data.{role}.is_enabled` na carga da edição) detecta a transição "papel
// já ativo → toggle OFF" no fechamento do wizard (`handleNext`). Diferença
// de UX deliberada: os 4 papéis compartilham UM ÚNICO modal de confirmação
// (`roleDeactivateGuard`/`rolesPendingDeactivation`), listando todos os
// papéis afetados de uma vez (o operador pode desmarcar vários no mesmo
// submit) — em vez de um modal por papel. O modal do `user` (TASK-FE-337)
// permanece SEPARADO e INALTERADO; `proceedPastRoleGuard()` garante que,
// mesmo depois de confirmado o modal dos 4 papéis, a checagem de `user`
// ainda roda antes do `onSubmit()` final (nenhuma das duas confirmações é
// pulada se ambas as transições ocorrerem no mesmo submit).
// `buildPayload()` ganha o mesmo ramo `else if (isEditing &&
// had{Role}EnabledOriginally.current)` para cada um dos 4 — bloco MÍNIMO
// `{ is_enabled: false }`, sem arrays de associação (`farms`/`branches`/
// `sellers`/`state_registrations`), backend desativa+preserva (contrato
// combinado com TASK-BE-362, em paralelo).
//
// TASK-FE-338 (complemento, pedido do dev na mesma execução) — REATIVAÇÃO
// pré-preenchida: ao editar uma Pessoa com um papel DESATIVADO e ligar o
// toggle de volta, a etapa deve aparecer com os dados JÁ PERSISTIDOS, não
// vazia. Verificação linha a linha desta rodada: `fillForm()` (abaixo) já
// hidrata CADA um dos 5 blocos (`proprietary`/`employee`/`provider`/
// `client`/`user`) a partir da PRESENÇA do objeto `data.{papel}`
// (`data.proprietary ? {...} : emptyPessoaForm().proprietary`), NUNCA a
// partir de `is_enabled`/`is_active` — só o campo `enabled` interno é que lê
// a flag (`enabled: !!data.proprietary.is_enabled`), controlando
// exclusivamente a VISIBILIDADE da etapa (`computeSteps`), nunca o
// preenchimento dos demais campos. O `Switch` de cada papel
// (`StepDadosBasicos.tsx`) só altera `{role}.enabled` — nunca limpa os
// campos irmãos — logo desligar/religar um toggle NUNCA perde dado já
// carregado no form. Portanto NENHUMA mudança de código foi necessária
// neste arquivo para este complemento: o mecanismo já é "presence-gated",
// não "enabled-gated". A ÚNICA dependência restante é o BACKEND (fora
// deste repositório) parar de omitir o bloco do papel quando desativado em
// `GET /api/v1/people/{uuid}` — pedido em paralelo ao Executor backend. Ao
// reativar e salvar, `buildPayload()` já cai no `if (data.{papel}.enabled)`
// existente (bloco completo, `is_enabled: true`/`is_active: true` + dados
// atuais do form, editados ou não) — nenhuma mudança também. `user.password`
// permanece SEMPRE vazio na reidratação (`password: ''`, linha abaixo) —
// DEC-015 preservada, nenhum campo de senha reintroduzido na edição.
// -----------------------------------------------------------------------------

import { useMemo, useRef, useState } from 'react';

import { Box, Flex, Text, useDisclosure } from '@chakra-ui/react';
import { useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { FormProvider, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { Form } from '@/components/Form';
import { FormContainer } from '@/components/Layout/FormContainer';
import { Steps, StepsList, StepsRoot } from '@/components/ui/steps';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';
import { usePersonForm } from '@/hooks/usePeople';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';
import { normalizeDocument } from '@/utils/masks/document';
import transformStringToNumber from '@/utils/transformStringToNumber';

import { queryKey } from '@/constants/query-key';

import { createPerson, updatePerson } from '@/services/v2/People/person-service';

import type { PersonDetail, PersonPayload, RoleKey } from '@/@types/v2/People';

import { personSchemaResolver } from './pessoa-schema';
import {
  computeSteps,
  emptyPessoaForm,
  ROLE_ORDER,
  type PessoaFormValues,
  type StepKey,
} from './pessoa.types';
import { StepCliente } from './steps/StepCliente';
import { StepDadosBasicos } from './steps/StepDadosBasicos';
import { StepEndereco } from './steps/StepEndereco';
import { StepFornecedor } from './steps/StepFornecedor';
import { StepFuncionario } from './steps/StepFuncionario';
import { StepProprietario } from './steps/StepProprietario';
import { StepUsuario } from './steps/StepUsuario';

// ---- Campos validados por etapa (RHF `trigger`) ----------------------------
const STEP_FIELDS: Record<StepKey, string[] | string> = {
  basico: ['nif', 'name', 'nickname', 'email', 'phone'],
  endereco: ['city', 'address', 'number', 'district', 'zip_code'],
  proprietary: 'proprietary',
  employee: 'employee',
  provider: 'provider',
  client: 'client',
  user: 'user',
};

export default function CreateOrUpdatePessoa() {
  const { personId } = useParams<{ personId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const queryClient = useQueryClient();

  const isEditing = isValidGuid(personId);
  const canSave = isEditing ? can('people_edit') : can('people_create');
  const text = languageGB.people.person;

  const form = useForm<PessoaFormValues>({
    mode: 'onChange',
    // Achado D — `isEditing` desliga a validação de confirmação-de-senha no
    // schema (campos nem existem na UI em edição, ver `StepUsuario.tsx`).
    resolver: personSchemaResolver(languageGB, isEditing) as any,
    reValidateMode: 'onChange',
    defaultValues: emptyPessoaForm(),
  });
  const {
    control,
    register,
    reset,
    trigger,
    setError,
    watch,
    setValue,
    getValues,
    formState: { errors, dirtyFields, isDirty },
  } = form;

  const [currentKey, setCurrentKey] = useState<StepKey>('basico');
  const [completed, setCompleted] = useState<StepKey[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const exitGuard = useDisclosure();
  const [pendingExit, setPendingExit] = useState<(() => void) | null>(null);

  // TASK-FE-337 — rastreia se a Pessoa JÁ TINHA usuário ATIVO ao carregar a
  // edição (`data.user.is_active`), setado uma única vez em `fillForm()`.
  // Usado no submit para detectar a transição "tinha usuário → toggle OFF"
  // (achado F, execução 023): sem isso, `buildPayload()` simplesmente omite
  // o bloco `user` (RN-04, no-op) e o usuário continua ativo no backend, UI
  // enganosa. `useRef` (não `useState`) — não precisa re-render, só precisa
  // sobreviver entre `fillForm`/`onSubmit`.
  const hadUserActiveOriginally = useRef(false);
  const userDeactivateGuard = useDisclosure();

  // TASK-FE-338 (execução 023) — generalização do achado F/TASK-FE-337 para
  // os 4 papéis NÃO-usuário: mesma técnica de `useRef` (não `useState`, não
  // precisa re-render) rastreando se a Pessoa JÁ TINHA cada papel ATIVO
  // (`data.{role}.is_enabled`) ao carregar a edição, setado uma única vez em
  // `fillForm()`. Usado no submit para detectar a transição "tinha o
  // papel → toggle OFF" — sem isso, `buildPayload()` simplesmente omite o
  // bloco do papel (RN-04, no-op) e o papel continua ativo no backend.
  const hadProprietaryEnabledOriginally = useRef(false);
  const hadEmployeeEnabledOriginally = useRef(false);
  const hadProviderEnabledOriginally = useRef(false);
  const hadClientEnabledOriginally = useRef(false);
  // Modal ÚNICO cobrindo os 4 papéis — se mais de um for desmarcado no mesmo
  // submit, uma confirmação só lista todos (nunca um diálogo por papel).
  const roleDeactivateGuard = useDisclosure();
  const [rolesPendingDeactivation, setRolesPendingDeactivation] = useState<
    Exclude<RoleKey, 'user'>[]
  >([]);

  const formValues = watch();
  const steps = useMemo(() => computeSteps(formValues), [formValues]);
  const idx = Math.max(0, steps.indexOf(currentKey));
  const isLast = idx === steps.length - 1;

  // Lei 2 (`get_pwa_form_query_pattern`) — guarda por `!isEmpty(dirtyFields)
  // || resetForce` (armadilha REAL de `isEmpty.ts`, ERRO-FE-001: retorna
  // `true` quando HÁ chaves). Mesmo padrão de `CreateOrUpdateTipoTitulo.tsx`.
  function fillForm(data: PersonDetail, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      // TASK-FE-337 — captura o estado ORIGINAL do usuário (antes de
      // qualquer edição do operador) uma única vez por carga de dados.
      hadUserActiveOriginally.current = !!data.user?.is_active;
      // TASK-FE-338 — mesma captura, generalizada para os 4 papéis
      // NÃO-usuário (`is_enabled`, não `is_active` — nome de campo distinto
      // do papel `user`).
      hadProprietaryEnabledOriginally.current = !!data.proprietary?.is_enabled;
      hadEmployeeEnabledOriginally.current = !!data.employee?.is_enabled;
      hadProviderEnabledOriginally.current = !!data.provider?.is_enabled;
      hadClientEnabledOriginally.current = !!data.client?.is_enabled;
      const filled: PessoaFormValues = {
        uuid: data.uuid,
        nif: data.nif,
        name: data.name,
        nickname: data.nickname,
        email: data.email ?? '',
        phone: data.phone ?? '',
        zip_code: data.zip_code ?? '',
        // TASK-FE-327 — `PersonDetailResource.city` já expõe `{uuid, name,
        // state}` desde `TASK-BE-334`; pré-seleciona o SelectAsyncPaginate
        // de Cidade com rótulo completo (mesmo padrão de `cidade_uuid` em
        // CreateOrUpdateEmissor.tsx::fillForm).
        city: data.city
          ? {
              value: data.city.uuid,
              label: [data.city.name, data.city.state?.uf].filter(Boolean).join(' — '),
            }
          : null,
        address: data.address ?? '',
        number: data.number ?? '',
        district: data.district ?? '',
        // TASK-FE-338 (complemento) — os 5 blocos abaixo hidratam por
        // PRESENÇA do objeto (`data.{papel} ?`), NUNCA por
        // `is_enabled`/`is_active`: um papel DESATIVADO que o backend ainda
        // devolva com os dados persistidos já entra prefilled aqui, pronto
        // para reaparecer completo se o operador religar o toggle. Só o
        // campo interno `enabled` lê a flag, e só para controlar a
        // visibilidade da etapa (`computeSteps`).
        proprietary: data.proprietary
          ? {
              enabled: !!data.proprietary.is_enabled,
              farms: (data.proprietary.farms ?? []).map((f) => ({
                farm: { value: f.uuid, label: f.uuid },
                // TASK-FE-333 — REVERTIDO para `Input` de texto simples:
                // prefila STRING com vírgula decimal pt-BR (nunca o número
                // cru nem `"12.5"` com ponto).
                percentage: f.percentage != null ? String(f.percentage).replace('.', ',') : '',
              })),
              state_registration_numbers: (data.proprietary.state_registration_numbers ?? []).map(
                (r) => ({ value: r })
              ),
            }
          : emptyPessoaForm().proprietary,
        employee: data.employee
          ? {
              enabled: !!data.employee.is_enabled,
              office: data.employee.office ?? '',
              // TASK-FE-332/TASK-BE-357 — `EmployeeResource.function` agora
              // devolve `{uuid, name}` (não mais só `function_uuid` cru);
              // rótulo REAL na edição, mesmo padrão de `city`/TASK-BE-334.
              function: data.employee.function
                ? { value: data.employee.function.uuid, label: data.employee.function.name }
                : null,
              // TASK-FE-330 — 5 campos recebem `number | null` direto (já
              // vêm number da API), sem `String()`.
              commission: data.employee.commission ?? null,
              vl_time_productive: data.employee.vl_time_productive ?? null,
              vl_time_unproductive: data.employee.vl_time_unproductive ?? null,
              base_salary: data.employee.base_salary ?? null,
              goal_salary: data.employee.goal_salary ?? null,
              // TASK-FE-332/TASK-BE-357 (GAP-FE-120 addendum FECHADO) —
              // `EmployeeResource.center` agora devolve
              // `{uuid, code, description}` (não mais `center_id` inteiro);
              // rótulo REAL na edição, mesmo template de
              // `CreateOrUpdateCentroCusto.tsx` (`${code} — ${description}`).
              center: data.employee.center
                ? {
                    value: data.employee.center.uuid,
                    label: `${data.employee.center.code} — ${data.employee.center.description}`,
                  }
                : null,
              birthday: data.employee.birthday,
              // `EmployeeResource` NUNCA expôs `bank_uuid`/`bank` (Employee
              // não tem coluna `bank_id` física — achado desta rodada, ver
              // nota em `@types/v2/People::EmployeeRoleDetail.bank_uuid`);
              // prefill sempre `null` até uma eventual Tarefa backend
              // adicionar a relação. Fora do escopo desta Tarefa.
              bank: data.employee.bank_uuid
                ? { value: data.employee.bank_uuid, label: data.employee.bank_uuid }
                : null,
              account_type: data.employee.account_type ?? '',
              agency: data.employee.agency ?? '',
              account: data.employee.account ?? '',
              pix_type:
                data.employee.pix_type != null
                  ? { value: data.employee.pix_type, label: String(data.employee.pix_type) }
                  : null,
              pix: data.employee.pix ?? '',
            }
          : emptyPessoaForm().employee,
        provider: data.provider
          ? {
              enabled: !!data.provider.is_enabled,
              type:
                data.provider.type != null
                  ? { value: data.provider.type, label: String(data.provider.type) }
                  : null,
              // TASK-FE-330 — migrado para `number | null` direto, sem `String()`.
              commission: data.provider.commission ?? null,
              hour_value: data.provider.hour_value ?? null,
              state_registration: data.provider.state_registration ?? '',
              city_registration: data.provider.city_registration ?? '',
              contact: data.provider.contact ?? '',
              contact_phone: data.provider.contact_phone ?? '',
              // TASK-FE-332/TASK-BE-357 (GAP-FE-120 addendum FECHADO) —
              // `ProviderResource.bank` agora devolve `{uuid, code, name}`
              // (não mais `bank_id` inteiro); rótulo REAL na edição, mesmo
              // template de `BankResource.info` no backend (`${code}-${name}`).
              bank: data.provider.bank
                ? {
                    value: data.provider.bank.uuid,
                    label: `${data.provider.bank.code}-${data.provider.bank.name}`,
                  }
                : null,
              account_type: data.provider.account_type ?? '',
              agency: data.provider.agency ?? '',
              account: data.provider.account ?? '',
              pix_type:
                data.provider.pix_type != null
                  ? { value: data.provider.pix_type, label: String(data.provider.pix_type) }
                  : null,
              pix: data.provider.pix ?? '',
              // `BranchResource`/`SellerResource` só expõem uuid+name(+city_uuid
              // desde TASK-BE-334) hoje — demais campos ficam vazios no reload
              // (ver @types/v2/People). TASK-FE-327 — `city` usa fallback
              // pragmático (rótulo = o próprio uuid), mesmo padrão já usado
              // neste arquivo para `employee.function`/`center`/`bank`
              // (FK sem nome denormalizado no Resource de leitura).
              branches: (data.provider.branches ?? []).map((b) => ({
                nif: '',
                name: b.name ?? '',
                state_registration: '',
                zip_code: '',
                city: b.city_uuid ? { value: b.city_uuid, label: b.city_uuid } : null,
                address: '',
              })),
              sellers: (data.provider.sellers ?? []).map((s) => ({
                name: s.name ?? '',
                email: '',
                phone: '',
              })),
            }
          : emptyPessoaForm().provider,
        client: data.client
          ? {
              enabled: !!data.client.is_enabled,
              cellphone: data.client.cellphone ?? '',
              contact: data.client.contact ?? '',
              contact_phone: data.client.contact_phone ?? '',
              city_registration: data.client.city_registration ?? '',
              farm_name: data.client.farm_name ?? '',
              final_costumer: !!data.client.final_costumer,
              taxpayer: !!data.client.taxpayer,
              // 97-Esteiras/030 — fallback deixou de ser `'BR'` (sigla ISO,
              // nunca mais um valor válido de `codigo` numérico desde a
              // correção crítica de homologação). `''` força o usuário a
              // selecionar de novo caso o backend devolva `null` — mesma
              // leitura honesta do CRUD standalone de Cliente.
              code_country: data.client.code_country ?? '',
              id_abroad: data.client.id_abroad ?? '',
              // TASK-FE-334 — `client.state_registrations` virou repeater
              // (array), mesmo padrão de `proprietary.state_registration_numbers`
              // acima.
              state_registrations: (data.client.state_registrations ?? []).map((r) => ({
                value: r,
              })),
            }
          : emptyPessoaForm().client,
        user: data.user
          ? {
              enabled: !!data.user.is_active,
              is_purchasing_assistant: !!data.user.is_purchasing_assistant,
              password: '',
              password_confirmation: '',
              farm_uuids: (data.user.farms ?? []).map((f) => f.uuid).filter(Boolean) as string[],
              role_uuids: (data.user.roles ?? []).map((r) => r.uuid).filter(Boolean) as string[],
              boss_uuids: (data.user.bosses ?? []).map((b) => b.uuid).filter(Boolean) as string[],
            }
          : emptyPessoaForm().user,
      };
      reset(filled);
      // Em edição, todas as etapas correspondentes aos papéis já ativos
      // iniciam navegáveis (mirror do protótipo).
      setCompleted(computeSteps(filled));
    }
  }

  const personQuery = usePersonForm({
    registrationId: isEditing ? personId : undefined,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([personQuery as any]);

  // ---- Navegação do wizard ---------------------------------------------------
  function goTo(key: StepKey) {
    setCurrentKey(key);
  }

  // TASK-FE-338 — calcula, a partir do estado ORIGINAL capturado em
  // `fillForm()` (`had{Role}EnabledOriginally`) e dos valores atuais do
  // form, quais dos 4 papéis NÃO-usuário estão transicionando "tinha
  // ativo → toggle OFF" neste submit. Só faz sentido em EDIÇÃO (criação
  // nunca cai aqui, `isEditing` falso). Retorna a lista NA ORDEM canônica
  // (`ROLE_ORDER`) para a mensagem do modal ficar previsível.
  function getRolesBeingDeactivated(values: PessoaFormValues): Exclude<RoleKey, 'user'>[] {
    if (!isEditing) return [];
    const transitions: [Exclude<RoleKey, 'user'>, boolean, boolean][] = [
      ['proprietary', hadProprietaryEnabledOriginally.current, values.proprietary.enabled],
      ['employee', hadEmployeeEnabledOriginally.current, values.employee.enabled],
      ['provider', hadProviderEnabledOriginally.current, values.provider.enabled],
      ['client', hadClientEnabledOriginally.current, values.client.enabled],
    ];
    return transitions
      .filter(([, hadOriginally, nowEnabled]) => hadOriginally && !nowEnabled)
      .map(([role]) => role);
  }

  // TASK-FE-338 — extraído de `handleNext` para ser reaproveitado também por
  // `confirmDeactivateRolesAndSave` (chamado DEPOIS que o operador confirma o
  // modal dos 4 papéis). Preserva EXATAMENTE o comportamento pré-existente do
  // `user` (TASK-FE-337, não alterado): se a transição "tinha usuário ATIVO →
  // toggle OFF" também estiver presente, abre o modal do usuário ANTES de
  // submeter; só chama `onSubmit()` quando nenhuma confirmação pendente
  // restar.
  async function proceedPastRoleGuard() {
    const values = getValues();
    // TASK-FE-337 — transição "tinha usuário ATIVO → toggle OFF no submit":
    // intercepta ANTES de disparar o PUT e pede confirmação explícita (o
    // usuário está prestes a perder acesso ao sistema). A etapa "Usuário"
    // pode nem estar mais no stepper neste ponto (desmarcar o toggle a
    // remove imediatamente, `computeSteps`) — por isso a checagem é feita
    // aqui, no fechamento do wizard, não dentro de `StepUsuario`.
    if (isEditing && hadUserActiveOriginally.current && !values.user.enabled) {
      userDeactivateGuard.onOpen();
      return;
    }
    await onSubmit();
  }

  async function handleNext() {
    const fields = STEP_FIELDS[currentKey];
    const valid = await trigger(fields as any);

    // Senha obrigatória só na CRIAÇÃO quando `user` está ativo (regra fora
    // do schema Yup — depende de `isEditing`, não expressável estaticamente).
    const values = getValues();
    if (currentKey === 'user' && !isEditing && values.user.enabled && !values.user.password) {
      setError('user.password', { message: text.form.validation.passwordRequired });
      return;
    }

    if (!valid) return;

    setCompleted((c) => (c.includes(currentKey) ? c : [...c, currentKey]));

    if (isLast) {
      // TASK-FE-338 — transição "tinha um ou mais dos 4 papéis NÃO-usuário
      // ATIVO(S) → toggle OFF no submit": intercepta ANTES de disparar o PUT
      // e pede UMA confirmação só, listando todos os papéis afetados (evita
      // um modal por papel quando o operador desmarca vários de uma vez).
      // Checado ANTES do guard de `user` (TASK-FE-337) — `proceedPastRoleGuard`
      // é chamado depois, seja direto (nenhum papel a desativar) seja após a
      // confirmação deste modal (`confirmDeactivateRolesAndSave`), garantindo
      // que a checagem de `user` nunca é pulada.
      const rolesToDeactivate = getRolesBeingDeactivated(values);
      if (rolesToDeactivate.length > 0) {
        setRolesPendingDeactivation(rolesToDeactivate);
        roleDeactivateGuard.onOpen();
        return;
      }
      await proceedPastRoleGuard();
    } else {
      goTo(steps[idx + 1]);
    }
  }

  async function confirmDeactivateRolesAndSave() {
    roleDeactivateGuard.onClose();
    await proceedPastRoleGuard();
  }

  async function confirmDeactivateUserAndSave() {
    userDeactivateGuard.onClose();
    await onSubmit();
  }

  function handleBack() {
    if (idx > 0) goTo(steps[idx - 1]);
  }

  function guardedBack() {
    if (isDirty) {
      setPendingExit(() => () => navigate('/cadastros-base/pessoas'));
      exitGuard.onOpen();
    } else {
      navigate('/cadastros-base/pessoas');
    }
  }

  function confirmExit() {
    exitGuard.onClose();
    pendingExit?.();
  }

  // ---- Montagem do payload + submit (fecha o wizard, TASK-FE-305) ----------
  function buildPayload(data: PessoaFormValues): PersonPayload {
    const payload: PersonPayload = {
      nif: normalizeDocument(data.nif),
      name: data.name.trim(),
      nickname: data.nickname.trim(),
      email: data.email?.trim() || undefined,
      phone: data.phone?.trim() || undefined,
      // TASK-FE-327/TASK-BE-334 — `PersonRequest::rules()` exige `city_uuid`
      // (string); `data.city?.value` já é o uuid, sem cast.
      city_uuid: data.city?.value ?? '',
      zip_code: data.zip_code?.trim() || undefined,
      address: data.address.trim(),
      number: data.number.trim(),
      district: data.district.trim(),
    };

    if (data.proprietary.enabled) {
      payload.proprietary = {
        is_enabled: true,
        farms: data.proprietary.farms
          .filter((f) => f.farm)
          .map((f) => ({
            farm_uuid: String(f.farm!.value),
            // TASK-FE-333 — REVERTIDO para `Input` de texto simples:
            // `f.percentage` é `string` (vírgula decimal pt-BR) — converte
            // para `number` (ponto decimal) via `transformStringToNumber`
            // (mesma função do teste Yup), nunca a string crua com vírgula.
            percentage: f.percentage ? transformStringToNumber(f.percentage) : 0,
          })),
        state_registration_numbers: data.proprietary.state_registration_numbers
          .map((r) => r.value)
          .filter(Boolean),
      };
    } else if (isEditing && hadProprietaryEnabledOriginally.current) {
      // TASK-FE-338 (generalização do achado F/TASK-FE-337) — a Pessoa já
      // tinha Proprietário ATIVO e o toggle foi desligado neste submit.
      // Bloco MÍNIMO — só `is_enabled: false`, SEM `farms`/
      // `state_registration_numbers` — para o backend desativar e, ao
      // mesmo tempo, PRESERVAR as fazendas/inscrições já vinculadas
      // (contrato combinado com TASK-BE-362). Demais casos continuam de
      // fora deste ramo: CRIAÇÃO nunca cai aqui (`isEditing` falso);
      // Pessoa que NUNCA teve Proprietário com toggle OFF também não
      // (`hadProprietaryEnabledOriginally` já nasce `false`) — nesses dois,
      // o bloco `proprietary` continua OMITIDO (no-op real).
      payload.proprietary = { is_enabled: false };
    }

    if (data.employee.enabled) {
      payload.employee = {
        is_enabled: true,
        office: data.employee.office || undefined,
        function_uuid: (data.employee.function?.value as string) || undefined,
        // TASK-FE-330 — 5 campos já são `number | null` (`PercentInput`/
        // `MoneyInput`), enviados diretos (payload aceita `number | null`).
        commission: data.employee.commission,
        vl_time_productive: data.employee.vl_time_productive,
        vl_time_unproductive: data.employee.vl_time_unproductive,
        base_salary: data.employee.base_salary,
        goal_salary: data.employee.goal_salary,
        // TASK-FE-332/TASK-BE-335 (GAP-FE-120 addendum FECHADO) —
        // `PersonRequest::rules()` exige `center_uuid`/`bank_uuid` (string);
        // `.value` já é o uuid, sem cast de tipo.
        center_uuid: data.employee.center?.value || undefined,
        birthday: data.employee.birthday ?? undefined,
        bank_uuid: data.employee.bank?.value || undefined,
        account_type: data.employee.account_type || undefined,
        agency: data.employee.agency || undefined,
        account: data.employee.account || undefined,
        pix_type: data.employee.pix_type ? Number(data.employee.pix_type.value) : undefined,
        pix: data.employee.pix || undefined,
      };
    } else if (isEditing && hadEmployeeEnabledOriginally.current) {
      // TASK-FE-338 — mesma exceção acima, para Funcionário: bloco MÍNIMO
      // preserva função/salários/dados bancários já vinculados.
      payload.employee = { is_enabled: false };
    }

    if (data.provider.enabled) {
      payload.provider = {
        is_enabled: true,
        type: data.provider.type ? Number(data.provider.type.value) : 0,
        // TASK-FE-330 — migrados para `number | null` direto.
        commission: data.provider.commission,
        hour_value: data.provider.hour_value,
        state_registration: data.provider.state_registration || undefined,
        city_registration: data.provider.city_registration || undefined,
        contact: data.provider.contact || undefined,
        contact_phone: data.provider.contact_phone || undefined,
        // TASK-FE-332/TASK-BE-335 (GAP-FE-120 addendum FECHADO) — mesma
        // correção de `employee.bank_uuid`.
        bank_uuid: data.provider.bank?.value || undefined,
        account_type: data.provider.account_type || undefined,
        agency: data.provider.agency || undefined,
        account: data.provider.account || undefined,
        pix_type: data.provider.pix_type ? Number(data.provider.pix_type.value) : undefined,
        pix: data.provider.pix || undefined,
        branches: data.provider.branches.map((b) => ({
          nif: normalizeDocument(b.nif),
          name: b.name || undefined,
          state_registration: b.state_registration || undefined,
          zip_code: b.zip_code || undefined,
          // TASK-FE-327/TASK-BE-334 — mesma correção do city_uuid raiz.
          city_uuid: b.city?.value ?? '',
          address: b.address,
        })),
        sellers: data.provider.sellers.map((s) => ({
          name: s.name,
          email: s.email || undefined,
          phone: s.phone || undefined,
        })),
      };
    } else if (isEditing && hadProviderEnabledOriginally.current) {
      // TASK-FE-338 — mesma exceção acima, para Fornecedor: bloco MÍNIMO
      // preserva filiais/vendedores/dados bancários já vinculados.
      payload.provider = { is_enabled: false };
    }

    if (data.client.enabled) {
      payload.client = {
        is_enabled: true,
        cellphone: data.client.cellphone || undefined,
        contact: data.client.contact || undefined,
        contact_phone: data.client.contact_phone || undefined,
        city_registration: data.client.city_registration || undefined,
        final_costumer: !!data.client.final_costumer,
        taxpayer: !!data.client.taxpayer,
        code_country: data.client.code_country,
        id_abroad: data.client.id_abroad || undefined,
        farm_name: data.client.farm_name || undefined,
        // TASK-FE-334 — repeater; mesmo padrão de
        // `proprietary.state_registration_numbers` (sem limite/dedup
        // artificiais).
        state_registrations: data.client.state_registrations.map((r) => r.value).filter(Boolean),
      };
    } else if (isEditing && hadClientEnabledOriginally.current) {
      // TASK-FE-338 — mesma exceção acima, para Cliente: bloco MÍNIMO
      // preserva inscrições estaduais já vinculadas.
      payload.client = { is_enabled: false };
    }

    if (data.user.enabled) {
      payload.user = {
        is_active: true,
        is_purchasing_assistant: !!data.user.is_purchasing_assistant,
        // Achado D — a senha NUNCA é reenviada na edição (os campos nem
        // existem na UI nesse modo, `StepUsuario.tsx`); só a CRIAÇÃO define
        // senha inicial. Guarda explícita por `isEditing`, não só o
        // fallback `|| undefined` (que já seria `undefined` de qualquer
        // forma com o campo vazio, mas a intenção fica clara e blindada
        // contra qualquer valor residual).
        password: isEditing ? undefined : data.user.password || undefined,
        farm_uuids: data.user.farm_uuids,
        role_uuids: data.user.role_uuids,
        boss_uuids: data.user.boss_uuids,
      };
    } else if (isEditing && hadUserActiveOriginally.current) {
      // TASK-FE-337 (achado F, execução 023) — EXCEÇÃO consciente a RN-04,
      // só para `user`: a Pessoa já tinha usuário ATIVO e o toggle foi
      // desligado neste submit. Omitir o bloco inteiro (comportamento
      // padrão de RN-04, mantido para os demais casos) seria no-op no
      // backend — o usuário continuaria ativo, UI enganosa (o dev via o
      // toggle "OFF" na tela, mas o acesso real permanecia). Envia o BLOCO
      // MÍNIMO — só `is_active: false`, SEM `password`/arrays de vínculo —
      // para o backend desativar+revogar token e, ao mesmo tempo,
      // PRESERVAR roles/farms/bosses já vinculados (contrato combinado com
      // o backend em paralelo). Demais casos continuam de fora deste ramo:
      // CRIAÇÃO nunca cai aqui (`isEditing` falso); Pessoa que NUNCA teve
      // usuário com toggle OFF também não (`hadUserActiveOriginally` já
      // nasce `false`) — nesses dois, o bloco `user` continua OMITIDO
      // (no-op real, comportamento inalterado).
      payload.user = { is_active: false };
    }

    return payload;
  }

  // Mapeia a chave dotted de erro 422 (ex.: "employee.function_uuid") para a
  // etapa do wizard correspondente (TASK-FE-305 — navega para a etapa com
  // erro).
  function stepForErrorKey(key: string): StepKey | null {
    const root = key.split('.')[0];
    if (['name', 'nickname', 'nif', 'email', 'phone'].includes(root)) return 'basico';
    if (['city_uuid', 'zip_code', 'address', 'number', 'district'].includes(root))
      return 'endereco';
    if ((ROLE_ORDER as string[]).includes(root)) return root as RoleKey;
    return null;
  }

  async function onSubmit() {
    const data = getValues();
    const payload = buildPayload(data);
    setIsSubmitting(true);
    try {
      if (isEditing && personId) {
        await updatePerson(personId, payload);
        toaster.success({
          title: text.singularLabel,
          description: text.form.toasts.updatedSuccess,
        });
      } else {
        const { created } = await createPerson(payload);
        toaster.success({
          title: text.singularLabel,
          description: created ? text.form.toasts.createdSuccess : text.form.toasts.upsertSuccess,
        });
      }
      queryClient.invalidateQueries({ queryKey: [queryKey.people.list] });
      queryClient.invalidateQueries({ queryKey: [queryKey.people.detail] });
      navigate('/cadastros-base/pessoas');
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 422) {
        const backendErrors = (error.response.data as any)?.errors as
          Record<string, string[]> | undefined;
        if (backendErrors) {
          const firstKey = Object.keys(backendErrors)[0];
          const targetStep = firstKey ? stepForErrorKey(firstKey) : null;
          if (targetStep && targetStep !== currentKey) {
            goTo(targetStep);
          }
        }
        toaster.error({
          title: text.singularLabel,
          description:
            (error.response?.data as any)?.message ??
            'Verifique os campos destacados e tente novamente.',
        });
      } else {
        toaster.error({
          title: text.singularLabel,
          description: 'Não foi possível salvar a pessoa. Tente novamente.',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  // ---- Render do step ativo ---------------------------------------------------
  const disabled = !canSave || isSubmitting;
  const stepProps = { control, register, errors, disabled };

  function renderStep() {
    switch (currentKey) {
      case 'basico':
        return (
          <StepDadosBasicos
            {...stepProps}
            watch={watch}
            setValue={setValue}
            isEditing={isEditing}
          />
        );
      case 'endereco':
        return <StepEndereco {...stepProps} />;
      case 'proprietary':
        return <StepProprietario {...stepProps} />;
      case 'employee':
        return <StepFuncionario {...stepProps} watch={watch} />;
      case 'provider':
        return <StepFornecedor {...stepProps} />;
      case 'client':
        // 97-Esteiras/030 — `StepCliente` deixou de precisar de `watch`
        // (o gate condicional de `id_abroad` por `code_country !== 'BR'`
        // foi removido junto da correção do código numérico do país).
        return <StepCliente {...stepProps} />;
      case 'user':
        return <StepUsuario {...stepProps} isEditing={isEditing} />;
      default:
        return null;
    }
  }

  const stepLabels: Record<StepKey, string> = {
    basico: text.steps.basico,
    endereco: text.steps.endereco,
    proprietary: text.roles.proprietary,
    employee: text.roles.employee,
    provider: text.roles.provider,
    client: text.roles.client,
    user: text.roles.user,
  };

  const stepCounterLabel = `${text.form.footer.stepCounter.label} ${idx + 1} ${text.form.footer.stepCounter.of} ${steps.length}`;

  return (
    <FormContainer
      title={isEditing ? text.form.title.edit : text.form.title.create}
      footer={
        <Box
          width="full"
          display="grid"
          gridTemplateColumns="1fr auto 1fr"
          alignItems="center"
          gap={4}
        >
          <Flex justify="flex-start">
            <Button
              title={text.form.footer.back}
              variant="outline"
              type="button"
              onClick={idx > 0 ? handleBack : guardedBack}
            />
          </Flex>
          <Text fontSize="sm" color="fg.muted" textAlign="center">
            {stepCounterLabel}
          </Text>
          <Flex justify="flex-end">
            {canSave && (
              <Button
                title={isLast ? text.form.footer.save : text.form.footer.next}
                onClick={handleNext}
                type="button"
                loading={isSubmitting}
                disabled={isSubmitting || isLoading}
              />
            )}
          </Flex>
        </Box>
      }
    >
      {/* TASK-FE-326 — `<Form>` só como wrapper de padding (paddingX="10",
          `configureSpacing()`), mesmo padrão de TODOS os outros formulários
          de Cadastros Base (`CreateOrUpdateCentroCusto.tsx`/
          `CreateOrUpdateEmissor.tsx`). `onSubmit` é um `preventDefault` PURO
          — o wizard NUNCA usa `handleSubmit` do RHF; navegação/salvamento
          continuam 100% via `onClick={handleNext}` nos botões do
          `FormFooter`. O `preventDefault` é a guarda contra um `Enter`
          disparar um submit nativo (reload de página), risco que só passa a
          existir agora que há uma tag `<form>` real envolvendo os inputs. */}
      <Form noPadding onSubmit={(e) => e.preventDefault()}>
        {/* `FormProvider` — permite que os Steps (Proprietário/Fornecedor)
            usem `useFormContext()` para `setValue`/`getValues`/`useFieldArray`
            dos repeaters sem precisar receber cada helper como prop manual;
            `control`/`register`/`errors` continuam também passados
            explicitamente via `stepProps` (mesma instância do form, nenhum
            conflito). */}
        <FormProvider {...form}>
          <StepsRoot
            step={idx}
            count={steps.length}
            onStepChange={(details: { step: number }) => {
              const key = steps[details.step];
              if (key && completed.includes(key)) goTo(key);
            }}
          >
            <StepsList>
              {steps.map((key, i) => (
                <Steps.Item key={key} index={i} title={stepLabels[key]} />
              ))}
            </StepsList>

            <Steps.Content index={idx}>{renderStep()}</Steps.Content>
          </StepsRoot>
        </FormProvider>
      </Form>

      <DeleteConfirmDialog
        isOpen={exitGuard.open}
        onClose={exitGuard.onClose}
        onConfirm={confirmExit}
        title={text.form.unsavedChanges.title}
        description={text.form.unsavedChanges.message}
        warningText=""
        confirmButtonText={text.form.unsavedChanges.confirm}
        colorPalette="orange"
      />

      {/* TASK-FE-337 — confirmação antes de salvar quando o submit vai
          DESATIVAR um usuário que já tinha acesso ativo (reaproveita o
          mesmo `DeleteConfirmDialog` já usado para o exitGuard acima,
          `colorPalette="red"` por revogar acesso ao sistema, ação com
          impacto real). */}
      <DeleteConfirmDialog
        isOpen={userDeactivateGuard.open}
        onClose={userDeactivateGuard.onClose}
        onConfirm={confirmDeactivateUserAndSave}
        isLoading={isSubmitting}
        title={text.form.user.deactivateDialog.title}
        description={text.form.user.deactivateDialog.message}
        warningText=""
        confirmButtonText={text.form.user.deactivateDialog.confirm}
        colorPalette="red"
      />

      {/* TASK-FE-338 (generalização do achado F/TASK-FE-337 para os 4
          papéis NÃO-usuário) — confirmação ÚNICA antes de salvar quando o
          submit vai DESATIVAR um ou mais de
          Proprietário/Funcionário/Fornecedor/Cliente que já estavam
          ativos (`rolesPendingDeactivation`, calculado em `handleNext` via
          `getRolesBeingDeactivated`). Mesmo `DeleteConfirmDialog`
          reaproveitado, `{roles}` interpolado com os rótulos reais
          (`text.roles.*`) separados por vírgula — cobre o caso de vários
          papéis desmarcados de uma vez numa única mensagem. */}
      <DeleteConfirmDialog
        isOpen={roleDeactivateGuard.open}
        onClose={roleDeactivateGuard.onClose}
        onConfirm={confirmDeactivateRolesAndSave}
        isLoading={isSubmitting}
        title={text.form.roleDeactivateDialog.title}
        description={text.form.roleDeactivateDialog.message.replace(
          '{roles}',
          rolesPendingDeactivation.map((role) => text.roles[role]).join(', ')
        )}
        warningText=""
        confirmButtonText={text.form.roleDeactivateDialog.confirm}
        colorPalette="red"
      />
    </FormContainer>
  );
}
