import Pasien from '#models/pasien'
import Dokter from '#models/dokter'
import ObatPasien from '#models/obat_pasien'
import Kunjungan from '#models/kunjungan'
import { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

export default class PasiensController {
  public async index({ view, auth }: HttpContext) {
    const userId = auth.user?.id || 0

    const pasien = await Pasien.query()
      .where('id', userId)
      .preload('jenisPenyakit')
      .preload('kunjungans', (query) => {
        query.orderBy('tanggalKunjungan', 'desc').preload('dokter', (dokterQuery) => {
          dokterQuery.preload('spesialist')
        })
      })
      .firstOrFail()

    const latestVisit = await Kunjungan.query()
      .where('pasienId', pasien.id)
      .orderBy('tanggalKunjungan', 'desc')
      .preload('obatPasiens', (query) => {
        query.preload('obat')
      })
      .first()

    const todaysDoctors = await Dokter.query().where('status', true).preload('spesialist').limit(4)
    const obatPasiens: ObatPasien[] = latestVisit?.obatPasiens || []
    const medications: {
      sebelumMakan: ObatPasien[]
      sesudahMakan: ObatPasien[]
      lainnya: ObatPasien[]
    } = {
      sebelumMakan: [],
      sesudahMakan: [],
      lainnya: [],
    }

    const tempatLahir = pasien.tempat
    const tanggalLahirFormatted = DateTime.fromISO(
      pasien.tanggal_lahir as unknown as string
    ).toFormat('dd MMMM yyyy')

    obatPasiens.forEach((obatPasien) => {
      const dosisRaw = obatPasien.obat.dosis
      const dosisNumber = Number(dosisRaw)

      obatPasien.obat.dosis =
        dosisNumber % 1 === 0 ? Number(dosisNumber.toFixed(0)) : Number(dosisNumber.toFixed(2))

      switch (obatPasien.keteranganWaktu) {
        case 'Sebelum makan':
          medications.sebelumMakan.push(obatPasien)
          break
        case 'Sesudah makan':
          medications.sesudahMakan.push(obatPasien)
          break
        default:
          medications.lainnya.push(obatPasien)
          break
      }
    })

    const utils = {
      formatDate: (date: string | Date) => {
        return DateTime.fromJSDate(new Date(date)).toFormat('dd MMMM yyyy')
      },
      formatTime: (time: string) => {
        return time
      },
      calculateAge: (date: string | Date) => {
        const birthDate = DateTime.fromJSDate(new Date(date))
        const now = DateTime.now()
        const age = now.diff(birthDate, 'years').years
        return `${Math.floor(age)} tahun`
      },
    }

    return view.render('pengguna/index', {
      pasien,
      latestVisit,
      allKunjungan: pasien.kunjungans,
      medications,
      todaysDoctors,
      tempatLahir,
      tanggalLahirFormatted,
      ...utils,
    })
  }
}
