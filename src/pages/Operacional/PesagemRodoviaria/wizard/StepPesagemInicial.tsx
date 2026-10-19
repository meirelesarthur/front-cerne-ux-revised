// src/pages/Operacional/PesagemRodoviaria/wizard/StepPesagemInicial.tsx
// -----------------------------------------------------------------------------
// Etapa de Pesagem Inicial do wizard (`status=PesagemInicial`, FE-SCR-03,
// TASK-MWG-FE-05) — captura o PRIMEIRO peso da ordem determinada por `type`
// (tara primeiro para `Avulsa`/`VendaSaida`; bruto primeiro para os demais,
// `DIM-CAL-001`, contrato de API §5.2 — replicado exatamente, não
// simplificado). Componente de apresentação fino sobre
// `WeightCaptureStepForm` (mesma etapa estrutural de `StepPesagemFinal`,
// arquivos separados por rastreabilidade de Tarefa/contrato).
// -----------------------------------------------------------------------------

import { WeightCaptureStepForm, WeightCaptureStepFormProps } from './WeightCaptureStepForm';

export function StepPesagemInicial(props: WeightCaptureStepFormProps) {
  return <WeightCaptureStepForm {...props} />;
}

export default StepPesagemInicial;
