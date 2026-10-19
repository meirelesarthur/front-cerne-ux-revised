export default function rangeOfNumbers(start: number, end: number): number[] {
  const arrayOfNumbers = [];
  for (let i = start; i <= end; i += 1) {
    arrayOfNumbers.push(i);
  }
  return arrayOfNumbers;
}
