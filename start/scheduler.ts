import cron from 'node-cron'
import ObatPasien from '#models/obat_pasien'
import Kunjungan from '#models/kunjungan'
import { sendMsg } from '#services/whatsapp_service'
import dayjs from 'dayjs'
import('dayjs/locale/id.js').then(() => {
    dayjs.locale('id')
})


function delay(minMs: number = 4000, maxMs: number = 10000): Promise<void> {
    const randomMs = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    return new Promise((resolve) => setTimeout(resolve, randomMs));
}

// Fungsi untuk pilih pesan acak dari array template
function getRandomMessage(templates: string[]) {
    const index = Math.floor(Math.random() * templates.length);
    return templates[index];
}

cron.schedule('* * * * *', async () => {
  console.log('Scheduler running every minute', Date.now());
    try {
        const obatPasiens = await ObatPasien
            .query()
            .preload('pasien', (pasienQuery) => {
                pasienQuery.preload('contact') // preload relasi 'contact' dari pasien
            })
            .preload('obat')
        const kunjungans = await Kunjungan.query() .preload('pasien', (pasienQuery) => {
                pasienQuery.preload('contact') // preload relasi 'contact' dari pasien
            })
        const now = getCurrentTime()
        const tomorrowDate = getTomorrowDate();
        const dateNow = getCurrentDate();


        const pesanTemplateKunjungan = [
            (sapaan: any, nama: any) => `Selamat pagi ${sapaan} ${nama}, ini pengingat bahwa besok adalah jadwal kunjungan Anda. Jangan lupa hadir tepat waktu ya.`,
            (sapaan: any, nama: any) => `Hai ${sapaan} ${nama}, besok adalah jadwal kunjungan Anda. Mohon pastikan untuk datang sesuai waktu yang telah ditentukan.`,
            (sapaan: any, nama: any) => `Yth. ${sapaan} ${nama}, kami mengingatkan bahwa besok adalah hari kunjungan Anda. Jangan lupa membawa dokumen/obat yang diperlukan.`,
            (sapaan: any, nama: any) => `Besok adalah jadwal kunjungan medis Anda, ${sapaan} ${nama}. Semoga dalam keadaan sehat, sampai jumpa di klinik.`,
            (sapaan: any, nama: any) => `Halo ${sapaan} ${nama}, jadwal kunjungan Anda akan dilaksanakan besok. Kami siap menyambut kedatangan Anda.`,
            (sapaan: any, nama: any) => `📅 Reminder untuk ${sapaan} ${nama}: Besok adalah jadwal kunjungan Anda. Pastikan tidak terlewat ya.`,
            (sapaan: any, nama: any) => `🔔 Pengingat: ${sapaan} ${nama}, Anda memiliki jadwal kunjungan besok. Mohon datang sesuai waktu yang ditentukan.`,
            (sapaan: any, nama: any) => `${sapaan} ${nama}, kunjungan Anda dijadwalkan besok. Silakan konfirmasi kehadiran jika ada perubahan.`,
            (sapaan: any, nama: any) => `Salam sehat, ${sapaan} ${nama}. Besok Anda dijadwalkan untuk kunjungan ke fasilitas kesehatan. Mohon persiapkan diri dengan baik.`,
            (sapaan: any, nama: any) => `🕘 Hai ${sapaan} ${nama}, kami ingin mengingatkan bahwa besok Anda memiliki jadwal kunjungan. Jangan sampai lupa!`
        ];

        for (const kunjungan of kunjungans) {
            // Lewati jika tidak ada tanggal kunjungan berikutnya
            if (!kunjungan.kunjunganBerikutnya) continue;

            // Parse tanggal kunjungan berikutnya
            const kunjunganDate = dayjs(kunjungan.kunjunganBerikutnya.toString()).format('YYYY-MM-DD');

            if (kunjunganDate === tomorrowDate && !kunjungan.isReminder) {
                const sapaan = kunjungan.pasien.jenis_kelamin === 'Laki-laki' ? 'Pak' : 'Bu';
                const nama = kunjungan.pasien.name;
                console.log('kunjungan', kunjungan);
                console.log('pasien', kunjungan.pasien);
                console.log('contact', kunjungan.pasien.contact);
                const noHp = kunjungan.pasien.contact.waId;


                // Ambil template acak dan isi dengan sapaan + nama
                const pesanFn = pesanTemplateKunjungan[Math.floor(Math.random() * pesanTemplateKunjungan.length)];
                const pesan = pesanFn(sapaan, nama);

                try {
                    await sendMsg(noHp, pesan);
                    kunjungan.merge({ isReminder: true }).save(); // Simpan perubahan status
                    await delay(); // delay agar tidak dianggap spam
                } catch (error) {
                    console.error(`Gagal kirim pesan ke ${noHp}:`, error);
                }
            }
        }

        const hariIni = getHariIni()

        for (const obat of obatPasiens) {

            if (!Array.isArray(obat.waktuKonsumsi) || !Array.isArray(obat.hariKonsumsi)) continue
            if (!obat.hariKonsumsi.includes(hariIni)) {
                continue
            }
            if (obat.status !== 1) continue

            // Template pesan variasi supaya tidak monoton
            const pesanTemplates = [
                ` ${obat.pasien.name}, saatnya minum  *${obat.obat.nama}*. Jangan lupa ya, ${obat.keteranganWaktu}.`,
                `Halo  ${obat.pasien.name}, waktunya konsumsi  *${obat.obat.nama}*. ${obat.keteranganWaktu}, jangan lewatkan.`,
                ` ${obat.pasien.name}, jangan lupa minum  *${obat.obat.nama}* sesuai jadwal. Catatan: ${obat.keteranganWaktu}.`,
                `Sekarang waktunya minum  *${obat.obat.nama}*,  ${obat.pasien.name}. ${obat.keteranganWaktu}. Tetap semangat dan jaga kesehatan!`,
                `Yth. ${obat.pasien.jenis_kelamin === 'Laki-laki' ? 'Bapak' : 'Ibu'} ${obat.pasien.name}, mohon untuk segera minum  *${obat.obat.nama}*. Jadwal: ${obat.keteranganWaktu}.`,
                `Pengingat:  *${obat.obat.nama}* perlu dikonsumsi sekarang,  ${obat.pasien.name}. ${obat.keteranganWaktu}.`,
                `Salam sehat,  ${obat.pasien.name}. Saatnya konsumsi *${obat.obat.nama}*. ${obat.keteranganWaktu}, ya.`,
                `Jadwal minum  *${obat.obat.nama}* sudah tiba,  ${obat.pasien.name}. Jangan ditunda, ${obat.keteranganWaktu}.`,
                `Ingat ya,  ${obat.pasien.name}, sekarang waktunya minum *${obat.obat.nama}*. ${obat.keteranganWaktu}.`,
                `Waktunya minum *${obat.obat.nama}*,  ${obat.pasien.name}. Tetap teratur agar cepat pulih!`,
                `Obat *${obat.obat.nama}* harus diminum sekarang ya,  ${obat.pasien.name}. Jangan sampai lupa! (${obat.keteranganWaktu})`,
                `Semoga sehat selalu,  ${obat.pasien.name}. Saat ini jadwalnya minum  *${obat.obat.nama}*. ${obat.keteranganWaktu}.`,
                `⏰ Pengingat waktu minum : *${obat.obat.nama}* untuk  ${obat.pasien.name}. Waktunya: ${obat.keteranganWaktu}.`,
                `✉️ Halo  ${obat.pasien.name}, ini pengingat untuk minum *${obat.obat.nama}*. Jangan lupa, ${obat.keteranganWaktu}.`,
                `Mohon perhatian, saatnya minum  *${obat.obat.nama}*. ${obat.keteranganWaktu} ya,  ${obat.pasien.name}.`,
                `Waktu menunjukkan saatnya untuk minum *${obat.obat.nama}*,  ${obat.pasien.name}. Tetap disiplin konsumsi ya.`,
                `Hai  ${obat.pasien.name}, jangan sampai terlewat minum  *${obat.obat.nama}*. Jadwal: ${obat.keteranganWaktu}.`
            ];

            for (const waktu of obat.waktuKonsumsi) {
              console.log(`Waktu konsumsi obat: ${waktu}`);
              console.log(`Waktu sekarang: ${now}`);
                if (waktu === now) {
                    try {
                        const pesan = getRandomMessage(pesanTemplates);
                        await sendMsg(
                            obat.pasien.contact.waId,
                            pesan, true
                        );
                        await delay()
                        console.log(`Pesan terkirim ke ${obat.pasien.no_hp}: ${pesan}`);
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
