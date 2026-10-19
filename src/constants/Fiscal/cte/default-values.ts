// src/constants/fiscal/cte/default-values.ts
// Valores iniciais do formulário de CT-e (TASK-CTE-FE-01,
// get_pwa_constants_and_mappers_pattern §11). `medidas`/`componentes`/
// `chavesNfe` partem vazios — a UI de cada `FieldArray` decide se popula 1
// linha inicial (mirror `HarvestProduct::boxes`, decisão local da tela).
//
// `globalizado`/`cst`/`retira` (defaults `'0'`/`'00'`/`'1'`, Contrato §3.1
// F05/F06/F37) ficam `null` aqui — a Option COM label só existe depois de
// resolvida pela fábrica de options (que exige `languageGB`); a tela de
// criação (`CreateOrUpdateCte.tsx`) mescla o default real no `useForm`.

import type { CteForm } from '@/@types/v2/Fiscal/cte';

import { cteTipoDocumentoOptions } from './options/cte-tipo-documento-options';

export const cteFormDefaultValues: CteForm = {
  natureza: null,
  globalizado: null,
  cst: null,
  percIcms: null,
  cClassTrib: '',
  cstIbsCbs: null,
  percIbsUf: null,
  percIbsMun: null,
  percCbs: null,
  percReducaoAliqIbsUf: null,
  percReducaoAliqIbsMun: null,
  percReducaoAliqCbs: null,
  percDifIbsUf: null,
  percDifIbsMun: null,
  percDifCbs: null,
  remetente: null,
  destinatario: null,
  chavesNfe: [],
  // D-100-22 / T-776-API-04c — legado (`cte/_forms.blade.php:89`) não tinha opção
  // vazia: `tpDoc` sempre gravado, default '00' (Declaração).
  tpDoc: cteTipoDocumentoOptions.getOption('00'),
  descOutros: '',
  nDoc: null,
  vDocFisc: null,
  equipment: null,
  produtoPredominante: '',
  tomador: null,
  valorCarga: null,
  modal: null,
  medidas: [],
  componentes: [],
  enderecoTomador: null,
  ruaTomador: '',
  numeroTomador: '',
  bairroTomador: '',
  cepTomador: '',
  cidadeTomador: null,
  dataPrevistaEntrega: '',
  valorTransporte: null,
  valorReceber: null,
  municipioEnvio: null,
  municipioInicio: null,
  municipioFim: null,
  retira: null,
  detalhesRetira: '',
  observacao: '',
};

export default cteFormDefaultValues;
