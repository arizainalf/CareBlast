// app/controllers/http/profile_controller.ts
import Pasien from '#models/pasien'
import { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

export default class ProfilesController {
  public async index({ view, auth }: HttpContext) {
    const userId = auth.user?.id || 0

    const pasien = await Pasien.query()
      .where('id', userId)
      .preload('jenisPenyakit')
      .preload('contact')
      .preload('kunjungans', (query) => {
        query.orderBy('tanggalKunjungan', 'desc').limit(1)
      })
      .firstOrFail()

    const tempatLahir = pasien.tempat
    const tanggalLahirFormatted = DateTime.fromISO(
      pasien.tanggal_lahir as unknown as string
    ).toFormat('dd MMMM yyyy')

    return view.render('pengguna/profile', {
      pasien,
      tempatLahir,
      tanggalLahirFormatted,
    })
  }
}
