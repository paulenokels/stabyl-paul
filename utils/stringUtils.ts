/**
 * Filters input to only allow numbers and a single decimal point
 * @param text - The input text to filter
 * @returns The filtered text containing only numbers and at most one decimal point
 */
export function checkNumberInput(text: string): string {
  // Only allow numbers and a single decimal point
  const numericValue = text.replace(/[^0-9.]/g, '');
  
  // Ensure only one decimal point
  const parts = numericValue.split('.');
  const filteredValue = parts.length > 2 
    ? parts[0] + '.' + parts.slice(1).join('')
    : numericValue;
  if (parts[1] && parts[1].length > 2) {
    return filteredValue.slice(0, -1);
  }
  return filteredValue;
}
