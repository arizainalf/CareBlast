import dayjs from "dayjs"
import 'dayjs/locale/id.js'

export const NumberHelper = (number: string): string => {
  return number.startsWith('0') ? `62${number.slice(1)}` : number
}

export default NumberHelper

export const formatWhatsappNumber = (number: string): string => {
  return NumberHelper(number) + '@s.whatsapp.net'
}

export const getHariIni = (): string => {
  const hari = dayjs().locale('id').format('dddd') // Pastikan sudah pakai locale 'id'
  return capitalizeFirstLetter(hari) // Misal: "Senin"
}

export const capitalizeFirstLetter = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}