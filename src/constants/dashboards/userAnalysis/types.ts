// src/constants/dashboards/userAnalysis/types.ts
// Enum do período do filtro de Análise de Usuários (execução 046,
// TASK-UA-FE-02; atualizado por PLANO-ADMIN-USER-ANALYSIS §4/§6) —
// `UA-FILTER-01`, valores aceitos pela API
// (`CONTRATO-API-046-01-user-analysis.md`, `Rule::in(['5','15','30','60','90'])`).
// `7` SAIU da lista (substituição, não adição — decisão do dono, Seção 6 do
// plano) e `60`/`90` entraram.

export const userAnalysisPeriod = {
  d5: '5',
  d15: '15',
  d30: '30',
  d60: '60',
  d90: '90',
} as const;

export type UserAnalysisPeriodValue = (typeof userAnalysisPeriod)[keyof typeof userAnalysisPeriod];
