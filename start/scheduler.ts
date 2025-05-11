import cron from 'node-cron'
import ObatPasien from '#models/obat_pasien'
import Kunjungan from '#models/kunjungan'
import { sendMsg } from '#services/whatsapp_service'
import dayjs from 'dayjs'

function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

cron.schedule('* * * * *', async () => {
    console.log('Cron job started')
    try {
        const obatPasiens = await ObatPasien.query().preload('pasien').preload('obat')
        const kunjungans = await Kunjungan.query().preload('pasien')
        const now = getCurrentTime()
        const dateNow = getTomorrowDate();

        console.log(now, dateNow)

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
                    console.log(`Kirim pesan kunjungan ${kunjungan.pasien.no_hp}:`, response);
                    await delay(300)
                } catch (error) {
                    console.error(`Failed to send message to ${kunjungan.pasien.no_hp}:`, error);
                }
            }
        }


        for (const obat of obatPasiens) {
            if (!Array.isArray(obat.waktuKonsumsi)) continue

            if (obat.status == true) {
                for (const waktu of obat.waktuKonsumsi) {
                    const jk = obat.pasien.jenis_kelamin
                    const panggilan = jk == 'Laki-laki' ? 'Pak' : 'Bu'
                    if (waktu === now) {
                        try {
                            const response = await sendMsg(obat.pasien.no_hp, `${panggilan} ${obat.pasien.name} saatnya minum obat : ${obat.obat.nama}. Minum obat ini ${obat.keteranganWaktu}.`)
                            console.log(`scheduler kirim pesan ke ${obat.pasien.no_hp}:`, response)

                            await delay(3000)
                        } catch (error) {
                            console.error(`Failed to send message to ${obat.pasien.no_hp}:`, error)
                        }
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

