// src/utils/formatDurationHms.ts
// Formata uma duração em segundos como `Xh Ym Zs` (só os degraus não-zero) —
// usado pelo KPI "Tempo médio de sessão" (execução 046, TASK-UA-FE-04,
// `UA-KPI-04`: o legado formata h/m/s, não minutos decimais).
export default function formatDurationHms(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.round(totalSeconds || 0));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

  return parts.join(' ');
}
