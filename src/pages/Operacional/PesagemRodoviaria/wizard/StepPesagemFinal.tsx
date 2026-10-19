// src/pages/Operacional/PesagemRodoviaria/wizard/StepPesagemFinal.tsx
// -----------------------------------------------------------------------------
// Etapa de Pesagem Final do wizard (`status=PesagemFinal`, FE-SCR-03,
// TASK-MWG-FE-05) — captura o SEGUNDO peso da ordem determinada por `type`
// (o que faltou na etapa inicial). Componente de apresentação fino sobre
// `WeightCaptureStepForm` (mesma etapa estrutural de `StepPesagemInicial`,
// arquivos separados por rastreabilidade de Tarefa/contrato).
// -----------------------------------------------------------------------------

import { WeightCaptureStepForm, WeightCaptureStepFormProps } from './WeightCaptureStepForm';

export function StepPesagemFinal(props: WeightCaptureStepFormProps) {
  return <WeightCaptureStepForm {...props} />;
}

export default StepPesagemFinal;
