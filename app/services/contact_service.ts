import Contact from '#models/contact'
import { saveFile } from '#services/json_service'
import { getProfilePicture, isRegisteredWhatsapp } from '#services/whatsapp_service'
import { formatWhatsappNumber, NumberHelper } from '#services/number_service'

const CONTACTS_FILE = './contacts.json'

export async function saveContact(jid: string, name: string | null) {
  const number = jid.split('@')[0].split(':')[0]
  const cleanWaId = `${NumberHelper(number)}@s.whatsapp.net`
  const existingContact = await Contact.findBy('wa_id', cleanWaId)

  if (existingContact) {
    console.log('contact service : Contact sudah ada')
    return existingContact.id
  }

  const isRegistered = await isRegisteredWhatsapp(number)
  let profilePicture = null

  if (isRegistered) {
    try {
      profilePicture = await getProfilePicture(jid)
    } catch (error) {
      console.log('contact service : Gagal ambil foto profil:', error)
      profilePicture = 'images/users/user.png'
    }

    const contact = await Contact.create({
      waId: cleanWaId,
      username: name || 'Unknown',
      name: name || '',
      profilePicture: profilePicture
    })

    const newContact = { number, username: name || 'Unknown' }
    saveFile(CONTACTS_FILE, newContact, 'contacts')
    console.log('contact service : Contact saved successfully')
    return contact?.id
  } else {
    console.log('contact service : Nomor tidak terdaftar di WhatsApp')
    return null
  }
}

export async function checkContact(waId: any) {
  const number = waId.split('@')[0].split(':')[0]
  const cleanWaId = formatWhatsappNumber(number)
  const contact = await Contact.findBy('wa_id', cleanWaId)
  if (!contact) {
    console.log('contact service : No contacts found')
    return false
  } else {
    console.log('contact service : Contacts found')
    return true
  }

}
