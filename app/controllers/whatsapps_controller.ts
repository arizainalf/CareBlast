// import type { HttpContext } from '@adonisjs/core/http'

import { getQrCode, logoutWhatsapp, getStatus, sendMsg, sendFile } from '#services/whatsapp_service'
import { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import Message from '#models/message'
import Contact from '#models/contact'

@inject()
export default class WhatsappsController {
  async showqr({ view }: HttpContext) {
    return view.render('dashboard/index')
  }

  async getQrCode({ response }: HttpContext) {
    console.log('requesting qr code from service')
    const qrCode = await getQrCode()
    return response.json({
      status: 'success',
      qrCode,
    })
  }

  async status({ response }: HttpContext) {
    const connected = await getStatus()
    return response.json({
      status: 'success',
      connected,
    })
  }

  async logout({ response }: HttpContext) {
    await logoutWhatsapp()
    return response.json({
      status: 'success',
    })
  }

  public async createMsg({ view }: HttpContext) {
    return view.render('messages/create')
  }

  public async getAllHasilLab({ response }: HttpContext) {
    const hasil = await Message.query().where('is_hasil_lab', true).preload('contact').preload('group').orderBy('created_at', 'desc')
    // console.log('cek', hasil)
    return response.json({
      status: 'success',
      hasil,
    })
  }

  public async getChat({ response, params }: HttpContext) {
    const message = await Message.query().where('contact_id', params.id).preload('contact').preload('group').orderBy('timestamp', 'asc')
    return response.json({
      status: 'success',
      message,
    })
  }
  
  async getNewMessages({ params, request, response }: HttpContext) {
    const chatId = params.id
    const lastId = request.input('last_id', 0) // Default 0 jika tidak ada last_id

    // Ambil pesan yang ID-nya lebih besar dari lastId
    const newMessages = await Message.query()
      .where('chat_id', chatId)
      .where('id', '>', lastId)
      .orderBy('id', 'asc')

    return response.json({ new_messages: newMessages })
  }

  public async getAllContact({ response }: HttpContext) {
    const contact = await Contact.all()
    return response.json({
      status: 'success',
      contact,
    })
  }

  public async getHasilLab({ response, params }: HttpContext) {
    // console.log(params)
    const message = await Message.query().where('id', params.uuid).preload('contact').preload('group')
    return response.json({
      status: 'success',
      message
    })
  }

  public async sendFile({ request, response, view }: HttpContext) {
    if (request.method() === 'GET') {
      return view.render('hasil-lab/index')
    }

    const jid = request.input('nomor')
    const file = request.file('file')
    const caption = request.input('caption', '')
    const name = request.input('nama')

    if (!jid || !file) {
      return response.badRequest({ message: 'Nomor WA dan file wajib diisi' })
    }

    try {
      const responseMsg = await sendFile(jid, file, caption, name)
      return response.json({ status: 'success', message: 'Hasil Lab Telah Terkirim!', data: responseMsg })
    } catch (error) {
      console.log('error di controller')
      console.log(error)
      return response.badRequest({ success: false, message: 'Error controller Gagal mengirim file ' + error })
    }
  }


  public async sendMsg({ request, response }: HttpContext) {
    const number = request.input('number')
    const message = request.input('message')
    const file = request.file('file')
    const nama = request.input('nama')

    console.log('Nomor:', number)
    console.log('Message:', message)
    console.log('File:', file)
    console.log('Nama:', nama)

    if (file && nama) {
      const responseMsg = await sendFile(number, file, message, nama)
      return response.json({
        status: 'success',
        message: 'Hasil Lab Telah Terkirim!',
        data: responseMsg
      })
    }
    const contact = await Contact.findBy('waId', number)
    const responseMsg = await sendMsg(number, message)
    return response.json({
      status: 'success',
      nama,
      contact,
      responseMsg
    })
  }
}
