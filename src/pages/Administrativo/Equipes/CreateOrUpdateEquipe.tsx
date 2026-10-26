// src/pages/Administrativo/Equipes/CreateOrUpdateEquipe.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO, EDIÇÃO e VISUALIZAÇÃO de EQUIPE — Administrativo /
// Gestão Pessoal (TASK-EQ-FE-02 + TASK-EQ-FE-04). Rotas: /administrativo/equipes/novo,
// /administrativo/equipes/:teamUuid (GUID) e /administrativo/equipes/:teamUuid/detalhe
// (somente-leitura FORÇADO, GAP-EQ-FE-11), registradas em src/router/index.tsx.
//
// Referência UX (GAP-EQ-FE-02 — UX-GAP, tela ausente no design system
// `cerne`, derivada por composição canônica + análogos):
//   GB.Cerne.UX @ 24bd91603a6ee4e19b58fa5efe2221835c83e306
//   Análogos: RepeaterList + StepFornecedor (repeater) · Relatório de
//   Estoque Consolidado (cascata de selects, EstoqueConsolidadoReportPage.tsx:118-130)
//   Molde de código na SPA (sibling-first):
//     src/pages/Administrativo/Funcoes/CreateOrUpdateFuncao.tsx (casca, fillForm, 422)
//     src/pages/Administrativo/Solicitacao/RequestItemRow.tsx (repeater, seção completa)
//     src/pages/Invoices/InvoiceItemsTab.tsx:~1140-1210 (cascata intra-linha)
//     src/pages/CadastrosBase/Pessoas/CreateOrUpdatePessoa.tsx (guarda de saída sem salvar)
//     DetalheCentroCusto.tsx / SafraDetalhe.tsx (precedente do botão "Editar" no rodapé)
//
// GAP-EQ-FE-04 + GAP-EQ-FE-11 — modo VISUALIZAR tem DUAS portas:
//   `isReadOnly = isEditing && (isDetailRoute || !can('teams_edit'))`
//   1. Por PERMISSÃO (`!can('teams_edit')`) em `/:teamUuid` — FE-04, inalterado.
//   2. Por ROTA (`isDetailRoute`, sufixo `/detalhe`) — FE-11, decisão de produto
//      do dono: "Visualizar" da listagem passou a ser SEMPRE exibida para
//      `teams_view`, então precisa de um destino que force somente-leitura
//      mesmo para quem também tem `teams_edit`.
// Em QUALQUER dos dois, os satélites de opções (`supervisor-options`/
// `member-options`) NUNCA são chamados (403) — os rótulos vêm hidratados do
// próprio `GET /teams/{uuid}` (`supervisor`, `members[].provider`/`type_label`).
// NÃO SIMPLIFICAR a seedagem abaixo (`supervisorOptions`) nem a de
// `TeamMemberRow.tsx` — sem elas a tela de detalhe abre com rótulos em branco
// para quem tem `teams_edit` (armadilha #2 da TASK-EQ-FE-04).
//
// Armadilhas de payload (contrato de tela §5.5, `GAP-EQ-FE-03`):
//   1. `members: []` é 422 garantido — omitir a chave quando vazio.
//   2. `PUT` é substituição integral — nunca delta de `dirtyFields`.
//   3. `type` só `{2,3}`, coerente com `providers.type` (garantido pela
//      cascata de `TeamMemberRow.tsx`).
//
// `farm_id` NUNCA existe neste formulário — nem hidden, nem no payload (vem
// do header `X-Farm-Id`, corrige DIV-002 também no cliente).
// -----------------------------------------------------------------------------

import { ElementType, useEffect, useState } from 'react';

import { Box, Flex, SimpleGrid, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { isAxiosError } from 'axios';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { FiEdit, FiPlus } from 'react-icons/fi';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';
import { FormContainer } from '@/components/Layout/FormContainer';
import { Switch } from '@/components/ui/switch';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { teamSchemaResolver } from '@/validations/schemas/Equipes/team-schema';

import { createTeam, updateTeam } from '@/services/v2/Teams/team-service';

import type { CreateTeamRequest, TeamDetail, TeamForm as TeamFormValues } from '@/@types/v2/Teams';

import { TeamMemberRow } from './TeamMemberRow';
import { useSupervisorOptions, useTeamForm } from './useEquipes';

export default function CreateOrUpdateEquipe() {
  const { teamUuid } = useParams<{ teamUuid: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const text = languageGB.workTeams.workTeam;
  const formText = text.form;

  // Detecção de modo (convenção do fork) — "novo" não é GUID, então a mesma
  // rota-parâmetro não confunde os dois modos.
  const isEditing = isValidGuid(teamUuid);

  // GAP-EQ-FE-11 — detecção da rota `/detalhe` (segmento literal após o
  // parâmetro). Normaliza a barra final antes do `endsWith` — `/…/detalhe/`
  // precisa continuar sendo detectado como detalhe (armadilha #8 da
  // TASK-EQ-FE-04). `useLocation` (não `useMatch` — sibling-first, já usado
  // em 8 arquivos do fork).
  const isDetailRoute = location.pathname.replace(/\/+$/, '').endsWith('/detalhe');

  // Guard — `teamUuid` presente e malformado não pode chegar ao hook de
  // detalhe (`useCustomFormQueryByGuid` só desabilita a query, não
  // redireciona). Rota "/novo" (`teamUuid` undefined) não passa por aqui.
  useEffect(() => {
    if (!teamUuid) return;
    if (!isValidGuid(teamUuid)) {
      navigate('/administrativo/equipes', { replace: true });
    }
  }, [teamUuid, navigate]);

  // GAP-EQ-FE-04 + GAP-EQ-FE-11 — um único componente para os modos de
  // criar/editar/visualizar. `isReadOnly` é verdadeiro tanto ao editar sem
  // `teams_edit` (só `teams_view`, FE-04) quanto ao entrar pela rota
  // `/detalhe` (FE-11 — read-only FORÇADO, inclusive para quem tem
  // `teams_edit`). Em read-only: campos desabilitados, repeater sem
  // adicionar/remover, satélites de opções NUNCA chamados (403), footer só
  // com Voltar (+ Editar quando `isDetailRoute && can('teams_edit')`).
  const isReadOnly = isEditing && (isDetailRoute || !can('teams_edit'));
  const canSave = isEditing ? can('teams_edit') : can('teams_create');

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors, dirtyFields, isDirty },
  } = useForm<TeamFormValues>({
    mode: 'onChange',
    resolver: teamSchemaResolver(languageGB),
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      description: '',
      employee_uuid: null,
      is_enabled: true,
      // Create inicia com EXATAMENTE 1 linha vazia (paridade legada mantida,
      // contrato de tela §5.4).
      members: [{ provider_uuid: null, type: null, is_enabled: true }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'members' });

  // Lei 2 (`get_pwa_form_query_pattern`) — função NOMEADA com guarda de
  // `dirtyFields`; NUNCA `reset()` solto em `useEffect` (apagaria o que o
  // usuário digitou num refetch).
  function fillTeamForm(data: TeamDetail, resetForce?: boolean) {
    const hasNoFormChanges = Object.keys(dirtyFields).length === 0;
    if (hasNoFormChanges || resetForce) {
      reset({
        name: data.name,
        description: data.description ?? '',
        employee_uuid: data.supervisor
          ? {
              label: data.supervisor.nif
                ? `${data.supervisor.name} - ${data.supervisor.nif}`
                : data.supervisor.name,
              value: data.supervisor.uuid,
            }
          : null,
        is_enabled: data.is_enabled,
        // Hidratação (contrato de tela §5.7) — `GET /teams/{uuid}` já traz
        // `members[].provider.{uuid,name,nif}` e `type_label`; a linha é
        // montada direto do payload, sem depender dos satélites de opções.
        members: data.members.map((member) => ({
          provider_uuid: {
            label: member.provider.nif
              ? `${member.provider.name} - ${member.provider.nif}`
              : member.provider.name,
            value: member.provider.uuid,
          },
          type: { label: member.type_label, value: member.type },
          is_enabled: member.is_enabled,
        })),
      });
    }
  }

  const teamQuery = useTeamForm({
    registrationId: isEditing ? teamUuid : undefined,
    fillForm: fillTeamForm,
  });

  const isLoading = isEditing && checkLoadingStatus([teamQuery as any]);

  // GAP-EQ-FE-04 — em read-only NÃO chamar `supervisor-options` (403); o
  // rótulo já vem hidratado por `fillTeamForm` a partir de `supervisor`.
  const supervisorOptionsQuery = useSupervisorOptions({ enabled: !isReadOnly });
  const rawSupervisorOptions = (supervisorOptionsQuery.data ?? []).map((option) => ({
    label: option.nif ? `${option.name} - ${option.nif}` : option.name,
    value: option.uuid,
  }));

  // TASK-EQ-FE-03 (mesma armadilha #6 de `TeamMemberRow.tsx`) — o `Select`
  // resolve o rótulo exibido pesquisando o valor selecionado dentro de
  // `options`; em read-only `rawSupervisorOptions` fica sempre vazio (a
  // query é `enabled: !isReadOnly`), então o valor hidratado por
  // `fillTeamForm` precisa ser semeado aqui, senão o campo apareceria em
  // branco mesmo com `field.value` corretamente preenchido. Também cobre o
  // caso (fora de read-only) de um encarregado inativo que não voltaria na
  // lista de opções ativas.
  const currentSupervisor = watch('employee_uuid');
  const supervisorOptions =
    currentSupervisor &&
    !rawSupervisorOptions.some((option) => option.value === currentSupervisor.value)
      ? [currentSupervisor, ...rawSupervisorOptions]
      : rawSupervisorOptions;

  // ---- Saída com alterações não salvas (contrato de tela §5.7) ------------
  const exitGuard = useDisclosure();

  function guardedBack() {
    if (isDirty) {
      exitGuard.onOpen();
    } else {
      navigate(-1);
    }
  }

  function confirmExit() {
    exitGuard.onClose();
    navigate(-1);
  }

  // ---- "Adicionar" bloqueado com linha incompleta (armadilha #17) ---------
  // Mirror do legado: enquanto QUALQUER linha (inclusive a inicial em
  // branco) não tiver Tipo E Integrante preenchidos, "Adicionar" fica
  // bloqueado — impede empilhar linhas vazias. Isso NÃO afeta o submit: uma
  // equipe sem nenhum integrante preenchido continua salvável (`GAP-EQ-FE-03`
  // — `tryPersistTeam` filtra as linhas em branco do payload).
  const membersWatch = watch('members');
  const hasIncompleteRow = membersWatch.some((row) => !row.provider_uuid || !row.type);

  function handleAddMember() {
    if (hasIncompleteRow) return;
    append({ provider_uuid: null, type: null, is_enabled: true });
  }

  // GAP-EQ-FE-08 — uuids já escolhidos em QUALQUER linha (a própria
  // `TeamMemberRow` reinclui o valor da própria linha ao filtrar).
  const usedProviderUuids = membersWatch.map((row) => row.provider_uuid?.value);

  const [businessError, setBusinessError] = useState<string | undefined>(undefined);

  const teamMutation = useRequest({
    asyncFunction: tryPersistTeam,
    entityName: text.singularLabel,
    queryKey: queryKey.workTeams.workTeamsList,
    queryKey2: queryKey.workTeams.workTeam,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  async function tryPersistTeam(data: TeamFormValues) {
    setBusinessError(undefined);

    // Linhas totalmente vazias (Tipo E Integrante nulos) são descartadas —
    // linhas parcialmente preenchidas já são barradas pelo schema Yup antes
    // de chegar aqui (`member-row-complete`).
    const filledMembers = data.members.filter((row) => row.provider_uuid && row.type);

    const payload: CreateTeamRequest = {
      name: data.name,
      description: data.description || undefined,
      employee_uuid: data.employee_uuid!.value,
      is_enabled: !!data.is_enabled,
      // Armadilha #1 (`GAP-EQ-FE-03`) — `members` OMITIDO (chave ausente)
      // quando não há nenhuma linha preenchida, NUNCA `[]`.
      ...(filledMembers.length > 0
        ? {
            members: filledMembers.map((row) => ({
              provider_uuid: row.provider_uuid!.value,
              type: row.type!.value,
              is_enabled: !!row.is_enabled,
            })),
          }
        : {}),
    };

    try {
      // Armadilha #2 — `PUT` é sempre o recurso COMPLETO (nunca um delta de
      // `dirtyFields`); `payload` acima já é sempre full-resource.
      return isEditing && teamUuid
        ? await updateTeam(teamUuid, payload)
        : await createTeam(payload);
    } catch (error) {
      // Dois tipos de 422 distintos (contrato de tela §5.6):
      if (isAxiosError(error) && error.response?.status === 422) {
        const fieldErrors = error.response.data?.errors as Record<string, string[]> | undefined;
        if (fieldErrors && Object.keys(fieldErrors).length > 0) {
          // Com `errors` → mapear por campo, inclusive `members.N.*`
          // (chaves indexadas casam 1:1 com o `useFieldArray` `members`).
          Object.entries(fieldErrors).forEach(([field, fieldMessages]) => {
            if (fieldMessages?.[0]) {
              setError(field as any, { type: 'server', message: fieldMessages[0] });
            }
          });
        } else {
          // Sem `errors` (duplicidade/coerência de tipo) → mensagem de
          // negócio no TOPO do formulário — nunca a genérica.
          const serverMessage = (error.response.data as any)?.message;
          setBusinessError(
            typeof serverMessage === 'string'
              ? serverMessage
              : (extractApiErrorMessage(error) ?? formText.businessErrorFallback)
          );
        }
      }
      // `throw` preserva o toast genérico que `useRequest` já mostra.
      throw error;
    }
  }

  async function onSubmit(data: TeamFormValues) {
    await teamMutation.mutateAsync(data);
  }

  const isSubmitting = teamMutation.isPending;
  const isDisabledField = !canSave || isReadOnly || isLoading;

  return (
    <FormContainer
      title={
        isReadOnly ? formText.title.view : isEditing ? formText.title.edit : formText.title.create
      }
      footer={
        <>
          {/* TASK-EQ-FE-03 — em read-only o footer só tem "Voltar" (nenhum
              botão de salvar é montado abaixo); nos demais modos permanece
              "Cancelar", ao lado do botão de salvar. */}
          <Button
            title={
              isReadOnly ? formText.backButton : languageGB.defaltStrings?.cancel || 'Cancelar'
            }
            variant="secondary"
            type="button"
            onClick={guardedBack}
          />
          {/* GAP-EQ-FE-11 / D2 — na rota `/detalhe` (read-only FORÇADO), quem
              tem `teams_edit` ganha um atalho para o formulário editável,
              sem precisar voltar à listagem. `replace: true` mantém o
              histórico `lista → edição`, sem o detalhe no meio. Reusa a
              mesma chave de i18n do menu de ações — nenhuma string nova. */}
          {isDetailRoute && can('teams_edit') && (
            <Button
              title={text.list.actions.edit}
              icon={FiEdit as ElementType}
              type="button"
              onClick={() => navigate(`/administrativo/equipes/${teamUuid}`, { replace: true })}
            />
          )}
          {canSave && !isReadOnly && (
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
        {businessError && (
          <Box mb={4} p={3} borderRadius="md" bg="feedBack.error">
            <Text fontSize="sm" color="feedBack.errorMain">
              {businessError}
            </Text>
          </Box>
        )}

        <SimpleGrid columns={columnsForm.default} gap={6}>
          <Input
            label={formText.fields.name}
            placeholder={formText.placeholders.name}
            {...register('name')}
            error={errors.name?.message}
            isRequired
            maxLength={30}
            loading={isLoading}
            disabled={isDisabledField}
          />

          <Input
            label={formText.fields.description}
            placeholder={formText.placeholders.description}
            {...register('description')}
            error={errors.description?.message}
            maxLength={50}
            loading={isLoading}
            disabled={isDisabledField}
          />

          <Controller
            name="employee_uuid"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <Select
                name={field.name}
                label={formText.fields.employeeUuid}
                // TASK-EQ-FE-03 (armadilha #3) — `supervisor` pode vir
                // `null` no payload hidratado (equipe legada sem
                // encarregado válido). Em read-only, o placeholder vira o
                // traço padrão do módulo (`list.table.supervisorEmpty`,
                // `"—"`) em vez do texto de ação "Selecione o encarregado",
                // que não faz sentido numa tela sem edição. Nunca
                // `undefined`.
                placeholder={
                  isReadOnly ? text.list.table.supervisorEmpty : formText.placeholders.employeeUuid
                }
                options={supervisorOptions}
                // Armadilha #14 — `?? null`, NUNCA `?? undefined` (senão o
                // Select vira não-controlado e o "limpar" para de funcionar).
                value={field.value ?? null}
                onChange={(option) => field.onChange(option ?? null)}
                error={error?.message}
                isRequired
                isDisabled={isDisabledField}
                loading={!isReadOnly && supervisorOptionsQuery.isLoading}
              />
            )}
          />

          <Controller
            name="is_enabled"
            control={control}
            render={({ field }) => (
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={1}>
                  {formText.fields.isEnabled}
                </Text>
                {/* @ts-ignore - Chakra UI v3 Switch API */}
                <Switch
                  checked={!!field.value}
                  onCheckedChange={(d: any) => field.onChange(d.checked)}
                  colorPalette="green"
                  disabled={isDisabledField}
                  aria-label={formText.fields.isEnabled}
                />
              </Box>
            )}
          />
        </SimpleGrid>

        <Box mt={8}>
          <Flex justify="space-between" align="center" mb={3} wrap="wrap" gap={2}>
            <Text fontWeight="semibold">{formText.members.sectionTitle}</Text>
            {!isReadOnly && (
              <Button
                title={formText.members.addButton}
                icon={FiPlus as ElementType}
                variant="outline"
                size="sm"
                type="button"
                onClick={handleAddMember}
                disabled={hasIncompleteRow || isSubmitting}
              />
            )}
          </Flex>

          {!isReadOnly && hasIncompleteRow && (
            <Text fontSize="xs" color="fg.error" mb={3}>
              {formText.members.incompleteRowWarning}
            </Text>
          )}

          {fields.length === 0 ? (
            <Text fontSize="sm" color="fg.muted">
              {formText.members.emptyState}
            </Text>
          ) : (
            <VStack align="stretch" gap={3}>
              {fields.map((field, index) => (
                <TeamMemberRow
                  key={field.id}
                  index={index}
                  control={control}
                  setValue={setValue}
                  watch={watch}
                  errors={errors}
                  usedProviderUuids={usedProviderUuids}
                  isReadOnly={isReadOnly}
                  isDisabled={!canSave || isSubmitting || isLoading}
                  onRemove={() => remove(index)}
                  languageGB={languageGB}
                />
              ))}
            </VStack>
          )}
        </Box>
      </Form>

      <DeleteConfirmDialog
        isOpen={exitGuard.open}
        onClose={exitGuard.onClose}
        onConfirm={confirmExit}
        title={formText.unsavedChanges.title}
        description={formText.unsavedChanges.message}
        warningText=""
        confirmButtonText={formText.unsavedChanges.confirm}
        colorPalette="orange"
      />
    </FormContainer>
  );
}
