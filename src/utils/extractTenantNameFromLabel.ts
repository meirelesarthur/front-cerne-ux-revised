// src/utils/extractTenantNameFromLabel.ts
// -----------------------------------------------------------------------------
// Utilitário compartilhado — extrai só o NOME do `label` composto
// `"nif - name"` que `SharingTenantRef.label` traz pronto do backend
// (`SharingResource`, pensado para o `SelectAsyncPaginate` do formulário de
// Compartilhamento, F-122).
//
// A coluna "Contratante" da listagem (`TASK-CP-FE-01`) e o card "Contratante"
// da tela de visualização (`TASK-CP-FE-03`) exibem SÓ o nome — mirror
// `CL-029`/`CL-032`/`EV-26`: o legado mostra `item.tenant.people.name`, nunca
// o NIF composto. Centralizado aqui para não duplicar a lógica de extração
// entre as duas telas (nota de reconciliação do contrato de tela, `## `
// Componentes de `TASK-CP-FE-01`/`TASK-CP-FE-03`).
//
// `split(' - ')` com guarda: nomes com hífen (`"Empresa - Filial LTDA"`)
// preservam o restante do nome (`slice(1).join(' - ')`), assumindo que só o
// PRIMEIRO segmento é o NIF (o backend nunca insere `" - "` dentro do NIF).
// -----------------------------------------------------------------------------

/**
 * Extrai a parte "nome" de um `label` composto `"nif - name"` vindo pronto do
 * backend. Sem separador reconhecível, devolve o `label` original (defensivo
 * — nunca esconde o dado por completo).
 *
 * @param {string} label - Label composto `"nif - name"` (`SharingTenantRef.label`).
 * @return {string} Só a parte do nome.
 */
export function extractTenantNameFromLabel(label: string): string {
  if (!label) return '';

  const parts = label.split(' - ');
  if (parts.length < 2) return label;

  return parts.slice(1).join(' - ').trim();
}
