// src/pages/Operacional/Reproducao/Acasalamento/AcasalamentoHeaderFields.tsx
// -----------------------------------------------------------------------------
// Cabeçalho do formulário de Acasalamento — `bm-form-main`/`bm-form-edit`
// (BreedingMating, F-016, 97-Esteiras/001, TASK-BM-FE-04, contrato de tela
// §6.3). Os 9 campos, na ordem e com os rótulos do legado, mais as cascatas
// C1-C6 (C7 — ver nota abaixo, C8-C11 pertencem às linhas dinâmicas da
// TASK-BM-FE-05).
//
// `field_matrix`/`locked_fields` são AUTORIDADE (contrato de tela §5.3, regra
// 7 da Tarefa) — aplicados aqui via `isFieldRequired`/`isFieldVisible`/
// `isFieldLocked`, sempre com fallback ao comportamento estático já descrito
// no contrato (nunca uma matriz de modos NOVA inventada pelo front).
//
// C7 (`date`×`breeding_season_uuid` → aviso não-bloqueante se fora da janela
// da estação, contrato de tela §3.1/§6.3, EV-001) **NÃO foi implementado**:
// nem `EP-BM-03`/`EP-BM-04` (lookups) nem `EP-BM-12` (cascata) expõem a
// janela de datas da Estação de Monta (`EntityOptionRef` só tem
// `{uuid,label}`) — não há dado para calcular o aviso no cliente. Mirror do
// racional já registrado em `Weaning/useCascadesWeaning.ts` (GAP-PAST-FE-01):
// nenhuma simulação foi criada em seu lugar (SEM MOCK). O DoD "não bloqueia
// o submit" é satisfeito por construção — nenhuma validação de submit foi
// adicionada para esta regra.
// -----------------------------------------------------------------------------

import { Skeleton, SimpleGrid } from '@chakra-ui/react';
import { Controller } from 'react-hook-form';

import { DateInput } from '@/components/DateInput';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { Select } from '@/components/Form/Select';

import { breedingMatingLaunchTypeOptions } from '@/constants/breedingMating/options/breeding-mating-launch-type-options';
import { breedingMatingTypeOptions } from '@/constants/breedingMating/options/breeding-mating-type-options';
import { columnsForm } from '@/constants/coluns-form';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type {
  BreedingMatingFieldMatrix,
  BreedingMatingForm,
  BreedingMatingFormContext,
  BreedingMatingLockedFields,
  EntityOptionRef,
} from '@/@types/v2/BreedingMating';

import { LOCKED_UNKNOWN_OPTION_VALUE } from './acasalamento-form-mapper';
import {
  buildProtocolProductOptions,
  findSeasonProtocolItems,
} from './acasalamento-protocol-products';
import { useBreedingSeasonCascade } from './useAcasalamentos';

import type { Control, UseFormSetValue, UseFormWatch } from 'react-hook-form';

// Chaves de `field_matrix`/`locked_fields` — mirror do nome do campo no
// payload wire-level (`CreateBreedingMatingRequest`), NUNCA o nome do campo
// React Hook Form (que não tem o sufixo `_uuid`, pois guarda `Option<T>`).
const FIELD_KEYS = {
  type: 'type',
  launchType: 'launch_type',
  breedingSeason: 'breeding_season_uuid',
  bullSeedSeason: 'bull_seed_season_uuid',
  protocol: 'protocol_uuid',
  breedingBatch: 'breeding_batch_uuid',
} as const;

function isFieldRequired(
  fieldMatrix: BreedingMatingFieldMatrix | undefined,
  key: string,
  fallback: boolean
): boolean {
  return fieldMatrix?.[key]?.required ?? fallback;
}

function isFieldVisible(
  fieldMatrix: BreedingMatingFieldMatrix | undefined,
  key: string,
  fallback: boolean
): boolean {
  return fieldMatrix?.[key]?.visible ?? fallback;
}

function isFieldLocked(
  lockedFields: BreedingMatingLockedFields | undefined,
  key: string,
  fallback: boolean
): boolean {
  return lockedFields?.[key] ?? fallback;
}

function mapEntityOptionRefToOption(ref: EntityOptionRef): Option<string> {
  return { label: ref.label, value: ref.uuid };
}

interface AcasalamentoHeaderFieldsProps {
  control: Control<BreedingMatingForm>;
  watch: UseFormWatch<BreedingMatingForm>;
  setValue: UseFormSetValue<BreedingMatingForm>;
  languageGB: LanguageDate;
  canSave: boolean;
  isEditing: boolean;
  isLoading: boolean;
  nextCode: string;
  responsibleName: string;
  formContext: BreedingMatingFormContext | undefined;
}

export function AcasalamentoHeaderFields({
  control,
  watch,
  setValue,
  languageGB,
  canSave,
  isEditing,
  isLoading,
  nextCode,
  responsibleName,
  formContext,
}: AcasalamentoHeaderFieldsProps) {
  const text = languageGB.breedingMatings.breedingMating.form;
  const fieldMatrix = formContext?.field_matrix;
  const lockedFields = formContext?.locked_fields;
  const lookups = formContext?.lookups;

  const type = watch('type');
  const launchType = watch('launch_type');
  const breedingSeason = watch('breeding_season');

  const isNatural = type?.value === 1;
  const isSimplified = launchType?.value === 2;
  const isProtocolRequired = !isNatural && launchType?.value === 1;
  const isProtocolVisible = isFieldVisible(fieldMatrix, FIELD_KEYS.protocol, isProtocolRequired);

  const disabledBase = !canSave || isLoading;

  // Cascata C3 (`EP-BM-12`) — dispara pelo valor ATUAL de `breeding_season`,
  // inclusive já na hidratação de edição (o tipo entregue na Tarefa 01,
  // `BreedingMatingFormContextLookups`, não traz `bull_seed_seasons`/
  // `protocols`/`breeding_batches` pré-filtrados por `EP-BM-04` — só os 5
  // lookups fixos — então a mesma cascata cobre os dois modos; efeito
  // prático equivalente ao "dispensar a 1ª cascata" do contrato §3.5).
  const breedingSeasonCascadeQuery = useBreedingSeasonCascade(breedingSeason?.value);
  const cascadeContext = breedingSeasonCascadeQuery.data?.data;
  const cascadeLoading = breedingSeasonCascadeQuery.isFetching;

  const breedingSeasonOptions = (lookups?.breeding_seasons ?? []).map(mapEntityOptionRefToOption);
  const bullSeedSeasonOptions = (cascadeContext?.bull_seed_seasons ?? []).map(
    mapEntityOptionRefToOption
  );
  const protocolOptions = (cascadeContext?.protocols ?? []).map(mapEntityOptionRefToOption);

  // GAP-FE-BM-?? (correção pontual, lote 3, rejeição AF/AD "5 - Acasalamento") —
  // `EP-BM-12` (`listAvailableBreedingBatchesForSeason`, regra de fidelidade #8
  // do backend) devolve só lotes de reprodução AINDA SEM Acasalamento vinculado
  // (mirror `whereDoesntHave('breedingMating')` do legado) — em edição, o lote
  // já vinculado a ESTE MESMO registro nunca aparece nessa lista. O valor do
  // campo é hidratado corretamente (`data.breeding_batch`, `acasalamento-form-
  // mapper.ts`), mas o `Select` (Chakra v3/zag-js) só resolve o rótulo exibido
  // a partir de um item presente no `collection` construído de `options` — sem
  // o item lá, o campo aparenta "não recuperar o valor salvo" mesmo com o RHF
  // já carregando o valor certo. Correção: sempre incluir a seleção ATUAL
  // (`watch('breeding_batch')`) na lista de opções quando ausente dela, sem
  // alterar a regra de fidelidade do backend (a cascata continua só
  // devolvendo lotes disponíveis para uma NOVA seleção).
  const breedingBatch = watch('breeding_batch');
  const cascadeBreedingBatchOptions = (cascadeContext?.breeding_batches ?? []).map(
    mapEntityOptionRefToOption
  );
  const breedingBatchOptions =
    breedingBatch &&
    !cascadeBreedingBatchOptions.some((option) => option.value === breedingBatch.value)
      ? [breedingBatch, ...cascadeBreedingBatchOptions]
      : cascadeBreedingBatchOptions;

  // C1 — `type` muda: Natural força `launch_type = Normal` e oculta
  // Protocolo (`setValue('protocol', null)` — a seção some pela
  // renderização condicional do componente pai).
  function handleTypeChange(option: Option<number> | null) {
    if (option?.value === 1) {
      setValue('launch_type', breedingMatingLaunchTypeOptions.getOption(1, languageGB), {
        shouldDirty: true,
      });
      setValue('protocol', null, { shouldDirty: true });
    }
  }

  // C3 — `breeding_season_uuid` muda: limpa os 3 dependentes ANTES de
  // repovoar (contrato §6.3). A cascata (`useBreedingSeasonCascade`, acima)
  // repovoa as OPÇÕES a partir do novo `watch('breeding_season')`; o valor
  // nunca é autoatribuído (paridade CLM-023, `GAP-FE-BM-03`).
  function handleBreedingSeasonChange() {
    setValue('bull_seed_season', null, { shouldDirty: true });
    setValue('protocol', null, { shouldDirty: true });
    setValue('breeding_batch', null, { shouldDirty: true });
    applyProtocolProductsToRows([]);
    clearRowsSemen();
  }

  // UT-000705 — `_forms.blade.php:450-491`: trocar/limpar o Protocolo repovoa
  // os Produtos das linhas aptas com todos os itens da identificação corrente.
  function applyProtocolProductsToRows(products: Option<string>[]) {
    (watch('protocol_animals') ?? []).forEach((row, index) => {
      setValue(`protocol_animals.${index}.products`, row.eligible === false ? [] : [...products], {
        shouldDirty: true,
      });
    });
  }

  function handleProtocolChange(option: Option<string> | null) {
    const items = findSeasonProtocolItems(
      cascadeContext,
      option?.value,
      watch('protocol_identification')
    );
    applyProtocolProductsToRows(buildProtocolProductOptions(items));
  }

  // `_forms.blade.php:401-448`: trocar o Touro/Sêmen esvazia o Sêmen/Embrião das linhas.
  function clearRowsSemen() {
    (watch('protocol_animals') ?? []).forEach((_row, index) => {
      setValue(`protocol_animals.${index}.semen_or_embryo`, null, { shouldDirty: true });
    });
  }

  const isBullSeedSeasonUnknown = watch('bull_seed_season')?.value === LOCKED_UNKNOWN_OPTION_VALUE;
  const isProtocolUnknown = watch('protocol')?.value === LOCKED_UNKNOWN_OPTION_VALUE;

  return (
    <SimpleGrid columns={columnsForm.default} gap={6}>
      <Skeleton loading={isLoading} borderRadius="md">
        <InputReadOnly
          name="code"
          label={text.fields.code}
          value={nextCode || '—'}
          loading={isLoading}
        />
      </Skeleton>

      <Skeleton loading={isLoading} borderRadius="md">
        <Controller
          name="date"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <DateInput
              label={text.fields.date}
              // C7 (aviso de janela da estação) declaradamente NÃO
              // implementado — ver nota de cabeçalho do arquivo (EV-001,
              // SEM MOCK).
              value={field.value ?? null}
              onChange={(value) => field.onChange(value ?? '')}
              isRequired
              disabled={disabledBase}
              error={error?.message}
            />
          )}
        />
      </Skeleton>

      <Skeleton loading={isLoading} borderRadius="md">
        <InputReadOnly
          name="responsible_name"
          label={text.fields.responsible}
          value={responsibleName}
          loading={isLoading}
        />
      </Skeleton>

      <Skeleton loading={isLoading} borderRadius="md">
        <Controller
          name="type"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <Select
              name={field.name}
              label={text.fields.type}
              options={breedingMatingTypeOptions.options(languageGB)}
              value={field.value}
              onChange={(option: Option<number> | null) => {
                field.onChange(option ?? null);
                handleTypeChange(option);
              }}
              error={error?.message}
              isRequired={isFieldRequired(fieldMatrix, FIELD_KEYS.type, true)}
              isDisabled={disabledBase || isFieldLocked(lockedFields, FIELD_KEYS.type, isEditing)}
            />
          )}
        />
      </Skeleton>

      <Skeleton loading={isLoading} borderRadius="md">
        <Controller
          name="launch_type"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <Select
              name={field.name}
              label={text.fields.launchType}
              options={breedingMatingLaunchTypeOptions.options(languageGB)}
              value={field.value}
              onChange={(option: Option<number> | null) => field.onChange(option ?? null)}
              error={error?.message}
              isRequired={isFieldRequired(fieldMatrix, FIELD_KEYS.launchType, true)}
              // Trava adicional local (C1): Natural sempre força/mantém
              // Normal — não é `field_matrix` hardcodado, é a cascata
              // descrita na regra 8 da Tarefa. `locked_fields` do servidor
              // pode travar mais além disso.
              isDisabled={
                disabledBase ||
                isNatural ||
                isFieldLocked(lockedFields, FIELD_KEYS.launchType, false)
              }
            />
          )}
        />
      </Skeleton>

      <Skeleton loading={isLoading} borderRadius="md">
        <Controller
          name="breeding_season"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <Select
              name={field.name}
              label={text.fields.breedingSeason}
              options={breedingSeasonOptions}
              value={field.value}
              onChange={(option: Option<string> | null) => {
                field.onChange(option ?? null);
                handleBreedingSeasonChange();
              }}
              error={error?.message}
              loading={isLoading}
              isRequired={isFieldRequired(fieldMatrix, FIELD_KEYS.breedingSeason, !isSimplified)}
              isDisabled={
                disabledBase ||
                isFieldLocked(lockedFields, FIELD_KEYS.breedingSeason, isEditing && !isNatural)
              }
            />
          )}
        />
      </Skeleton>

      {isBullSeedSeasonUnknown ? (
        // GAP-FE-BM-04 — sem ref de hidratação; campo travado nesta edição,
        // exibido só como leitura (sentinela nunca reenviado, ver mapper).
        <InputReadOnly name="bull_seed_season" label={text.fields.bullSeedSeason} value="—" />
      ) : (
        <Skeleton loading={cascadeLoading} borderRadius="md">
          <Controller
            name="bull_seed_season"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <Select
                name={field.name}
                label={text.fields.bullSeedSeason}
                options={bullSeedSeasonOptions}
                value={field.value}
                onChange={(option: Option<string> | null) => {
                  field.onChange(option ?? null);
                  clearRowsSemen();
                }}
                error={error?.message}
                loading={cascadeLoading}
                isRequired={isFieldRequired(fieldMatrix, FIELD_KEYS.bullSeedSeason, !isSimplified)}
                isDisabled={
                  disabledBase ||
                  !breedingSeason ||
                  isFieldLocked(lockedFields, FIELD_KEYS.bullSeedSeason, isEditing && !isNatural)
                }
              />
            )}
          />
        </Skeleton>
      )}

      {isProtocolVisible &&
        (isProtocolUnknown ? (
          // CLM-002 — `protocol_uuid` é imutável no update e SEMPRE travado
          // em edição; sem ref de hidratação (GAP-FE-BM-04), só leitura.
          <InputReadOnly name="protocol" label={text.fields.protocol} value="—" />
        ) : (
          <Skeleton loading={cascadeLoading} borderRadius="md">
            <Controller
              name="protocol"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <Select
                  name={field.name}
                  label={text.fields.protocol}
                  options={protocolOptions}
                  value={field.value}
                  onChange={(option: Option<string> | null) => {
                    field.onChange(option ?? null);
                    handleProtocolChange(option);
                  }}
                  error={error?.message}
                  loading={cascadeLoading}
                  isRequired={isFieldRequired(fieldMatrix, FIELD_KEYS.protocol, isProtocolRequired)}
                  isDisabled={
                    disabledBase ||
                    !breedingSeason ||
                    isFieldLocked(lockedFields, FIELD_KEYS.protocol, isEditing)
                  }
                />
              )}
            />
          </Skeleton>
        ))}

      <Skeleton loading={isLoading} borderRadius="md">
        <Controller
          name="breeding_batch"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <Select
              name={field.name}
              label={text.fields.breedingBatch}
              options={breedingBatchOptions}
              value={field.value}
              onChange={(option: Option<string> | null) => field.onChange(option ?? null)}
              error={error?.message}
              loading={cascadeLoading}
              isRequired={isFieldRequired(fieldMatrix, FIELD_KEYS.breedingBatch, !isSimplified)}
              isDisabled={
                disabledBase ||
                !breedingSeason ||
                isFieldLocked(lockedFields, FIELD_KEYS.breedingBatch, isEditing && !isNatural)
              }
            />
          )}
        />
      </Skeleton>
    </SimpleGrid>
  );
}

export default AcasalamentoHeaderFields;
