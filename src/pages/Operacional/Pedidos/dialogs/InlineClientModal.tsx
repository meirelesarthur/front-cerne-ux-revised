// src/pages/Operacional/Pedidos/dialogs/InlineClientModal.tsx
// -----------------------------------------------------------------------------
// PED-FE-07 — Modal inline Criar/Editar Cliente do form de Pedido (SURF-016..
// 019, IG-018..021, F-030..F-053, 97-Esteiras/043). Botão "+"/"editar" ao
// lado do select de cliente em `CreateOrUpdateOrder.tsx`.
//
// DESBLOQUEIO GAP-API-FE-01 / PARADA-M (decisão do dono, registrada na
// Tarefa) — o `ClientRequest` do backend já cobre TODOS os campos legados de
// cliente (F-030..F-053), EXCETO `is_enabled`: a fachada `POST/PUT /clients`
// força esse campo a `true` por design (cliente criado/editado a partir de
// um Pedido nasce/permanece sempre ATIVO — a tela completa de Clientes cuida
// de desabilitar depois). Decisão: o modal inline OMITE o campo `is_enabled`
// da UI. Sem mudança de contrato de API.
//
// DECISÃO DE FIDELIDADE do Executor (reuso, não é Gap) — a Tarefa pede
// "reusar o modal de cliente já existente no módulo Vendas, se houver". Ele
// existe: `ClientFormModal` (`pages/CadastrosBase/Clientes/ClientFormModal.tsx`)
// é o modal GENÉRICO já em produção (mesmo `useClientFormController`/
// `ClientFormFields`, mesmo `client-service.ts`) reutilizado por
// `VendaAnimais/CreateClientQuickModal.tsx`, `ContratosVenda`,
// `MovCaixaBancario`, `NfeEmitidas`, `Incomes` — cobre TODOS os campos
// F-030..F-053 (incl. cidade `SelectAsyncPaginate cities/options` ≥3 chars —
// IG-020 — e `state_registrations[]` via `useFieldArray` — IG-021), já
// hidrata por `GET clients/{uuid}` em modo edição (IG-018) e já devolve
// `{uuid, label}` via `onSaved` para o pai selecionar (IG-019). Reaproveitar
// esse componente é FIDELIDADE (mesma UX que todo o resto do fork usa hoje
// para Cliente), não duplicar ~500 linhas de form/autofill de CEP/NIF que o
// `ClientFormModal` já resolve. Este arquivo é um wrapper FINO (mirror
// `CreateClientQuickModal.tsx`), sem alterar a assinatura pública do modal
// reusado — só acrescenta `hideIsEnabled` (prop aditiva/opt-in, ver
// `ClientFormFields.tsx`) e repassa `clientUuid` para habilitar o modo
// EDIÇÃO que `CreateClientQuickModal` (sempre criação) não expõe.
//
// CLM-031 (defeito legado "clear não limpa farm_name/IE") — NÃO reproduzido:
// este modal (como o legado real de Cliente já migrado) não tem botão
// "Limpar" — só Cancelar (fecha sem salvar) e Salvar. Sem superfície para o
// defeito se manifestar.
//
// IG-021 (adaptação consciente) — a Tarefa original descrevia
// `state_registrations[]` como "add só com linha preenchida, remove mantém
// ≥1". O `ClientFormFields` reusado (comportamento já em produção, usado por
// TODOS os outros papéis de Cliente do fork) permite 0+ inscrições sem esse
// gate — mesma UX que o resto do sistema já usa para o mesmo campo. Manter
// paridade com o componente compartilhado (em vez de reabrir uma variante
// bespoke só para Pedidos) é a leitura de fidelidade adotada aqui.
// -----------------------------------------------------------------------------

import {
  ClientFormModal,
  type ClientFormModalSavedPayload,
} from '@/pages/CadastrosBase/Clientes/ClientFormModal';

export type { ClientFormModalSavedPayload };

export interface InlineClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** uuid do Cliente para EDITAR (IG-018, hidrata via `GET clients/{uuid}`);
   *  `undefined`/vazio = modo CRIAR. */
  clientUuid?: string;
  /** Disparado após criar/editar com sucesso (IG-019) — o pai (`Pedidos`)
   *  seleciona a option no select de cliente do formulário; o modal fecha
   *  sozinho (comportamento do `ClientFormModal` reusado). */
  onSaved: (client: ClientFormModalSavedPayload) => void;
}

export function InlineClientModal({
  isOpen,
  onClose,
  clientUuid,
  onSaved,
}: InlineClientModalProps) {
  return (
    <ClientFormModal
      isOpen={isOpen}
      onClose={onClose}
      clientUuid={clientUuid}
      onSaved={onSaved}
      hideIsEnabled
    />
  );
}
