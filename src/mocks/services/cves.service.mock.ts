/**
 * Mock Service - CVEs
 *
 * Simula chamadas à API V2 para gerenciamento de CVEs.
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
import { mockCVEData, type ICVEs } from '@/mocks/data/cves/cves.data';

/**
 * Simula delay de rede (100-500ms)
 */
const simulateNetworkDelay = () => {
    const delay = Math.random() * 50 + 100;
    return new Promise((resolve) => setTimeout(resolve, delay));
};

/**
 * GET /api/v2/cves
 * Lista CVEs com paginação e filtros
 *
 * Compatível com useCustomGridQuery
 */
export async function getAllCVEs(
    params: PaginationQueryParams & {
        search?: string;
        severity?: string;
        cwe?: string;
        cvss?: string;
    } = {}
): Promise<ResponsePagination<ICVEs[]>> {
    await simulateNetworkDelay();

    try {
        const {
            page = 1,
            per_page = 25,
            search = '',
            severity,
            cwe,
        } = params;

        // Filtro por busca
        let filtered = mockCVEData.filter((item) => {
            const matchSearch =
                !search ||
                item.id.toLowerCase().includes(search.toLowerCase()) ||
                item.vectorString.toLowerCase().includes(search.toLowerCase()) ||
                item.cwe.toLowerCase().includes(search.toLowerCase());

            const matchSeverity = !severity || item.severity === severity;
            const matchCwe = !cwe || item.cwe.includes(cwe);

            return matchSearch && matchSeverity && matchCwe;
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
 * GET /api/v2/cves/:id
 * Detalhes de um CVE específico
 */
export async function getCVEById(id: string): Promise<Response<ICVEs>> {
    await simulateNetworkDelay();

    try {
        const cve = mockCVEData.find((item) => item.id === id);

        if (!cve) {
            return {
                success: false,
                statusCode: 404,
                data: {} as ICVEs,
                notifications: [],
                message: 'CVE não encontrado',
            };
        }

        return {
            success: true,
            statusCode: 200,
            data: cve,
            notifications: [],
        };
    } catch (error) {
        return {
            success: false,
            statusCode: 500,
            data: {} as ICVEs,
            notifications: [],
            message: 'Erro ao buscar CVE',
        };
    }
}

/**
 * GET /api/v2/cves/severity/:severity
 * Filtra CVEs por severidade
 */
export async function getCVEsBySeverity(
    severity: string,
    params: PaginationQueryParams = {}
): Promise<ResponsePagination<ICVEs[]>> {
    await simulateNetworkDelay();

    try {
        const { page = 1, per_page = 25 } = params;

        const filtered = mockCVEData.filter(
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
 * POST /api/v2/cves/export
 * Exporta CVEs em formato CSV/Excel
 */
export async function exportCVEs(
    ids?: string[]
): Promise<Response<{ url: string }>> {
    await simulateNetworkDelay();

    try {
        const selectedCves = ids
            ? mockCVEData.filter((item) => ids.includes(item.id))
            : mockCVEData;

        // Simula geração de URL de download
        const url = `data:text/csv;charset=utf-8,${encodeURIComponent(
            selectedCves.map((cve) => Object.values(cve).join(',')).join('\n')
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
            message: 'Erro ao exportar CVEs',
        };
    }
}
