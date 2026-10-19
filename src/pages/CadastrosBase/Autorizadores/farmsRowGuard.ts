// src/pages/CadastrosBase/Autorizadores/farmsRowGuard.ts
// -----------------------------------------------------------------------------
// Regras da tabela "Fazendas" do formulário de Autorizador, iguais ao legado
// (`_forms.blade.php` + `resources/js/main.js`), isoladas em funções puras
// para teste unitário (T-081-FE-02, PAR-32/33/35):
//   - "Adicionar" é bloqueado quando alguma linha tem campo vazio
//     ("Preencha todos os campos antes de adicionar novos.");
//   - a última linha nunca é removida ("Você deve ter ao menos um item na lista");
//   - a linha nova começa com Fazenda e Nível em "Selecione" (vazios).
// -----------------------------------------------------------------------------

import type { RequestAuthorizerFarmFormItem } from '@/@types/v2/RequestAuthorizers';

// Linha nova: Fazenda e Nível em "Selecione".
export const emptyFarmRow = (): RequestAuthorizerFarmFormItem => ({
  farm_uuid: '',
  level: null,
});

const isFilled = (row: RequestAuthorizerFarmFormItem | undefined): boolean =>
  !!row && !!row.farm_uuid && row.level !== null && row.level !== undefined;

// `true` quando todas as linhas existentes estão completas (pode adicionar outra).
export function canAddFarmRow(rows: readonly (RequestAuthorizerFarmFormItem | undefined)[]) {
  return rows.every(isFilled);
}

// `true` quando há mais de uma linha (a última nunca é removida).
export function canRemoveFarmRow(rowCount: number) {
  return rowCount > 1;
}
