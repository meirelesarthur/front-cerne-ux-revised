// -----------------------------------------------------------------------------
// Permission Service — API v1 do backend Laravel GB.Cerne.
//
//   GET /permissions/tree → data: PermissionTreeGroup[]
//
// Árvore hierárquica de permissões: nós de grupo { title, icon?, url?,
// is_farm?, items } aninhados; FOLHAS { name, description, uuid | null }.
// `uuid: null` = permissão sem seed neste ambiente (drift) — o front a trata
// como não-selecionável e a ignora no submit.
// -----------------------------------------------------------------------------

import type { Response } from "@/@types/response-api";
import type { PermissionTreeGroup } from "@/@types/v2/Roles";
import api from "@/services/api";

async function getPermissionTree() {
  const { data } = await api.V2.get<Response<PermissionTreeGroup[]>>(
    "/permissions/tree"
  );
  return data;
}

export { getPermissionTree };
