import { DateTime } from 'luxon';

export function formatDate(value: string, format: string = 'dd LLLL yyyy') {
  const date = DateTime.fromISO(value);
  return date.isValid ? date.toFormat(format) : 'Tanggal tidak valid';
}
