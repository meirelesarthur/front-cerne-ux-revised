// src/components/ApportionmentActivityEditor/ApportionmentActivityEditor.tsx
// -----------------------------------------------------------------------------
// Editor de RATEIO por Atividade + Centro de Custo do módulo Apportionment
// ("Rateio - Categoria Financeira", TASK-AP-FE-06). Embutido pela tela de
// formulário (TASK-AP-FE-08, `CreateOrUpdateApportionment.tsx`).
//
// Estrutura de 2 NÍVEIS (Doc Bruta §6 regra 2/3, `Apportionment-contrato.md
// ## 4.2/## 4.7`):
//   - Nível externo — lista FIXA de atividades produtivas da fazenda
//     (`eligible-activities`, populada pelo formulário PAI via `reset`/
//     `setValue`, mirror `fillForm`). NÃO recebe `fields`/`append`/`remove`
//     do pai (diferente de `MovementAllocationEditor`) — o próprio
//     componente lê `useFieldArray({ name: 'items' })` só para obter
//     `fields` (chaves estáveis de render); nunca chama `append`/`remove`
//     no nível externo (cardinalidade fixa, vinda do servidor).
//   - Nível interno — por atividade, `useFieldArray({ name:
//     'items.${index}.centers' })` DINÂMICO (add/remove livre), mirror
//     `MovementAllocationEditor` (estilo visual: Box com borda, Badge de
//     total/disponível, `IconButtonTable` de remover linha).
//
// Decisão do dev (ficha, "Leitura do dev" #1): NÃO reaproveita
// `MovementAllocationEditor` (lista FLAT de 1 nível, valor monetário) —
// componente novo, mesmo ESTILO visual, estrutura de dados distinta
// (hierarquia 2 níveis, valor em hectares/%, não em R$).
//
// `listEligibleCostCenters` (TASK-AP-FE-05) é NÃO-PAGINADO (devolve a
// Collection inteira, sem `page`/`per_page`) — mesmo achado já resolvido em
// `IssueDfeSyncTimes` (DA-DFE-06): endpoint `eligible-*` não-paginado usa
// `SelectCombobox` (busca CLIENT-SIDE sobre 1 fetch já carregado), NÃO
// `SelectAsyncPaginate` (que espera `service: (pageParams) =>
// Promise<ResponsePagination<T>>` — assinatura que `listEligibleCostCenters`
// não tem). A ficha desta Tarefa cita `SelectAsyncPaginate` textualmente,
// mas a fundação real (TASK-AP-FE-05, já construída e validada) devolve uma
// lista não-paginada — sigo o PRECEDENTE DE CÓDIGO já provado no mesmo
// padrão de endpoint (regra de precedência "tool/protocolo/código: declarar
// divergência", já usada pela própria ficha TASK-AP-FE-08 para a escolha de
// `useCustomFormQueryByGuid`). Divergência declarada, não bloqueante — 1
// fetch compartilhado entre todos os cards de atividade (mesma query key,
// cache do TanStack Query dedupe automaticamente).
//
// `getAvailableHaForActivity` — 1 chamada por atividade ao MONTAR o
// componente (mirror do `document.ready` do legado que dispara para TODAS
// as linhas no modo edição, Doc Bruta §9 #7), cache via TanStack Query com
// `queryKey.baseRegistrations.apportionmentAvailableHa` + `activityUuid`
// como parte da key (ficha, "Decisão esperada do dev" #2).
//
// [RISCO herdado da ficha] Sem a API real, a integração de
// `getAvailableHaForActivity`/`listEligibleCostCenters` não pode ser provada
// em runtime agora — os hooks já apontam para os serviços reais da
// fundação (TASK-AP-FE-05), SEM MOCK; a validação do valor retornado fica
// para a Tarefa pós-API.
// -----------------------------------------------------------------------------

import { ElementType, Fragment, useRef, useState } from 'react';

import { Alert, Badge, Box, Flex, Icon, Skeleton, Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import {
  Control,
  Controller,
  FieldErrors,
  useFieldArray,
  UseFormSetValue,
  useWatch,
} from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { NumberInput } from '@/components/Form/NumberInput';
import { PercentInput } from '@/components/Form/PercentInput';
import { SelectCombobox } from '@/components/Form/SelectCombobox';
import { IconButtonTable } from '@/components/IconButtonTable';

import { queryKey } from '@/constants/query-key';

import {
  getAvailableHaForActivity,
  listEligibleCostCenters,
} from '@/services/v2/BaseRegistrations/apportionment-service';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { ApportionmentItemForm } from '@/@types/v2/BaseRegistrations/apportionment';

// Shape concreto mínimo que este componente precisa do formulário pai —
// mirror `AllocationsFieldValues` de `MovementAllocationEditor`.
export interface ApportionmentActivitiesFieldValues {
  items: ApportionmentItemForm[];
}

export interface ApportionmentActivityEditorProps<
  TFieldValues extends ApportionmentActivitiesFieldValues = ApportionmentActivitiesFieldValues,
> {
  /** `control` do `useForm` do formulário PAI (`CreateOrUpdateApportionment.tsx`). */
  control: Control<TFieldValues>;
  /** `formState.errors` do formulário PAI. */
  errors: FieldErrors<TFieldValues>;
  languageGB: LanguageDate;
  disabled?: boolean;
  /** uuid do Apportionment em edição — necessário para excluir da conta de "disponível" (`Apportionment-contrato.md ## 3`, `?exclude_apportionment_id=`). */
  excludeApportionmentUuid?: string;
  /**
   * Modo de edição do formulário PAI (TASK-AP-FE-12) — governa o readonly
   * condicional de `ha`/`ha_percentage` do Centro de Custo, mirror EXATO do
   * legado (`_card-activity.blade.php`): em EDIT as linhas já cadastradas
   * nascem bloqueadas até o usuário re-tocar o select do Centro de Custo
   * daquela linha; em CREATE nascem sempre editáveis.
   */
  isEditing: boolean;
  /**
   * `setValue` do `useForm` do formulário PAI (TASK-AP-FE-12) — usado só
   * para limpar `ha`/`ha_percentage` da linha ao DESMARCAR o Centro de
   * Custo (mirror `_card-activity.blade.php:231-234`). Nunca escreve um
   * valor automático em `ha` a partir da SELEÇÃO do centro.
   */
  setValue: UseFormSetValue<TFieldValues>;
}

function formatHa(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface ApportionmentActivityCardProps {
  index: number;
  control: Control<ApportionmentActivitiesFieldValues>;
  errors: FieldErrors<ApportionmentActivitiesFieldValues>;
  languageGB: LanguageDate;
  disabled: boolean;
  excludeApportionmentUuid?: string;
  costCenterOptions: Option<string>[];
  costCentersLoading: boolean;
  isEditing: boolean;
  setValue: UseFormSetValue<ApportionmentActivitiesFieldValues>;
}

// Card de UMA atividade (nível externo, cardinalidade fixa) — encapsula o
// `useFieldArray` DINÂMICO do nível interno (centros de custo desta
// atividade). Componente NÃO-exportado (uso exclusivo deste arquivo, mirror
// `ApportionmentsSection` de `CreateSaldoInicial.tsx`, com o cuidado de NOME
// já registrado na "Leitura do dev" da ficha — este arquivo em si também não
// se chama `ApportionmentsSection`).
function ApportionmentActivityCard({
  index,
  control,
  errors,
  languageGB,
  disabled,
  excludeApportionmentUuid,
  costCenterOptions,
  costCentersLoading,
  isEditing,
  setValue,
}: ApportionmentActivityCardProps) {
  const text = languageGB.baseRegistrations.apportionment.form;

  const activity = useWatch({ control, name: `items.${index}` });

  const { fields, append, remove } = useFieldArray({
    control,
    name: `items.${index}.centers`,
  });

  const watchedCenters = useWatch({ control, name: `items.${index}.centers` }) ?? [];

  const activityUuid = activity?.activity_uuid;

  const availableHaQuery = useQuery({
    queryKey: [
      queryKey.baseRegistrations.apportionmentAvailableHa,
      activityUuid,
      excludeApportionmentUuid,
    ],
    queryFn: async () => {
      const response = await getAvailableHaForActivity(activityUuid!, {
        exclude_apportionment_id: excludeApportionmentUuid,
      });
      return response.data;
    },
    enabled: !!activityUuid,
    staleTime: 30 * 1000,
  });

  const centersError = (errors as any)?.items?.[index]?.centers?.message as string | undefined;

  // TASK-AP-FE-12 — snapshot das linhas de Centro de Custo JÁ EXISTENTES ao
  // montar o card (mirror `isset($apportionmentItem)` do legado,
  // `_card-activity.blade.php:32-71`). Linhas de FORA deste snapshot
  // (adicionadas depois via "Adicionar Centro de Custo") nascem SEMPRE
  // editáveis, mesmo em modo EDIT — mirror do próprio trecho de CREATE do
  // mesmo Blade (linhas 104-136): uma linha nova nunca nasce `readonly`.
  const preexistingRowIdsRef = useRef<Set<string> | null>(null);
  if (preexistingRowIdsRef.current === null) {
    preexistingRowIdsRef.current = new Set(fields.map((rowField) => rowField.id));
  }

  // Linhas que o usuário já RE-TOCOU o select do Centro de Custo nesta
  // sessão (mirror handler `change .center_id`, linhas 195-241 do Blade) —
  // só relevante em modo EDIT; em CREATE o readonly nunca se aplica (ver
  // `isRowReadOnly`).
  const [unlockedRowIds, setUnlockedRowIds] = useState<Set<string>>(new Set());

  function isRowReadOnly(fieldId: string): boolean {
    if (!isEditing) return false;
    if (!preexistingRowIdsRef.current!.has(fieldId)) return false;
    return !unlockedRowIds.has(fieldId);
  }

  // Handler do select de Centro de Custo — desbloqueia a linha ao
  // selecionar (valor truthy) e relock + limpa `ha`/`ha_percentage` ao
  // desmarcar (valor vazio), mirror EXATO do handler `change .center_id`
  // (linhas 195-241/231-234 do Blade). NUNCA escreve valor automático em
  // `ha` a partir da SELEÇÃO — só desbloqueia (Item 3 da ficha).
  function handleCenterSelect(fieldId: string, centerIndex: number, option: Option<string> | null) {
    if (option) {
      setUnlockedRowIds((prev) => {
        if (prev.has(fieldId)) return prev;
        return new Set(prev).add(fieldId);
      });
      return;
    }

    setUnlockedRowIds((prev) => {
      if (!prev.has(fieldId)) return prev;
      const next = new Set(prev);
      next.delete(fieldId);
      return next;
    });
    setValue(`items.${index}.centers.${centerIndex}.ha`, null);
    setValue(`items.${index}.centers.${centerIndex}.ha_percentage`, null);
  }

  // "Ha Disponível" DAQUELA LINHA (Item 3 da ficha) — deriva do
  // `available_ha` já buscado 1x por CARD (`availableHaQuery`,
  // TASK-AP-FE-06) descontando o `ha` já digitado nas OUTRAS linhas do
  // MESMO card. 100% client-side (`useWatch` + reduce local), SEM nova
  // chamada de rede — mirror do padrão já existente no mesmo arquivo para
  // `ha_percentage` (`remainingPercentageExcluding`).
  function availableHaForRowExcluding(rowIndex: number): number {
    const usedByOthers = watchedCenters.reduce((sum, row, i) => {
      if (i === rowIndex) return sum;
      return sum + (Number(row?.ha) || 0);
    }, 0);
    return Math.max(0, (availableHaQuery.data?.available_ha ?? 0) - usedByOthers);
  }

  function handleAddCenter() {
    append({ center_uuid: null, ha: null, ha_percentage: null });
  }

  // Percentual restante entre as linhas da mesma atividade (mirror
  // `getMaxPercentage()` do legado, Doc Bruta §9 #9) — soma dos `ha_percentage`
  // das OUTRAS linhas, exibição cosmética (o bloqueio real, se houver, vem do
  // backend — `BusinessRuleException` 422, `Apportionment-contrato.md ## 4.3`).
  function remainingPercentageExcluding(rowIndex: number): number {
    const usedByOthers = watchedCenters.reduce((sum, row, i) => {
      if (i === rowIndex) return sum;
      return sum + (Number(row?.ha_percentage) || 0);
    }, 0);
    return Math.max(0, 100 - usedByOthers);
  }

  return (
    <Box bg="bg.muted" border="1px solid" borderColor="border.subtle" borderRadius="lg" p={4}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={3} mb={3}>
        <Box>
          <Text fontSize="sm" fontWeight="semibold">
            {text.fields.activity}: {activity?.activity_description}
          </Text>
        </Box>
        <Flex align="center" gap={2} wrap="wrap">
          <Text fontSize="xs" color="fg.muted">
            {text.fields.ha}:
          </Text>
          <Badge colorPalette="gray" variant="outline">
            {formatHa(Number(activity?.ha) || 0)}
          </Badge>
          <Text fontSize="xs" color="fg.muted">
            {text.fields.percentage}:
          </Text>
          <Badge colorPalette="gray" variant="outline">
            {formatHa(Number(activity?.percentage) || 0)}%
          </Badge>
          <Text fontSize="xs" color="fg.muted">
            {text.fields.unsetedHa}:
          </Text>
          {availableHaQuery.isLoading ? (
            <Skeleton height="20px" width="60px" borderRadius="md" />
          ) : (
            <Badge colorPalette="blue" variant="subtle">
              {formatHa(availableHaQuery.data?.available_ha ?? 0)}
            </Badge>
          )}
        </Flex>
      </Flex>

      <Text fontSize="xs" fontWeight="medium" color="fg.muted" mb={2}>
        {text.fields.costCentersSectionTitle}
      </Text>

      {centersError && (
        <Alert.Root status="error" borderRadius="md" mb={3}>
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{centersError}</Alert.Title>
          </Alert.Content>
        </Alert.Root>
      )}

      {fields.length === 0 ? (
        <Box py={1} mb={3}>
          <Text fontSize="sm" color="fg.muted">
            —
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={3} mb={3}>
          {fields.map((field, centerIndex) => (
            <Flex key={field.id} gap={3} align="flex-start" wrap="wrap">
              <Box flex="1" minW="220px">
                <Controller
                  name={`items.${index}.centers.${centerIndex}.center_uuid`}
                  control={control}
                  render={({ field: rowField, fieldState }) => (
                    <SelectCombobox
                      name={rowField.name}
                      label={text.fields.costCenter}
                      placeholder={text.placeholders.costCenter}
                      options={costCenterOptions}
                      loading={costCentersLoading}
                      value={rowField.value ?? null}
                      onChange={(option) => {
                        rowField.onChange(option ?? null);
                        handleCenterSelect(field.id, centerIndex, option ?? null);
                      }}
                      error={fieldState.error?.message}
                      isRequired
                      disabled={disabled}
                    />
                  )}
                />
              </Box>

              <Box w={{ base: 'full', sm: '160px' }}>
                <Controller
                  name={`items.${index}.centers.${centerIndex}.ha`}
                  control={control}
                  render={({ field: rowField, fieldState }) => (
                    <NumberInput
                      name={rowField.name}
                      label={text.fields.costCenterHa}
                      allowDot
                      decimalPlaces={2}
                      max={availableHaForRowExcluding(centerIndex)}
                      value={rowField.value ?? null}
                      onValueChange={(value) => rowField.onChange(value)}
                      error={fieldState.error?.message}
                      isRequired
                      readOnly={isRowReadOnly(field.id)}
                      disabled={disabled}
                    />
                  )}
                />
                <Text fontSize="xs" color="fg.muted" mt={1}>
                  {text.fields.unsetedHa}: {formatHa(availableHaForRowExcluding(centerIndex))}
                </Text>
              </Box>

              <Box w={{ base: 'full', sm: '140px' }}>
                <Controller
                  name={`items.${index}.centers.${centerIndex}.ha_percentage`}
                  control={control}
                  render={({ field: rowField, fieldState }) => (
                    <PercentInput
                      name={rowField.name}
                      label={text.fields.costCenterHaPercentage}
                      maxValue={remainingPercentageExcluding(centerIndex)}
                      value={rowField.value ?? null}
                      onValueChange={(value) => rowField.onChange(value)}
                      error={fieldState.error?.message}
                      readOnly={isRowReadOnly(field.id)}
                      disabled={disabled}
                    />
                  )}
                />
              </Box>

              <Flex direction="column" gap="1.5">
                <Flex alignItems="center" fontSize="14px" visibility="hidden">
                  {text.removeCenterRowLabel}
                </Flex>
                <IconButtonTable
                  aria-label={text.removeCenterRowLabel}
                  mensegerTooltip={text.removeCenterRowLabel}
                  size="sm"
                  color="red.500"
                  variant="ghost"
                  disabled={disabled}
                  onClick={() => remove(centerIndex)}
                >
                  <Icon as={FiTrash2} />
                </IconButtonTable>
              </Flex>
            </Flex>
          ))}
        </Flex>
      )}

      <Button
        title={text.addCenterRowLabel}
        icon={FiPlus as ElementType}
        variant="outline"
        size="sm"
        onClick={handleAddCenter}
        disabled={disabled}
      />
    </Box>
  );
}

export function ApportionmentActivityEditor<
  TFieldValues extends ApportionmentActivitiesFieldValues = ApportionmentActivitiesFieldValues,
>({
  control,
  errors,
  languageGB,
  disabled = false,
  excludeApportionmentUuid,
  isEditing,
  setValue,
}: ApportionmentActivityEditorProps<TFieldValues>) {
  const text = languageGB.baseRegistrations.apportionment.form;

  // Cast local (não vaza na API pública) — mesma técnica de
  // `MovementAllocationEditor.genericControl`.
  const genericControl = control as unknown as Control<ApportionmentActivitiesFieldValues>;
  const genericErrors = errors as unknown as FieldErrors<ApportionmentActivitiesFieldValues>;
  const genericSetValue =
    setValue as unknown as UseFormSetValue<ApportionmentActivitiesFieldValues>;

  // Só para obter `fields` (chaves estáveis de render) — NUNCA chama
  // `append`/`remove` no nível externo (lista fixa, vinda do servidor).
  const { fields } = useFieldArray({ control: genericControl, name: 'items' });

  // `listEligibleCostCenters` — leitura NÃO-paginada, 1 fetch compartilhado
  // por TODOS os cards de atividade (ver cabeçalho do arquivo).
  const eligibleCostCentersQuery = useQuery({
    queryKey: [queryKey.baseRegistrations.apportionmentEligibleCostCenters],
    queryFn: async () => {
      const response = await listEligibleCostCenters();
      return response.data;
    },
    staleTime: 30 * 1000,
  });
  const costCenterOptions: Option<string>[] = (eligibleCostCentersQuery.data ?? []).map(
    (center) => ({
      label: `${center.code} — ${center.description}`,
      value: center.uuid,
    })
  );

  // Empty — nenhuma atividade elegível (mirror Doc Bruta §6 regra 3,
  // bloqueio de `create` sem área cadastrada). Reaproveita a MESMA mensagem
  // i18n já usada como erro do Yup (`items.min(1)`, TASK-AP-FE-04) — nenhuma
  // chave nova cunhada fora da fundação.
  if (fields.length === 0) {
    return (
      <Alert.Root status="warning" borderRadius="md">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>{text.validation.itemsMinLength}</Alert.Title>
        </Alert.Content>
      </Alert.Root>
    );
  }

  return (
    <Flex direction="column" gap={4}>
      {fields.map((field, index) => (
        <Fragment key={field.id}>
          <ApportionmentActivityCard
            index={index}
            control={genericControl}
            errors={genericErrors}
            languageGB={languageGB}
            disabled={disabled}
            excludeApportionmentUuid={excludeApportionmentUuid}
            costCenterOptions={costCenterOptions}
            costCentersLoading={eligibleCostCentersQuery.isLoading}
            isEditing={isEditing}
            setValue={genericSetValue}
          />
        </Fragment>
      ))}
    </Flex>
  );
}

export default ApportionmentActivityEditor;
