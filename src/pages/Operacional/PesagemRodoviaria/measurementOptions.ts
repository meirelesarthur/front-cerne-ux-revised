import type { Option } from '@/@types/option';

export function dedupeOptionsByValue<T extends string>(options: Option<T>[]): Option<T>[] {
  const seen = new Set<T>();
  return options.filter((option) => {
    if (seen.has(option.value)) return false;
    seen.add(option.value);
    return true;
  });
}
