// src/utils/shouldActivateCreatedFarm.ts
// -----------------------------------------------------------------------------
// TASK-072-FE-09 (E2, G-FE-3 confirmado) — regra pura: a fazenda recém-CRIADA
// vira a fazenda ativa SOMENTE quando o usuário ainda não tem fazenda ativa.
// Espelha o legado (`agro365/app/Http/Controllers/Admin/FarmController.php:246-266`:
// ao criar fazenda sem ativa, ativa a primeira e recarrega a sessão).
// Edição nunca troca a ativa; usuário com ativa mantém a escolha dele.
// -----------------------------------------------------------------------------

interface ShouldActivateCreatedFarmParams {
  isEditing: boolean;
  activeFarmUuid: string | null | undefined;
}

/**
 * Decide se a fazenda salva deve ser ativada no servidor (`POST /me/farms/{uuid}/select`).
 * @param {ShouldActivateCreatedFarmParams} params - Modo do form e fazenda ativa atual.
 * @return {boolean} `true` só em CREATE sem fazenda ativa.
 */
export function shouldActivateCreatedFarm({
  isEditing,
  activeFarmUuid,
}: ShouldActivateCreatedFarmParams): boolean {
  return !isEditing && !activeFarmUuid;
}
