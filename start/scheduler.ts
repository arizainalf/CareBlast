import cron from 'node-cron'
import ObatPasien from '#models/obat_pasien'
import Kunjungan from '#models/kunjungan'
import { sendMsg } from '#services/whatsapp_service'
import dayjs from 'dayjs'

cron.schedule('0 * * * *', async () => {
    console.log('Cron job started')
    try {
        const obatPasiens = await ObatPasien.query().preload('pasien').preload('obat')
        const kunjungans = await Kunjungan.query().preload('pasien')
        const now = getCurrentTime()
        const dateNow = getTomorrowDate();

        for (const kunjungan of kunjungans) {
            // Lewati jika tidak ada tanggal kunjungan berikutnya
            if (!kunjungan.kunjunganBerikutnya) continue;

            // Pastikan bentuknya bisa di-parse oleh dayjs
            const kunjunganDate = dayjs(kunjungan.kunjunganBerikutnya.toString()).format('YYYY-MM-DD');

            if (kunjunganDate === dateNow) {
                try {
                    const response = await sendMsg(
                        kunjungan.pasien.no_hp,
                        `Selamat pagi ${kunjungan.pasien.name}, besok adalah jadwal kunjungan anda`
                    );
                    console.log(`Message sent to ${kunjungan.pasien.no_hp}:`, response);
                } catch (error) {
                    console.error(`Failed to send message to ${kunjungan.pasien.no_hp}:`, error);
                }
            }
        }


        for (const obat of obatPasiens) {
            if (!Array.isArray(obat.waktuKonsumsi)) continue

            for (const waktu of obat.waktuKonsumsi) {
                const jk = obat.pasien.jenis_kelamin
                const panggilan = jk == 'Laki-laki' ? 'Pak' : 'Bu'
                if (waktu === now) {
                    try {
                        const response = await sendMsg(obat.pasien.no_hp, `${panggilan} ${obat.pasien.name} saatnya minum obat : ${obat.obat.nama}`)
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

function getTomorrowDate() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Format YYYY-MM-DD
    return tomorrow.toISOString().split('T')[0];
}

