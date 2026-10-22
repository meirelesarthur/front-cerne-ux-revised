// src/components/ui/StepFooter.tsx
// Rodapé padrão de formulário multi-etapas — porte fiel de `StepFooter.tsx` do
// design system `cerne`: contador "Etapa X de N" à esquerda; à direita, Voltar
// (secundário) e Próximo/Salvar (primário), ambos com largura mínima de 190px
// (`t.size.stepBtn`). Vai no slot `footer` do `FormContainer`.
//
// Textos chegam por props (i18n é responsabilidade de quem chama — `languageGB`
// com caminho completo); o componente não tem string própria.

import { Box, Flex, Text } from '@chakra-ui/react';

import { Button } from '@/components/Button';

const STEP_BUTTON_MIN_WIDTH = '190px'; // DS: t.size.stepBtn

export interface StepFooterProps {
  /** Contador já traduzido (ex.: "Etapa 2 de 6"). */
  stepLabel: string;
  backLabel: string;
  nextLabel: string;
  onBack: () => void;
  onNext: () => void;
  /** Desabilita o Voltar (ex.: durante o envio). */
  backDisabled?: boolean;
  /** Spinner + desabilitado no botão principal (evita double-submit). */
  nextLoading?: boolean;
  nextDisabled?: boolean;
  /** Esconde o botão principal (ex.: sem permissão de salvar). */
  hideNext?: boolean;
}

export function StepFooter({
  stepLabel,
  backLabel,
  nextLabel,
  onBack,
  onNext,
  backDisabled,
  nextLoading = false,
  nextDisabled,
  hideNext = false,
}: StepFooterProps) {
  return (
    <Box width="full" display="flex" alignItems="center" justifyContent="space-between" gap={4}>
      <Text fontSize="base" color="fg.muted">
        {stepLabel}
      </Text>

      <Flex gap="8px">
        <Button
          title={backLabel}
          variant="secondary"
          type="button"
          minW={STEP_BUTTON_MIN_WIDTH}
          onClick={onBack}
          disabled={backDisabled}
        />
        {!hideNext && (
          <Button
            title={nextLabel}
            type="button"
            minW={STEP_BUTTON_MIN_WIDTH}
            onClick={onNext}
            loading={nextLoading}
            disabled={nextDisabled ?? nextLoading}
          />
        )}
      </Flex>
    </Box>
  );
}

export default StepFooter;
