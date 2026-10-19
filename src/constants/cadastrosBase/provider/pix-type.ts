// src/constants/cadastrosBase/provider/pix-type.ts
// Enum `provider.pix_type` (bloco bancário, aba "Conta") — mirror EXATO de
// `App\Enums\PixType` (backend, int-backed 0-3, `Provider-FrontEnd-
// contrato.md ## 3`/`## 6.2`, TASK-PR-FE-04). Ordem confirmada por leitura
// direta do Enum: 0=CPF/CNPJ, 1=E-mail, 2=Telefone, 3=Chave Aleatória.
//
// O MESMO enum `PixType` é reaproveitado pelo backend em `employees.
// pix_type` (`StepFuncionario.tsx` no front) — mas o módulo Provider não
// importa nada de `Pessoas/` (independência arquitetural declarada em
// `Provider-FrontEnd-contrato.md ## 4.2`/cabeçalho de `provider-service.ts`),
// por isso esta fábrica é local a `constants/cadastrosBase/provider/`, não
// uma extração do array inline de `StepFuncionario.tsx`.

export const pixType = {
  cpfCnpj: 0,
  email: 1,
  phone: 2,
  random: 3,
} as const;

export type PixType = (typeof pixType)[keyof typeof pixType];
