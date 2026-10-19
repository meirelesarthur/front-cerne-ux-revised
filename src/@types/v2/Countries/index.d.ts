// src/@types/v2/Countries/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do catálogo de PAÍSES (Country) — API v1 do backend Laravel GB.Cerne.
// Catálogo GLOBAL, somente-leitura, SEM gate de permissão (mirror `City`/
// `State`, `TASK-BE-423`). Único consumidor nesta execução (024): o Select de
// País do wizard de Fazenda (`GAP-FE-124`/`TASK-BE-424`, fecha
// `GAP-BE-202`/`GAP-FE-124`).
//
// Contrato (envelope ApiResponse { success, message, data, errors, meta }):
//   GET /api/v1/countries/options → data: CountryOptionItem[], payload enxuto
//                                    (`uuid`+`nome`+`codigo`), paginado
//                                    (`ApiResponse::paginated`, mesma
//                                    convenção de `cities/options`/
//                                    `states/options`).
//
// Fonte batida linha a linha contra `api_root` nesta execução:
//   - app/Http/Resources/V1/CountryOptionResource.php (shape enxuto)
//   - app/Http/Controllers/Api/V1/CountryController.php::options()
//   - app/Http/Requests/Api/V1/CountryOptionsRequest.php (`search`/`per_page`)
// -----------------------------------------------------------------------------

// ============================================
// COUNTRY OPTION (resposta de `/countries/options`)
// ============================================

export interface CountryOptionItem {
  uuid: string;
  nome: string;
  codigo: number;
}

// ============================================
// ENVELOPE (ApiResponse::paginated)
// ============================================

export interface CountriesOptionsEnvelope {
  success: boolean;
  message: string;
  data: CountryOptionItem[];
  errors: Record<string, string[]> | null;
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
  } | null;
}
