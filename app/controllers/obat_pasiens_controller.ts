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
        batasWaktu,
        status,
        hariKonsumsi
      } = request.body()

      console.log(params.uuid)
      const pasien = await Pasien.query()
        .select('id', 'uuid')
        .where('uuid', pasienUuid)
        .firstOrFail()
      const actualObatName = obatNama === 'other' ? customObat : obatNama

      if (!actualObatName) {
        return response
          .status(400)
          .json({
            success: false,
            message: 'Nama obat tidak boleh kosong'
          })
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
      
      const kunjungan = await Kunjungan.query().where('id', selectedKunjunganId)
        .where('pasienId', pasien.id)

      const obatPasien = await ObatPasien.create({
        uuid: uuidv4(),
        pasienId: pasien.id,
        obatId: obat.id,
        kunjunganId: selectedKunjunganId,
        frekuensi: 1,
        waktuKonsumsi: JSON.stringify(['08:00']),
        hariKonsumsi: JSON.stringify(hariKonsumsi),
        keteranganWaktu,
        batasWaktu: batasWaktu? batasWaktu : kunjungan[0]?.kunjunganBerikutnya?.toJSDate?.() ?? kunjungan[0]?.kunjunganBerikutnya ?? null,
        status
      })

      return response.json({
        success: true,
        message: 'Obat berhasil ditambahkan',
        data: obatPasien,
        redirectUrl: `/pasien/${pasienUuid}`
      })
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
      const { frekuensi, waktu, keteranganWaktu, batasWaktu, status, hariKonsumsi } = request.body()
      const waktuArray = Array.isArray(waktu) ? waktu : [waktu]

      console.log(hariKonsumsi)

      const updated = await ObatPasien.query()
        .where('uuid', obatPasienUuid)
        .update({
          frekuensi: Number.parseInt(frekuensi, 10),
          waktuKonsumsi: JSON.stringify(waktuArray),
          keteranganWaktu,
          hariKonsumsi: JSON.stringify(hariKonsumsi),
          batasWaktu,
          status
        })

      if (!updated) {
        return response.status(404).json({ success: false, message: 'Obat tidak ditemukan' })
      }

      const referer = request.headers().referer || `/pasien/${params.pasienUuid}`
      console.log(updated, batasWaktu, status)

      return response.json({
        success: true,
        message: 'Jadwal obat berhasil diperbarui',
        redirectUrl: referer
      })

    } catch (error) {
      console.error('Error updating medication:', error)
      return response
        .status(500)
        .json({ success: false, message: 'Error memperbarui jadwal obat', error: error.message })
    }
  }

  async destroy(ctx: HttpContext) {
    const { params, response, request } = ctx

    try {
      const obatPasien = await ObatPasien.findBy('uuid', params.uuid)

      if (!obatPasien) {
        return response.status(404).json({ success: false, message: 'Obat tidak ditemukan' })
      }

      await obatPasien.delete()

      return request.accepts(['html', 'json']) === 'json'
        ? response.json({
          success: true,
          message: 'Obat berhasil dihapus',
          redirectUrl: `/pasien/${params.pasienUuid}`
        })
        : response.redirect().back()
    } catch (error) {
      console.error('Error deleting medication:', error)
      return response
        .status(500)
        .json({
          success: false,
          message: 'Error menghapus obat',
          error: error.message
        })
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
          return response.status(404).json({
            success: false,
            message: 'Tidak ditemukan kunjungan',
            redirectUrl: `/pasien/${pasienUuid}`,
          })
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
          .json({
            success: false,
            message: 'Tidak ada data obat untuk kunjungan ini'
          })
      }

      return response.json({
        success: true,
        message: `Berhasil menghapus ${deleted} data obat`,
        deletedCount: deleted,
        redirectUrl: `/pasien/${pasienUuid}`,
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
  async getDetail({ params, response }: HttpContext) {
    try {
      const { uuid } = params

      if (!uuid) {
        return response.status(400).json({
          success: false,
          message: 'UUID obat pasien diperlukan',
        })
      }

      const obatPasien = await ObatPasien.query()
        .where('uuid', uuid)
        .preload('obat')
        .preload('kunjungan')
        .first()

      if (!obatPasien) {
        return response.status(404).json({
          success: false,
          message: 'Data obat pasien tidak ditemukan',
        })
      }

      let waktuKonsumsi = []
      try {
        if (typeof obatPasien.waktuKonsumsi === 'string') {
          if (
            obatPasien.waktuKonsumsi.trim().startsWith('[') &&
            obatPasien.waktuKonsumsi.trim().endsWith(']')
          ) {
            waktuKonsumsi = JSON.parse(obatPasien.waktuKonsumsi)
          } else if (obatPasien.waktuKonsumsi.includes(',')) {
            waktuKonsumsi = obatPasien.waktuKonsumsi.split(',').map((time) => time.trim())
          } else {
            waktuKonsumsi = [obatPasien.waktuKonsumsi.trim()]
          }
        } else if (Array.isArray(obatPasien.waktuKonsumsi)) {
          waktuKonsumsi = obatPasien.waktuKonsumsi
        }
      } catch (error) {
        console.error('Error parsing waktu konsumsi:', error)
        waktuKonsumsi = obatPasien.waktuKonsumsi ? [String(obatPasien.waktuKonsumsi)] : []
      }

      const formattedData = {
        uuid: obatPasien.uuid,
        obat: {
          id: obatPasien.obat.id,
          nama: obatPasien.obat.nama,
          dosis: obatPasien.obat.dosis,
        },
        status: obatPasien.status,
        frekuensi: obatPasien.frekuensi,
        keteranganWaktu: obatPasien.keteranganWaktu,
        waktuKonsumsi: waktuKonsumsi,
        batasWaktu: obatPasien.batasWaktu,
        isBeforeMeal: obatPasien.keteranganWaktu.toLowerCase().includes('sebelum'),
      }

      return response.json({
        success: true,
        data: formattedData,
      })
    } catch (error) {
      console.error('Error fetching medication details:', error)
      return response.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengambil detail obat',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
}
