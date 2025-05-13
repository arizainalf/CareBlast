import { DateTime } from 'luxon';

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
