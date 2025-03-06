import { HttpContext } from '@adonisjs/core/http'
import Kunjungan from '#models/kunjungan'
import ObatPasien from '#models/obat_pasien'
import Pasien from '#models/pasien'
import { v4 as uuidv4 } from 'uuid'

export default class KunjungansController {
  async store({ request, response, params }: HttpContext) {
    try {
      const pasienUuid = params.uuid
      const temaKunjungan = request.input('temaKunjungan', 'Tanpa Tema')
      const keterangan = request.input('keterangan', 'Tidak ada keterangan')
      const tanggalKunjungan = request.input(
        'tanggalKunjungan',
        new Date().toISOString().split('T')[0]
      )
      const obatList = request.input('obatList', [])

      const pasien = await Pasien.query().select('id').where('uuid', pasienUuid).firstOrFail()

      const kunjungan = await Kunjungan.create({
        uuid: uuidv4(),
        pasienId: pasien.id,
        tema: temaKunjungan,
        keterangan,
        tanggalKunjungan,
      })

      if (Array.isArray(obatList) && obatList.length > 0) {
        const obatPasienData = obatList.map((obatId) => ({
          uuid: uuidv4(),
          pasienId: pasien.id,
          kunjunganId: kunjungan.id,
          obatId,
          frekuensi: 1,
          waktuKonsumsi: JSON.stringify(['08:00']),
          keteranganWaktu: 'Sesudah makan',
        }))
        await ObatPasien.createMany(obatPasienData)
      } else {
        await ObatPasien.create({
          uuid: uuidv4(),
          pasienId: pasien.id,
          kunjunganId: kunjungan.id,
          obatId: undefined,
          frekuensi: 1,
          waktuKonsumsi: JSON.stringify(['08:00']),
          keteranganWaktu: 'Sesudah makan',
        })
      }

      return response.redirect().toPath(`/pasien/${pasienUuid}`)
    } catch (error) {
      console.error('Error menambahkan kunjungan:', error)
      return response
        .status(500)
        .json({ success: false, message: 'Error menambahkan kunjungan', error: error.message })
    }
  }
}
