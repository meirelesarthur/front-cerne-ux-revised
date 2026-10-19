// src/pages/Operacional/PesagemRodoviaria/wizard/StepClassificacao.tsx
// -----------------------------------------------------------------------------
// Etapa OPCIONAL de Classificação do wizard (`status=Classificacao`,
// FE-SCR-03, TASK-MWG-FE-06) — ativa só quando `has_classification=true`
// (`FLD-014`). 6 chaves de classificação (`impureza/umidade/quebrado/
// esverdeado/avariado/taxa_recepcao`, cada uma `{percent, applied}`) + tabela
// de desconto (`FLD-015`, `IG-006`).
//
// Reconciliado nesta correção (execução 050, Bug 2) contra o backend REAL:
// a tabela de desconto NÃO é selecionável nesta etapa — é fixada no
// pré-cadastro (`CreateOrUpdateModuleWeighing`, campo `discountTable`) e o
// `PUT next-step` real (`AdvanceModuleWeighingStepData`) nunca aceita
// `discount_table_uuid`. O que era um `Select` de tabelas virou um DISPLAY
// read-only da tabela já vinculada (`discountTable` prop); as faixas de
// desconto usadas no cálculo/preview vêm de `discountRules`
// (`ModuleWeighingNextStepHydration.discount_rules`, já filtradas pelo
// servidor para a tabela/produto vinculados — nunca mais buscadas via
// `getDiscountTable(...).products.find(productUuid)`).
//
// IG-013 — 500ms de debounce após carregar a etapa antes do primeiro cálculo
// automático (`classification_document_ready`). IG-014 — percentual >100%
// zera automaticamente (efeito no `onChange`, com aviso visual).
//
// DIV-01 (correção 050) — o checkbox "aplicar este desconto" é só estado
// LOCAL da UI (`ClassificationFormValues.applied: boolean`); o backend
// (`ModuleWeighingClassificationItemData::$applied`) espera o PERCENTUAL DE
// DESCONTO já resolvido (float), nunca o boolean. `toWireItem`/`toFormItem`
// fazem a conversão nas duas direções na fronteira deste componente —
// `resolveAppliedPercent` (`classificationDiscountCalculator.ts`) é a ÚNICA
// função que decide o percentual (mesma faixa usada pelo preview), paridade
// com `ModuleWeighingCalculator::applyDiscounts()` no servidor.
//
// D4 (correção 050, fidelidade) — o legado (`classification.blade:24-26`)
// SEMPRE deixa `applied` (% desconto) editável quando NÃO há tabela de
// desconto fixada (`discount_table_id == null`), readonly+auto-preenchido
// só quando HÁ tabela. O checkbox acima cobre só o caso COM tabela — sem
// ela, `discountRules` vem vazio e o checkbox sempre resolvia `0`
// (classificação manual inviável). `hasDiscountTable` decide o modo por
// chave: COM tabela → checkbox `applied` + `resolveAppliedPercent` (mantido,
// inalterado); SEM tabela → input numérico `appliedManual` (0-100), cujo
// valor digitado é o próprio percentual de desconto enviado ao servidor —
// nunca passa por `discountRules` (que não existem nesse modo).
// -----------------------------------------------------------------------------

import { useEffect, useMemo, useState } from 'react';

import { Box, Checkbox, SimpleGrid, Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';

import { Form } from '@/components/Form';
import { PercentInput } from '@/components/Form/PercentInput';

import { useLanguage } from '@/hooks/useLanguage';

import { queryKey } from '@/constants/query-key';

import { moduleWeighingClassificationSchemaResolver } from '@/validations/schemas/ModuleWeighing/classification-schema';

import { getDiscountTable } from '@/services/v2/DiscountTables/discount-table-service';

import type { DiscountRuleType } from '@/@types/v2/DiscountTables';
import type {
  ModuleWeighingClassification,
  ModuleWeighingClassificationItem,
  ModuleWeighingDiscountRuleRef,
  ModuleWeighingDiscountTableRef,
} from '@/@types/v2/ModuleWeighing/module-weighing';

import {
  calculateClassificationDiscount,
  resolveAppliedPercent,
} from './classificationDiscountCalculator';
import { ClassificationDiscountPreview } from './ClassificationDiscountPreview';

const CLASSIFICATION_KEYS: DiscountRuleType[] = [
  'impureza',
  'umidade',
  'quebrado',
  'esverdeado',
  'avariado',
  'taxa_recepcao',
];

interface ClassificationItemFormValues {
  percent: number | null;
  /** Modo COM tabela — checkbox "aplicar este desconto" (correção 050, DIV-01). */
  applied: boolean;
  /** Modo SEM tabela (correção 050, D4) — percentual de desconto digitado
   *  diretamente (mirror `classification.blade:24-26`). */
  appliedManual: number | null;
}

interface ClassificationFormValues {
  impureza: ClassificationItemFormValues;
  umidade: ClassificationItemFormValues;
  quebrado: ClassificationItemFormValues;
  esverdeado: ClassificationItemFormValues;
  avariado: ClassificationItemFormValues;
  taxa_recepcao: ClassificationItemFormValues;
}

function emptyClassificationItem(): ClassificationItemFormValues {
  return { percent: null, applied: false, appliedManual: null };
}

/**
 * Converte o item de transporte (`ModuleWeighingClassificationItem`, `applied`
 * = percentual de desconto float — correção 050, DIV-01) no item local do
 * formulário. COM tabela de desconto (`hasDiscountTable=true`), `applied > 0`
 * reconstitui o checkbox marcado na re-hidratação (edição/GET next-step) — o
 * servidor só persiste `applied > 0` quando o usuário marcou o item E havia
 * faixa correspondente. SEM tabela (D4), o próprio `applied` já É o
 * percentual digitado pelo usuário — reidratado direto em `appliedManual`.
 *
 * @param {ModuleWeighingClassificationItem | undefined} item Item vindo da
 *   hidratação (`initialClassification`), ou `undefined` quando a etapa
 *   ainda não tem classificação persistida.
 * @param {boolean} hasDiscountTable Modo da etapa (tabela fixada ou não).
 * @return {ClassificationItemFormValues} Item no shape local do formulário.
 */
function toFormItem(
  item: ModuleWeighingClassificationItem | undefined,
  hasDiscountTable: boolean
): ClassificationItemFormValues {
  if (!item) return emptyClassificationItem();
  if (hasDiscountTable) {
    return { percent: item.percent, applied: (item.applied ?? 0) > 0, appliedManual: null };
  }
  return { percent: item.percent, applied: false, appliedManual: item.applied ?? null };
}

export interface StepClassificacaoProps {
  formId: string;
  grossWeight: number | null;
  /** Tabela de desconto já fixada no pré-cadastro — DISPLAY apenas (não é
   *  mais selecionável nesta etapa, ver nota de cabeçalho). */
  discountTable: ModuleWeighingDiscountTableRef | null;
  /** Faixas de desconto (`discount_rules`) já filtradas pelo backend para a
   *  tabela/produto vinculados — entrada do preview client-side. */
  discountRules: ModuleWeighingDiscountRuleRef[];
  initialClassification: ModuleWeighingClassification | null;
  onSubmitClassification: (payload: { classification: ModuleWeighingClassification }) => void;
}

export function StepClassificacao({
  formId,
  grossWeight,
  discountTable,
  discountRules,
  initialClassification,
  onSubmitClassification,
}: StepClassificacaoProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.moduleWeighing.moduleWeighing.classification;

  // D4 — modo da etapa inteira (fixado no pré-cadastro, nunca muda durante o
  // ciclo de vida deste componente): COM tabela → checkbox + resolução
  // automática; SEM tabela → percentual digitado manualmente.
  const hasDiscountTable = !!discountTable;

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ClassificationFormValues>({
    mode: 'onChange',
    resolver: moduleWeighingClassificationSchemaResolver(languageGB),
    defaultValues: {
      impureza: toFormItem(initialClassification?.impureza, hasDiscountTable),
      umidade: toFormItem(initialClassification?.umidade, hasDiscountTable),
      quebrado: toFormItem(initialClassification?.quebrado, hasDiscountTable),
      esverdeado: toFormItem(initialClassification?.esverdeado, hasDiscountTable),
      avariado: toFormItem(initialClassification?.avariado, hasDiscountTable),
      taxa_recepcao: toFormItem(initialClassification?.taxa_recepcao, hasDiscountTable),
    },
  });

  const watchAll = watch();

  // IG-013 — 500ms de debounce após carregar a etapa antes do primeiro
  // cálculo automático (`classification_document_ready`).
  const [readyForCalc, setReadyForCalc] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setReadyForCalc(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // `discount_rules` (hidratação do wizard) não traz `calculation_base`
  // (GW/PD) — só existe no detalhe da própria `DiscountTable`. Busca leve,
  // só para este campo (as faixas em si já vêm prontas via `discountRules`).
  const discountTableUuid = discountTable?.uuid;

  const discountTableDetailQuery = useQuery({
    queryKey: [queryKey.moduleWeighing.moduleWeighing, 'discount-table-detail', discountTableUuid],
    queryFn: async () => (await getDiscountTable(discountTableUuid!)).data,
    enabled: !!discountTableUuid,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const calculationBase = discountTableDetailQuery.data?.calculation_base.value ?? 'GW';

  // D4 — resolve o percentual de desconto (0-100) desta chave conforme o
  // modo da etapa: COM tabela, mesma resolução de sempre
  // (`resolveAppliedPercent` + `discountRules`, DIV-01 inalterado); SEM
  // tabela, o valor digitado manualmente É o percentual (nunca passa por
  // `discountRules`, que vêm vazias nesse modo — era exatamente por isso que
  // o checkbox sempre resolvia `0` antes desta correção).
  function resolveRate(key: DiscountRuleType, formItem: ClassificationItemFormValues): number {
    if (hasDiscountTable) {
      return resolveAppliedPercent(key, formItem.percent, formItem.applied, discountRules);
    }
    return formItem.appliedManual ?? 0;
  }

  const discountPreview = useMemo(() => {
    if (!readyForCalc) return null;
    const items = CLASSIFICATION_KEYS.map((key) => ({
      key,
      percent: watchAll[key]?.percent ?? null,
      rate: resolveRate(key, watchAll[key]),
    }));
    return calculateClassificationDiscount(grossWeight, items, calculationBase);
  }, [readyForCalc, watchAll, grossWeight, discountRules, calculationBase, hasDiscountTable]);

  // Converte o item local do formulário no item de transporte (`applied` =
  // percentual de desconto float — correção 050, DIV-01/D4). Mesma resolução
  // do preview (`resolveRate` acima) — paridade garantida com
  // `ModuleWeighingCalculator::applyDiscounts()` no servidor: nunca envia
  // boolean cru, nunca envia o percentual digitado sem passar pelo mesmo
  // caminho usado no preview.
  function toWireItem(
    key: DiscountRuleType,
    formItem: ClassificationItemFormValues
  ): ModuleWeighingClassificationItem {
    return {
      percent: formItem.percent,
      applied: resolveRate(key, formItem),
    };
  }

  function onSubmit(data: ClassificationFormValues) {
    const classification: ModuleWeighingClassification = {
      impureza: toWireItem('impureza', data.impureza),
      umidade: toWireItem('umidade', data.umidade),
      quebrado: toWireItem('quebrado', data.quebrado),
      esverdeado: toWireItem('esverdeado', data.esverdeado),
      avariado: toWireItem('avariado', data.avariado),
      taxa_recepcao: toWireItem('taxa_recepcao', data.taxa_recepcao),
    };
    onSubmitClassification({ classification });
  }

  const keyLabels: Record<DiscountRuleType, string> = {
    impureza: text.keys.impureza,
    umidade: text.keys.umidade,
    quebrado: text.keys.quebrado,
    esverdeado: text.keys.esverdeado,
    avariado: text.keys.avariado,
    taxa_recepcao: text.keys.taxaRecepcao,
  };

  return (
    <Form id={formId} onSubmit={handleSubmit(onSubmit)}>
      <Box>
        <Text fontSize="sm" fontWeight="medium" color="fg.muted">
          {text.discountTable}
        </Text>
        <Text fontWeight="medium">{discountTable?.description ?? '-'}</Text>
      </Box>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4} mt={4}>
        {CLASSIFICATION_KEYS.map((key) => (
          <Box key={key}>
            <Text fontWeight="medium" mb={1}>
              {keyLabels[key]}
            </Text>
            <Controller
              name={`${key}.percent`}
              control={control}
              render={({ field }) => (
                <PercentInput
                  name={field.name}
                  label={text.percentLabel}
                  value={field.value}
                  // IG-014 — percentual >100% zera automaticamente: `maxValue`
                  // clampa ANTES de chegar ao form (nunca deixa >100 passar).
                  maxValue={100}
                  onValueChange={field.onChange}
                  error={(errors as any)[key]?.percent?.message}
                />
              )}
            />
            {/* D4 — COM tabela: checkbox "aplicar" + resolução automática
                (inalterado, DIV-01). SEM tabela: input manual do percentual
                de desconto (mirror `classification.blade:24-26`). */}
            {hasDiscountTable ? (
              <Controller
                name={`${key}.applied`}
                control={control}
                render={({ field }) => (
                  <Checkbox.Root
                    checked={field.value}
                    onCheckedChange={({ checked }: { checked: boolean }) => field.onChange(checked)}
                    mt={2}
                  >
                    <Checkbox.HiddenInput />
                    <Checkbox.Control />
                    <Checkbox.Label>{text.appliedLabel}</Checkbox.Label>
                  </Checkbox.Root>
                )}
              />
            ) : (
              <Controller
                name={`${key}.appliedManual`}
                control={control}
                render={({ field }) => (
                  <PercentInput
                    name={field.name}
                    label={text.appliedManualLabel}
                    value={field.value}
                    maxValue={100}
                    onValueChange={field.onChange}
                    error={(errors as any)[key]?.appliedManual?.message}
                  />
                )}
              />
            )}
          </Box>
        ))}
      </SimpleGrid>

      <ClassificationDiscountPreview
        title={text.discountPreviewTitle}
        totalLabel={text.discountPreviewTotal}
        totalDiscount={discountPreview?.totalDiscount ?? null}
      />
    </Form>
  );
}

export default StepClassificacao;
