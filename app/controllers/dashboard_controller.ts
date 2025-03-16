import type { HttpContext } from '@adonisjs/core/http'
import Pasien from '#models/pasien'
import JenisPenyakit from '#models/jenis_penyakit'
import Obat from '#models/obat'
import { DateTime } from 'luxon'

export default class DashboardController {
  async index({ view }: HttpContext) {
    const currentMonth = DateTime.now().startOf('month')
    const lastMonth = currentMonth.minus({ months: 1 })

    const pasienBaruBulanIni = await Pasien.query()
      .whereRaw('EXTRACT(MONTH FROM created_at) = ?', [currentMonth.month])
      .whereRaw('EXTRACT(YEAR FROM created_at) = ?', [currentMonth.year])
      .count('* as total')

    const pasienBaruBulanLalu = await Pasien.query()
      .whereRaw('EXTRACT(MONTH FROM created_at) = ?', [lastMonth.month])
      .whereRaw('EXTRACT(YEAR FROM created_at) = ?', [lastMonth.year])
      .count('* as total')

    const jumlahBulanIni = Number(pasienBaruBulanIni[0].$extras.total)
    const jumlahBulanLalu = Number(pasienBaruBulanLalu[0].$extras.total)

    let pertumbuhanPersen = 0
    if (jumlahBulanLalu > 0) {
      pertumbuhanPersen = ((jumlahBulanIni - jumlahBulanLalu) / jumlahBulanLalu) * 100
    } else if (jumlahBulanIni > 0) {
      pertumbuhanPersen = 100
    }

    const totalPasien = await Pasien.query().count('* as total')
    const totalObat = await Obat.query().count('* as total')
    const colors = [
      '#886CC0',
      '#FFCF6D',
      '#FFA7D7',
      '#6CBCB7',
      '#FF7778',
      '#5FAAE3',
      '#50C45E',
      '#DFA73A',
    ]

    let jenisPenyakitData = await JenisPenyakit.query()
      .select('jenis_penyakits.id', 'jenis_penyakits.nama')
      .withCount('pasiens', (query) => {
        query.as('pasien_count')
      })

    const jenisPenyakitArray = jenisPenyakitData.map((jp) => ({
      id: jp.id,
      nama: jp.nama,
      pasien_count: Number(jp.$extras.pasien_count),
      color: colors[(jp.id - 1) % colors.length],
    }))

    const penyakitTerbanyak = jenisPenyakitArray.reduce(
      (max, penyakit) => (penyakit.pasien_count > max.pasien_count ? penyakit : max),
      { pasien_count: 0 }
    )

    const monthlyData = []
    for (let i = 5; i >= 0; i--) {
      const monthDate = DateTime.now().minus({ months: i })
      const firstDay = monthDate.startOf('month')
      const lastDay = monthDate.endOf('month')

      const monthlyPenyakitCount = []
      for (const jenisPenyakit of jenisPenyakitArray) {
        const count = await Pasien.query()
          .where('jenisPenyakitId', jenisPenyakit.id)
          .whereRaw('created_at >= ?', [firstDay.toSQL()])
          .whereRaw('created_at <= ?', [lastDay.toSQL()])
          .count('* as total')

        monthlyPenyakitCount.push({
          penyakit_id: jenisPenyakit.id,
          penyakit_nama: jenisPenyakit.nama,
          count: Number(count[0].$extras.total),
        })
      }

      monthlyData.push({
        month: monthDate.toFormat('MMM'),
        data: monthlyPenyakitCount,
      })
    }

    return view.render('dashboard/index', {
      pasienBaruCount: jumlahBulanIni,
      pertumbuhanPasien: pertumbuhanPersen.toFixed(1),
      totalPasien: Number(totalPasien[0].$extras.total),
      totalObat: Number(totalObat[0].$extras.total),
      jenisPenyakitData: jenisPenyakitArray,
      penyakitTerbanyak,
      monthlyData: monthlyData,
      colors: colors,
    })
  }
}
