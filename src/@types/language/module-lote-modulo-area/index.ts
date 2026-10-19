// src/@types/language/module-lote-modulo-area/index.ts
// Interface de tradução do módulo "Lote/Módulo/Área" (BatchModuleAreaTransfer —
// Operacional > Pecuária > Transferências, 97-Esteiras/070,
// TASK-LMA-FE-01..04). O conteúdo mora em
// src/constants/languages/{idioma}/languageLoteModuloArea.ts. Mirror
// estrutural de `module-lote-fazenda/index.ts` (mesma classe de feature:
// grid + transferência com destino mutuamente exclusivo), acrescido do 3º
// destino (Curral) e do bloco de cascata (`TASK-LMA-FE-04`).
//
// Chave TOP-LEVEL `loteModuloArea` — LIVRE, sem colisão com `loteFazenda`
// (`transferBatchFarm`, feature entre FAZENDAS) nem com `cadastrosBase`
// (`/cadastros-base/lote-modulo`, feature-irmã "Lote/Módulo" já migrada).
export interface ModuleLoteModuloArea {
  loteModuloArea: {
    batchModuleAreaTransfer: {
      singularLabel: string;
      pluralLabel: string;
      list: {
        pageTitle: string;
        table: {
          code: string;
          description: string;
          animalsCount: string;
          currentLink: string;
          actions: string;
          noCurrentLink: string;
        };
        filter: {
          batch: string;
          batchPlaceholder: string;
        };
        actions: {
          filter: string;
          clearFilter: string;
          edit: string;
        };
        error: {
          message: string;
          retry: string;
        };
        emptyState: {
          titleEmpty: string;
          descriptionEmpty: string;
        };
      };
      form: {
        title: string;
        fields: {
          code: string;
          date: string;
          user: string;
          batch: string;
          qtd: string;
          area: string;
          areaDestination: string;
          grazingDestination: string;
          corralDestination: string;
        };
        saveButton: string;
        cancelButton: string;
        successToast: string;
        validation: {
          destinationRequired: string;
        };
        /** Falha ao carregar `create-options` (GET) — erro honesto, nunca
         *  mascarado como vazio (TASK-LMA-FE-03). */
        error: {
          message: string;
        };
      };
      cascade: {
        dateInvalidForArea: string;
        dateInvalidForGrazing: string;
        dateInvalidForCorral: string;
        /** IG-4 — falha do `check-date{date,batch_uuid}` disparado só pela troca de
         *  data (sem destino selecionado ainda, ou caminho genérico da 2ª chamada
         *  aninhada). Mirror do swal genérico do legado, TASK-LMA-FE-04. */
        dateInvalidGeneric: string;
      };
    };
  };
}
