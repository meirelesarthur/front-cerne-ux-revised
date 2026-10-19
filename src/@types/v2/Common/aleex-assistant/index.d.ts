// src/@types/v2/Common/aleex-assistant/index.d.ts
// Interface de tradução para o módulo Aleex Assistant

export interface AleexAssistantLanguage {
  title: string;
  description: string;
  chatTitle: string;
  chatDescription: string;
  comingSoonMessage: string;

  // Tradução de nomes de fases (vindos da API em espanhol)
  phaseNames: {
    reconocimientoInicial: string;
    enumeracion: string;
    analisis: string;
    explotacion: string;
    postExplotacion: string;
    automaticExecution: string;
    guidedExecution: string;
  };

  welcomeScreen: {
    greeting: string;
    prompt: string;
    createPentest: string;
    createPentestDescription: string;
    quickPrompts: {
      analyzeTarget: string;
      investigateCve: string;
      summarizeLastPentest: string;
    };
    templatesLabel: string;
    templates: {
      webApp: {
        title: string;
        description: string;
      };
      interpretVulns: {
        title: string;
        description: string;
      };
      executiveReport: {
        title: string;
        description: string;
      };
    };
    /** Textos de rascunho injetados no composer (o usuário completa antes de enviar) */
    drafts: {
      analyzeTarget: string;
      investigateCve: string;
      summarizeLastPentest: string;
      interpretVulns: string;
      executiveReport: string;
    };
    /** Diálogo parametrizado de análise (IP/domínio e CVE): alvo + prompt editável. */
    quickAnalyze: {
      send: string;
      promptLabel: string;
      presetsLabel: string;
      targetRequired: string;
      ip: {
        title: string;
        targetLabel: string;
        targetPlaceholder: string;
        presetLabel: string;
        preset: string; // template com {target}
      };
      cve: {
        title: string;
        targetLabel: string;
        targetPlaceholder: string;
        presetLabel: string;
        preset: string; // template com {target}
      };
    };
  };

  chatInput: {
    placeholder: string;
    attachFiles: string;
    sendMessage: string;
    stopStreaming: string;
    removeFile: string;
    fileTypeNotAllowed: string;
    allowedTypes: string;
    fileTooLarge: string;
    maxFileSize: string;
    maxFilesReached: string;
    aiDisclaimer: string;
  };

  chatMessages: {
    copyCode: string;
    startConversation: string;
    thinking: string;
    creatingChat: string;
    sendingMessage: string;
    user: string;
    you: string;
    jumpToEnd: string;
    actions: {
      copyMessage: string;
      editMessage: string;
      regenerate: string;
      copied: string;
    };
  };

  sidebar: {
    title: string;
    newChat: string;
    expandSidebar: string;
    collapseSidebar: string;
    searchConversations: string;
    tabs: {
      chats: string;
      pentests: string;
      archived: string;
    };
    sections: {
      personalChats: string;
      teamChats: string;
      activePentests: string;
      configuredPentests: string;
    };
    periods: {
      today: string;
      yesterday: string;
      last7Days: string;
      last30Days: string;
      older: string;
    };
    emptyStates: {
      noConversations: string;
      noArchivedChats: string;
      startNewChat: string;
      noPersonalChats: string;
      noTeamChats: string;
      noPentestsFound: string;
      noChatsYet: string;
      archivedDescription: string;
      untitled: string;
    };
    actions: {
      shareConversation: string;
      rename: string;
      archive: string;
      unarchive: string;
      delete: string;
    };
    badges: {
      team: string;
    };
    tooltips: {
      sharedWithTeam: string;
      messages: string;
    };
  };

  pentestStatus: {
    draft: string;
    configured: string;
    running: string;
    phaseCompleted: string;
    processing: string;
    completed: string;
    paused: string;
    cancelled: string;
    archived: string;
    failed: string;
  };

  newChatModal: {
    title: string;
    chatName: string;
    placeholder: string;
    hint: string;
    cancel: string;
    create: string;
  };

  renameModal: {
    title: string;
    description: string;
    label: string;
    placeholder: string;
    cancel: string;
    confirm: string;
  };

  shareModal: {
    title: string;
    sharingConversation: string;
    loadingTeams: string;
    noTeams: string;
    noTeamsDescription: string;
    selectTeam: string;
    selectTeamPlaceholder: string;
    shareInfo: string;
    cancel: string;
    share: string;
  };

  agentSelector: {
    title: string;
    myAgents: string;
    defaultAgents: string;
    description: string;
    phase: string;
    model: string;
    tools: string;
    created: string;
    updated: string;
    noDetails: string;
    createAgent: string;
  };

  pentestSelector: {
    selectPentest: string;
    noTarget: string;
    auto: string;
    guided: string;
    configurePhases: string;
    tooltips: {
      target: string;
      type: string;
      created: string;
      phases: string;
      notSpecified: string;
      clickToSelect: string;
      morePhases: string;
    };
  };

  modelDisplay: {
    label: string;
    definedByAgent: string;
    tooltip: string;
    none: string;
    contextWindow: string;
    reasoning: string;
  };

  effortDisplay: {
    label: string;
    default: string;
    comingSoon: string;
    tooltip: string;
    low: string;
    medium: string;
    high: string;
  };

  phaseSelector: {
    phases: string;
    allCompleted: string;
    phase: string;
    pentestPhases: string;
    current: string;
    locked: string;
    loading: string;
  };

  vulnerabilitiesModal: {
    title: string;
    loading: string;
    processedDescription: string;
    emptyTitle: string;
    emptyDescription: string;
    severity: {
      critical: string;
      high: string;
      medium: string;
      low: string;
      info: string;
    };
    status: {
      open: string;
      inProgress: string;
      resolved: string;
      falsePositive: string;
      acceptedRisk: string;
    };
    priority: {
      urgent: string;
      high: string;
      normal: string;
      low: string;
    };
    details: {
      description: string;
      resolution: string;
      resolutionType: string;
      falsePositiveReason: string;
      acceptedRiskReason: string;
      discoveredAt: string;
      registeredAt: string;
      resolvedAt: string;
    };
    fallbacks: {
      noDescription: string;
      noResolution: string;
      vulnerability: string;
      status: string;
      priority: string;
      severity: string;
    };
    resolutionTypes: {
      withEvidence: string;
      withoutEvidence: string;
    };
    overdue: string;
    totalVulnerabilities: string;
    footer: {
      close: string;
      goToPentestManager: string;
      processed: string;
      processVulnerabilities: string;
    };
    modelSelection: {
      title: string;
      description: string;
    };
  };

  progressBar: {
    preparing: string;
    queued: string;
    running: string;
    executing: string;
    phaseComplete: string;
    completed: string;
    errorOccurred: string;
    idle: string;
    cancel: string;
  };

  previewPanel: {
    title: string;
    generating: string;
    placeholder: string;
  };

  terminalPanel: {
    terminal: string;
    guided: string;
    auto: string;
    minimize: string;
    maximize: string;
    restore: string;
    noPentestSelected: string;
    noPentestDescription: string;
    selectPentest: string;
    allPhasesAutomatic: string;
    currentPhase: string;
    phaseAgents: string;
    noAgentConfigured: string;
    phasesWithoutAgents: string;
    needsAtLeast: string;
    startPentest: string;
    reconfigureAgents: string;
    configureAgents: string;
    phaseCompleted: string;
    nextPhase: string;
    lastPhaseMessage: string;
    configured: string;
    notConfigured: string;
    loading: string;
    processVulnerabilities: string;
    startNextPhase: string;
    configureNextPhase: string;
    finishPentest: string;
    viewVulnerabilities: string;
    lastPhaseInfo: string;
    order: string;
    completed: string;
    openTerminal: string;
  };

  contextPanel: {
    tabTerminal: string;
    tabVulnerabilities: string;
    tabReport: string;
    tabInfo: string;
    noPentestSelected: string;
    reportEmpty: string;
    reopenPanel: string;
  };

  executionTerminal: {
    executing: string;
    terminal: string;
    live: string;
    agentStatus: {
      running: string;
      completed: string;
      error: string;
      starting: string;
      idle: string;
    };
    agents: string;
    active: string;
    actives: string;
    phase: string;
    output: string;
    waitingActivity: string;
    processing: string;
    receivingData: string;
    consolidation: {
      complete: string;
      running: string;
      tokensInput: string;
      tokensOutput: string;
      agentsCompleted: string;
      consolidating: string;
    };
    vulnsProcessing: {
      processed: string;
      processing: string;
      detected: string;
      stored: string;
      completedSuccess: string;
    };
    viewVulnerabilities: string;
    goToPentestManager: string;
    cancelButton: string;
    phaseCompleted: string;
    chooseHowToProceed: string;
    processVulnerabilities: string;
    finalize: string;
    lastPhase: string;
    lastPhaseMessage: string;
    continueNextPhase: string;
    nextPhaseReady: string;
    nextPhaseNotReady: string;
    startNextPhase: string;
    configureNextPhase: string;
    pentestCompleted: string;
    totalTime: string;
    phasesCount: string;
    vulnerabilitiesFound: string;
    executionError: string;
    reconnect: string;
    reconnectDescription: string;
    reconnecting: string;
    reconnectingDescription: string;
    reconnectDisconnectedTitle: string;
    reconnectDisconnectedDescription: string;
    reconnectWarning: string;
    outputWillAppear: string;
    finishBlockedByVulns: string;
    backgroundInfo: string;
    processVulnerabilitiesDesc: string;
    finalizeDesc: string;
  };

  mainPage: {
    openTerminal: string;
    openTerminalTooltip: string;
    modelForProcessing: string;
    modelForProcessingDescription: string;
    processConfirmTitle: string;
    processConfirmDesc: string;
    processConfirmWarning: string;
    processConfirmButton: string;
    finishPentestTitle: string;
    finishPentestDescription: string;
    finishPentestWarning: string;
    finishPentestConfirm: string;
    archiveConversation: string;
    unarchiveConversation: string;
    archiveDescription: string;
    unarchiveDescription: string;
    archiveConfirm: string;
    unarchiveConfirm: string;
    phaseNotSelected: string;
    phaseNotSelectedDescription: string;
    lastPhaseTitle: string;
    lastPhaseDescription: string;
    messageEmpty: string;
    vulnsProcessingMessage: string;
    entityLabels: {
      pentest: string;
      vulnerability: string;
    };
    toast: {
      chatShared: string;
      chatRenamed: string;
      chatArchived: string;
      chatUnarchived: string;
      chatDeleted: string;
      shareFailed: string;
      renameFailed: string;
      archiveFailed: string;
      unarchiveFailed: string;
      deleteFailed: string;
      messageSent: string;
      pentestCompleted: string;
      pentestCancelled: string;
    };
  };

  prompts: {
    startPentest: string;
    startPhaseExecution: string;
    runAutomaticPentest: string;
  };

  pentestExecution: {
    loadingPentest: string;
    failedToLoad: string;
    goBack: string;
    welcomeMessage: string;
    target: string;
    mode: string;
    status: string;
    whatToTest: string;
    noTargetUrl: string;
    executing: string;
    phaseCompleteMessage: string;
  };

  pentestsSidebar: {
    title: string;
    expandSidebar: string;
    newChat: string;
    searchPlaceholder: string;
    sections: {
      running: string;
      configured: string;
      completed: string;
    };
    noPentestsFound: string;
  };

  createAgentModal: {
    title: string;
    subtitleConfigure: string;
    subtitleCreate: string;
    tabs: {
      generalInfo: string;
      tools: string;
      afterCreate: string;
    };
    fields: {
      name: string;
      namePlaceholder: string;
      agentType: string;
      agentTypePlaceholder: string;
      model: string;
      modelPlaceholder: string;
      phase: string;
      phasePlaceholder: string;
      description: string;
      descriptionPlaceholder: string;
      instructions: string;
      instructionsPlaceholder: string;
    };
    validation: {
      nameRequired: string;
      nameMinLength: string;
      typeRequired: string;
      modelRequired: string;
      phaseRequired: string;
      instructionsRequired: string;
    };
    buttons: {
      cancel: string;
      createAgent: string;
      skipTools: string;
      saveTools: string;
      finish: string;
    };
    loadingData: string;
    loadingTools: string;
    noToolsAvailable: string;
    pendingChanges: string;
    pendingChangeSingular: string;
    clickSaveToApply: string;
    totalTools: string;
    assigned: string;
    coverage: string;
    tooltips: {
      selectedNotSaved: string;
      unselectedNotSaved: string;
      assignedToAgent: string;
      notAssigned: string;
    };
    toast: {
      agentCreated: string;
      configureTools: string;
      toolsSaved: string;
      toolsConfigured: string;
      createFailed: string;
      toolsSaveFailed: string;
      agentAdded: string;
    };
  };

  phaseConfigModal: {
    title: string;
    reloadData: string;
    selectRange: string;
    requiredPhase: string;
    selected: string;
    newAgent: string;
    selectAtLeast: string;
    loadingAgents: string;
    failedToLoad: string;
    retry: string;
    loadingPhases: string;
    default: string;
    saved: string;
    new: string;
    buttons: {
      cancel: string;
      saveConfiguration: string;
      saveAndGoChat: string;
    };
    removeAgent: {
      title: string;
      description: string;
      warning: string;
      confirm: string;
      savedTooltip: string;
      unsavedTooltip: string;
    };
    toast: {
      agentRemoved: string;
      agentRemovedDescription: string;
      removeFailed: string;
      configSaved: string;
      configSavedDescription: string;
      configFailed: string;
      agentCreated: string;
      agentAddedToSelection: string;
    };
    phaseLocked: string;
    readOnly: {
      title: string;
      description: string;
      badge: string;
    };
  };

  // ===== Terminal SSE v2 =====
  pentestTerminalV2: {
    // Status de agente
    agentStatus: {
      pending: string;
      running: string;
      interpreting: string;
      completed: string;
      error: string;
    };
    // Fase
    phase: string;
    lastPhase: string;
    agents: string;
    findings: string;
    tokens: string;
    // Ferramentas
    toolStatus: {
      running: string;
      completed: string;
      cached: string;
      blocked: string;
      skipped: string;
    };
    showMoreTools: string;
    toolExpanded: string;
    noResult: string;
    // Subagentes
    subagents: string;
    subagentDepth: string;
    // Consolidação
    consolidating: string;
    consolidationComplete: string;
    consolidationAgents: string;
    tokenInput: string;
    tokenOutput: string;
    // Plano
    plan: string;
    // Interpretação
    interpreting: string;
    interpretingTools: string;
    // Footer
    executing: string;
    connecting: string;
    queuePosition: string;
    completed: string;
    phaseConcluded: string;
    phaseError: string;
    cancelled: string;
    cancelReason: string;
    totalTime: string;
    totalFindings: string;
    vulnsProcessed: string;
    // Botões
    cancelButton: string;
    continueButton: string;
    retryButton: string;
    closeButton: string;
    collapseAll: string;
    viewAll: string;
    // Nudge
    nudges: string;
    // Expansion
    viewMore: string;
    collapse: string;
    // Inicializing
    initializingAgents: string;
    // Queue
    inQueue: string;
    // History phases
    completedPhase: string;
    // Output por agente
    allAgentsOutput: string;
    noOutput: string;
    agentOutput: string;
    viewAgentOutput: string;
    hideAgentOutput: string;
    // Auto-close
    cancelledAutoClose: string;
    // Aria
    ariaPhaseIcon: string;
  };

  // ===== Chat Geral Agêntico — Timeline de atividade (DOC-06) =====
  generalAgentActivity: {
    title: string;
    agent: string;
    subagent: string;
    subagentDone: string;
    plan: string;
    thinking: string;
    callingTool: string;
    agentStarted: string;
    toolCall: string;
    toolResult: string;
    interpreting: string;
    iteration: string;
    compactingContext: string;
    finished: string;
    failed: string;
    working: string;
    stopReason: {
      goalReached: string;
      maxIterations: string;
      timeout: string;
      budget: string;
      stagnation: string;
      cancelled: string;
    };
  };

  // ===== Relatório de Segurança estruturado (parse do shodan_search) =====
  securityReport: {
    eyebrow: string;
    target: string;
    riskLabel: string;
    risk: { critica: string; alta: string; media: string; baja: string };
    actions: { copy: string; copied: string; export: string; openFull: string };
    execSummary: string;
    execSummaryText: string; // placeholders: {total} {kev}
    recommendation: string;
    sevDist: string;
    vulnsFound: string;
    clickExpand: string;
    interp: { eyebrow: string; title: string; text: string }; // {total} {crit} {high} {med} {kev} {poc} {topCve} {topCvss}
    priorities: string;
    remediate: string;
    remediatePrompt: string; // {cve}
    columns: {
      cve: string;
      type: string;
      severity: string;
      cvss: string;
      epss: string;
      kev: string;
      poc: string;
    };
    sev: { critica: string; alta: string; media: string; baja: string };
    cards: { inKev: string; withPoc: string };
    fields: {
      ip: string;
      organization: string;
      location: string;
      ports: string;
      server: string;
      system: string;
    };
    detail: {
      description: string;
      vector: string;
      verified: string;
      epss: string;
      fix: string;
      noFix: string;
    };
    yes: string;
    no: string;
    unavailable: string;
    partialNotice: string; // {shown} {total}
  };

  // ===== Aba de Vulnerabilidades do painel lateral (terminal) =====
  vulnerabilitiesPanel: {
    title: string;
    riskScore: string;
    total: string;
    noPentest: string;
    noVulns: string;
    loading: string;
    selectAll: string;
    clearSelection: string;
    selectedCount: string; // {count}
    sendToChat: string;
    alreadyInChat: string;
    assignFailed: string;
    inChatTitle: string;
    inChatHint: string;
    assignToChat: string;
    assignedToChat: string;
    notInChat: string;
    unlinkTitle: string;
    unlinkMessage: string; // {name}
    unlinkConfirm: string;
    removeTooltip: string;
    openInTerminal: string;
    askBase: string; // {pentest} {question}
    askMenuTitle: string;
    qExplain: string;
    qPrioritize: string;
    qSummary: string;
    presetExplain: string;
    presetPrioritize: string;
    presetSummary: string;
    customLabel: string;
    customPlaceholder: string;
    customSend: string;
    viewDetails: string;
    details: string;
    description: string;
    resolution: string;
    status: string;
    priority: string;
    severityLabels: {
      critical: string;
      high: string;
      medium: string;
      low: string;
      info: string;
    };
    statusLabels: {
      open: string;
      in_progress: string;
      resolved: string;
      false_positive: string;
      accepted_risk: string;
    };
  };
}
