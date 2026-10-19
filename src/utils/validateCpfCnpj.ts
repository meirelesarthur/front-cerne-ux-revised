// src/utils/validateCpfCnpj.ts
// -----------------------------------------------------------------------------
// RE-EXPORT FINO — o checksum mod-11 de CPF/CNPJ (TASK-CT-FIX-02) foi
// canonizado em `src/utils/masks/document.ts::isValidCpf/isValidCnpj/
// isValidCpfCnpj` (97-Esteiras/001, Wave 0/1 — ver
// `CORE_WORKSPACE/97-Esteiras/001/CONTRATOS/02-Mapa-Consolidacao.md` §2).
// Este arquivo é o util CANÔNICO de origem (mesmo algoritmo, byte-a-byte) —
// vira re-export fino para que os callsites atuais (`config-schema.ts`,
// `CreateOrUpdateFuncionario.tsx`, `contador-schema.ts` etc.) não mudem
// nenhuma linha.
// -----------------------------------------------------------------------------

export { isValidCpf, isValidCnpj, isValidCpfCnpj } from './masks/document';
