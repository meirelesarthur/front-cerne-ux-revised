import formatWeight from '@/utils/formatWeight';

export function formatVlTimeProductive(
  baseSalary: number | string | null | undefined,
  monthlyHours: number | string | null | undefined
): string {
  const salary = Number(baseSalary);
  const hours = Number(monthlyHours);
  const canCompute = Number.isFinite(salary) && Number.isFinite(hours) && salary > 0 && hours > 0;
  const value = canCompute ? Math.round((salary / hours) * 100) / 100 : 0;
  return formatWeight(value, '').trim();
}
