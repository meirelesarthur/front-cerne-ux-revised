import { isAxiosError } from 'axios';

import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';

// Respostas de operações SEFAZ (manifestação / consulta de CT-e) trazem
// `errors: { cStat, motivo }` — que é o STATUS do webservice, NÃO um erro de
// validação por campo do Laravel (`{ campo: [mensagens] }`). O
// `extractApiErrorMessage` genérico percorre `errors` e devolve o 1º campo — o
// `cStat` (ex.: "000") — como se fosse a mensagem, resultando num toast pouco
// claro ("... 000"). Aqui priorizamos o `motivo` (texto claro, ex.: "Emissor
// sem certificado digital configurado.") e, na sequência, o `message` já
// composto pelo backend ("Operação não realizada (000 - ...)."). Só então cai
// no extrator genérico e no fallback do chamador.
export function extractSefazErrorMessage(error: unknown): string | undefined {
  const data = isAxiosError(error) ? (error.response?.data as Record<string, any>) : undefined;

  const motivo = data?.errors?.motivo;
  if (typeof motivo === 'string' && motivo.trim()) return motivo;

  if (typeof data?.message === 'string' && data.message.trim()) return data.message;

  return extractApiErrorMessage(error);
}
