// src/pages/Administrativo/SystemLogs/LogsBreadcrumb.tsx
// Breadcrumb clicável do explorador/visualizador de logs. Criado localmente
// (em vez de reusar `@/components/Breadcrumb`) porque aquele só navega por
// `path[]`, gera `key` duplicada no fragmento e fixa `document.title`.
// Adaptado do `Breadcrumb` do design system `cerne` sobre o `Breadcrumb` do
// Chakra v3: cada trecho é um link real (Voltar do navegador sobe de nível).

import { Fragment } from 'react';

import { Breadcrumb } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';

import type { SystemLogBreadcrumb } from '@/@types/v2/SystemLogs';

interface LogsBreadcrumbProps {
  items: SystemLogBreadcrumb[];
  ariaLabel: string;
  // Link de cada trecho (pasta).
  hrefFor: (path: string) => string;
  // O último item é o local atual (não clicável)? Default: true.
  currentIsLast?: boolean;
}

export function LogsBreadcrumb({
  items,
  ariaLabel,
  hrefFor,
  currentIsLast = true,
}: LogsBreadcrumbProps) {
  return (
    <Breadcrumb.Root aria-label={ariaLabel} size="sm">
      <Breadcrumb.List>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isCurrent = isLast && currentIsLast;

          return (
            <Fragment key={`${index}-${item.path}`}>
              <Breadcrumb.Item>
                {isCurrent ? (
                  <Breadcrumb.CurrentLink fontFamily="mono" color="brandColorText">
                    {item.name}
                  </Breadcrumb.CurrentLink>
                ) : (
                  <Breadcrumb.Link asChild fontFamily="mono">
                    <RouterLink to={hrefFor(item.path)}>{item.name}</RouterLink>
                  </Breadcrumb.Link>
                )}
              </Breadcrumb.Item>
              {!isLast && <Breadcrumb.Separator />}
            </Fragment>
          );
        })}
      </Breadcrumb.List>
    </Breadcrumb.Root>
  );
}
