import type { HttpContext } from '@adonisjs/core/http'
import Pasien from '#models/pasien'
import JenisPenyakit from '#models/jenis_penyakit'
import Obat from '#models/obat'
import { DateTime } from 'luxon'

export default class DashboardController {
  async index({ view }: HttpContext) {
    // Mengambil data jumlah pasien baru bulan ini
    const currentMonth = DateTime.now().startOf('month')
    const pasienBaruCount = await Pasien.query()
      .whereRaw('EXTRACT(MONTH FROM created_at) = ?', [currentMonth.month])
      .whereRaw('EXTRACT(YEAR FROM created_at) = ?', [currentMonth.year])
      .count('* as total')

    // Mengambil data total pasien
    const totalPasien = await Pasien.query().count('* as total')

    // Mengambil data jumlah obat
    const totalObat = await Obat.query().count('* as total')

    // Define colors array
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

    // Mendapatkan data penyakit dan jumlah pasien per penyakit
    const jenisPenyakitData = await JenisPenyakit.query()
      .select('jenis_penyakits.id', 'jenis_penyakits.nama')
      .withCount('pasiens', (query) => {
        query.as('pasien_count')
      })

    // Mengambil data bulanan penyakit 6 bulan terakhir
    const monthlyData = []

    for (let i = 5; i >= 0; i--) {
      const monthDate = DateTime.now().minus({ months: i })
      const firstDay = monthDate.startOf('month')
      const lastDay = monthDate.endOf('month')

      const monthlyPenyakitCount = []

      for (const jenisPenyakit of jenisPenyakitData) {
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
      pasienBaruCount: Number(pasienBaruCount[0].$extras.total),
      totalPasien: Number(totalPasien[0].$extras.total),
      totalObat: Number(totalObat[0].$extras.total),
      jenisPenyakitData: jenisPenyakitData.map((jp, index) => ({
        id: jp.id,
        nama: jp.nama,
        pasien_count: Number(jp.$extras.pasien_count),
        color: colors[(jp.id - 1) % colors.length], // Add color directly to each item
      })),
      monthlyData: monthlyData,
      colors: colors, // Pass the colors array for use in charts
    })
  }
}
