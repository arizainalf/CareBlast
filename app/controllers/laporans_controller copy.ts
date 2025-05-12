import { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Pasien from '#models/pasien'
import Obat from '#models/obat'
import JenisPenyakit from '#models/jenis_penyakit'
import generatePdf from '#services/generate_pdf'
import Kunjungan from '#models/kunjungan'
import Message from '#models/message'

const COLORS = ['#886CC0', '#FFCF6D', '#FFA7D7', '#6CBCB7', '#FF7778', '#5FAAE3', '#50C45E', '#DFA73A']

export default class LaporanController {
  async index({ request, response, view }: HttpContext) {
    const qs = request.qs()
    const aksi = qs.aksi || 'filter'

    const rawBulanTahun = qs.bulan
    const rawTahun = Number(qs.tahun)

    let bulan: number | null = null
    let tahun: number | null = null

    if (rawBulanTahun) {
      const [tahunInput, bulanInput] = rawBulanTahun.split('-').map(Number)
      if (bulanInput >= 1 && bulanInput <= 12) bulan = bulanInput
      if (tahunInput >= 2000 && tahunInput <= DateTime.now().year) tahun = tahunInput
    }

    if (rawTahun >= 2000 && rawTahun <= DateTime.now().year) tahun = rawTahun

    const filterBulan = bulan !== null && tahun !== null
    const filterTahun = !filterBulan && tahun !== null
    const bulanIni = filterBulan ? DateTime.fromObject({ year: tahun!, month: bulan! }) : null
    const bulanSebelumnya = filterBulan ? bulanIni!.minus({ months: 1 }) : null
    const tahunSebelumnya = tahun ? tahun - 1 : null

    let status: 'semua' | 'tahunan' | 'bulanan' = 'semua'
    if (filterBulan) {
      status = 'bulanan'
    } else if (filterTahun) {
      status = 'tahunan'
    }

    const pasienSekarangQuery = Pasien.query()
    const pasienSebelumnyaQuery = Pasien.query()
    const kunjunganSekarangQuery = Kunjungan.query()
    const kunjunganSebelumnyaQuery = Kunjungan.query()
    const pesanSekarangQuery = Message.query().where('from_me', true).where('is_hasil_lab', false)
    const pesanSebelumnyaQuery = Message.query().where('from_me', true).where('is_hasil_lab', false)

    if (filterBulan && bulanIni && bulanSebelumnya) {
      pasienSekarangQuery
        .whereRaw('EXTRACT(MONTH FROM created_at) = ?', [bulanIni.month])
        .whereRaw('EXTRACT(YEAR FROM created_at) = ?', [bulanIni.year])

      pasienSebelumnyaQuery
        .whereRaw('EXTRACT(MONTH FROM created_at) = ?', [bulanSebelumnya.month])
        .whereRaw('EXTRACT(YEAR FROM created_at) = ?', [bulanSebelumnya.year])

      kunjunganSekarangQuery
        .whereRaw('EXTRACT(MONTH FROM created_at) = ?', [bulanIni.month])
        .whereRaw('EXTRACT(YEAR FROM created_at) = ?', [bulanIni.year])

      kunjunganSebelumnyaQuery
        .whereRaw('EXTRACT(MONTH FROM created_at) = ?', [bulanSebelumnya.month])
        .whereRaw('EXTRACT(YEAR FROM created_at) = ?', [bulanSebelumnya.year])

      pesanSekarangQuery
        .whereRaw('EXTRACT(MONTH FROM created_at) = ?', [bulanIni.month])
        .whereRaw('EXTRACT(YEAR FROM created_at) = ?', [bulanIni.year])

      pesanSebelumnyaQuery
        .whereRaw('EXTRACT(MONTH FROM created_at) = ?', [bulanSebelumnya.month])
        .whereRaw('EXTRACT(YEAR FROM created_at) = ?', [bulanSebelumnya.year])
    } else if (filterTahun) {
      pasienSekarangQuery.whereRaw('EXTRACT(YEAR FROM created_at) = ?', [tahun!])
      pasienSebelumnyaQuery.whereRaw('EXTRACT(YEAR FROM created_at) = ?', [tahunSebelumnya!])
      kunjunganSekarangQuery.whereRaw('EXTRACT(YEAR FROM created_at) = ?', [tahun!])
      kunjunganSebelumnyaQuery.whereRaw('EXTRACT(YEAR FROM created_at) = ?', [tahunSebelumnya!])
      pesanSekarangQuery.whereRaw('EXTRACT(YEAR FROM created_at) = ?', [tahun!])
      pesanSebelumnyaQuery.whereRaw('EXTRACT(YEAR FROM created_at) = ?', [tahunSebelumnya!])
    }

    const [
      totalPasienSekarang,
      totalPasienSebelumnya,
      totalPasien,
      totalObat,
      totalKunjunganSekarang,
      totalKunjunganSebelumnya,
      totalPesanTerkirimSekarang,
      totalPesanTerkirimSebelumnya,
    ] = await Promise.all([
      pasienSekarangQuery.clone().count('* as total') || [{ $extras: { total: 0 } }],
      pasienSebelumnyaQuery.clone().count('* as total') || [{ $extras: { total: 0 } }],
      Pasien.query().count('* as total'),
      Obat.query().count('* as total'),
      kunjunganSekarangQuery.count('* as total') || [{ $extras: { total: 0 } }],
      kunjunganSebelumnyaQuery.count('* as total') || [{ $extras: { total: 0 } }],
      pesanSekarangQuery.count('* as total') || [{ $extras: { total: 0 } }],
      pesanSebelumnyaQuery.count('* as total') || [{ $extras: { total: 0 } }],
    ])

    const jumlahPasienSekarang = Number(totalPasienSekarang[0].$extras.total)
    const jumlahPasienSebelumnya = Number(totalPasienSebelumnya[0].$extras.total)
    const pertumbuhanPasien = jumlahPasienSebelumnya > 0
      ? ((jumlahPasienSekarang - jumlahPasienSebelumnya) / jumlahPasienSebelumnya) * 100
      : jumlahPasienSekarang > 0 ? 100 : 0

    const jumlahKunjunganSekarang = Number(totalKunjunganSekarang[0].$extras.total)
    const jumlahKunjunganSebelumnya = Number(totalKunjunganSebelumnya[0].$extras.total)
    const pertumbuhanKunjungan = jumlahKunjunganSebelumnya > 0
      ? ((jumlahKunjunganSekarang - jumlahKunjunganSebelumnya) / jumlahKunjunganSebelumnya) * 100
      : jumlahKunjunganSekarang > 0 ? 100 : 0

    const jumlahPesanSekarang = Number(totalPesanTerkirimSekarang[0].$extras.total)
    const jumlahPesanSebelumnya = Number(totalPesanTerkirimSebelumnya[0].$extras.total)
    const pertumbuhanPesan = jumlahPesanSebelumnya > 0
      ? ((jumlahPesanSekarang - jumlahPesanSebelumnya) / jumlahPesanSebelumnya) * 100
      : jumlahPesanSekarang > 0 ? 100 : 0


    const jenisPenyakitData = await JenisPenyakit.query()
      .select('id', 'nama')
      .withCount('pasiens', (query) => {
        query.as('pasien_count')
      })

    const jenisPenyakitChartData = jenisPenyakitData.map((jp, index) => ({
      id: jp.id,
      nama: jp.nama,
      pasien_count: Number(jp.$extras.pasien_count),
      color: COLORS[index % COLORS.length],
    }))

    const penyakitTerbanyak = jenisPenyakitChartData.reduce(
      (max, p) => (p.pasien_count > max.pasien_count ? p : max),
      { pasien_count: 0 }
    )

    const monthlyData = await this.getMonthlyPenyakitTrend(jenisPenyakitChartData)

    if (aksi === 'download') {
      const html = await view.render('pdf/laporan', {
        status,
        DateTime,
        totalPasienSekarang: Number(totalPasienSekarang[0].$extras.total),
        pasienBaruCount: jumlahPasienSekarang,
        jenisPenyakitData: jenisPenyakitChartData,
        bulanDipilih: bulan,
        tahunDipilih: tahun,
      })

      const pdfBuffer = await generatePdf(html)
      response.header('Content-Type', 'application/pdf')
      response.header('Content-Disposition', `attachment; filename="laporan-${bulan || 'semua'}-${tahun || 'semua'}.pdf"`)
      return response.send(pdfBuffer)
    }

    return view.render('laporan/index', {
      status,
      DateTime,
      totalPasienSekarang: Number(totalPasienSekarang[0].$extras.total),
      totalPasienSebelumnya: Number(totalPasienSekarang[0].$extras.total),
      pasienBaruCount: jumlahPasienSekarang,
      pertumbuhanPasien: pertumbuhanPasien.toFixed(1),
      pertumbuhanKunjungan: pertumbuhanKunjungan.toFixed(1),
      pertumbuhanPesan: pertumbuhanPesan.toFixed(1),
      totalPasien: Number(totalPasien[0].$extras.total),
      totalObat: Number(totalObat[0].$extras.total),
      jenisPenyakitData: jenisPenyakitChartData,
      penyakitTerbanyak,
      monthlyData,
      colors: COLORS,
      bulanDipilih: bulan,
      tahunDipilih: tahun,
    })
  }

  private async getMonthlyPenyakitTrend(jenisPenyakitList: any[]) {
    const result = []

    for (let i = 5; i >= 0; i--) {
      const monthDate = DateTime.now().minus({ months: i })
      const firstDay = monthDate.startOf('month').toSQL()
      const lastDay = monthDate.endOf('month').toSQL()

      const groupCounts = await Pasien.query()
        .select('jenisPenyakitId')
        .whereBetween('created_at', [firstDay, lastDay])
        .groupBy('jenisPenyakitId')
        .count('* as total')

      const countMap = new Map(groupCounts.map((g) => [g.jenisPenyakitId, Number(g.$extras.total)]))

      const monthlyCounts = jenisPenyakitList.map((jp) => ({
        penyakit_id: jp.id,
        penyakit_nama: jp.nama,
        count: countMap.get(jp.id) || 0,
      }))

      result.push({
        month: monthDate.toFormat('MMM'),
        data: monthlyCounts,
      })
    }

    return result
  }
}
