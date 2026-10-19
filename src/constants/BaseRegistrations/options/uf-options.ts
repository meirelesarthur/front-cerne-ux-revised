// src/constants/BaseRegistrations/options/uf-options.ts
// -----------------------------------------------------------------------------
// Opções de UF (sigla de 2 letras) — mirror `App\Enums\Uf` (contrato de API
// §3), execução 032, TASK-FE-2410. Consumido pelo campo `uf` de
// `ImportIbptTable.tsx` (`@/components/Form/Select`).
//
// SEM item `"" => "Selecione"` — a prop `placeholder` do `Select` já resolve
// isso (contrato de API §3: o backend explicitamente não replica esse
// artefato de legado). SEM i18n — mirror contrato de API §3 ("`label()`
// retorna a própria sigla", sem nome extenso em nenhum locale, siglas são
// invariantes).
// -----------------------------------------------------------------------------

import { Option } from '@/@types/option';

export const ufOptions: Option<string>[] = [
  'AC',
  'AL',
  'AM',
  'AP',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MG',
  'MS',
  'MT',
  'PA',
  'PB',
  'PE',
  'PI',
  'PR',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SE',
  'SP',
  'TO',
].map((sigla) => ({ label: sigla, value: sigla }));

export default ufOptions;
