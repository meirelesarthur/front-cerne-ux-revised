// src/pages/Operacional/PesagemRodoviaria/wizard/WizardModuleWeighingShell.tsx
// -----------------------------------------------------------------------------
// Casca do wizard de Pesagem Rodoviária (FE-SCR-03, TASK-MWG-FE-05) — rota
// `/operacional/pesagem-rodoviaria/:uuid/etapa` (`module-weighing_edit`).
//
// DIFERENÇA CRÍTICA vs. o único wizard client-side do repo
// (`CreateOrUpdateFarm`): este wizard é SERVER-DRIVEN — cada "Avançar" é uma
// mutação real (`PUT next-step`), só avança visualmente no `onSuccess`
// (contrato de tela §6). `Steps`/`StepsRoot` (`src/components/ui/steps.tsx`)
// é reusado só como INDICADOR de progresso.
//
// `GET next-step` é chamado a cada entrada na tela (idempotente, sem
// side-effect — fecha DV-014); `status` devolvido pela API é a ÚNICA fonte
// de verdade da etapa corrente (nunca um contador local otimista).
//
// TASK-MWG-FE-06 EDITA este arquivo para incluir `StepClassificacao`
// condicionalmente entre Pesagem Inicial e Final (`has_classification=true`)
// — nesta Tarefa (05), a etapa "classificacao" ainda não tem UI própria
// (placeholder mínimo, substituído pela Tarefa dona).
// -----------------------------------------------------------------------------

import { useEffect, useMemo } from 'react';

import { Box, Skeleton } from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { FormContainer } from '@/components/Layout/FormContainer';
import { Steps, StepsList, StepsRoot } from '@/components/ui/steps';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';

import { moduleWeighingType } from '@/constants/ModuleWeighing/module-weighing-type';
import { queryKey } from '@/constants/query-key';

import {
  advanceModuleWeighingStep,
  getModuleWeighingNextStep,
} from '@/services/v2/ModuleWeighing/module-weighing-service';

import type { AdvanceModuleWeighingStepPayload } from '@/@types/v2/ModuleWeighing/module-weighing';

import { StepClassificacao } from './StepClassificacao';
import { StepPesagemFinal } from './StepPesagemFinal';
import { StepPesagemInicial } from './StepPesagemInicial';

type WizardStepKey = 'inicial' | 'classificacao' | 'final';

const WEIGHT_FORM_ID = 'module-weighing-wizard-weight-form';
const CLASSIFICATION_FORM_ID = 'module-weighing-wizard-classification-form';

export default function WizardModuleWeighingShell() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { languageGB } = useLanguage();
  const text = languageGB.moduleWeighing.moduleWeighing;

  const nextStepQueryKey = [queryKey.moduleWeighing.moduleWeighing, 'next-step', uuid];

  const nextStepQuery = useQuery({
    queryKey: nextStepQueryKey,
    queryFn: async () => (await getModuleWeighingNextStep(uuid!)).data,
    enabled: !!uuid,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const hydration = nextStepQuery.data;

  // `PUT next-step` devolve o `ModuleWeighingResource` PLANO (sem
  // `next_status`/`warehouses`/`discount_rules` — ver comentário do
  // service), NUNCA o mesmo envelope de hidratação do `GET`. Por isso não
  // gravamos a resposta direto no cache (perderia os campos da hidratação):
  // invalidamos o `GET next-step` (Regra 6 — servidor é fonte única) e o
  // `useEffect` abaixo decide a navegação a partir do `next_status`
  // recém-buscado.
  const advanceMutation = useMutation({
    mutationFn: (payload: AdvanceModuleWeighingStepPayload) =>
      advanceModuleWeighingStep(uuid!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: nextStepQueryKey });
      toaster.success({
        title: text.singularLabel,
        description: text.wizard.toasts.advancedSuccess,
      });
    },
    onError: (error) => {
      toaster.error({
        title: text.singularLabel,
        description: extractApiErrorMessage(error) ?? languageGB.common.errorLog.unknownError,
        duration: 9000,
      });
    },
  });

  // `next_status=null` — não há mais etapa de captura pendente (todas as
  // transições do wizard já ocorreram, `resolveNextStatus` no backend só
  // devolve `null` quando o status já é `PesagemFinal`/`Finalizado`) — hora
  // de navegar para a Finalização. Fonte ÚNICA: `next_status`, NUNCA
  // `status` (um registro recém-criado está em `status=1/PreCadastro`, mas
  // tem etapa pendente — usar `status` aqui reintroduziria o mesmo bug).
  useEffect(() => {
    if (hydration && hydration.next_status === null) {
      navigate(`/operacional/pesagem-rodoviaria/${uuid}/finalizar`, { replace: true });
    }
  }, [hydration, navigate, uuid]);

  // Ordem de captura por `type` — tara primeiro para `Avulsa`/`VendaSaida`,
  // bruto primeiro para os demais (DIM-CAL-001, contrato de API §5.2,
  // replicado exatamente).
  const captureOrder = useMemo((): Array<'gross_weight' | 'tare_weight'> => {
    if (!hydration) return ['gross_weight', 'tare_weight'];
    const tareFirst =
      hydration.type === moduleWeighingType.avulsa ||
      hydration.type === moduleWeighingType.vendaSaida;
    return tareFirst ? ['tare_weight', 'gross_weight'] : ['gross_weight', 'tare_weight'];
  }, [hydration]);

  const steps: WizardStepKey[] = hydration?.has_classification
    ? ['inicial', 'classificacao', 'final']
    : ['inicial', 'final'];

  // Fonte ÚNICA da etapa corrente: `next_status` (o que falta capturar),
  // NUNCA `status` (o que já está persistido) — um registro recém-criado
  // está em `status=1/PreCadastro`, sem nenhum match no antigo cálculo por
  // `status`, o que deixava `currentStepKey=null` e o corpo do wizard vazio
  // ("Código: undefined", correção 050, Bug 2).
  //
  // Correção 050 (BUG-4) — `Number(...)` aqui é uma segunda camada de
  // defesa: o service (`mapNextStepHydration`) já normaliza `next_status`
  // para número na fronteira, mas esta comparação também aceita STRING
  // diretamente (`"2"|"3"|"4"`, o backed enum cru do backend) sem depender
  // só da normalização a montante — `Number(null)` é `0` e `Number(undefined)`
  // é `NaN`, nenhum dos dois bate com 2/3/4, então o fallback para `null`
  // (nenhuma etapa pendente/ainda carregando) continua correto.
  const nextStatusNumber = Number(hydration?.next_status);
  const currentStepKey: WizardStepKey | null =
    nextStatusNumber === 2
      ? 'inicial'
      : nextStatusNumber === 3
        ? 'classificacao'
        : nextStatusNumber === 4
          ? 'final'
          : null;

  const idx = currentStepKey ? steps.indexOf(currentStepKey) : 0;

  // Correção 050 (F4) — título da etapa por CONTEÚDO capturado (fiel ao
  // `card-title` do legado, "Tara do Veículo"/"Peso Total"), NUNCA um rótulo
  // genérico de posição ("Pesagem Inicial"/"Pesagem Final") — a etapa
  // 'inicial' captura `captureOrder[0]`, a 'final' captura `captureOrder[1]`
  // (mesma fonte usada abaixo para `activeField`/`activeFieldLabel`).
  const stepTitleForField = (field: 'gross_weight' | 'tare_weight') =>
    field === 'tare_weight' ? text.wizard.stepTitles.tare : text.wizard.stepTitles.gross;

  const stepLabels: Record<WizardStepKey, string> = {
    inicial: stepTitleForField(captureOrder[0]),
    classificacao: text.common.status.classificacao,
    final: stepTitleForField(captureOrder[1]),
  };

  // Etapa 'inicial' é sempre a PRIMEIRA captura de peso da ordem por `type`;
  // 'final' é sempre a SEGUNDA (a etapa 'classificacao' não captura peso).
  const isFirstCapture = currentStepKey === 'inicial';
  const activeField = isFirstCapture ? captureOrder[0] : captureOrder[1];
  const activeFieldLabel =
    activeField === 'gross_weight' ? text.wizard.fields.grossWeight : text.wizard.fields.tareWeight;
  // Correção 050 (BUG-8, P0) — a API SEMPRE retorna `tare_weight`/
  // `gross_weight` como `"0.00"` (nunca `null`/`undefined`) quando o peso
  // ainda não foi capturado (confirmado em `GET next-step` para registro
  // intocado). `"0.00" ?? null` nunca cai no fallback (a string é truthy
  // para `??`, que só substitui `null`/`undefined`) — o preview/validação de
  // líquido em `WeightCaptureStepForm` então rodava achando que o OUTRO peso
  // já era `0`, produzindo `netWeight` sempre negativo na Etapa 1 dos tipos
  // tara-primeiro (Venda/Saída, Avulsa) e bloqueando o "Avançar" 100%
  // client-side (nenhum `PUT next-step` saía).
  //
  // Fonte de verdade correta: `isFirstCapture` (já derivado de `next_status`,
  // a MESMA fonte única de etapa desta casca, nunca `status` bruto) — na
  // etapa 'inicial' o campo ativo é SEMPRE `captureOrder[0]`, o PRIMEIRO peso
  // da ordem por `type`, e o OUTRO peso (`captureOrder[1]`) literalmente
  // ainda não existe (nenhum PUT anterior o gravou) — `otherWeightValue`
  // deve ser sempre `null` aqui, independente do que a API tenha devolvido
  // como placeholder. Só na etapa 'final' o outro peso (capturado na etapa
  // 'inicial' por um PUT real anterior) é um número legítimo para a
  // validação/preview de peso líquido não-negativo (`DIM-CAL-001`).
  const otherWeightValue = isFirstCapture
    ? null
    : activeField === 'gross_weight'
      ? (hydration?.tare_weight ?? null)
      : (hydration?.gross_weight ?? null);

  // Pré-preenche a tara com a do equipamento só quando a tara da pesagem
  // ainda é 0 e a do cadastro é > 0 (`gross_weight` nunca é pré-preenchido).
  const initialWeightValue =
    activeField === 'tare_weight' &&
    !Number(hydration?.tare_weight) &&
    (hydration?.equipment_tara ?? 0) > 0
      ? (hydration?.equipment_tara ?? null)
      : null;

  function handleWeightSubmit(value: number) {
    const payload: AdvanceModuleWeighingStepPayload = { [activeField]: value };
    advanceMutation.mutate(payload);
  }

  // `discount_table_uuid`/`has_classification` NUNCA são aceitos pelo `PUT
  // next-step` real (`AdvanceModuleWeighingStepData` só declara `grossWeight`/
  // `tareWeight`/`classification`/`inputType` — a tabela de desconto é
  // fixada no pré-cadastro, `CreateOrUpdateModuleWeighing`, não nesta
  // etapa) — removidos do payload nesta correção (Bug 2).
  function handleClassificationSubmit(data: {
    classification: NonNullable<AdvanceModuleWeighingStepPayload['classification']>;
  }) {
    advanceMutation.mutate({ classification: data.classification });
  }

  const stepCounterLabel = `${text.wizard.stepCounter.label} ${idx + 1} ${text.wizard.stepCounter.of} ${steps.length}`;

  function renderStep() {
    if (!hydration || !currentStepKey) return null;

    if (currentStepKey === 'inicial') {
      return (
        <StepPesagemInicial
          formId={WEIGHT_FORM_ID}
          fieldLabel={activeFieldLabel}
          isGrossField={activeField === 'gross_weight'}
          otherWeight={otherWeightValue}
          initialWeight={initialWeightValue}
          onSubmitWeight={handleWeightSubmit}
          isSubmitting={advanceMutation.isPending}
        />
      );
    }
    if (currentStepKey === 'final') {
      return (
        <StepPesagemFinal
          formId={WEIGHT_FORM_ID}
          fieldLabel={activeFieldLabel}
          isGrossField={activeField === 'gross_weight'}
          otherWeight={otherWeightValue}
          initialWeight={initialWeightValue}
          onSubmitWeight={handleWeightSubmit}
          isSubmitting={advanceMutation.isPending}
        />
      );
    }
    return (
      <StepClassificacao
        formId={CLASSIFICATION_FORM_ID}
        grossWeight={hydration.gross_weight}
        discountTable={hydration.discount_table}
        discountRules={hydration.discount_rules}
        initialClassification={hydration.classification}
        onSubmitClassification={handleClassificationSubmit}
      />
    );
  }

  const isLoading = nextStepQuery.isPending;

  return (
    <FormContainer
      title={text.singularLabel}
      subtitle={
        hydration ? `${text.list.table.code}: ${hydration.code} — ${stepCounterLabel}` : undefined
      }
      footer={
        <>
          <Button
            title={text.wizard.footer.back}
            variant="outline"
            type="button"
            onClick={() => navigate(-1)}
            disabled={advanceMutation.isPending}
          />
          {currentStepKey && (
            <Button
              title={text.wizard.footer.next}
              type="submit"
              form={currentStepKey === 'classificacao' ? CLASSIFICATION_FORM_ID : WEIGHT_FORM_ID}
              loading={advanceMutation.isPending}
              disabled={advanceMutation.isPending || isLoading}
            />
          )}
        </>
      }
    >
      {isLoading ? (
        <Skeleton height="200px" borderRadius="md" />
      ) : (
        // Correção 050 (BUG-6) — este wrapper NUNCA foi um `<form>` de
        // verdade: `renderStep()` já entrega o ÚNICO `<form>` real do passo
        // (`WEIGHT_FORM_ID`/`CLASSIFICATION_FORM_ID`, dentro de
        // `WeightCaptureStepForm`/`StepClassificacao`). Envolver isso num
        // `<Form>` (componente que sempre renderiza `as="form"`) produzia
        // form-dentro-de-form (HTML inválido) e deixava a resolução do
        // "Avançar" (`type="submit" form={formId}`, fora de qualquer form,
        // no footer) ambígua entre navegadores — o clique caía no submit
        // NATIVO (GET para a própria URL), recarregando a etapa e zerando o
        // peso, sem nenhum `PUT next-step` sair. `Box` puro preserva o
        // mesmo layout (sem padding, igual a `noPadding` antes) sem criar
        // um segundo form.
        <Box width="full">
          <StepsRoot step={idx} count={steps.length}>
            <StepsList maxW="480px" mx="auto" mb={4}>
              {steps.map((key, i) => (
                <Steps.Item key={key} index={i} title={stepLabels[key]} indicatorSize="7" />
              ))}
            </StepsList>
            <Steps.Content index={idx}>{renderStep()}</Steps.Content>
          </StepsRoot>
        </Box>
      )}
    </FormContainer>
  );
}
