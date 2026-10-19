// ERRO sinalizado pelo Executor durante TASK-FE-333 (execução 023): a ordem
// original removia a vírgula decimal ANTES de convertê-la em ponto (a regex
// de limpeza `[^\d.-]+` não incluía `,` no allowlist), então
// `transformStringToNumber("12,5")` retornava `125` (10x maior), não `12.5`.
// Ordem corrigida: (1) mantém dígitos/vírgula/ponto/sinal, descartando
// símbolo de moeda/espaços/etc.; (2) remove o separador de milhar `.`
// (convenção pt-BR); (3) troca a vírgula decimal por ponto; (4) `parseFloat`.
// Casos cobertos manualmente (sem suíte de utils no projeto — ver Histórico
// de TASK-FE-333): "12,5"->12.5; "1.234,56"->1234.56; "100"->100; "33,33"->33.33.
export default function transformStringToNumber(value: string | number): number {
  if (value === null || value === undefined) {
    return 0;
  }

  const result =
    typeof value === 'string'
      ? parseFloat(
          value
            .replace(/[^\d,.-]+/g, '')
            .replace(/\./g, '')
            .replace(/,/g, '.')
        )
      : value;

  if (Number.isNaN(result)) {
    return 0;
  }
  return result;
}
