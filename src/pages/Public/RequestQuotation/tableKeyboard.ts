// src/pages/Public/RequestQuotation/tableKeyboard.ts
// -----------------------------------------------------------------------------
// Teclado das tabelas editáveis do formulário público (itens e condições de
// pagamento), como numa planilha: ENTER desce para o MESMO campo da linha de
// baixo (nome do campo `lista.N.campo` → `lista.N+1.campo`) e nunca envia o
// formulário. Na última linha, Enter só não faz nada. Apresentação apenas.
// -----------------------------------------------------------------------------

import type { KeyboardEvent } from 'react';

const EDITABLE_FIELD = /^(items|payments)\.(\d+)\.([a-z_]+)$/;

export function handleEnterMovesDown(event: KeyboardEvent<HTMLElement>) {
  if (event.key !== 'Enter') return;
  const target = event.target as HTMLElement;
  if (target.tagName !== 'INPUT') return;
  const match = EDITABLE_FIELD.exec((target as HTMLInputElement).name);
  if (!match) return;
  event.preventDefault();
  const next = event.currentTarget.querySelector<HTMLInputElement>(
    `input[name="${match[1]}.${Number(match[2]) + 1}.${match[3]}"]`
  );
  next?.focus();
  next?.select();
}
