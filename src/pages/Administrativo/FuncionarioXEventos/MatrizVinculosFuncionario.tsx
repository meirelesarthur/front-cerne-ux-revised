// src/pages/Administrativo/FuncionarioXEventos/MatrizVinculosFuncionario.tsx
// -----------------------------------------------------------------------------
// Tela 2 — MATRIZ DE VÍNCULOS do Funcionário — Administrativo → Gestão
// Pessoal (TASK-FE-FXE-02). Rotas `/administrativo/func-eventos/:employeeUuid`
// (MODO EDITAR) e `/administrativo/func-eventos/novo` (MODO CRIAR, TASK-104).
// Interação de edição REAL de Funcionário x Eventos (DA-EE-FE-01,
// INVIOLÁVEL): adicionar/editar/remover vínculos em memória
// (`useFieldArray`) e salvar TUDO de uma vez via `PUT /employee-events/sync`
// (mirror exato do `update()` legado — diff+delete+updateOrCreate).
//
// [REVISADO 2026-10-07, TASK-104 — supersede PARCIALMENTE o parágrafo acima]
// A frase "SEM tela de criar/editar 1 vínculo isolado — não existe rota
// `/novo`/formulário unitário" descrevia a ausência de uma rota de CRIAÇÃO;
// decisão nova do dono (itens 1+2 da demanda, página única fiel ao legado
// `employeeevents/_forms.blade`) reintroduz `/novo` — mas SEM formulário
// unitário de 1 vínculo: `/novo` monta esta MESMA Matriz completa
// (`useFieldArray` inteiro), só que com o Funcionário resolvido por um
// `SelectAsyncPaginate` inline (substitui `AdicionarVinculoModal`, removido)
// em vez de vir da URL. `AdicionarVinculoModal`/DA-EE-FE-02 (reversão
// parcial anterior) ficam obsoletos — o fluxo volta a ser 100% página única.
//
// ARQUITETURA gated-mount (mirror `CreateOrUpdateFuncionario.tsx`/
// `CorrecaoEstoqueDetalhe.tsx`): DOIS componentes.
//   - `MatrizVinculosFuncionario` (wrapper, export default) — decide o modo
//     (`isCreating = employeeUuid === undefined`, só ocorre na rota `/novo`)
//     + guarda de entrada (`:employeeUuid` mal-formado → toast + navigate
//     para a Tela 1; em modo CRIAR a guarda não se aplica até o Funcionário
//     ser escolhido) + 2 queries que precisam estar prontas ANTES do mount
//     do corpo (`getEmployeeByUuid` para o header, `listEmployeeEvents` para
//     semear o `useFieldArray` — os `defaultValues` são computados
//     SINCRONAMENTE, sem `reset()` reativo). Em modo CRIAR, as 2 queries só
//     ficam `enabled` após a seleção inline do Funcionário; antes disso, o
//     wrapper renderiza só o cabeçalho com o `SelectAsyncPaginate` (matriz e
//     Salvar ficam fora do fluxo até então, TASK-104 item 2). Enquanto as
//     queries não chegam: Skeleton.
//   - `MatrizVinculosFuncionarioBody` (interno) — só monta com os dados já
//     resolvidos. `key={employeeUuid}` no wrapper garante remount limpo
//     entre funcionários diferentes (troca de seleção em modo CRIAR inclui).
//     O catálogo de Eventos (`listEvents`, query 3) é carregado DENTRO do
//     corpo — só alimenta o seletor "Adicionar novo", não precisa bloquear o
//     mount. Recebe `isCreating`/`selectedEmployeeOption`/
//     `onChangeEmployeeOption` (TASK-104) para alternar o campo Funcionário
//     do cabeçalho entre `SelectAsyncPaginate` (CRIAR) e `InputReadOnly`
//     bloqueado (EDITAR, item 1 da demanda).
//
// `event_uuid` de uma linha EXISTENTE é IMUTÁVEL na UI (contrato de tela §3,
// Leitura do dev item 3) — o campo Evento é `Text` fixo, nunca um `Select`;
// trocar o Evento de um vínculo é remover a linha + adicionar outra.
//
// [REVISADO 2026-10-07, TASK-104 itens 1-4 — layout fiel ao legado
// `employeeevents/_forms.blade`] Colunas da linha agora são Evento → Condição
// → Valor → Método → Habilitado → [remover], TODAS na mesma linha da tabela.
// O bloco separado "Adicionar novo" (Select+Button abaixo da tabela) foi
// ELIMINADO — o botão `addEventButton` (`handleAddRow`) agora só faz
// `append` de uma linha NOVA EDITÁVEL vazia (`eventUuid: ''`) diretamente no
// `useFieldArray`. Para essa linha nova (sem `uuid`), a célula Evento vira um
// `Select` INLINE (`handleSelectRowEvent`) que, ao escolher o Evento do
// catálogo, popula via `setValue` os campos IRMÃOS da mesma linha
// (`eventName`/`method`/`methodLabel`) a partir do `EventListItem` escolhido
// — `method` deixa de ser editável pelo usuário (decisão do dono), é sempre
// auto-preenchido pelo Evento e só EXIBIDO (readonly) via `methodLabel`
// (linha existente: `EmployeeEventListItem.method_label` próprio, robusto a
// Evento desabilitado/fora do catálogo atual; linha nova: `method_label` do
// Evento escolhido no catálogo). A coluna Condição é 100% display-only — não
// existe em `SyncEmployeeEventItem`/payload — resolvida por lookup no
// catálogo (`eventsQuery.data`) pelo `eventUuid` corrente da linha
// (`getConditionLabel`), com fallback "—" se o Evento não estiver no
// catálogo ativo. Leitura reativa das linhas via `useWatch({ name: 'items'
// })` (não via snapshot de `fields`, que não reflete `setValue` em campos
// irmãos após o append inicial).
//
// [CORREÇÃO PÓS-ENTREGA, 2026-08-12 — TASK-FE-FXE-02 v2.0] GAP-BE-06
// revertido (ocorrências múltiplas legítimas do mesmo Evento). Cada linha
// (existente ou nova) é identificada pelo `uuid` FÍSICO da linha
// (`EmployeeEventListItem.uuid`), nunca pela tupla employee+event+farm. O
// controle "Adicionar novo" lista o catálogo COMPLETO de Eventos ativos, sem
// excluir os já presentes na matriz — repetir o mesmo Evento é comportamento
// válido e esperado.
//
// [CORREÇÃO DE DEFEITO DE UI, 2026-08-12] O controle "Adicionar novo" era um
// `<Select>` NAKED com `label={addEventButton}` — SEM nenhum `<Button>`
// clicável na tela (defeito real, reportado pelo dono). Agora é
// select+confirm: `<Select>` (sem label, só placeholder) guarda a escolha em
// `selectedEventOption`; `<Button icon={FiPlus}>` visível confirma a adição
// (mirror `MovementAllocationEditor.tsx` `handleAdd`/`addRowLabel`).
// -----------------------------------------------------------------------------

import { ElementType, useEffect, useState } from 'react';

import {
  Box,
  EmptyState,
  Flex,
  Icon,
  SimpleGrid,
  Skeleton,
  Table,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { FiAlertTriangle, FiPlus, FiTrash2 } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { IconButtonTable } from '@/components/IconButtonTable';
import { FormContainer } from '@/components/Layout/FormContainer';
import { Switch } from '@/components/ui/switch';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { docTypeOfDigits, normalizeDocument } from '@/utils/cpfCnpj';
import { extractApiFieldErrorMessage } from '@/utils/extractApiErrorMessage';
import { formatDocument } from '@/utils/formatDocument';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import {
  getEmployeeByUuid,
  listEmployees,
} from '@/services/v2/CadastrosBase/Employee/employee-service';
import {
  listEmployeeEvents,
  syncEmployeeEvents,
} from '@/services/v2/EmployeeEvents/employee-event-service';
import { listEvents } from '@/services/v2/Events/event-service';

import type { Option } from '@/@types/option';
import type { EmployeeDetail, EmployeeListItem } from '@/@types/v2/CadastrosBase/employee';
import type { EmployeeEventListItem } from '@/@types/v2/EmployeeEvents';
import type { EventListItem } from '@/@types/v2/Events';

const FUNC_EVENTOS_LIST_ROUTE = '/administrativo/func-eventos';

// Máscara de EXIBIÇÃO de CPF/CNPJ — mesmo helper local duplicado de
// `Funcionarios/index.tsx`/`FuncionarioXEventos/index.tsx` (convenção já
// estabelecida no projeto, não extraído para util compartilhado).
function maskNif(nif: string): string {
  const digits = normalizeDocument(nif);
  const type = docTypeOfDigits(nif);
  if (type === 'unknown') return nif;
  return formatDocument(digits, type) ?? nif;
}

// ---- Forma interna do RHF (1 linha por vínculo) ----------------------------

interface MatrixRowForm {
  /**
   * `uuid` da LINHA (`EmployeeEventListItem.uuid`) — presente quando a linha
   * já foi hidratada de um vínculo existente; `undefined` quando a linha foi
   * adicionada nesta sessão via "Adicionar novo" e ainda não passou por um
   * `sync` bem-sucedido (correção pós-entrega, GAP-BE-06 revertido — a
   * identidade da linha é o `uuid` físico, não mais a tupla
   * employee+event+farm; múltiplas linhas do MESMO Evento são legítimas).
   */
  uuid?: string;
  eventUuid: string;
  eventName: string;
  /**
   * [NOVO TASK-104] Rótulo legível do Método do Evento — display-only,
   * NUNCA enviado ao backend (`method` numérico já cobre o contrato). Linha
   * EXISTENTE: copiado de `EmployeeEventListItem.method_label` (robusto a
   * Evento desabilitado/fora do catálogo ativo). Linha NOVA: populado por
   * `handleSelectRowEvent` a partir do `EventListItem.method_label` do
   * catálogo quando o Evento é escolhido; vazio até lá.
   */
  methodLabel: string;
  value: number;
  /** Numérico do enum `EventMethod`, sempre auto-preenchido pelo Evento
   *  escolhido/vinculado — NUNCA editável na UI (TASK-104 item 4). Mantido
   *  como string (formato de `Option<string>`) só por simetria com o resto
   *  do form; convertido para `number` só no submit. */
  method: string;
  isEnabled: boolean;
}

interface MatrixFormValues {
  items: MatrixRowForm[];
}

// Linha em branco editável — MESMA forma usada por `handleAddRow` (linha
// nova adicionada via "Adicionar novo"). Extraída para ser reutilizada como
// seed do MODO CRIAR vazio (ver `buildMatrixDefaultValues`).
function buildBlankMatrixRow(): MatrixRowForm {
  return {
    eventUuid: '',
    eventName: '',
    methodLabel: '',
    value: 0,
    method: '',
    isEnabled: true,
  };
}

// `defaultValues` computados SINCRONAMENTE a partir da query já resolvida
// (mirror `buildEmployeeFormDefaultValues`) — nenhum `reset()` reativo em
// `useEffect` para a hidratação inicial.
//
// [NOVO TASK-104, pedido do dono] Em MODO CRIAR (`isCreating`) sem NENHUM
// vínculo existente, a matriz já nasce com UMA linha em branco editável
// (mesma forma de `handleAddRow`/`buildBlankMatrixRow`) — evita o usuário
// precisar clicar "Adicionar novo +" para o primeiro item, já que pelo menos
// 1 item é obrigatório para salvar. Em MODO EDITAR, ou quando já existem
// vínculos (CRIAR reaproveitando funcionário com histórico, não deveria
// ocorrer na prática mas é defensivo), o comportamento permanece inalterado
// — nenhuma linha extra é semeada além das já hidratadas.
function buildMatrixDefaultValues(
  employeeEvents: EmployeeEventListItem[],
  isCreating: boolean
): MatrixFormValues {
  const items = employeeEvents
    // [CORREÇÃO DE BUG, crash "Algo deu errado" em /novo e /:employeeUuid]
    // vínculo órfão (evento removido/excluído do catálogo, `event` vem
    // `null`/`undefined` do backend a despeito do tipo declarar não-nulo)
    // não deve virar linha — sem o guard, `item.event.uuid` estourava
    // `TypeError: Cannot read properties of undefined (reading 'uuid')`.
    .filter((item) => item.event != null)
    .map((item) => ({
      uuid: item.uuid,
      eventUuid: item.event.uuid,
      eventName: item.event.name ?? '',
      methodLabel: item.method_label,
      value: item.value,
      method: String(item.method),
      isEnabled: item.is_enabled,
    }));

  if (isCreating && items.length === 0) {
    return { items: [buildBlankMatrixRow()] };
  }

  return { items };
}

// ---- Wrapper (export default) ----------------------------------------------

export default function MatrizVinculosFuncionario() {
  const { employeeUuid } = useParams<{ employeeUuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.employeeEvents.employeeEvent;

  // TASK-104: `employeeUuid` só vem `undefined` na rota `/novo` (as outras 2
  // rotas do componente sempre entregam uma string via `:employeeUuid`) —
  // modo CRIAR resolve o Funcionário por um `SelectAsyncPaginate` inline
  // (substitui `AdicionarVinculoModal`) em vez de vir da URL.
  const isCreating = employeeUuid === undefined;

  // Estado do Funcionário escolhido inline em MODO CRIAR — `null` fora desse
  // modo (nunca lido/alterado na rota `:employeeUuid`).
  const [selectedEmployeeOption, setSelectedEmployeeOption] = useState<Option<string> | null>(null);

  // `effectiveEmployeeUuid` alimenta as 2 queries abaixo nos 2 modos: vem da
  // URL em MODO EDITAR, do estado local em MODO CRIAR (só após a seleção).
  const effectiveEmployeeUuid = isCreating ? selectedEmployeeOption?.value : employeeUuid;

  const hasValidParams = isCreating || isValidGuid(employeeUuid);

  // Guarda de entrada — `employeeUuid` mal-formado em MODO EDITAR NUNCA
  // dispara chamada de rede; redireciona à Tela 1 com toast (mirror exato
  // `CorrecaoEstoqueDetalhe.tsx`). Em MODO CRIAR a guarda nunca dispara
  // (`hasValidParams` é sempre `true`). Deps somente [hasValidParams].
  useEffect(() => {
    if (!hasValidParams) {
      toaster.create({
        type: 'error',
        title: text.matrix.invalidParamsToast.title,
        description: text.matrix.invalidParamsToast.description,
      });
      navigate(FUNC_EVENTOS_LIST_ROUTE, { replace: true });
    }
  }, [hasValidParams]);

  // [NOVO TASK-104 item 8, robustez] Em MODO CRIAR (`/novo`) o gate de rota é
  // `employeeevents_create` — usar `employeeevents_edit` aqui bloqueava a
  // edição das linhas inteira para um usuário que só tem permissão de criar
  // (sem a de editar), tornando o formulário de criação inoperante. Em MODO
  // EDITAR mantém `employeeevents_edit` (comportamento inalterado).
  const canEdit = isCreating ? can('employeeevents_create') : can('employeeevents_edit');

  const employeeQuery = useQuery({
    queryKey: [queryKey.cadastrosBase.employee, effectiveEmployeeUuid],
    queryFn: async () => {
      const response = await getEmployeeByUuid(effectiveEmployeeUuid!);
      return response.data;
    },
    enabled: hasValidParams && !!effectiveEmployeeUuid,
    retry: false,
  });

  const employeeEventsQuery = useQuery({
    queryKey: [queryKey.employeeEvents.employeeEventsList, effectiveEmployeeUuid],
    queryFn: async () => {
      const response = await listEmployeeEvents({
        employee_uuid: effectiveEmployeeUuid!,
        per_page: 100,
      });
      return response.data.items;
    },
    enabled: hasValidParams && !!effectiveEmployeeUuid,
    retry: false,
  });

  if (!hasValidParams) {
    return null;
  }

  // MODO CRIAR sem Funcionário escolhido ainda — só o cabeçalho com o
  // `SelectAsyncPaginate` é renderizado; matriz de eventos e Salvar ficam
  // FORA do fluxo até a seleção (TASK-104 item 2, mirror da página única do
  // legado). Nenhuma chamada de rede acontece aqui (as 2 queries acima estão
  // `enabled: false` sem `effectiveEmployeeUuid`).
  if (isCreating && !effectiveEmployeeUuid) {
    return (
      <FormContainer title={text.matrix.createTitle}>
        <Box px={{ base: 4, md: 10 }} pb={8} pt={4}>
          <SimpleGrid columns={columnsForm.threeColumns} gap={6}>
            <SelectAsyncPaginate
              name="matrix-select-employee"
              label={text.matrix.header.employeeLabel}
              placeholder={text.matrix.header.employeeSelectPlaceholder}
              service={listEmployees}
              mapOptions={(item: EmployeeListItem) => ({ label: item.name, value: item.uuid })}
              findParams={(search: string | { search: string }) => ({
                search: typeof search === 'string' ? search : search.search,
                is_enabled: true,
              })}
              pageSize={10}
              value={selectedEmployeeOption}
              onChange={(option: any) => setSelectedEmployeeOption(option ?? null)}
              // [CORREÇÃO DE BUG, menu clipado pelo overflow do
              // `FormContainer`] mirror `CreateOrUpdateInvoice.tsx`/
              // `FilterSideInvoice.tsx` — fora de `Dialog.Root`, o padrão
              // canônico é portal em `document.body` + `menuPosition="fixed"`
              // (TASK-FE-063-SELECT-MENU-CLIP-FIX), não `disablePortal`
              // (reservado a Selects DENTRO de modais).
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
            <InputReadOnly label={text.matrix.header.nifLabel} value="—" />
            <InputReadOnly label={text.matrix.header.functionLabel} value="—" />
          </SimpleGrid>
        </Box>
      </FormContainer>
    );
  }

  const isLoading = checkLoadingStatus([employeeQuery as any, employeeEventsQuery as any]);
  const notFound = !isLoading && employeeQuery.isError;

  if (isLoading) {
    return (
      <FormContainer title={isCreating ? text.matrix.createTitle : text.matrix.title}>
        <Box px={{ base: 4, md: 10 }} pb={8}>
          <Skeleton height="28px" width="260px" mb={2} />
          <Skeleton height="18px" width="160px" mb={6} />
          <Skeleton height="220px" borderRadius="md" />
        </Box>
      </FormContainer>
    );
  }

  if (notFound) {
    return (
      <FormContainer title={text.singularLabel}>
        <Flex direction="column" align="center" justify="center" py={16} px={4}>
          <EmptyState.Root>
            <EmptyState.Content>
              <EmptyState.Indicator>
                <Icon as={FiAlertTriangle} boxSize={8} color="fg.muted" />
              </EmptyState.Indicator>
              <VStack textAlign="center" gap={1}>
                <EmptyState.Title>{text.matrix.invalidParamsToast.title}</EmptyState.Title>
                <EmptyState.Description>
                  {text.matrix.invalidParamsToast.description}
                </EmptyState.Description>
              </VStack>
              <Button
                title={text.matrix.backButton}
                variant="outline"
                size="sm"
                onClick={() =>
                  isCreating ? setSelectedEmployeeOption(null) : navigate(FUNC_EVENTOS_LIST_ROUTE)
                }
              />
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  return (
    <MatrizVinculosFuncionarioBody
      // `key` garante remount limpo se o usuário navegar entre funcionários
      // diferentes sem passar pela Tela 1 (inclui troca de seleção em MODO
      // CRIAR).
      key={effectiveEmployeeUuid}
      employeeUuid={effectiveEmployeeUuid!}
      employee={employeeQuery.data as EmployeeDetail}
      employeeEvents={employeeEventsQuery.data ?? []}
      canEdit={canEdit}
      isCreating={isCreating}
      selectedEmployeeOption={selectedEmployeeOption}
      onChangeEmployeeOption={isCreating ? setSelectedEmployeeOption : undefined}
    />
  );
}

// ---- Corpo interno -----------------------------------------------------

interface MatrizVinculosFuncionarioBodyProps {
  employeeUuid: string;
  employee: EmployeeDetail;
  employeeEvents: EmployeeEventListItem[];
  canEdit: boolean;
  /** [TASK-104] `true` só na rota `/novo` — alterna o campo Funcionário do
   *  cabeçalho para `SelectAsyncPaginate` (em vez de `InputReadOnly`
   *  bloqueado) e o título do `FormContainer`. */
  isCreating?: boolean;
  /** [TASK-104] Valor controlado do `SelectAsyncPaginate` de Funcionário em
   *  MODO CRIAR — estado vive no wrapper (sobrevive ao `key` do corpo). */
  selectedEmployeeOption?: Option<string> | null;
  /** [TASK-104] Só definido em MODO CRIAR — troca o Funcionário selecionado
   *  (o wrapper reage recalculando `effectiveEmployeeUuid`, remontando o
   *  corpo com os dados do novo Funcionário). */
  onChangeEmployeeOption?: (option: Option<string> | null) => void;
}

function MatrizVinculosFuncionarioBody({
  employeeUuid,
  employee,
  employeeEvents,
  canEdit,
  isCreating = false,
  selectedEmployeeOption = null,
  onChangeEmployeeOption,
}: MatrizVinculosFuncionarioBodyProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { languageGB } = useLanguage();
  const text = languageGB.employeeEvents.employeeEvent;

  const { control, handleSubmit, setValue } = useForm<MatrixFormValues>({
    defaultValues: buildMatrixDefaultValues(employeeEvents, isCreating),
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  // Leitura REATIVA das linhas (TASK-104) — `fields` (snapshot do
  // `useFieldArray`) não reflete `setValue` em campos irmãos disparado por
  // `handleSelectRowEvent` após o `append` inicial da linha nova; `useWatch`
  // sim. Usado para exibir `eventName`/`methodLabel`/`eventUuid` corrente de
  // cada linha (existente ou nova).
  const watchedItems = useWatch({ control, name: 'items' });

  // Catálogo de Eventos ATIVOS (query 3, contrato de tela §3) — carregado
  // dentro do corpo, não bloqueia o mount da Matriz; só alimenta o seletor.
  // Teto `per_page: 100` (contrato §Riscos — catálogos > 100 itens não são
  // cobertos nesta fatia, não-bloqueante).
  const eventsQuery = useQuery({
    queryKey: [queryKey.events.eventsList, 'employee-events-matrix-catalog'],
    queryFn: async () => {
      const response = await listEvents({ is_enabled: true, per_page: 100 });
      return response.data.items;
    },
    retry: false,
  });

  // [CORREÇÃO PÓS-ENTREGA, GAP-BE-06 revertido] — lista o catálogo COMPLETO
  // de Eventos ativos, SEM excluir os `event_uuid`s já presentes no
  // `useFieldArray`. Ocorrências múltiplas do mesmo Evento para o mesmo
  // Funcionário/Fazenda são legítimas (o backend não rejeita mais isso);
  // "Adicionar novo" sempre cria uma nova linha/ocorrência, nunca um filtro
  // de "evento ainda não vinculado".
  const catalog: EventListItem[] = eventsQuery.data ?? [];
  const availableEventOptions: Option<string>[] = catalog.map((event) => ({
    label: event.name,
    value: event.uuid,
  }));

  // [NOVO TASK-104 item 3] Coluna "Condição" — SEMPRE derivada do catálogo
  // (`EventListItem.condition_label`) pelo `eventUuid` corrente da linha,
  // NUNCA armazenada no form (display-only, mirror legado). Funciona
  // uniformemente para linha existente (lookup pelo `event.uuid` hidratado)
  // e linha nova (lookup pelo `eventUuid` escolhido no Select inline); "—"
  // se o Evento não estiver no catálogo ativo (desabilitado/removido) ou
  // ainda não tiver sido escolhido.
  function getConditionLabel(eventUuid: string | undefined): string {
    if (!eventUuid) return '—';
    const event = catalog.find((item) => item.uuid === eventUuid);
    return event?.condition_label ?? '—';
  }

  const syncMutation = useMutation({
    mutationFn: syncEmployeeEvents,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [queryKey.employeeEvents.employeeEventsList],
      });
      // [FIX esteira 113] Cache da Apuração Mensal desatualizado após editar
      // o vínculo Funcionário x Eventos — `useEmployeeEventItems`
      // (`useEarnings.tsx`) usa prefixo `queryKey.earnings.earning` com
      // `staleTime` de 5min para semear as linhas de uma apuração NOVA
      // (UT-000742). Sem esta invalidação, abrir uma apuração nova dentro da
      // janela de 5min de uma leitura anterior semeava a partir do cache,
      // sem o evento recém-vinculado/editado (divergência do legado, que não
      // tem cache). Invalidação por PREFIXO (match parcial do TanStack
      // Query) cobre `employee-event-items` e qualquer outra chave derivada
      // deste mesmo prefixo — NÃO toca o ramo "apuração já lançada"
      // (`data.events`, que não lê este hook).
      queryClient.invalidateQueries({
        queryKey: [queryKey.earnings.earning],
      });
      toaster.success({
        title: text.singularLabel,
        description: text.matrix.saveSuccessToast,
      });
      navigate(-1);
    },
    onError: (error) => {
      // [CORREÇÃO PÓS-ENTREGA, GAP-BE-06 revertido] — o backend não retorna
      // mais `errors.duplicate_link` para duplicidade de negócio (ocorrências
      // múltiplas do mesmo Evento são legítimas). Só o fallback genérico
      // permanece (campo obrigatório ausente, `uuid` de linha que não
      // pertence a este funcionário/fazenda, etc.).
      const resData = isAxiosError(error) ? (error.response?.data as any) : null;
      toaster.error({
        title: text.matrix.saveError.title,
        description:
          extractApiFieldErrorMessage(error) ??
          resData?.message ??
          text.matrix.saveError.description,
        duration: 7000,
      });
    },
  });

  const isSaving = syncMutation.isPending;

  // [REVISADO 2026-10-07, TASK-104 itens 1+2] O controle "Adicionar novo"
  // deixa de ser um select+confirm SEPARADO abaixo da tabela — `handleAddRow`
  // (disparado pelo clique no botão "Adicionar novo"/`addEventButton`,
  // sempre visível no rodapé da tabela) só anexa uma linha NOVA EDITÁVEL
  // VAZIA (`eventUuid: ''`) ao `useFieldArray`; a escolha do Evento passa a
  // acontecer INLINE, na própria célula Evento dessa linha (`Select` em vez
  // de `Text` fixo, só para linhas sem `uuid`).
  function handleAddRow() {
    append(buildBlankMatrixRow());
  }

  // Escolha do Evento INLINE na célula de uma linha NOVA — popula, via
  // `setValue`, os campos IRMÃOS da MESMA linha a partir do `EventListItem`
  // do catálogo escolhido: `eventName` (exibição, mirror linha existente),
  // `method` (numérico, sempre enviado no submit — TASK-104 item 4, não mais
  // editável pelo usuário) e `methodLabel` (exibição readonly da coluna
  // Método). A coluna Condição NÃO é populada aqui — é sempre derivada ao
  // vivo por `getConditionLabel(eventUuid)` no render (item 3).
  function handleSelectRowEvent(index: number, option: Option<string> | null) {
    if (!option) return;
    const event = catalog.find((item) => item.uuid === option.value);
    setValue(`items.${index}.eventUuid`, option.value, { shouldDirty: true });
    setValue(`items.${index}.eventName`, event?.name ?? option.label, { shouldDirty: true });
    setValue(`items.${index}.method`, event ? String(event.method) : '', { shouldDirty: true });
    setValue(`items.${index}.methodLabel`, event?.method_label ?? '', { shouldDirty: true });
  }

  function onSubmit(data: MatrixFormValues) {
    syncMutation.mutate({
      employee_uuid: employeeUuid,
      items: data.items
        // [NOVO TASK-104 item 6] Linha nova ainda sem Evento escolhido
        // (`eventUuid` vazio) é IGNORADA no submit — nunca envia
        // `event_uuid: ''` ao backend (o `EmployeeEventSyncRequest` exige o
        // campo preenchido; a linha permanece só em memória até o usuário
        // escolher um Evento ou removê-la).
        .filter((item) => !!item.eventUuid)
        .map((item) => ({
          // Presente = linha existente (mantém/atualiza pelo `uuid` físico da
          // linha); ausente = linha nova adicionada nesta sessão via
          // "Adicionar novo" (o backend cria). Correção pós-entrega, GAP-BE-06
          // revertido — contrato de tela §3.
          ...(item.uuid ? { uuid: item.uuid } : {}),
          event_uuid: item.eventUuid,
          value: Number(item.value) || 0,
          method: Number(item.method),
          is_enabled: !!item.isEnabled,
        })),
    });
  }

  const hasRows = fields.length > 0;
  // [CORREÇÃO PÓS-ENTREGA] — antes significava "todos os eventos do catálogo
  // já foram vinculados"; agora significa apenas "o catálogo de Eventos
  // ativos da fazenda está vazio" (sem eventos cadastrados), já que o
  // catálogo não é mais filtrado pelas linhas já presentes na matriz.
  const noEventsLeft = availableEventOptions.length === 0 && !eventsQuery.isLoading;

  return (
    <FormContainer
      // [TASK-104] Em MODO CRIAR o título fica genérico (`createTitle`) — o
      // nome/CPF do Funcionário já aparecem no cabeçalho Funcionário/CPF-
      // CNPJ/Função logo abaixo, exibi-los 2x no título seria redundante.
      // Em MODO EDITAR mantém o comportamento anterior (nome + CPF no
      // título), item 1 da demanda só exige que os 3 campos EXISTAM como
      // label+bloqueado — não proíbe manter o título.
      title={isCreating ? text.matrix.createTitle : employee.name}
      subtitle={isCreating ? undefined : maskNif(employee.nif)}
      footer={
        <>
          <Button
            title={text.matrix.cancelButton}
            variant="secondary"
            type="button"
            onClick={() => navigate(-1)}
            disabled={isSaving}
          />
          {canEdit && (
            <Button
              title={text.matrix.saveButton}
              type="button"
              onClick={handleSubmit(onSubmit)}
              loading={isSaving}
              disabled={isSaving}
            />
          )}
        </>
      }
    >
      <Box px={{ base: 4, md: 10 }} pb={8} pt={4}>
        {/* [TASK-104 itens 1+2] Cabeçalho Funcionário → CPF/CNPJ → Função,
            ordem fiel ao legado `employeeevents/_forms.blade`. Em MODO
            EDITAR os 3 campos são `InputReadOnly` (label+bloqueado); em
            MODO CRIAR o Funcionário é um `SelectAsyncPaginate` inline
            (substitui `AdicionarVinculoModal`) e CPF/Função continuam
            bloqueados, populados a partir do `EmployeeDetail` já carregado
            pelo wrapper após a seleção. */}
        <SimpleGrid columns={columnsForm.threeColumns} gap={6} mb={6}>
          {isCreating ? (
            <SelectAsyncPaginate
              name="matrix-select-employee"
              label={text.matrix.header.employeeLabel}
              placeholder={text.matrix.header.employeeSelectPlaceholder}
              service={listEmployees}
              mapOptions={(item: EmployeeListItem) => ({ label: item.name, value: item.uuid })}
              findParams={(search: string | { search: string }) => ({
                search: typeof search === 'string' ? search : search.search,
                is_enabled: true,
              })}
              pageSize={10}
              value={selectedEmployeeOption}
              onChange={(option: any) => onChangeEmployeeOption?.(option ?? null)}
              isDisabled={isSaving}
              // [CORREÇÃO DE BUG, menu clipado pelo overflow do
              // `FormContainer`] mirror `CreateOrUpdateInvoice.tsx`/
              // `FilterSideInvoice.tsx` — fora de `Dialog.Root`, o padrão
              // canônico é portal em `document.body` + `menuPosition="fixed"`
              // (TASK-FE-063-SELECT-MENU-CLIP-FIX), não `disablePortal`
              // (reservado a Selects DENTRO de modais).
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          ) : (
            <InputReadOnly label={text.matrix.header.employeeLabel} value={employee.name} />
          )}
          <InputReadOnly label={text.matrix.header.nifLabel} value={maskNif(employee.nif)} />
          <InputReadOnly
            label={text.matrix.header.functionLabel}
            value={employee.function?.name ?? '—'}
          />
        </SimpleGrid>

        {hasRows ? (
          // [TASK-104 itens 1-4] Ordem de colunas fiel ao legado
          // `employeeevents/_forms.blade`: Evento → Condição → Valor →
          // Método → Habilitado → [remover], todas na MESMA linha.
          <Table.Root size="sm" variant="outline">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>{text.matrix.table.event}</Table.ColumnHeader>
                <Table.ColumnHeader>{text.matrix.table.condition}</Table.ColumnHeader>
                <Table.ColumnHeader>{text.matrix.table.value}</Table.ColumnHeader>
                <Table.ColumnHeader>{text.matrix.table.method}</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="center">
                  {text.matrix.table.enabled}
                </Table.ColumnHeader>
                <Table.ColumnHeader />
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {fields.map((field, index) => {
                // Linha EXISTENTE (`uuid` físico já hidratado) × linha NOVA
                // (adicionada nesta sessão via `handleAddRow`, ainda sem
                // Evento escolhido ou recém-escolhido). `field.uuid` vem do
                // snapshot do `useFieldArray` — estável durante toda a
                // sessão (nunca mutado por `setValue`), marcador seguro.
                const isExistingRow = !!field.uuid;
                const rowValues = watchedItems?.[index];
                const eventUuid = rowValues?.eventUuid ?? field.eventUuid;
                const eventName = rowValues?.eventName ?? field.eventName;
                const methodLabel = rowValues?.methodLabel ?? field.methodLabel;

                return (
                  <Table.Row key={field.id}>
                    <Table.Cell minW="200px">
                      {isExistingRow ? (
                        // `event_uuid` de uma linha EXISTENTE é IMUTÁVEL na UI
                        // (contrato de tela §3) — trocar o Evento de um
                        // vínculo é remover a linha + adicionar outra.
                        <Text fontWeight="medium">{eventName}</Text>
                      ) : (
                        <Controller
                          name={`items.${index}.eventUuid`}
                          control={control}
                          render={({ field: rowField }) => (
                            <Select
                              name={rowField.name}
                              value={
                                availableEventOptions.find(
                                  (option) => option.value === rowField.value
                                ) ?? null
                              }
                              onChange={(opt) => handleSelectRowEvent(index, opt)}
                              options={availableEventOptions}
                              placeholder={
                                noEventsLeft
                                  ? text.matrix.noEventsAvailable
                                  : text.matrix.addEventPlaceholder
                              }
                              isDisabled={!canEdit || isSaving || noEventsLeft}
                              loading={eventsQuery.isLoading}
                              noClearable
                            />
                          )}
                        />
                      )}
                    </Table.Cell>
                    <Table.Cell minW="140px">
                      {/* [NOVO TASK-104 item 3] Display-only, NUNCA
                          persistida — derivada ao vivo do catálogo pelo
                          `eventUuid` corrente da linha. */}
                      <Text color="fg.muted">{getConditionLabel(eventUuid)}</Text>
                    </Table.Cell>
                    <Table.Cell maxW="180px">
                      <Controller
                        name={`items.${index}.value`}
                        control={control}
                        render={({ field: rowField }) => (
                          <MoneyInput
                            name={rowField.name}
                            value={rowField.value ?? 0}
                            onValueChange={(value) => rowField.onChange(value)}
                            disabled={!canEdit || isSaving}
                          />
                        )}
                      />
                    </Table.Cell>
                    <Table.Cell maxW="200px">
                      {/* [REVISADO TASK-104 item 4] Método deixa de ser
                          editável — sempre auto-preenchido pelo Evento
                          escolhido/vinculado, só EXIBIDO (readonly). `method`
                          numérico continua sendo enviado no submit. */}
                      <Text color="fg.muted">{methodLabel || '—'}</Text>
                    </Table.Cell>
                    <Table.Cell textAlign="center">
                      <Controller
                        name={`items.${index}.isEnabled`}
                        control={control}
                        render={({ field: rowField }) => (
                          <Flex justify="center">
                            {/* @ts-ignore - Chakra UI v3 Switch API */}
                            <Switch
                              checked={!!rowField.value}
                              onCheckedChange={(d: any) => rowField.onChange(d.checked)}
                              colorPalette="green"
                              disabled={!canEdit || isSaving}
                              aria-label={text.matrix.table.enabled}
                            />
                          </Flex>
                        )}
                      />
                    </Table.Cell>
                    <Table.Cell>
                      {canEdit && (
                        <IconButtonTable
                          aria-label={text.matrix.removeRowButton}
                          mensegerTooltip={text.matrix.removeRowButton}
                          size="sm"
                          color="red.500"
                          variant="ghost"
                          disabled={isSaving}
                          onClick={() => remove(index)}
                        >
                          <Icon as={FiTrash2} />
                        </IconButtonTable>
                      )}
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table.Root>
        ) : (
          <EmptyState.Root size="sm">
            <EmptyState.Content>
              <VStack textAlign="center" gap={1}>
                <EmptyState.Title>{text.matrix.emptyState.title}</EmptyState.Title>
                <EmptyState.Description>
                  {text.matrix.emptyState.description}
                </EmptyState.Description>
              </VStack>
            </EmptyState.Content>
          </EmptyState.Root>
        )}

        {canEdit && (
          // [REVISADO TASK-104 itens 1+2] Substitui o bloco separado
          // Select+Button — só o botão "Adicionar novo" permanece, agora
          // anexando uma linha nova EDITÁVEL diretamente na tabela
          // (`handleAddRow`); a escolha do Evento passa a ser inline, na
          // célula Evento da própria linha (ver corpo da tabela acima).
          <Flex justify="flex-end" mt={4}>
            <Button
              title={text.matrix.addEventButton}
              icon={FiPlus as ElementType}
              variant="outline"
              size="sm"
              onClick={handleAddRow}
              disabled={isSaving || noEventsLeft}
            />
          </Flex>
        )}
      </Box>
    </FormContainer>
  );
}
