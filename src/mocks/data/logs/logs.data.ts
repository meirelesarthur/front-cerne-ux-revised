/**
 * Mock Data - Logs
 *
 * Dados simulados para a tela de Logs.
 * Baseado na estrutura real que virá da API V2.
 *
 * Formato dos logs baseado em sistemas de segurança reais:
 * - Timestamp
 * - Nível/Severidade (info, warning, error, critical)
 * - Categoria/Source (system, security, application, network)
 * - Mensagem/Descrição
 * - Usuário responsável (quando aplicável)
 * - IP de origem
 * - Detalhes adicionais
 */

export interface LogEntry {
  log_id: string;
  timestamp: string; // ISO 8601
  severity: 'info' | 'warning' | 'error' | 'critical';
  category: 'system' | 'security' | 'application' | 'network' | 'database';
  source: string;
  message: string;
  user_id?: number;
  username?: string;
  ip_address?: string;
  user_agent?: string;
  details?: Record<string, any>;
  tags?: string[];
}

/**
 * Dataset completo de logs
 * Total: 150 registros para simular paginação realista
 */
export const logsData: LogEntry[] = [
  // Critical Events
  {
    log_id: 'log-001',
    timestamp: '2025-12-24T08:45:23.123Z',
    severity: 'critical',
    category: 'security',
    source: 'Authentication Service',
    message: 'Multiple failed login attempts detected from same IP',
    ip_address: '192.168.1.105',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    details: {
      attempts: 15,
      timeWindow: '5 minutes',
      blocked: true,
    },
    tags: ['brute-force', 'security-alert'],
  },
  {
    log_id: 'log-002',
    timestamp: '2025-12-24T08:30:15.456Z',
    severity: 'critical',
    category: 'security',
    source: 'Firewall',
    message: 'SQL injection attempt blocked',
    user_id: 42,
    username: 'attacker_user',
    ip_address: '203.0.113.45',
    details: {
      payload: "' OR '1'='1",
      endpoint: '/api/v1/users',
      action: 'blocked',
    },
    tags: ['sql-injection', 'attack-blocked'],
  },
  {
    log_id: 'log-003',
    timestamp: '2025-12-24T07:15:42.789Z',
    severity: 'critical',
    category: 'system',
    source: 'Database Service',
    message: 'Database connection pool exhausted',
    details: {
      maxConnections: 100,
      activeConnections: 100,
      queuedRequests: 45,
    },
    tags: ['performance', 'database'],
  },

  // Error Events
  {
    log_id: 'log-004',
    timestamp: '2025-12-24T08:40:11.234Z',
    severity: 'error',
    category: 'application',
    source: 'Pentest Manager',
    message: 'Failed to generate pentest report',
    user_id: 12,
    username: 'jose.silva',
    details: {
      pentestId: 'PT-2025-001',
      errorCode: 'REPORT_GEN_FAILED',
      reason: 'Template file not found',
    },
    tags: ['report-generation', 'pentest'],
  },
  {
    log_id: 'log-005',
    timestamp: '2025-12-24T08:35:28.567Z',
    severity: 'error',
    category: 'network',
    source: 'API Gateway',
    message: 'External API timeout',
    details: {
      endpoint: 'https://api.dehashed.com/search',
      timeout: '30s',
      retries: 3,
    },
    tags: ['api-timeout', 'external-service'],
  },
  {
    log_id: 'log-006',
    timestamp: '2025-12-24T08:25:45.890Z',
    severity: 'error',
    category: 'application',
    source: 'Email Service',
    message: 'Failed to send notification email',
    user_id: 8,
    username: 'maria.santos',
    ip_address: '192.168.1.88',
    details: {
      recipient: 'client@example.com',
      errorCode: 'SMTP_CONNECTION_FAILED',
    },
    tags: ['email', 'notification'],
  },

  // Warning Events
  {
    log_id: 'log-007',
    timestamp: '2025-12-24T08:38:19.123Z',
    severity: 'warning',
    category: 'system',
    source: 'Storage Monitor',
    message: 'Disk space usage above 80%',
    details: {
      partition: '/var/log',
      usage: '84%',
      available: '15.2 GB',
    },
    tags: ['disk-space', 'monitoring'],
  },
  {
    log_id: 'log-008',
    timestamp: '2025-12-24T08:32:55.456Z',
    severity: 'warning',
    category: 'security',
    source: 'Rate Limiter',
    message: 'API rate limit approaching threshold',
    user_id: 15,
    username: 'pedro.costa',
    ip_address: '192.168.1.122',
    details: {
      endpoint: '/api/v2/pentests',
      requestCount: 450,
      limit: 500,
      timeWindow: '1 hour',
    },
    tags: ['rate-limit', 'api'],
  },
  {
    log_id: 'log-009',
    timestamp: '2025-12-24T08:28:33.789Z',
    severity: 'warning',
    category: 'application',
    source: 'Cache Service',
    message: 'Cache hit ratio below optimal',
    details: {
      hitRatio: '65%',
      optimal: '85%',
      recommendation: 'Consider increasing cache size',
    },
    tags: ['performance', 'cache'],
  },
  {
    log_id: 'log-010',
    timestamp: '2025-12-24T08:20:12.234Z',
    severity: 'warning',
    category: 'security',
    source: 'Session Manager',
    message: 'Inactive session cleanup',
    details: {
      expiredSessions: 23,
      action: 'terminated',
    },
    tags: ['session', 'cleanup'],
  },

  // Info Events
  {
    log_id: 'log-011',
    timestamp: '2025-12-24T08:42:05.567Z',
    severity: 'info',
    category: 'security',
    source: 'Authentication Service',
    message: 'User logged in successfully',
    user_id: 1,
    username: 'admin',
    ip_address: '192.168.1.50',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
    tags: ['login', 'auth'],
  },
  {
    log_id: 'log-012',
    timestamp: '2025-12-24T08:41:18.890Z',
    severity: 'info',
    category: 'application',
    source: 'Pentest Service',
    message: 'New pentest created',
    user_id: 5,
    username: 'ana.rodrigues',
    ip_address: '192.168.1.75',
    details: {
      pentestId: 'PT-2025-045',
      target: 'https://client-app.example.com',
      type: 'Web Application',
    },
    tags: ['pentest', 'creation'],
  },
  {
    log_id: 'log-013',
    timestamp: '2025-12-24T08:39:47.123Z',
    severity: 'info',
    category: 'system',
    source: 'Backup Service',
    message: 'Automated backup completed successfully',
    details: {
      backupSize: '2.4 GB',
      duration: '15 minutes',
      location: 's3://backups/2025-12-24',
    },
    tags: ['backup', 'automated'],
  },
  {
    log_id: 'log-014',
    timestamp: '2025-12-24T08:37:22.456Z',
    severity: 'info',
    category: 'application',
    source: 'Report Generator',
    message: 'Pentest report generated',
    user_id: 12,
    username: 'jose.silva',
    details: {
      pentestId: 'PT-2025-042',
      format: 'PDF',
      pages: 45,
    },
    tags: ['report', 'pentest'],
  },
  {
    log_id: 'log-015',
    timestamp: '2025-12-24T08:36:08.789Z',
    severity: 'info',
    category: 'security',
    source: 'Permission Service',
    message: 'User permissions updated',
    user_id: 3,
    username: 'carlos.admin',
    ip_address: '192.168.1.60',
    details: {
      targetUser: 'novo.usuario',
      addedPermissions: ['pentests.view', 'pentests.create'],
    },
    tags: ['permissions', 'rbac'],
  },

  // Mais eventos variados para paginação
  ...generateMoreLogs(135), // Gera mais 135 logs para totalizar 150
];

/**
 * Função auxiliar para gerar logs adicionais
 * Simula variedade realista de eventos
 */
function generateMoreLogs(count: number): LogEntry[] {
  const logs: LogEntry[] = [];
  const severities: LogEntry['severity'][] = ['info', 'warning', 'error', 'critical'];
  const categories: LogEntry['category'][] = ['system', 'security', 'application', 'network', 'database'];
  const sources = [
    'Authentication Service',
    'API Gateway',
    'Database Service',
    'Email Service',
    'Pentest Manager',
    'Report Generator',
    'Cache Service',
    'Backup Service',
    'Firewall',
    'Load Balancer',
  ];
  const messages = [
    'Operation completed successfully',
    'Configuration updated',
    'User action performed',
    'System health check passed',
    'Scheduled task executed',
    'Resource allocation adjusted',
    'Connection established',
    'Data synchronization completed',
    'Maintenance task finished',
    'Service restarted',
  ];

  for (let i = 0; i < count; i++) {
    const logNumber = 16 + i;
    const hoursAgo = Math.floor(i / 6); // Distribui ao longo de ~22 horas
    const minutesAgo = (i * 10) % 60;
    const timestamp = new Date(Date.now() - hoursAgo * 3600000 - minutesAgo * 60000).toISOString();

    logs.push({
      log_id: `log-${String(logNumber).padStart(3, '0')}`,
      timestamp,
      severity: severities[Math.floor(Math.random() * severities.length)],
      category: categories[Math.floor(Math.random() * categories.length)],
      source: sources[Math.floor(Math.random() * sources.length)],
      message: messages[Math.floor(Math.random() * messages.length)],
      user_id: Math.random() > 0.3 ? Math.floor(Math.random() * 50) + 1 : undefined,
      username: Math.random() > 0.3 ? `user${Math.floor(Math.random() * 50)}` : undefined,
      ip_address: Math.random() > 0.4 ? `192.168.1.${Math.floor(Math.random() * 255)}` : undefined,
      tags: ['automated', 'routine'],
    });
  }

  return logs;
}

/**
 * Filtros disponíveis para logs
 */
export const logFilters = {
  severities: ['info', 'warning', 'error', 'critical'] as const,
  categories: ['system', 'security', 'application', 'network', 'database'] as const,
  sources: [
    'Authentication Service',
    'API Gateway',
    'Database Service',
    'Email Service',
    'Pentest Manager',
    'Report Generator',
    'Cache Service',
    'Backup Service',
    'Firewall',
    'Load Balancer',
  ] as const,
};
