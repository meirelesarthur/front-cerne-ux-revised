// src/pages/Administrativo/Equipes/TeamMemberRow.tsx
// -----------------------------------------------------------------------------
// Uma linha do repeater de integrantes de Equipe — cascata Tipo → Integrante
// (contrato de tela §5.4, TASK-EQ-FE-02). Consumida por
// `CreateOrUpdateEquipe.tsx` (dono do `useFieldArray`, mirror estrutural de
// `RequestItemRow.tsx`/`MatrizVinculosFuncionario.tsx` — SEÇÃO COMPLETA no
// pai, componente de LINHA aqui).
//
// Cascata (dimensão `cascatas` do contrato legado):
//   1. Trocar o Tipo LIMPA o Integrante da linha (`setValue(...provider_uuid,
//      null)`) — senão o servidor devolve 422 de coerência
//      `type` × `providers.type` (`ResolveTeamMembersAction`).
//   2. Opções por `GET /teams/member-options?type=` via `useMemberOptions`
//      (`useEquipes.tsx`) — cache POR TIPO, compartilhado entre linhas (uma
//      requisição por tipo por sessão, nunca uma por linha).
//   3. Enquanto carrega: Select do Integrante em loading + desabilitado.
//   4. Erro: mensagem + retry (`refetch`) — o legado falhava em silêncio
//      (CLM-021/DIV-007), correção direta.
//   5. Rótulo da opção: `"{name} - {nif}"`, com `- {nif}` omitido quando nif
//      vazio (mesmo formato do Encarregado, contrato §5.3/§5.4).
//
// Prevenção de duplicidade (`GAP-EQ-FE-08`): `usedProviderUuids` (calculado
// pelo pai a partir de TODAS as linhas) é filtrado das opções desta linha,
// exceto o próprio valor já selecionado aqui (senão a linha perderia a opção
// corrente ao reabrir o Select).
//
// Semeadura da opção corrente na edição (armadilha #6): `GET /teams/{uuid}`
// já hidrata `members[].provider.{uuid,name,nif}` — se o valor atual do RHF
// ainda não está na lista carregada da cascata (que pode chegar depois), ele
// é injetado manualmente nas opções para o Select nunca aparecer em branco.
// -----------------------------------------------------------------------------

import { Box, Flex, Icon, Text } from '@chakra-ui/react';
import { Controller } from 'react-hook-form';
import { FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { Select } from '@/components/Form/Select';
import { IconButtonTable } from '@/components/IconButtonTable';
import { Switch } from '@/components/ui/switch';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { TeamForm } from '@/@types/v2/Teams';

import { useMemberOptions } from './useEquipes';

import type { Control, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';

export interface TeamMemberRowProps {
  index: number;
  control: Control<TeamForm>;
  setValue: UseFormSetValue<TeamForm>;
  watch: UseFormWatch<TeamForm>;
  errors: FieldErrors<TeamForm>;
  /** uuids de `provider` já escolhidos em QUALQUER linha (inclusive esta). */
  usedProviderUuids: Array<string | undefined>;
  isReadOnly: boolean;
  isDisabled: boolean;
  onRemove: () => void;
  languageGB: LanguageDate;
}

export function TeamMemberRow({
  index,
  control,
  setValue,
  watch,
  errors,
  usedProviderUuids,
  isReadOnly,
  isDisabled,
  onRemove,
  languageGB,
}: TeamMemberRowProps) {
  const text = languageGB.workTeams.workTeam.form.members;

  const typeOptions: Option<2 | 3>[] = [
    { value: 2, label: text.typeOptions.employee },
    { value: 3, label: text.typeOptions.thirdParty },
  ];

  const selectedType = watch(`members.${index}.type`);
  const type = (selectedType?.value ?? null) as 2 | 3 | null;
  const currentProviderUuid = watch(`members.${index}.provider_uuid`);

  // GAP-EQ-FE-04 — em modo visualização o endpoint é gateado por
  // `teams_create|teams_edit`; nunca chamar (devolveria 403).
  const memberOptionsQuery = useMemberOptions(type, !isReadOnly);

  const rawOptions: Option<string>[] = (memberOptionsQuery.data ?? []).map((option) => ({
    label: option.nif ? `${option.name} - ${option.nif}` : option.name,
    value: option.uuid,
  }));

  // GAP-EQ-FE-08 — remove das opções desta linha os `provider_uuid` já
  // escolhidos em OUTRAS linhas (mantém a opção já escolhida NESTA linha).
  let memberOptions = rawOptions.filter(
    (option) =>
      option.value === currentProviderUuid?.value || !usedProviderUuids.includes(option.value)
  );

  // Armadilha #6 — semeia a opção corrente (hidratada por `GET
  // /teams/{uuid}`) se ela ainda não está na lista carregada da cascata.
  if (
    currentProviderUuid &&
    !memberOptions.some((option) => option.value === currentProviderUuid.value)
  ) {
    memberOptions = [currentProviderUuid, ...memberOptions];
  }

  // Erro de nível de LINHA (`member-row-complete` do schema Yup — incompletude
  // PARCIAL, um dos dois campos preenchido e o outro não).
  const rowError = (errors.members as any)?.[index]?.message as string | undefined;
  // Erros de CAMPO — 422 do servidor mapeado por `setError('members.N.type'
  // | 'members.N.provider_uuid', ...)` (chaves indexadas, armadilha #9) casam
  // 1:1 com estes paths e têm PRECEDÊNCIA sobre o `rowError` agregado.
  const typeFieldError = (errors.members as any)?.[index]?.type?.message as string | undefined;
  const providerFieldError = (errors.members as any)?.[index]?.provider_uuid?.message as
    string | undefined;

  return (
    <Box borderWidth="1px" borderColor="border.subtle" borderRadius="md" p={3}>
      <Flex gap={3} align="flex-start" wrap="wrap">
        <Box flex="1" minW="200px">
          <Controller
            name={`members.${index}.type`}
            control={control}
            render={({ field }) => (
              <Select
                name={field.name}
                label={text.table.type}
                options={typeOptions}
                value={field.value ?? null}
                onChange={(option) => {
                  field.onChange(option ?? null);
                  // Armadilha #3 — trocar o Tipo LIMPA o Integrante da linha.
                  setValue(`members.${index}.provider_uuid`, null, { shouldDirty: true });
                }}
                error={typeFieldError}
                isDisabled={isDisabled || isReadOnly}
                isRequired
                noClearable
              />
            )}
          />
        </Box>

        <Box flex="2" minW="240px">
          <Controller
            name={`members.${index}.provider_uuid`}
            control={control}
            render={({ field }) => (
              <Select
                name={field.name}
                label={text.table.member}
                placeholder={type ? text.memberPlaceholder : text.memberPlaceholderNoType}
                options={memberOptions}
                value={field.value ?? null}
                onChange={(option) => field.onChange(option ?? null)}
                error={providerFieldError}
                isDisabled={isDisabled || isReadOnly || !type}
                loading={!isReadOnly && memberOptionsQuery.isLoading}
                isRequired
              />
            )}
          />
          {!isReadOnly && memberOptionsQuery.isError && (
            <Flex align="center" gap={2} mt={1}>
              <Text fontSize="xs" color="fg.error">
                {text.optionsError}
              </Text>
              <Button
                title={text.optionsRetry}
                variant="ghost"
                size="xs"
                type="button"
                onClick={() => memberOptionsQuery.refetch()}
              />
            </Flex>
          )}
        </Box>

        <Box>
          <Text fontSize="xs" fontWeight="medium" mb={1}>
            {text.table.active}
          </Text>
          <Controller
            name={`members.${index}.is_enabled`}
            control={control}
            render={({ field }) => (
              // @ts-ignore - Chakra UI v3 Switch API
              <Switch
                checked={!!field.value}
                onCheckedChange={(d: any) => field.onChange(d.checked)}
                colorPalette="green"
                disabled={isDisabled || isReadOnly}
                aria-label={text.table.active}
              />
            )}
          />
        </Box>

        {!isReadOnly && (
          <IconButtonTable
            aria-label={text.removeRowButton}
            mensegerTooltip={text.removeRowButton}
            size="sm"
            color="red.500"
            variant="ghost"
            disabled={isDisabled}
            onClick={onRemove}
          >
            <Icon as={FiTrash2} />
          </IconButtonTable>
        )}
      </Flex>

      {/* `rowError` (incompletude parcial do schema Yup) só aparece quando
          NENHUM erro de campo já está sendo exibido nos Selects acima —
          evita duplicar a mesma reclamação em dois lugares da linha. */}
      {rowError && !typeFieldError && !providerFieldError && (
        <Text fontSize="xs" color="fg.error" mt={2}>
          {rowError}
        </Text>
      )}
    </Box>
  );
}
