import { HttpContext } from '@adonisjs/core/http'
import Dokter from '#models/dokter'

export default class DoctorsController {
  public async index({ view }: HttpContext) {
    const allDokters = await Dokter.query().preload('spesialist').orderBy('nama', 'asc')

    return view.render('pengguna/dokter', {
      allDokters: allDokters.map((dokter) => ({
        ...dokter.toJSON(),
        jadwalHariArray: this.parseJadwalHari(dokter.jadwalHari),
        // Format hari sebagai string dipisah koma
        jadwalHariString: this.formatHariString(dokter.jadwalHari),
      })),
    })
  }

  private parseJadwalHari(jadwalHari: string | null): string[] {
    if (!jadwalHari) return []

    try {
      const parsed = typeof jadwalHari === 'string' ? JSON.parse(jadwalHari) : jadwalHari
      return Array.isArray(parsed) ? parsed : []
    } catch (e) {
      return jadwalHari.split(',').map((h) => h.trim())
    }
  }

  private formatHariString(jadwalHari: string | null): string {
    const hariArray = this.parseJadwalHari(jadwalHari)
    return hariArray.join(', ')
  }
}
