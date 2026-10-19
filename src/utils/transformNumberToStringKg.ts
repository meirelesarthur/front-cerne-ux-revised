export default function transformNumberToStringKg(
  value: string | number
): string {
  if (value === null || value === undefined) {
    return "0,00 Kg";
  }
  if (typeof value === "string") {
    value = parseFloat(value.replace(/[^\d.-]/g, "").replace(/,/g, "."));
  }

  if (isNaN(value)) {
    return "0,00 Kg";
  }

  return (
    value.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " Kg"
  );
}
