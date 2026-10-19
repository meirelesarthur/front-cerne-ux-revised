// src/constants/FeedlotMap/feedlot-corral-capacity-bands.ts
// 5 faixas de cor da capacidade utilizada do curral (`CV05`, `LM06`) — Mapa
// de Confinamento, TASK-FE-042-201. A COR em si já vem pronta do backend
// (`corral.capacity_status`, `GetFeedlotMapTreeAction::resolveCapacityStatusColor`)
// — este módulo só declara a LEGENDA (mirror `tooltipLines` de
// `CardCurral.js`), para o tooltip do badge de capacidade.

export interface FeedlotCorralCapacityBand {
  color: string;
  label: string;
}

// Mirror EXATO das 5 faixas do legado (`CardCurral.js`, `tooltipLines`) e do
// backend (`resolveCapacityStatusColor`) — azul/verde/amarelo/vermelho/vinho.
export const feedlotCorralCapacityBands: FeedlotCorralCapacityBand[] = [
  { color: '#5396d5', label: 'Azul 0%' },
  { color: '#009900', label: 'Verde 1%-74,99%' },
  { color: '#ffe600', label: 'Amarelo 75%-89,99%' },
  { color: '#ff0000', label: 'Vermelho 90%-100%' },
  { color: '#8b0000', label: 'Vinho >100%' },
];
