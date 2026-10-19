// src/pages/Operacional/Pesagem/WeighingAnimalRow.tsx
// -----------------------------------------------------------------------------
// Linha do repeater de animais do formulário de Pesagem — `WeighingAnimalRow`
// (F-071, TASK-PES-FE-05, contrato-tela-lane-c-pesagem-frontend.md §6.5).
// `Animal` (`SelectAsyncPaginate`, opções filtradas pelas já escolhidas nas
// demais linhas, mirror `TeamMemberRow.tsx` — `usedAnimalUuids` calculado
// pelo PAI a partir de TODAS as linhas, filtrado aqui exceto o valor já
// selecionado NESTA linha) → dispara `check-date` (`EP-PES-09`)
// ao selecionar (`valid=false`: aviso com o `message` da API E o animal da linha
// é LIMPO, como no legado `_forms.blade.php:938-961`; no cabeçalho, sem animal,
// o aviso é só informativo) → preenche `Último Peso`/`Data Últ. Pesagem` a
// partir da opção → `Peso` (`NumberInput`, obrigatório, única fonte editável
// de peso) → `Ganho`/`GMD` (`Text`, calculado client-side, mirror EXATO
// `FeedlotWeighingRow.calcRowMetrics`) → `Ultrassom` (`Switch`,
// `has_ultrasound`).
//
// `Último Peso`/`Data Últ. Pesagem` (fidelidade ao legado
// `weighings/_card-item.blade.php:22,25` + `_forms.blade.php:963-971`):
// SOMENTE LEITURA (`InputReadOnly`), nunca digitados. O select de animal
// pede `GET /animals/options?with_last_weighing=true` e a opção traz
// `last_weight`/`last_weight_date` (última pesagem por maior data; fallback
// peso/data de entrada do animal). Regras:
//   - ao selecionar/TROCAR o animal os 2 campos são substituídos pela opção;
//   - ao limpar o animal são esvaziados;
//   - animal S/ID (legado `_forms.blade.php:966,993`; a API devolve `null`
//     nos dois campos): ficam VAZIOS, Ganho/GMD também, e a obrigatoriedade
//     não se aplica (ver `weighing-schema.ts` e `weighing-form-mapper.ts`);
//   - EDIÇÃO: o valor GRAVADO hidratado pelo mapper é mantido; só é
//     recalculado se o usuário trocar o animal da linha (handler de change).
//
// `weight`/`last_weight`/`last_weight_date` são SEMPRE enviados pelo cliente
// — o servidor NUNCA recalcula (CTR-PES §2, Regra 1 da Tarefa,
// `WeighingAnimalRow` NÃO deve mirror `FindOrCreateWeighingAction`/
// `StoreFeedlotCorralWeighingAction`).
//
// `gain`/`gmd` são SÓ exibição (Regra 3 da Tarefa) — calculados a cada
// render via `useWatch`, NUNCA persistidos no form state (mirror EXATO
// `FeedlotWeighingRow.tsx`, sem `setValue`).
//
// CORREÇÃO DE FIDELIDADE (97-Esteiras/002 execução 002 lane C) — a omissão
// anterior de `aol`/`egs`/`marm`/`classification` (Regra 4 da Tarefa/FID-G3F
// §2.2) partia de premissa factualmente incorreta sobre o legado: leitura
// direta do worktree irmão da API (`WeighingController::store()/update()`,
// `WeighingAnimalItemData`, `WeighingRequest::guardUltrasoundFields()`)
// confirma que o legado real grava estes 4 campos em `ultrasounds` sempre
// que `has_ultrasound[idx]=1`. Campos reintroduzidos como condicionais —
// visíveis/obrigatórios só quando `has_ultrasound` da linha está marcado,
// mirror EXATO `ProcessingAnimalRow.tsx` (mesmos componentes/racional:
// `NumberInput` para AOL/EGS/MARM, `Input` com `maxLength={1}` para Classe;
// ao desligar o ultrassom, os 4 campos são limpos para evitar dado órfão no
// payload).
// -----------------------------------------------------------------------------

import { useRef } from 'react';

import { Box, Flex, Icon, Text } from '@chakra-ui/react';
import { Control, useController, UseFormSetValue, useWatch } from 'react-hook-form';
import { FiTrash2 } from 'react-icons/fi';

import { Input } from '@/components/Form/Input';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { NumberInput } from '@/components/Form/NumberInput';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { IconButtonTable } from '@/components/IconButtonTable';
import { Switch } from '@/components/ui/switch';
import { toaster } from '@/components/ui/toaster';

import formatDate from '@/utils/formatDate';

import { listAnimalOptions } from '@/services/v2/Animals/animal-service';
import { checkWeighingDate } from '@/services/v2/Weighing/weighing-service';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { PaginationQueryParams } from '@/@types/pagination';
import type { ResponsePagination } from '@/@types/response-api';
import type { AnimalOptionListItem } from '@/@types/v2/Animals';
import type { CheckWeighingDateInvalidAnimal, WeighingFormValues } from '@/@types/v2/Weighing';

// Opção do select de animal decorada pela API (`with_last_weighing=true`).
// `null` nos dois campos = animal S/ID (mesmo critério da API).
interface WeighingAnimalFieldOption extends Option<string> {
  last_weight?: number | null;
  last_weight_date?: string | null;
}

function formatNumber(value: number | null, decimals: number): string {
  if (value === null) return '—';
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// Mirror EXATO `FeedlotWeighingRow.calcRowMetrics` (`gain = weight -
// last_weight`, `gmd = gain / dias`, CV-01/CV-02, `PRESERVAR`) — só a
// MECÂNICA de cálculo, nunca a semântica de find-or-create de peso das 2
// Actions legadas de pesagem (Regra 1 da Tarefa/`CTR-PES §2`).
function calcRowMetrics(
  weight: number | null,
  lastWeight: number | null,
  lastWeightDate: string | null,
  weighingDate: string | null
): { gain: number | null; days: number | null; gmd: number | null } {
  if (weight == null || lastWeight == null) return { gain: null, days: null, gmd: null };
  const gain = weight - lastWeight;
  let days: number | null = null;
  if (lastWeightDate && weighingDate) {
    const diff = Math.round(
      (new Date(weighingDate).getTime() - new Date(lastWeightDate).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    days = diff > 0 ? diff : null;
  }
  const gmd = days !== null && days > 0 ? gain / days : null;
  return { gain, days, gmd };
}

// "remove animal escolhido das demais linhas" (mirror `TeamMemberRow`
// `GAP-EQ-FE-08`) — a exclusão é feita NO SERVIDOR (`exclude_uuids[]`), para a
// paginação (`meta.last_page`) refletir a exclusão e a rolagem infinita não
// parar com a página filtrada vazia/curta. O valor já selecionado NESTA linha
// nunca entra em `excludeUuids` (calculado pelo pai).
async function listRowAnimalOptions(
  params: PaginationQueryParams,
  batchUuid: string | null,
  categoryUuid: string | null,
  excludeUuids: string[]
): Promise<ResponsePagination<AnimalOptionListItem[]>> {
  return listAnimalOptions({
    ...params,
    batch_uuid: batchUuid ?? undefined,
    category_uuid: categoryUuid ?? undefined,
    exclude_uuids: excludeUuids,
    // Só ESTE select pede o último peso; os demais usos de `/animals/options`
    // (Mãe/Pai etc.) seguem no formato enxuto.
    with_last_weighing: true,
  });
}

export interface WeighingAnimalRowProps {
  control: Control<WeighingFormValues>;
  setValue: UseFormSetValue<WeighingFormValues>;
  index: number;
  canRemove: boolean;
  onRemove: () => void;
  /** uuids de `animal_uuid` já escolhidos em QUALQUER linha, EXCETO o valor já selecionado NESTA linha. */
  usedAnimalUuids: string[];
  batchUuid: string | null;
  categoryUuid: string | null;
  /** `date` do cabeçalho (`pes-form-main`) — usado no cálculo de `gmd` e no `check-date`. */
  weighingDate: string | null;
  /** Pesagem em edição — `check-date` exclui a própria pesagem do cálculo. */
  weighingUuid?: string;
  /** Conflito de data deste animal (`invalid_animals[]`): erro na linha, sem remover o animal. */
  dateConflict?: CheckWeighingDateInvalidAnimal;
  languageGB: LanguageDate;
  isDisabled?: boolean;
}

export function WeighingAnimalRow({
  control,
  setValue,
  index,
  canRemove,
  onRemove,
  usedAnimalUuids,
  batchUuid,
  categoryUuid,
  weighingDate,
  weighingUuid,
  dateConflict,
  languageGB,
  isDisabled,
}: WeighingAnimalRowProps) {
  const text = languageGB.weighing.weighing.form;

  // A `message` da API já vem pronta em pt-BR e inclui a data de referência.
  const dateConflictMessage = dateConflict?.message;

  const { field: animalField, fieldState: animalFieldState } = useController({
    control,
    name: `animals.${index}.animal_uuid`,
  });
  const { field: weightField, fieldState: weightFieldState } = useController({
    control,
    name: `animals.${index}.weight`,
  });
  const { field: lastWeightField, fieldState: lastWeightFieldState } = useController({
    control,
    name: `animals.${index}.last_weight`,
  });
  const { field: lastWeightDateField, fieldState: lastWeightDateFieldState } = useController({
    control,
    name: `animals.${index}.last_weight_date`,
  });
  const { field: hasUltrasoundField } = useController({
    control,
    name: `animals.${index}.has_ultrasound`,
  });
  const { field: aolField, fieldState: aolFieldState } = useController({
    control,
    name: `animals.${index}.aol`,
  });
  const { field: egsField, fieldState: egsFieldState } = useController({
    control,
    name: `animals.${index}.egs`,
  });
  const { field: marmField, fieldState: marmFieldState } = useController({
    control,
    name: `animals.${index}.marm`,
  });
  const { field: classificationField, fieldState: classificationFieldState } = useController({
    control,
    name: `animals.${index}.classification`,
  });

  // Correção de fidelidade (97-Esteiras/002 execução 002 lane C) — mirror
  // `ProcessingAnimalRow.watchedHasUltrasound`, reativo ao `Switch` abaixo.
  const watchedHasUltrasound = useWatch({ control, name: `animals.${index}.has_ultrasound` });

  const row = useWatch({ control, name: `animals.${index}` });
  const { gain, gmd } = calcRowMetrics(
    typeof row?.weight === 'number' ? row.weight : null,
    typeof row?.last_weight === 'number' ? row.last_weight : null,
    row?.last_weight_date ?? null,
    weighingDate
  );

  const animalFieldValueRef = useRef<string | null>(null);
  animalFieldValueRef.current = animalField.value?.value ?? null;

  function handleAnimalChange(option: WeighingAnimalFieldOption | null) {
    animalField.onChange(option ?? null);
    animalFieldValueRef.current = option?.value ?? null;

    // Substitui SEMPRE (inclusive por vazio): animal trocado → valores do novo
    // animal; animal limpo ou S/ID (`null` na opção) → campos esvaziados
    // (legado `clearAnimalWeightData`, `_forms.blade.php:775-779,966-968`).
    const optionLastWeight = option?.last_weight;
    lastWeightField.onChange(
      optionLastWeight === null || optionLastWeight === undefined ? '' : Number(optionLastWeight)
    );
    lastWeightDateField.onChange(option?.last_weight_date ?? null);

    // check-date (`EP-PES-09`) ao selecionar animal (legado: reprovou = aviso +
    // limpa o animal). Erro de rede/422 é silencioso (não limpa nada). A API
    // devolve `{valid, message, invalid_animals[]}`: se o animal escolhido está
    // em `invalid_animals`, mostra a `message` DELE e o limpa; `valid=false` sem
    // o animal apontado (ex.: data do lote) só avisa com a `message` do topo.
    if (weighingDate && (batchUuid || categoryUuid)) {
      checkWeighingDate({
        date: weighingDate,
        batch_uuid: batchUuid ?? undefined,
        category_uuid: categoryUuid ?? undefined,
        animal_uuid: option?.value,
        weighing_uuid: weighingUuid,
      })
        .then((response) => {
          if (response.data?.valid === false) {
            const rejected = response.data.invalid_animals?.find(
              (item) => item.uuid === option?.value
            );
            toaster.create({
              type: 'warning',
              title: languageGB.weighing.weighing.singularLabel,
              description: rejected?.message ?? response.data.message ?? undefined,
            });
            if (!rejected) return;
            // BLOQUEANTE na seleção do animal (legado `_forms.blade.php:938-961`:
            // o aviso é seguido de limpeza do animal da linha) — limpa também
            // Último Peso/Data (não sobra valor de um animal rejeitado). Só quando
            // ainda é o animal que acabou de ser escolhido (resposta tardia não
            // apaga uma escolha posterior).
            if (option?.value && animalFieldValueRef.current === option.value) {
              animalField.onChange(null);
              lastWeightField.onChange('');
              lastWeightDateField.onChange(null);
            }
          }
        })
        .catch(() => {
          // não-bloqueante — silencioso (ver nota de cabeçalho do arquivo).
        });
    }
  }

  return (
    <Box p={4} border="1px solid" borderColor="border.subtle" borderRadius="lg">
      <Flex gap={3} align="flex-start" wrap="wrap">
        <Box flex="2" minW="220px">
          <SelectAsyncPaginate
            name={animalField.name}
            label={text.fields.animal}
            placeholder={text.placeholders.animal}
            service={(params: PaginationQueryParams) =>
              listRowAnimalOptions(params, batchUuid, categoryUuid, usedAnimalUuids)
            }
            mapOptions={(item: AnimalOptionListItem): WeighingAnimalFieldOption => ({
              label: item.label,
              value: item.uuid,
              last_weight: item.last_weight ?? null,
              last_weight_date: item.last_weight_date ?? null,
            })}
            findParams={(search: string | { search: string }) => ({
              search: typeof search === 'string' ? search : search.search,
            })}
            value={animalField.value ?? null}
            onChange={handleAnimalChange as (option: unknown) => void}
            error={animalFieldState.error?.message ?? dateConflictMessage}
            cacheUniqs={[batchUuid, categoryUuid, usedAnimalUuids.join(',')]}
            menuPortalTarget={document.body}
            menuPosition="fixed"
            isRequired
            isDisabled={isDisabled}
          />
        </Box>

        <Box w={{ base: 'full', sm: '150px' }}>
          <InputReadOnly
            name={lastWeightField.name}
            label={text.fields.lastWeight}
            value={
              lastWeightField.value === '' || lastWeightField.value == null
                ? ''
                : formatNumber(Number(lastWeightField.value), 2)
            }
            error={lastWeightFieldState.error?.message}
          />
        </Box>

        <Box w={{ base: 'full', sm: '160px' }}>
          <InputReadOnly
            name={lastWeightDateField.name}
            label={text.fields.lastWeightDate}
            value={lastWeightDateField.value ? formatDate(lastWeightDateField.value) : ''}
            error={lastWeightDateFieldState.error?.message}
          />
        </Box>

        <Box w={{ base: 'full', sm: '130px' }}>
          <NumberInput
            name={weightField.name}
            label={text.fields.weight}
            allowDot
            decimalPlaces={2}
            min={0}
            value={weightField.value === '' ? null : Number(weightField.value)}
            onValueChange={(value) => weightField.onChange(value ?? '')}
            error={weightFieldState.error?.message}
            isRequired
            disabled={isDisabled}
          />
        </Box>

        <Flex direction="column" gap="1.5" minW="90px">
          <Text fontSize="sm" fontWeight="medium">
            {text.fields.gain}
          </Text>
          <Text fontSize="sm">{formatNumber(gain, 2)}</Text>
        </Flex>

        <Flex direction="column" gap="1.5" minW="90px">
          <Text fontSize="sm" fontWeight="medium">
            {text.fields.gmd}
          </Text>
          <Text fontSize="sm">{formatNumber(gmd, 3)}</Text>
        </Flex>

        <Flex direction="column" gap="1.5">
          <Flex align="center" justify="space-between" gap={2}>
            <Text fontSize="sm" fontWeight="medium">
              {text.fields.ultrasound}
            </Text>
            {/* @ts-ignore - Chakra UI v3 Switch API */}
            <Switch
              checked={!!hasUltrasoundField.value}
              onCheckedChange={(details: { checked: boolean }) => {
                hasUltrasoundField.onChange(details.checked);
                // Correção de fidelidade (97-Esteiras/002 execução 002 lane
                // C) — ao desligar, limpa AOL/EGS/MARM/Classe, evita dado
                // órfão no payload (mirror `ProcessingAnimalRow`).
                if (!details.checked) {
                  setValue(`animals.${index}.aol`, null, { shouldDirty: true });
                  setValue(`animals.${index}.egs`, null, { shouldDirty: true });
                  setValue(`animals.${index}.marm`, null, { shouldDirty: true });
                  setValue(`animals.${index}.classification`, null, { shouldDirty: true });
                }
              }}
              colorPalette="green"
              disabled={isDisabled}
              aria-label={text.fields.ultrasound}
            />
          </Flex>
        </Flex>

        {/* Correção de fidelidade (97-Esteiras/002 execução 002 lane C) —
            AOL/EGS/MARM/Classe, visíveis/obrigatórios só quando o ultrassom
            da linha está marcado, mirror EXATO `ProcessingAnimalRow.tsx`. */}
        {watchedHasUltrasound && (
          <>
            <Box w={{ base: 'full', sm: '110px' }}>
              <NumberInput
                name={aolField.name}
                label={text.fields.aol}
                allowDot
                decimalPlaces={2}
                min={0}
                value={aolField.value ?? null}
                onValueChange={(value) => aolField.onChange(value ?? null)}
                error={aolFieldState.error?.message}
                isRequired
                disabled={isDisabled}
              />
            </Box>

            <Box w={{ base: 'full', sm: '110px' }}>
              <NumberInput
                name={egsField.name}
                label={text.fields.egs}
                allowDot
                decimalPlaces={2}
                min={0}
                value={egsField.value ?? null}
                onValueChange={(value) => egsField.onChange(value ?? null)}
                error={egsFieldState.error?.message}
                isRequired
                disabled={isDisabled}
              />
            </Box>

            <Box w={{ base: 'full', sm: '110px' }}>
              <NumberInput
                name={marmField.name}
                label={text.fields.marm}
                allowDot
                decimalPlaces={2}
                min={0}
                value={marmField.value ?? null}
                onValueChange={(value) => marmField.onChange(value ?? null)}
                error={marmFieldState.error?.message}
                isRequired
                disabled={isDisabled}
              />
            </Box>

            <Box w={{ base: 'full', sm: '90px' }}>
              <Input
                name={classificationField.name}
                label={text.fields.classification}
                maxLength={1}
                value={classificationField.value ?? ''}
                onChange={classificationField.onChange}
                error={classificationFieldState.error?.message}
                isRequired
                disabled={isDisabled}
              />
            </Box>
          </>
        )}

        <Flex direction="column" gap="1.5">
          <Flex alignItems="center" fontSize="14px" visibility="hidden">
            {text.removeAnimal}
          </Flex>
          <IconButtonTable
            type="button"
            aria-label={text.removeAnimal}
            mensegerTooltip={text.removeAnimal}
            size="sm"
            color="red.500"
            variant="ghost"
            disabled={isDisabled || !canRemove}
            onClick={onRemove}
          >
            <Icon as={FiTrash2} />
          </IconButtonTable>
        </Flex>
      </Flex>
    </Box>
  );
}

export default WeighingAnimalRow;
