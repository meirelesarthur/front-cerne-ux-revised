// src/@types/language/module-batch-transfers/index.ts
// -----------------------------------------------------------------------------
// Interface de tradução do módulo TRANSFERÊNCIA ANIMAIS/LOTE (BatchTransfer —
// Operacional > Pecuária > Transferências, feature `426be835`,
// TASK-LOTE-FE-01/02). Espelha a convenção de `module-batches/index.ts`.
// Conteúdo mora em src/constants/languages/{idioma}/languageBatchTransfers.ts.
//
// Namespace `batchTransfers` — distinto de `batches` (módulo de Lotes,
// Cadastros Base) para não colidir; esta feature consome `batches` só como
// lookup (`create-options.batches`), nunca reaproveita o namespace de i18n.
//
// Tarefa 26 (fundação + listagem) cobre `batchTransfer.{singularLabel,
// pluralLabel,list,filter}`. Tarefa 27 (formulário) acrescenta
// `batchTransfer.form`.
// -----------------------------------------------------------------------------

export interface ModuleBatchTransfers {
  batchTransfer: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      /** Prefixo do total exibido a partir de `meta.total` (o "Quantidade: N" do legado). */
      totalCountLabel: string;
      newTransference: string;
      table: {
        type: string;
        identification: string;
        age: string;
        category: string;
        batch: string;
      };
      /** Rótulos do mapper de `type` (§5.2) — `'batch'` → `batch`, senão → `individual`. */
      typeOptions: {
        batch: string;
        individual: string;
      };
      emptyState: {
        title: string;
        description: string;
      };
      error: {
        title: string;
        retry: string;
      };
    };
    filter: {
      title: string;
      category: string;
      batch: string;
      identification: string;
      /** Texto de ajuda OBRIGATÓRIO (contrato §5.3) — a busca por Identificação é igualdade EXATA, não parcial. */
      identificationHint: string;
    };
    /** Tela de formulário (contrato §6, Tarefa 27). */
    form: {
      title: { create: string };
      subtitle: { create: string };
      fields: {
        code: string;
        date: string;
        user: string;
        batchFilter: string;
        category: string;
        minWeight: string;
        maxWeight: string;
        newBatch: string;
      };
      placeholders: {
        minWeight: string;
        maxWeight: string;
        batchFilter: string;
        category: string;
        newBatch: string;
      };
      /** Mensagens de validação Yup — `date`/`new_batch_uuid` `required` (contrato §6.1/§6.6). */
      validation: {
        dateRequired: string;
        newBatchRequired: string;
        /** "Selecione ao menos um animal para realizar a transferência." — checado no `onSubmit`, fora do schema Yup. */
        atLeastOneAnimal: string;
      };
      /** Avisos de faixa de peso (`GAP-LOTE-FE-02`, contrato §6.5) — client-side, fiéis ao legado. */
      warnings: {
        maxWeightLessThanMin: string;
        minWeightGreaterThanMax: string;
        /**
         * Aviso não-bloqueante exibido quando há animais selecionados —
         * melhoria de UX aprovada pelo dono (DEC-027, preserva a regra do
         * gate de pesagem, só antecipa a informação). O payload de
         * `candidate-animals` (`CandidateAnimalResource`) NÃO expõe
         * `grazing`/`control_productivity` nem última pesagem por animal
         * (achado confirmado direto na query do repositório, backend
         * `AnimalRepository::listCandidatesForBatch()` — só
         * `id/uuid/weight/quantity/category_id`) — por isso o texto é
         * GENÉRICO, sem contagem nem lista de quais animais faltam
         * pesagem. A validação real continua sendo o 422 do servidor.
         */
        weighingWarning: string;
      };
      /** Picker de animais por categoria (`CheckboxListField`, contrato §6.3). */
      candidateAnimals: {
        selectAllLabel: string;
        deselectAllLabel: string;
        totalAnimalsLabel: string;
        /** "O lote selecionado não possui animais!" — universo vazio ao filtrar por Lote. */
        emptyLabelBatch: string;
        /** "As categorias selecionadas não possui animais!" — universo vazio ao filtrar por Categoria. */
        emptyLabelCategory: string;
        errorLabel: string;
        retryLabel: string;
        searchPlaceholder: string;
      };
      /** Bloco dos 5 totais (contrato §6.4) — somados no cliente, nunca `/450`. */
      footer: {
        total: string;
        weight: string;
        averageWeight: string;
        totalUa: string;
        averageUa: string;
      };
      toasts: {
        success: string;
      };
    };
  };
}
