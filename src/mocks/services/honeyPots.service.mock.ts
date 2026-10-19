/**
 * Mock Service - Honeypots
 *
 * Simula chamadas à API V2 para gerenciamento de honeypots.
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
import { mockHoneypotData, type IHoneypots } from '@/mocks/data/honeypots/honeypots.data';

/**
 * Simula delay de rede (100-500ms)
 */
const simulateNetworkDelay = () => {
    const delay = Math.random() * 50 + 100;
    return new Promise((resolve) => setTimeout(resolve, delay));
};

/**
 * GET /api/v2/honeypots
 * Lista honeypots com paginação e filtros
 *
 * Compatível com useCustomGridQuery
 */
export async function getAllHoneypots(
    params: PaginationQueryParams & {
        search?: string;
        level?: string;
        protocol?: string;
        origin?: string;
        systemMessage?: string;
    } = {}
): Promise<ResponsePagination<IHoneypots[]>> {
    await simulateNetworkDelay();

    try {
        const {
            page = 1,
            per_page = 25,
            search = '',
            level,
            origin,
            systemMessage,
            orderBy,
        } = params;

        // 1. Filtrar dados
        let filteredHoneypots = [...mockHoneypotData];

        // Busca textual
        if (search) {
            const searchLower = search.toLowerCase();
            filteredHoneypots = filteredHoneypots.filter(
                (honeypot) =>
                    honeypot.name.toLowerCase().includes(searchLower) ||
                    honeypot.attackerIp?.toLowerCase().includes(searchLower) ||
                    honeypot.targetBridge?.toLowerCase().includes(searchLower) ||
                    honeypot.protocol.toLowerCase().includes(searchLower)
            );
        }

        // Filtros específicos
        if (level) {
            filteredHoneypots = filteredHoneypots.filter((honeypot) => honeypot.attackerRep.level === level);
        }
        if (origin) {
            filteredHoneypots = filteredHoneypots.filter((honeypot) => honeypot.origin === origin);
        }
        if (systemMessage) {
            filteredHoneypots = filteredHoneypots.filter((honeypot) => honeypot.systemMessage === systemMessage);
        }

        // 2. Ordenar
        if (orderBy && typeof orderBy === 'object' && 'name' in orderBy) {
            const field = orderBy.name;
            const isAsc = orderBy.ascOrDesc?.toLowerCase() === 'asc';

            filteredHoneypots.sort((a, b) => {
                let comparison = 0;
                switch (field) {
                    case 'severity': // Mapped to level
                        comparison = a.attackerRep.level.localeCompare(b.attackerRep.level);
                        break;
                    case 'category': // Mapped to protocol
                        comparison = a.protocol.localeCompare(b.protocol);
                        break;
                    case 'origin':
                        comparison = a.origin.localeCompare(b.origin);
                        break;
                    case 'name':
                        comparison = a.name.localeCompare(b.name);
                        break;
                }
                return isAsc ? comparison : -comparison;
            });
        }

        // 3. Paginar
        const totalRecords = filteredHoneypots.length;
        const pagesCount = Math.ceil(totalRecords / per_page);
        const startIndex = (page - 1) * per_page;
        const paginatedData = filteredHoneypots.slice(startIndex, startIndex + per_page);

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
 * GET /api/v2/honeypots/:id
 * Busca honeypot por ID
 *
 * Compatível com useCustomFormQueryById
 */
export async function getHoneypotById(honeypotId: string): Promise<Response<IHoneypots>> {
    await simulateNetworkDelay();

    try {
        const honeypot = mockHoneypotData.find((h) => h.id === honeypotId);

        if (!honeypot) {
            return {
                success: false,
                data: {} as IHoneypots,
                statusCode: 404,
                message: `Honeypot ${honeypotId} não encontrado`,
                notifications: [],
            };
        }

        return {
            success: true,
            data: honeypot,
            statusCode: 200,
            notifications: [],
        };
    } catch (error) {
        return {
            success: false,
            data: {} as IHoneypots,
            statusCode: 500,
            message: 'Erro ao buscar honeypot',
            notifications: [],
        };
    }
}

/**
 * GET /api/v2/honeypots/stats
 * Estatísticas dos honeypots
 */
export interface HoneypotsStats {
    total: number;
    byLevel: Record<string, number>; // string key because levels might be dynamic or just strings in interface
    byProtocol: Record<string, number>;
}

export async function getHoneypotsStats(): Promise<Response<HoneypotsStats>> {
    await simulateNetworkDelay();

    try {
        const stats: HoneypotsStats = {
            total: mockHoneypotData.length,
            byLevel: mockHoneypotData.reduce((acc, curr) => {
                const level = curr.attackerRep.level || 'Unknown';
                acc[level] = (acc[level] || 0) + 1;
                return acc;
            }, {} as Record<string, number>),
            byProtocol: mockHoneypotData.reduce((acc, curr) => {
                const protocol = curr.protocol || 'Unknown';
                acc[protocol] = (acc[protocol] || 0) + 1;
                return acc;
            }, {} as Record<string, number>),
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
            data: {} as HoneypotsStats,
            statusCode: 500,
            message: 'Erro ao buscar estatísticas',
            notifications: [],
        };
    }
}

/**
 * DELETE /api/v2/honeypots/:id
 * Remove honeypot
 *
 * Compatível com useRequest
 */
export async function deleteHoneypot(honeypotId: string): Promise<Response<{ deleted: boolean }>> {
    await simulateNetworkDelay();

    try {
        const index = mockHoneypotData.findIndex((h) => h.id === honeypotId);

        if (index === -1) {
            return {
                success: false,
                data: { deleted: false },
                statusCode: 404,
                message: `Honeypot ${honeypotId} não encontrado`,
                notifications: [],
            };
        }

        // Mock: não remove de fato para não perder dados
        return {
            success: true,
            data: { deleted: true },
            statusCode: 200,
            message: 'Honeypot deletado com sucesso',
            notifications: [],
        };
    } catch (error) {
        return {
            success: false,
            data: { deleted: false },
            statusCode: 500,
            message: 'Erro ao deletar honeypot',
            notifications: [],
        };
    }
}

/**
 * POST /api/v2/honeypots/export
 * Exporta honeypots
 */
export async function exportHoneypots(params: {
    format: 'csv' | 'json';
    [key: string]: any;
}): Promise<Response<{ downloadUrl: string; filename: string }>> {
    await simulateNetworkDelay();

    try {
        const { format, ...filterParams } = params;
        const result = await getAllHoneypots(filterParams);

        if (!result.success) {
            return {
                success: false,
                data: { downloadUrl: '', filename: '' },
                statusCode: 500,
                message: 'Erro ao exportar honeypots',
                notifications: [],
            };
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `honeypots-export-${timestamp}.${format}`;
        const downloadUrl = `/api/v2/honeypots/download/${filename}`;

        return {
            success: true,
            data: { downloadUrl, filename },
            statusCode: 200,
            message: 'Honeypots exportados com sucesso',
            notifications: [],
        };
    } catch (error) {
        return {
            success: false,
            data: { downloadUrl: '', filename: '' },
            statusCode: 500,
            message: 'Erro ao exportar honeypots',
            notifications: [],
        };
    }
}
