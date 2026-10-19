// src/constants/Fiscal/nfe-fiscal-catalogs.ts
// -----------------------------------------------------------------------------
// Catalogos fiscais ESTATICOS do formulario de NFe Emitida (rework de
// FIDELIDADE pos-homologacao, audit-nfe-emitidas.md) — mirror 1:1 dos enums
// hardcoded do legado agro365 (`app/Nfe.php:127-288`, `app/Product.php`
// `listaCSTCSOSN`/`listaCST_PIS_COFINS`/`listaCST_IPI`/`listaCenqIPI`/
// `origens`), sem endpoint novo (sao enums fixos do dominio fiscal
// brasileiro, nao dados de negocio). SEM i18n — mesmo precedente de
// `uf-options.ts` (siglas/codigos fiscais sao invariantes de dominio,
// legado tambem nao traduz a maior parte destes catalogos).
//
// Fontes:
// - Operacao (tipo): `_forms.blade.php:47-50` (Entrada=0/Saida=1).
// - Finalidade (finnfe): `App\NatureOperation::finalidades()` + `trad.no1-4`.
// - Tipo de Guia: `App\Nfe::typeGuides()`.
// - Tipo de frete (shipping_type): `App\Nfe::shippingTypes()` + `trad.cte_emi`/
//   `var_dest`/`no_terceiros`/`no_sfrete`.
// - Tipo pagamento/debito/credito: `App\Nfe::typesPayment()/typeDebts()/
//   typeCredits()` + `trad.pagNN`.
// - CST/CSOSN, CST PIS/COFINS, CST IPI, Enquadramento IPI, Origem:
//   `App\Product::listaCSTCSOSN()/listaCST_PIS_COFINS()/listaCST_IPI()/
//   listaCenqIPI()/origens()`.
// - Modalidade BC do ICMS, CST IBS/CBS, Credito Presumido ZFM, Indicador de
//   Doacao (Reforma Tributaria — sem equivalente em `App\Nfe`/`App\Product`,
//   selects hardcoded diretamente em `_card-item.blade.php:172-333`).
//
// Tipagem por valor: `tipo`/`finnfe`/`shipping_type`/`modality_bc`/
// `tp_cred_pres_ibs_zfm` sao inteiros no contrato da API (`NfeRequest::
// rules()`) — `Option<number>`. Os demais sao strings de tamanho fixo
// (`type_payment`/`type_debt`/`type_credit` max:2, `type_guide`/`origem`/
// `ind_doacao` max:1, `cst_ibs_cbs` max:3, `cenq_ipi`/`cst_csosn`/`cst_pis`/
// `cst_cofins`/`cst_ipi` sem limite curto) — `Option<string>`.
// -----------------------------------------------------------------------------

import { Option } from '@/@types/option';

// Operacao (tipo) — Entrada/Saida, `_forms.blade.php:47-50`. Filtra a
// Natureza de Operacao via `tipo` (D-01 do audit).
export const nfeTipoOperacaoOptions: Option<number>[] = [
  { value: 0, label: 'Entrada' },
  { value: 1, label: 'Saída' },
];

// Tipo Emissao (type_emission) — mirror `App\Nfe::emissions()`
// (`_forms.blade.php:61-66`, default legado `1` — "Emissao normal"). Rework
// de fidelidade (E2E do dono, esteira 036fix5): campo ausente no cerne,
// backend habilitando a persistencia em paralelo (`type_emission` agora
// modelado em `@/@types/v2/Nfes`).
export const nfeTypeEmissionOptions: Option<number>[] = [
  { value: 1, label: '1 - Emissão normal' },
  { value: 6, label: '6 - Contingência SVC-AN' },
  { value: 7, label: '7 - Contingência SVC-RS' },
];

// Finalidade da NFe (finnfe) — `App\NatureOperation::finalidades()` +
// `trad.no1-4`. financas 5/6 disparam Tipo Credito/Debito (E-11 do audit).
export const nfeFinalidadeOptions: Option<number>[] = [
  { value: 1, label: '1 - NF-e normal' },
  { value: 2, label: '2 - NF-e complementar' },
  { value: 3, label: '3 - NF-e de ajuste' },
  { value: 4, label: '4 - Devolução/Retorno' },
  { value: 5, label: '5 - Nota de crédito' },
  { value: 6, label: '6 - Nota de débito' },
];

// Modalidade da Base de Calculo do ICMS — `_card-item.blade.php:173-178`.
export const nfeModalidadeBcOptions: Option<number>[] = [
  { value: 0, label: '0 - Margem Valor Agregado (%)' },
  { value: 1, label: '1 - Pauta (Valor)' },
  { value: 2, label: '2 - Preço Tabelado Máx. (valor)' },
  { value: 3, label: '3 - Valor da operação' },
];

// CST IBS/CBS (Reforma Tributaria) — `_card-item.blade.php:211-231`.
export const nfeCstIbsCbsOptions: Option<string>[] = [
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

// Credito Presumido ZFM (tp_cred_pres_ibs_zfm) — `_card-item.blade.php:317-326`.
export const nfeTpCredPresIbsZfmOptions: Option<number>[] = [
  { value: 0, label: '0 - Sem Crédito Presumido' },
  { value: 1, label: '1 - Bens de consumo final (55%)' },
  { value: 2, label: '2 - Bens de capital (75%)' },
  { value: 3, label: '3 - Bens intermediários (90,25%)' },
  { value: 4, label: '4 - Bens de informática (100%)' },
];

// Indicador de Doacao (ind_doacao) — `_card-item.blade.php:328-332`. Legado
// usa `''`(Nao)/`'1'`(Sim); aqui `null`(Nao)/`'1'`(Sim), mesma semantica.
export const nfeIndDoacaoOptions: Option<string>[] = [
  { value: '', label: 'Não' },
  { value: '1', label: 'Sim' },
];

// CST/CSOSN — mirror App\Product::listaCSTCSOSN()
export const nfeCstCsosnOptions: Option<string>[] = [
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
  { value: '103', label: '103 - Isenção do ICMS no Simples Nacional para faixa de receita bruta' },
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

// CST PIS/COFINS — mirror App\Product::listaCST_PIS_COFINS()
export const nfeCstPisCofinsOptions: Option<string>[] = [
  {
    value: '01',
    label:
      '01 - Operação Tributável - Base de Cálculo = Valor da Operação Alíquota Normal (Cumulativo/Não Cumulativo)',
  },
  {
    value: '02',
    label: '02 - Operação Tributável - Base de Calculo = Valor da Operação (Alíquota Diferenciada)',
  },
  {
    value: '03',
    label:
      '03 - Operação Tributável - Base de Calculo = Quantidade Vendida x Alíquota por Unidade de Produto;',
  },
  { value: '04', label: '04 - Operação Tributável - Tributação Monofásica - (Alíquota Zero);' },
  { value: '06', label: '06 - Operação Tributável - Alíquota Zero;' },
  { value: '07', label: '07 - Operação Isenta da contribuição;' },
  { value: '08', label: '08 - Operação Sem Incidência da contribuição;' },
  { value: '09', label: '09 - Operação com suspensão da contribuição;' },
  { value: '49', label: '49 - Outras Operações de Saída' },
  {
    value: '50',
    label:
      '50 - Operação com Direito a Crédito - Vinculada Exclusivamente a Receita Tributada no Mercado Interno',
  },
  {
    value: '51',
    label:
      '51 - Operação com Direito a Crédito - Vinculada Exclusivamente a Receita Não-Tributada no Mercado Interno',
  },
  {
    value: '52',
    label: '52 - Operação com Direito a Crédito - Vinculada Exclusivamente a Receita de Exportação',
  },
  {
    value: '53',
    label:
      '53 - Operação com Direito a Crédito - Vinculada a Receitas Tributadas e Não-Tributadas no Mercado Interno',
  },
  {
    value: '54',
    label:
      '54 - Operação com Direito a Crédito - Vinculada a Receitas Tributadas no Mercado Interno e de Exportação',
  },
  {
    value: '55',
    label:
      '55 - Operação com Direito a Crédito - Vinculada a Receitas Não Tributadas no Mercado Interno e de Exportação',
  },
  {
    value: '56',
    label:
      '56 - Operação com Direito a Crédito - Vinculada a Receitas Tributadas e Não-Tributadas no Mercado Interno e de Exportação',
  },
  {
    value: '60',
    label:
      '60 - Crédito Presumido - Operação de Aquisição Vinculada Exclusivamente a Receita Tributada no Mercado Interno',
  },
  {
    value: '61',
    label:
      '61 - Crédito Presumido - Operação de Aquisição Vinculada Exclusivamente a Receita Não-Tributada no Mercado Interno',
  },
  {
    value: '62',
    label:
      '62 - Crédito Presumido - Operação de Aquisição Vinculada Exclusivamente a Receita de Exportação',
  },
  {
    value: '63',
    label:
      '63 - Crédito Presumido - Operação de Aquisição Vinculada a Receitas Tributadas e Não-Tributadas no Mercado Interno',
  },
  {
    value: '64',
    label:
      '64 - Crédito Presumido - Operação de Aquisição Vinculada a Receitas Tributadas no Mercado Interno e de Exportação',
  },
  {
    value: '65',
    label:
      '65 - Crédito Presumido - Operação de Aquisição Vinculada a Receitas Não-Tributadas no Mercado Interno e de Exportação',
  },
  {
    value: '66',
    label:
      '66 - Crédito Presumido - Operação de Aquisição Vinculada a Receitas Tributadas e Não-Tributadas no Mercado Interno e de Exportação',
  },
  { value: '67', label: '67 - Crédito Presumido - Outras Operações' },
  { value: '70', label: '70 - Operação de Aquisição sem Direito a Crédito' },
  { value: '71', label: '71 - Operação de Aquisição com Isenção' },
  { value: '72', label: '72 - Operação de Aquisição com Suspensão' },
  { value: '73', label: '73 - Operação de Aquisição a Alíquota Zero' },
  { value: '74', label: '74 - Operação de Aquisição sem Incidência da Contribuição' },
  { value: '75', label: '75 - Operação de Aquisição por Substituição Tributária' },
  { value: '98', label: '98 - Outras Operações de Entrada' },
  { value: '99', label: '99 - Outras Operações.' },
];

// CST IPI — mirror App\Product::listaCST_IPI()
export const nfeCstIpiOptions: Option<string>[] = [
  { value: '00', label: '00 - Entrada com Recuperação de Crédito' },
  { value: '01', label: '01 - Entrada Tributável com Alíquota Zero' },
  { value: '02', label: '02 - Entrada Isenta' },
  { value: '03', label: '03 - Entrada Não Tributada' },
  { value: '04', label: '04 - Entrada Imune' },
  { value: '05', label: '05 - Entrada com Suspensão' },
  { value: '49', label: '49 - Outras Operações de Entrada' },
  { value: '50', label: '50 - Saída Tributada' },
  { value: '51', label: '51 - Saída Tributável com Alíquota Zero' },
  { value: '52', label: '52 - Saída Isenta' },
  { value: '53', label: '53 - Saída Não Tributada' },
  { value: '54', label: '54 - Saída Imune' },
  { value: '55', label: '55 - Saída com Suspensão' },
  { value: '99', label: '99 - Outras Saídas' },
];

// Origem da mercadoria — mirror App\Product::origens()
export const nfeOrigemOptions: Option<string>[] = [
  { value: '0', label: '0 - NACIONAL' },
  { value: '1', label: '1 - ESTRANGEIRA - IMPORTAÇÃO DIRETA' },
  { value: '2', label: '2 - ESTRANGEIRA - ADQUIRIDA NO MERCADO INTERNO' },
  {
    value: '3',
    label: '3 - NACIONAL, MERCADORIA OU BEM COM CONTEÚDO DE IMPORTAÇÃO SUPERIOR A 40%',
  },
  {
    value: '4',
    label:
      '4 - NACIONAL, CUJA PRODUÇÃO TENHA SIDO FEITA EM CONFORMIDADE COM OS PROCESSOS PRODUTIVOS BÁSICOS DE QUE TRATAM O DECRETO-LEI Nº 288/67, E AS LEIS NºS 8.248/91, 8.387/91, 10.176/01 E 11 . 4 8 4 / 0 7',
  },
  {
    value: '5',
    label: '5 - NACIONAL, MERCADORIA OU BEM COM CONTEÚDO DE IMPORTAÇÃO INFERIOR OU IGUAL A 40%',
  },
  {
    value: '6',
    label:
      '6 - ESTRANGEIRA - IMPORTAÇÃO DIRETA, SEM SIMILAR NACIONAL, CONSTANTE EM LISTA DE RESOLUÇÃO CAMEX',
  },
  {
    value: '7',
    label:
      '7 - ESTRANGEIRA - ADQUIRIDA NO MERCADO INTERNO, SEM SIMILAR NACIONAL, CONSTANTE EM LISTA DE RESOLUÇÃO CAMEX',
  },
  {
    value: '8',
    label: '8 - NACIONAL, MERCADORIA OU BEM COM CONTEUDO DE IMPORTACAO SUPERIOR A 70%',
  },
];

// Codigo de Enquadramento Legal do IPI — mirror App\Product::listaCenqIPI(). Default legado: '999'.
export const nfeCenqIpiOptions: Option<string>[] = [
  { value: '', label: 'Selecione uma opção' },
  {
    value: '001',
    label:
      '001 - Imunidade - Livros, jornais, periódicos e o papel destinado à sua impressão - Art. 18 Inciso I do Decreto 7.212/2010',
  },
  {
    value: '002',
    label:
      '002 - Imunidade - Produtos industrializados destinados ao exterior - Art. 18 Inciso II do Decreto 7.212/2010',
  },
  {
    value: '003',
    label:
      '003 - Imunidade - Ouro, definido em lei como ativo financeiro ou instrumento cambial - Art. 18 Inciso III do Decreto 7.212/2010',
  },
  {
    value: '004',
    label:
      '004 - Imunidade - Energia elétrica, derivados de petróleo, combustíveis e minerais do País - Art. 18 Inciso IV do Decreto 7.212/2010',
  },
  {
    value: '005',
    label:
      '005 - Imunidade - Exportação de produtos nacionais - sem saída do território brasileiro - venda para empresa sediada no exterior - atividades de pesquisa ou lavra de jazidas de petróleo e de gás natural- Art. 19 Inciso I do Decreto 7.212/2010',
  },
  {
    value: '006',
    label:
      '006 - Imunidade - Exportação de produtos nacionais - sem saída do território brasileiro - venda para empresa sediada no exterior - incorporados a produto final exportado para o Brasil - Art. 19 Inciso II do Decreto 7.212/2010',
  },
  {
    value: '007',
    label:
      '007 - Imunidade - Exportação de produtos nacionais - sem saída do território brasileiro - venda para órgão ou entidade de governo estrangeiro ou organismo internacional de que o Brasil seja membro,para ser entregue, no País, à ordem do comprador - Art. 19 Inciso III do Decreto 7.212/2010',
  },
  {
    value: '101',
    label:
      '101 - Suspensão - Óleo de menta em bruto, produzido por lavradores - Art. 43 Inciso I do Decreto 7.212/2010',
  },
  {
    value: '102',
    label:
      '102 - Suspensão - Produtos remetidos à exposição em feiras de amostras e promoções semelhantes - Art. 43 Inciso II do Decreto 7.212/2010',
  },
  {
    value: '103',
    label:
      '103 - Suspensão - Produtos remetidos a depósitos fechados ou armazéns-gerais, bem assim aqueles devolvidos ao remetente - Art. 43 Inciso III do Decreto 7.212/2010',
  },
  {
    value: '104',
    label:
      '104 - Suspensão - Produtos industrializados, que com matérias-primas (MP), produtos intermediários (PI) e material de embalagem (ME) importados submetidos a regime aduaneiro especial (drawback- suspensão/isenção), remetidos diretamente a empresas industriais exportadoras - Art. 43 Inciso IV do Decreto 7.212/2010',
  },
  {
    value: '105',
    label:
      '105 - Suspensão - Produtos, destinados à exportação, que saiam do estabelecimento industrial para empresas comerciais exportadoras, com o fim específico de exportação - Art. 43, Inciso V, alínea "a" do Decreto 7.212/2010',
  },
  {
    value: '106',
    label:
      '106 - Suspensão - Produtos, destinados à exportação, que saiam do estabelecimento industrial para recintos alfandegados onde se processe o despacho aduaneiro de exportação - Art. 43, Inciso V,alíneas "b" do Decreto 7.212/2010',
  },
  {
    value: '107',
    label:
      '107 - Suspensão - Produtos, destinados à exportação, que saiam do estabelecimento industrial para outros locais onde se processe o despacho aduaneiro de exportação - Art. 43, Inciso V, alíneas "c"do Decreto 7.212/2010',
  },
  {
    value: '108',
    label:
      '108 - Suspensão - Matérias-primas (MP), produtos intermediários (PI) e material de embalagem (ME) destinados ao executor de industrialização por encomenda - Art. 43 Inciso VI do Decreto 7.212/2010',
  },
  {
    value: '109',
    label:
      '109 - Suspensão - Produtos industrializados por encomenda remetidos ao estabelecimento de origem - Art. 43 Inciso VII do Decreto 7.212/2010',
  },
  {
    value: '110',
    label:
      '110 - Suspensão - Matérias-primas ou produtos intermediários remetidos para emprego em operação industrial realizada pelo remetente fora do estabelecimento - Art. 43 Inciso VIII do Decreto 7.212/2010',
  },
  {
    value: '111',
    label:
      '111 - Suspensão - Veículo, aeronave ou embarcação destinados a emprego em provas de engenharia pelo fabricante - Art. 43 Inciso IX do Decreto 7.212/2010',
  },
  {
    value: '112',
    label:
      '112 - Suspensão - Produtos remetidos, para industrialização ou comércio, de um para outro estabelecimento da mesma firma - Art. 43 Inciso X do Decreto 7.212/2010',
  },
  {
    value: '113',
    label:
      '113 - Suspensão - Bens do ativo permanente remetidos a outro estabelecim ento da mesma firma, para seremutilizados no processo industrial do recebedor - Art. 43 Inciso XI do Decreto 7.212/2010',
  },
  {
    value: '114',
    label:
      '114 - Suspensão - Bens do ativo permanente remetidos a outro estabelecimento, para serem utilizados no processo industrial de produtos encomendados pelo remetente - Art. 43 Inciso XII do Decreto 7.212/2010',
  },
  {
    value: '115',
    label:
      '115 - Suspensão - Partes e peças destinadas ao reparo de produtos com defeito de fabricação, quando a operação for executada gratuitamente, em virtude de garantia - Art. 43 Inciso XIII do Decreto 7.212/2010',
  },
  {
    value: '116',
    label:
      '116 - Suspensão - Matérias-primas (MP), produtos intermediários (PI) e material de embalagem (ME) de fabricação nacional, vendidos a estabelecimento industrial, para industrialização de produtos destinados à exportação ou a estabelecimento comercial, para industrialização em outro estabelecimento da mesma firma ou de terceiro, de produto destinado à exportação - Art. 43 Inciso XIV do Decreto 7.212/2010',
  },
  {
    value: '117',
    label:
      '117 - Suspensão - Produtos para emprego ou consumo na industrialização ou elaboração de produto a ser exportado, adquiridos no mercado interno ou importados - Art. 43 Inciso X V do Decreto 7.212/2010',
  },
  {
    value: '118',
    label:
      '118 - Suspensão - Bebidas alcoólicas e demais produtos de produção nacional acondicionados em recipientes de capacidade superior ao limite máximo permitido para venda a varejo - Art. 44 do Decreto 7.212/2010',
  },
  {
    value: '119',
    label:
      '119 - Suspensão - Produtos classificados NCM 21.06.90.10 Ex 02, 22.01, 22.02, exceto os Ex 01 e Ex 02 do Código 22.02.90.00 e 22.03 saídos de estabelecimento industrial destinado a comercial equiparado a industrial - Art. 45 Inciso I do Decreto 7.212/2010',
  },
  {
    value: '120',
    label:
      '120 - Suspensão - Produtos classificados NCM 21.06.90.10 Ex 02, 22.01, 22.02, exceto os Ex 01 e Ex 02 do Código 22.02.90.00 e 22.03 saídos de estabelecimento comercial equiparado a industrial destinado a equiparado a industrial - Art. 45 Inciso II do Decreto 7.212/2010',
  },
  {
    value: '121',
    label:
      '121 - Suspensão - Produtos classificados NCM 21.06.90.10 Ex 02, 22.01, 22.02, exceto os Ex 01 e Ex 02 do Código 22.02.90.00 e 22.03 saídos de importador destinado a equiparado a industrial - Art. 45 Inciso III do Decreto 7.212/2010',
  },
  {
    value: '122',
    label:
      '122 - Suspensão - Matérias-primas (MP), produtos intermediários (PI) e material de embalagem (ME) destinados a estabelecimento que se dedique à elaboração de produtos classificados nos códigos previstos no art. 25 da Lei 10.684/2003 - Art. 46 Inciso I do Decreto 7.212/2010',
  },
  {
    value: '123',
    label:
      '123 - Suspensão - Matérias-primas (MP), produtos intermediários (PI) e material de embalagem (ME) adquiridos por estabelecimentos industriais fabricantes de partes e peças destinadas a estabelecimento industrial fabricante de produto classificado no Capítulo 88 da Tipi - Art. 46 Inciso II do Decreto 7.212/2010',
  },
  {
    value: '124',
    label:
      '124 - Suspensão - Matérias-primas (MP), produtos intermediários (PI) e material de embalagem (ME) adquiridos por pessoas jurídicas preponderantemente exportadoras - Art. 46 Inciso III do Decreto 7.212/2010',
  },
  {
    value: '125',
    label:
      '125 - Suspensão - Materiais e equipamentos destinados a embarcações pré-registradas ou registradas no Registro Especial Brasileira - REB quando adquiridos por estaleiros navais brasileiros - Art. 46 Inciso IV do Decreto 7.212/2010',
  },
  {
    value: '126',
    label:
      '126 - Suspensão - Aquisição por beneficiário de regime aduaneiro suspensivo do imposto, destinado a industrialização para exportação - Art. 47 do Decreto 7.212/2010',
  },
  {
    value: '127',
    label:
      '127 - Suspensão - Desembaraço de produtos de procedência estrangeira importados por lojas francas - Art. 48 Inciso I do Decreto 7.212/2010',
  },
  {
    value: '128',
    label:
      '128 - Suspensão - Desembaraço de maquinas, equipamentos, veículos, aparelhos e instrumentos sem similar nacional importados por empresas nacionais de engenharia, destinados à execução de obras no exterior - Art. 48 Inciso II do Decreto 7.212/2010',
  },
  {
    value: '129',
    label:
      '129 - Suspensão - Desembaraço de produtos de procedência estrangeira com saída de repartições aduaneiras com suspensão do Imposto de Importação - Art. 48 Inciso III do Decreto 7.212/2010',
  },
  {
    value: '130',
    label:
      '130 - Suspensão - Desembaraço de matérias-primas, produtos intermediários e materiais de embalagem, importados diretamente por estabelecimento de que tratam os incisos I a III do caput do Decreto 7.212/2010 - Art. 48 Inciso IV do Decreto 7.212/2010',
  },
  {
    value: '131',
    label:
      '131 - Suspensão - Remessa de produtos para a ZFM destinados ao seu consumo interno, utilização ou industrialização - Art. 84 do Decreto 7.212/2010',
  },
  {
    value: '132',
    label:
      '132 - Suspensão - Remessa de produtos para a ZFM destinados à exportação - Art. 85 Inciso I do Decreto 7.212/2010',
  },
  {
    value: '133',
    label:
      '133 - Suspensão - Produtos que, antes de sua remessa à ZFM, forem enviados pelo seu fabricante a outro estabelecimento, para industrialização adicional, por conta e ordem do destinatário - Art. 85 Inciso II do Decreto 7.212/2010',
  },
  {
    value: '134',
    label:
      '134 - Suspensão - Desembaraço de produtos de procedência estrangeira importados pela ZFM quando ali consumidos ou utilizados, exceto armas, munições, fumo, bebidas alcoólicas e automóveis de passageiros. - Art. 86 do Decreto 7.212/2010',
  },
  {
    value: '135',
    label:
      '135 - Suspensão - Remessa de produtos para a Amazônia Ocidental destinados ao seu consumo interno ou utilização - Art. 96 do Decreto 7.212/2010',
  },
  {
    value: '136',
    label:
      '136 - Suspensão - Entrada de produtos estrangeiros na Área de Livre Comércio de Tabatinga - ALCT destinados ao seu consumo interno ou utilização - Art. 106 do Decreto 7.212/2010',
  },
  {
    value: '137',
    label:
      '137 - Suspensão - Entrada de produtos estrangeiros na Área de Livre Comércio de Guajará-Mirim - ALCGM destinados ao seu consumo interno ou utilização - Art. 109 do Decreto 7.212/2010',
  },
  {
    value: '138',
    label:
      '138 - Suspensão - Entrada de produtos estrangeiros nas Áreas de Livre Comércio de Boa Vista - ALCBV e Bomfim - ALCB destinados a seu consumo interno ou utilização - Art. 112 do Decreto 7.212/2010',
  },
  {
    value: '139',
    label:
      '139 - Suspensão - Entrada de produtos estrangeiros na Área de Livre Comércio de Macapá e Santana - ALCMS destinados a seu consumo interno ou utilização - Art. 116 do Decreto 7.212/2010',
  },
  {
    value: '140',
    label:
      '140 - Suspensão - Entrada de produtos estrangeiros nas Áreas de Livre Comércio de Brasiléia - ALCB e de Cruzeiro do Sul - ALCCS destinados a seu consumo interno ou utilização - Art. 119 do Decreto 7.212/2010',
  },
  {
    value: '141',
    label:
      '141 - Suspensão - Remessa para Zona de Processamento de Exportação - ZPE - Art. 121 do Decreto 7.212/2010',
  },
  {
    value: '142',
    label:
      '142 - Suspensão - Setor Automotivo - Desembaraço aduaneiro, chassis e outros - regime aduaneiro especial - industrialização 87.01 a 87.05 - Art. 1 3 6 , 1 do Decreto 7.212/2010',
  },
  {
    value: '143',
    label:
      '143 - Suspensão - Setor Automotivo - Do estabelecimento industrial produtos 87.01 a 87.05 da TIPI - mercado interno - empresa comercial atacadista controlada por PJ encomendante do exterior. - Art.136, II do Decreto 7.212/2010',
  },
  {
    value: '144',
    label:
      '144 - Suspensão - Setor Automotivo - Do estabelecimento industrial - chassis e outros classificados nas posições 84.29, 84.32, 84.33, 87.01 a 87.06 e 87.11 da TIPI. - Art. 136, III do Decreto 7.212/2010',
  },
  {
    value: '145',
    label:
      '145 - Suspensão - Setor Automotivo - Desembaraço aduaneiro, chassis e outros classificados nas posições 84.29, 84.32, 84.33, 87.01 a 87.06 e 87.11 da TIPI quando importados diretamente por estabelecimento industrial - Art. 136, IV do Decreto 7.212/2010',
  },
  {
    value: '146',
    label:
      '146 - Suspensão - Setor Automotivo - do estabelecimento industrial matérias-primas, os produtos intermediários e os materiais de embalagem, adquiridos por fabricantes, preponderantemente, decomponentes, chassis e outros classificados nos Códigos 84.29, 8432.40.00, 8432.80.00,8433.20, 8433.30.00, 8433.40.00, 8433.5 e 87.01 a 87.06 da TIPI - Art. 136, V do Decreto 7.212/2010',
  },
  {
    value: '147',
    label:
      '147 - Suspensão - Setor Automotivo - Desembaraço aduaneiro, as matérias-primas, os produtos intermediários e os materiais de embalagem, importados diretamente por fabricantes, preponderantemente,de componentes, chassis e outros classificados nos Códigos 84.29, 8432.40.00, 8432.80.00,8433.20, 8433.30.00, 8433.40.00, 8433.5 e 87.01 a 87.06 da TIPI - Art. 136, VI do Decreto 7.212/2010',
  },
  {
    value: '148',
    label:
      '148 - Suspensão - Bens de Informática e Automação - matérias-primas, os produtos intermediários e os materiais de embalagem, quando adquiridos por estabelecimentos industriais fabricantes dos referidos bens. - Art. 148 do Decreto 7.212/2010',
  },
  {
    value: '149',
    label:
      '149 - Suspensão - Reporto - Saída de Estabelecimento de máquinas e outros quando adquiridos por beneficiários do REPORTO - Art. 166, I do Decreto 7.212/2010',
  },
  {
    value: '150',
    label:
      '150 - Suspensão - Reporto - Desembaraço aduaneiro de máquinas e outros quando adquiridos por beneficiários do REPORTO - Art. 166, II do Decreto 7.212/2010',
  },
  {
    value: '151',
    label:
      '151 - Suspensão - Repes - Desembaraço aduaneiro - bens sem sim ilar nacional importados por beneficiários do REPES - Art. 171 do Decreto 7.212/2010',
  },
  {
    value: '152',
    label:
      '152 - Suspensão - Recine - Saída para beneficiário do regime - Art. 14, III da Lei 12.599/2012',
  },
  {
    value: '153',
    label:
      '153 - Suspensão - Recine - Desembaraço aduaneiro por beneficiário do regime - Art. 14, IV da Lei 12.599/2012',
  },
  {
    value: '154',
    label:
      '154 - Suspensão - Reif- Saída para beneficiário do regime - Lei 12.794/1013, art. 8, III',
  },
  {
    value: '155',
    label:
      '155 - Suspensão - Reif - Desembaraço aduaneiro por beneficiário do regime - Lei 12.794/1013, art. 8, IV',
  },
  {
    value: '156',
    label:
      '156 - Suspensão - Repnbl-Redes - Saída para beneficiário do regime - Lei n° 12.715/2012, art. 30, II',
  },
  {
    value: '157',
    label:
      '157 - Suspensão - Recompe - Saída de matérias-primas e produtos intermediários para beneficiários do regime - Decreto n° 7.243/2010, art. 5o, I',
  },
  {
    value: '158',
    label:
      '158 - Suspensão - Recompe - Saída de matérias-primas e produtos intermediários destinados a industrialização de equipamentos - Program a Estímulo Universidade-Empresa - Apoio à Inovação - Decreto n° 7.243/2010, art. 5o, III',
  },
  {
    value: '159',
    label:
      '159 - Suspensão - Rio 2016 - Produtos nacionais, duráveis, uso e consumo dos eventos, adquiridos pelas pessoas jurídicas mencionadas no § 2o do art. 4o da Lei n° 12.780/2013 - Lei n° 12.780/2013, Art. 13',
  },
  {
    value: '160',
    label:
      '160 - Suspensão - Regime Especial de Admissão Temporária nos Term os do Art. 2o da IN 1361/2013',
  },
  {
    value: '161',
    label:
      '161 - Suspensão - Regime Especial de Admissão Temporária nos term os do art. 5o da IN 1361/2013',
  },
  {
    value: '162',
    label:
      '162 - Suspensão - Regime Especial de Admissão Temporária nos term os do art. 7o da IN 1361/2013(Suspensão com pagamento de tributos diferidos até a duração do regime, limitado a 100%do valor original)',
  },
  {
    value: '163',
    label:
      '163 - Suspensão - REPETRO-Industrialização Venda no mercado interno de matérias-primas, produtos intermediários e materiais de embalagem para serem utilizados integralmente no processo de industrialização de produto final destinado às atividades de exploração, de desenvolvimento e de produção de petróleo, de gás natural e de outros hidrocarbonetos fluidos à PJ habilitada no Repetro-Industrialização. - Instrução Normativa RFB nº 1901, de 17 de julho de 2019.',
  },
  {
    value: '164',
    label:
      '164 - Suspensão - REPETRO-SPED Venda dos produtos finais destinados às atividades de exploração, de desenvolvimento e de produção de petróleo, de gás natural e de outros hidrocarbonetos fluidos previstas na Lei nº 9.478, de 6 de agosto de 1997 , na Lei nº 12.276, de 30 de junho de 2010, e na Lei nº 12.351, de 22 de dezembro de 2010, por fabricantes desses, beneficiários do Repetro-Industrialização, quando diretamente adquiridos por pessoa jurídica habilitada no Repetro-Sped.- Instrução Normativa RFB nº 1901, de 17 de julho de 2019.',
  },
  {
    value: '165',
    label:
      '165 - Suspensão - O transportador com relação aos produtos tributados que transportar desacompanhados da documentação comprobatória de sua procedência; qualquer possuidor - com relação aos produtos tributados cuja posse mantiver para fins de venda ou industrialização; o industrial ou equiparado, mediante requerimento, nas operações anteriores, concomitantes ou posteriores às saídas que promover, nas hipóteses e condições estabelecidas pela Secretaria da Receita Federal, nos termos da IN RFB nº 1.081/2010.',
  },
  {
    value: '301',
    label:
      '301 - Isenção - Produtos industrializados por instituições de educação ou de assistência social, destinados auso próprio ou a distribuição gratuita a seus educandos ou assistidos - Art. 54 Inciso I doDecreto 7.212/2010',
  },
  {
    value: '302',
    label:
      '302 - Isenção - Produtos industrializados por estabelecimentos públicos e autárquicos da União, dos Estados, do Distrito Federal e dos Municípios, não destinados a comércio - Art. 54 Inciso II do Decreto 7.212/2010',
  },
  {
    value: '303',
    label:
      '303 - Isenção - Amostras de produtos para distribuição gratuita, de diminuto ou nenhum valor comercial - Art. 54 Inciso III do Decreto 7.212/2010',
  },
  {
    value: '304',
    label:
      '304 - Isenção - Amostras de tecidos sem valor comercial - Art. 54 Inciso IV do Decreto 7.212/2010',
  },
  {
    value: '305',
    label: '305 - Isenção - Pés isolados de calçados - Art. 54 Inciso V do Decreto 7.212/2010',
  },
  {
    value: '306',
    label:
      '306 - Isenção - Aeronaves de uso militar e suas partes e peças, vendidas à União - Art. 54 Inciso VI do Decreto 7.212/2010',
  },
  {
    value: '307',
    label: '307 - Isenção - Caixões funerários - Art. 54 Inciso VII do Decreto 7.212/2010',
  },
  {
    value: '308',
    label:
      '308 - Isenção - Papel destinado à impressão de músicas - Art. 54 Inciso VIII do Decreto 7.212/2010',
  },
  {
    value: '309',
    label:
      '309 - Isenção - Panelas e outros artefatos semelhantes, de uso doméstico, de fabricação rústica, de pedra ou barro bruto - Art. 54 Inciso IX do Decreto 7.212/2010',
  },
  {
    value: '310',
    label:
      '310 - Isenção - Chapéus, roupas e proteção, de couro, próprios para tropeiros - Art. 54 Inciso X do Decreto 7.212/2010',
  },
  {
    value: '311',
    label:
      '311 - Isenção - Material bélico, de uso privativo das Forças Armadas, vendido à União - Art. 54 Inciso XI do Decreto 7.212/2010',
  },
  {
    value: '312',
    label:
      '312 - Isenção - Automóvel adquirido diretamente a fabricante nacional, pelas missões diplomáticas e repartições consulares de caráter permanente, ou seus integrantes, bem assim pelas representações internacionais ou regionais de que o Brasil seja membro, e seus funcionários,peritos, técnicos e consultores, de nacionalidade estrangeira, que exerçam funções de caráter permanente - Art. 54 Inciso XII do Decreto 7.212/2010',
  },
  {
    value: '313',
    label:
      '313 - Isenção - Veículo de fabricação nacional adquirido por funcionário das missões diplomáticas acreditadas junto ao Governo Brasileiro - Art. 54 Inciso XIII do Decreto 7.212/2010',
  },
  {
    value: '314',
    label:
      '314 - Isenção - Produtos nacionais saídos diretamente para Lojas Francas - Art. 54 Inciso XIV do Decreto 7.212/2010',
  },
  {
    value: '315',
    label:
      '315 - Isenção - Materiais e equipamentos destinados a Itaipu Binacional - Art. 54 Inciso X V do Decreto 7.212/2010',
  },
  {
    value: '316',
    label:
      '316 - Isenção - Produtos Importados por missões diplomáticas, consulados ou organismo internacional - Art. 54 Inciso XVI do Decreto 7.212/2010',
  },
  {
    value: '317',
    label:
      '317 - Isenção - Bagagem de passageiros desembaraçada com isenção do II. - Art. 54 Inciso XVII do Decreto 7.212/2010',
  },
  {
    value: '318',
    label:
      '318 - Isenção - Bagagem de passageiros desembaraçada com pagamento do II. - Art. 54 Inciso XVIII do Decreto 7.212/2010',
  },
  {
    value: '319',
    label:
      '319 - Isenção - Remessas postais internacionais sujeitas a tributação simplificada. - Art. 54 Inciso XIX do Decreto 7.212/2010',
  },
  {
    value: '320',
    label:
      '320 - Isenção - Máquinas e outros destinados à pesquisa científica e tecnológica - Art. 54 Inciso XX do Decreto 7.212/2010',
  },
  {
    value: '321',
    label:
      '321 - Isenção - Produtos de procedência estrangeira, isentos do II conforme Lei n° 8032/1990. - Art. 54 Inciso XXI do Decreto 7.212/2010',
  },
  {
    value: '322',
    label:
      '322 - Isenção - Produtos de procedência estrangeira utilizados em eventos esportivos - Art. 54 Inciso XXII do Decreto 7.212/2010',
  },
  {
    value: '323',
    label:
      '323 - Isenção - Veículos automotores, máquinas, equipamentos, bem assim suas partes e peças separadas, destinadas à utilização nas atividades dos Corpos de Bombeiros - Art. 54 Inciso XXIII do Decreto 7.212/2010',
  },
  {
    value: '324',
    label:
      '324 - Isenção - Produtos importados para consumo em congressos, feiras e exposições - Art. 54 Inciso XXIV do Decreto 7.212/2010',
  },
  {
    value: '325',
    label:
      '325 - Isenção - Bens de informática, Matéria Prima, produtos intermediários e embalagem destinados a Urnas eletrônicas - TSE - Art. 54 Inciso XXV do Decreto 7.212/2010',
  },
  {
    value: '326',
    label:
      '326 - Isenção - Materiais, equipamentos, máquinas, aparelhos e instrumentos, bem assim os respectivos acessórios, sobressalentes e ferramentas, que os acompanhem, destinados à construção do Gasoduto Brasil - Bolívia - Art. 54 Inciso )0',
  },
  {
    value: '327',
    label:
      '327 - Isenção - Partes, peças e componentes, adquiridos por estaleiros navais brasileiros, destinados ao emprego na conservação, modernização, conversão ou reparo de embarcações registradas no Registro Especial Brasileiro - REB - Art. 54 Inciso XXVII do Decreto 7.212/2010',
  },
  {
    value: '328',
    label:
      '328 - Isenção - Aparelhos transmissores e receptores de radiotelefonia e radiotelegrafia; veículos para patrulhamento policial; armas e munições, destinados a órgãos de segurança pública da União, dos Estados e do Distrito Federal - Art. 54 Inciso XXVIII do Decreto 7.212/2010',
  },
  {
    value: '329',
    label:
      '329 - Isenção - Automóveis de passageiros de fabricação nacional destinados à utilização como táxi adquiridos por motoristas profissionais - Art. 55 Inciso I do Decreto 7.212/2010',
  },
  {
    value: '330',
    label:
      '330 - Isenção - Automóveis de passageiros de fabricação nacional destinados à utilização como táxi por impedidos de exercer atividade por destruição, furto ou roubo do veículo adquiridos por motoristas profissionais. - Art. 55 Inciso II do Decreto 7.212/2010',
  },
  {
    value: '331',
    label:
      '331 - Isenção - Automóveis de passageiros de fabricação nacional destinados à utilização como táxi adquiridos por cooperativas de trabalho. - Art. 55 Inciso II do Decreto 7.212/2010',
  },
  {
    value: '332',
    label:
      '332 - Isenção - Automóveis de passageiros de fabricação nacional, destinados a pessoas portadoras de deficiência física, visual, mental severa ou profunda, ou autistas - Art. 55 Inciso IV do Decreto 7.212/2010',
  },
  {
    value: '333',
    label:
      '333 - Isenção - Produtos estrangeiros, recebidos em doação de representações diplomáticas estrangeiras sediadas no País, vendidos em feiras, bazares e eventos semelhantes por entidades beneficentes - Art. 67 do Decreto 7.212/2010',
  },
  {
    value: '334',
    label:
      '334 - Isenção - Produtos industrializados na Zona Franca de Manaus - ZFM, destinados ao seu consumo interno - Art. 81 Inciso I do Decreto 7.212/2010',
  },
  {
    value: '335',
    label:
      '335 - Isenção - Produtos industrializados na ZFM, por estabelecimentos com projetos aprovados pela SUFRAMA, destinados a comercialização em qualquer outro ponto do Território Nacional -Art. 81 Inciso II do Decreto 7.212/2010',
  },
  {
    value: '336',
    label:
      '336 - Isenção - Produtos nacionais destinados à entrada na ZFM, para seu consumo interno, utilização ou industrialização, ou ainda, para serem remetidos, por intermédio de seus entrepostos, à Amazônia Ocidental - Art. 81 Inciso III do Decreto 7.212/2010',
  },
  {
    value: '337',
    label:
      '337 - Isenção - Produtos industrializados por estabelecimentos com projetos aprovados pela SUFRAMA, consumidos ou utilizados na Amazônia Ocidental, ou adquiridos através da ZFM ou de seus entrepostos na referida região - Art. 95 Inciso I do Decreto 7.212/2010',
  },
  {
    value: '338',
    label:
      '338 - Isenção - Produtos de procedência estrangeira, relacionados na legislação, oriundos da ZFM e que derem entrada na Amazônia Ocidental para ali serem consumidos ou utilizados: - Art. 95 Inciso II do Decreto 7.212/2010',
  },
  {
    value: '339',
    label:
      '339 - Isenção - Produtos elaborados com matérias-primas agrícolas e extrativas vegetais de produção regional, por estabelecimentos industriais localizados na Amazônia Ocidental, com projetos aprovados pela SUFRAM A - Art. 95 Inciso III do Decreto 7.212/2010',
  },
  {
    value: '340',
    label:
      '340 - Isenção - Produtos industrializados em Área de Livre Comércio - Art. 105 do Decreto 7.212/2010',
  },
  {
    value: '341',
    label:
      '341 - Isenção - Produtos nacionais ou nacionalizados, destinados à entrada na Área de Livre Comércio de Tabatinga - ALCT - Art. 107 do Decreto 7.212/2010',
  },
  {
    value: '342',
    label:
      '342 - Isenção - Produtos nacionais ou nacionalizados, destinados à entrada na Área de Livre Comércio de Guaiará-Mirim - ALCGM - Art. 110 do Decreto 7.212/2010',
  },
  {
    value: '343',
    label:
      '343 - Isenção - Produtos nacionais ou nacionalizados, destinados à entrada nas Áreas de Livre Comércio de Boa Vista - ALCBV e Bonfim - ALCB - Art. 113 do Decreto 7.212/2010',
  },
  {
    value: '344',
    label:
      '344 - Isenção - Produtos nacionais ou nacionalizados, destinados à entrada na Área de Livre Comércio de Macapá e Santana - ALCMS - Art. 117 do Decreto 7.212/2010',
  },
  {
    value: '345',
    label:
      '345 - Isenção - Produtos nacionais ou nacionalizados, destinados à entrada nas Áreas de Livre Comércio de Brasiléia - ALCB e de Cruzeiro do Sul - ALCCS - Art. 120 do Decreto 7.212/2010',
  },
  {
    value: '346',
    label:
      '346 - Isenção - Recompe - equipamentos de informática - de beneficiário do regime para escolas das redes públicas de ensino federal, estadual, distrital, municipal ou nas escolas sem fins lucrativos de atendimento a pessoas com deficiência - Decreto n° 7.243/2010, art. 7o',
  },
  {
    value: '347',
    label:
      '347 - Isenção - Rio 2016 - Importação de materiais para os jogos (medalhas, troféus, impressos, bens não duráveis, etc.) - Lei n° 12.780/2013, Art. 4o, §1°, I',
  },
  {
    value: '348',
    label:
      '348 - Isenção - Rio 2016 - Suspensão convertida em Isenção - Lei n° 12.780/2013, Art. 6o, I',
  },
  {
    value: '349',
    label:
      '349 - Isenção - Rio 2016 - Empresas vinculadas ao CIO - Lei n° 12.780/2013, Art. 9o, I, d',
  },
  {
    value: '350',
    label:
      '350 - Isenção - Rio 2016 - Saída de produtos importados pelo RIO 2016 - Lei n° 12.780/2013, Art. 10, I, d',
  },
  {
    value: '351',
    label:
      '351 - Isenção - Rio 2016 - Produtos nacionais, não duráveis, uso e consumo dos eventos, adquiridos pelas pessoas jurídicas mencionadas no § 2o do art. 4o da Lei n° 12.780/2013 - Lei n° 12.780/2013,Art. 12',
  },
  {
    value: '601',
    label:
      '601 - Redução - Equipamentos e outros destinados à pesquisa e ao desenvolvimento tecnológico - Art. 72 do Decreto 7.212/2010',
  },
  {
    value: '602',
    label:
      '602 - Redução - Equipamentos e outros destinados à empresas habilitadas no PDTI e PDTA utilizados em pesquisa e ao desenvolvimento tecnológico - Art. 73 do Decreto 7.212/2010 ',
  },
  {
    value: '603',
    label:
      '603 - Redução - Microcomputadores e outros de até R$11.000,00, unidades de disco, circuitos, etc, destinados a bens de informática ou automação. Centro-Oeste SUDAM SUDENE - Art. 142,I do Decreto 7.212/2010',
  },
  {
    value: '604',
    label:
      '604 - Redução - Microcomputadores e outros de até R$11.000,00, unidades de disco, circuitos, etc, destinados a bens de informática ou automação. - Art. 1 4 2 ,1 do Decreto 7.212/2010',
  },
  {
    value: '605',
    label:
      '605 - Redução - Bens de informática não incluídos no art. 142 do Decreto 7.212/2010 - Produzidos no Centro-Oeste, SUDAM, SUDENE - Art. 1 4 3 ,1 do Decreto 7.212/2010',
  },
  {
    value: '606',
    label:
      '606 - Redução - Bens de informática não incluídos no art. 142 do Decreto 7.212/2010 - Art. 143, II do Decreto 7.212/2010',
  },
  { value: '607', label: '607 - Redução - Padis - Art. 150 do Decreto 7.212/2010' },
  { value: '608', label: '608 - Redução - Patvd - Art. 158 do Decreto 7.212/2010' },
  { value: '999', label: '999 - Outros - Tributação normal IPI; Outros;' },
];

// Tipo de pagamento — mirror App\Nfe::typesPayment()
export const nfeTypePaymentOptions: Option<string>[] = [
  { value: '01', label: 'Dinheiro' },
  { value: '02', label: 'Cheque' },
  { value: '03', label: 'Cartão de Crédito' },
  { value: '04', label: 'Cartão de Débito' },
  { value: '05', label: 'Crédito Loja' },
  { value: '10', label: 'Vale Alimentação' },
  { value: '11', label: 'Vale Refeição' },
  { value: '12', label: 'Vale Presente' },
  { value: '13', label: 'Vale Combustível' },
  { value: '14', label: 'Duplicata Mercantil' },
  { value: '15', label: 'Boleto Bancário' },
  { value: '16', label: 'Depósito Bancário' },
  { value: '17', label: 'Pagamento Instantâneo (PIX)' },
  { value: '90', label: 'Sem Pagamento' },
  { value: '99', label: 'Outros' },
];

// Tipo de Debito (finNFe=6) — mirror App\Nfe::typeDebts()
export const nfeTypeDebtOptions: Option<string>[] = [
  { value: '01', label: '01 - Transferência de créditos para Cooperativas;' },
  { value: '02', label: '02 - Anulação de Crédito por Saídas Imunes/Isentas;' },
  { value: '03', label: '03 - Débitos de notas fiscais não processadas na apuração;' },
  { value: '04', label: '04 - Multa e juros;' },
  { value: '05', label: '05 - Transferência de crédito na sucessão;' },
  { value: '06', label: '06 - Pagamento antecipado;' },
  { value: '07', label: '07 - Perda em estoque;' },
  { value: '08', label: '08 - Desenquadramento do SN;' },
];

// Tipo de Credito (finNFe=5) — mirror App\Nfe::typeCredits()
export const nfeTypeCreditOptions: Option<string>[] = [
  { value: '01', label: '01 - Multa e juros;' },
  {
    value: '02',
    label:
      '02 - Apropriação de crédito presumido de IBS sobre o saldo devedor na ZFM (art. 450, § 1º, LC 214/25);',
  },
  {
    value: '03',
    label:
      '03 - Retorno por recusa total na entrega ou por não localização do destinatário na tentativa de entrega;',
  },
  { value: '04', label: '04 - Redução de valores;' },
  { value: '05', label: '05 - Transferência de crédito na sucessão;' },
];

// Tipo de Guia — mirror App\Nfe::typeGuides()
export const nfeTypeGuideOptions: Option<string>[] = [
  { value: '1', label: '1 - GTA - Guia de Trânsito Animal' },
  { value: '2', label: '2 - TTA - Termo de Trânsito Animal' },
  { value: '3', label: '3 - DTA - Documento de Transferência Animal' },
  { value: '4', label: '4 - ATV - Autorização de Trânsito Vegetal' },
  { value: '5', label: '5 - PTV - Permissão de Trânsito Vegetal' },
  { value: '6', label: '6 - GTV - Guia de Trânsito Vegetal' },
  { value: '7', label: '7 - Guia Florestal (DOF, SisFlora - PA e MT ou SIAM - MG)' },
];

// Tipo de frete — mirror App\Nfe::shippingTypes()
export const nfeShippingTypeOptions: Option<number>[] = [
  { value: 0, label: 'Emitente' },
  { value: 1, label: 'Destinatário' },
  { value: 2, label: 'Terceiros' },
  { value: 9, label: 'Sem Frete' },
];

// C1 (D-101-19): catalogo motDesICMS por CST.
export {
  MOT_DES_ICMS_BY_CST,
  getMotDesIcmsOptions,
  isMotDesIcmsValidForCst,
} from './mot-des-icms-catalog';
