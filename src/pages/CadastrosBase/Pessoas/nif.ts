// src/pages/CadastrosBase/Pessoas/nif.ts
// -----------------------------------------------------------------------------
// RE-EXPORT FINO — os helpers puros de detecção/checksum/formatação de
// CPF/CNPJ migraram para o módulo canônico `src/utils/masks/document.ts`
// (97-Esteiras/001, Wave 1 — ver `02-Mapa-Consolidacao.md` §2). O único
// helper SEM equivalente no módulo novo é o resgate `beforeMaskedStateChange`
// do `react-input-mask` (`nifBeforeMaskedStateChange`) — continua vindo do
// adaptador `@/utils/cpfCnpj` (mantido ali justamente para os consumidores de
// `InputMask`/máscara dinâmica que ainda dependem da lib).
//
// Este arquivo só re-exporta com os NOMES DE DOMÍNIO que `StepDadosBasicos.tsx`,
// `StepFuncionario.tsx`, `pessoa-schema.ts` e `index.tsx` (Pessoas) já
// importam — NENHUM desses consumidores precisa mudar uma linha (a tela de
// NIF do wizard de Pessoas continua fora do escopo desta Wave 1, que só
// migra o COMPONENTE `MaskedInput` para as telas listadas no roteiro).
// -----------------------------------------------------------------------------

import { cpfCnpjBeforeMaskedStateChange } from '@/utils/cpfCnpj';
import {
  docTypeOfDigits,
  formatCpfCnpjProgressive,
  isValidCpfCnpj,
  maskDocTypeOfDigits,
  onlyDigits,
  type DocType,
} from '@/utils/masks/document';

export type NifDocType = DocType;

export { onlyDigits };

// Detecta CPF/CNPJ pela quantidade de dígitos preenchidos.
export const docTypeOfNif = docTypeOfDigits;

// `true` para CNPJ (Pessoa Jurídica); `false` para CPF/indefinido (Pessoa Física).
export function isPersonPJ(nif: string): boolean {
  return docTypeOfDigits(nif) === 'cnpj';
}

// Heurística de SELEÇÃO DE MÁSCARA em tempo de digitação — mesmo critério de
// sempre (`>11` dígitos → CNPJ), agora sourced do módulo canônico.
export const maskDocTypeOfNif = maskDocTypeOfDigits;

// `beforeMaskedStateChange` do `react-input-mask` — resgata o 12º dígito
// (react-input-mask-specific, sem equivalente em `masks/document.ts` por
// design — `MaskedInput` não usa a lib, ver contrato §5).
export const nifBeforeMaskedStateChange = cpfCnpjBeforeMaskedStateChange;

// Valida CPF (11) ou CNPJ (14) incluindo dígitos verificadores. Equivalente
// a `isValidCpfCnpj` do módulo canônico (mesma classificação por contagem de
// dígitos, mesmos algoritmos de dígito verificador).
export const isValidNif = isValidCpfCnpj;

// Máscara de exibição — antes via `utils/formatDocument.ts` (antigo,
// `documentType` resolvido de antemão); agora via `formatCpfCnpjProgressive`
// do módulo canônico, que já infere CPF/CNPJ pelo comprimento (torna o
// parâmetro `documentType` redundante). Mesma assinatura pública
// `(nif: string) => string`.
export function maskNif(nif: string): string {
  return formatCpfCnpjProgressive(nif);
}
