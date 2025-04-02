import Contact from '#models/contact'
import { saveFile } from '#services/json_service'
import { getProfilePicture, isRegisteredWhatsapp } from '#services/whatsapp_service'

const CONTACTS_FILE = './contacts.json'

export async function saveContact(jid: string, name: string | null) {
  const number = jid.split('@')[0]
  const existingContact = await Contact.findBy('wa_id', jid)

  if (existingContact) {
    console.log('Contact already exists')
    return existingContact.id
  }

  const isRegistered = await isRegisteredWhatsapp(number)
  let profilePicture = null

  if (isRegistered) {
    try {
      profilePicture = await getProfilePicture(jid)
    } catch (error) {
      console.log('Gagal ambil foto profil:', error)
      profilePicture = 'images/users/user.png'
    }

    const contact = await Contact.create({
      waId: jid,
      username: name || 'Unknown',
      name: name || '',
      profilePicture: profilePicture
    })

    const newContact = { number, username: name || 'Unknown' }
    saveFile(CONTACTS_FILE, newContact, 'contacts')

    return contact?.id
  }
}
