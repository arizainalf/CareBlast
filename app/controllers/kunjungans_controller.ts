import { HttpContext } from '@adonisjs/core/http'
import Kunjungan from '#models/kunjungan'
import ObatPasien from '#models/obat_pasien'
import Pasien from '#models/pasien'
import { v4 as uuidv4 } from 'uuid'
import Obat from '#models/obat'
import { DateTime } from 'luxon'
import Dokter from '#models/dokter'
import Message from '#models/message'

export default class KunjungansController {
  async index({ view, request }: HttpContext) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)
    const search = request.input('search', '')

    const query = Pasien.query()
      .orderBy('createdAt', 'desc')
      .preload('kunjungans', (kunjunganQuery) => {
        kunjunganQuery.orderBy('tanggalKunjungan', 'desc').preload('obatPasiens', (obatQuery) => {
          obatQuery.preload('obat')
        }).preload('dokter', (dokterQuery) => {
          dokterQuery.preload('spesialist')
        })
      })

    if (search) {
      query.where((builder) => {
        builder.whereILike('name', `%${search}%`).orWhereILike('nik', `%${search}%`)
      })
    }

    const pasiens = await query.paginate(page, limit)
    const obats = await Obat.all()
    const dokters = await Dokter.query().where('status', true).preload('spesialist')
    const allPasiens = await Pasien.all()

    return view.render('kunjungan/data-kunjungan', {
      pasiens: pasiens.all(),
      allPasiens,
      meta: pasiens.getMeta(),
      dokters,
      obats,
      search,
      formatDate: (date: string | Date) => {
        return DateTime.fromJSDate(new Date(date)).toFormat('dd MMMM yyyy')
      },
    })
  }

  async store({ request, response, params }: HttpContext) {
    try {
      const pasienUuid = params.uuid
      const temaKunjungan = request.input('temaKunjungan', 'Tanpa Tema')
      const keterangan = request.input('keterangan', 'Tidak ada keterangan')
      const tanggalKunjungan = request.input(
        'tanggalKunjungan',
        new Date().toISOString().split('T')[0]
      )
      const kunjunganBerikutnya = request.input(
        'kunjunganBerikutnya',
        new Date().toISOString().split('T')[0]
      )
      const obatList = request.input('obatList', [])

      const pasien = await Pasien.query().select('id').where('uuid', pasienUuid).firstOrFail()

      const dokterId = request.input('dokter')

      console.log(request.input('dokter'), request.input('obatList'))

      const kunjungan = await Kunjungan.create({
        uuid: uuidv4(),
        dokterId: dokterId, // Ganti dengan ID dokter yang sesuai
        pasienId: pasien.id,
        tema: temaKunjungan,
        keterangan,
        tanggalKunjungan,
        kunjunganBerikutnya,
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

      return response.json({
        success: true,
        message: 'Data kunjungan berhasil ditambahkan',
      })
    } catch (error) {
      console.error('Error menambahkan kunjungan:', error)
      return response
        .status(500)
        .json({ success: false, message: 'Error menambahkan kunjungan', error: error.message })
    }
  }

  async show({ view, params }: HttpContext) {
    try {
      const { uuid } = params

      const kunjungan = await Kunjungan.query()
        .where('uuid', uuid)
        .preload('pasien')
        .preload('dokter', (dokter) => {
          dokter.preload('spesialist')
        }).preload('obatPasiens', (query) => {
          query.preload('obat')
        })
        .firstOrFail()

      const dokters = await Dokter.query().where('status', true).preload('spesialist')

      const allKunjunganPasien = await Kunjungan.query()
        .where('pasienId', kunjungan.pasienId)
        .orderBy('tanggalKunjungan', 'desc')
        .preload('obatPasiens', (query) => {
          query.preload('obat')
        })

      let obats = await Obat.all()
      const existingObatIds = kunjungan.obatPasiens.filter((op) => op.obat).map((op) => op.obat.id)
      obats = obats.filter((obat) => !existingObatIds.includes(obat.id))

      return view.render('kunjungan/detail_kunjungan/index', {
        kunjungan,
        allKunjunganPasien,
        dokters,
        obats,
        currentKunjunganId: kunjungan.uuid,
        formatDate: (date: string | Date) => {
          return DateTime.fromJSDate(new Date(date)).toFormat('dd MMMM yyyy')
        },
      })
    } catch (error) {
      console.error('Error menampilkan detail kunjungan:', error)
      return view.render('errors/not-found')
    }
  }

  async search({ request, response }: HttpContext) {
    const search = request.input('search', '')

    if (!search) {
      return response.redirect().toPath('/kunjungan')
    }

    const query = Pasien.query()
      .orderBy('createdAt', 'desc')
      .preload('kunjungans', (kunjunganQuery) => {
        kunjunganQuery.orderBy('tanggalKunjungan', 'desc').preload('obatPasiens', (obatQuery) => {
          obatQuery.preload('obat')
        })
      })

    if (search) {
      query.where((builder) => {
        builder.whereILike('name', `%${search}%`).orWhereILike('nik', `%${search}%`)
      })
    }

    const pasiens = await query.exec()
    const obats = await Obat.all()
    const dokters = await Dokter.query().where('status', true).preload('spesialist')
    const allPasiens = await Pasien.all()

    return response.json({
      pasiens,
      allPasiens,
      obats,
      dokters,
      search,
      success: true,
    })
  }

  async update({ request, response, params }: HttpContext) {
    try {
      const { uuid } = params
      const tema = request.input('tema')
      const keterangan = request.input('keterangan')
      const tanggalKunjungan = request.input('tanggalKunjungan')
      const kunjunganBerikutnya = request.input('kunjunganBerikutnya')
      const kunjungan = await Kunjungan.findByOrFail('uuid', uuid)
      const dokterId = request.input('dokter')

      kunjungan.tema = tema
      kunjungan.keterangan = keterangan
      kunjungan.tanggalKunjungan = tanggalKunjungan as any
      kunjungan.kunjunganBerikutnya = kunjunganBerikutnya as any
      kunjungan.dokterId = dokterId

      await kunjungan.save()

      // return response.redirect().toPath(`/kunjungan/${uuid}`)
      return response.json({
        success: true,
        message: 'Data kunjungan berhasil diperbarui',
        redirectUrl: `/kunjungan/${uuid}`
      })
    } catch (error) {
      console.error('Error updating kunjungan:', error)
      return response
        .status(500)
        .json({ success: false, message: 'Error updating kunjungan', error: error.message })
    }
  }

  async destroy({ params, response }: HttpContext) {
    try {
      const { uuid } = params
      const kunjungan = await Kunjungan.findByOrFail('uuid', uuid)
      const pasien = await Pasien.findOrFail(kunjungan.pasienId)

      await kunjungan.delete()

      // return response.redirect().toPath(`/pasien/${pasien.uuid}`)
      return response.json({
        success: true,
        message: 'Data kunjungan berhasil dihapus',
        redirectUrl: `/pasien/${pasien.uuid}`
      })
    } catch (error) {
      console.error('Error deleting kunjungan:', error)
      return response
        .status(500)
        .json({ success: false, message: 'Error deleting kunjungan', error: error.message })
    }
  }
}
