// src/constants/fiscal/cte/options/cte-endereco-tomador-options.ts
// F25 (LK12) — seletor client-side "usar endereço de" (Contrato §2.5):
// branco/'0'=remetente/'1'=destinatário. Sem coluna própria no backend
// (`endereco_tomador` sempre `null` na leitura, CL15).

import type { Option } from '@/@types/option';

const CTE_ENDERECO_TOMADOR_VALUES = ['0', '1'] as const;

const labels = (): Map<'0' | '1', string> =>
  new Map([
    ['0', 'Remetente'],
    ['1', 'Destinatário'],
  ]);

const getLabel = (value: '0' | '1'): string => labels().get(value) ?? value;

const getOption = (value: '0' | '1'): Option<'0' | '1'> => ({ label: getLabel(value), value });

const options = (): Option<'0' | '1'>[] =>
  CTE_ENDERECO_TOMADOR_VALUES.map((value) => getOption(value));

export const cteEnderecoTomadorOptions = { getLabel, getOption, options };

export default cteEnderecoTomadorOptions;
