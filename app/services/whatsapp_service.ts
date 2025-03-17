import fs from 'node:fs'
import {
  makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  Browsers,
  WAMessage,
} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import qrImage from 'qr-image'
import NumberHelper from '#services/number_service'
import path from 'path'
import { fileURLToPath } from 'url'
import Message from '#models/message'
import { DateTime } from 'luxon'

let socket: any

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load pesan dari JSON
function loadMessages(): any[] {
  const filePath = './messages.json'
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([]))
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
}

// Simpan pesan ke JSON
async function saveMessages(message: WAMessage) {
  const messages = loadMessages()

  const { key, messageTimestamp, pushName, message: msgContent } = message
  let from = key.remoteJid
  let groupName = null
  let groupJid = null

  if (from?.endsWith('@g.us')) {
    from = key.participant
    groupJid = key.remoteJid
    const groupMetadata = await socket.groupMetadata(groupJid)
    groupName = groupMetadata.subject || 'Unknown Group'
  }

  const text = msgContent?.conversation
    || msgContent?.extendedTextMessage?.text
    || msgContent?.videoMessage?.caption
    || msgContent?.documentMessage?.caption
    || null

  let data = {
    from: from,
    pushName: key.fromMe ? 'Saya (Owner)' : (pushName ? pushName : 'Unknown'),
    messageId: key.id ?? '',
    messageType: Object.keys(msgContent || {})[0],
    content: msgContent,
    timestamp: messageTimestamp,
    text: text,
    groupJid: groupJid ?? undefined,
    groupName: groupName ?? undefined
  }

  await Message.create({
    from: from ?? '',
    messageId: key.id ?? '',
    messageType: Object.keys(msgContent || {})[0],
    content: text,
    timestamp: messageTimestamp ? DateTime.fromMillis(Number(messageTimestamp)) : DateTime.now(),
    groupJid: groupJid ?? undefined,
    groupName: groupName ?? undefined
  })

  messages.push(data)
  fs.writeFileSync('./messages.json', JSON.stringify(messages, null, 2))
}

// ✅ Fungsi untuk mendapatkan semua chat berdasarkan nomor WA
export async function getAllMessagesByNumber(number: string) {

  const messages = loadMessages()

  const result = messages.filter(msg => msg.from.includes(number))

  return result
}

function loadContacts(): any[] {
  const filePath = './contacts.json'
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([]))
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
}

function saveContact(jid: string, name: string | null) {
  const contacts = loadContacts()
  const number = jid.split('@')[0]

  // Cek apakah nomor sudah tersimpan
  const existingContact = contacts.find((contact) => contact.number === number)

  if (!existingContact) {
    const newContact = {
      number: number,
      username: name || 'Unknown'
    }
    contacts.push(newContact)
    fs.writeFileSync('./contacts.json', JSON.stringify(contacts, null, 2))
  }
}

export async function contacts() {
  try {
    const contact = loadContacts()
    return contact
  } catch (error) {
    console.log('error', error)
    return error
  }
}

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

    socket.ev.on('messages.upsert', async (message: { messages: any[] }) => {
      const m = message.messages[0]
      const senderJid = m.key.remoteJid!
      const username = m.pushName || 'Unknown'

      // Simpan nomor pengirim + nama user
      saveContact(senderJid, username)
      saveMessages(m)
    })

    // Event untuk menangkap pesan yang kita kirim
    socket.ev.on('messages.update', async (message: any[]) => {
      const m = message[0]
      const receiverJid = m.key.remoteJid!

      const username = 'Saya (Owner)' // Nama untuk nomor kita sendiri
      saveContact(receiverJid, username)
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

export async function isRegisteredWhatsapp(number: string): Promise<boolean> {
  const NumberFormatted = NumberHelper(number)
  const jid = `${NumberFormatted}@s.whatsapp.net`

  if (!socket) {
    throw new Error('Socket not connected')
  }

  const result = await socket.onWhatsApp(jid)
  return result?.length > 0
}

export async function sendFile(jid: string, file: any, caption: string) {
  const NumberFormatted = NumberHelper(jid)
  const no = `${NumberFormatted}@s.whatsapp.net`

  if (!socket) {
    throw new Error('Socket not connected')
  }

  const isRegistered = await isRegisteredWhatsapp(jid)
  if (!isRegistered) {
    throw new Error('Nomor tidak terdaftar di WhatsApp')
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

  // // **Ambil hanya bagian 'uploads/nama-file.ekstensi'**
  // const relativePath = path.relative(path.join(__dirname, '../../'), uploadPath).replace(/\\/g, '/')

  const fileBuffer = fs.readFileSync(uploadPath)

  try {
    const sentMsg = await socket.sendMessage(no, {
      document: fileBuffer,
      fileName: file.clientName,
      mimetype: file.headers['content-type'],
      caption: caption,
    })

    return sentMsg
  } catch (error) {
    console.log('Error di service:', error)
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

