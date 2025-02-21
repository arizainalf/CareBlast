import { HttpContext } from '@adonisjs/core/http'
import JenisPenyakit from '#models/jenis_penyakit'
import Obat from '#models/obat'
import { inject } from '@adonisjs/core'
import type { ModelPaginatorContract } from '@adonisjs/lucid/types/model'

interface FlashMessage {
  type: 'penyakit' | 'obat'
  message: string
  isError?: boolean
}

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

  async storePenyakit({ request, response, session }: HttpContext) {
    await this.handleDatabaseOperation(
      async () => {
        await this.createPenyakit(request.only(['nama', 'deskripsi']))
        this.setFlashMessage(session, {
          type: 'penyakit',
          message: 'Data penyakit berhasil ditambahkan',
        })
      },
      session,
      response,
      '#dataPenyakit'
    )
  }

  async updatePenyakit({ request, response, session, params }: HttpContext) {
    await this.handleDatabaseOperation(
      async () => {
        await this.modifyPenyakit(params.uuid, request.only(['nama', 'deskripsi']))
        this.setFlashMessage(session, {
          type: 'penyakit',
          message: 'Data penyakit berhasil diperbarui',
        })
      },
      session,
      response,
      '#dataPenyakit'
    )
  }

  async destroyPenyakit({ response, session, params }: HttpContext) {
    await this.handleDatabaseOperation(
      async () => {
        await this.deletePenyakit(params.uuid)
        this.setFlashMessage(session, {
          type: 'penyakit',
          message: 'Data penyakit berhasil dihapus',
        })
      },
      session,
      response,
      '#dataPenyakit'
    )
  }

  async searchPenyakit({ request, response }: HttpContext) {
    const { search, page } = request.only(['search', 'page'])
    const penyakits = await this.getPaginatedPenyakit(page ?? 1, search)
    return response.json({ penyakits })
  }

  async storeObat({ request, response, session }: HttpContext) {
    await this.handleDatabaseOperation(
      async () => {
        await this.createObat(request.only(['nama', 'dosis']))
        this.setFlashMessage(session, { type: 'obat', message: 'Data obat berhasil ditambahkan' })
      },
      session,
      response,
      '#dataObat'
    )
  }

  async updateObat({ request, response, session, params }: HttpContext) {
    await this.handleDatabaseOperation(
      async () => {
        await this.modifyObat(params.uuid, request.only(['nama', 'dosis']))
        this.setFlashMessage(session, { type: 'obat', message: 'Data obat berhasil diperbarui' })
      },
      session,
      response,
      '#dataObat'
    )
  }

  async destroyObat({ response, session, params }: HttpContext) {
    await this.handleDatabaseOperation(
      async () => {
        await this.deleteObat(params.uuid)
        this.setFlashMessage(session, { type: 'obat', message: 'Data obat berhasil dihapus' })
      },
      session,
      response,
      '#dataObat'
    )
  }

  async searchObat({ request, response }: HttpContext) {
    const { search, page } = request.only(['search', 'page'])
    const obats = await this.getPaginatedObat(page ?? 1, search)
    return response.json({ obats })
  }

  private async handleDatabaseOperation(
    operation: Function,
    session: any,
    response: any,
    hash: string = ''
  ) {
    try {
      await operation()
      return response.redirect().back() + hash
    } catch (error) {
      console.error(error)
      this.setFlashMessage(session, {
        type: hash.includes('Penyakit') ? 'penyakit' : 'obat',
        message: 'Terjadi kesalahan saat memproses data',
        isError: true,
      })
      return response.redirect().back() + hash
    }
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

  private async createObat(data: { nama: string; dosis: string }) {
    return Obat.create(data)
  }

  private async modifyObat(uuid: string, data: { nama: string; dosis: string }) {
    const obat = await Obat.findByOrFail('uuid', uuid)
    return obat.merge(data).save()
  }

  private async deleteObat(uuid: string) {
    const obat = await Obat.findByOrFail('uuid', uuid)
    return obat.delete()
  }

  private setFlashMessage(session: any, { type, message, isError = false }: FlashMessage) {
    session.flash(`${type}_${isError ? 'error' : 'success'}`, message)
  }
}
