import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'
import JenisPenyakit from '#models/jenis_penyakit'
import Obat from '#models/obat'
import Spesialist from '#models/spesialist'
import Dokter from '#models/dokter'
import { v4 as uuid } from 'uuid'
import Pasien from '#models/pasien'
import { DateTime } from 'luxon'
import Contact from '#models/contact'

export default class extends BaseSeeder {

  public async run() {
    // Seed Users
    const users = await User.createMany([
      {
        fullName: 'Super Admin',
        email: 'superadmin@gmail.com',
        password: '11221122',
        role: 'super_admin',
      },
      {
        fullName: 'Admin',
        email: 'admin@gmail.com',
        password: '11221122',
        role: 'admin',
      },
    ])

    await Contact.createMany([
      {
        userId: users[0].uuid,
        name: 'Super Admin',
        username: 'superadmin',
        waId: '6285959638322@s.whatsapp.net',
      },
      {
        userId: users[1].uuid,
        name: 'Admin',
        username: 'admin',
        waId: '6281904002654@s.whatsapp.net',
      },
    ])

    // Seed Spesialist
    const spesialistData = [
      { nama: 'Kardiologi', gelar: 'Sp.JP' },
      { nama: 'Endokrinologi', gelar: 'Sp.PD-KEMD' },
      { nama: 'Pulmonologi', gelar: 'Sp.P' },
      { nama: 'Psikiatri', gelar: 'Sp.KJ' },
      { nama: 'Umum', gelar: 'Sp.UMU' },
    ]

    const spesialists = await Spesialist.createMany(spesialistData)

    // Seed Dokter
    const dokterData = [
      {
        nip: 'DOK001',
        nama: 'Andi Wijaya',
        noWhatsapp: '087818179639',
        spesialistId: spesialists[0].id,
        jamMulai: '08:00',
        jamSelesai: '14:00',
        jadwalHari: '["Senin","Rabu","Jumat"]',
        status: true,
      },
      {
        nip: 'DOK002',
        nama: 'Siti Rahma',

        noWhatsapp: '087818179639',

        spesialistId: spesialists[1].id,
        jamMulai: '09:00',
        jamSelesai: '15:00',
        jadwalHari: '["Senin","Rabu","Jumat"]',
        status: true,
      },
      {
        nip: 'DOK003',
        nama: 'Budi Santoso',
        noWhatsapp: '087818179639',
        spesialistId: spesialists[2].id,
        jamMulai: '10:00',
        jamSelesai: '16:00',
        jadwalHari: '["Senin","Rabu","Jumat"]',
        status: true,
      },
      {
        nip: 'DOK004',
        nama: 'Dewi Anggraini',
        noWhatsapp: '087818179639',
        spesialistId: spesialists[3].id,
        jamMulai: '13:00',
        jamSelesai: '19:00',
        jadwalHari: '["Senin","Rabu","Jumat"]',
        status: true,
      },
      {
        nip: 'DOK005',
        nama: 'Rudi Hartono',
        noWhatsapp: '087818179639',
        spesialistId: spesialists[4].id,
        jamMulai: '08:00',
        jamSelesai: '16:00',
        jadwalHari: '["Senin","Rabu","Jumat"]',
        status: true,
      },
    ]

    await Dokter.createMany(dokterData)

    // Seed Obat
    const obatData = [
      { nama: 'Amlodipine', dosis: 5 },
      { nama: 'Captopril', dosis: 25 },
      { nama: 'Metformin', dosis: 500 },
      { nama: 'Gliclazide', dosis: 30 },
      { nama: 'Isoniazid (INH)', dosis: 300 },
      { nama: 'Rifampicin', dosis: 450 },
      { nama: 'Fluoxetine', dosis: 20 },
      { nama: 'Risperidone', dosis: 2 },
      { nama: 'Paracetamol', dosis: 500 },
      { nama: 'Amoxicillin', dosis: 500 },
    ]

    await Obat.createMany(
      obatData.map((data) => ({
        uuid: uuid(),
        nama: data.nama,
        dosis: data.dosis,
      }))
    )

    // Seed Jenis Penyakit
    const jenisPenyakitData = [
      {
        nama: 'Hipertensi 1',
        deskripsi:
          'Tekanan darah sistolik antara 130-139 mmHg atau tekanan darah diastolik antara 80-89 mmHg. Pada tahap ini, perubahan gaya hidup sangat penting untuk mencegah perkembangan lebih lanjut.',
      },
      {
        nama: 'Hipertensi 2',
        deskripsi:
          'Tekanan darah sistolik 140 mmHg atau lebih tinggi, atau tekanan darah diastolik 90 mmHg atau lebih tinggi. Pada tahap ini, pengobatan dengan obat-obatan biasanya diperlukan selain perubahan gaya hidup.',
      },
      {
        nama: 'Diabetes',
        deskripsi:
          'penyakit kronis yang memengaruhi kemampuan tubuh untuk memproses gula darah (glukosa). Glukosa adalah sumber energi utama bagi tubuh, tetapi kadar glukosa yang berlebihan dalam darah dapat menyebabkan masalah kesehatan yang serius.',
      },
      {
        nama: 'Tuberkulosis Paru',
        deskripsi:
          'Penyakit menular yang disebabkan oleh bakteri Mycobacterium tuberculosis. TB biasanya menyerang paru-paru, tetapi juga dapat memengaruhi organ lain.',
      },
      {
        nama: 'Jiwa',
        deskripsi:
          'kondisi kesehatan yang memengaruhi pikiran, perasaan, suasana hati, dan perilaku seseorang. Gangguan jiwa dapat memengaruhi kemampuan seseorang untuk berfungsi dalam kehidupan sehari-hari.',
      },
    ]

    await JenisPenyakit.createMany(
      jenisPenyakitData.map((data) => ({
        uuid: uuid(),
        nama: data.nama,
        deskripsi: data.deskripsi,
      }))
    )

    const pasien = await Pasien.create(
      {
        uuid: uuid(),
        name: 'Jodi Maulana',
        nik: '123445667890',
        jenisPenyakitId: 1,
        tempat: 'Tasikmalaya',
        tanggal_lahir: DateTime.fromISO('1990-01-01'),
        alamat: 'Jl. Raya No. 123, Tasikmalaya',
        golongan_darah: 'A+',
        jenis_kelamin: 'Laki-laki',

      }
    )

    await Contact.create({
      pasienId: pasien.uuid,
      name: 'Jodi Maulana',
      username: 'jodimaulana',
      waId: '6281930865458@s.whatsapp.net',
    })
  }
}
