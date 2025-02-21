import type { HttpContext } from '@adonisjs/core/http'
import Pasien from '#models/pasien'
import JenisPenyakit from '#models/jenis_penyakit'
import { DateTime } from 'luxon'
import { v4 as uuidv4 } from 'uuid'

export default class PasiensController {
  async index({ view, request }: HttpContext) {
    const page = request.input('page', 1)
    const limit = 12

    const [pasienData, jenisPenyakits] = await Promise.all([
      Pasien.query()
        .select(
          'id',
          'uuid',
          'name',
          'nik',
          'tempat',
          'tanggal_lahir',
          'jenis_kelamin',
          'jenisPenyakitId',
          'no_hp',
          'alamat',
          'golongan_darah'
        )
        .preload('jenisPenyakit', (query) => {
          query.select('id', 'nama', 'deskripsi')
        })
        .orderBy('created_at', 'desc')
        .paginate(page, limit),

      JenisPenyakit.query().select('id', 'nama').orderBy('nama', 'asc'),
    ])

    const helpers = {
      calculateAge: (birthDate: string | null): number => {
        if (!birthDate) return 0
        try {
          const birth = DateTime.fromISO(birthDate)
          const now = DateTime.now()
          return Math.floor(now.diff(birth, 'years').years)
        } catch (error) {
          console.error('Error calculating age:', error)
          return 0
        }
      },

      formatDate: (date: string | null): string => {
        if (!date) return ''
        try {
          const dateTime = DateTime.fromISO(date)
          return dateTime.toFormat('dd - MM - yyyy')
        } catch (error) {
          console.error('Error formatting date:', error)
          return ''
        }
      },
    }

    return view.render('pasien/data-pasien', {
      pasien: pasienData,
      jenisPenyakits,
      ...helpers,
    })
  }

  async store({ request, response }: HttpContext) {
    try {
      await Pasien.transaction(async (trx) => {
        const data = request.only([
          'nik',
          'jenisPenyakitId',
          'tempat',
          'tanggal_lahir',
          'no_hp',
          'alamat',
          'jenis_kelamin',
          'golongan_darah',
        ])

        const firstName = request.input('first_name', '')
        const lastName = request.input('last_name', '')
        data.name = `${firstName} ${lastName}`.trim()
        data.uuid = uuidv4()

        const jenisPenyakit = await JenisPenyakit.find(data.jenisPenyakitId)
        if (!jenisPenyakit) {
          throw new Error('Invalid jenis penyakit selected')
        }

        const validGolonganDarah = ['A+', 'B+', 'AB+', 'O+', 'A-', 'B-', 'AB-', 'O-']
        if (data.golongan_darah && !validGolonganDarah.includes(data.golongan_darah)) {
          throw new Error('Golongan darah tidak valid')
        }

        await Pasien.create(data, { client: trx })
      })

      return response
        .redirect()
        .toRoute('pasien.index', { success: 'Data pasien berhasil ditambahkan' })
    } catch (error) {
      console.error('Error storing patient:', error)
      return response.redirect().toRoute('pasien.index', {
        error: 'Gagal menambahkan data pasien. Silakan coba lagi.',
      })
    }
  }

  async search({ request, response }: HttpContext) {
    const searchQuery = request.input('q', '').trim()

    if (!searchQuery) {
      return response.json([])
    }

    const pasienData = await Pasien.query()
      .select(['id', 'name', 'nik', 'jenis_kelamin', 'tanggal_lahir', 'tempat', 'jenisPenyakitId'])
      .preload('jenisPenyakit', (query) => {
        query.select('id', 'nama')
      })
      .where((query) => {
        query
          .whereILike('name', `%${searchQuery}%`)
          .orWhereILike('nik', `%${searchQuery}%`)
          .orWhereILike('tempat', `%${searchQuery}%`)
      })
      .orderBy('created_at', 'desc')
      .limit(12)

    const transformedData = pasienData.map((pasien) => {
      const rawDate = pasien.tanggal_lahir
      let formattedDate = null

      if (rawDate) {
        const date = rawDate.toJSDate()
        formattedDate = date.toISOString().split('T')[0]
      }

      return {
        ...pasien.toJSON(),
        tanggal_lahir: formattedDate,
        jenis_kelamin: pasien.jenis_kelamin || '-',
      }
    })

    return response.json(transformedData)
  }
}
