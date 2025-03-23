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
import Contact from '#models/contact'
import Group from '#models/group'
import HasilLab from '#models/hasil_lab'
import { saveFile } from '#services/json_service'

let socket: any
let sendingFile = false;
let sentFileMessages = new Set<string>();

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
// Simpan pesan ke JSON dan database
async function saveMessages(message: WAMessage) {

  // const messages = loadMessages()
  const myNumber = await socket.user?.id

  const { key, messageTimestamp, pushName, message: msgContent } = message
  let from = key.fromMe ? myNumber : key.remoteJid;
  let to = key.fromMe ? key.remoteJid : myNumber
  let groupId


  if (sentFileMessages && message.key.id && sentFileMessages.has(message.key.id)) {
    console.log('Skipping saveMessages for file message:', message.key.id);
    return;
  }

  if (from?.endsWith('@g.us') || to?.endsWith('@g.us')) {
    const groupJid = key.remoteJid || ''
    const groupMetadata = await socket.groupMetadata(groupJid)
    groupId = await saveGroup(groupJid, groupMetadata)
  
    if (from?.endsWith('@g.us')) {
      to = key.participant || 'Unknown'
      from = groupId
    } else if (to?.endsWith('@g.us')) {
      from = key.participant || 'Unknown'
      to = groupId
    }
  }
  
  // Pastikan kontak tersimpan jika bukan grup
  if (!from?.endsWith('@g.us') && !to?.endsWith('@g.us')) {
    await saveContact(from, pushName || 'Unknown')
    await saveContact(to, pushName || 'Unknown')
  }

  const text = msgContent?.conversation
    || msgContent?.extendedTextMessage?.text
    || msgContent?.videoMessage?.caption
    || msgContent?.documentMessage?.caption
    || ''

  const messageType = msgContent ? Object.keys(msgContent)[0] : 'unknown'

  let data = {
    from: from,
    to: to,
    pushName: key.fromMe ? 'Saya (Owner)' : (pushName ? pushName : 'Unknown'),
    messageId: key.id ?? '',
    messageType: messageType,
    content: msgContent,
    timestamp: messageTimestamp,
    text: text,
    groupId: groupId,
    isHasilLab: false,
  }

  // Check if message already exists in database
  const existingMessage = await Message.findBy('message_id', key.id)

  if (!existingMessage) {
    try {

      await Message.create({
        from: from,
        to: to,
        messageId: key.id ?? '',
        messageType: messageType,
        content: text,
        timestamp: messageTimestamp ? DateTime.fromMillis(Number(messageTimestamp)) : DateTime.now(),
      })
      console.log(`Message saved: ${key.id}`)
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        console.log(`Duplicate message not saved: ${key.id}`)
      } else {
        console.error('Error saving message:', error)
      }
    }
  } else {
    console.log(`Message already exists: ${key.id}`)
  }

  await saveFile('./messages.json', data, 'messages')
}

// Fungsi untuk mendapatkan semua chat berdasarkan nomor WA
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

export async function saveGroup(jid: string, metadata: any) {
  const groupData = {
    groupJid: metadata.id,
    groupName: metadata.subject,
    ownerJid: metadata.owner || '',
    participants: JSON.stringify(metadata.participants || ''),
    profilePicture: await getProfilePicture(jid) || null,
    subjectUpdatedBy: metadata.subjectOwner || '',
    subjectUpdatedAt: metadata.subjectTime ? DateTime.fromMillis(Number(metadata.subjectTime)) : DateTime.now(),
  }

  const existingGroup = await Group.findBy('group_jid', metadata.id)

  if (!existingGroup) {
    const group = await Group.create(groupData)
    console.log(metadata.subjectTime)
    console.log(`[+] Grup Baru Disimpan: ${metadata.subject}`)
    return group?.id
  } else if (existingGroup) {
    // Update group data if it already exists
    console.log(`[!] Grup Sudah Ada: ${metadata.subject}`)
    return existingGroup?.id
  }
}

async function saveContact(jid: string, name: string | null) {
  const number = jid.split('@')[0]

  // Cek apakah nomor sudah tersimpan di database
  const existingContact = await Contact.findBy('wa_id', jid)

  if (existingContact) {
    return existingContact?.id
  } else if (!existingContact) {
    const isRegistered = await isRegisteredWhatsapp(number)
    let pp = null

    if (isRegistered) {
      try {
        pp = await getProfilePicture(jid)
      } catch (error) {
        console.log('Gagal ambil foto profil:', error)
      }

      // Simpan kontak ke database
      const contact = await Contact.create({
        waId: jid,
        username: name || 'Unknown',
        name: name || '',
        profilePicture: pp || null
      })

      // Simpan juga ke file contacts.json untuk debugging only
      const newContact = {
        number: number,
        username: name || 'Unknown'
      }

      //savecontact ke json file untuk debugging
      saveFile('./contacts.json', newContact, 'contacts')

      return contact?.id
    } 
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
      await saveMessages(m)
    })

    if (!sentFileMessages) {
      sentFileMessages = new Set();
    }
    sendingFile = false;

    // Event untuk menangkap pesan yang kita kirim
    socket.ev.on('messages.update', async (message: any[]) => {
      const m = message[0];

      // Skip processing if this is a file message we just sent
      if (sentFileMessages && m.key.id && sentFileMessages.has(m.key.id)) {
        console.log('Skipping messages.update for file message:', m.key.id);
        // Remove from set after processing
        sentFileMessages.delete(m.key.id);
        return;
      }

      saveMessages(m)
      saveFile('./messages.json', m, 'messages')
    });

    socket.ev.on('messaging-history.set', async (
      chats: any[],
      contacts: any[],
      messagesa: any[],
      groups: any[],
      syncType: any
    ) => {

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

export async function isRegisteredWhatsapp(number: string): Promise<{ isRegistered: boolean, username: string | null }> {
  const NumberFormatted = NumberHelper(number)
  const jid = `${NumberFormatted}@s.whatsapp.net`

  if (!socket) {
    throw new Error('Socket not connected')
  }

  const result = await socket.onWhatsApp(jid)
  return {
    isRegistered: result?.length > 0,
    username: result?.[0]?.verifiedName || null
  }
}

export async function getProfilePicture(jid: string) {
  try {
    return await socket.profilePictureUrl(jid, 'image') || 'https://placehold.co/150/orange/white' // Foto default jika tidak ada
  } catch {
    return 'https://placehold.co/150/orange/white' // Foto default jika error
  }
}

export async function sendFile(jid: string, file: any, caption: string, name: string) {
  const NumberFormatted = NumberHelper(jid)
  const no = `${NumberFormatted}@s.whatsapp.net`

  if (!socket) {
    throw new Error('Socket not connected')
  }

  const isRegistered = await isRegisteredWhatsapp(jid)
  if (!isRegistered.isRegistered) {
    throw new Error('Nomor tidak terdaftar di WhatsApp')
  }
  if (!file) {
    throw new Error('No file uploaded')
  }

  // Check if contact exists and create if needed
  const existingContact = await Contact.findBy('wa_id', no)

  if (!existingContact) {
    const pp = await getProfilePicture(no)

    await Contact.create({
      waId: no,
      username: isRegistered.username ?? '',
      name,
      profilePicture: pp
    })
  }

  // Sanitize filename: replace spaces with underscores
  const sanitizedFileName = file.clientName.replace(/\s+/g, '_')

  // Path untuk menyimpan file
  const uploadDir = path.join(__dirname, '../../uploads') // Folder uploads/
  const uploadPath = path.join(uploadDir, sanitizedFileName) // Path lengkap file dengan nama yang telah disanitasi

  // Ensure upload directory exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
  }

  await file.move(uploadDir, {
    name: sanitizedFileName,
    overwrite: true // Optional: overwrite if file already exists
  })

  if (!fs.existsSync(uploadPath)) {
    throw new Error('File upload failed')
  }

  const fileBuffer = fs.readFileSync(uploadPath)

  try {
    // Set a flag to indicate this is a file being sent
    // We'll use this flag in the messages.update event handler
    sendingFile = true;

    const sentMsg = await socket.sendMessage(no, {
      document: fileBuffer,
      fileName: sanitizedFileName, // Use sanitized filename here as well
      mimetype: file.headers['content-type'],
      caption: caption,
    })

    // Store the message ID to be skipped in messages.update
    if (!sentFileMessages) {
      sentFileMessages = new Set();
    }
    sentFileMessages.add(sentMsg.key.id);

    // After sending, clear the flag
    sendingFile = false;

    // Store the result in HasilLab with sanitized filename
    await HasilLab.create({
      waId: no,
      name: name,
      messageId: sentMsg.key.id,
      fileName: sanitizedFileName, // Store sanitized filename
      filePath: uploadPath,
      caption: caption
    })

    // Manually create the message record since we're skipping messages.update
    await Message.create({
      from: 'Saya',
      to: no,
      messageId: sentMsg.key.id,
      messageType: 'documentMessage',
      content: caption,
      timestamp: DateTime.now(),
      isHasilLab: true,
      fileName: sanitizedFileName, // Store sanitized filename
      filePath: uploadPath,
    })

    return sentMsg;
  } catch (error) {
    // Clear the flag in case of error
    sendingFile = false;
    console.log('Error di service:', error)
    throw error;  // Re-throw to propagate error to the caller
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

