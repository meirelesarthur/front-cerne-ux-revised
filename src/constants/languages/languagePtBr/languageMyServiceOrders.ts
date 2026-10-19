// src/constants/languages/languagePtBr/languageMyServiceOrders.ts
// Tradução PT-BR do módulo OPERACIONAL — Minhas OS (MyServiceOrder) —
// domínio próprio, esteira 063 (TASK-MOS-FE-01).

import { ModuleMyServiceOrders } from '@/@types/language/module-my-service-orders';

export const languageMyServiceOrders: ModuleMyServiceOrders = {
  myServiceOrder: {
    singularLabel: 'Minha OS',
    pluralLabel: 'Minhas OS',
    list: {
      pageTitle: 'Minhas OS',
      pageSubtitle: 'Ordens de serviço sob sua responsabilidade de execução.',
      table: {
        status: 'Status',
        code: 'Código',
        dtEmission: 'Data de Emissão',
        deadline: 'Prazo',
        user: 'Solicitante',
        executor: 'Responsável',
      },
      actions: {
        view: 'Visualizar',
        execute: 'Executar',
      },
      filter: {
        title: 'Filtrar Minhas OS',
        code: 'Código',
        codePlaceholder: 'Buscar por código',
        startDate: 'Data inicial',
        endDate: 'Data final',
        paginationQuantity: 'Itens por página',
      },
      emptyState: {
        title: 'Nenhuma OS encontrada.',
        description: 'Ordens de serviço sob sua responsabilidade aparecerão aqui.',
        titleFiltered: 'Nenhuma OS encontrada.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
      },
      error: {
        message: 'Não foi possível carregar as ordens de serviço.',
        retry: 'Tentar novamente',
      },
    },
    form: {
      title: 'Executar Ordem de Serviço',
      subtitle: 'Registre a execução desta ordem de serviço.',
      sections: {
        execution: 'Execução',
        labor: 'Mão de obra',
        equipment: 'Máq/Implementos',
        products: 'Insumos',
        productions: 'Produção',
        protections: 'Proteções(EPI)',
        attachments: 'Evidências',
      },
      readonly: {
        sections: {
          identification: 'Identificação da OS',
          serviceType: 'Tipo de serviço',
          execution: 'Execução',
          conditions: 'Condições e Restrições',
          instructions: 'Instruções Detalhadas',
          safety: 'Segurança e Sustentabilidade',
        },
        fields: {
          code: 'Código',
          user: 'Requisitante',
          executor: 'Encarregado',
          dtEmission: 'Dt. Emissão',
          executionDate: 'Dt. Execução',
          deadline: 'Prazo Final',
          serviceFarm: 'Fazenda',
          category: 'Uso',
          operation: 'Operação',
          activity: 'Atividade',
          area: 'Área',
          cultivation: 'Cultura/Variedade',
          batch: 'Lote',
          categoryAnimal: 'Categoria',
          weatherRequirements: 'Requisitos Climáticos',
          minimumTemperature: 'Temperatura Mínima(C°)',
          maximumTemperature: 'Temperatura Máxima(C°)',
          allowedWorkingPeriodStart: 'Horário de Execução Permitido(Início)',
          allowedWorkingPeriodEnd: 'Horário de Execução Permitido(Final)',
          serviceDescription: 'Descrição do Serviço',
          expectedResultDescription: 'Resultado Esperado',
          successCriteriaDescription: 'Critérios de Sucesso',
          roadmapDescription: 'Roteiro/Planejamento',
          environmentalRestrictions: 'Restrições Ambientais',
          legalCompliance: 'Conformidade Legal',
        },
      },
      fields: {
        status: 'Status',
        executionStartDate: 'Dt. Início',
        executionEndDate: 'Dt. Conclusão',
        executionProblems: 'Problemas Encontrados',
        correctiveActions: 'Ações corretivas',
        attachmentFile: 'Arquivo',
        attachmentName: 'Nome do anexo',
      },
      placeholders: {
        status: 'Selecione o status',
      },
      checklist: {
        itemLabel: 'Item',
        isChecked: 'Concluído',
        emptyRow: 'Nenhum item cadastrado nesta seção.',
      },
      attachmentRow: {
        addButton: 'Adicionar anexo',
        removeButton: 'Remover',
        dropzoneTitle: 'Arraste um arquivo ou clique para selecionar',
        dropzoneDragging: 'Solte o arquivo aqui',
        changeLabel: 'Alterar arquivo',
        clearFileLabel: 'Remover arquivo',
        replaceLabel: 'Substituir',
        existingFileLabel: 'Arquivo já enviado',
        hint: 'PDF, imagem (JPG, PNG, GIF), Word, Excel, CSV ou TXT — até 10 MB.',
        errorType: 'Tipo de arquivo não aceito. Envie PDF, imagem, Word, Excel, CSV ou TXT.',
        errorSize: 'O arquivo deve ter no máximo 10 MB.',
        defaultName: 'Nome do anexo',
        nameRequired: 'Informe um nome para o anexo.',
      },
      updatedToast: 'Execução registrada com sucesso',
      notFound: {
        title: 'OS não disponível.',
        description:
          'Não foi possível carregar esta ordem de serviço. Ela pode não existir mais ou não estar sob sua responsabilidade.',
        back: 'Voltar para a listagem',
      },
      readOnly: {
        title: 'Visualizar Ordem de Serviço',
        subtitle:
          'Consulte esta ordem de serviço. A execução não está disponível para esta situação.',
        statusLabel: 'Situação',
        back: 'Voltar',
      },
      executionEndDateRequiredWhenCompleted: 'Obrigatório quando o status é "Concluída".',
    },
  },
};
