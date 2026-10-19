export default function transformStringToNumberInt(
  value: string | number
): number {
  if (value === null || value === undefined) {
    return 0;
  }

  if (typeof value === "string") {
    value = value.replace(/[^\d.-]+/g, "");
    value = value.replace(/\./g, "");
    value = value.replace(/,/g, ".");
  }

  const result = parseInt(String(value));

  if (Number.isNaN(result)) {
    return 0;
  }
  return result;
}
