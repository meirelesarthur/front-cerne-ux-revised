// src/@types/language/module-admin/mcp.d.ts
// Interface de tradução para o módulo MCP Servers

export interface McpServersLanguage {
  singularLabel: string;
  pluralLabel: string;
  pageTitle: string;
  pageSubtitle: string;

  formTitle: {
    create: string;
    edit: string;
  };
  formSubtitle: {
    create: string;
    edit: string;
  };

  fields: {
    name: string;
    description: string;
    transportType: string;
    url: string;
    command: string;
    args: string;
    env: string;
    headers: string;
    authType: string;
    authConfig: string;
    enabled: string;
    owner: string;
    createdAt: string;
  };

  placeholders: {
    name: string;
    description: string;
    url: string;
    command: string;
    searchMcp: string;
    envKey: string;
    envValue: string;
    headerKey: string;
    headerValue: string;
    addArg: string;
  };

  transportTypes: {
    streamableHttp: string;
    sse: string;
    stdio: string;
  };

  authTypes: {
    none: string;
    apiKey: string;
    bearer: string;
    oauth: string;
  };

  authFields: {
    token: string;
    apiKey: string;
    clientId: string;
    clientSecret: string;
    tokenUrl: string;
    placeholders: {
      token: string;
      clientId: string;
      clientSecret: string;
      tokenUrl: string;
    };
  };

  table: {
    description: string;
    transport: string;
    authType: string;
    owner: string;
    url: string;
  };

  tabs: {
    mcps: string;
  };

  toast: {
    created: string;
    updated: string;
    deleted: string;
    restored: string;
    enabled: string;
    disabled: string;
    mcpsAssigned: string;
  };

  ariaLabels: {
    edit: string;
    delete: string;
    enable: string;
    disable: string;
    restore: string;
  };

  filter: {
    transportType: string;
    authType: string;
    includeDeleted: string;
  };

  keyValueSection: {
    addRow: string;
    removeRow: string;
    key: string;
    value: string;
  };

  argSection: {
    addArg: string;
    removeArg: string;
    argPlaceholder: string;
  };

  agentMcps: {
    title: string;
    subtitle: string;
    assigned: string;
    available: string;
    noMcpsAvailable: string;
    noMcpsAssigned: string;
    createFirst: string;
    loadingMcps: string;
    stats: {
      totalMcps: string;
      assigned: string;
      available: string;
    };
    pendingChanges: {
      title: string;
      titlePlural: string;
      description: string;
    };
    tooltip: {
      selectedNotSaved: string;
      uncheckedNotSaved: string;
      selectedSaved: string;
      notSelected: string;
    };
    buttons: {
      cancel: string;
      save: string;
    };
  };

  validation: {
    nameRequired: string;
    nameMinLength: string;
    nameMaxLength: string;
    descriptionMaxLength: string;
    urlRequired: string;
    urlInvalid: string;
    commandRequired: string;
    transportTypeRequired: string;
    authTypeRequired: string;
  };

  settings: {
    title: string;
    enabled: string;
    enabledDesc: string;
  };
}
