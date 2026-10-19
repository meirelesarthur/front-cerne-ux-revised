// src/pages/Operacional/Pesagem/WeighingAnimalsSection.tsx
// -----------------------------------------------------------------------------
// Bloco de animais do formulário de Pesagem — `pes-form-animals`
// (F-071, TASK-PES-FE-05, contrato-tela-lane-c-pesagem-frontend.md §6.5).
// `useFieldArray` de `animals`, mínimo 1 linha (schema Yup `animals: min(1)`
// já entregue na TASK-PES-FE-01), botão "+" (mirror `SanitaryItemsSection`,
// AC-05 `append`) e remoção por linha (AC-06 `remove`) desabilitada quando só
// resta 1 — mirror estrutural de `Sanitario/SanitaryItemsSection.tsx`
// (ADR-FE-PES-00, adaptado de itens de produto para linhas de animal).
//
// A garantia de "mínimo 1 linha" É deste componente (mirror EXATO
// `SanitaryItemsSection`): um `useEffect` acrescenta 1 linha vazia sempre que
// `fields.length` chega a 0 (montagem inicial com `animals: []` OU depois de
// um `reset` de edição sem nenhum animal hidratado — não deveria acontecer em
// produção, já que o backend exige mín. 1, mas é uma defesa honesta, não
// mock).
//
// Cascata `batch_uuid`/`category_uuid` → limpa linhas já adicionadas
// (contrato-tela §6.4/§6.5, "repopuladas quando batch_uuid/category_uuid
// mudar — limpa as linhas existentes"). Implementado por `useWatch` direto
// sobre o MESMO `control` do form pai (`WeighingHeaderFields.tsx`, nota de
// cabeçalho: "o EVENTO de troca é veiculado pelo contexto de form
// compartilhado, não por um callback prop dedicado") — a chave composta
// `batchUuid ?? categoryUuid ?? null` é comparada contra o valor de MONTAGEM
// (capturado 1x por `useRef(cascadeKey)`).
//
// CORREÇÃO (AF_REJECTED execução 017, item 2/3, BUG-PES-EDIT-01 — dono ao
// vivo: "Editar Pesagem: seção Animais carrega vazia"): a premissa anterior
// deste comentário ("a 1ª renderização nunca dispara replace() porque a ref
// já nasce igual ao valor corrente") estava INCORRETA para o fluxo real de
// edição. `CreateOrUpdateWeighing.tsx` monta `WeighingAnimalsSection`
// INCONDICIONALMENTE, mesmo durante `isLoading` — o componente nasce com
// `batch_uuid=null` (default do form), a ref captura `cascadeKey=null`. Só
// DEPOIS, quando `useCustomFormQueryById` resolve, `fillForm` chama
// `reset(mapWeighingDetailToFormValues(data))`, que muda `batch_uuid`
// (`null`→real) E `animals` (hidratados) NO MESMO reset — isso faz
// `cascadeKey` mudar de `null` para o valor real, o efeito abaixo dispara
// (`cascadeKeyRef.current !== cascadeKey`) e `replace()` APAGAVA os animais
// recém-hidratados. Corrigido com `skipNextCascadeRef` (prop opcional,
// `MutableRefObject<boolean>` repassado por `CreateOrUpdateWeighing.tsx`,
// setado `true` UMA VEZ, synchronamente, antes do PRIMEIRO `reset()` de
// edição bem-sucedido): quando `true`, a mudança de `cascadeKey` é
// reconhecida (ref de montagem atualizada) mas `replace()` é SKIPADO e a
// flag é consumida (`false`) — preserva os animais hidratados. Qualquer
// mudança de `cascadeKey` POSTERIOR (troca real de lote/categoria pelo
// usuário) já encontra a flag consumida e limpa a lista normalmente
// (comportamento original preservado, sem regressão). Ver testes em
// `WeighingAnimalsSection.editReset.test.tsx` (hidratação preserva animais +
// troca manual pós-carregamento ainda limpa).
//
// `usedAnimalUuids` (mirror `TeamMemberRow`/`GAP-EQ-FE-08`) — uuids de
// `animal_uuid` já escolhidos em QUALQUER linha, repassado a cada
// `WeighingAnimalRow` (que filtra a própria seleção do valor excluído,
// senão a linha perderia a opção corrente ao reabrir o Select).
// -----------------------------------------------------------------------------

import { useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';

import { Flex, Text } from '@chakra-ui/react';
import { Control, useFieldArray, UseFormSetValue, useWatch } from 'react-hook-form';

import { Button } from '@/components/Button';
import { toaster } from '@/components/ui/toaster';

import { listAnimalOptions } from '@/services/v2/Animals/animal-service';

import type { LanguageDate } from '@/@types/language';
import type { WeighingAnimalFormValue, WeighingFormValues } from '@/@types/v2/Weighing';

import { WeighingAnimalRow } from './WeighingAnimalRow';

import type { WeighingDateConflicts } from './useWeighingDateConflicts';

const EMPTY_ANIMAL_ROW: WeighingAnimalFormValue = {
  animal_uuid: null,
  weight: '',
  last_weight: '',
  last_weight_date: null,
  has_ultrasound: false,
  // Correção de fidelidade (97-Esteiras/002 execução 002 lane C) — mirror
  // `FinishProcessing.tsx` (linha nova nasce sem ultrassom, campos `null`).
  aol: null,
  egs: null,
  marm: null,
  classification: null,
};

export interface WeighingAnimalsSectionProps {
  control: Control<WeighingFormValues>;
  setValue: UseFormSetValue<WeighingFormValues>;
  languageGB: LanguageDate;
  isDisabled?: boolean;
  /**
   * BUG-PES-EDIT-01 (correção AF_REJECTED, execução 017) — repassado por
   * `CreateOrUpdateWeighing.tsx`, setado `true` synchronamente antes do
   * PRIMEIRO `reset()` de hidratação de edição. Quando `true` na PRÓXIMA
   * mudança de `cascadeKey`, o `replace()` abaixo é skipado (preserva os
   * animais recém-hidratados) e a flag é consumida. Opcional — ausente =
   * comportamento antigo (sempre limpa), mirror de qualquer outro possível
   * consumidor deste componente que não passe pelo fluxo de edição.
   */
  skipNextCascadeRef?: MutableRefObject<boolean>;
  /** Pesagem em edição — repassado ao `check-date` para a API excluir a própria pesagem. */
  weighingUuid?: string;
  /** Animais reprovados pela regra de data (`useWeighingDateConflicts`), por uuid do animal. */
  dateConflicts?: WeighingDateConflicts;
}

export function WeighingAnimalsSection({
  control,
  setValue,
  languageGB,
  isDisabled,
  skipNextCascadeRef,
  weighingUuid,
  dateConflicts,
}: WeighingAnimalsSectionProps) {
  const text = languageGB.weighing.weighing.form;

  const { fields, append, remove, replace } = useFieldArray({ control, name: 'animals' });

  // BUG-PES-CREATE-01 (dono ao vivo, print — "Nova Pesagem" abre com 2
  // linhas vazias em vez de 1). Causa raiz confirmada por reprodução real
  // (harness com `React.StrictMode`, ver
  // `WeighingAnimalsSection.strictModeCreate.test.tsx`): em React 18
  // `StrictMode` (ambiente de dev), o efeito de montagem é invocado 2x
  // seguidas ANTES de qualquer re-render — `fields.length` é estado INTERNO
  // do `useFieldArray` (react-hook-form), não um `useState` do React, então
  // a 2ª invocação ainda enxerga `fields.length === 0` (o `append` da 1ª
  // chamada não teve tempo de refletir num novo render), disparando um 2º
  // `append` e deixando 2 linhas.
  //
  // `hasAppendedForEmptyStateRef` (mirror
  // `hasHydratedAnimalsRef`/`skipNextAnimalsCascadeRef` de
  // `CreateOrUpdateWeighing.tsx`) suprime só a REDUNDÂNCIA sincrona do
  // StrictMode: fica `true` assim que o 1º `append` desta ocorrência de
  // "vazio" dispara, e a 2ª invocação (mesmo `fields.length === 0`, mesmo
  // ciclo, sem render entre as duas) é ignorada. O `else` abaixo RESETA a
  // flag para `false` assim que um render real confirma `fields.length > 0`
  // — só depois disso StrictMode já não duplica mais (ele só duplica a
  // invocação de montagem). Isso preserva o 2º propósito documentado deste
  // mesmo efeito (comentário de cabeçalho, linhas ~11-16): repor 1 linha
  // depois de um `reset` de edição que hidrata `animals` de volta a `[]`
  // (defensivo — não esperado em produção, mas não pode regredir). A
  // cascata de troca de lote/categoria (efeito abaixo) não depende desta
  // flag: ela chama `replace([EMPTY_ANIMAL_ROW])` diretamente, levando
  // `fields.length` a 1 (nunca passa por 0), então nunca aciona este guard.
  const hasAppendedForEmptyStateRef = useRef(false);

  useEffect(() => {
    if (fields.length === 0) {
      if (!hasAppendedForEmptyStateRef.current) {
        hasAppendedForEmptyStateRef.current = true;
        append({ ...EMPTY_ANIMAL_ROW });
      }
    } else {
      hasAppendedForEmptyStateRef.current = false;
    }
    // eslint-disable-next-line
  }, [fields.length]);

  const watchedBatch = useWatch({ control, name: 'batch_uuid' });
  const watchedCategory = useWatch({ control, name: 'category_uuid' });
  const watchedDate = useWatch({ control, name: 'date' });
  const watchedAnimals = useWatch({ control, name: 'animals' }) ?? [];

  const batchUuid = watchedBatch?.value ?? null;
  const categoryUuid = watchedCategory?.value ?? null;
  const cascadeKey = batchUuid ?? categoryUuid ?? null;

  // Ver nota de cabeçalho — a ref já NASCE igual ao valor corrente, então a
  // 1ª comparação (montagem/hidratação) nunca dispara `replace()`.
  const cascadeKeyRef = useRef(cascadeKey);

  useEffect(() => {
    if (cascadeKeyRef.current === cascadeKey) return;
    cascadeKeyRef.current = cascadeKey;

    // BUG-PES-EDIT-01 — ver nota de cabeçalho. Consome a flag 1x: a mudança
    // de cascadeKey causada pela PRÓPRIA hidratação de edição não deve
    // limpar os animais recém-hidratados.
    if (skipNextCascadeRef?.current) {
      skipNextCascadeRef.current = false;
      return;
    }

    // `replace([...])` já entrega a linha vazia diretamente (`fields.length`
    // vai para 1, nunca passa por 0) — não depende nem interfere no guard
    // `hasAppendedForEmptyStateRef` do efeito de montagem acima.
    replace([{ ...EMPTY_ANIMAL_ROW }]);
    // eslint-disable-next-line
  }, [cascadeKey]);

  const usedAnimalUuids = watchedAnimals
    .map((animal) => animal?.animal_uuid?.value)
    .filter((uuid): uuid is string => !!uuid);

  // Item 3 da execução 084 — mirror legado `weighings/_forms.blade.php:1033-1036`:
  // ao adicionar linha com TODOS os animais do lote/categoria já escolhidos →
  // aviso "Todos os animais já foram selecionados" e NÃO adiciona a linha.
  // Custo baixo: 1 chamada `per_page=1` olhando `pagination.total` (a API já
  // aplica `exclude_uuids[]`). Sem lote/categoria no cabeçalho o select lista a
  // fazenda toda (esgotar é inviável) — não consulta e adiciona direto. Falha
  // de rede é NÃO-bloqueante (adiciona a linha, mesmo racional do `check-date`).
  const isCheckingAvailabilityRef = useRef(false);

  async function handleAddAnimal() {
    if (isCheckingAvailabilityRef.current) return;

    if (batchUuid || categoryUuid) {
      isCheckingAvailabilityRef.current = true;
      try {
        const response = await listAnimalOptions({
          page: 1,
          per_page: 1,
          batch_uuid: batchUuid ?? undefined,
          category_uuid: categoryUuid ?? undefined,
          exclude_uuids: usedAnimalUuids,
        });
        if (response.data.pagination.total === 0) {
          toaster.create({
            type: 'warning',
            title: languageGB.weighing.weighing.singularLabel,
            description: text.allAnimalsSelected,
          });
          return;
        }
      } catch {
        // não-bloqueante — segue para o append.
      } finally {
        isCheckingAvailabilityRef.current = false;
      }
    }

    append({ ...EMPTY_ANIMAL_ROW });
  }

  return (
    <Flex direction="column" gap={4} mt={6}>
      <Flex justify="space-between" align="center">
        <Text fontWeight="bold">{text.sections.animals}</Text>
        <Button
          title={text.addAnimal}
          variant="outline"
          type="button"
          onClick={handleAddAnimal}
          disabled={isDisabled}
        />
      </Flex>

      <Flex direction="column" gap={4}>
        {fields.map((field, index) => {
          const currentAnimalUuid = watchedAnimals[index]?.animal_uuid?.value;
          return (
            <WeighingAnimalRow
              key={field.id}
              control={control}
              setValue={setValue}
              index={index}
              canRemove={fields.length > 1}
              onRemove={() => remove(index)}
              usedAnimalUuids={usedAnimalUuids.filter((uuid) => uuid !== currentAnimalUuid)}
              batchUuid={batchUuid}
              categoryUuid={categoryUuid}
              weighingDate={watchedDate ?? null}
              weighingUuid={weighingUuid}
              dateConflict={currentAnimalUuid ? dateConflicts?.[currentAnimalUuid] : undefined}
              languageGB={languageGB}
              isDisabled={isDisabled}
            />
          );
        })}
      </Flex>

      {Object.keys(dateConflicts ?? {}).length > 0 && (
        <Text role="alert" color="fg.error" fontSize="sm">
          {text.dateConflictBlocked}
        </Text>
      )}

      {fields.length === 0 && <Text color="fg.muted">{text.emptyAnimalsRow}</Text>}
    </Flex>
  );
}

export default WeighingAnimalsSection;
