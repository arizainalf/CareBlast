import { HttpContext } from '@adonisjs/core/http'
import JenisPenyakit from '#models/jenis_penyakit'
import Obat from '#models/obat'
import { inject } from '@adonisjs/core'
import type { ModelPaginatorContract } from '@adonisjs/lucid/types/model'


@inject()
export default class ObatPenyakitController {
  private readonly perPage = 5

  async index({ view, request }: HttpContext) {
    const [penyakits, obats] = await Promise.all([
      this.getPaginatedPenyakit(request.input('page', 1)),
      this.getPaginatedObat(request.input('obatPage', 1)),
    ])

    return view.render('obat/index', {
      title: 'Data Obat & Penyakit',
      penyakits,
      obats,
      activeTab: request.input('tab', 'dataObat'),
    })
  }

  async penyakit({ response }: HttpContext) {
    const data = await JenisPenyakit.all();
    // console.log(data)
    return response.json({
      success: true,
      message: 'data penyakit berhasil ditemukan.',
      data
    })
  }

  async storePenyakit({ request, response }: HttpContext) {

    try {
      await this.createPenyakit(request.only(['nama', 'deskripsi']))
      return response.json({
        success: true,
        message: 'Data penyakit berhasil ditambahkan',
        hash: '#dataPenyakit',
      })
    } catch (error) {
      console.error('Error creating penyakit:', error)
      return response.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat memproses data',
        error: error.message,
        hash: '#dataPenyakit',
      })
    }
  }

  async updatePenyakit({ request, response, params }: HttpContext) {
   
    try {
      await this.modifyPenyakit(params.uuid, request.only(['nama', 'deskripsi']))
      return response.json({
        success: true,
        message: 'Data penyakit berhasil diubah!',
        hash: '#dataPenyakit',
      })
    } catch (error) {
      console.error('Error update penyakit:', error)
      return response.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengedit data',
        error: error.message,
        hash: '#dataPenyakit',
      })
    }
  }

  async destroyPenyakit({ response, params }: HttpContext) {

    try {
      await this.deletePenyakit(params.uuid)
      return response.json({
        success: true,
        message: 'Data penyakit berhasil dihapus',
      })
    } catch (error) {
      console.log('error hapus penyakit ', error)
      return response.json({
        success: true,
        message: 'Data penyakit gagal dihapus',
      })
    }
  }

  async searchPenyakit({ request, response }: HttpContext) {
    const { search, page } = request.only(['search', 'page'])
    const penyakits = await this.getPaginatedPenyakit(page ?? 1, search)
    return response.json({ penyakits })
  }

  async storeObat({ request, response }: HttpContext) {

    try {
      await this.createObat(request.only(['nama', 'dosis']))
      return response.json({
        success: true,
        message: 'Data obat berhasil ditambahkan',
        // redirectUrl: '/obat-penyakit',
        hash: '#dataObat',
      })
    } catch (error) {
      console.error('Error creating obat:', error)
      return response.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat memproses data',
        error: error.message,
        hash: '#dataObat',
      })
    }

  }

  async updateObat({ request, response, params }: HttpContext) {

    try {
      await this.modifyObat(params.uuid, request.only(['nama', 'dosis']))
      return response.json({
        success: true,
        message: 'Data obat berhasil diubah!',
        hash: '#dataObat'
      })
    } catch (error) {
      console.error('Error update obat:', error)
      return response.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengedit data',
        error: error.message,
        hash: '#dataObat',
      })
    }
  }

  async destroyObat({ response, params }: HttpContext) {

    try {
      await this.deleteObat(params.uuid)
      return response.json({
        success: true,
        message: 'Data obat berhasil dihapus',
      })
    } catch (error) {
      console.log('error hapus obat ', error)
      return response.json({
        success: true,
        message: 'Data obat gagal dihapus'
      })

    }
  }

  async searchObat({ request, response }: HttpContext) {
    const { search, page } = request.only(['search', 'page'])
    const obats = await this.getPaginatedObat(page ?? 1, search)
    return response.json({ obats })
  }

  private async getPaginatedPenyakit(
    page: number,
    search?: string
  ): Promise<ModelPaginatorContract<JenisPenyakit>> {
    return JenisPenyakit.query()
      .if(search, (query) => query.where('nama', 'LIKE', `%${search}%`))
      .orderBy('created_at', 'desc')
      .paginate(page, this.perPage)
  }

  private async getPaginatedObat(
    page: number,
    search?: string
  ): Promise<ModelPaginatorContract<Obat>> {
    return Obat.query()
      .if(search, (query) => query.where('nama', 'LIKE', `%${search}%`))
      .orderBy('created_at', 'desc')
      .paginate(page, this.perPage)
  }

  private async createPenyakit(data: { nama: string; deskripsi: string }) {
    return JenisPenyakit.create(data)
  }

  private async modifyPenyakit(uuid: string, data: { nama: string; deskripsi: string }) {
    const penyakit = await JenisPenyakit.findByOrFail('uuid', uuid)
    return penyakit.merge(data).save()
  }

  private async deletePenyakit(uuid: string) {
    const penyakit = await JenisPenyakit.findByOrFail('uuid', uuid)
    return penyakit.delete()
  }

  private async createObat(data: { nama: string; dosis: number }) {
    return Obat.create(data)
  }

  private async modifyObat(uuid: string, data: { nama: string; dosis: number }) {
    const obat = await Obat.findByOrFail('uuid', uuid)
    return obat.merge(data).save()
  }

  private async deleteObat(uuid: string) {
    const obat = await Obat.findByOrFail('uuid', uuid)
    return obat.delete()
  }

}
