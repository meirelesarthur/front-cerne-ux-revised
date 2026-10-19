/**
 * Mock Service - Blocked Attacks
 *
 * Simula chamadas à API V2 para gerenciamento de ataques bloqueados.
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
import { mockBlockedAttacksData, type IBlockedAttacks } from '@/mocks/data/blockedAttacks/blockedAttacks.data';

/**
 * Simula delay de rede (100-500ms)
 */
const simulateNetworkDelay = () => {
    const delay = Math.random() * 50 + 100;
    return new Promise((resolve) => setTimeout(resolve, delay));
};

/**
 * GET /api/v2/blocked-attacks
 * Lista ataques bloqueados com paginação e filtros
 *
 * Compatível com useCustomGridQuery
 */
export async function getAllBlockedAttacks(
    params: PaginationQueryParams & {
        search?: string;
        severity?: string;
        attackType?: string;
        location?: string;
        blockedBy?: string;
    } = {}
): Promise<ResponsePagination<IBlockedAttacks[]>> {
    await simulateNetworkDelay();

    try {
        const {
            page = 1,
            per_page = 25,
            search = '',
            severity,
            attackType,
            location,
            blockedBy,
        } = params;

        // Filtro por busca
        let filtered = mockBlockedAttacksData.filter((item) => {
            const matchSearch =
                !search ||
                item.attackType.toLowerCase().includes(search.toLowerCase()) ||
                item.sourceIp.toLowerCase().includes(search.toLowerCase()) ||
                item.location.toLowerCase().includes(search.toLowerCase());

            const matchSeverity = !severity || item.severity === severity;
            const matchAttackType = !attackType || item.attackType === attackType;
            const matchLocation = !location || item.location === location;
            const matchBlockedBy = !blockedBy || item.blockedBy === blockedBy;

            return matchSearch && matchSeverity && matchAttackType && matchLocation && matchBlockedBy;
        });

        // Paginação
        const totalRecords = filtered.length;
        const pagesCount = Math.ceil(totalRecords / per_page);
        const start = (page - 1) * per_page;
        const end = start + per_page;
        const paginatedData = filtered.slice(start, end);

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
 * GET /api/v2/blocked-attacks/:id
 * Detalhes de um ataque bloqueado específico
 */
export async function getBlockedAttackById(id: string): Promise<Response<IBlockedAttacks>> {
    await simulateNetworkDelay();

    try {
        const attack = mockBlockedAttacksData.find((item) => item.id === id);

        if (!attack) {
            return {
                success: false,
                statusCode: 404,
                data: {} as IBlockedAttacks,
                notifications: [],
                message: 'Ataque bloqueado não encontrado',
            };
        }

        return {
            success: true,
            statusCode: 200,
            data: attack,
            notifications: [],
        };
    } catch (error) {
        return {
            success: false,
            statusCode: 500,
            data: {} as IBlockedAttacks,
            notifications: [],
            message: 'Erro ao buscar ataque bloqueado',
        };
    }
}

/**
 * GET /api/v2/blocked-attacks/severity/:severity
 * Filtra ataques bloqueados por severidade
 */
export async function getBlockedAttacksBySeverity(
    severity: string,
    params: PaginationQueryParams = {}
): Promise<ResponsePagination<IBlockedAttacks[]>> {
    await simulateNetworkDelay();

    try {
        const { page = 1, per_page = 25 } = params;

        const filtered = mockBlockedAttacksData.filter(
            (item) => item.severity.toLowerCase() === severity.toLowerCase()
        );

        const totalRecords = filtered.length;
        const pagesCount = Math.ceil(totalRecords / per_page);
        const start = (page - 1) * per_page;
        const end = start + per_page;
        const paginatedData = filtered.slice(start, end);

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
 * POST /api/v2/blocked-attacks/export
 * Exporta ataques bloqueados em formato CSV/Excel
 */
export async function exportBlockedAttacks(
    ids?: string[]
): Promise<Response<{ url: string }>> {
    await simulateNetworkDelay();

    try {
        const selectedAttacks = ids
            ? mockBlockedAttacksData.filter((item) => ids.includes(item.id))
            : mockBlockedAttacksData;

        // Simula geração de URL de download
        const url = `data:text/csv;charset=utf-8,${encodeURIComponent(
            selectedAttacks.map((attack) => Object.values(attack).join(',')).join('\n')
        )}`;

        return {
            success: true,
            statusCode: 200,
            data: { url },
            notifications: [],
            message: 'Arquivo gerado com sucesso',
        };
    } catch (error) {
        return {
            success: false,
            statusCode: 500,
            data: { url: '' },
            notifications: [],
            message: 'Erro ao exportar ataques bloqueados',
        };
    }
}
