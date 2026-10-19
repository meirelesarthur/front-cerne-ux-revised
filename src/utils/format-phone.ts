// src/utils/format-phone.ts
// -----------------------------------------------------------------------------
// Formatador MANUAL (sem lib de máscara) de telefone para uso em `onChange`
// de campo controlado, espelhando `src/utils/format-document.ts`
// (TASK-CT-FIX cnpj-letras). Substitui `InputMask` (`react-input-mask@3.0.0-
// alpha.2`) no campo `fone` de `CreateOrUpdateContador.tsx` — a MESMA lib
// alpha que quebrou o CPF/CNPJ.
//
// Util PURO: recebe o valor cru do input a cada tecla, remove tudo que não é
// dígito (`cleanMask` primeiro tira pontuação/máscara antiga, o
// `.replace(/\D/g, '')` extra garante que NENHUMA letra sobreviva) e reaplica
// os separadores progressivamente, dígito a dígito — SEM espaço após o
// parêntese do DDD — fixo `(DD)XXXX-XXXX` (até 10 dígitos) ou celular
// `(DD)XXXXX-XXXX` (11 dígitos), sem exigir o número já completo.
// -----------------------------------------------------------------------------

import cleanMask from '@/utils/clean-mask';

/**
 * Formata progressivamente um telefone (fixo ou celular) a partir do valor
 * cru digitado. Sempre retorna só dígitos + separadores (nunca letras) — o
 * teto é de 11 dígitos (celular com DDD). Formato exato SEM espaço após o
 * parêntese: fixo `(DD)XXXX-XXXX`, celular `(DD)XXXXX-XXXX`.
 * @param {string} raw - Valor cru vindo do evento de `onChange` do input.
 * @return {string} Telefone formatado, pronto para exibição.
 */
export function formatPhone(raw: string): string {
  const d = cleanMask(raw ?? '')
    .replace(/\D/g, '')
    .slice(0, 11);

  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)})${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)})${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)})${d.slice(2, 7)}-${d.slice(7)}`;
}

export default formatPhone;
