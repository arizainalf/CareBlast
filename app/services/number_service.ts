export const NumberHelper = (number: string): string => {
  return number.startsWith('0') ? `62${number.slice(1)}` : number
}
export default NumberHelper
