/**
 * Mock Service - Threat Map
 *
 * Simula chamadas à API V2 para Threat's Map (Mapa de Ameaças).
 * Retorna dados no formato esperado pelos hooks do front-referencia.
 */

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import {
    threatMapData,
    type ThreatMapEntry,
} from '@/mocks/data/threat-map/threat-map.data';

/**
 * Simula delay de rede (100-150ms)
 */
const simulateNetworkDelay = () => {
  const delay = Math.random() * 50 + 100;
  return new Promise((resolve) => setTimeout(resolve, delay));
};

/**
 * GET /api/v2/threat-map
 * Lista ameaças com paginação e filtros
 *
 * Compatível com useCustomGridQuery
 */
export async function getAllThreats(
  params: PaginationQueryParams & {
    search?: string;
    threat_type?: string;
    severity?: string;
    status?: string;
    source_ip?: string;
    startDate?: string;
    endDate?: string;
  } = {}
): Promise<ResponsePagination<ThreatMapEntry[]>> {
  await simulateNetworkDelay();

  try {
    const {
      page = 1,
      per_page = 25,
      search = '',
      threat_type,
      severity,
      status,
      source_ip,
      startDate,
      endDate,
      orderBy,
    } = params;

    // 1. Filtrar dados
    let filteredThreats = [...threatMapData];

    // Busca textual
    if (search) {
      const searchLower = search.toLowerCase();
      filteredThreats = filteredThreats.filter(
        (threat) =>
          threat.description.toLowerCase().includes(searchLower) ||
          threat.source_ip.includes(searchLower) ||
          threat.threat_id.toLowerCase().includes(searchLower) ||
          threat.tags.some((tag) => tag.includes(searchLower))
      );
    }

    // Filtros específicos
    if (threat_type) {
      filteredThreats = filteredThreats.filter((threat) => threat.threat_type === threat_type);
    }
    if (severity) {
      filteredThreats = filteredThreats.filter((threat) => threat.severity === severity);
    }
    if (status) {
      filteredThreats = filteredThreats.filter((threat) => threat.status === status);
    }
    if (source_ip) {
      filteredThreats = filteredThreats.filter((threat) => threat.source_ip.includes(source_ip));
    }
    if (startDate) {
      filteredThreats = filteredThreats.filter(
        (threat) => new Date(threat.timestamp) >= new Date(startDate)
      );
    }
    if (endDate) {
      filteredThreats = filteredThreats.filter(
        (threat) => new Date(threat.timestamp) <= new Date(endDate)
      );
    }

    // 2. Ordenar
    if (orderBy && typeof orderBy === 'object' && 'name' in orderBy) {
      const field = orderBy.name as keyof ThreatMapEntry;
      const isAsc = orderBy.ascOrDesc?.toLowerCase() === 'asc';

      filteredThreats.sort((a, b) => {
        let comparison = 0;
        const aVal = a[field];
        const bVal = b[field];

        if (typeof aVal === 'string' && typeof bVal === 'string') {
          comparison = aVal.localeCompare(bVal);
        } else if (typeof aVal === 'number' && typeof bVal === 'number') {
          comparison = aVal - bVal;
        } else if (aVal instanceof Date && bVal instanceof Date) {
          comparison = aVal.getTime() - bVal.getTime();
        }

        return isAsc ? comparison : -comparison;
      });
    } else {
      // Ordem padrão: mais recentes primeiro
      filteredThreats.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    }

    // 3. Paginar
    const startIndex = (page - 1) * per_page;
    const endIndex = startIndex + per_page;
    const paginatedData = filteredThreats.slice(startIndex, endIndex);

    const totalRecords = filteredThreats.length;
    const pagesCount = Math.ceil(totalRecords / per_page);

    return {
      success: true,
      data: {
        items: paginatedData,
        pagination: {
          total: totalRecords,
          count: paginatedData.length,
          per_page,
          current_page: page,
          total_pages: pagesCount,
        },
      },
    };
  } catch (error) {
    console.error('Error fetching threats:', error);
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
 * GET /api/v2/threat-map/:id
 * Busca uma ameaça específica por ID
 */
export async function getThreatById(id: string): Promise<Response<ThreatMapEntry>> {
  await simulateNetworkDelay();

  const threat = threatMapData.find((t) => t.threat_id === id);

  if (!threat) {
    return {
      success: false,
      data: {} as ThreatMapEntry,
      statusCode: 404,
      notifications: [],
      message: `Threat ${id} not found`,
    };
  }

  return {
    success: true,
    data: threat,
    statusCode: 200,
    notifications: [],
  };
}

/**
 * PUT /api/v2/threat-map/:id/status
 * Atualiza o status de uma ameaça
 */
export async function updateThreatStatus(
  id: string,
  status: ThreatMapEntry['status']
): Promise<Response<ThreatMapEntry>> {
  await simulateNetworkDelay();

  const threatIndex = threatMapData.findIndex((t) => t.threat_id === id);

  if (threatIndex === -1) {
    return {
      success: false,
      data: {} as ThreatMapEntry,
      statusCode: 404,
      notifications: [],
      message: `Threat ${id} not found`,
    };
  }

  threatMapData[threatIndex].status = status;

  return {
    success: true,
    data: threatMapData[threatIndex],
    statusCode: 200,
    notifications: [],
    message: 'Threat status updated successfully',
  };
}

/**
 * GET /api/v2/threat-map/stats
 * Estatísticas gerais das ameaças
 */
export async function getThreatStats(): Promise<
  Response<{
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    byStatus: Record<string, number>;
  }>
> {
  await simulateNetworkDelay();

  const stats = {
    total: threatMapData.length,
    byType: threatMapData.reduce(
      (acc, threat) => {
        acc[threat.threat_type] = (acc[threat.threat_type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ),
    bySeverity: threatMapData.reduce(
      (acc, threat) => {
        acc[threat.severity] = (acc[threat.severity] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ),
    byStatus: threatMapData.reduce(
      (acc, threat) => {
        acc[threat.status] = (acc[threat.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ),
  };

  return {
    success: true,
    data: stats,
    statusCode: 200,
    notifications: [],
  };
}
