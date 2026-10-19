// src/utils/format-document.ts
// -----------------------------------------------------------------------------
// RE-EXPORT FINO — a formatação progressiva de CPF/CNPJ (TASK-CT-FIX
// cnpj-letras) foi canonizada em `src/utils/masks/document.ts::
// formatCpfCnpjProgressive` (97-Esteiras/001, Wave 0/1 — mesmo algoritmo,
// byte-a-byte — ver `02-Mapa-Consolidacao.md` §2). Este arquivo é o util
// CANÔNICO de origem, mantém o mesmo nome de export (`formatDocument`) e a
// mesma assinatura `(raw: string) => string` — o callsite ainda em uso
// (`CreateOrUpdateContador.tsx`, campo `cnpj`, até ser trocado por
// `<MaskedInput kind="cnpj">` direto) não muda nenhuma linha.
// -----------------------------------------------------------------------------

import { formatCpfCnpjProgressive } from './masks/document';

export { formatCpfCnpjProgressive as formatDocument } from './masks/document';

export default formatCpfCnpjProgressive;
