// src/pages/Operacional/GrouperBatches/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid "Agrupar Lotes" (GrouperBatch, execução 042,
// TASK-FE-042-303) — mirror `Administrativo/SaldoEstoque/HeaderTable.tsx`:
// `ButtonAdd` ("Novo Lote", D-front-6) + botão "Agrupar" (`isFetchingPreview`
// como loading, D-front-3/4) + `ButtonFilter`. Ambos gated pela ÚNICA
// permissão da tela (`grouper_batches`, SC-B03/AM-005 do contrato legado).
// -----------------------------------------------------------------------------

import { Button } from '@/components/Button';
import { ButtonAdd } from '@/components/ButtonAdd';

import type { LanguageDate } from '@/@types/language';

interface HeaderTableProps {
  onOpenFilter: () => void;
  filtersApplied: number;
  languageGB: LanguageDate;
  /** `can('grouper_batches')` — permissão ÚNICA da tela (D-front-2). */
  canGroup: boolean;
  canCreate: boolean;
  /** Prévia (`GET /grouper-batches`) em voo — mostra `loading` no botão "Agrupar". */
  isFetchingPreview: boolean;
  onClickGroup: () => void;
  onOpenNewBatchModal: () => void;
}

export function HeaderTable({
  onOpenFilter,
  filtersApplied,
  languageGB,
  canGroup,
  canCreate,
  isFetchingPreview,
  onClickGroup,
  onOpenNewBatchModal,
}: HeaderTableProps) {
  const text = languageGB.grouperBatches.grouperBatch;

  return (
    <>
      {canGroup && (
        <Button
          title={text.group.buttonLabel}
          variant="outline"
          loading={isFetchingPreview}
          onClick={onClickGroup}
        />
      )}
      {canCreate && <ButtonAdd onClick={onOpenNewBatchModal} languageGB={languageGB} />}
    </>
  );
}
