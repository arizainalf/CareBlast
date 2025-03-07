import fs from 'node:fs'
import {
  makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  Browsers,
} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import qrImage from 'qr-image'
import NumberHelper from '#services/number_service'
import Message from '#models/message'
import path from 'path'
import { fileURLToPath } from 'url'

let socket: any

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export async function connectToWhatsApp() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState('whatsappAuth')
    socket = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      qrTimeout: 15000,
      browser: Browsers.windows('Desktop'),
      syncFullHistory: true,
    })

    socket.ev.on('creds.update', saveCreds)
    socket.ev.on('connection.update', (update: any) => {
      console.log('Connection update:', update)
      const { connection, lastDisconnect } = update
      if (connection === 'close') {
        const shouldReconnect =
          (lastDisconnect.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut
        console.log(
          'Connection closed due to ',
          lastDisconnect.error,
          ', reconnecting ',
          shouldReconnect
        )
        if (shouldReconnect) {
          connectToWhatsApp()
        }
      } else if (connection === 'open') {
        console.log('Opened connection')
      }
    })
  } catch (error) {
    console.error('Failed to connect to WhatsApp:', error)
    throw new Error('WhatsApp connection failed')
  }

  return socket
}

export async function getQrCode(): Promise<string> {
  return new Promise((resolve, reject) => {
    const cacheDir = './whatsappAuth'
    const sessionExists = fs.existsSync(cacheDir) && fs.readdirSync(cacheDir).length > 0

    if (sessionExists) {
      return resolve('You are already logged in')
    }

    if (!socket) {
      return reject('Socket not connected')
    }

    socket.ev.on('connection.update', (update: any) => {
      console.log('Connection update:', update)
      const { qr } = update
      if (qr) {
        console.log('QR Code updated')
        const imageBuffer = qrImage.imageSync(qr, { type: 'png' })
        const base64Image = imageBuffer.toString('base64')

        return resolve(base64Image)
      }
    })
  })
}

export async function getStatus() {
  socket.ev.on('connection.update', (update: any) => {
    console.log('Connection update:', update)
    const { connection } = update
    if (connection === 'open') {
      return 'Connected'
    } else if (connection === 'close') {
      return 'Closed'
    }
  })
}

export async function sendFile(jid: string, file: any, caption: string, name: string) {
  const NumberFormatted = NumberHelper(jid)
  const no = `${NumberFormatted}@s.whatsapp.net`

  if (!socket) {
    throw new Error('Socket not connected')
  }

  if (!file) {
    throw new Error('No file uploaded')
  }

  // **Path untuk menyimpan file**
  const uploadDir = path.join(__dirname, '../../uploads') // Folder uploads/
  const uploadPath = path.join(uploadDir, file.clientName) // Path lengkap file

  await file.move(uploadDir)

  if (!fs.existsSync(uploadPath)) {
    throw new Error('File upload failed')
  }

  // **Ambil hanya bagian 'uploads/nama-file.ekstensi'**
  const relativePath = path.relative(path.join(__dirname, '../../'), uploadPath).replace(/\\/g, '/')

  const fileBuffer = fs.readFileSync(uploadPath)

  try {
    const sentMsg = await socket.sendMessage(no, {
      document: fileBuffer,
      fileName: file.clientName,
      mimetype: file.headers['content-type'],
      caption: caption,
    })

    // **Simpan path relatif ke database**
    await saveMessage(name, caption, relativePath, jid)

    return sentMsg
  } catch (error) {
    console.log('Error di service:', error)
    return error
  }
}


async function saveMessage(name: string, message: string, filepath: string, no: string) {
  try {
    const msg = await Message.create({
      name,
      no,
      message,
      filepath
    })
    console.log('Pesan berhasil disimpan')
    return msg
  } catch (error) {
    console.error('Gagal menyimpan pesan:', error)
    return error
  }
}

export async function upsert() {
  socket.ev.on('messages.upsert', async ({ messages }: { messages: any[] }) => {
    for (const msg of messages) {
      if (!msg.key.fromMe) {
        const sender = msg.key.remoteJid
        const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text

        console.log(`Pesan dari ${sender}: ${text}`)

        // Simpan ke database jika perlu
        // await saveMessage(name, text)
      }
    }
  })
}


export async function sendMsg(number: string, message: string) {
  const NumberFormatted = NumberHelper(number)
  const jid = `${NumberFormatted}@s.whatsapp.net`

  if (!socket) {
    throw new Error('Socket not connected')
  }
  // send a simple text!
  const sentMsg = await socket.sendMessage(jid, { text: message })

  if (!sentMsg) {
    console.log('Failed to send message')
  }
  console.log('Sent message:', sentMsg)

  return sentMsg
}

export async function logoutWhatsapp() {
  try {
    const cacheDir = 'whatsappAuth'

    if (fs.existsSync(cacheDir)) {
      const files = fs.readdirSync(cacheDir)

      files.forEach((file) => {
        const filePath = `${cacheDir}/${file}`
        fs.unlinkSync(filePath) // Delete each file
      })

      console.log('Session files cleared')
    } else {
      console.log('Cache directory does not exist')
    }
    connectToWhatsApp()
    return true
  } catch (error) {
    console.log('Error during logout:', error)
    return false
  }
}
