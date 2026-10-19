// src/constants/Fiscal/xml-document/xml-document-state.ts
// Heurística de cor do badge de `state` (Arquivos XML — F-133, esteira
// 97-Esteiras/008, Tarefa 36, AD-F05 do contrato de tela). `state` é STRING
// CRUA do servidor, SEM Enum (AD-08 do contrato de API — vocabulário
// heterogêneo por tipo de documento: NFe/MDFe têm string livre
// [novo|aprovado|cancelado|rejeitado], DFe deriva de `tipo_evento`
// [Ciência|Confirmada|Desconhecimento|Operação não realizada|Sem evento],
// NFSe deriva Lançada/Não lançada). A heurística de SUBSTRING é fidelidade
// ao legado (`str_contains(strtolower($estado), 'aprov'|'cancel')`) — não é
// simplificação nossa. Só a COR é derivada; o texto exibido é o `state` cru
// em caixa alta, NUNCA traduzido (traduzir inventaria vocabulário).
//
// Mirror do padrão `Badge` + mapa em `constants` + fallback já consolidado
// no fork (`RequestMovementHistory.tsx::statusColorPalette`).

export function xmlDocumentStateColorPalette(state: string | null): 'green' | 'red' | 'gray' {
  if (!state) return 'gray';
  const normalized = state.toLowerCase();
  if (normalized.includes('aprov')) return 'green';
  if (normalized.includes('cancel')) return 'red';
  return 'gray';
}
