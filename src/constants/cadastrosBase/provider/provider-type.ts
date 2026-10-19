// src/constants/cadastrosBase/provider/provider-type.ts
// Enum `type` do papel Provider — mirror EXATO de `App\Enums\Provider\
// ProviderTypeEnum` (backend, int-backed, Provider-contrato.md DA-PR-09).
// Índices confirmados por dupla fonte do legado (`agro365/app/Provider.php`
// `opTypes()` + `agro365/lang/pt-BR/trad.php`), sem divergência de rótulo.
//
// `type` é ESCRITO SEMPRE EM INT no payload (`CreateProviderRequest.
// provider.type`/`UpdateProviderRequest.provider.type`) — nunca o nome do
// case (mesma lição já catalogada em CategoryProduct/PlanAccount).
//
// SEM `providerTypeColor` próprio (ficha TASK-PR-FE-01, DoD) — o legado não
// usa cor por tipo, só um badge neutro + o rótulo (`type_label`, já
// resolvido pelo backend em `ProviderListResource`).

export const providerType = {
  fornecedor: 1,
  funcionario: 2,
  terceirizado: 3,
  transportador: 4,
  comissionado: 5,
  inseminador: 6,
} as const;

export type ProviderType = (typeof providerType)[keyof typeof providerType];
