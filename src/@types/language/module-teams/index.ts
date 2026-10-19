// src/@types/language/module-teams/index.ts
// Interface de traduções para o módulo Teams

export interface TeamsLanguage {
  // Títulos principais
  pageTitle: string;
  pageSubtitle: string;

  // Seções
  myTeams: string;
  overview: string;
  members: string;
  roles: string;
  agents: string;

  // Campos comuns
  fields: {
    name: string;
    description: string;
    maxMembers: string;
    memberCount: string;
    status: string;
    createdAt: string;
    owner: string;
    level: string;
    permissionsCount: string;
  };

  // Ações
  actions: {
    createTeam: string;
    editTeam: string;
    deleteTeam: string;
    leaveTeam: string;
    viewMembers: string;
    manageRoles: string;
    viewDetails: string;
    addMember: string;
    removeMember: string;
    createRole: string;
    editRole: string;
    deleteRole: string;
    managePermissions: string;
    assignAgent: string;
    removeAgent: string;
  };

  // Aria labels
  ariaLabels: {
    viewMembers: string;
    manageRoles: string;
    edit: string;
    delete: string;
    leave: string;
    addMember: string;
    removeMember: string;
    managePermissions: string;
    assignAgent: string;
    removeAgent: string;
  };

  // Toasts
  toast: {
    teamCreated: string;
    teamUpdated: string;
    teamDeleted: string;
    teamLeft: string;
    memberAdded: string;
    memberRemoved: string;
    roleCreated: string;
    roleUpdated: string;
    roleDeleted: string;
    permissionAdded: string;
    permissionRemoved: string;
    agentAssigned: string;
    agentRemoved: string;
  };

  // Modais
  modals: {
    createTeam: string;
    editTeam: string;
    deleteTeam: string;
    leaveTeam: string;
    leaveTeamDescription: string;
    createRole: string;
    editRole: string;
    deleteRole: string;
    addMember: string;
    removeMember: string;
    addPermission: string;
    removePermission: string;
    assignAgent: string;
    removeAgent: string;
  };

  // Placeholders
  placeholders: {
    teamName: string;
    teamDescription: string;
    maxMembers: string;
    searchTeam: string;
    searchMember: string;
    searchRole: string;
    searchAgent: string;
    roleName: string;
    roleDescription: string;
    roleLevel: string;
  };

  // Mensagens
  messages: {
    noTeams: string;
    noMembers: string;
    noRoles: string;
    noAgents: string;
    noPermissions: string;
    teamOwner: string;
    confirmDelete: string;
    confirmRemoveMember: string;
    confirmRemovePermission: string;
    confirmRemoveAgent: string;
  };

  // Tabs
  tabs: {
    overview: string;
    members: string;
    roles: string;
    agents: string;
  };

  // SelectTeam component
  selectTeam: {
    title: string;
    loading: string;
    noTeamsFound: string;
  };

  // Meus Convites (MyInvites)
  myInvites: {
    pageTitle: string;
    pageSubtitle: string;
    refresh: string;
    columns: {
      id: string;
      team: string;
      role: string;
      status: string;
      invitedBy: string;
      expiresAt: string;
    };
    statusLabels: {
      accepted: string;
      rejected: string;
      expired: string;
      pending: string;
    };
    actions: {
      accept: string;
      reject: string;
    };
    dialogs: {
      acceptTitle: string;
      rejectTitle: string;
      acceptDescription: string;
      rejectDescription: string;
    };
    entity: string;
    toast: {
      accepted: string;
      rejected: string;
    };
  };

  // Agentes da Equipe (TeamAgents)
  teamAgents: {
    pageTitle: string;
    pageSubtitle: string;
    createAgent: string;
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
    actions: {
      manageTools: string;
      editAgent: string;
      removeAgent: string;
    };
    defaultBadge: {
      yes: string;
      no: string;
    };
    entity: string;
    toast: {
      removed: string;
    };
    createOrUpdate: {
      editTitle: string;
      createTitle: string;
      editSubtitle: string;
      createSubtitle: string;
      tabs: {
        generalInfo: string;
        tools: string;
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
      loading: string;
      noToolsAvailable: string;
      title: string;
      subtitle: string;
      stats: {
        totalTools: string;
        assigned: string;
        unassigned: string;
        coverage: string;
      };
      pendingChanges: {
        singular: string;
        plural: string;
        saveMessage: string;
      };
      buttons: {
        cancel: string;
        save: string;
        cancelChanges: string;
        saveTools: string;
      };
      tooltips: {
        selectedNotSaved: string;
        deselectedNotSaved: string;
        assignedToAgent: string;
        notAssigned: string;
      };
      disabledBadge: string;
      entity: string;
      toast: {
        updated: string;
      };
      protectedAgent: {
        title: string;
        description: string;
      };
    };
  };

  // Convites da Equipe (TeamInvites)
  teamInvites: {
    pageTitle: string;
    pageSubtitle: string;
    columns: {
      id: string;
      email: string;
      role: string;
      status: string;
      expiresAt: string;
      createdAt: string;
      invitedBy: string;
    };
    actions: {
      resend: string;
      cancel: string;
    };
    entity: string;
    toast: {
      resent: string;
      cancelled: string;
    };
    createModal: {
      subtitle: string;
      emailRequired: string;
      emailPlaceholder: string;
      roleLabel: string;
      rolePlaceholder: string;
    };
    filter: {
      statusLabel: string;
      statusOptions: {
        pending: string;
        accepted: string;
        rejected: string;
        expired: string;
      };
    };
  };

  // Membros da Equipe (TeamMembers)
  teamMembers: {
    pageSubtitle: string;
    columns: {
      id: string;
      username: string;
      email: string;
      fullName: string;
      joinedAt: string;
    };
    ownerBadge: string;
    actions: {
      removeMember: string;
    };
    entity: string;
    toast: {
      removed: string;
      cannotRemoveSelf: string;
    };
  };

  // Roles da Equipe (TeamRoles)
  teamRoles: {
    pageTitle: string;
    pageSubtitle: string;
    columns: {
      id: string;
      name: string;
      description: string;
      level: string;
      permissions: string;
      createdAt: string;
    };
    actions: {
      restore: string;
      managePermissions: string;
      editRole: string;
      deleteRole: string;
    };
    showDeleted: string;
    entity: string;
    toast: {
      deleted: string;
      restored: string;
    };
    createOrUpdate: {
      editTitle: string;
      createTitle: string;
      editSubtitle: string;
      createSubtitle: string;
      tabs: {
        generalInfo: string;
        permissions: string;
      };
      fields: {
        name: string;
        level: string;
        description: string;
      };
      placeholders: {
        name: string;
        level: string;
        description: string;
      };
      validation: {
        nameRequired: string;
        nameMinLength: string;
        levelRequired: string;
        levelMinValue: string;
        teamIdRequired: string;
      };
      error: string;
    };
    permissionsTab: {
      loading: string;
      noPermissionsAvailable: string;
      title: string;
      subtitle: string;
      stats: {
        total: string;
        assigned: string;
        activeGroups: string;
        unassigned: string;
        coverage: string;
      };
      pendingChanges: {
        singular: string;
        plural: string;
        saveMessage: string;
      };
      buttons: {
        cancel: string;
        save: string;
        cancelChanges: string;
        savePermissions: string;
      };
      available: string;
      active: string;
      tooltips: {
        willBeAdded: string;
        willBeRemoved: string;
        active: string;
        inactive: string;
      };
      entity: string;
      toast: {
        saved: string;
      };
    };
  };

  // TeamsList (Criação/Edição + Abas)
  teamsList: {
    createOrUpdate: {
      editSubtitle: string;
      createSubtitle: string;
      tabs: {
        generalInfo: string;
        members: string;
        agents: string;
        usage: string;
      };
      sendInvite: string;
      validation: {
        nameMinLength: string;
        membersMin: string;
        membersMax: string;
      };
    };
    membersTab: {
      loading: string;
      title: string;
      subtitle: string;
      badge: {
        singular: string;
        plural: string;
      };
      sendInvite: string;
      infoTitle: string;
      infoDescription: string;
      currentMembers: string;
      noMembers: string;
      sendFirstInvite: string;
      removeTooltip: string;
      entity: string;
      toast: {
        removed: string;
      };
    };
    agentsTab: {
      loading: string;
      title: string;
      subtitle: string;
      badge: {
        singular: string;
        plural: string;
      };
      addAgent: string;
      agentsCount: string;
      noAgents: string;
      removeTooltip: string;
      entity: string;
      toast: {
        removed: string;
      };
    };
  };

  // Team Usage
  teamUsage: {
    pageTitle: string;
    pageSubtitle: string;
    stats: {
      operations: string;
      totalTokens: string;
      totalCost: string;
      budget: string;
      chatLabel: string;
      pentestsLabel: string;
      inputLabel: string;
      outputLabel: string;
      cacheReadLabel: string;
      cacheWriteLabel: string;
      includedLabel: string;
      onDemandLabel: string;
      unlimitedLabel: string;
    };
    plan: {
      title: string;
      customPricing: string;
      perMonth: string;
      membersCount: string;
      onDemand: {
        title: string;
        description: string;
      };
    };
    charts: {
      dailyCost: string;
      models: string;
      noData: string;
      noModels: string;
      opsLabel: string;
    };
    members: {
      title: string;
      columns: {
        member: string;
        email: string;
        cost: string;
        tokens: string;
        operations: string;
        topModels: string;
      };
      noMembers: string;
      viewDetails: string;
      memberDetail: {
        title: string;
        backToList: string;
        totalCost: string;
        totalTokens: string;
        totalOperations: string;
        inputTokens: string;
        outputTokens: string;
        cacheReadTokens: string;
        cacheWriteTokens: string;
        billingPeriod: string;
        modelBreakdown: string;
        topAgents: string;
        noModels: string;
        opsLabel: string;
        tokenDistribution: string;
      };
    };
    history: {
      title: string;
      columns: {
        type: string;
        model: string;
        agent: string;
        input: string;
        output: string;
        cacheRead: string;
        cacheWrite: string;
        cost: string;
        user: string;
        date: string;
      };
      noHistory: string;
      records: string;
    };
    toast: {
      onDemandUpdated: string;
    };
    loading: string;
    entity: string;
  };
}
