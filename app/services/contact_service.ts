import Contact from '#models/contact'
import { saveFile } from '#services/json_service'
import { getProfilePicture, isRegisteredWhatsapp } from '#services/whatsapp_service'

const CONTACTS_FILE = './contacts.json'

export async function saveContact(jid: string, name: string | null) {
  const number = jid.split('@')[0]
  const existingContact = await Contact.findBy('wa_id', jid)

  if (existingContact) return existingContact?.id

  const isRegistered = await isRegisteredWhatsapp(number)
  let profilePicture = null

  if (isRegistered) {
    try {
      profilePicture = await getProfilePicture(jid)
    } catch (error) {
      console.log('Gagal ambil foto profil:', error)
    }

    const contact = await Contact.create({
      waId: jid,
      username: name || 'Unknown',
      name: name || '',
      profilePicture: profilePicture || null
    })

    const newContact = { number, username: name || 'Unknown' }
    saveFile(CONTACTS_FILE, newContact, 'contacts')

    return contact?.id
  }
}
