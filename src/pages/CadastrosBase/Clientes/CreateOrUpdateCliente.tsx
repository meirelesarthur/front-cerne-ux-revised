// src/pages/CadastrosBase/Clientes/CreateOrUpdateCliente.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de CLIENTE (Client — Cadastros Base,
// TASK-CL-FE-03). Rotas:
//   /cadastros-base/clientes/novo   (criar)
//   /cadastros-base/clientes/:uuid  (editar, GUID)
// registradas em src/router/index.tsx, ANTES do catch-all `/cadastros-base/*`
// — guardadas por `clients_view` (leitura mínima do form, instrução
// explícita da ficha); a autorização REAL de create/edit é aplicada dentro
// do componente (`canSave`, desabilita campos/submit) e, em última
// instância, pelo backend (403 de `clients_create`/`clients_edit`).
//
// ⚠️ SCAFFOLD ADIANTADO POR ESPELHAMENTO (TASK-CL-FE-03) — escrito ANTES de
// `Client-contrato.md`/`ClientRequest.php`/`TASK-CL-0N` de backend
// existirem. Molde estrutural PRIMÁRIO dos campos de papel + repeater
// `state_registrations`: `Pessoas/steps/StepCliente.tsx` (produção real,
// mesmo papel, mesmos nomes de campo internos). Molde da ARQUITETURA
// gated-mount + máscara `nif`/autofill CEP:
// `Proprietarios/CreateOrUpdateProprietario.tsx` (irmão estruturalmente mais
// próximo — sem bloco `farms[]`, só 1 repeater). CÓDIGO-INCOMPLETO / sujeito
// a reconciliação quando o contrato `/clients` fechar.
//
// Sem `Tabs.Root` (decisão registrada na ficha, "Referência UX" item 4) —
// `Client` não tem os blocos extras (Conta/Filiais/Vendedores) que
// justificam abas em `Fornecedores`; formulário single-page com seções.
//
// AJUSTE DE HOMOLOGAÇÃO (dono, 2026-07-30) — dois pontos abaixo DIVERGEM
// deliberadamente do mirror original de `Proprietary`/`Provider`, por
// instrução direta testada no browser (prevalece sobre o espelhamento):
//
// `is_enabled` PASSOU a ser campo do form, marcado OBRIGATÓRIO ("Ativo*").
// Renderizado como `Switch` (mesmo componente/estilo já usado neste arquivo
// para `final_costumer`/`taxpayer` — bloco boxed com borda), sempre incluído
// no payload de create/update. Default `true` em modo criação.
//
// `id_abroad` deixou de ser CONDICIONAL (`code_country !== 'BR'`) e passou a
// SEMPRE renderizar (mas continua opcional/não-required). Evidência do
// legado real (`agro365/resources/views/clients/_forms.blade.php:60`):
// `id_abroad` é `Form::text` simples, no MESMO bloco incondicional de
// `code_country`/`farm_name`, sem `@if`/Alpine `x-show`/Livewire `wire:show`
// — e `ClientController::rules()` do legado nem valida o campo
// condicionalmente. O antigo mirror de `StepCliente.tsx` (que escondia o
// campo) NÃO reflete o comportamento real do legado; corrigido aqui.
// -----------------------------------------------------------------------------
// CORREÇÃO CRÍTICA DE HOMOLOGAÇÃO (2026-07-30) — `code_country` estava
// ERRADO POR DESIGN, causa-raiz do 500 ao criar Cliente:
// `clients.code_country` é **`integer`** físico no Postgres e guarda o
// **código legado numérico** da tabela `countries.codigo` (ex.: `1058` =
// Brasil — `GB.Cerne.Api/app/Http/Requests/Api/V1/ClientRequest.php:141-153`,
// `client.code_country` validado com `regex:/^\d+$/` +
// `Rule::exists('countries','codigo')`; `app/Models/Country.php`:
// `@property int $codigo`, SEM coluna ISO alpha-2). O `CountryCombobox`
// (seletor ISO 3166-1 genérico, `value: "BR"`) usado antes aqui SEMPRE
// enviava sigla, nunca o código — `SQLSTATE[22P02] invalid input syntax for
// type integer: "BR"` (a API já responde 422 em vez de 500, mas o form
// continuava inutilizável). Corrigido: `code_country` agora consome
// `GET /countries/options` via `SelectAsyncPaginate` (mesmo catálogo/serviço
// `listCountryOptions` já usado por `Fazendas/steps/StepEndereco.tsx`,
// `TASK-BE-423/424`), `value = String(codigo)` (dígitos), `label = nome`.
// Default de criação resolvido por busca REAL (`search: 'Brasil'`), mesmo
// padrão já validado em `CreateOrUpdateFarm.tsx` — NUNCA hardcoded.
//
// GAP RESIDUAL REPORTADO (não bloqueia esta correção) — em EDIÇÃO,
// `ClientDetailResource::code_country` devolve só o escalar `codigo`
// (`app/Http/Resources/V1/ClientDetailResource.php:89`), SEM objeto País
// aninhado (diferente de `FarmDetailResource::country` `{uuid,nome,codigo}`,
// já embutido para o MESMO catálogo). `/countries/options` também não
// filtra por `codigo` (só `nome ILIKE`, `CountryRepository::listAll()`) —
// não há como resolver o `nome` a partir do `codigo` puro sem paginar a
// lista inteira. `buildClientFormDefaultValues` usa fallback HONESTO: label
// = o próprio código numérico até o backend fechar o gap (embutir o país
// no Resource, mirror Farm) ou o usuário reabrir o seletor.
// -----------------------------------------------------------------------------
// AJUSTE DE HOMOLOGAÇÃO (dono, 2026-07-30, `97-Esteiras/012`) — prefill de
// CPF/CNPJ (`handleNifBlur`) PASSOU a disparar TAMBÉM em EDIÇÃO, não só em
// criação (pedido literal do dono, REVERTE decisão anterior do Executor
// validada pelo Tester no packet anterior). Legado verificado
// (`agro365/resources/views/clients/_forms.blade.php:3` +
// `agro365/resources/js/main.js:261-266`) NÃO tem nenhum handler de
// blur/ajax para o campo `nif` do Cliente — só máscara (`cpf_cnpj`); logo
// não há precedente de legado sobre este comportamento, e o recurso é uma
// melhoria só da SPA (TASK-CL-FE-04). Guards adicionados para não destruir
// dado do usuário: (1) só dispara se o documento MUDOU de fato vs. o valor
// carregado da API (`originalNifDigitsRef`, comparação por dígitos); (2)
// 404/403 (documento não pertence a ninguém) não altera nada do form já
// preenchido; (3) toast diferenciado (`nifFoundWarningEditing`) deixa claro
// que dados de OUTRA pessoa substituíram os do formulário. Ver comentário
// completo em `handleNifBlur`.
// -----------------------------------------------------------------------------
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
//    — por isso este arquivo NUNCA chama `reset()`/`.replace()` para
//    hidratar dados assíncronos. Em vez disso, `buildClientFormDefaultValues`
//    computa o objeto completo (raiz + array) SINCRONAMENTE, e esse objeto
//    vira o `defaultValues` do `useForm()` já no PRIMEIRO mount de
//    `ClientFormBody`.
// 3. Inputs não-controlados de item novo só refletem `defaultValues` no
//    mount — por isso cada linha usa `key={field.id}` e é montada só depois
//    que `defaultValues` já contém os dados reais (Skeleton no wrapper
//    enquanto isso).
// -----------------------------------------------------------------------------
// TASK-MV-FE-10 (2026-08-10) — EXTRAÇÃO. Toda a orquestração de
// estado/submit descrita acima (`useForm`/`useFieldArray`/autofill NIF+CEP/
// mutação/submit) migrou LITERALMENTE (recorte-e-cola, nenhuma linha de
// lógica reescrita) para `useClientFormController.ts`; todo o JSX dos
// campos migrou para `ClientFormFields.tsx`. Esta página ficou reduzida ao
// wrapper de rota/permissão + `ClientFormBody`, que agora só resolve
// `text`/`navigate` locais para a casca (`FormContainer`) e delega o resto
// aos dois módulos extraídos — pré-requisito de TASK-MV-FE-11
// (`ClientFormModal`, reuso destes mesmos módulos dentro do form de
// Movement). Comportamento da tela: ZERO mudança (mesmos campos, ordem,
// autofill, validação, submit create/update).
// -----------------------------------------------------------------------------

import { Box, SimpleGrid, Skeleton } from '@chakra-ui/react';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { Form } from '@/components/Form';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';

import type { ClientDetail } from '@/@types/v2/CadastrosBase/client';

import { ClientFormFields } from './ClientFormFields';
import { useClientForm } from './useClientes';
import { useClientFormController } from './useClientFormController';

// ---- Wrapper (export default) ----------------------------------------------
// Só resolve `uuid`/permissões e dispara `clientQuery` (busca do detalhe,
// `fillForm` NO-OP — ver `useClientes.tsx`). Gateia o mount do form: em
// EDIÇÃO, aguarda o detalhe carregar (Skeleton enquanto isso); em CRIAÇÃO,
// monta `ClientFormBody` IMEDIATAMENTE.
export default function CreateOrUpdateCliente() {
  const { uuid } = useParams<{ uuid: string }>();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.clients.client;

  // É edição quando existe um GUID válido na rota ("novo" não é GUID).
  const isEditing = isValidGuid(uuid);

  const canSave = isEditing ? can('clients_edit') : can('clients_create');

  const clientQuery = useClientForm({ registrationId: isEditing ? uuid : undefined });

  const isLoading = isEditing && checkLoadingStatus([clientQuery as any]);

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
    <ClientFormBody
      // `key` garante remount limpo se o usuário navegar entre edições
      // diferentes sem passar pela listagem.
      key={uuid ?? 'new'}
      initialData={clientQuery.data as ClientDetail | undefined}
      isEditing={isEditing}
      clientUuid={uuid}
      canSave={canSave}
    />
  );
}

interface ClientFormBodyProps {
  initialData?: ClientDetail;
  isEditing: boolean;
  clientUuid?: string;
  canSave: boolean;
}

// ---- Corpo interno (TASK-MV-FE-10 — reduzido ao wrapper) ------------------
// Só monta quando os dados já estão prontos (`initialData` resolvido, ou
// `undefined` em criação). Toda a orquestração de estado/submit
// (`useForm`/`useFieldArray`/autofill/mutação) mora em
// `useClientFormController`; todo o JSX de campos mora em
// `ClientFormFields`. `onPersisted` é OMITIDO de propósito na chamada do
// controller abaixo — preserva o `navigate(-1)` original ao concluir
// create/update (comportamento intocado da página cheia).
function ClientFormBody({ initialData, isEditing, clientUuid, canSave }: ClientFormBodyProps) {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const text = languageGB.clients.client;

  const controller = useClientFormController({ initialData, isEditing, clientUuid, canSave });

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
              dirtyFields={controller.dirtyFields}
              type="button"
              onClick={controller.handleSubmit(controller.onSubmit)}
              languageGB={languageGB}
              loading={controller.isSubmitting}
              disabled={controller.isSubmitting}
            />
          )}
        </>
      }
    >
      <Form noPadding onSubmit={controller.handleSubmit(controller.onSubmit)}>
        <ClientFormFields {...controller} canSave={canSave} />
      </Form>
    </FormContainer>
  );
}
