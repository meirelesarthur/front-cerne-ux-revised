// src/@types/v2/Common/user-agents.d.ts
// Interface de traduções para a página de Agents (agentes próprios do usuário)

export interface UserAgentsLanguage {
  singularLabel: string;
  pluralLabel: string;
  pageTitle: string;
  pageSubtitle: string;
  entity: string;

  columns: {
    id: string;
    name: string;
    description: string;
    type: string;
    model: string;
    phase: string;
    default: string;
    tools: string;
  };

  defaultBadge: {
    yes: string;
    no: string;
  };

  actions: {
    createAgent: string;
    editAgent: string;
    deleteAgent: string;
    manageTools: string;
  };

  toast: {
    deleted: string;
  };

  createOrUpdate: {
    createTitle: string;
    editTitle: string;
    createSubtitle: string;
    editSubtitle: string;
    tabs: {
      generalInfo: string;
      tools: string;
      mcps: string;
    };
    fields: {
      name: string;
      agentType: string;
      model: string;
      phase: string;
      description: string;
      instructions: string;
    };
    placeholders: {
      name: string;
      agentType: string;
      model: string;
      phase: string;
      description: string;
      instructions: string;
    };
    validation: {
      nameRequired: string;
      nameMinLength: string;
      typeRequired: string;
      modelRequired: string;
      phaseRequired: string;
      instructionsRequired: string;
    };
    agentTypes: {
      pentest: string;
      general: string;
      support: string;
      custom: string;
    };
  };

  toolsTab: {
    title: string;
    subtitle: string;
    loading: string;
    noToolsAvailable: string;
    entity: string;
    disabledBadge: string;
    tooltips: {
      selectedNotSaved: string;
      deselectedNotSaved: string;
      assignedToAgent: string;
      notAssigned: string;
    };
    stats: {
      total: string;
      assigned: string;
      coverage: string;
    };
    buttons: {
      cancelChanges: string;
      saveTools: string;
    };
    toast: {
      updated: string;
    };
    pendingChanges: {
      title: string;
      titlePlural: string;
      description: string;
    };
    protectedAgent: {
      title: string;
      description: string;
    };
  };
}
