// Próximo código sequencial da transferência de módulo/área (mirror
// `_card_animal.blade.php` `handleBatch()`), a partir do último `code`
// devolvido por `GET .../module-area/last`.
//
// O último código pode vir NÃO numérico: o pastejo grava `uniqid()` (hex de
// 13 chars, ex.: `6ac7a6d041c2d`) na mesma tabela. Sem histórico ou com código
// não numérico = '0001' (evita "0000000000NaN").
const NUMERIC_CODE = /^[0-9]+$/;

export function computeNextTransferCode(lastCode?: string | null): string {
  if (!lastCode || !NUMERIC_CODE.test(lastCode)) return '0001';
  return (Number(lastCode) + 1).toString().padStart(lastCode.length, '0');
}
