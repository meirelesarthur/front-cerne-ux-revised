// src/constants/cadastrosBase/account/account-type.ts
// Enum client-side do campo `type` de Contas Bancárias (Account — Cadastros
// Base / Financeiros, execução 025, TASK-FE-561). Mirror do backend
// `App\Enums\AccountType` (`Account-contrato.md §2.3`, REAPROVEITADO tal
// qual, D3) — C=Corrente, P=Poupança, I=Aplicação Financeira, L=Caixa
// Interno. Servido também por `GET /accounts/options` (TASK-BE-564, em
// construção paralela) — esta versão estática existe para uso imediato em
// Selects/filtros sem esperar round-trip de rede (mirror `providerType`, que
// também é estático mesmo havendo Provider no backend).

export type AccountType = 'C' | 'P' | 'I' | 'L';

export const ACCOUNT_TYPES: AccountType[] = ['C', 'P', 'I', 'L'];
