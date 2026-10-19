// src/services/v2/Configuracoes/Permission/permission-screens-service.ts
// -----------------------------------------------------------------------------
// Permission Screens Service — lookup DEDICADO de TELAS (Help-contrato §10),
// consumido pelo Select de `permission` do formulário de Tutoriais
// (TASK-HP-06). NÃO é um lookup genérico de permissões.
//
//   GET /permissions/screens → data: PermissionScreenOption[], achatada,
//                               ~200 entradas (1 por módulo/tela, slug
//                               `_view`), SEM paginação, SEM gate
//                               administrativo (`auth:sanctum` +
//                               `throttle:api` apenas).
//
// NUNCA usar `/permissions` (paginado, gate `permissions_view`) nem
// `/permissions/tree` (formato de árvore) para este Select — ambos têm gate
// administrativo e formato errado (Help-contrato §10, achado da Doc Bruta
// §12.1 item 4).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type { PermissionScreenOption } from '@/@types/v2/Configuracoes/help';

async function getPermissionScreens() {
  const { data } = await api.V2.get<Response<PermissionScreenOption[]>>('/permissions/screens');
  return data;
}

export { getPermissionScreens };
