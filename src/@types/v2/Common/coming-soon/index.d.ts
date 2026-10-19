// src/@types/v2/Common/coming-soon/index.d.ts
// Interface de tradução para a página "Em Construção"

export interface ComingSoonLanguage {
  /** Título principal */
  title: string;
  /** Mensagem de descrição */
  description: string;
  /** Mensagem de progresso/trabalho em andamento */
  workInProgress: string;
  /** Descrições dos módulos em construção */
  modules: {
    teams: {
      name: string;
      description: string;
    };
    admin: {
      name: string;
      description: string;
    };
  };
}
