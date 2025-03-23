import Message from '#models/message'
import { DateTime } from 'luxon'
import { saveFile } from '#services/json_service'
import { saveContact } from '#services/contact_service'
import { saveGroup } from '#services/group_service'
import { groupMetadata } from '#services/whatsapp_service'
import { MessageType } from '../enum/message_type.js'

const MESSAGES_FILE = './messages.json'

export async function saveMessages(socket: any, message: any) {
  const { key, messageTimestamp, pushName, message: msgContent } = message
  const myNumber = await socket.user?.id
  let from = key.fromMe ? myNumber : key.remoteJid
  let to = key.fromMe ? key.remoteJid : myNumber

  //savegroup & saveContact
  const isFromGroup = from.endsWith("@g.us");
  const isToGroup = to.endsWith("@g.us");

  const fromType = isFromGroup ? MessageType.GROUP : MessageType.CONTACT
  const toType = isToGroup ? MessageType.GROUP : MessageType.CONTACT

  if (isFromGroup) {
    const metadata = await groupMetadata(from)
    from = await saveGroup(from, metadata)
  } else {
    from = await saveContact(from, pushName)
  }

  if (isToGroup) {
    const metadata = await groupMetadata(to)
    console.log(metadata)
    to = await saveGroup(to, metadata)
  } else {
    to = await saveContact(to, pushName)
  }

  const timeStamp = new Date(messageTimestamp * 1000).toISOString();
  const timeStampLuxon = DateTime.fromMillis(Number(messageTimestamp));
  const dateTimeNow = DateTime.now().toISO();
  const newTimeStampLuxon = DateTime.fromSeconds(messageTimestamp).toISO();

  const text = msgContent?.conversation
    || msgContent?.extendedTextMessage?.text
    || msgContent?.videoMessage?.caption
    || msgContent?.documentMessage?.caption
    || ''

  const messageType = msgContent ? Object.keys(msgContent)[0] : 'unknown'

  let data = {
    key, from, to, pushName: key.fromMe ? 'Saya (Owner)' : (pushName || 'Unknown'),
    messageId: key.id ?? '', messageType, content: msgContent, timestamp: messageTimestamp, timeStamp, timeStampLuxon, dateTimeNow, newTimeStampLuxon,
    text, isHasilLab: false
  }

  const existingMessage = await Message.findBy('message_id', key.id)

  if (!existingMessage) {
    try {
      await Message.create({
        from,
        fromType,
        to,
        toType,
        messageId: key.id ?? '',
        messageType, content: text,
        timestamp: DateTime.fromSeconds(Number(messageTimestamp)),
      })
      console.log(`Message saved: ${key.id}`)
    } catch (error) {
      console.error('Error saving message:', error)
    }
  }

  await saveFile(MESSAGES_FILE, data, 'messages')
}
