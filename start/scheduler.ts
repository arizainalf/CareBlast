import cron from 'node-cron'
import ObatPasien from '#models/obat_pasien'
import { sendMsg } from '#services/whatsapp_service'

cron.schedule('*/1 * * * *', async () => {
    console.log('Cron job started')

    try {
        const obatPasiens = await ObatPasien.query().preload('pasien').preload('obat')
        const now = getCurrentTime()

        for (const obat of obatPasiens) {
            if (!Array.isArray(obat.waktuKonsumsi)) continue

            for (const waktu of obat.waktuKonsumsi) {
                if (waktu === now) {
                    try {
                        const response = await sendMsg(obat.pasien.no_hp, `It's time to take your medicine: ${obat.obat.nama}`)
                        console.log(`Message sent to ${obat.pasien.no_hp}:`, response)
                    } catch (error) {
                        console.error(`Failed to send message to ${obat.pasien.no_hp}:`, error)
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error fetching ObatPasien data:', error)
    }
})

function getCurrentTime() {
    const now = new Date()
    return `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`
}
