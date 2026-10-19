// src/services/v2/Farms/farm-kml-service.ts
// -----------------------------------------------------------------------------
// Importação de KML/KMZ — endpoint utilitário `POST /api/v1/kml-import`
// (`TASK-BE-425`), consumido pela etapa Demarcação do wizard de Fazenda
// (`TASK-FE-412`, GAP-FE-121 reaberto).
//
// GENERALIZADO em TASK-FE-415 (fundação do módulo Áreas,
// `CONTRATO-tela-frontend-area.md §2-bis`): a implementação real agora mora
// em `src/services/v2/shared/kml-import-service.ts` (`importKml`), reusável
// por Fazenda E Área — este arquivo é um RE-EXPORT sob o nome histórico
// `importFarmKml`, preservando 100% o import existente em
// `src/pages/CadastrosBase/Fazendas/steps/StepDemarcacao.tsx`
// (`mutationFn: importFarmKml`) sem duplicar a função. Consumidor NOVO
// (TASK-FE-419, editor de Área) deve importar `importKml` diretamente de
// `@/services/v2/shared/kml-import-service` — não deste alias.
// -----------------------------------------------------------------------------

import { importKml } from '@/services/v2/shared/kml-import-service';

export { importKml as importFarmKml };
