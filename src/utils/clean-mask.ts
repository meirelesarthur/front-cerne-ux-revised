export default function cleanMask(value: string): string {
  if (!value) return '';
  return value.replace(/[^a-z0-9]/gi, '');
}
