// src/constants/FiscalCatalogs.ts
// -----------------------------------------------------------------------------
// Catálogos estáticos de CST/CSOSN/COFINS/PIS/IPI — GAP-FE-110 (Opção 1,
// default aprovado: hardcode espelhado, sem endpoint dedicado no backend).
//
// Copiado 1:1 de `app/Support/Fiscal/CstCatalog.php` (api_root, commit
// `fb204f231`, TASK-BE-300) — mesma chave/descrição, SEM alteração de
// nenhum código (fidelidade estrita ao legado, `Issue::listaCST()`/
// `listaCST_PIS_COFINS()`/`listaCST_IPI()`). Consumido pelos 4 Selects
// obrigatórios do bloco fiscal (`cst_csosn_padrao`/`cst_cofins_padrao`/
// `cst_pis_padrao`/`cst_ipi_padrao`, TASK-FE-323) — os `value` aqui são
// SEMPRE string (o backend valida com `Rule::in(array_keys(...))`, que
// compara de forma não-estrita — uma string bate contra a chave int/string
// do array PHP).
//
// ⚠️ Risco de drift documentado no próprio GAP-FE-110: se o backend um dia
// adicionar/remover um código sem avisar o front, este arquivo pode ficar
// desatualizado — reconferir contra `app/Support/Fiscal/CstCatalog.php`
// sempre que o módulo fiscal for tocado novamente.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// CST/CSOSN de ICMS (`cst_csosn_padrao`) — CstCatalog::csosn().
export const CSOSN_CATALOG: Option<string>[] = [
  { value: '00', label: '00 - Tributa integralmente' },
  { value: '10', label: '10 - Tributada e com cobrança do ICMS por substituição tributária' },
  { value: '20', label: '20 - Com redução da Base de Calculo' },
  {
    value: '30',
    label: '30 - Isenta / não tributada e com cobrança do ICMS por substituição tributária',
  },
  { value: '40', label: '40 - Isenta' },
  { value: '41', label: '41 - Não tributada' },
  { value: '50', label: '50 - Com suspensão' },
  { value: '51', label: '51 - Com diferimento' },
  { value: '60', label: '60 - ICMS cobrado anteriormente por substituição tributária' },
  { value: '70', label: '70 - Com redução da BC e cobrança do ICMS por substituição tributária' },
  { value: '90', label: '90 - Outras' },
  { value: '101', label: '101 - Tributada pelo Simples Nacional com permissão de crédito' },
  { value: '102', label: '102 - Tributada pelo Simples Nacional sem permissão de crédito' },
  {
    value: '103',
    label: '103 - Isenção do ICMS no Simples Nacional para faixa de receita bruta',
  },
  {
    value: '201',
    label:
      '201 - Tributada pelo Simples Nacional com permissão de crédito e com cobrança do ICMS por substituição tributária',
  },
  {
    value: '202',
    label:
      '202 - Tributada pelo Simples Nacional sem permissão de crédito e com cobrança do ICMS por substituição tributária',
  },
  {
    value: '203',
    label:
      '203 - Isenção do ICMS no Simples Nacional para faixa de receita bruta e com cobrança do ICMS por substituição tributária',
  },
  { value: '300', label: '300 - Imune' },
  { value: '400', label: '400 - Não tributada pelo Simples Nacional' },
  {
    value: '500',
    label:
      '500 - ICMS cobrado anteriormente por substituição tributária (substituído) ou por antecipação',
  },
  { value: '900', label: '900 - Outros' },
];

// CST de PIS/COFINS (`cst_pis_padrao`/`cst_cofins_padrao`) — CstCatalog::cofinsPis().
export const COFINS_PIS_CATALOG: Option<string>[] = [
  { value: '01', label: '01 - Operação Tributável com Alíquota Básica' },
  { value: '02', label: '02 - Operação Tributável com Alíquota por Unidade de Medida de Produto' },
  { value: '03', label: '03 - Operação Tributável com Alíquota por Unidade de Medida de Produto' },
  { value: '04', label: '04 - Operação Tributável Monofásica – Revenda a Alíquota Zero' },
  { value: '05', label: '05 - Operação Tributável por Substituição Tributária' },
  { value: '06', label: '06 - Operação Tributável a Alíquota Zero' },
  { value: '07', label: '07 - Operação Isenta da Contribuição' },
  { value: '08', label: '08 - Operação sem Incidência da Contribuição' },
  { value: '09', label: '09 - Operação com Suspensão da Contribuição' },
  { value: '49', label: '49 - Outras Operações de Saída' },
];

// CST de IPI (`cst_ipi_padrao`) — CstCatalog::ipi().
export const IPI_CATALOG: Option<string>[] = [
  { value: '50', label: '50 - Saída Tributada' },
  { value: '51', label: '51 - Saída Tributável com Alíquota Zero' },
  { value: '52', label: '52 - Saída Isenta' },
  { value: '53', label: '53 - Saída Não Tributada' },
  { value: '54', label: '54 - Saída Imune' },
  { value: '55', label: '55 - Saída com Suspensão' },
  { value: '99', label: '99 - Outras Saídas' },
];

// -----------------------------------------------------------------------------
// TASK-FE-507 (Produtos — bloco fiscal, execução 025) — 4 catálogos ACRESCENTADOS
// (append, nenhuma linha acima foi alterada). Extraídos 1:1 dos Enums PHP REAIS
// do backend (`app/Enums/TaxRule/*.php`, lidos diretamente em `api_root` — não
// da Doc Bruta/estimativa), confirmados por `Product-contrato.md` §2/§9 (D9,
// bloco fiscal de Product reaproveita os 7 Enums de `TaxRule` tal qual).
// `origem`/`modality_bc`/`tp_cred_pres_ibs_zfm` são `Option<number>` (coluna
// física `integer`/`smallint`, `ProductRequest::rules()` valida `'integer'`,
// mesmo os Enums de origem serem backed `string` no PHP — o Resource já faz
// `tryFrom((string) $this->origem)`, cast interno só para casar o Enum; o
// contrato de payload do lado do front continua inteiro, mesmo padrão já
// usado por `CreateOrUpdateRegraFiscal.tsx` para estes 3 campos idênticos).
// `cst_ibs_cbs` é `Option<string>` (coluna `varchar(3)`, igual a CSOSN/PIS/IPI).
// -----------------------------------------------------------------------------

// Origem da mercadoria (`origem`) — App\Enums\TaxRule\OrigemMercadoriaEnum (9 opções).
export const ORIGEM_CATALOG: Option<number>[] = [
  { value: 0, label: '0 - NACIONAL' },
  { value: 1, label: '1 - ESTRANGEIRA - IMPORTAÇÃO DIRETA' },
  { value: 2, label: '2 - ESTRANGEIRA - ADQUIRIDA NO MERCADO INTERNO' },
  {
    value: 3,
    label: '3 - NACIONAL, MERCADORIA OU BEM COM CONTEÚDO DE IMPORTAÇÃO SUPERIOR A 40%',
  },
  {
    value: 4,
    label:
      '4 - NACIONAL, CUJA PRODUÇÃO TENHA SIDO FEITA EM CONFORMIDADE COM OS PROCESSOS PRODUTIVOS BÁSICOS DE QUE TRATAM O DECRETO-LEI Nº 288/67, E AS LEIS NºS 8.248/91, 8.387/91, 10.176/01 E 11.484/07',
  },
  {
    value: 5,
    label: '5 - NACIONAL, MERCADORIA OU BEM COM CONTEÚDO DE IMPORTAÇÃO INFERIOR OU IGUAL A 40%',
  },
  {
    value: 6,
    label:
      '6 - ESTRANGEIRA - IMPORTAÇÃO DIRETA, SEM SIMILAR NACIONAL, CONSTANTE EM LISTA DE RESOLUÇÃO CAMEX',
  },
  {
    value: 7,
    label:
      '7 - ESTRANGEIRA - ADQUIRIDA NO MERCADO INTERNO, SEM SIMILAR NACIONAL, CONSTANTE EM LISTA DE RESOLUÇÃO CAMEX',
  },
  {
    value: 8,
    label: '8 - NACIONAL, MERCADORIA OU BEM COM CONTEUDO DE IMPORTACAO SUPERIOR A 70%',
  },
];

// Modalidade da BC do ICMS (`modality_bc`) — App\Enums\TaxRule\ModalityBcEnum (4 opções).
export const MODALITY_BC_CATALOG: Option<number>[] = [
  { value: 0, label: '0 - Margem Valor Agregado (%)' },
  { value: 1, label: '1 - Pauta (Valor)' },
  { value: 2, label: '2 - Preço Tabelado Máx. (valor)' },
  { value: 3, label: '3 - Valor da operação' },
];

// CST IBS/CBS — Reforma Tributária (`cst_ibs_cbs`) — App\Enums\TaxRule\CstIbsCbsEnum (18 opções).
export const CST_IBS_CBS_CATALOG: Option<string>[] = [
  { value: '000', label: '000 - Tributação integral' },
  { value: '010', label: '010 - Tributação com alíquotas uniformes' },
  { value: '011', label: '011 - Tributação com alíquotas uniformes reduzidas' },
  { value: '200', label: '200 - Alíquota reduzida' },
  { value: '220', label: '220 - Alíquota fixa' },
  { value: '221', label: '221 - Alíquota fixa proporcional' },
  { value: '222', label: '222 - Redução de Base de Cálculo' },
  { value: '400', label: '400 - Isenção' },
  { value: '410', label: '410 - Imunidade e não incidência' },
  { value: '510', label: '510 - Diferimento' },
  { value: '515', label: '515 - Diferimento com redução de alíquota' },
  { value: '550', label: '550 - Suspensão' },
  { value: '620', label: '620 - Tributação Monofásica' },
  { value: '800', label: '800 - Transferência de crédito' },
  { value: '810', label: '810 - Ajuste de IBS na ZFM' },
  { value: '811', label: '811 - Ajustes' },
  { value: '820', label: '820 - Tributação em documento específico' },
  { value: '830', label: '830 - Exclusão da Base de Cálculo' },
];

// Tipo de crédito presumido IBS na ZFM (`tp_cred_pres_ibs_zfm`) —
// App\Enums\TaxRule\TpCredPresIbsZfmEnum (5 opções).
export const TP_CRED_PRES_IBS_ZFM_CATALOG: Option<number>[] = [
  { value: 0, label: '0 - Sem Crédito Presumido' },
  { value: 1, label: '1 - Bens de consumo final (55%)' },
  { value: 2, label: '2 - Bens de capital (75%)' },
  { value: 3, label: '3 - Bens intermediários (90,25%)' },
  { value: 4, label: '4 - Bens de informática (100%)' },
];

// C1 (D-101-19): catalogo motDesICMS por CST.
export {
  MOT_DES_ICMS_BY_CST,
  getMotDesIcmsOptions,
  isMotDesIcmsValidForCst,
} from './Fiscal/mot-des-icms-catalog';
