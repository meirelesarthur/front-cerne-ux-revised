// src/constants/FeedlotCorrals/feedlot-corral-status-color.ts
// Cor do DOT de status da listagem standalone de Currais (LM-010, T02,
// `02-Tela-Lista-Currais.md`). `FeedlotCorralResource` (GB.Cerne.Api) só
// expõe `status.value`/`status.label` — NÃO envia uma cor (diferente de
// `capacity_status`, que já vem pronto do backend). Mirror por VALOR do
// enum `App\Enums\FeedlotCorralStatus` (mesmas 7 chaves de
// `feedlotCorralStatus`, `src/constants/FeedlotMap/feedlot-corral-status.ts`,
// reusado sem duplicar os valores), mas em TOKEN semântico Chakra
// (`colorPalette`), não hex — mirror do padrão já usado em
// `Operacional/Budget/index.tsx` (`budgetStatusColor`), não do hex bruto do
// Mapa (`CardCurral`, que é dado vindo do backend, não decisão de UI local).

import { feedlotCorralStatus } from '@/constants/FeedlotMap/feedlot-corral-status';

export const feedlotCorralStatusColor: Record<string, string> = {
  [feedlotCorralStatus.available]: 'gray',
  [feedlotCorralStatus.reserved]: 'purple',
  [feedlotCorralStatus.occupied]: 'green',
  [feedlotCorralStatus.maintenance]: 'yellow',
  [feedlotCorralStatus.cleaning]: 'blue',
  [feedlotCorralStatus.sanitaryHold]: 'orange',
  [feedlotCorralStatus.closed]: 'red',
};
