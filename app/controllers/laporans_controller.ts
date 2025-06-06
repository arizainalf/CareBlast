import { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Pasien from '#models/pasien'
import Obat from '#models/obat'
import JenisPenyakit from '#models/jenis_penyakit'
import generatePdf from '#services/generate_pdf'
import Kunjungan from '#models/kunjungan'
import Message from '#models/message'
import db from '@adonisjs/lucid/services/db'

const COLORS = ['#886CC0', '#FFCF6D', '#FFA7D7', '#6CBCB7', '#FF7778', '#5FAAE3', '#50C45E', '#DFA73A']

export default class LaporanController {
  async index({ request, response, view }: HttpContext) {
    const qs = request.qs()
    const aksi = qs.aksi || 'filter'

    const rawBulanTahun = qs.bulan
    const rawTahun = Number(qs.tahun)

    let pagePasien = 1
    let perPagePasien = 20
    let pageKunjungan = 1
    let perPageKunjungan = 20

    let bulan: number | null = null
    let tahun: number | null = null

    if (qs.pagePasien) {
      pagePasien = qs.pagePasien;
    }

    if (qs.pageKunjungan) {
      pageKunjungan = qs.pageKunjungan;
    }

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

    const jenisPenyakitQuery = JenisPenyakit.query()
    const pasienSekarangQuery = Pasien.query()
    const pasienSebelumnyaQuery = Pasien.query()
    const kunjunganSekarangQuery = Kunjungan.query()
    const kunjunganSebelumnyaQuery = Kunjungan.query()
    const pesanSekarangQuery = Message.query().where('from_me', true).where('is_hasil_lab', false).where('is_notif', true)
    const hasilLabSekarangQuery = Message.query().where('from_me', true).where('is_hasil_lab', true)
    const pesanSebelumnyaQuery = Message.query().where('from_me', true).where('is_hasil_lab', false).where('is_notif', true)
    const hasilLabSebelumnyaQuery = Message.query().where('from_me', true).where('is_hasil_lab', true)

    if (filterBulan && bulanIni && bulanSebelumnya) {
      jenisPenyakitQuery
        .whereRaw('EXTRACT(MONTH FROM created_at) = ?', [bulanIni.month])
        .whereRaw('EXTRACT(YEAR FROM created_at) = ?', [bulanIni.year])

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

      hasilLabSekarangQuery
        .whereRaw('EXTRACT(MONTH FROM created_at) = ?', [bulanIni.month])
        .whereRaw('EXTRACT(YEAR FROM created_at) = ?', [bulanIni.year])

      pesanSebelumnyaQuery
        .whereRaw('EXTRACT(MONTH FROM created_at) = ?', [bulanSebelumnya.month])
        .whereRaw('EXTRACT(YEAR FROM created_at) = ?', [bulanSebelumnya.year])

      hasilLabSebelumnyaQuery
        .whereRaw('EXTRACT(MONTH FROM created_at) = ?', [bulanSebelumnya.month])
        .whereRaw('EXTRACT(YEAR FROM created_at) = ?', [bulanSebelumnya.year])
    } else if (filterTahun) {
      jenisPenyakitQuery.whereRaw('EXTRACT(YEAR FROM created_at) = ?', [tahun!])
      pasienSekarangQuery.whereRaw('EXTRACT(YEAR FROM created_at) = ?', [tahun!])
      pasienSebelumnyaQuery.whereRaw('EXTRACT(YEAR FROM created_at) = ?', [tahunSebelumnya!])
      kunjunganSekarangQuery.whereRaw('EXTRACT(YEAR FROM created_at) = ?', [tahun!])
      kunjunganSebelumnyaQuery.whereRaw('EXTRACT(YEAR FROM created_at) = ?', [tahunSebelumnya!])
      pesanSekarangQuery.whereRaw('EXTRACT(YEAR FROM created_at) = ?', [tahun!])
      hasilLabSekarangQuery.whereRaw('EXTRACT(YEAR FROM created_at) = ?', [tahun!])
      pesanSebelumnyaQuery.whereRaw('EXTRACT(YEAR FROM created_at) = ?', [tahunSebelumnya!])
      hasilLabSebelumnyaQuery.whereRaw('EXTRACT(YEAR FROM created_at) = ?', [tahunSebelumnya!])
    }

    const [
      dataPasien,
      dataPasienPaginate,
      dataKunjungan,
      dataKunjunganPaginate,
      totalPasienSekarang,
      totalPasienSebelumnya,
      totalPasien,
      totalObat,
      totalKunjunganSekarang,
      totalKunjunganSebelumnya,
      totalPesanTerkirimSekarang,
      totalPesanTerkirimSebelumnya,
      totalHasilLabTerkirimSekarang,
      totalHasilLabTerkirimSebelumnya,
    ] = await Promise.all([
      pasienSekarangQuery.clone().preload('jenisPenyakit'),
      pasienSekarangQuery.clone().preload('jenisPenyakit').paginate(pagePasien, perPagePasien),
      kunjunganSekarangQuery.clone().preload('pasien').preload('dokter'),
      kunjunganSekarangQuery.clone().preload('pasien').preload('dokter').paginate(pageKunjungan, perPageKunjungan),
      pasienSekarangQuery.clone().count('* as total') || [{ $extras: { total: 0 } }],
      pasienSebelumnyaQuery.clone().count('* as total') || [{ $extras: { total: 0 } }],
      Pasien.query().count('* as total'),
      Obat.query().count('* as total'),
      kunjunganSekarangQuery.count('* as total') || [{ $extras: { total: 0 } }],
      kunjunganSebelumnyaQuery.count('* as total') || [{ $extras: { total: 0 } }],
      pesanSekarangQuery.count('* as total') || [{ $extras: { total: 0 } }],
      pesanSebelumnyaQuery.count('* as total') || [{ $extras: { total: 0 } }],
      hasilLabSekarangQuery.count('* as total') || [{ $extras: { total: 0 } }],
      hasilLabSebelumnyaQuery.count('* as total') || [{ $extras: { total: 0 } }],
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

    const jumlahHasilLabSekarang = Number(totalHasilLabTerkirimSekarang[0].$extras.total)
    const jumlahHasilLabSebelumnya = Number(totalHasilLabTerkirimSebelumnya[0].$extras.total)
    const pertumbuhanHasilLab = jumlahHasilLabSebelumnya > 0
      ? ((jumlahHasilLabSekarang - jumlahHasilLabSebelumnya) / jumlahHasilLabSebelumnya) * 100
      : jumlahHasilLabSekarang > 0 ? 100 : 0


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
        dataKunjungan,
        dataPasien,
        totalPasienSekarang: Number(totalPasienSekarang[0].$extras.total),
        totalKunjunganSekarang: Number(totalKunjunganSekarang[0].$extras.total),
        totalPesanTerkirimSekarang: Number(totalPesanTerkirimSekarang[0].$extras.total),
        totalHasilLabTerkirimSekarang: Number(totalHasilLabTerkirimSekarang[0].$extras.total),
        totalHasilLabTerkirimSebelumnya: Number(totalHasilLabTerkirimSebelumnya[0].$extras.total),
        pertumbuhanHasilLab: pertumbuhanHasilLab.toFixed(1),
        totalPasienSebelumnya: Number(totalPasienSekarang[0].$extras.total),
        pasienBaruCount: jumlahPasienSekarang,
        pertumbuhanPasien: pertumbuhanPasien.toFixed(1),
        pertumbuhanKunjungan: pertumbuhanKunjungan.toFixed(1),
        pertumbuhanPesan: pertumbuhanPesan.toFixed(1),
        totalPasien: Number(totalPasien[0].$extras.total),
        totalObat: Number(totalObat[0].$extras.total),
        bulanDipilih: bulan,
        tahunDipilih: tahun,
      })

      const sekarang = DateTime.now().toFormat('yyyy LLL dd')
      const pdfBuffer = await generatePdf(html)
      response.header('Content-Type', 'application/pdf')
      response.header('Content-Disposition', `attachment; filename="laporan-${bulan ? bulan + '-' + tahun! : (tahun ? tahun : 'semua')}-${sekarang}.pdf"`)
      return response.send(pdfBuffer)
    }

    const now = DateTime.now()
    const mode = status
    const month = bulan || now.month
    const year = tahun || now.year

    const chartPasien = await this.getCounts(Pasien, mode, year, month)
    const chartKunjungan = await this.getCounts(Kunjungan, mode, year, month)
    const chartPesan = await this.getCounts(
      Message,
      mode,
      year, month, { from_me: true, is_hasil_lab: false, is_notif: true }
    )
    const chartHasilLab = await this.getCounts(
      Message,
      mode,
      year, month, { from_me: true, is_hasil_lab: true }
    )

    return view.render('laporan/index', {
      chartData: {
        pasien: chartPasien,
        kunjungan: chartKunjungan,
        pesan: chartPesan,
        hasilLab: chartHasilLab,
      },
      status,
      DateTime,
      dataKunjunganPaginate,
      dataPasienPaginate,
      totalHasilLabTerkirimSekarang: Number(totalHasilLabTerkirimSekarang[0].$extras.total),
      totalHasilLabTerkirimSebelumnya: Number(totalHasilLabTerkirimSebelumnya[0].$extras.total),
      pertumbuhanHasilLab: pertumbuhanHasilLab.toFixed(1),
      totalPasienSekarang: Number(totalPasienSekarang[0].$extras.total),
      totalKunjunganSekarang: Number(totalKunjunganSekarang[0].$extras.total),
      totalPesanTerkirimSekarang: Number(totalPesanTerkirimSekarang[0].$extras.total),
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

  async getCounts(
    model: any,
    mode: string = 'semua',
    tahun?: number,
    bulan?: number,
    extraWhere: Record<string, any> = {},
    field = 'created_at'
  ) {
    const now = DateTime.now()
    const tahunAktif = tahun ?? now.year
    const bulanAktif = bulan ?? now.month

    console.log(now)
    console.log(bulan, bulanAktif)
    console.log(tahun, tahunAktif)

    // Mulai query dari model
    let query = model.query()

    // Terapkan kondisi tambahan dari extraWhere
    for (const key in extraWhere) {
      query = query.where(key, extraWhere[key])
    }

    let labels: string[] = []
    let data: number[] = []

    if (mode === 'semua') {
      // Total berdasarkan tahun (semua tahun)

      const minYearResult = await query
        .clone()
        .select(db.raw('MIN(EXTRACT(YEAR FROM ??)) as min_year', [field]))
        .first()
      const maxYearResult = await query
        .clone()
        .select(db.raw('MAX(EXTRACT(YEAR FROM ??)) as max_year', [field]))
        .first()

      const minYear = minYearResult?.min_year ? parseInt(minYearResult.min_year) : tahunAktif
      const maxYear = maxYearResult?.max_year ? parseInt(maxYearResult.max_year) : tahunAktif

      // Pastikan maxYear tidak kurang dari tahunAktif
      const endYear = maxYear < tahunAktif ? tahunAktif : maxYear

      // Generate label tahun dinamis lengkap dari minYear sampai endYear
      labels = []
      data = []
      for (let y = minYear; y <= endYear; y++) {
        labels.push(y.toString())
        data.push(0)
      }

      const results = await query
        .clone()
        .select(db.raw('EXTRACT(YEAR FROM ??) as period, COUNT(*) as count', [field]))
        .groupByRaw('EXTRACT(YEAR FROM ??)', [field])
        .orderByRaw('EXTRACT(YEAR FROM ??)', [field])

      results.forEach((r: { $extras: { period: number; count: string } }) => {
        const year = r.$extras.period
        labels.push(year.toString())
        data.push(parseInt(r.$extras.count))
      })
    } else if (mode === 'tahunan') {
      // Total per bulan dalam tahunAktif
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
      labels = [...monthNames]
      data = Array(12).fill(0)

      const results = await query
        .clone()
        .select(db.raw('EXTRACT(MONTH FROM ??) as period, COUNT(*) as count', [field]))
        .whereRaw('EXTRACT(YEAR FROM ??) = ?', [field, tahunAktif])
        .groupByRaw('EXTRACT(MONTH FROM ??)', [field])
        .orderByRaw('EXTRACT(MONTH FROM ??)', [field])

      results.forEach((r: { $extras: { period: number; count: string } }) => {
        const month = r.$extras.period  // Ini adalah nomor bulan (1-12)
        const index = month - 1  // Convert ke index array (0-11)
        if (index >= 0 && index < 12) {
          data[index] = parseInt(r.$extras.count)
        }
      })
    } else if (mode === 'bulanan') {
      // Total per hari dalam bulanAktif dan tahunAktif
      const totalHari = DateTime.local(tahunAktif, bulanAktif).daysInMonth ?? 0
      labels = Array.from({ length: totalHari }, (_, i) => (i + 1).toString().padStart(2, '0'))
      data = Array(totalHari).fill(0)

      const results = await query
        .clone()
        .select(db.raw('EXTRACT(DAY FROM ??) as period, COUNT(*) as count', [field]))
        .whereRaw('EXTRACT(YEAR FROM ??) = ?', [field, tahunAktif])
        .whereRaw('EXTRACT(MONTH FROM ??) = ?', [field, bulanAktif])
        .groupByRaw('EXTRACT(DAY FROM ??)', [field])
        .orderByRaw('EXTRACT(DAY FROM ??)', [field])

      results.forEach((r: { $extras: { period: number; count: string } }) => {
        const day = r.$extras.period
        data[day - 1] = parseInt(r.$extras.count)
      })
    }
    console.log(labels)
    console.log(data)
    return { labels, data }
  }

}
