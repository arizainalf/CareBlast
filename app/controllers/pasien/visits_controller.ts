// app/controllers/http/visits_controller.ts
import Pasien from '#models/pasien'
import Kunjungan from '#models/kunjungan'
import { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

export default class VisitsController {
  public async index({ view, auth }: HttpContext) {
    const userId = auth.user?.id || 0

    const pasien = await Pasien.query().where('id', userId).firstOrFail()

    const allKunjungan = await Kunjungan.query()
      .where('pasienId', pasien.id)
      .orderBy('tanggalKunjungan', 'desc')
      .preload('dokter', (dokterQuery) => {
        dokterQuery.preload('spesialist')
      })

    const utils = {
      formatDate: (date: string | Date) => {
        return DateTime.fromJSDate(new Date(date)).toFormat('dd MMMM yyyy')
      },
      formatTime: (time: string) => {
        return time
      },
    }

    return view.render('pengguna/visits', {
      pasien,
      allKunjungan,
      ...utils,
    })
  }
}
