// import type { HttpContext } from '@adonisjs/core/http'

import { getQrCode, logoutWhatsapp, getStatus, sendMsg, sendFile, sendBulkMessage } from '#services/whatsapp_service'
import { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import Message from '#models/message'
import Contact from '#models/contact'
import Pasien from '#models/pasien'
import NumberHelper from '#services/number_service'

@inject()
export default class WhatsappsController {
  async showqr({ view }: HttpContext) {
    return view.render('dashboard/index')
  }

  async getQrCode({ response }: HttpContext) {
    console.log('requesting qr code from service')
    const qrCode = await getQrCode()
    return response.json({
      success: true,
      qrCode,
    })
  }

  async status({ response }: HttpContext) {
    const connected = await getStatus()
    return response.json({
      success: true,
      connected,
    })
  }

  async logout({ response }: HttpContext) {
    await logoutWhatsapp()
    return response.json({
      success: true,
    })
  }

  public async updateContact({ request, params, response }: HttpContext) {
    const contact = await Contact.findOrFail(params.id)
    const { nama, nomor } = request.only(['nama', 'nomor'])

    console.log(contact, nama, nomor)
    try {
      // Update name dulu
      contact.name = nama

      // Cek apakah nomor berubah
      const newWaId = `${nomor}@s.whatsapp.net`
      if (newWaId !== contact.waId) {
        const existing = await Contact.query()
          .where('wa_id', newWaId)
          .whereNot('id', contact.id)
          .first()

        if (existing) {
          return response.status(400).json({
            success: false,
            message: 'Nomor WA sudah digunakan oleh pengguna lain!',
          })
        }

        contact.waId = newWaId
      }

      await contact.save()

      return response.json({
        success: true,
        message: 'Pengguna berhasil diperbarui!',
        contact,
      })
    } catch (error) {
      console.error('Update Contact Error:', error)

      return response.status(500).json({
        success: false,
        message: 'Gagal memperbarui pengguna!',
        error: error.message,
      })
    }
  }

  public async createMsg({ view }: HttpContext) {
    return view.render('messages/create')
  }

  public async getAllHasilLab({ response }: HttpContext) {
    const hasil = await Message.query()
      .where('is_hasil_lab', true)
      .preload('contact')
      .preload('group')
      .orderBy('created_at', 'desc')
    return response.json({
      success: true,
      hasil,
    })
  }

  //   // AdonisJS Route Handler
  public async allHasilLab({ request, response }: HttpContext) {
    const q = request.input('q') || '';
    const page = Number(request.input('page', 1));
    const limit = 5;

    const hasilLabQuery = Message.query()
      .preload('contact')
      .where('is_hasil_lab', true)
      .if(q !== '', (query) => {
        query.whereHas('contact', (builder) => {
          builder.whereILike('name', `%${q}%`);
        });
      })
      .orderBy('timestamp', 'desc');

    const hasilLabPaginated = await hasilLabQuery.paginate(page, limit);

    return response.ok({
      success: true,
      hasil: hasilLabPaginated.toJSON().data,
      pagination: {
        total: hasilLabPaginated.total,
        per_page: hasilLabPaginated.perPage,
        current_page: hasilLabPaginated.currentPage,
        total_pages: hasilLabPaginated.lastPage,
      },
    });
  }

  public async getChat({ response, params }: HttpContext) {
    const message = await Message.query()
      .where('contact_id', params.id)
      .preload('contact')
      .preload('group')
      .orderBy('timestamp', 'asc')
    const contact = await Contact.findBy('id', params.id)
    return response.json({
      success: true,
      message,
      contact,
    })
  }

  public async getContact({ response, params }: HttpContext) {
    const contact = await Contact.findBy('id', params.id)
    return response.json({
      success: true,
      contact,
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
      success: true,
      contact,
    })
  }

  public async getHasilLab({ response, params }: HttpContext) {
    // console.log(params)
    const message = await Message.query()
      .where('id', params.uuid)
      .preload('contact')
      .preload('group')
    return response.json({
      success: true,
      message,
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
    const waId = NumberHelper(jid)

    // Validasi wajib isi
    if (!jid || !file || !name) {
      return response.badRequest({ message: 'Nomor WA, file, dan nama wajib diisi' })
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf']

    if (!allowedMimeTypes.includes(file.headers['content-type'])) {
      return response.badRequest({ message: 'Tipe file tidak diizinkan' })
    }

    // Simpan/update contact
    const existingContact = await Contact.query().where('waId', waId).first()

    if (existingContact) {
      if (existingContact.name !== name) {
        existingContact.merge({ name })
        await existingContact.save()
      }
    } else {
      await Contact.create({ waId, name })
    }

    try {
      const responseMsg = await sendFile(jid, file, caption, name)
      console.log('sendfile response:', responseMsg)

      return response.json({
        success: true,
        message: 'Hasil Lab Telah Terkirim!',
        data: responseMsg,
      })
    } catch (error) {
      console.error('error di controller:', error)

      return response.badRequest({
        success: false,
        message: 'Gagal mengirim file: ' + error.message,
      })
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
        data: responseMsg,
      })
    }
    const contact = await Contact.findBy('waId', number)
    const responseMsg = await sendMsg(number, message)
    return response.json({
      status: 'success',
      nama,
      contact,
      responseMsg,
    })
  }

  public async sendbulkMessages({ request, response }: HttpContext) {
    const penyakit = request.input('penyakit')
    const message = request.input('message')

    const contacts = await Pasien.query()
      .where('jenis_penyakit_id', penyakit)
      .select('no_hp')

    // Ambil hanya array nomor HP
    const numbers = contacts.map((c) => c.no_hp)

    await sendBulkMessage(numbers, message)

    console.log(numbers, message)

    return response.json({ success: true, message: 'Pesan massal sedang dikirim' })
  }

}
