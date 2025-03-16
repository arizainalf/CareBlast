import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'
import Pasien from '#models/pasien'
import JenisPenyakit from '#models/jenis_penyakit'
import { v4 as uuid } from 'uuid'
import { DateTime } from 'luxon'
import Obat from '#models/obat'

export default class extends BaseSeeder {
  private generateNIK(): string {
    // Format: PPRRSSDDMMYYXXXX
    // PP: Province code (2 digits)
    // RR: Regency code (2 digits)
    // SS: Sub-district code (2 digits)
    // DD: Date of birth (2 digits)
    // MM: Month of birth (2 digits)
    // YY: Year of birth (2 digits)
    // XXXX: Random number (4 digits)

    const provinceCode = Math.floor(Math.random() * 99)
      .toString()
      .padStart(2, '0')
    const regencyCode = Math.floor(Math.random() * 99)
      .toString()
      .padStart(2, '0')
    const subDistrictCode = Math.floor(Math.random() * 99)
      .toString()
      .padStart(2, '0')
    const date = Math.floor(Math.random() * 28 + 1)
      .toString()
      .padStart(2, '0')
    const month = Math.floor(Math.random() * 12 + 1)
      .toString()
      .padStart(2, '0')
    const year = Math.floor(Math.random() * 99)
      .toString()
      .padStart(2, '0')
    const randomNum = Math.floor(Math.random() * 9999)
      .toString()
      .padStart(4, '0')

    return `${provinceCode}${regencyCode}${subDistrictCode}${date}${month}${year}${randomNum}`
  }

  public async run() {
    // Seed Users
    await User.createMany([
      {
        fullName: 'Super Admin',
        email: 'superadmin@gmail.com',
        password: '11221122',
        role: 'super_admin',
        phoneNumber: '081930865458',
      },
      {
        fullName: 'Admin',
        email: 'user@gmail.com',
        password: '11221122',
        role: 'admin',
        phoneNumber: '081930865458',
      },
    ])

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

    const jenisPenyakits = await JenisPenyakit.createMany(
      jenisPenyakitData.map((data) => ({
        uuid: uuid(),
        nama: data.nama,
        deskripsi: data.deskripsi,
      }))
    )

    // Data kota untuk tempat lahir
    const cities = [
      'Jakarta',
      'Surabaya',
      'Bandung',
      'Medan',
      'Semarang',
      'Makassar',
      'Palembang',
      'Tangerang',
      'Depok',
      'Bekasi',
      'Malang',
      'Yogyakarta',
    ]

    // Generate 50 pasien records
    const pasienData = Array.from({ length: 50 }, (_, index) => {
      const birthYear = 1960 + Math.floor(Math.random() * 50) // Random year between 1960-2010
      const birthMonth = 1 + Math.floor(Math.random() * 12)
      const birthDay = 1 + Math.floor(Math.random() * 28)
      const birthDate = DateTime.local(birthYear, birthMonth, birthDay)

      const firstName =
        index % 2 === 0
          ? ['Budi', 'Siti', 'Ahmad', 'Dewi', 'Eko', 'Putri', 'Rizki', 'Andi'][
              Math.floor(Math.random() * 8)
            ]
          : ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Lisa', 'Kevin', 'Emma'][
              Math.floor(Math.random() * 8)
            ]

      const lastName =
        index % 2 === 0
          ? ['Santoso', 'Wijaya', 'Hidayat', 'Kusuma', 'Pratama', 'Sari', 'Putra', 'Dewi'][
              Math.floor(Math.random() * 8)
            ]
          : ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'][
              Math.floor(Math.random() * 8)
            ]

      const golonganDarah = ['A+', 'B+', 'AB+', 'O+', 'A-', 'B-', 'AB-', 'O-'][
        Math.floor(Math.random() * 8)
      ]

      return {
        name: `${firstName} ${lastName}`,
        tempat: cities[Math.floor(Math.random() * cities.length)],
        tanggal_lahir: birthDate,
        no_hp: `08${Math.floor(Math.random() * 1000000000)
          .toString()
          .padStart(9, '0')}`,
        alamat: `Jl. ${['Sudirman', 'Thamrin', 'Gatot Subroto', 'Diponegoro', 'Ahmad Yani'][Math.floor(Math.random() * 5)]} No. ${Math.floor(Math.random() * 100) + 1}`,
        jenisPenyakitId: jenisPenyakits[Math.floor(Math.random() * jenisPenyakits.length)].id,
        uuid: uuid(),
        jenis_kelamin: Math.random() > 0.5 ? 'Laki-laki' : 'Perempuan',
        nik: this.generateNIK(),
        golongan_darah: golonganDarah,
      }
    })

    await Pasien.createMany(pasienData)
  }
}
