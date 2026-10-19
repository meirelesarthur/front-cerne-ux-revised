// src/pages/Operacional/Evolutions/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Evolução/Rebanho — módulo 100% leitura (sem
// `ButtonAdd`, mirror `Administrativo/SaldoEstoque/HeaderTable.tsx`).
//
// Botão "Relatório" (Tarefa 27) navega para
// `/relatorios/pecuaria/evolucao-rebanho`, SEM gate de permissão
// (`GAP-EVO-FE-04`, default aplicado) — mirror `SaldoEstoque/HeaderTable.tsx:64-66`.
// -----------------------------------------------------------------------------

import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonFilter } from '@/components/ButtonFilter';

import type { LanguageDate } from '@/@types/language';

interface HeaderTableProps {
  onOpenFilter: () => void;
  filtersApplied: number;
  languageGB: LanguageDate;
}

export function HeaderTable({ onOpenFilter, filtersApplied, languageGB }: HeaderTableProps) {
  const navigate = useNavigate();
  const text = languageGB.evolutions.evolution.list;

  return (
    <>
      {/* "Relatório" — SEM gate de permissão (`GAP-EVO-FE-04`, default
          aplicado pelo dono): mirror `SaldoEstoque/HeaderTable.tsx`, honra
          "não esconder o botão por permissão que o backend não exige" — a
          rota de destino também é ungated (ver router/index.tsx). */}
      <Button
        title={text.report}
        variant="outline"
        onClick={() => navigate('/relatorios/pecuaria/evolucao-rebanho')}
      />
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
    </>
  );
}
