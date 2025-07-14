import { DateTime } from 'luxon';
import Pengaturan from '#models/pengaturan';

export function formatDate(value: string, format: string = 'dd LLLL yyyy') {
  const date = DateTime.fromISO(value).setLocale('id');
  return date.isValid ? date.toFormat(format) : 'Tanggal tidak valid';
}

export function formatMonth(month: number): string {
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  return month >= 1 && month <= 12 ? monthNames[month - 1] : 'Bulan tidak valid';
}
export function formatPhoneNumber(phoneNumber: string): string {

  return phoneNumber
    .replace(/@.+$/, '')  // Hapus bagian setelah @ (misalnya domain WhatsApp)
    .replace(/^62/, '0')  // Ganti awalan 62 dengan 0
}

export function baseUrl(): string {
  return process.env.APP_URL || 'http://localhost:3333/';
}

export function toDateInputValue(isoString: string): string {
  return DateTime.fromISO(isoString).toFormat('yyyy-MM-dd')
}

export async function getPengaturan(field: string) {
  const pengaturan = await Pengaturan.findOrFail(1)
  return pengaturan[field as keyof typeof pengaturan]
}