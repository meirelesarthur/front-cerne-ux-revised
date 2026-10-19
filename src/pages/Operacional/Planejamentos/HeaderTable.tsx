// src/pages/Operacional/Planejamentos/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Planejamentos (Planning) — TASK-FE-PLAN-01.
// SÓ "Novo" (`ButtonAdd`, gate `plannings_create`) — SEM botão de filtro (a
// tela não tem painel de filtro, `FM-01`: o legado não tem nenhum filtro de
// busca nesta tela). Mirror `ServiceOrders/HeaderTable.tsx`, sem
// `GridSettingsFloatingPanel` (não pedido pelo Roteiro para esta grid
// simples — DoD não exige personalização de colunas).
// -----------------------------------------------------------------------------

import { ButtonAdd } from '@/components/ButtonAdd';

import type { LanguageDate } from '@/@types/language';

interface HeaderTableProps {
  languageGB: LanguageDate;
  canCreate: boolean;
  onCreate: () => void;
}

export function HeaderTable({ languageGB, canCreate, onCreate }: HeaderTableProps) {
  return <>{canCreate && <ButtonAdd onClick={onCreate} languageGB={languageGB} />}</>;
}
