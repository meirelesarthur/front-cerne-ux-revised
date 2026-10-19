// src/pages/Operacional/PesagemRodoviaria/wizard/WeightCaptureStepForm.tsx
// -----------------------------------------------------------------------------
// Corpo compartilhado das etapas de captura de peso do wizard
// (`StepPesagemInicial`/`StepPesagemFinal`, TASK-MWG-FE-05) — campo de peso
// ativo (bruto OU tara, conforme a etapa/`type`) + botão "Capturar peso"
// (`useModuleWeighingScale`, `TASK-MWG-FE-04`) + preview de peso líquido
// (client-side, `CONTRATO-TELA-PESAGEM-FE §6.1` — nunca a fonte oficial).
//
// DECISÃO DO EXECUTOR (documentada, não é Gap): cada etapa tem seu PRÓPRIO
// `useForm` de campo único (`weight`), em vez de um único form global para
// o wizard inteiro (padrão do único wizard client-side existente,
// `CreateOrUpdateFarm`) — o wizard de Pesagem é SERVER-DRIVEN (cada
// "Avançar" é uma mutação real, `PUT next-step`), então não há necessidade
// de compartilhar `dirtyFields`/validação entre etapas que nunca coexistem
// na tela ao mesmo tempo.
//
// D3 (correção 050, fidelidade/segurança) — o legado (`initial-weighing.blade:10`/
// `final-weighing.blade:10`) trava o campo de peso (bruto/tara) em READONLY a
// menos que o usuário tenha a permissão `module-weighing_manual_weight`; sem
// ela, só o botão "Capturar peso" (balança) preenche o valor. `KgInput`
// estava sempre editável — gate reintroduzido aqui via `usePermissions`.
// -----------------------------------------------------------------------------

import { ElementType, useState } from 'react';

import { Flex, Heading, Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';
import { FiHelpCircle } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { Form } from '@/components/Form';
import { KgInput } from '@/components/Form/kgInput';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import formatWeight from '@/utils/formatWeight';

import { moduleWeighingWizardStepSchemaResolver } from '@/validations/schemas/ModuleWeighing/wizard-step-schema';

import { ScaleConnectionBadge } from '../components/ScaleConnectionBadge';
import { ScaleTutorialDialog } from '../dialogs/ScaleTutorialDialog';
import { useModuleWeighingScale } from '../hooks/useModuleWeighingScale';

export interface WeightCaptureStepFormProps {
  formId: string;
  fieldLabel: string;
  /** `true` quando o campo ativo é `gross_weight` (peso bruto); `false`
   *  quando é `tare_weight` (tara) — usado pela validação de peso líquido
   *  não-negativo (`netWeight = gross - tare`). */
  isGrossField: boolean;
  /** Valor do OUTRO peso, já persistido em etapa anterior (ou `null` se
   *  ainda não capturado) — só para a validação/preview de líquido. */
  otherWeight: number | null;
  /** Valor inicial do campo (tara do equipamento, quando aplicável). */
  initialWeight?: number | null;
  onSubmitWeight: (value: number) => void;
  isSubmitting: boolean;
}

export function WeightCaptureStepForm({
  formId,
  fieldLabel,
  isGrossField,
  otherWeight,
  initialWeight = null,
  onSubmitWeight,
  isSubmitting,
}: WeightCaptureStepFormProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.moduleWeighing.moduleWeighing;
  const { can } = usePermissions();
  // D3 — mirror `initial/final-weighing.blade:10`: sem a permissão, o campo
  // é READONLY (só a balança preenche); a permissão NÃO limita o botão
  // "Capturar peso" (`scale.captureWeight`), que segue `preencher via
  // setValue` normalmente mesmo com o campo travado para digitação manual.
  const canManualWeight = can('module-weighing_manual_weight');

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<{ weight: number | null }>({
    mode: 'onChange',
    resolver: moduleWeighingWizardStepSchemaResolver(languageGB),
    context: { otherWeight, isGrossField },
    defaultValues: { weight: initialWeight },
  });

  const watchWeight = watch('weight');
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  // Correção 050 (F4) — título da ETAPA por CONTEÚDO capturado, fiel ao
  // `card-title` do legado (`steps/initial-weighing.blade`/
  // `steps/final-weighing.blade`) — "Tara do Veículo"/"Peso Total", nunca um
  // rótulo genérico de posição da etapa (`isGrossField` já é a MESMA fonte
  // usada pela casca para decidir o campo ativo, `WizardModuleWeighingShell`).
  const stepTitle = isGrossField ? text.wizard.stepTitles.gross : text.wizard.stepTitles.tare;

  const scale = useModuleWeighingScale({
    onWeightReceived: (value) =>
      setValue('weight', value, { shouldValidate: true, shouldDirty: true }),
  });

  function onSubmit(data: { weight: number | null }) {
    if (data.weight == null) return;
    onSubmitWeight(data.weight);
  }

  const netWeightPreview =
    watchWeight != null && otherWeight != null
      ? isGrossField
        ? watchWeight - otherWeight
        : otherWeight - watchWeight
      : null;

  return (
    <Form id={formId} onSubmit={handleSubmit(onSubmit)}>
      <Heading size="md" fontWeight="semibold" mb={4}>
        {stepTitle}
      </Heading>

      <Flex direction="column" gap={4} maxW="420px">
        <Controller
          name="weight"
          control={control}
          render={({ field }) => (
            <KgInput
              name={field.name}
              label={fieldLabel}
              isRequired
              allowDot
              decimalPlaces={2}
              value={field.value ?? ''}
              onChange={(_event, _masked, floatValue) => field.onChange(floatValue)}
              error={errors.weight?.message}
              onBlur={scale.markManualInput}
              disabled={isSubmitting}
              isReadOnly={!canManualWeight}
            />
          )}
        />

        <Flex align="center" gap={3}>
          <Button
            type="button"
            variant="outline"
            title={text.scaleConnection.captureButton}
            onClick={scale.captureWeight}
            loading={scale.status === 'connecting'}
          />
          <ScaleConnectionBadge
            status={scale.status}
            labels={{
              connecting: text.scaleConnection.connecting,
              connected: text.scaleConnection.connected,
              disconnected: text.scaleConnection.disconnected,
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            title={text.scaleTutorial.helpButton}
            icon={FiHelpCircle as ElementType}
            onClick={() => setIsTutorialOpen(true)}
          />
        </Flex>

        {netWeightPreview != null && (
          <Text fontSize="sm" color="fg.muted">
            {text.wizard.fields.netWeightPreview}: {formatWeight(netWeightPreview)}
          </Text>
        )}

        {/* Botão "Avançar" real vive no FOOTER da casca (`WizardModuleWeighingShell`),
            FORA deste `<Form>`, ligado por `type="submit" form={formId}` —
            mecanismo canônico (`get_pwa_form_query_pattern`). `isSubmitting`
            é repassado só para o `KgInput`/campos ficarem consistentes com o
            estado de rede durante o envio. */}
      </Flex>

      <ScaleTutorialDialog
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        scaleStatus={scale.status}
      />
    </Form>
  );
}

export default WeightCaptureStepForm;
