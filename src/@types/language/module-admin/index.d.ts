import { ActivityLogsLanguage } from "./activity-logs";
import { AdminChatsLanguage } from "./admin-chats";
import { AdminOperationsLanguage } from "./admin-operations";
import { AdminTicketsLanguage } from "./admin-tickets";
import { McpServersLanguage } from "./mcp";
import { PentestsLanguage } from "./pentests";
import { ScheduledPentestsLanguage } from "./scheduled-pentests";
import { BlacklistLanguage } from "@/@types/v2/Admin/blacklist/blacklist-language";
import { ReferralsLanguage } from "@/@types/v2/Admin/referrals/referrals-language";

// ============================================
// INTERFACES PARA ADMIN PANEL
// ============================================

// Labels comuns
export interface CommonLabels {
  singularLabel: string;
  pluralLabel: string;
}

// Strings comuns de tabela
interface TableStrings {
  id: string;
  name: string;
  description: string;
  status: string;
  actions: string;
  createdAt: string;
  yes: string;
  no: string;
  active: string;
  inactive: string;
  deleted: string;
  default: string;
  loading: string;
  noData: string;
  error: string;
  protected: string;
}

// Strings comuns de formulário
interface FormStrings {
  required: string;
  minLength: string;
  minValue: string;
  maxValue: string;
  invalidEmail: string;
  passwordsNotMatch: string;
}

// Strings de toast/notificação
interface ToastStrings {
  featureInDevelopment: string;
  enabledSuccess: string;
  disabledSuccess: string;
  savedSuccess: string;
  cannotDeleteDefault: string;
  cannotDeleteProtected: string;
  teamIdRequired: string;
  deleteSuccess: string;
  restoreSuccess: string;
}

// Strings de dialog de exclusão
interface DeleteDialogStrings {
  title: string;
  description: string;
  warning: string;
  confirm: string;
}

// Strings de dialog de restauração
interface RestoreDialogStrings {
  title: string;
  description: string;
  warning: string;
  confirm: string;
}

// Strings de dialog de confirmação genérica
interface ConfirmDialogStrings {
  enable: {
    title: string;
    description: string;
  };
  disable: {
    title: string;
    description: string;
  };
  clone: {
    title: string;
    description: string;
  };
  restore: {
    title: string;
    description: string;
  };
  archive: {
    title: string;
    description: string;
  };
  unarchive: {
    title: string;
    description: string;
  };
  remove: {
    title: string;
    description: string;
  };
  resend: {
    title: string;
    description: string;
  };
  pause: {
    title: string;
    description: string;
  };
  cancel: {
    title: string;
    description: string;
  };
  unassign: {
    title: string;
    description: string;
  };
  confirm: string;
  warning: string;
}

// Strings de mudanças pendentes
interface PendingChangesStrings {
  title: string;
  titlePlural: string;
  description: string;
}

// Strings de botões comuns
interface ButtonsStrings {
  add: string;
  cancel: string;
  save: string;
  cancelChanges: string;
  saveChanges: string;
}

// ============================================
// MÓDULO: MODELS (Modelos de IA)
// ============================================
interface ModelsLanguage extends CommonLabels {
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
    modelName: string;
    modelAlias: string;
    contextSize: string;
    maxInputTokens: string;
    maxOutputTokens: string;
    description: string;
    reasoning: string;
    agentic: string;
    supportFiles: string;
    enabled: string;
  };
  placeholders: {
    modelName: string;
    modelAlias: string;
    description: string;
  };
  capabilities: {
    title: string;
    enabled: string;
    enabledDesc: string;
    reasoning: string;
    reasoningDesc: string;
    agentic: string;
    agenticDesc: string;
    supportFiles: string;
    supportFilesDesc: string;
  };
  table: {
    alias: string;
    context: string;
  };
  ariaLabels: {
    disable: string;
    enable: string;
    edit: string;
    delete: string;
  };
  toast: {
    enabledSuccess: string;
    disabledSuccess: string;
  };
}

// ============================================
// MÓDULO: PERMISSIONS (Permissões)
// ============================================
interface PermissionsLanguage extends CommonLabels {
  pageTitle: string;
  pageSubtitle: string;
  entityName: string;
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
    method: string;
    tag: string;
    description: string;
    protected: string;
  };
  placeholders: {
    name: string;
    description: string;
  };
  httpMethods: {
    label: string;
  };
  protectedInfo: {
    cannotDelete: string;
    canDelete: string;
  };
  ariaLabels: {
    edit: string;
    delete: string;
  };
  toast: {
    deleted: string;
  };
}

// ============================================
// MÓDULO: ROLES (Roles/Papéis)
// ============================================
interface RolesLanguage extends CommonLabels {
  pageTitle: string;
  pageSubtitle: string;
  entityName: string;
  formTitle: {
    create: string;
    edit: string;
  };
  formSubtitle: {
    create: string;
    edit: string;
  };
  fields: {
    roleName: string;
    color: string;
    description: string;
    memberCount: string;
    permissionCount: string;
    isDefault: string;
  };
  placeholders: {
    roleName: string;
    description: string;
  };
  tabs: {
    generalInfo: string;
    permissions: string;
  };
  permissionsTab: {
    title: string;
    subtitle: string;
    loadingPermissions: string;
    noPermissionsAvailable: string;
    stats: {
      totalPermissions: string;
      assigned: string;
      activeGroups: string;
      notAssigned: string;
      coverage: string;
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
      cancelChanges: string;
      savePermissions: string;
    };
    permissionsCount: string;
    activeCount: string;
  };
  ariaLabels: {
    managePermissions: string;
    edit: string;
    delete: string;
    restore: string;
  };
  selectTeam: string;
  showDeleted: string;
  toast: {
    deleted: string;
    restored: string;
  };
}

// ============================================
// MÓDULO: TEAMS (Times)
// ============================================
interface TeamsLanguage extends CommonLabels {
  pageTitle: string;
  pageSubtitle: string;
  entityName: string;
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
    maxMembers: string;
    memberCount: string;
    status: string;
  };
  placeholders: {
    name: string;
    description: string;
    maxMembers: string;
  };
  validation: {
    minMembers: string;
    maxMembersLimit: string;
  };
  tabs: {
    generalInfo: string;
    members: string;
    agents: string;
  };
  ariaLabels: {
    viewMembers: string;
    manageRoles: string;
    edit: string;
    delete: string;
    activate: string;
    deactivate: string;
  };
  members: {
    title: string;
    subtitle: string;
    username: string;
    email: string;
    role: string;
    memberSince: string;
    noRole: string;
    buttons: {
      back: string;
      addMember: string;
    };
    ariaLabels: {
      manageRoles: string;
      removeFromTeam: string;
    };
    toast: {
      manageRolesDesc: string;
      removeMemberDesc: string;
    };
  };
  membersTab: {
    title: string;
    subtitle: string;
    loadingMembers: string;
    noMembers: string;
    addMember: string;
    selectUser: string;
    selectUserPlaceholder: string;
    role: string;
    selectRolePlaceholder: string;
    teamMembers: string;
    removeTooltip: string;
    singular: string;
    plural: string;
    toast: {
      membersAssigned: string;
      membersRemoved: string;
    };
  };
  agentsTab: {
    title: string;
    subtitle: string;
    loadingAgents: string;
    noAgents: string;
    addAgent: string;
    selectAgentPlaceholder: string;
    teamAgents: string;
    removeTooltip: string;
    singular: string;
    plural: string;
    toast: {
      agentsAssigned: string;
      agentsRemoved: string;
    };
  };
  toast: {
    deleted: string;
    agentsAssigned: string;
    agentsRemoved: string;
    agentRestored: string;
    membersAdded: string;
    membersRemoved: string;
    activated: string;
    deactivated: string;
  };
  enterprise: {
    promoteButton: string;
    revertButton: string;
    promoteDialogTitle: string;
    promoteDialogDescription: string;
    revertDialogTitle: string;
    revertDialogDescription: string;
    fields: {
      customBudgetPerMember: string;
      customMaxMembers: string;
      notes: string;
    };
    placeholders: {
      customBudgetPerMember: string;
      customMaxMembers: string;
      notes: string;
    };
    toast: {
      promoted: string;
      reverted: string;
    };
    currentTier: string;
  };
}

// ============================================
// MÓDULO: USERS (Usuários)
// ============================================
interface UsersLanguage extends CommonLabels {
  pageTitle: string;
  pageSubtitle: string;
  entityName: string;
  formTitle: {
    create: string;
    edit: string;
  };
  formSubtitle: {
    create: string;
    edit: string;
  };
  fields: {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    country: string;
    region: string;
    language: string;
    tier: string;
    loginCount: string;
    status: string;
  };
  placeholders: {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
  };
  validation: {
    usernameRequired: string;
    usernameMinLength: string;
    emailRequired: string;
    emailInvalid: string;
    passwordRequired: string;
    passwordMinLength: string;
    confirmPasswordRequired: string;
    passwordsNotMatch: string;
  };
  tabs: {
    generalInfo: string;
    agents: string;
    models: string;
  };
  ariaLabels: {
    edit: string;
    delete: string;
  };
  agentsTab: {
    title: string;
    subtitle: string;
    loadingAgents: string;
    noAgents: string;
    addAgent: string;
    selectAgent: string;
    selectAgentPlaceholder: string;
    userAgents: string;
    removeTooltip: string;
    singular: string;
    plural: string;
    undoRemoval: string;
    cancelAdd: string;
    markForRemoval: string;
    stats: {
      totalAgents: string;
      saved: string;
      toAdd: string;
      toRemove: string;
    };
    tooltip: {
      markedForRemoval: string;
      pendingAdd: string;
      saved: string;
    };
    toast: {
      agentsAssigned: string;
      agentsRemoved: string;
    };
  };
  modelsTab: {
    title: string;
    subtitle: string;
    loadingModels: string;
    noModels: string;
    addModel: string;
    selectModel: string;
    selectModelPlaceholder: string;
    userModels: string;
    removeTooltip: string;
    singular: string;
    plural: string;
    undoRemoval: string;
    cancelAdd: string;
    markForRemoval: string;
    stats: {
      totalModels: string;
      saved: string;
      toAdd: string;
      toRemove: string;
    };
    tooltip: {
      markedForRemoval: string;
      pendingAdd: string;
      saved: string;
    };
    toast: {
      modelsAssigned: string;
      modelsRemoved: string;
    };
  };
  toast: {
    agentsAssigned: string;
    agentsRemoved: string;
    deleted: string;
  };
}

// ============================================
// MÓDULO: AGENTS (Agentes de IA)
// ============================================
interface AgentsLanguage extends CommonLabels {
  pageTitle: string;
  pageSubtitle: string;
  entityName: string;
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
    systemPrompt: string;
    agentType: string;
    phase: string;
    model: string;
    isDefault: string;
    protected: string;
    enabled: string;
    toolCount: string;
  };
  placeholders: {
    name: string;
    description: string;
    systemPrompt: string;
    selectType: string;
    selectPhase: string;
    selectModel: string;
  };
  agentTypes: {
    pentest: string;
    general: string;
    support: string;
    custom: string;
  };
  table: {
    type: string;
    model: string;
    phase: string;
    default: string;
  };
  tabs: {
    generalInfo: string;
    tools: string;
    settings: string;
  };
  toolsTab: {
    title: string;
    subtitle: string;
    loadingTools: string;
    noToolsAvailable: string;
    noToolsAssigned: string;
    disabledTool: string;
    stats: {
      totalTools: string;
      assigned: string;
      available: string;
      activeTools: string;
      notAssigned: string;
      coverage: string;
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
      cancelChanges: string;
      saveTools: string;
      addTools: string;
      removeTool: string;
    };
    toolsCount: string;
    activeCount: string;
    table: {
      toolName: string;
      toolType: string;
      command: string;
      status: string;
      actions: string;
    };
  };
  settings: {
    title: string;
    subtitle: string;
    enabled: string;
    enabledDesc: string;
    isDefault: string;
    isDefaultDesc: string;
    protected: string;
    protectedDesc: string;
  };
  ariaLabels: {
    manageTools: string;
    viewTools: string;
    enable: string;
    disable: string;
    clone: string;
    edit: string;
    delete: string;
    restore: string;
  };
  toast: {
    enabled: string;
    disabled: string;
    cloned: string;
    deleted: string;
    restored: string;
    enabledSuccess: string;
    disabledSuccess: string;
    clonedSuccess: string;
    toolAddedSuccess: string;
    toolRemovedSuccess: string;
    toolsAssigned: string;
  };
  filter: {
    type: string;
    typePlaceholder: string;
    includeDeleted: string;
    includeDeletedPlaceholder: string;
  };
}

// ============================================
// MÓDULO: TOOLS (Ferramentas)
// ============================================
interface ToolsLanguage extends CommonLabels {
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
    toolType: string;
    command: string;
    parameters: string;
    enabled: string;
    agentCount: string;
  };
  placeholders: {
    name: string;
    description: string;
    command: string;
    parameters: string;
    selectType: string;
  };
  toolTypes: {
    pentest: string;
    support: string;
    utility: string;
    custom: string;
    browser: string;
    orchestration: string;
  };
  form: {
    editTitle: string;
    createTitle: string;
    editSubtitle: string;
    createSubtitle: string;
    name: string;
    namePlaceholder: string;
    toolType: string;
    toolTypePlaceholder: string;
    command: string;
    commandPlaceholder: string;
    description: string;
    descriptionPlaceholder: string;
    parameters: string;
    validation: {
      nameRequired: string;
      nameMinLength: string;
      typeRequired: string;
    };
  };
  table: {
    type: string;
    command: string;
    agents: string;
  };
  settings: {
    title: string;
    enabled: string;
    enabledDesc: string;
  };
  ariaLabels: {
    enable: string;
    disable: string;
    edit: string;
    delete: string;
    restore: string;
  };
  toast: {
    enabled: string;
    disabled: string;
    deleted: string;
    restored: string;
    enabledSuccess: string;
    disabledSuccess: string;
  };
  filter: {
    type: string;
    typePlaceholder: string;
    includeDeleted: string;
    includeDeletedPlaceholder: string;
  };
}

// ============================================
// MÓDULO: PHASES (Fases)
// ============================================
interface PhasesLanguage extends CommonLabels {
  pageTitle: string;
  pageSubtitle: string;
  phaseType: string;
  displayOrder: string;
  agentCount: string;
  fields: {
    name: string;
    description: string;
    phaseType: string;
    displayOrder: string;
    toolCount: string;
    agentCount: string;
  };
  table: {
    type: string;
    order: string;
    tools: string;
    agents: string;
  };
  ariaLabels: {
    viewTools: string;
  };
  toolsPage: {
    title: string;
    subtitle: string;
    buttons: {
      back: string;
      addTools: string;
    };
    table: {
      toolId: string;
      toolName: string;
      toolType: string;
      type: string;
      status: string;
      actions: string;
    };
    ariaLabels: {
      removeTool: string;
    };
    toast: {
      removed: string;
      toolRemoved: string;
      featureInDevelopment: string;
    };
  };
}

// ============================================
// MÓDULO: BRANDINGS (Marca de Relatório — Admin)
// ============================================
interface BrandingsLanguage extends CommonLabels {
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
  ownerTypes: {
    user: string;
    team: string;
    system: string;
  };
  fields: {
    ownerType: string;
    ownerId: string;
  };
  placeholders: {
    ownerType: string;
    ownerId: string;
  };
  table: {
    owner: string;
    company: string;
    colors: string;
    logos: string;
  };
  filter: {
    ownerType: string;
    ownerTypePlaceholder: string;
    includeDeleted: string;
    includeDeletedPlaceholder: string;
  };
  ariaLabels: {
    edit: string;
    delete: string;
  };
  ownerInfoTitle: string;
  logosOnCreateHint: string;
  deleteConfirm: {
    title: string;
    description: string;
  };
  toast: {
    created: string;
    deleted: string;
  };
}

// ============================================
// INTERFACE PRINCIPAL DO MÓDULO ADMIN
// ============================================
export interface ModuleAdmin {
  titleModule: string;
  settings: string;

  // Strings comuns
  common: {
    table: TableStrings;
    form: FormStrings;
    toast: ToastStrings;
    pendingChanges: PendingChangesStrings;
    buttons: ButtonsStrings;
    deleteDialog: DeleteDialogStrings;
    restoreDialog: RestoreDialogStrings;
    confirmDialog: ConfirmDialogStrings;
  };

  // Módulos
  models: ModelsLanguage;
  permissions: PermissionsLanguage;
  roles: RolesLanguage;
  teams: TeamsLanguage;
  users: UsersLanguage;
  agents: AgentsLanguage;
  tools: ToolsLanguage;
  phases: PhasesLanguage;
  activityLogs: ActivityLogsLanguage;
  operations: AdminOperationsLanguage;
  tickets: AdminTicketsLanguage;
  chats: AdminChatsLanguage;
  pentests: PentestsLanguage;
  scheduledPentests: ScheduledPentestsLanguage;
  blacklist: BlacklistLanguage;
  mcpServers: McpServersLanguage;
  referrals: ReferralsLanguage;
  brandings: BrandingsLanguage;
}
