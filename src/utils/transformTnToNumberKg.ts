export default function transformTnToNumberKg(value: string | number): number {
  if (typeof value === "string") {
    value = parseFloat(value.replace(/[^\d.-]/g, "").replace(/,/g, "."));
  }

  if (isNaN(value)) {
    return 0;
  }

  const kg = value * 1000;

  return kg;
}
