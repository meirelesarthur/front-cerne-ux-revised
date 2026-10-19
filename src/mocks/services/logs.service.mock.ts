/**
 * Mock Service - Logs
 *
 * Simula chamadas à API V2 para gerenciamento de logs.
 * Retorna dados no formato esperado pelos hooks do front-referencia.
 *
 * Formato ResponsePagination (listas):
 * { success: boolean, data: T[], totalRecords: number, pagesCount?: number }
 *
 * Formato Response (single/mutations):
 * { success: boolean, data: T, statusCode: number, notifications: [], message?: string }
 */

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import { logsData, type LogEntry } from '@/mocks/data/logs/logs.data';

/**
 * Simula delay de rede (100-500ms)
 */
const simulateNetworkDelay = () => {
  const delay = Math.random() * 50 + 100;
  return new Promise((resolve) => setTimeout(resolve, delay));
};

/**
 * GET /api/v2/logs
 * Lista logs com paginação e filtros
 *
 * Compatível com useCustomGridQuery
 */
export async function getAllLogs(
  params: PaginationQueryParams & {
    search?: string;
    severity?: string;
    category?: string;
    source?: string;
    startDate?: string;
    endDate?: string;
  } = {}
): Promise<ResponsePagination<LogEntry[]>> {
  await simulateNetworkDelay();

  try {
    const {
      page = 1,
      per_page = 25,
      search = '',
      severity,
      category,
      source,
      startDate,
      endDate,
      orderBy,
    } = params;

    // 1. Filtrar dados
    let filteredLogs = [...logsData];

    // Busca textual
    if (search) {
      const searchLower = search.toLowerCase();
      filteredLogs = filteredLogs.filter(
        (log) =>
          log.message.toLowerCase().includes(searchLower) ||
          log.username?.toLowerCase().includes(searchLower) ||
          log.ip_address?.includes(searchLower) ||
          log.source.toLowerCase().includes(searchLower)
      );
    }

    // Filtros específicos
    if (severity) {
      filteredLogs = filteredLogs.filter((log) => log.severity === severity);
    }
    if (category) {
      filteredLogs = filteredLogs.filter((log) => log.category === category);
    }
    if (source) {
      filteredLogs = filteredLogs.filter((log) => log.source === source);
    }
    if (startDate) {
      filteredLogs = filteredLogs.filter(
        (log) => new Date(log.timestamp) >= new Date(startDate)
      );
    }
    if (endDate) {
      filteredLogs = filteredLogs.filter(
        (log) => new Date(log.timestamp) <= new Date(endDate)
      );
    }

    // 2. Ordenar
    if (orderBy && typeof orderBy === 'object' && 'name' in orderBy) {
      const field = orderBy.name;
      const isAsc = orderBy.ascOrDesc?.toLowerCase() === 'asc';

      filteredLogs.sort((a, b) => {
        let comparison = 0;
        switch (field) {
          case 'timestamp':
            comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
            break;
          case 'severity': {
            const order = { info: 1, warning: 2, error: 3, critical: 4 };
            comparison = order[a.severity] - order[b.severity];
            break;
          }
          case 'category':
            comparison = a.category.localeCompare(b.category);
            break;
          case 'source':
            comparison = a.source.localeCompare(b.source);
            break;
        }
        return isAsc ? comparison : -comparison;
      });
    }

    // 3. Paginar
    const totalRecords = filteredLogs.length;
    const pagesCount = Math.ceil(totalRecords / per_page);
    const startIndex = (page - 1) * per_page;
    const paginatedData = filteredLogs.slice(startIndex, startIndex + per_page);

    // 4. Retornar
    return {
      success: true,
      data: {
        items: paginatedData,
        pagination: {
          total: totalRecords,
          count: paginatedData.length,
          per_page: per_page,
          current_page: page,
          total_pages: pagesCount,
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      data: {
        items: [],
        pagination: {
          total: 0,
          count: 0,
          per_page: 25,
          current_page: 1,
          total_pages: 0,
        },
      },
    };
  }
}

/**
 * GET /api/v2/logs/:id
 * Busca log por ID
 *
 * Compatível com useCustomFormQueryById
 */
export async function getLogById(logId: string): Promise<Response<LogEntry>> {
  await simulateNetworkDelay();

  try {
    const log = logsData.find((l) => l.log_id === logId);

    if (!log) {
      return {
        success: false,
        data: {} as LogEntry,
        statusCode: 404,
        message: `Log ${logId} não encontrado`,
        notifications: [],
      };
    }

    return {
      success: true,
      data: log,
      statusCode: 200,
      notifications: [],
    };
  } catch (error) {
    return {
      success: false,
      data: {} as LogEntry,
      statusCode: 500,
      message: 'Erro ao buscar log',
      notifications: [],
    };
  }
}

/**
 * GET /api/v2/logs/stats
 * Estatísticas dos logs
 */
export interface LogsStats {
  total: number;
  bySeverity: Record<LogEntry['severity'], number>;
  byCategory: Record<LogEntry['category'], number>;
  last24h: number;
  criticalLast24h: number;
}

export async function getLogsStats(): Promise<Response<LogsStats>> {
  await simulateNetworkDelay();

  try {
    const now = Date.now();
    const last24h = now - 24 * 60 * 60 * 1000;

    const stats: LogsStats = {
      total: logsData.length,
      bySeverity: {
        info: logsData.filter((l) => l.severity === 'info').length,
        warning: logsData.filter((l) => l.severity === 'warning').length,
        error: logsData.filter((l) => l.severity === 'error').length,
        critical: logsData.filter((l) => l.severity === 'critical').length,
      },
      byCategory: {
        system: logsData.filter((l) => l.category === 'system').length,
        security: logsData.filter((l) => l.category === 'security').length,
        application: logsData.filter((l) => l.category === 'application').length,
        network: logsData.filter((l) => l.category === 'network').length,
        database: logsData.filter((l) => l.category === 'database').length,
      },
      last24h: logsData.filter((l) => new Date(l.timestamp).getTime() > last24h).length,
      criticalLast24h: logsData.filter(
        (l) => l.severity === 'critical' && new Date(l.timestamp).getTime() > last24h
      ).length,
    };

    return {
      success: true,
      data: stats,
      statusCode: 200,
      notifications: [],
    };
  } catch (error) {
    return {
      success: false,
      data: {} as LogsStats,
      statusCode: 500,
      message: 'Erro ao buscar estatísticas',
      notifications: [],
    };
  }
}

/**
 * DELETE /api/v2/logs/:id
 * Remove log
 *
 * Compatível com useRequest
 */
export async function deleteLog(logId: string): Promise<Response<{ deleted: boolean }>> {
  await simulateNetworkDelay();

  try {
    const index = logsData.findIndex((l) => l.log_id === logId);

    if (index === -1) {
      return {
        success: false,
        data: { deleted: false },
        statusCode: 404,
        message: `Log ${logId} não encontrado`,
        notifications: [],
      };
    }

    // Mock: não remove de fato para não perder dados
    return {
      success: true,
      data: { deleted: true },
      statusCode: 200,
      message: 'Log deletado com sucesso',
      notifications: [],
    };
  } catch (error) {
    return {
      success: false,
      data: { deleted: false },
      statusCode: 500,
      message: 'Erro ao deletar log',
      notifications: [],
    };
  }
}

/**
 * POST /api/v2/logs/export
 * Exporta logs
 */
export async function exportLogs(params: {
  format: 'csv' | 'json';
  [key: string]: any;
}): Promise<Response<{ downloadUrl: string; filename: string }>> {
  await simulateNetworkDelay();

  try {
    const { format, ...filterParams } = params;
    const result = await getAllLogs(filterParams);

    if (!result.success) {
      return {
        success: false,
        data: { downloadUrl: '', filename: '' },
        statusCode: 500,
        message: 'Erro ao exportar logs',
        notifications: [],
      };
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `logs-export-${timestamp}.${format}`;
    const downloadUrl = `/api/v2/logs/download/${filename}`;

    return {
      success: true,
      data: { downloadUrl, filename },
      statusCode: 200,
      message: 'Logs exportados com sucesso',
      notifications: [],
    };
  } catch (error) {
    return {
      success: false,
      data: { downloadUrl: '', filename: '' },
      statusCode: 500,
      message: 'Erro ao exportar logs',
      notifications: [],
    };
  }
}
