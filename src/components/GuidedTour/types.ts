// src/components/GuidedTour/types.ts
// Contrato do tutorial guiado (Driver.js). Veja docs/ux/funcionalidades/onboarding-tour.md.

export type TourSide = 'top' | 'right' | 'bottom' | 'left';

export interface TourStep {
  /** Identificador estável do passo (não muda entre versões do fluxo). */
  id: string;
  /**
   * Rota onde o passo acontece. Se o usuário estiver em outra, o motor navega antes de mostrar.
   * Aceita só o prefixo do caminho (ex.: '/cadastros-base/fazendas').
   */
  route?: string;
  /**
   * Seletor CSS do elemento destacado. Prefira `[data-tour="..."]`: atributos estáveis que não
   * dependem de classe/estilo. Sem `element` o passo vira um aviso centralizado.
   */
  element?: string;
  title: string;
  description: string;
  side?: TourSide;
  /**
   * `click`: o passo avança quando o usuário clica no próprio elemento (o botão "Próximo" some).
   * Padrão: avança pelo botão "Próximo".
   */
  advanceOn?: 'click';
  /**
   * Só mostra o passo quando este seletor existir (ex.: a etapa N do assistente está aberta).
   * O motor espera sem limite; se o usuário abandonar o fluxo, a espera é cancelada.
   */
  showWhen?: string;
  /** Avança sozinho quando este seletor passar a existir (ex.: o usuário foi para a próxima etapa). */
  advanceWhen?: string;
  /** Se o elemento não aparecer (ex.: permissão, grupo recolhido), pula o passo em vez de travar. */
  optional?: boolean;
  /** Tempo máximo (ms) esperando o elemento aparecer. Padrão 4000. */
  waitMs?: number;
}

export interface TourFlow {
  id: string;
  title: string;
  description: string;
  /** Ícone do kit (`design/icons.ts`). */
  icon: string;
  /** Pontos ganhos ao concluir (gamificação). */
  points: number;
  /** Minutos estimados. */
  minutes: number;
  steps: TourStep[];
}

export type TourStatus = 'idle' | 'in_progress' | 'skipped' | 'completed';

export interface FlowProgress {
  status: TourStatus;
  /** Último passo mostrado (índice em `steps`), para "Continuar de onde parou". */
  stepIndex: number;
  updatedAt: string;
  completedAt?: string;
}

/** Tudo o que é persistido por usuário. Ao ligar a API, é este objeto que vai e volta. */
export interface TourState {
  flows: Record<string, FlowProgress>;
  /** O tutorial só existe para quem chegou pelo fluxo "Criar conta": liga na primeira entrada. */
  enabled?: boolean;
  /** Fluxo a iniciar sozinho no próximo carregamento do sistema (ex.: logo após criar a conta). */
  autoStart?: string | null;
}
