export default function transformNumberToStringTn(
  value: string | number
): string {
  if (value === null || value === undefined) {
    return "0,00 tn";
  }

  if (typeof value === "string") {
    value = parseFloat(value.replace(/[^\d.-]/g, "").replace(/,/g, "."));
  }

  if (isNaN(value)) {
    return "0,00 tn";
  }

  const tons = value / 1000;

  return (
    tons.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " tn"
  );
}
