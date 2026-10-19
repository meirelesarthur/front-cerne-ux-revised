// src/pages/Integracoes/SoftwareDominio/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Software Domínio (IntegrationDominio —
// Integrações, F-121, TASK-F121-FE-03). SÓ o CTA "Nova Integração"
// (condicionado a `integration_dominios_create`, mirror `HeaderTable.tsx` de
// `Compartilhamento`/`Cte`). Texto próprio via i18n (`list.actions.new`) —
// NÃO usa `ButtonAdd` genérico ("Novo") porque o contrato de tela exige o
// rótulo fiel "Nova Integração" (§5.1).
// -----------------------------------------------------------------------------

import type { ElementType } from 'react';

import { FiPlus } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

export function HeaderTable() {
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const navigate = useNavigate();
  const text = languageGB.integrationDominios.list;

  return (
    <>
      {can('integration_dominios_create') && (
        <Button
          title={text.actions.new}
          icon={FiPlus as ElementType}
          onClick={() => navigate('/integracoes/dominio/novo')}
        />
      )}
    </>
  );
}

export default HeaderTable;
