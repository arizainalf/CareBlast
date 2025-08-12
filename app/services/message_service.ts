import Message from '#models/message'
import { DateTime } from 'luxon'
import { saveFile } from '#services/json_service'
import Contact from '#models/contact'

const MESSAGES_FILE = './messages.json'

export async function saveMessages(message: any, isNotif: boolean = false) {
  const { key, messageTimestamp, pushName, message: msgContent } = message
  let contactId: string | undefined = undefined

  if (key.remoteJid === 'status@broadcast') {
    return
  }
  console.log(messageTimestamp)

  const contact = await Contact.query().where('wa_id', key.remoteJid).first()

  contactId = contact?.id

  const text = msgContent?.conversation
    || msgContent?.extendedTextMessage?.text
    || msgContent?.videoMessage?.caption
    || msgContent?.documentMessage?.caption
    || ''

  const messageType = msgContent ? Object.keys(msgContent)[0] : 'unknown'

  let data = {
    key, contactId, pushName: key.fromMe ? 'Saya (Owner)' : (pushName || 'Unknown'),
    messageId: key.id ?? '', messageType, content: msgContent, timestamp: messageTimestamp,
    text, isHasilLab: false
  }

  let saveMessage;

  const existingMessage = await Message.findBy('message_id', key.id)

  if (!existingMessage) {

    console.log(contact?.waId);
    try {
      saveMessage = await Message.create({
        contactId: contactId ?? null,
        fromMe: key.fromMe,
        messageId: key.id ?? '',
        noHp: contact?.waId ?? null,
        messageType, content: text,
        isNotif,
        timestamp: DateTime.fromSeconds(Number(messageTimestamp)),
      })
      return
    } catch (error) {
      console.error('Message service: Error saving message:', error)
      return 'error'
    }
  } else {
    saveMessage = existingMessage
  }

  await saveFile(MESSAGES_FILE, data, 'messages')
  return saveMessage
}
