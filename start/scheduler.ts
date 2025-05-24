import cron from 'node-cron'
import ObatPasien from '#models/obat_pasien'
import Kunjungan from '#models/kunjungan'
import { sendMsg } from '#services/whatsapp_service'
import dayjs from 'dayjs'
import('dayjs/locale/id.js').then(() => {
    dayjs.locale('id')
})

function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

// Fungsi untuk pilih pesan acak dari array template
function getRandomMessage(templates: string[]) {
    const index = Math.floor(Math.random() * templates.length);
    return templates[index];
}

cron.schedule('0 * * * *', async () => {
    console.log('Cron job started')
    try {
        const obatPasiens = await ObatPasien
            .query()
            .preload('pasien', (pasienQuery) => {
                pasienQuery.preload('contact') // preload relasi 'contact' dari pasien
            })
            .preload('obat')
        const kunjungans = await Kunjungan.query().preload('pasien')
        const now = getCurrentTime()
        const tomorrowDate = getTomorrowDate();
        const dateNow = getCurrentDate();

        console.log(now, tomorrowDate)

        for (const kunjungan of kunjungans) {
            // Lewati jika tidak ada tanggal kunjungan berikutnya
            if (!kunjungan.kunjunganBerikutnya) continue;

            // Pastikan bentuknya bisa di-parse oleh dayjs
            const kunjunganDate = dayjs(kunjungan.kunjunganBerikutnya.toString()).format('YYYY-MM-DD');

            if (kunjunganDate === tomorrowDate) {
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

        const hariIni = getHariIni()
        console.log(hariIni)

        for (const obat of obatPasiens) {
            console.log('Obat Pasien', obat.id, 'ditemukan')
            console.log(obat.waktuKonsumsi)
            console.log(obat.hariKonsumsi)

            if (!Array.isArray(obat.waktuKonsumsi) || !Array.isArray(obat.hariKonsumsi)) continue
            console.log(1)
            if (!obat.hariKonsumsi.includes(hariIni)) {
                console.log(`Obat Pasien ${obat.id} tidak dijadwalkan untuk hari ${hariIni}`)
                continue
            }
            console.log(3)
            console.log(obat.status)
            if (obat.status !== 1) continue
            console.log(2)

            // Template pesan variasi supaya tidak monoton
            const pesanTemplates = [
                `${obat.pasien.jenis_kelamin === 'Laki-laki' ? 'Pak' : 'Bu'} ${obat.pasien.name}, saatnya minum obat: ${obat.obat.nama}. Ingat, ${obat.keteranganWaktu}.`,
                `Halo ${obat.pasien.jenis_kelamin === 'Laki-laki' ? 'Pak' : 'Bu'} ${obat.pasien.name}, waktunya konsumsi obat ${obat.obat.nama}. ${obat.keteranganWaktu} ya.`,
                `${obat.pasien.jenis_kelamin === 'Laki-laki' ? 'Pak' : 'Bu'} ${obat.pasien.name}, jangan lupa minum obat ${obat.obat.nama} sesuai jadwal. Catatan: ${obat.keteranganWaktu}.`,
                `Minum obat ${obat.obat.nama} sekarang, ${obat.pasien.jenis_kelamin === 'Laki-laki' ? 'Pak' : 'Bu'} ${obat.pasien.name}. ${obat.keteranganWaktu}. Semangat!`
            ];

            for (const waktu of obat.waktuKonsumsi) {
                console.log('looping waktu')
                if (waktu === now) {
                    try {
                        const pesan = getRandomMessage(pesanTemplates);
                        const response = await sendMsg(
                            obat.pasien.contact.waId,
                            pesan, true
                        );
                        console.log(`scheduler kirim pesan ke ${obat.pasien.no_hp}:`, response);
                        await delay(3000)
                    } catch (error) {
                        console.error(`Gagal kirim ke ${obat.pasien.no_hp}:`, error);
                    }
                }
            }

            if (dayjs(obat.batasWaktu).format('YYYY-MM-DD') === dateNow) {
                await obat.merge({ status: false }).save()
            }
        }

    } catch (error) {
        console.error('Error fetching ObatPasien data:', error)
    }
})

function getCurrentTime() {
    const now = new Date()
    let hours = now.getHours()
    let hoursStr = hours < 10 ? `0${hours}` : `${hours}`
    return `${hoursStr}:${String(now.getMinutes()).padStart(2, '0')}`
}

function getTomorrowDate() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    // Format YYYY-MM-DD
    return tomorrow.toISOString().split('T')[0];
}

function getCurrentDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

function getHariIni(): string {
    const hari = dayjs().locale('id').format('dddd') // Pastikan sudah pakai locale 'id'
    return capitalizeFirstLetter(hari) // Misal: "Senin"
}

function capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1)
}
