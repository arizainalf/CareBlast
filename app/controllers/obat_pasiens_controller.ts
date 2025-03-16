import { HttpContext } from '@adonisjs/core/http'
import ObatPasien from '#models/obat_pasien'
import Obat from '#models/obat'
import { v4 as uuidv4 } from 'uuid'
import Pasien from '#models/pasien'
import Kunjungan from '#models/kunjungan'

export default class ObatPasiensController {
  async store(ctx: HttpContext) {
    const { request, response, params } = ctx

    try {
      const pasienUuid = params.uuid
      const {
        obatNama,
        customObat,
        keteranganWaktu,
        kunjunganId,
        tanggalKunjungan,
        temaKunjungan,
        keterangan,
      } = request.body()

      const pasien = await Pasien.query()
        .select('id', 'uuid')
        .where('uuid', pasienUuid)
        .firstOrFail()
      const actualObatName = obatNama === 'other' ? customObat : obatNama

      if (!actualObatName) {
        return response
          .status(400)
          .json({ success: false, message: 'Nama obat tidak boleh kosong' })
      }

      const obat = await Obat.firstOrCreate(
        { nama: actualObatName },
        { nama: actualObatName, uuid: uuidv4() }
      )

      let selectedKunjunganId = kunjunganId

      if (kunjunganId === 'new') {
        const newKunjungan = await Kunjungan.create({
          uuid: uuidv4(),
          pasienId: pasien.id,
          tema: temaKunjungan || 'Tanpa Tema',
          keterangan: keterangan || 'Tidak ada keterangan',
          tanggalKunjungan: tanggalKunjungan || new Date().toISOString().split('T')[0],
        })
        selectedKunjunganId = newKunjungan.id
      }

      const obatPasien = await ObatPasien.create({
        uuid: uuidv4(),
        pasienId: pasien.id,
        obatId: obat.id,
        kunjunganId: selectedKunjunganId,
        frekuensi: 1,
        waktuKonsumsi: JSON.stringify(['08:00']),
        keteranganWaktu,
      })

      const referer = request.headers().referer || `/pasien/${pasienUuid}`

      return request.accepts(['html', 'json']) === 'json'
        ? response.json({ success: true, message: 'Obat berhasil ditambahkan', data: obatPasien })
        : response.redirect().toPath(referer)
    } catch (error) {
      console.error('Error adding medication:', error)
      return response.status(500).json({
        success: false,
        message: 'Error menambahkan obat',
        error: error.message,
      })
    }
  }

  async update(ctx: HttpContext) {
    const { request, response, params } = ctx

    try {
      const obatPasienUuid = params.uuid
      const { frekuensi, waktu, keteranganWaktu } = request.body()
      const waktuArray = Array.isArray(waktu) ? waktu : [waktu]

      const updated = await ObatPasien.query()
        .where('uuid', obatPasienUuid)
        .update({
          frekuensi: Number.parseInt(frekuensi, 10),
          waktuKonsumsi: JSON.stringify(waktuArray),
          keteranganWaktu,
        })

      if (!updated) {
        return response.status(404).json({ success: false, message: 'Obat tidak ditemukan' })
      }

      const referer = request.headers().referer || `/pasien/${params.pasienUuid}`

      return request.accepts(['html', 'json']) === 'json'
        ? response.json({ success: true, message: 'Jadwal obat berhasil diperbarui' })
        : response.redirect().toPath(referer)
    } catch (error) {
      console.error('Error updating medication:', error)
      return response
        .status(500)
        .json({ success: false, message: 'Error memperbarui jadwal obat', error: error.message })
    }
  }

  async destroy(ctx: HttpContext) {
    const { params, response } = ctx

    try {
      const obatPasienUuid = params.uuid
      const deleted = await ObatPasien.query().where('uuid', obatPasienUuid).delete()

      if (!deleted) {
        return response.status(404).json({ success: false, message: 'Obat tidak ditemukan' })
      }

      return response.json({ success: true, message: 'Obat berhasil dihapus' })
    } catch (error) {
      console.error('Error deleting medication:', error)
      return response
        .status(500)
        .json({ success: false, message: 'Error menghapus obat', error: error.message })
    }
  }

  async destroyByKunjungan({ request, response, params }: HttpContext) {
    try {
      const pasienUuid = params.uuid
      let kunjunganId = request.input('kunjunganId')

      const pasien = await Pasien.query()
        .select('id', 'uuid')
        .where('uuid', pasienUuid)
        .firstOrFail()

      if (!kunjunganId) {
        const latestKunjungan = await Kunjungan.query()
          .where('pasienId', pasien.id)
          .orderBy('tanggalKunjungan', 'desc')
          .select('id', 'tema')
          .first()

        if (!latestKunjungan) {
          return response.status(404).json({ success: false, message: 'Tidak ditemukan kunjungan' })
        }
        kunjunganId = latestKunjungan.id
      }

      const deleted = await ObatPasien.query()
        .where('kunjunganId', kunjunganId)
        .where('pasienId', pasien.id)
        .delete()

      if (!deleted) {
        return response
          .status(404)
          .json({ success: false, message: 'Tidak ada data obat untuk kunjungan ini' })
      }

      return response.json({
        success: true,
        message: `Berhasil menghapus ${deleted} data obat`,
        deletedCount: deleted,
      })
    } catch (error) {
      console.error('Error menghapus data obat:', error)
      return response.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat menghapus data obat',
        error: error.message,
      })
    }
  }
}
