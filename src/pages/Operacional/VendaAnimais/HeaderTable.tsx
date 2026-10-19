// src/pages/Operacional/VendaAnimais/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Venda de Animais — mirror
// `Operacional/Romaneios/HeaderTable.tsx`, simplificado: a busca textual
// (`search`) vive DENTRO do drawer de filtro (contrato de tela §5.2), não no
// toolbar — diferente de Romaneios (onde a busca por número é separada).
//
//   - "Adicionar" (`ButtonAdd`, gate `mov_sale_create`) — navega para
//     `/operacional/venda-animais/novo`.
//   - `ButtonFilter` (badge de contagem dos 5 filtros do drawer).
//   - "Finalizar em lote" (TASK-VD-FE-03, contrato §8.2, gate
//     `mov_sale_edit`) — mirror do botão "Agrupar" de
//     `SaldoEstoque/index.tsx`: habilitado só com ≥1 linha `status==='P'`
//     selecionada (contrato §5.3/§8.2, "disabled" — não alerta no clique,
//     diferente do padrão "alerta e não desabilita" de Saldo de Estoque, que
//     é fiel a um legado próprio; aqui não há legado a preservar).
// -----------------------------------------------------------------------------

import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonAdd } from '@/components/ButtonAdd';
import { ButtonFilter } from '@/components/ButtonFilter';

import { usePermissions } from '@/hooks/usePermissions';

import { LanguageDate } from '@/@types/language';

interface HeaderTableProps {
  onOpenFilter: () => void;
  filtersApplied: number;
  languageGB: LanguageDate;
  /** TASK-VD-FE-03 (contrato §8.2) — presente só quando a listagem expõe
   *  seleção múltipla (`mov_sale_edit`). */
  batchFinish?: {
    selectedCount: number;
    onClick: () => void;
  };
}

export function HeaderTable({
  onOpenFilter,
  filtersApplied,
  languageGB,
  batchFinish,
}: HeaderTableProps) {
  const navigate = useNavigate();
  const { can } = usePermissions();

  return (
    <>
      {batchFinish && (
        <Button
          title={`${languageGB.movementSales.movementSale.list.batchBar.finishButton}${
            batchFinish.selectedCount > 0 ? ` (${batchFinish.selectedCount})` : ''
          }`}
          variant="outline"
          onClick={batchFinish.onClick}
          disabled={batchFinish.selectedCount === 0}
        />
      )}
      {can('mov_sale_create') && (
        <ButtonAdd
          onClick={() => navigate('/operacional/venda-animais/novo')}
          languageGB={languageGB}
        />
      )}
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
    </>
  );
}
