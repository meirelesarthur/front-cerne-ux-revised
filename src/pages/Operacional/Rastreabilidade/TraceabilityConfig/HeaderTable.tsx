// src/pages/Operacional/Rastreabilidade/TraceabilityConfig/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Configuração (Rastreabilidade) — TASK-TR-FE-09,
// contrato de tela `## 5.1`: "sem FilterSide — legado não tinha filtro nesta
// tela". Mirror `Traceability/HeaderTable.tsx` MENOS o `ButtonFilter`.
//
// Gate ÚNICO `tracconfig_view` cobre TODOS os verbos (`## 6.1` do contrato de
// destino, ratificado) — inclusive "Adicionar", que no legado seria gated por
// um `_create` que não existe para esta entidade.
// -----------------------------------------------------------------------------

import { useNavigate } from 'react-router-dom';

import { ButtonAdd } from '@/components/ButtonAdd';

import { usePermissions } from '@/hooks/usePermissions';

import type { LanguageDate } from '@/@types/language';

const TRACEABILITY_CONFIG_CREATE_ROUTE = '/operacional/rastreabilidade/configuracao/create';

interface HeaderTableProps {
  languageGB: LanguageDate;
}

export function HeaderTable({ languageGB }: HeaderTableProps) {
  const navigate = useNavigate();
  const { can } = usePermissions();

  return (
    <>
      {can('tracconfig_view') && (
        <ButtonAdd
          onClick={() => navigate(TRACEABILITY_CONFIG_CREATE_ROUTE)}
          languageGB={languageGB}
        />
      )}
    </>
  );
}
